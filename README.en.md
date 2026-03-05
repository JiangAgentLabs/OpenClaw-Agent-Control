# OpenClaw Agent Control (English)

OpenClaw Agent status monitoring and control console for multi-agent operations.

## Project Definition
This project centralizes agent runtime observability and operational control decisions into one console.

## Project Advantages
- Operator-first information architecture with priority-focused layout.
- Clear runtime semantics: `idle`, `executing`, `waiting`, `stalled`, `blocked`.
- Skill-first deployment for one-command startup.
- Low-friction operations with production lifecycle scripts.
- Bilingual onboarding support for multi-language teams.

## Core Features
- Real-time Agent/Sub-agent status monitoring.
- Risk-first operational view (stalled, abnormal, active).
- Timeline diagnostics for status transitions.
- Production lifecycle scripts (start/stop/restart/status/logs).
- Skill-integrated one-command deployment entry.

## One-command Deployment (Skill-integrated)
This repository is designed to work with packaged OpenClaw skills.

```bash
cd /root/openclaw-monitor-mvp
bash ./scripts/deploy_with_skill.sh
```

Behavior:
- If the skill runner exists (`/root/.openclaw/skills/openclaw-monitor/scripts/run_monitor.sh`), backend starts via skill.
- Frontend is built and restarted in production mode automatically.

## Quick Start (Manual)
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
- Chinese Guide: [README.zh-CN.md](./README.zh-CN.md)
- About: [docs/ABOUT.md](./docs/ABOUT.md)
- Tutorial (EN): [docs/TUTORIAL.en.md](./docs/TUTORIAL.en.md)
- API Reference: [docs/API.md](./docs/API.md)
- Open-source Landscape: [docs/OPEN_SOURCE_LANDSCAPE.md](./docs/OPEN_SOURCE_LANDSCAPE.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
