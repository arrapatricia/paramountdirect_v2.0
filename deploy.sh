#!/usr/bin/env bash
# Fast-forward update + rebuild + redeploy for pd2-dev.paramount.com.ph.
# Run as the `ubuntu` account (never with sudo): `bash deploy.sh`
# See DEPLOYMENT.md section 9 for the full runbook this implements.
set -euo pipefail

PROJECT_DIR="${DEPLOY_PROJECT_DIR:-/home/ubuntu/paramountdirect_v2.0}"
BRANCH="pdv2_dev"

cd "$PROJECT_DIR"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use 24
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Refusing to deploy: working tree has local edits or untracked files." >&2
  git status --porcelain >&2
  exit 1
fi

current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$current_branch" != "$BRANCH" ]; then
  echo "Refusing to deploy: expected checkout on '$BRANCH', currently on '$current_branch'." >&2
  exit 1
fi

git fetch origin "$BRANCH"
git merge --ff-only "origin/$BRANCH"

(
  cd "$PROJECT_DIR/server"
  npm ci
  npm run prisma:generate
  npm run build
)

(
  cd "$PROJECT_DIR/paramountdirect_v2"
  npm ci
  npm run build
)

(
  cd "$PROJECT_DIR/server"
  npx prisma migrate deploy
)

pm2 restart pdv2-api pdv2-web

health_ok=false
for _ in 1 2 3 4 5; do
  if curl -fsS http://127.0.0.1:4000/health >/dev/null 2>&1; then
    health_ok=true
    break
  fi
  sleep 2
done

if [ "$health_ok" != "true" ]; then
  echo "API health check failed after restart - check 'pm2 logs pdv2-api'." >&2
  exit 1
fi

if ! curl -fsS -o /dev/null http://127.0.0.1:3000/; then
  echo "Frontend health check failed after restart - check 'pm2 logs pdv2-web'." >&2
  exit 1
fi

pm2 save

echo "Deploy complete: $BRANCH @ $(git rev-parse --short HEAD)"
