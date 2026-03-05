# Contributing

Thanks for contributing to OpenClaw Agent Control.

## Development setup
1. Backend:
```bash
cd /root/openclaw-monitor-mvp
uv run --with fastapi --with uvicorn python -m uvicorn app:app --host 0.0.0.0 --port 8787
```
2. Frontend:
```bash
cd /root/openclaw-monitor-mvp/agent-monitor-ui
npm install
npm run dev
```

## Pull request checklist
- Keep changes scoped and atomic.
- Update docs when behavior changes.
- Run checks before submitting:
```bash
cd /root/openclaw-monitor-mvp/agent-monitor-ui
npm run lint
```
```bash
python3 -m py_compile /root/openclaw-monitor-mvp/app.py
```
- Include a clear PR description with:
  - what changed,
  - why it changed,
  - how it was validated.

## Branch strategy
- Default branch: `main`
- Feature branches: `feat/*`
- Fix branches: `fix/*`
- Docs branches: `docs/*`
