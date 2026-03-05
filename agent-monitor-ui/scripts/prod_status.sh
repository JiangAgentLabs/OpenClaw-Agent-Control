#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PID_FILE="$ROOT_DIR/.run/agent-monitor-ui.pid"
HOST="${HOST:-127.0.0.1}"
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

PID=""
if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
fi

if [[ -z "${PID:-}" ]] || ! kill -0 "$PID" 2>/dev/null; then
  PID="$(get_port_pid || true)"
  if [[ -n "${PID:-}" ]]; then
    mkdir -p "$ROOT_DIR/.run"
    echo "$PID" >"$PID_FILE"
  else
    echo "status: stopped"
    exit 1
  fi
fi

HTTP_STATUS="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://$HOST:$PORT" || true)"
if [[ "$HTTP_STATUS" == "200" ]]; then
  echo "status: running (pid=$PID, url=http://$HOST:$PORT, http=$HTTP_STATUS)"
  exit 0
fi

echo "status: running (pid=$PID), health-check failed (http=$HTTP_STATUS)"
exit 2
