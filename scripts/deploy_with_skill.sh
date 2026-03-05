#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_DIR="$ROOT_DIR/agent-monitor-ui"
SKILL_DIR="${OPENCLAW_MONITOR_SKILL_DIR:-/root/.openclaw/skills/openclaw-monitor}"
SKILL_RUN_SCRIPT="$SKILL_DIR/scripts/run_monitor.sh"

echo "[deploy] project root: $ROOT_DIR"
echo "[deploy] ui root: $UI_DIR"

if [[ -x "$SKILL_RUN_SCRIPT" ]]; then
  echo "[deploy] found skill runner: $SKILL_RUN_SCRIPT"
  echo "[deploy] starting backend via skill (MONITOR_PORT=${MONITOR_PORT:-8787})"
  nohup bash "$SKILL_RUN_SCRIPT" > /tmp/openclaw-backend-skill.log 2>&1 &
  sleep 1
else
  echo "[deploy] skill runner not found, fallback to local backend startup"
  nohup uv run --with fastapi --with uvicorn \
    python -m uvicorn app:app --app-dir "$ROOT_DIR" --host 0.0.0.0 --port "${MONITOR_PORT:-8787}" \
    > /tmp/openclaw-backend-local.log 2>&1 &
  sleep 1
fi

echo "[deploy] deploying frontend"
cd "$UI_DIR"
npm run prod:build
npm run prod:restart

echo "[deploy] done"
echo "[deploy] frontend: http://127.0.0.1:${PORT:-3000}"
echo "[deploy] backend:  http://127.0.0.1:${MONITOR_PORT:-8787}"
