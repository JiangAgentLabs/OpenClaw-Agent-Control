import json
import os
import subprocess
import threading
import time
from collections import deque
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import request as urlrequest

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.responses import StreamingResponse

app = FastAPI(title="OpenClaw Agent Control")

OPENCLAW_HOME = Path(os.getenv("OPENCLAW_HOME", "/root/.openclaw"))
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "15"))
DASHBOARD_REFRESH_SECONDS = int(os.getenv("DASHBOARD_REFRESH_SECONDS", "5"))
TASK_STALL_SECONDS = int(os.getenv("TASK_STALL_SECONDS", "60"))
OFFICIAL_STATUS_ENABLED = os.getenv("OFFICIAL_STATUS_ENABLED", "1").lower() not in {"0", "false", "no"}
OFFICIAL_STATUS_TIMEOUT_SECONDS = int(os.getenv("OFFICIAL_STATUS_TIMEOUT_SECONDS", "3"))
OFFICIAL_CACHE_TTL_SECONDS = int(os.getenv("OFFICIAL_CACHE_TTL_SECONDS", "60"))

_cache_lock = threading.Lock()
_cache_cond = threading.Condition(_cache_lock)
_cache: dict[str, Any] = {
    "fetched_at": 0.0,
    "data": None,
    "building": False,
    "seq": 0,
}
_official_cache_lock = threading.Lock()
_official_cache: dict[str, Any] = {
    "fetched_at": 0.0,
    "data": None,
}
EVENTS_MAX_ITEMS = int(os.getenv("MONITOR_EVENTS_MAX_ITEMS", "500"))
EVENTS_STREAM_INTERVAL_SECONDS = int(os.getenv("MONITOR_STREAM_INTERVAL_SECONDS", "3"))
_events_lock = threading.Lock()
_events: deque[dict[str, Any]] = deque(maxlen=max(100, EVENTS_MAX_ITEMS))
_last_agent_event_sig: dict[str, str] = {}
_last_subagent_event_sig: dict[str, str] = {}
_stream_refresh_lock = threading.Lock()

TASK_STATUSES = {
    "in-progress": "in_progress",
    "backlog": "backlog",
    "assignments": "assignments",
    "testing": "testing",
    "done": "done",
}


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _to_iso(ts_ms: int | float | None) -> str | None:
    if not ts_ms:
        return None
    try:
        dt = datetime.fromtimestamp(float(ts_ms) / 1000.0, tz=timezone.utc)
        return dt.isoformat()
    except Exception:
        return None


def _to_iso_seconds(ts_s: int | float | None) -> str | None:
    if not ts_s:
        return None
    try:
        dt = datetime.fromtimestamp(float(ts_s), tz=timezone.utc)
        return dt.isoformat()
    except Exception:
        return None


def _count_files(path: Path) -> int:
    if not path.exists() or not path.is_dir():
        return 0
    return sum(1 for p in path.iterdir() if p.is_file())


def _load_sessions_json(path: Path) -> dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {}


def _parse_json_from_mixed_text(raw: str) -> dict[str, Any] | None:
    text = (raw or "").strip()
    if not text:
        return None
    start = text.rfind("\n{")
    if start >= 0:
        text = text[start + 1 :]
    else:
        start = text.find("{")
        if start >= 0:
            text = text[start:]
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        return None
    return None


def _run_openclaw_json(args: list[str], timeout_s: int) -> tuple[dict[str, Any] | None, str | None]:
    try:
        proc = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout_s,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return None, f"timeout ({timeout_s}s)"
    except Exception as exc:
        return None, str(exc)

    combined = (proc.stdout or "") + ("\n" + proc.stderr if proc.stderr else "")
    parsed = _parse_json_from_mixed_text(combined)
    if parsed is None:
        if proc.returncode != 0:
            return None, f"exit {proc.returncode}"
        return None, "json parse failed"
    return parsed, None


def _gateway_api_probe(port: int, token: str | None, timeout_s: int) -> dict[str, Any]:
    url = f"http://127.0.0.1:{port}/tools/invoke"
    payload = b"{}"
    req = urlrequest.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")

    started = time.time()
    try:
        with urlrequest.urlopen(req, timeout=timeout_s) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            latency = int((time.time() - started) * 1000)
            return {
                "ok": True,
                "status_code": resp.status,
                "latency_ms": latency,
                "message": body[:300],
            }
    except urlerror.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        latency = int((time.time() - started) * 1000)
        # 400 with "requires body.tool" still proves API reachable/auth path works.
        ok = exc.code in {400, 401, 403}
        return {
            "ok": ok,
            "status_code": exc.code,
            "latency_ms": latency,
            "message": body[:300],
        }
    except Exception as exc:
        latency = int((time.time() - started) * 1000)
        return {
            "ok": False,
            "status_code": None,
            "latency_ms": latency,
            "message": str(exc),
        }


