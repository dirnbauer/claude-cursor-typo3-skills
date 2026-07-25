#!/usr/bin/env bash
# Generic installer for package manager tools
# Installs tools via system package managers (apt, brew, etc.)
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
. "$DIR/lib/root.sh"
. "$DIR/lib/common.sh"
. "$DIR/lib/install_strategy.sh"

TOOL="${1:-}"
if [ -z "$TOOL" ]; then
  echo "Usage: $0 TOOL_NAME" >&2
  exit 1
fi

CATALOG_FILE="$CATALOG_DIR/$TOOL.json"
if [ ! -f "$CATALOG_FILE" ]; then
  echo "Error: Catalog file not found: $CATALOG_FILE" >&2
  exit 1
fi

# --- Input validation ---

# Allowed binaries for version commands (first word of a pipeline or command)
readonly ALLOWED_VERSION_BINARIES="awk cat cd cut docker dpkg entr git grep head jq python python3 ruby sed tail timeout tr uname uv wc which"

# Allowed package name pattern: alphanumeric, hyphens, underscores, dots, forward slashes
validate_package_name() {
  local pkg="$1"
  if [[ ! "$pkg" =~ ^[a-zA-Z0-9._/@:+-]+$ ]]; then
    echo "Error: Invalid package name: $pkg" >&2
    return 1
  fi
}

# Validate version_command: ensure all command words are in the allowlist
# Accepts pipes and common shell constructs, but every command must start
# with an allowed binary or the tool's own binary name.
validate_version_command() {
  local cmd="$1"
  local binary="$2"

  # Split on pipes and semicolons to get individual commands
  local IFS_SAVE="$IFS"
  local segment first_word
  while IFS= read -r segment; do
    # Trim leading whitespace
    segment="${segment#"${segment%%[![:space:]]*}"}"
    [ -z "$segment" ] && continue
    # Extract the first word (the command being run)
    first_word="${segment%% *}"
    # Strip any leading path (e.g., ~/.rbenv/plugins/ruby-build -> ruby-build)
    first_word="${first_word##*/}"
    # Check against allowlist or the tool's own binary
    if [ "$first_word" = "$binary" ]; then
      continue
    fi
    local allowed=false
    for bin in $ALLOWED_VERSION_BINARIES; do
      if [ "$first_word" = "$bin" ]; then
        allowed=true
        break
      fi
    done
    if ! $allowed; then
      echo "Error: version_command contains disallowed binary '$first_word'" >&2
      return 1
    fi
  done < <(echo "$cmd" | tr '|;' '\n')
  IFS="$IFS_SAVE"
}

# Run a version command safely using bash -c instead of eval
safe_version_check() {
  local cmd="$1"
  bash -c "$cmd" 2>/dev/null || true
}

# --- Parse catalog ---
BINARY_NAME="$(jq -r '.binary_name // .name' "$CATALOG_FILE")"
PACKAGES="$(jq -r '.packages // {}' "$CATALOG_FILE")"
NOTES="$(jq -r '.notes // empty' "$CATALOG_FILE")"
VERSION_CMD="$(jq -r '.version_command // empty' "$CATALOG_FILE")"

# Validate binary name
if [[ ! "$BINARY_NAME" =~ ^[a-zA-Z0-9._-]+$ ]]; then
  echo "Error: Invalid binary name: $BINARY_NAME" >&2
  exit 1
fi

# Validate version command if present
if [ -n "$VERSION_CMD" ]; then
  if ! validate_version_command "$VERSION_CMD" "$BINARY_NAME"; then
    echo "Error: Refusing to execute unsafe version_command for $TOOL" >&2
    exit 1
  fi
fi

# Get current version
if [ -n "$VERSION_CMD" ]; then
  before="$(safe_version_check "$VERSION_CMD")"
else
  # Default version detection
  before="$(command -v "$BINARY_NAME" >/dev/null 2>&1 && timeout 2 "$BINARY_NAME" --version </dev/null 2>/dev/null | head -1 || true)"
fi

# Check if tool is already available (e.g., comes with runtime)
if command -v "$BINARY_NAME" >/dev/null 2>&1; then
  if [ -n "$NOTES" ] && echo "$NOTES" | grep -q "comes with\|bundled with"; then
    # Tool is already available and comes bundled
    after="$before"
    path="$(command -v "$BINARY_NAME" 2>/dev/null || true)"
    printf "[%s] before: %s\n" "$TOOL" "${before:-<none>}"
    printf "[%s] after:  %s\n" "$TOOL" "${after:-<none>}"
    if [ -n "$path" ]; then printf "[%s] path:   %s\n" "$TOOL" "$path"; fi
    printf "[%s] note:   %s\n" "$TOOL" "Already available (bundled with runtime)"

    # Refresh snapshot to record current version
    refresh_snapshot "$TOOL" || true
    exit 0
  fi
fi

# Install via appropriate package manager
installed=false

if have brew; then
  pkg="$(echo "$PACKAGES" | jq -r '.brew // empty')"
  if [ "$pkg" != "null" ] && [ -n "$pkg" ]; then
    validate_package_name "$pkg" || exit 1
    brew install "$pkg" || brew upgrade "$pkg" || true
    installed=true
  fi
fi

if ! $installed && have apt-get; then
  pkg="$(echo "$PACKAGES" | jq -r '.apt // empty')"
  if [ "$pkg" != "null" ] && [ -n "$pkg" ]; then
    validate_package_name "$pkg" || exit 1
    sudo apt-get update && sudo apt-get install -y -- "$pkg" || true
    installed=true
  fi
fi

if ! $installed && have dnf; then
  pkg="$(echo "$PACKAGES" | jq -r '.dnf // .rpm // empty')"
  if [ "$pkg" != "null" ] && [ -n "$pkg" ]; then
    validate_package_name "$pkg" || exit 1
    sudo dnf install -y -- "$pkg" || true
    installed=true
  fi
fi

if ! $installed && have pacman; then
  pkg="$(echo "$PACKAGES" | jq -r '.pacman // .arch // empty')"
  if [ "$pkg" != "null" ] && [ -n "$pkg" ]; then
    validate_package_name "$pkg" || exit 1
    sudo pacman -S --noconfirm -- "$pkg" || true
    installed=true
  fi
fi

if ! $installed; then
  echo "[$TOOL] No supported package manager found (tried: brew, apt, dnf, pacman)" >&2
  exit 1
fi

# Report
if [ -n "$VERSION_CMD" ]; then
  after="$(safe_version_check "$VERSION_CMD")"
else
  # Default version detection
  after="$(command -v "$BINARY_NAME" >/dev/null 2>&1 && timeout 2 "$BINARY_NAME" --version </dev/null 2>/dev/null | head -1 || true)"
fi
path="$(command -v "$BINARY_NAME" 2>/dev/null || true)"
printf "[%s] before: %s\n" "$TOOL" "${before:-<none>}"
printf "[%s] after:  %s\n" "$TOOL" "${after:-<none>}"
if [ -n "$path" ]; then printf "[%s] path:   %s\n" "$TOOL" "$path"; fi

# Refresh snapshot after successful installation
# Need to source install_strategy.sh for refresh_snapshot function
. "$(dirname "${BASH_SOURCE[0]}")/../lib/install_strategy.sh"
refresh_snapshot "$TOOL" || true
