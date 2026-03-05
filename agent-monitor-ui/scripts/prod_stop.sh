#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PID_FILE="$ROOT_DIR/.run/agent-monitor-ui.pid"
PORT="${PORT:-3000}"

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

if [[ ! -f "$PID_FILE" ]]; then
  PID="$(get_port_pid || true)"
  if [[ -z "${PID:-}" ]]; then
    echo "agent-monitor-ui is not running (pid file missing)"
    exit 0
  fi
  echo "pid file missing, stop by port pid=$PID"
else
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
fi

if [[ -z "${PID:-}" ]]; then
  rm -f "$PID_FILE"
  echo "agent-monitor-ui is not running (empty pid file)"
  exit 0
fi

if ! kill -0 "$PID" 2>/dev/null; then
  PORT_PID="$(get_port_pid || true)"
  if [[ -z "${PORT_PID:-}" ]]; then
    rm -f "$PID_FILE"
    echo "agent-monitor-ui is not running (stale pid=$PID)"
    exit 0
  fi
  echo "stale pid=$PID, stop by port pid=$PORT_PID"
  PID="$PORT_PID"
fi

kill "$PID" 2>/dev/null || true
for _ in $(seq 1 20); do
  if ! kill -0 "$PID" 2>/dev/null; then
    rm -f "$PID_FILE"
    echo "agent-monitor-ui stopped (pid=$PID)"
    exit 0
  fi
  sleep 0.3
done

kill -9 "$PID" 2>/dev/null || true
rm -f "$PID_FILE"
echo "agent-monitor-ui force stopped (pid=$PID)"
