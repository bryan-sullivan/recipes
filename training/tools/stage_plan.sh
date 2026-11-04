#!/usr/bin/env bash
# One safe local step from an APPROVED Obsidian Plan.md to an inspectable Git diff.
# NEVER edits the vault, commits, pushes, or uploads personal metrics.
set -euo pipefail

if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo "Usage: bash training/tools/stage_plan.sh '/path/to/Obsidian vault/Health Journey/Plan.md'" >&2
  exit 2
fi

SOURCE="$1"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
TARGET="$REPO/training/plan.json"

if ! git -C "$REPO" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run from a local checkout of the recipes GitHub repository." >&2
  exit 2
fi
if [[ ! -f "$TARGET" ]]; then
  echo "Missing previously published plan.json. Cannot preserve history." >&2
  exit 2
fi
if [[ -n "$(git -C "$REPO" status --porcelain -- training/plan.json)" ]]; then
  echo "You have uncommitted plan.json changes. Review/resolve these before running the publisher." >&2
  exit 2
fi

echo "Checking whether the reviewed Obsidian training plan differs from the website..."
if python3 "$REPO/training/tools/export_plan.py" "$SOURCE" --check "$TARGET"; then
  echo "Already aligned. No edits or upload needed."
  exit 0
else
  RESULT=$?
  if [[ $RESULT -ne 1 ]]; then
    echo "Safety check failed (code $RESULT); nothing changed." >&2
    exit "$RESULT"
  fi
fi

echo "Running privacy, date-range, and history regression checks..."
python3 -m unittest discover -s "$REPO/training/tools" -p 'test_*.py' -v
python3 "$REPO/training/tools/export_plan.py" "$SOURCE" --output "$TARGET"
git -C "$REPO" diff --check -- training/plan.json

echo
echo "=== REVIEW THE CHANGES BELOW: workout-only JSON, no personal logs ==="
git -C "$REPO" diff --stat -- training/plan.json
git -C "$REPO" diff -- training/plan.json

echo
echo "The updated plan is STAGED FOR REVIEW ONLY, not committed or published."
echo "Review and approve the changes before committing and pushing plan.json to GitHub."
