#!/usr/bin/env bash
#
# Verifies the frontend deploy workflow honours the spec's deployment gating, without running it:
#   - MANUAL only: on: has workflow_dispatch and NO push/pull_request auto-trigger (req 9, AC 7)
#   - the deploy gate is the build (tsc -b && vite build); it runs NO tests and NO standalone
#     ESLint (req 10, AC 8) — a failing test/lint therefore cannot block a deploy
#   - it builds with VITE_API_URL (the deployed backend URL) and deploys to Cloudflare Pages
#   - neither retired interim gate (the backend edge gate, nor the front-door Basic-Auth gate) is
#     present in any tracked non-doc file (spec: retire-interim-gates-and-data-recovery.md — lives in
#     the backend repo, not this one's specs/ — req 3-4 / AC 2, 4)
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

if grep -qE '^concurrency:' "$WF"; then
	ok "concurrency guard present (overlapping manual runs queue)"
else
	bad "no concurrency guard — overlapping manual deploys can race"
fi

# Neither retired interim gate's header/variable names, nor the front-door gate's own mechanism
# files, may appear in any tracked non-doc file (spec: retire-interim-gates-and-data-recovery.md,
# req 4 / AC 4). Needles built from split literals at runtime, matching the backend's
# deploy/verify-edge-gate-retired.sh, so this check does not itself fail the moment it is committed.
# --cached reads the git INDEX, not the worktree — this and the tracked-file checks below must agree
# on what "tracked" means, or a mid-edit run (content edited on disk, not yet staged) gives two
# different, confusing answers about the same repo state. `git add` before running this script to
# check what would actually be committed; that's the only state that matters once this ships.
BACKEND_GATE_HEADER="X-Api""-Gate"
BACKEND_GATE_KEY_VAR="VITE_API_GATE""_KEY"
FRONT_DOOR_USER_VAR="GATE""_USER"
FRONT_DOOR_PASS_VAR="GATE""_PASSWORD"

grep_status=0
git grep -qiIF \
	-e "$BACKEND_GATE_KEY_VAR" -e "$BACKEND_GATE_HEADER" \
	-e "$FRONT_DOOR_USER_VAR" -e "$FRONT_DOOR_PASS_VAR" \
	--cached -- ':/' ':!/*.md' >/dev/null 2>&1 || grep_status=$?
if [ "$grep_status" = "0" ]; then
	bad "a tracked (non-doc) file still references a retired gate's header or variable name:"
	git grep -niIF \
		-e "$BACKEND_GATE_KEY_VAR" -e "$BACKEND_GATE_HEADER" \
		-e "$FRONT_DOOR_USER_VAR" -e "$FRONT_DOOR_PASS_VAR" \
		--cached -- ':/' ':!/*.md' >&2 || true
elif [ "$grep_status" = "1" ]; then
	ok "no tracked file (outside docs) references either retired gate's header or variable name"
else
	bad "the static scan could not run (git grep exited $grep_status) — treat as unverified, not clean"
fi

# `git ls-files` (not --error-unmatch) lists tracked paths under the pathspec with no output at all,
# rather than a special exit code, when nothing matches — so "found nothing" and "genuine error" are
# told apart by exit status while "found something" is told apart by non-empty output, and no case
# collapses into another. The whole functions/ DIRECTORY is checked, not just the one filename it
# used to contain: every file under functions/ is a Cloudflare Pages Function by Cloudflare's own
# convention, so a re-introduction under a different name or extension (functions/_middleware.ts,
# functions/[[path]].js, …) is exactly as much a re-introduction of the gate as the original filename
# would be, and a filename-only check would miss it.
ls_status=0
functions_tracked="$(git ls-files -- functions/ 2>&1)" || ls_status=$?
if [ "$ls_status" != "0" ]; then
	bad "could not check whether functions/ is tracked (git ls-files exited $ls_status) — treat as unverified, not clean"
elif [ -n "$functions_tracked" ]; then
	bad "functions/ still contains tracked files (the front-door gate's mechanism) — AC 4 requires it gone:"
	printf '%s\n' "$functions_tracked" | sed 's/^/    /' >&2
else
	ok "functions/ contains no tracked files (the front-door gate's mechanism is gone)"
fi

ls_status=0
helper_tracked="$(git ls-files -- test/gate.test.js 2>&1)" || ls_status=$?
if [ "$ls_status" != "0" ]; then
	bad "could not check whether test/gate.test.js is tracked (git ls-files exited $ls_status) — treat as unverified, not clean"
elif [ -n "$helper_tracked" ]; then
	bad "test/gate.test.js (the front-door gate's own test helper) is still tracked — AC 4 requires it gone"
else
	ok "the front-door gate's test helper (test/gate.test.js) is no longer tracked"
fi

echo ""
echo "passed: $pass  failed: $fail"
[ "$fail" -eq 0 ]
