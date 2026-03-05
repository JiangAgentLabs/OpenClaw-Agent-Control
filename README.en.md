# OpenClaw Agent Control (English)

OpenClaw Agent status monitoring and control console for multi-agent operations.

## Use Cases
- Detect stalled, blocked, idle, and running agents quickly.
- Combine observability and control decisions in one place.
- Operate backend/frontend independently with production scripts.

## Core Capabilities
- Agent and sub-agent execution monitoring.
- Risk-first operational dashboard.
- Timeline-based status transition analysis.
- Silent production lifecycle scripts.

## Quick Start
1. Start backend:
```bash
cd /root/openclaw-monitor-mvp
uv run --with fastapi --with uvicorn python -m uvicorn app:app --host 0.0.0.0 --port 8787
```
2. Start frontend:
```bash
cd /root/openclaw-monitor-mvp/agent-monitor-ui
npm run prod:build
npm run prod:start
```
3. Access:
- Console: `http://127.0.0.1:3000`
- Status API: `http://127.0.0.1:8787/api/status`
- Backend dashboard: `http://127.0.0.1:8787/dashboard`

## Documentation
- Tutorial (EN): [docs/TUTORIAL.en.md](./docs/TUTORIAL.en.md)
- API Reference: [docs/API.md](./docs/API.md)
- Open-source Landscape: [docs/OPEN_SOURCE_LANDSCAPE.md](./docs/OPEN_SOURCE_LANDSCAPE.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
