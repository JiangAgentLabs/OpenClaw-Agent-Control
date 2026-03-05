# Tutorial: From Zero to Running (EN)

## 1. Prerequisites
- Python 3.10+
- Node.js 20+
- npm 10+
- `uv` available in PATH

## 2. Start backend
```bash
cd /root/openclaw-monitor-mvp
uv run --with fastapi --with uvicorn python -m uvicorn app:app --host 0.0.0.0 --port 8787
```

## 3. Start frontend
```bash
cd /root/openclaw-monitor-mvp/agent-monitor-ui
npm install
npm run prod:build
npm run prod:start
```

## 4. Verify health
```bash
curl http://127.0.0.1:8787/api/status
curl http://127.0.0.1:3000/api/monitor-status
```

## 5. Daily operations
In `agent-monitor-ui`:
```bash
npm run prod:status
npm run prod:logs
npm run prod:restart
npm run prod:stop
```

## 6. Troubleshooting
- Blank page: verify process and port `3000` listener.
- No fresh data: verify backend `8787` and data source updates.
- Wrong status semantics: inspect `current_task` and `latest_updated_at`.

## 7. Upgrade flow
1. Pull latest code.
2. Run `npm run prod:build`.
3. Run `npm run prod:restart`.
4. Validate with `/api/status`.

## 8. Skill Deployment Entry (Recommended)
Install skill package via npm command first:
```bash
cd /root/openclaw-monitor-mvp/agent-monitor-ui
npm run skill:install
```

Then deploy:
```bash
cd /root/openclaw-monitor-mvp
bash ./scripts/deploy_with_skill.sh
```

You can override skill path via env:
```bash
OPENCLAW_MONITOR_SKILL_DIR=/root/.openclaw/skills/openclaw-monitor \
  bash ./scripts/deploy_with_skill.sh
```
