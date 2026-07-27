#!/usr/bin/env bash
# root.sh - single source of truth for the skill's repo-root-relative paths
#
# This file lives at <repo-root>/skills/cli-tools/scripts/lib/root.sh.
# Every other script needs the catalog directory, which lives at
# <repo-root>/catalog - three levels above scripts/. Computing that offset
# ad hoc in every script (as `$DIR/../catalog`) is what caused the catalog
# to silently resolve to a nonexistent directory after the scripts were
# moved under skills/cli-tools/. Source this file instead of recomputing
# the path locally.

SKILL_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_SCRIPTS_DIR="$(cd "$SKILL_LIB_DIR/.." && pwd)"
SKILL_ROOT="$(cd "$SKILL_SCRIPTS_DIR/../../.." && pwd)"
CATALOG_DIR="$SKILL_ROOT/catalog"
