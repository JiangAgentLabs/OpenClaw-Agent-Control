#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LOG_FILE="$ROOT_DIR/.run/agent-monitor-ui.log"
LINES="${LINES:-120}"
FOLLOW="${FOLLOW:-1}"

mkdir -p "$ROOT_DIR/.run"
touch "$LOG_FILE"

if [[ "$FOLLOW" == "1" ]]; then
  tail -n "$LINES" -f "$LOG_FILE"
else
  tail -n "$LINES" "$LOG_FILE"
fi
