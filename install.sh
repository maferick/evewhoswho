#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$REPO_ROOT/app"

if [[ ! -d "$APP_DIR" ]]; then
  echo "Error: app directory not found at $APP_DIR" >&2
  exit 1
fi

if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  source /etc/os-release
  DISTRO="${NAME:-unknown}"
  VERSION="${VERSION_ID:-unknown}"
else
  DISTRO="unknown"
  VERSION="unknown"
fi

if [[ "$DISTRO" != "Ubuntu" || "$VERSION" != "24.04" ]]; then
  echo "Warning: this installer targets Ubuntu 24.04 (detected: $DISTRO $VERSION)."
fi

if [[ $EUID -eq 0 ]]; then
  SUDO=()
else
  SUDO=(sudo)
fi

echo "==> Installing system prerequisites"
"${SUDO[@]}" apt-get update
"${SUDO[@]}" apt-get install -y ca-certificates curl gnupg git

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/^v//' | cut -d. -f1)" -lt 20 ]]; then
  echo "==> Installing Node.js 20.x"
  curl -fsSL https://deb.nodesource.com/setup_20.x | "${SUDO[@]}" env bash -
  "${SUDO[@]}" apt-get install -y nodejs
else
  echo "==> Node.js already installed: $(node -v)"
fi

echo "==> Installing npm dependencies"
cd "$APP_DIR"
npm install

cd "$REPO_ROOT"
if [[ ! -f "$REPO_ROOT/.env" ]]; then
  echo "==> Creating .env from .env.example"
  cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
else
  echo "==> .env already exists, leaving it untouched"
fi

mkdir -p "$REPO_ROOT/data"

echo ""
echo "Installation complete."
echo "Next steps:"
echo "  1) Edit $REPO_ROOT/.env with your real values (SESSION_SECRET and EVE SSO settings)."
echo "  2) Start the app: cd $APP_DIR && npm run dev"