def _collect_official_status(base: Path) -> dict[str, Any]:
    if not OFFICIAL_STATUS_ENABLED:
        return {"enabled": False}

    cfg_path = base / "openclaw.json"
    gateway_port = 18789
    gateway_token = os.getenv("OPENCLAW_GATEWAY_TOKEN", "")
    if cfg_path.exists():
        try:
            cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
            gateway = cfg.get("gateway") or {}
            gateway_port = _safe_int(gateway.get("port"), 18789)
            if not gateway_token:
                gateway_token = str((gateway.get("auth") or {}).get("token") or "")
        except Exception:
            pass

    health_json, health_err = _run_openclaw_json(
        ["openclaw", "health", "--json"],
        timeout_s=OFFICIAL_STATUS_TIMEOUT_SECONDS,
    )
    status_json, status_err = _run_openclaw_json(
        ["openclaw", "status", "--json", "--usage"],
        timeout_s=OFFICIAL_STATUS_TIMEOUT_SECONDS,
    )
    api_probe = _gateway_api_probe(gateway_port, gateway_token or None, OFFICIAL_STATUS_TIMEOUT_SECONDS)

    providers: list[dict[str, Any]] = []
    usage_obj = (status_json or {}).get("usage") if isinstance(status_json, dict) else None
    provider_map = (usage_obj or {}).get("providers") if isinstance(usage_obj, dict) else None
    if isinstance(provider_map, dict):
        for name, info in provider_map.items():
            if not isinstance(info, dict):
                continue
            providers.append(
                {
                    "provider": str(name),
                    "ok": bool(info.get("ok", False)),
                    "status": str(info.get("status") or ""),
                    "latency_ms": _safe_int(info.get("durationMs"), 0),
                    "message": str(info.get("message") or ""),
                }
            )
    providers.sort(key=lambda p: (not p.get("ok", False), p.get("provider", "")))

    sessions = (status_json or {}).get("sessions") if isinstance(status_json, dict) else {}
    gateway = (status_json or {}).get("gateway") if isinstance(status_json, dict) else {}
    channel_summary = (status_json or {}).get("channelSummary") if isinstance(status_json, dict) else []

    return {
        "enabled": True,
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "errors": {
            "health": health_err,
            "status": status_err,
        },
        "gateway": {
            "url": str((gateway or {}).get("url") or f"http://127.0.0.1:{gateway_port}"),
            "reachable": bool((gateway or {}).get("reachable", False)),
            "latency_ms": _safe_int((gateway or {}).get("connectLatencyMs"), 0),
            "mode": str((gateway or {}).get("mode") or ""),
        },
        "gateway_api_probe": api_probe,
        "health_ok": bool((health_json or {}).get("ok", False)),
        "sessions_count": _safe_int((sessions or {}).get("count"), 0),
        "sessions_recent": (sessions or {}).get("recent", []) if isinstance((sessions or {}).get("recent"), list) else [],
        "sessions_by_agent": (sessions or {}).get("byAgent", {}) if isinstance((sessions or {}).get("byAgent"), dict) else {},
        "channels": channel_summary if isinstance(channel_summary, list) else [],
        "providers": providers,
    }


def _collect_official_status_cached(base: Path) -> dict[str, Any]:
    if not OFFICIAL_STATUS_ENABLED:
        return {"enabled": False}

    now = time.time()
    cached = _official_cache.get("data")
    fetched_at = float(_official_cache.get("fetched_at") or 0.0)
    if cached is not None and now - fetched_at < OFFICIAL_CACHE_TTL_SECONDS:
        return cached

    if not _official_cache_lock.acquire(blocking=False):
        # Another request is collecting official status.
        return cached if cached is not None else {"enabled": True, "degraded": "collecting"}

    try:
        now = time.time()
        cached = _official_cache.get("data")
        fetched_at = float(_official_cache.get("fetched_at") or 0.0)
        if cached is not None and now - fetched_at < OFFICIAL_CACHE_TTL_SECONDS:
            return cached

        data = _collect_official_status(base)
        _official_cache["fetched_at"] = now
        _official_cache["data"] = data
        return data
    except Exception as exc:
        if cached is not None:
            return cached
        return {"enabled": True, "degraded": "error", "error": str(exc)}
    finally:
        _official_cache_lock.release()


def _infer_stage(
    age_seconds: int | None,
    sessions: int,
    aborted_last_run: int,
    current_task: str | None = None,
    current_session_key: str | None = None,
) -> str:
    if sessions <= 0:
        return "idle"
    if aborted_last_run > 0:
        return "blocked"

    task_text = (current_task or "").strip()
    session_key = (current_session_key or "").strip()
    has_task = task_text not in {"", "-", "none", "null"}
    has_session = session_key not in {"", "-"}

    # Historical sessions without current task/session are normal idle state.
    if not has_task and not has_session:
        if age_seconds is None or age_seconds > 300:
            return "idle"

    if age_seconds is None:
        return "waiting"
    if age_seconds <= 60:
        return "executing"
    if age_seconds <= 300:
        return "waiting"
    return "stalled"


def _stage_to_progress(stage: str, age_seconds: int | None) -> int:
    if stage == "idle":
        return 0
    if stage == "blocked":
        return 20
    if stage == "executing":
        return 65
    if stage == "waiting":
        return 80
    if stage == "stalled":
        if age_seconds is None:
            return 25
        return 35 if age_seconds < 1200 else 15
    return 50


def _format_age_seconds(age_seconds: int | None) -> str:
    if age_seconds is None or age_seconds < 0:
        return "-"
    if age_seconds < 60:
        return f"{age_seconds}s"
    minutes = age_seconds // 60
    if minutes < 60:
        return f"{minutes}m"
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours}h{mins:02d}m"


def _clip_text(text: str, limit: int = 120) -> str:
    s = " ".join((text or "").split()).strip()
    if len(s) <= limit:
        return s
    return s[: limit - 1] + "…"


def _normalize_task_text(raw: str) -> str | None:
    text = (raw or "").strip()
    if not text:
        return None

    # Drop known metadata wrappers that are not actual tasks.
    lowered = text.lower()
    noisy_markers = (
        "conversation info (untrusted metadata)",
        "sender (untrusted metadata)",
        '"message_id":',
        '"sender_id":',
        '"conversation_label":',
    )
    if any(m in lowered for m in noisy_markers):
        # Try to salvage the final human line, e.g. "Name: actual message".
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        for line in reversed(lines):
            if line.startswith("[message_id:"):
                continue
            if line.startswith("```") or line.startswith("{") or line.startswith("}"):
                continue
            # Drop sender prefix if present.
            if ":" in line:
                _, rhs = line.split(":", 1)
                line = rhs.strip()
            if line and "untrusted metadata" not in line.lower():
                return _clip_text(line)
        return None

    return _clip_text(text)


