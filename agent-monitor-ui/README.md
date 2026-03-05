## Agent Monitor UI

OpenClaw Monitor 的前端 UI（Next.js 16）。

## Getting Started

Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production (Silent Background Run)

This project includes built-in silent start/stop scripts.

1. Build:

```bash
npm run prod:build
```

2. Start in background on `0.0.0.0:3000`:

```bash
npm run prod:start
```

3. Check status:

```bash
npm run prod:status
```

4. Restart after update:

```bash
npm run prod:restart
```

5. Stop:

```bash
npm run prod:stop
```

6. View logs:

```bash
npm run prod:logs
```

One-step deploy (build + restart):

```bash
npm run prod:deploy
```

## Environment Variables

- `PORT` default `3000`
- `HOST` default `0.0.0.0`
- `LINES` for `prod:logs` default `120`
- `FOLLOW` for `prod:logs` default `1` (`0` for non-follow mode)
