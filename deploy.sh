#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# LuxAura Deploy Script
# Usage:  ./deploy.sh "your commit message"
# Run from inside the project folder — stages ONLY project files.
# ─────────────────────────────────────────────────────────────────

set -e  # exit immediately on any error

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

MSG="${1:-chore: update}"

echo ""
echo "▶ TypeScript check..."
npx tsc --noEmit 2>&1 | head -20
echo "  ✓ TS check complete"

echo ""
echo "▶ Staging project files..."
# 'git add .' from inside the project folder — stages ONLY this folder, never the home dir
git add .
echo "  ✓ Staged"

echo ""
echo "▶ Committing: \"$MSG\""
git commit -m "$MSG" || { echo "  Nothing to commit."; exit 0; }

echo ""
echo "▶ Pushing to origin/master..."
git push
echo ""
echo "  ✅ Done — Vercel will deploy in ~1-2 min."
echo ""