def _extract_recent_user_task(session_file: str | None, max_bytes: int = 65536, max_lines: int = 120) -> str | None:
    if not session_file:
        return None
    p = Path(session_file)
    if not p.exists() or not p.is_file():
        return None

    try:
        with p.open("rb") as f:
            f.seek(0, 2)
            size = f.tell()
            if size <= 0:
                return None
            f.seek(max(0, size - max_bytes))
            chunk = f.read()
        lines = chunk.decode("utf-8", errors="ignore").splitlines()
    except Exception:
        return None

    # Walk backwards to find the latest user message text with minimal parsing.
    checked = 0
    for line in reversed(lines):
        if checked >= max_lines:
            break
        checked += 1
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except Exception:
            continue
        msg = obj.get("message")
        if not isinstance(msg, dict):
            continue
        if str(msg.get("role") or "") != "user":
            continue
        content = msg.get("content")
        if not isinstance(content, list):
            continue
        for block in content:
            if not isinstance(block, dict):
                continue
            if str(block.get("type") or "") != "text":
                continue
            text = str(block.get("text") or "").strip()
            if text:
                normalized = _normalize_task_text(text)
                if normalized:
                    return normalized
    return None


def _row_sig(row: dict[str, Any], keys: list[str]) -> str:
    parts = []
    for k in keys:
        v = row.get(k)
        parts.append(f"{k}={v}")
    return "|".join(parts)


def _append_event(event: dict[str, Any]) -> None:
    with _events_lock:
        _events.append(event)


def _record_execution_events(agent_rows: list[dict[str, Any]], sub_rows: list[dict[str, Any]]) -> None:
    now_iso = datetime.now(timezone.utc).isoformat()

    for row in agent_rows:
        agent = str(row.get("agent") or "")
        if not agent:
            continue
        sig = _row_sig(
            row,
            ["status", "stage", "progress", "current_task", "current_session_key", "age_text"],
        )
        prev = _last_agent_event_sig.get(agent)
        if sig == prev:
            continue
        _last_agent_event_sig[agent] = sig
        _append_event(
            {
                "ts": now_iso,
                "scope": "agent",
                "id": agent,
                "status": row.get("status"),
                "stage": row.get("stage"),
                "progress": row.get("progress"),
                "current_task": row.get("current_task") or "-",
                "age_text": row.get("age_text") or "-",
            }
        )

    for row in sub_rows:
        sub = str(row.get("agent") or "")
        if not sub:
            continue
        sig = _row_sig(
            row,
            ["status", "stage", "progress", "current_task", "runtime", "result"],
        )
        prev = _last_subagent_event_sig.get(sub)
        if sig == prev:
            continue
        _last_subagent_event_sig[sub] = sig
        _append_event(
            {
                "ts": now_iso,
                "scope": "subagent",
                "id": sub,
                "parent_agent": row.get("parent_agent") or "main",
                "status": row.get("status"),
                "stage": row.get("stage"),
                "progress": row.get("progress"),
                "current_task": row.get("current_task") or "-",
                "runtime": row.get("runtime") or "-",
                "result": row.get("result") or "pending",
            }
        )


def _recent_events(limit: int = 100) -> list[dict[str, Any]]:
    n = max(1, min(int(limit), EVENTS_MAX_ITEMS))
    with _events_lock:
        items = list(_events)
    return items[-n:]


