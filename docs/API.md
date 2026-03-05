# API Reference

## Base
- Default backend base URL: `http://127.0.0.1:8787`

## Endpoints

### `GET /`
Basic service index.

### `GET /dashboard`
Server-rendered dashboard page.

### `GET /api/status`
Returns aggregated status payload.

Key fields:
- `generated_at`
- `agent_count`
- `agent_execution[]`
- `subagent_execution[]`
- `recent_events[]`

### `GET /api/events`
Returns recent events list.

Query params:
- `limit` (int, optional)

### `GET /api/events/stream`
SSE stream for status/event updates.

## Frontend proxy endpoint
- `GET /api/monitor-status` (served by Next.js frontend)
- Reads backend from `MONITOR_API_BASE` (default `http://127.0.0.1:8787`)

## Status semantics
- `idle`: no task, normal
- `executing`: running
- `waiting`: queued, normal
- `stalled`: timed out, warning
- `blocked`: aborted/failed, error
