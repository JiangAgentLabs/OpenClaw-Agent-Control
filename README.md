# OpenClaw Agent Control

OpenClaw Agent status monitoring and control console for operations teams.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview
OpenClaw Agent Control provides:
- Real-time status visibility for Agent and Sub-agent execution.
- Risk-first triage views (stalled, abnormal, active).
- Timeline-based diagnostics for incident analysis.
- Production-ready start/stop/restart/status/log workflows.

## Documentation
- Chinese Guide: [README.zh-CN.md](./README.zh-CN.md)
- English Guide: [README.en.md](./README.en.md)
- Chinese Tutorial: [docs/TUTORIAL.zh-CN.md](./docs/TUTORIAL.zh-CN.md)
- English Tutorial: [docs/TUTORIAL.en.md](./docs/TUTORIAL.en.md)
- API Reference: [docs/API.md](./docs/API.md)
- Open Source Landscape: [docs/OPEN_SOURCE_LANDSCAPE.md](./docs/OPEN_SOURCE_LANDSCAPE.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- License: [LICENSE](./LICENSE)

## Architecture
- Backend: `app.py` (FastAPI, status aggregation, event stream, dashboard API)
- Frontend: `agent-monitor-ui/` (Next.js, operational dashboard)
- Operations scripts: `agent-monitor-ui/scripts/`

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
3. Open:
- Frontend: `http://127.0.0.1:3000`
- Backend API: `http://127.0.0.1:8787/api/status`

## Repository Roadmap
- Improve SLA/SLO panel for operation metrics.
- Add plugin adapters for more agent runtimes.
- Add deployment manifests (Docker Compose/Systemd/K8s).