def _derive_agent_execution_views(agents: list[dict[str, Any]], official: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    by_agent = official.get("sessions_by_agent", {}) if isinstance(official.get("sessions_by_agent"), dict) else {}
    agent_rows: list[dict[str, Any]] = []

    for a in agents:
        agent_id = str(a.get("agent", ""))
        latest_ms = a.get("latest_updated_at_ms")
        age_seconds = None
        if isinstance(latest_ms, (int, float)) and latest_ms > 0:
            age_seconds = max(0, int(time.time()) - int(float(latest_ms) / 1000))

        recent_items = []
        by_agent_entry = by_agent.get(agent_id)
        if isinstance(by_agent_entry, dict):
            rec = by_agent_entry.get("recent")
            if isinstance(rec, list):
                recent_items = rec

        current_key = "-"
        token_total = 0
        current_task = str(a.get("latest_task_hint") or a.get("latest_subject") or "-")
        if recent_items:
            first = recent_items[0]
            if isinstance(first, dict):
                current_key = str(first.get("key") or "-")
                token_total = _safe_int(first.get("totalTokens"), 0)
                if age_seconds is None:
                    age_seconds = _safe_int(first.get("age"), 0) // 1000 if _safe_int(first.get("age"), 0) > 0 else None

        stage = _infer_stage(
            age_seconds=age_seconds,
            sessions=_safe_int(a.get("sessions")),
            aborted_last_run=_safe_int(a.get("aborted_last_run")),
            current_task=current_task,
            current_session_key=current_key,
        )
        progress = _stage_to_progress(stage, age_seconds)
        status = "ok"
        if stage == "blocked":
            status = "error"
        elif stage == "stalled":
            status = "warn"

        agent_rows.append(
            {
                "agent": agent_id,
                "status": status,
                "stage": stage,
                "progress": progress,
                "sessions": _safe_int(a.get("sessions")),
                "aborted_last_run": _safe_int(a.get("aborted_last_run")),
                "latest_updated_at": a.get("latest_updated_at"),
                "age_seconds": age_seconds,
                "age_text": _format_age_seconds(age_seconds),
                "current_session_key": current_key,
                "current_task": current_task,
                "token_total": token_total,
            }
        )

    agent_rows.sort(key=lambda x: (x.get("status") != "error", x.get("status") != "warn", x.get("age_seconds") is None, x.get("age_seconds") or 0))

    # Sub-agent view: non-main agents treated as sub-agent workers in v1.
    sub_rows = [r for r in agent_rows if r.get("agent") != "main"]
    for r in sub_rows:
        agent_id = str(r.get("agent", ""))
        parent = "main"
        if "-" in agent_id:
            parent = agent_id.split("-", 1)[0]
        r["parent_agent"] = parent
        r["current_task"] = str(r.get("current_task") or r.get("current_session_key") or "-")
        r["runtime"] = r.get("age_text")
        r["result"] = "failed" if r.get("status") == "error" else ("running" if r.get("stage") == "executing" else "pending")

    return agent_rows, sub_rows


def _scan_agents(base: Path, now_ms: int, stall_ms: int) -> list[dict[str, Any]]:
    agents_dir = base / "agents"
    if not agents_dir.exists() or not agents_dir.is_dir():
        return []

    result: list[dict[str, Any]] = []
    for sessions_file in sorted(agents_dir.glob("*/sessions/sessions.json")):
        agent_name = sessions_file.parent.parent.name
        sessions_map = _load_sessions_json(sessions_file)
        entries = list(sessions_map.values())

        sessions_count = 0
        aborted_count = 0
        latest_updated_at_ms = 0
        latest_subject = ""
        latest_session_file = ""
        latest_task_hint = ""

        for entry in entries:
            if not isinstance(entry, dict):
                continue
            sessions_count += 1
            if entry.get("abortedLastRun") is True:
                aborted_count += 1

            updated_at = entry.get("updatedAt")
            if isinstance(updated_at, (int, float)):
                updated_int = int(updated_at)
                if updated_int >= latest_updated_at_ms:
                    latest_updated_at_ms = updated_int
                    latest_subject = str(entry.get("subject") or "")
                    latest_session_file = str(entry.get("sessionFile") or "")

        if latest_session_file:
            latest_task_hint = _extract_recent_user_task(latest_session_file) or ""

        result.append(
            {
                "agent": agent_name,
                "sessions": sessions_count,
                "aborted_last_run": aborted_count,
                "latest_updated_at": _to_iso(latest_updated_at_ms),
                "latest_updated_at_ms": latest_updated_at_ms or None,
                "stalled": bool(
                    sessions_count > 0
                    and latest_updated_at_ms > 0
                    and now_ms - latest_updated_at_ms >= stall_ms
                ),
                "latest_subject": latest_subject,
                "latest_session_file": latest_session_file,
                "latest_task_hint": latest_task_hint,
                "sessions_file": str(sessions_file),
            }
        )

    result.sort(
        key=lambda x: (
            x.get("latest_updated_at_ms") if x.get("latest_updated_at_ms") is not None else -1,
            x.get("agent", ""),
        ),
        reverse=True,
    )
    return result


def _workspace_dirs(base: Path) -> list[Path]:
    dirs: list[Path] = []
    exact = base / "workspace"
    if exact.exists() and exact.is_dir():
        dirs.append(exact)
    for ws_dir in sorted(base.glob("workspace-*")):
        if ws_dir.is_dir():
            dirs.append(ws_dir)
    return dirs


def _scan_workspaces(base: Path, now_s: int, stall_seconds: int) -> dict[str, Any]:
    workspaces: list[dict[str, Any]] = []
    totals = {v: 0 for v in TASK_STATUSES.values()}
    stalled_tasks: list[dict[str, Any]] = []
    stalled_total = 0

    for ws_dir in _workspace_dirs(base):
        work_dir = ws_dir / "work"
        status_counts: dict[str, int] = {}

        for folder_name, key in TASK_STATUSES.items():
            count = _count_files(work_dir / folder_name)
            status_counts[key] = count
            totals[key] += count

        stalled_in_progress = 0
        in_progress_dir = work_dir / "in-progress"
        if in_progress_dir.exists() and in_progress_dir.is_dir():
            for p in in_progress_dir.iterdir():
                if not p.is_file():
                    continue
                try:
                    modified_s = int(p.stat().st_mtime)
                except Exception:
                    continue
                age_seconds = now_s - modified_s
                if age_seconds >= stall_seconds:
                    stalled_in_progress += 1
                    stalled_total += 1
                    stalled_tasks.append(
                        {
                            "workspace": ws_dir.name,
                            "task_file": p.name,
                            "task_path": str(p),
                            "age_seconds": age_seconds,
                            "updated_at": _to_iso_seconds(modified_s),
                        }
                    )

        workspaces.append(
            {
                "workspace": ws_dir.name,
                **status_counts,
                "stalled_in_progress": stalled_in_progress,
            }
        )

    workspaces.sort(key=lambda w: (w.get("stalled_in_progress", 0), w.get("workspace", "")), reverse=True)
    stalled_tasks.sort(key=lambda t: t.get("age_seconds", 0), reverse=True)
    return {
        "workspaces": workspaces,
        "totals": totals,
        "stalled_total": stalled_total,
        "stalled_tasks": stalled_tasks,
    }


def _build_status() -> dict[str, Any]:
    now_s = int(time.time())
    now_ms = now_s * 1000
    stall_ms = TASK_STALL_SECONDS * 1000
    agents = _scan_agents(OPENCLAW_HOME, now_ms=now_ms, stall_ms=stall_ms)
    stalled_agents = sum(1 for a in agents if a.get("stalled") is True)
    aborted_total = sum(int(a.get("aborted_last_run", 0)) for a in agents)
    sessions_total = sum(int(a.get("sessions", 0)) for a in agents)
    # Agent-focused mode: skip gateway/channel/provider probing to reduce load.
    agent_execution, subagent_execution = _derive_agent_execution_views(agents, {})
    _record_execution_events(agent_execution, subagent_execution)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "cache_ttl_seconds": CACHE_TTL_SECONDS,
        "dashboard_refresh_seconds": DASHBOARD_REFRESH_SECONDS,
        "task_stall_seconds": TASK_STALL_SECONDS,
        "agent_count": len(agents),
        "agent_stalled_count": stalled_agents,
        "agent_sessions_total": sessions_total,
        "agent_aborted_total": aborted_total,
        "agent_execution": agent_execution,
        "subagent_execution": subagent_execution,
        "recent_events": _recent_events(30),
    }


