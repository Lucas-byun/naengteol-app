cat > scripts/smoke_check.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/7] JS syntax check"
node --check app-security.js
node --check app-pwa.js
node --check app-community.js
node --check app-recipe-ui.js
node --check app-onboarding.js
node --check app-about.js

echo "[2/7] Firebase rules JSON check"
python -m json.tool firebase_rules.json >/dev/null

echo "[3/7] Index module include check"
grep -q "firebase-auth-compat.js" index.html
echo "  - found firebase-auth-compat.js"
for f in app-security.js app-pwa.js app-community.js app-recipe-ui.js app-onboarding.js app-about.js; do
  grep -q "<script src=\"$f\"></script>" index.html
  echo "  - found $f"
done

echo "[4/7] Index module marker check"
grep -q "ONBOARDING MODULE: moved to app-onboarding.js" index.html
grep -q "ABOUT MODULE: moved to app-about.js" index.html
grep -q "PWA MODULE: moved to app-pwa.js" index.html
grep -q "COMMUNITY MODULE: moved to app-community.js" index.html
grep -q "RECIPE UI MODULE: moved to app-recipe-ui.js" index.html
echo "  - all markers found"

echo "[5/7] Security guardrail check"
if grep -nE "localStorage\\.getItem\\('nt_admin'\\)==='1'" app-community.js index.html >/dev/null; then
  echo "❌ raw nt_admin flag check found (use isAdminSession())"
  exit 1
fi
echo "  - no raw nt_admin flag checks in UI modules"

echo "[6/7] optIng 진단 호환성 체크"
grep -q "window.NT_APP_API.diagApiVersion=2;" app-data.js
echo "  - found diagApiVersion=2 export"
grep -q "window.NT_APP_API.runOptIngLinkCheck=runOptIngLinkCheck;" app-data.js
echo "  - found runOptIngLinkCheck API export"
grep -q "function triggerOptIngCheck()" index.html
echo "  - found triggerOptIngCheck wrapper"
if grep -nE "onclick=\\\"triggerOptIngCheck\\(\\)\\\"" index.html app-admin.js >/dev/null; then
  echo "  - admin button uses triggerOptIngCheck()"
else
  echo "❌ admin button triggerOptIngCheck() wiring not found"
  exit 1
fi

echo "[7/7] 재료목록 자동 업로드 훅 체크"
grep -q "action:'syncIngredients'" app-admin.js
echo "  - found syncIngredients client action"
grep -q "action === 'syncIngredients'" apps_script_v5.gs
echo "  - found syncIngredients server action"

echo "Smoke checks passed."
EOF

chmod +x scripts/smoke_check.sh
./scripts/smoke_check.sh