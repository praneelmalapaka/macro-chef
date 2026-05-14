#!/usr/bin/env bash

# Source this file before running Flutter commands in this repo:
# source scripts/flutter-env.sh

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

export JAVA_HOME="${JAVA_HOME:-$HOME/.jdks/ms-21.0.10}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PUB_CACHE="${PUB_CACHE:-$REPO_ROOT/.tools/pub-cache}"
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$REPO_ROOT/.tools/gradle}"

mkdir -p "$PUB_CACHE" "$GRADLE_USER_HOME"

case ":$PATH:" in
  *":$JAVA_HOME/bin:"*) ;;
  *) export PATH="$JAVA_HOME/bin:$PATH" ;;
esac

case ":$PATH:" in
  *":$ANDROID_HOME/platform-tools:"*) ;;
  *) export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH" ;;
esac

if [ -d "$REPO_ROOT/.tools/flutter/bin" ]; then
  case ":$PATH:" in
    *":$REPO_ROOT/.tools/flutter/bin:"*) ;;
    *) export PATH="$REPO_ROOT/.tools/flutter/bin:$PATH" ;;
  esac
elif [ -d "$HOME/development/flutter/bin" ]; then
  case ":$PATH:" in
    *":$HOME/development/flutter/bin:"*) ;;
    *) export PATH="$HOME/development/flutter/bin:$PATH" ;;
  esac
fi

echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_HOME"
echo "PUB_CACHE=$PUB_CACHE"
echo "GRADLE_USER_HOME=$GRADLE_USER_HOME"
if command -v flutter >/dev/null 2>&1; then
  flutter --version
else
  echo "Flutter SDK not found. Install it to $REPO_ROOT/.tools/flutter or $HOME/development/flutter, or add flutter/bin to PATH."
fi