def get_status_cached(force: bool = False) -> dict[str, Any]:
    now = time.time()
    with _cache_cond:
        cached = _cache.get("data")
        fetched_at = float(_cache.get("fetched_at") or 0.0)
        is_fresh = cached is not None and (now - fetched_at < CACHE_TTL_SECONDS)
        if is_fresh and not force:
            return cached

        if _cache.get("building"):
            # Return stale cache immediately to avoid request pile-up.
            if cached is not None and not force:
                return cached
            _cache_cond.wait(timeout=1.0)
            cached_after_wait = _cache.get("data")
            if cached_after_wait is not None:
                return cached_after_wait

        _cache["building"] = True

    data: dict[str, Any] | None = None
    error: str | None = None
    try:
        data = _build_status()
    except Exception as exc:
        error = str(exc)

    with _cache_cond:
        if data is not None:
            _cache["fetched_at"] = time.time()
            _cache["data"] = data
            _cache["seq"] = int(_cache.get("seq") or 0) + 1
        _cache["building"] = False
        _cache_cond.notify_all()

        if _cache.get("data") is not None:
            return _cache["data"]
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "error": error or "build status failed",
            "official": {"enabled": OFFICIAL_STATUS_ENABLED, "degraded": "no-cache"},
            "agent_execution": [],
            "subagent_execution": [],
        }


@app.get("/")
def index() -> dict[str, str]:
    return {
        "message": "OpenClaw Agent Control",
        "dashboard": "/dashboard",
        "status_api": "/api/status",
    }


@app.get("/api/status")
def api_status(force: int = 0) -> dict[str, Any]:
    return get_status_cached(force=bool(force))


@app.get("/api/events")
def api_events(limit: int = 100) -> dict[str, Any]:
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": _recent_events(limit),
    }


