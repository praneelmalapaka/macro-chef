#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -z "${API_BASE_URL:-}" ]; then
  echo "API_BASE_URL is required. Example: API_BASE_URL=https://macrochef-api.onrender.com ./scripts/build-flutter-web.sh" >&2
  exit 1
fi

export PUB_CACHE="${PUB_CACHE:-$REPO_ROOT/.tools/pub-cache}"
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$REPO_ROOT/.tools/gradle}"
export HOME="${HOME_OVERRIDE:-$REPO_ROOT/.tools/home}"
export FLUTTER_SUPPRESS_ANALYTICS="${FLUTTER_SUPPRESS_ANALYTICS:-true}"
export DART_SUPPRESS_ANALYTICS="${DART_SUPPRESS_ANALYTICS:-true}"
mkdir -p "$PUB_CACHE" "$GRADLE_USER_HOME" "$HOME" "$REPO_ROOT/.tools"

if ! command -v flutter >/dev/null 2>&1; then
  if [ ! -x "$REPO_ROOT/.tools/flutter/bin/flutter" ]; then
    echo "[MacroChef] Flutter SDK not found; installing stable Flutter into .tools/flutter..."
    git clone --depth 1 --branch stable https://github.com/flutter/flutter.git "$REPO_ROOT/.tools/flutter"
  fi
  export PATH="$REPO_ROOT/.tools/flutter/bin:$PATH"
fi

cd "$REPO_ROOT/mobile"

flutter --version
flutter config --enable-web
flutter pub get
flutter build web --release --dart-define=API_BASE_URL="$API_BASE_URL"
