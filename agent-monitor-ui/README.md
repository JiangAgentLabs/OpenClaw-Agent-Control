# OpenClaw Agent Control UI

Frontend console for OpenClaw Agent Control (Next.js 16).

## Development
```bash
npm install
npm run dev
```

## Production
```bash
npm run prod:build
npm run prod:start
```

## Operations
```bash
npm run prod:status
npm run prod:logs
npm run prod:restart
npm run prod:stop
npm run prod:deploy
```

## Environment
- `HOST` default: `0.0.0.0`
- `PORT` default: `3000`
- `MONITOR_API_BASE` default: `http://127.0.0.1:8787`
- `MONITOR_FORCE_REFRESH` default: `0`
- `MONITOR_DEMO_DELAY_MS` default: `0`