@app.get("/api/events/stream")
def api_events_stream():
    def _stream_payload(data: dict[str, Any]) -> dict[str, Any]:
        return {
            "generated_at": data.get("generated_at"),
            "agent_execution": data.get("agent_execution", []),
            "subagent_execution": data.get("subagent_execution", []),
            "recent_events": data.get("recent_events", []),
        }

    def event_generator():
        data = get_status_cached(force=False)
        payload = _stream_payload(data)
        last_sent = json.dumps(payload, ensure_ascii=False)
        with _cache_lock:
            cache_seq = int(_cache.get("seq") or 0)
        yield f"event: status\ndata: {last_sent}\n\n"

        while True:
            timed_out = False
            with _cache_cond:
                current_seq = int(_cache.get("seq") or 0)
                if current_seq == cache_seq:
                    _cache_cond.wait(timeout=max(1, EVENTS_STREAM_INTERVAL_SECONDS))
                    timed_out = True
                current_seq = int(_cache.get("seq") or 0)
                current_data = _cache.get("data")

            if current_seq == cache_seq and timed_out:
                # Only one connected SSE client tries cache refresh per interval.
                if _stream_refresh_lock.acquire(blocking=False):
                    try:
                        get_status_cached(force=False)
                    finally:
                        _stream_refresh_lock.release()
                    with _cache_lock:
                        current_seq = int(_cache.get("seq") or 0)
                        current_data = _cache.get("data")

            if current_seq != cache_seq and isinstance(current_data, dict):
                cache_seq = current_seq
                text = json.dumps(_stream_payload(current_data), ensure_ascii=False)
                if text != last_sent:
                    last_sent = text
                    yield f"event: status\ndata: {text}\n\n"
                    continue
            yield "event: heartbeat\ndata: {}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(lang: str = "zh") -> str:
    lang = (lang or "zh").lower()
    if lang not in {"zh", "en"}:
        lang = "zh"

    i18n = {
        "zh": {
            "title": "OpenClaw Agent 状态监控与控制台",
            "language": "语言",
            "meta_source": "数据源",
            "meta_generated": "生成时间",
            "meta_cache_ttl": "缓存秒数",
            "meta_refresh": "刷新秒数",
            "meta_stall_threshold": "任务卡住阈值(秒)",
            "meta_stalled_total": "卡住任务总数",
            "meta_agent_summary": "agents: {agent_count} | stalled_agents: {stalled} | sessions_total: {sessions_total} | aborted_total: {aborted}",
            "task_totals": "任务总览",
            "official": "官方 Gateway 状态",
            "providers": "Provider 用量快照",
            "agents": "Agent 列表",
            "workspace_counts": "Workspace 任务统计",
            "stalled_tasks": "卡住任务列表（in-progress 超过 {seconds}s）",
            "th_agent": "agent",
            "th_sessions": "sessions",
            "th_aborted": "aborted_last_run",
            "th_latest": "latest_updated_at (UTC)",
            "th_workspace": "workspace",
            "th_task_file": "task_file",
            "th_age_seconds": "age_seconds",
            "th_updated_at": "updated_at (UTC)",
            "th_provider": "provider",
            "th_ok": "ok",
            "th_status": "status",
            "th_latency": "latency_ms",
            "th_message": "message",
            "no_agents": "未发现 agent",
            "no_workspaces": "未发现 workspace",
            "no_stalled": "无卡住任务（in-progress > 60s）",
            "no_provider_data": "暂无 provider usage 数据",
            "official_enabled": "official_enabled",
            "health_ok": "health_ok (openclaw health --json)",
            "gateway_reachable": "gateway_reachable (openclaw status --json)",
            "gateway_latency": "gateway_latency_ms",
            "gateway_mode": "gateway_mode",
            "gateway_url": "gateway_url",
            "gateway_probe": "gateway_api_probe",
            "official_sessions_count": "official_sessions_count",
            "health_error": "health_error",
            "status_error": "status_error",
            "footer": "每 {seconds}s 自动刷新。/api/status 加 ?force=1 可绕过缓存。",
            "overview": "状态总览",
            "card_agent": "Agent",
            "card_gateway": "Gateway",
            "card_channel": "Channel",
            "card_provider": "Provider",
            "alert_bar": "告警",
            "healthy": "健康",
            "warning": "告警",
            "critical": "严重",
            "agent_progress": "Agent 执行进度",
            "subagent_progress": "Sub-agent 执行情况",
            "th_status": "状态",
            "th_stage": "阶段",
            "th_progress": "进度",
            "th_last_active": "最近活跃",
            "th_current_session": "当前会话",
            "th_tokens": "token",
            "th_parent_agent": "父 agent",
            "th_subagent": "子 agent",
            "th_current_task": "当前任务",
            "th_runtime": "运行时长",
            "th_result": "结果",
            "no_subagents": "暂无子 agent 执行记录",
        },
        "en": {
            "title": "OpenClaw Agent Control Dashboard",
            "language": "Language",
            "meta_source": "source",
            "meta_generated": "generated_at",
            "meta_cache_ttl": "cache_ttl_seconds",
            "meta_refresh": "dashboard_refresh_seconds",
            "meta_stall_threshold": "task_stall_seconds",
            "meta_stalled_total": "stalled_in_progress_total",
            "meta_agent_summary": "agents: {agent_count} | stalled_agents: {stalled} | sessions_total: {sessions_total} | aborted_total: {aborted}",
            "task_totals": "Task Totals",
            "official": "Official Gateway Status",
            "providers": "Provider Usage Snapshot",
            "agents": "Agents",
            "workspace_counts": "Workspace Task Counts",
            "stalled_tasks": "Stalled Tasks (in-progress older than {seconds}s)",
            "th_agent": "agent",
            "th_sessions": "sessions",
            "th_aborted": "aborted_last_run",
            "th_latest": "latest_updated_at (UTC)",
            "th_workspace": "workspace",
            "th_task_file": "task_file",
            "th_age_seconds": "age_seconds",
            "th_updated_at": "updated_at (UTC)",
            "th_provider": "provider",
            "th_ok": "ok",
            "th_status": "status",
            "th_latency": "latency_ms",
            "th_message": "message",
            "no_agents": "No agents found",
            "no_workspaces": "No workspace found",
            "no_stalled": "No stalled tasks (in-progress > 60s)",
            "no_provider_data": "No provider usage data",
            "official_enabled": "official_enabled",
            "health_ok": "health_ok (openclaw health --json)",
            "gateway_reachable": "gateway_reachable (openclaw status --json)",
            "gateway_latency": "gateway_latency_ms",
            "gateway_mode": "gateway_mode",
            "gateway_url": "gateway_url",
            "gateway_probe": "gateway_api_probe",
            "official_sessions_count": "official_sessions_count",
            "health_error": "health_error",
            "status_error": "status_error",
            "footer": "Auto refresh every {seconds}s. Add ?force=1 on /api/status to bypass cache.",
            "overview": "Status Overview",
            "card_agent": "Agent",
            "card_gateway": "Gateway",
            "card_channel": "Channel",
            "card_provider": "Provider",
            "alert_bar": "Alerts",
            "healthy": "Healthy",
            "warning": "Warning",
            "critical": "Critical",
            "agent_progress": "Agent Execution Progress",
            "subagent_progress": "Sub-agent Execution",
            "th_status": "status",
            "th_stage": "stage",
            "th_progress": "progress",
            "th_last_active": "last_active",
            "th_current_session": "current_session",
            "th_tokens": "token",
            "th_parent_agent": "parent_agent",
            "th_subagent": "sub_agent",
            "th_current_task": "current_task",
            "th_runtime": "runtime",
            "th_result": "result",
            "no_subagents": "No sub-agent execution rows",
        },
    }[lang]

    data = get_status_cached()

    agents = data.get("agents", [])
    official = data.get("official", {}) if isinstance(data.get("official"), dict) else {}
    agent_execution = data.get("agent_execution", []) if isinstance(data.get("agent_execution"), list) else []
    subagent_execution = data.get("subagent_execution", []) if isinstance(data.get("subagent_execution"), list) else []

    agent_rows = []
    for a in agents:
        latest = escape(str(a.get("latest_updated_at") or "-"))
        row_class = " class='bad'" if a.get("stalled") else ""
        agent_rows.append(
            f"<tr{row_class}>"
            f"<td>{escape(str(a.get('agent', '-')))}</td>"
            f"<td>{a.get('sessions', 0)}</td>"
            f"<td>{a.get('aborted_last_run', 0)}</td>"
            f"<td>{latest}</td>"
            "</tr>"
        )

    agent_rows_html = "\n".join(agent_rows) if agent_rows else f"<tr><td colspan='4'>{i18n['no_agents']}</td></tr>"

    providers = official.get("providers", []) if isinstance(official.get("providers"), list) else []
    provider_rows = []
    for p in providers:
        cls = " class='bad'" if not p.get("ok") else ""
        provider_rows.append(
            f"<tr{cls}>"
            f"<td>{escape(str(p.get('provider', '-')))}</td>"
            f"<td>{'ok' if p.get('ok') else 'fail'}</td>"
            f"<td>{escape(str(p.get('status', '-')))}</td>"
            f"<td>{p.get('latency_ms', 0)}</td>"
            f"<td>{escape(str(p.get('message', '-')))}</td>"
            "</tr>"
        )
    provider_rows_html = (
        "\n".join(provider_rows)
        if provider_rows
        else f"<tr><td colspan='5'>{i18n['no_provider_data']}</td></tr>"
    )

    agent_progress_rows = []
    for row in agent_execution[:200]:
        status = str(row.get("status", "ok"))
        cls = " class='bad'" if status in {"warn", "error"} else ""
        progress = _safe_int(row.get("progress"), 0)
        agent_progress_rows.append(
            f"<tr{cls}>"
            f"<td>{escape(str(row.get('agent', '-')))}</td>"
            f"<td>{escape(status)}</td>"
            f"<td>{escape(str(row.get('stage', '-')))}</td>"
            f"<td><div class='pbar'><div class='pfill' style='width:{progress}%'></div><span>{progress}%</span></div></td>"
            f"<td>{escape(str(row.get('age_text', '-')))}</td>"
            f"<td>{escape(str(row.get('current_session_key', '-')))}</td>"
            f"<td>{_safe_int(row.get('token_total'), 0)}</td>"
            "</tr>"
        )
    agent_progress_rows_html = (
        "\n".join(agent_progress_rows)
        if agent_progress_rows
        else f"<tr><td colspan='7'>{i18n['no_agents']}</td></tr>"
    )

    subagent_rows = []
    for row in subagent_execution[:200]:
        status = str(row.get("status", "ok"))
        cls = " class='bad'" if status in {"warn", "error"} else ""
        progress = _safe_int(row.get("progress"), 0)
        subagent_rows.append(
            f"<tr{cls}>"
            f"<td>{escape(str(row.get('parent_agent', '-')))}</td>"
            f"<td>{escape(str(row.get('agent', '-')))}</td>"
            f"<td>{escape(str(row.get('current_task', '-')))}</td>"
            f"<td>{escape(str(row.get('stage', '-')))}</td>"
            f"<td><div class='pbar'><div class='pfill' style='width:{progress}%'></div><span>{progress}%</span></div></td>"
            f"<td>{escape(str(row.get('runtime', '-')))}</td>"
            f"<td>{escape(str(row.get('result', '-')))}</td>"
            "</tr>"
        )
    subagent_rows_html = (
        "\n".join(subagent_rows)
        if subagent_rows
        else f"<tr><td colspan='7'>{i18n['no_subagents']}</td></tr>"
    )

    # 4-panel overview status
    gateway = official.get("gateway") if isinstance(official.get("gateway"), dict) else {}
    channels = official.get("channels") if isinstance(official.get("channels"), list) else []
    providers = official.get("providers") if isinstance(official.get("providers"), list) else []

    agent_stalled = int(data.get("agent_stalled_count", 0))
    gateway_reachable = bool(gateway.get("reachable", False))
    failed_channels = [c for c in channels if isinstance(c, str) and ("not configured" in c.lower() or "error" in c.lower())]
    failed_providers = [p for p in providers if not bool(p.get("ok"))]

    agent_level = "critical" if agent_stalled > 0 else "healthy"
    gateway_level = "healthy" if gateway_reachable else "critical"
    channel_level = "warning" if failed_channels else "healthy"
    provider_level = "warning" if failed_providers else "healthy"

    def level_label(level: str) -> str:
        if level == "critical":
            return i18n["critical"]
        if level == "warning":
            return i18n["warning"]
        return i18n["healthy"]

    alert_items: list[str] = []
    if not gateway_reachable:
        alert_items.append("gateway unreachable")
    if agent_stalled > 0:
        alert_items.append(f"stalled agents={agent_stalled}")
    if failed_channels:
        alert_items.append(f"channel warnings={len(failed_channels)}")
    if failed_providers:
        alert_items.append(f"provider warnings={len(failed_providers)}")
    alert_summary = ", ".join(alert_items) if alert_items else "-"
    overall_level = "critical" if "gateway unreachable" in alert_items else ("warning" if alert_items else "healthy")

    api_status_link = f"/api/status?lang={lang}"
    dashboard_zh_link = "/dashboard?lang=zh"
    dashboard_en_link = "/dashboard?lang=en"

    html = f"""
<!doctype html>
<html lang="{"zh-CN" if lang == "zh" else "en"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="{DASHBOARD_REFRESH_SECONDS}" />
  <title>{i18n["title"]}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 24px; color: #111; }}
    h1, h2 {{ margin: 0 0 12px; }}
    .meta {{ margin-bottom: 16px; color: #444; }}
    .lang-switch {{ margin: 8px 0 14px; }}
    .lang-switch a {{ display: inline-block; margin-right: 10px; text-decoration: none; }}
    table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
    th, td {{ border: 1px solid #d9d9d9; padding: 8px 10px; text-align: left; }}
    th {{ background: #f6f6f6; }}
    .bad {{ color: #b91c1c; font-weight: 600; }}
    .small {{ font-size: 13px; color: #666; }}
    .overview {{ display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 12px 0 18px; }}
    .card {{ border: 1px solid #d9d9d9; border-radius: 8px; padding: 10px 12px; background: #fff; }}
    .card .name {{ font-size: 12px; color: #666; text-transform: uppercase; }}
    .card .value {{ font-size: 19px; font-weight: 700; margin-top: 4px; }}
    .card.healthy {{ border-color: #86efac; background: #f0fdf4; color: #14532d; }}
    .card.warning {{ border-color: #fcd34d; background: #fffbeb; color: #78350f; }}
    .card.critical {{ border-color: #fca5a5; background: #fef2f2; color: #7f1d1d; }}
    .alert-bar {{ border: 1px solid #d9d9d9; border-radius: 8px; padding: 10px 12px; margin: 10px 0 16px; }}
    .alert-bar.healthy {{ border-color: #86efac; background: #f0fdf4; color: #14532d; }}
    .alert-bar.warning {{ border-color: #fcd34d; background: #fffbeb; color: #78350f; }}
    .alert-bar.critical {{ border-color: #fca5a5; background: #fef2f2; color: #7f1d1d; }}
    .pbar {{ position: relative; min-width: 140px; height: 18px; border-radius: 10px; background: #eef2f7; overflow: hidden; }}
    .pbar .pfill {{ height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); }}
    .pbar span {{ position: absolute; left: 8px; top: 0; line-height: 18px; font-size: 12px; color: #111; font-weight: 600; }}
    @media (max-width: 900px) {{ .overview {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }} }}
  </style>
</head>
<body>
  <h1>{i18n["title"]}</h1>
  <div class="lang-switch">
    <span>{i18n["language"]}: </span>
    <a href="{dashboard_zh_link}">中文</a>
    <a href="{dashboard_en_link}">English</a>
  </div>
  <div class="meta">
    <div>{i18n["meta_source"]}: {escape(str(data.get('source')))}</div>
    <div>{i18n["meta_generated"]}: {escape(str(data.get('generated_at')))}</div>
    <div>{i18n["meta_cache_ttl"]}: {data.get('cache_ttl_seconds')}</div>
    <div>{i18n["meta_refresh"]}: {data.get('dashboard_refresh_seconds')}</div>
    <div>{i18n["meta_stall_threshold"]}: {data.get('task_stall_seconds')}</div>
    <div>{i18n["meta_agent_summary"].format(agent_count=data.get('agent_count', 0), stalled=data.get('agent_stalled_count', 0), sessions_total=data.get('agent_sessions_total', 0), aborted=data.get('agent_aborted_total', 0))}</div>
    <div><a href="{api_status_link}">/api/status</a></div>
  </div>

  <h2>{i18n["overview"]}</h2>
  <div class="overview">
    <div class="card {agent_level}">
      <div class="name">{i18n["card_agent"]}</div>
      <div class="value">{level_label(agent_level)}</div>
      <div>stalled_agents={agent_stalled}, aborted_total={data.get('agent_aborted_total', 0)}</div>
    </div>
    <div class="card {gateway_level}">
      <div class="name">{i18n["card_gateway"]}</div>
      <div class="value">{level_label(gateway_level)}</div>
      <div>reachable={gateway_reachable}, latency={escape(str(gateway.get("latency_ms", 0)))}ms</div>
    </div>
    <div class="card {channel_level}">
      <div class="name">{i18n["card_channel"]}</div>
      <div class="value">{level_label(channel_level)}</div>
      <div>channels={len(channels)}, warnings={len(failed_channels)}</div>
    </div>
    <div class="card {provider_level}">
      <div class="name">{i18n["card_provider"]}</div>
      <div class="value">{level_label(provider_level)}</div>
      <div>providers={len(providers)}, warnings={len(failed_providers)}</div>
    </div>
  </div>

  <div class="alert-bar {overall_level}">
    <strong>{i18n["alert_bar"]}:</strong> {escape(alert_summary)}
  </div>

  <h2>{i18n["agent_progress"]}</h2>
  <table>
    <thead>
      <tr>
        <th>{i18n["th_agent"]}</th>
        <th>{i18n["th_status"]}</th>
        <th>{i18n["th_stage"]}</th>
        <th>{i18n["th_progress"]}</th>
        <th>{i18n["th_last_active"]}</th>
        <th>{i18n["th_current_session"]}</th>
        <th>{i18n["th_tokens"]}</th>
      </tr>
    </thead>
    <tbody>
      {agent_progress_rows_html}
    </tbody>
  </table>

  <h2>{i18n["subagent_progress"]}</h2>
  <table>
    <thead>
      <tr>
        <th>{i18n["th_parent_agent"]}</th>
        <th>{i18n["th_subagent"]}</th>
        <th>{i18n["th_current_task"]}</th>
        <th>{i18n["th_stage"]}</th>
        <th>{i18n["th_progress"]}</th>
        <th>{i18n["th_runtime"]}</th>
        <th>{i18n["th_result"]}</th>
      </tr>
    </thead>
    <tbody>
      {subagent_rows_html}
    </tbody>
  </table>

  <h2>{i18n["agents"]} ({data.get('agent_count', 0)})</h2>
  <table>
    <thead>
      <tr>
        <th>{i18n["th_agent"]}</th>
        <th>{i18n["th_sessions"]}</th>
        <th>{i18n["th_aborted"]}</th>
        <th>{i18n["th_latest"]}</th>
      </tr>
    </thead>
    <tbody>
      {agent_rows_html}
    </tbody>
  </table>

  <div class="small">{i18n["footer"].format(seconds=DASHBOARD_REFRESH_SECONDS)}</div>
</body>
</html>
"""

    return html
