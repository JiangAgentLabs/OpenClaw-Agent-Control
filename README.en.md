# OpenClaw Agent Control (English)

A status monitoring and control console for OpenClaw agents.

## Features
- Agent / Sub-agent execution monitoring
- Risk-first operational view (stalled, abnormal, active)
- Event timeline for status transitions
- Split architecture: FastAPI backend + Next.js frontend
- Production scripts for silent start/stop/restart/status/logs

## Run

### 1) Backend
```bash
cd /root/openclaw-monitor-mvp
uv run --with fastapi --with uvicorn python -m uvicorn app:app --host 0.0.0.0 --port 8787
```

### 2) Frontend
```bash
cd /root/openclaw-monitor-mvp/agent-monitor-ui
npm run prod:build
npm run prod:start
```

### 3) Endpoints
- Frontend console: `http://127.0.0.1:3000`
- Backend API: `http://127.0.0.1:8787/api/status`
- Backend dashboard: `http://127.0.0.1:8787/dashboard`

## Frontend Ops Commands
Run inside `agent-monitor-ui`:

```bash
npm run prod:build
npm run prod:start
npm run prod:stop
npm run prod:restart
npm run prod:status
npm run prod:logs
npm run prod:deploy
```

## Configuration
- `OPENCLAW_HOME` default: `/root/.openclaw`
- `CACHE_TTL_SECONDS` default: `15`
- `DASHBOARD_REFRESH_SECONDS` default: `5`
- `TASK_STALL_SECONDS` default: `60`
- `OFFICIAL_STATUS_ENABLED` default: `1`
- `OFFICIAL_STATUS_TIMEOUT_SECONDS` default: `8`

## Status Semantics
- `idle`: no task, normal
- `executing`: actively running
- `waiting`: queued, normal
- `stalled`: timed out, warning
- `blocked`: aborted/failed, error
