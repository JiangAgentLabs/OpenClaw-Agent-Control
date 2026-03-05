#!/usr/bin/env bash
set -euo pipefail

SKILL_ZIP="${SKILL_ZIP:-/root/skill-packages/openclaw-agent-control-skill.zip}"
TARGET_DIR="${TARGET_DIR:-/root/.openclaw/skills/openclaw-agent-control}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

if [[ ! -f "$SKILL_ZIP" ]]; then
  echo "[skill:install] skill zip not found: $SKILL_ZIP"
  echo "[skill:install] set SKILL_ZIP=/path/to/openclaw-agent-control-skill.zip"
  exit 1
fi

mkdir -p "$(dirname "$TARGET_DIR")"
rm -rf "$TARGET_DIR"

unzip -q "$SKILL_ZIP" -d "$TMP_DIR"

# Expected package root: openclaw-agent-control-skill/
SRC_DIR="$TMP_DIR/openclaw-agent-control-skill"
if [[ ! -d "$SRC_DIR" ]]; then
  echo "[skill:install] invalid package structure (missing openclaw-agent-control-skill/)"
  exit 1
fi

cp -R "$SRC_DIR" "$TARGET_DIR"

echo "[skill:install] installed to: $TARGET_DIR"
echo "[skill:install] run deploy: bash $TARGET_DIR/scripts/deploy_project.sh"
