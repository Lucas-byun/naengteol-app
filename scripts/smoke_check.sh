#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/5] JS syntax check"
node --check app-security.js
node --check app-pwa.js
node --check app-community.js
node --check app-recipe-ui.js
node --check app-onboarding.js
node --check app-about.js

echo "[2/5] Firebase rules JSON check"
python -m json.tool firebase_rules.json >/dev/null

echo "[3/5] Index module include check"
grep -q "firebase-auth-compat.js" index.html
echo "  - found firebase-auth-compat.js"
for f in app-security.js app-pwa.js app-community.js app-recipe-ui.js app-onboarding.js app-about.js; do
  grep -q "<script src=\"$f\"></script>" index.html
  echo "  - found $f"
done

echo "[4/5] Index module marker check"
grep -q "ONBOARDING MODULE: moved to app-onboarding.js" index.html
grep -q "ABOUT MODULE: moved to app-about.js" index.html
grep -q "PWA MODULE: moved to app-pwa.js" index.html
grep -q "COMMUNITY MODULE: moved to app-community.js" index.html
grep -q "RECIPE UI MODULE: moved to app-recipe-ui.js" index.html
echo "  - all markers found"

echo "[5/5] Security guardrail check"
if rg -n "localStorage\\.getItem\\('nt_admin'\\)==='1'" app-community.js index.html >/dev/null; then
  echo "❌ raw nt_admin flag check found (use isAdminSession())"
  exit 1
fi
echo "  - no raw nt_admin flag checks in UI modules"

echo "Smoke checks passed."
