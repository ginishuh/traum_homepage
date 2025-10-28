#!/usr/bin/env bash
set -euo pipefail

# GitHub Actions secrets setup helper
# - Requires: gh (GitHub CLI) authenticated: `gh auth login --web --scopes repo,workflow`
# - Usage:   ./traum_blog/scripts/gh_set_secrets.sh [owner/repo]

REPO="${1:-ginishuh/traum_homepage}"
# 반드시 실제 VPS 공인 IP로 교체하세요. 예: 203.0.113.10 (샘플)
# NOTE: 이 값은 예시일 뿐이며, 그대로 실행하면 잘못된 Secrets가 설정됩니다.
DEPLOY_HOST_DEFAULT="서버_IP"
DEPLOY_USER_DEFAULT="root"
DEPLOY_SSH_PORT_DEFAULT="22"
KEY_FILE_DEFAULT="/root/.ssh/gh_actions_trr"

DEPLOY_HOST="${DEPLOY_HOST:-$DEPLOY_HOST_DEFAULT}"
DEPLOY_USER="${DEPLOY_USER:-$DEPLOY_USER_DEFAULT}"
DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-$DEPLOY_SSH_PORT_DEFAULT}"
KEY_FILE="${KEY_FILE:-$KEY_FILE_DEFAULT}"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh not found. Install GitHub CLI first." >&2
  exit 1
fi

echo "Checking gh auth…"
if ! gh auth status >/dev/null 2>&1; then
  echo "gh not authenticated. Run: gh auth login --web --scopes repo,workflow" >&2
  exit 1
fi

# Set default repo
gh repo set-default "$REPO"
echo "Using repo: $REPO"

umask 077
if [ ! -f "$KEY_FILE" ]; then
  echo "Key file not found: $KEY_FILE" >&2
  exit 1
fi

echo "Setting repository secrets…"
gh secret set DEPLOY_HOST     -b "$DEPLOY_HOST"
gh secret set DEPLOY_USER     -b "$DEPLOY_USER"
gh secret set DEPLOY_SSH_PORT -b "$DEPLOY_SSH_PORT"
gh secret set DEPLOY_SSH_KEY   < "$KEY_FILE"

echo "Secrets set. (DEPLOY_HOST/USER/PORT/SSH_KEY)"
echo "Optional: shred private key on server if you don't want to keep a copy:"
echo "  shred -u $KEY_FILE"
