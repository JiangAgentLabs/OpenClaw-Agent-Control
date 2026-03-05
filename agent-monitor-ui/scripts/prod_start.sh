#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RUN_DIR="$ROOT_DIR/.run"
PID_FILE="$RUN_DIR/agent-monitor-ui.pid"
LOG_FILE="$RUN_DIR/agent-monitor-ui.log"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"
FORCE_KILL_PORT="${FORCE_KILL_PORT:-0}"
NEXT_BIN="$ROOT_DIR/node_modules/.bin/next"

get_port_pid() {
  ss -ltnp 2>/dev/null | awk -v port=":$PORT" '
    $4 ~ port"$" {
      if (match($0, /pid=[0-9]+/)) {
        pid = substr($0, RSTART + 4, RLENGTH - 4)
        print pid
        exit
      }
    }
  '
}

mkdir -p "$RUN_DIR"

if [[ ! -x "$NEXT_BIN" ]]; then
  echo "next binary not found: $NEXT_BIN"
  echo "run: npm install"
  exit 1
fi

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${OLD_PID:-}" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "agent-monitor-ui is already running (pid=$OLD_PID, port=$PORT)"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

EXISTING_PID="$(get_port_pid || true)"
if [[ -n "${EXISTING_PID:-}" ]]; then
  if [[ "$FORCE_KILL_PORT" == "1" ]]; then
    echo "port $PORT is busy by pid=$EXISTING_PID, killing it (FORCE_KILL_PORT=1)"
    kill "$EXISTING_PID" 2>/dev/null || true
    sleep 1
  else
    echo "port $PORT is already in use by pid=$EXISTING_PID"
    echo "set FORCE_KILL_PORT=1 to replace the old process"
    exit 1
  fi
fi

nohup "$NEXT_BIN" start -H "$HOST" -p "$PORT" >>"$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" >"$PID_FILE"

sleep 1
if ! kill -0 "$NEW_PID" 2>/dev/null; then
  echo "failed to start agent-monitor-ui, check log: $LOG_FILE"
  tail -n 80 "$LOG_FILE" || true
  exit 1
fi

echo "agent-monitor-ui started (pid=$NEW_PID, host=$HOST, port=$PORT)"
