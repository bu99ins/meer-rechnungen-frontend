#!/usr/bin/env bash
#
# Verifies the frontend deploy workflow honours the spec's deployment gating, without running it:
#   - MANUAL only: on: has workflow_dispatch and NO push/pull_request auto-trigger (req 9, AC 7)
#   - the deploy gate is the build (tsc -b && vite build); it runs NO tests and NO standalone
#     ESLint (req 10, AC 8) — a failing test/lint therefore cannot block a deploy
#   - it builds with VITE_API_URL (the deployed backend URL) and deploys to Cloudflare Pages
#
# Usage: deploy/verify-frontend-workflow.sh
set -euo pipefail

cd "$(dirname "$0")/.."
WF=.github/workflows/deploy-frontend.yml

pass=0
fail=0
ok()  { echo "  ok   - $1"; pass=$((pass + 1)); }
bad() { echo "  FAIL - $1" >&2; fail=$((fail + 1)); }

[ -f "$WF" ] || { echo "FAIL: $WF not found" >&2; exit 1; }

# Only the top-level on: block, so a `push:` elsewhere isn't mistaken for a trigger.
on_block="$(awk '
	/^on:/ { inon = 1; print; next }
	inon && /^[A-Za-z_"]/ { inon = 0 }
	inon { print }
' "$WF")"
body="$(sed 's/#.*//' "$WF")" # executed content only (comments stripped)

if printf '%s\n' "$on_block" | grep -qE '(^|[^_])workflow_dispatch:'; then
	ok "manual trigger present (workflow_dispatch)"
else
	bad "no workflow_dispatch trigger — the deploy must be manually triggered"
fi

if printf '%s\n' "$on_block" | grep -qE '^[[:space:]]*(push|pull_request):'; then
	bad "on: has a push/pull_request auto-trigger — deploy must be manual only"
else
	ok "no push/pull_request auto-trigger (manual-only deploy)"
fi

if printf '%s\n' "$body" | grep -qE 'npm run build|vite build|tsc'; then
	ok "build gate present (tsc -b && vite build)"
else
	bad "no build gate (npm run build) found"
fi

if printf '%s\n' "$body" | grep -qiE 'npm[[:space:]]+(run[[:space:]]+(test|lint)|test)|node[[:space:]]+--test|eslint'; then
	bad "workflow runs tests/ESLint — these must NOT gate the deploy (build is the gate)"
else
	ok "no test/ESLint gate (build is the only deploy gate)"
fi

if printf '%s\n' "$body" | grep -qE 'VITE_API_URL'; then
	ok "builds with VITE_API_URL (deployed backend URL)"
else
	bad "build does not set VITE_API_URL — the deployed app would not reach the backend"
fi

if printf '%s\n' "$body" | grep -qiE 'wrangler|pages deploy'; then
	ok "deploys to Cloudflare Pages"
else
	bad "no Cloudflare Pages deploy step found"
fi

if printf '%s\n' "$body" | grep -q -- '--project-name'; then
	ok "Cloudflare Pages project name supplied"
else
	bad "no --project-name for the Pages deploy"
fi

if [ -d functions ] && ls functions/_middleware.* >/dev/null 2>&1; then
	ok "edge gate present (functions/_middleware)"
else
	bad "no functions/_middleware gate found — the frontend would deploy ungated"
fi

if grep -qE '^concurrency:' "$WF"; then
	ok "concurrency guard present (overlapping manual runs queue)"
else
	bad "no concurrency guard — overlapping manual deploys can race"
fi

# The retired backend edge gate's header name and build/secret variable name must not appear in any
# tracked non-doc file (spec: specs/retire-interim-gates-and-data-recovery.md, req 4 / AC 4). Built
# from split literals at runtime, matching the backend's deploy/verify-edge-gate-retired.sh, so this
# check does not itself fail the moment it is committed. This asserts only the settled half of AC 4 —
# the header/variable-name clause, which will not change again. The front-door-middleware clause above
# (":72-75") is the other half and is intentionally NOT covered here: it currently asserts the
# middleware IS present, and a later increment retiring it will invert that check, not this one.
GATE_HEADER="X-Api""-Gate"
GATE_KEY_VAR="VITE_API_GATE""_KEY"

grep_status=0
git grep -qiIF -e "$GATE_KEY_VAR" -e "$GATE_HEADER" -- ':/' ':!/*.md' >/dev/null 2>&1 || grep_status=$?
if [ "$grep_status" = "0" ]; then
	bad "a tracked (non-doc) file still references the retired backend edge gate's header or variable name:"
	git grep -niIF -e "$GATE_KEY_VAR" -e "$GATE_HEADER" -- ':/' ':!/*.md' >&2 || true
elif [ "$grep_status" = "1" ]; then
	ok "no tracked file (outside docs) references the retired backend edge gate's header or variable name"
else
	bad "the static scan could not run (git grep exited $grep_status) — treat as unverified, not clean"
fi

echo ""
echo "passed: $pass  failed: $fail"
[ "$fail" -eq 0 ]
