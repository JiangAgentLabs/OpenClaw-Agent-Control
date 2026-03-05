# OpenClaw Agent Control

OpenClaw Agent status monitoring and control console.

## Documents
- Chinese Guide: [README.zh-CN.md](./README.zh-CN.md)
- English Guide: [README.en.md](./README.en.md)
- Daily Progress: [DEVELOPMENT_PROGRESS_2026-03-06.md](./DEVELOPMENT_PROGRESS_2026-03-06.md)
- License: [LICENSE](./LICENSE)

## Repository Structure
- `app.py`: backend API and dashboard service
- `agent-monitor-ui/`: Next.js frontend
- `agent-monitor-ui/scripts/`: production start/stop/restart/status/log scripts

## Quick Start
1. Backend:
```bash
cd /root/openclaw-monitor-mvp
uv run --with fastapi --with uvicorn python -m uvicorn app:app --host 0.0.0.0 --port 8787
```
2. Frontend:
```bash
cd /root/openclaw-monitor-mvp/agent-monitor-ui
npm run prod:build
npm run prod:start
```
3. Access:
- Frontend: `http://127.0.0.1:3000`
- Backend API: `http://127.0.0.1:8787/api/status`
