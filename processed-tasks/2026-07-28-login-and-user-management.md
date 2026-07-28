# Completion record — login and user management

- **Spec:** `specs/login-and-user-management.md`
- **Verdict:** Accepted — 21 of 21 non-blocked acceptance criteria met. Criteria 22–26 (password
  management) remain blocked: the backend endpoint they depend on
  (`POST /api/users/{userId}/password`) does not exist yet, confirmed by re-checking the backend
  source at the end of the work. Criterion 25 (no dead password field until the endpoint exists)
  is the one that currently holds, exactly as the spec anticipates.
- **Branch:** `spec/login-and-user-management`, 5 commits on top of the pre-existing spec commit
  `675a56b`. PR: https://github.com/bu99ins/meer-rechnungen-frontend/pull/4 (open at acceptance
  time).
- **Mechanism:** `RequireAuth`/`RequireAdmin` route guards; session tokens held in
  `src/lib/session.ts` (localStorage, outside React so the axios interceptor in `src/lib/api.ts`
  can read them synchronously); silent renewal on 401 via `POST /api/users/refresh`, single-
  flighted, decision logic factored into `src/lib/refreshDecision.js`; Admin-only Users area
  (`src/pages/users/`) for create/look-up/edit/role-set/delete, keyed off the `role` claim in the
  JWT.

## Acceptance criteria — evidence

1. **R1 — full gate.** With storage cleared, `/`, `/invoices`, `/customers/new`, `/invoices/<id>`,
   and `/users` each rendered only the login form — no nav chrome, no entity data.
2. **R3 — redirect to originally-requested route.** Signed in from `/customers/new` → landed back
   on `/customers/new` (router state carried the origin); signed in from `/` → `/invoices`.
3. **R4 — admin reaches real data.** `admin@test.com`/`Test1234!` → `/invoices` showing 3 real
   backend rows, captured from the actual `GET /api/invoices` response body.
4. **R5 — rejected credentials.** Wrong password → backend 400 → "Invalid email or password" on
   screen, no navigation; reload afterward still showed the login form (no session established).
5. **R7 — no self-service links.** Login screen's full text is exactly heading, email, password,
   submit — no sign-up or forgot-password link, before or after a failed attempt.
6. **R8 — both headers on every call.** A monkey-patched `XMLHttpRequest.setRequestHeader`
   captured a real `Authorization: Bearer <jwt>` on an in-app request; `X-Api-Gate` is unset (no-op)
   locally per existing behavior, unchanged by this work.
7. **R2 — no dev bypass.** `npm run dev` gates identically to a build; the only `import.meta.env`
   reads in `src/` are `VITE_API_URL`/`VITE_API_GATE_KEY` in `main.tsx`, neither touching gating; no
   `DEV`/`MODE` branch exists anywhere.
8. **R10 — silent renewal.** An access token re-signed client-side (same claims, past `exp`, HMAC-
   SHA256 with the backend's own committed dev placeholder key) but a still-valid refresh token →
   exactly one `POST /api/users/refresh` → 200 → retried request succeeded (404 on a nonexistent
   user id, i.e. auth passed). Three concurrent 401s produced exactly one refresh call. A
   `MutationObserver` spanning the whole exchange never saw the login screen's text render.
9. **R11 — distinguishable session-ended message.** A structurally broken access token (signature
   no longer valid) → refresh 400 → both tokens cleared → login screen shows "Your session ended.
   Please sign in again.", textually distinct from criterion 4's message.
10. **R9 — restart survival.** A brand-new browser tab (fresh JS context, shared localStorage)
    navigated straight to `/invoices` and rendered real data with no re-login.
11. **R13/R14 — identity, sign-out, no data after Back.** Header shows the signed-in email at both
    narrow and desktop viewports (a viewport-hidden bug was found and fixed during review); sign-out
    clears the session and lands on `/login`; Back afterward stayed on the login screen.
12. **R15 — Admin-only area.** Signed in as `manager@test.com`: no "Users" nav entry;
    `/users` and `/users/new` both redirected to `/invoices` on direct entry.
13. **R16 — landing screen shape.** `/users` renders exactly a create action and a look-up-by-ID
    form — no table, no list.
14. **R17/R19 — create then look up.** Created a user (role Manager) via the real form, got back an
    ID; pasted that ID into the real look-up form and got back the same email.
15. **R18 — fixed role set.** The role `<select>` (create screen and role-change screen) offers
    exactly `Admin` and `Manager`, sourced from one exported constant (`ROLES`); no free-text role
    input exists anywhere.
16. **R19 — role-not-shown statement.** The look-up result always renders "The API does not return
    this user's current role, so it is not shown here."
17. **R20 — edit/role/delete on another user.** Changed a user's email and confirmed it on a
    completely separate, fresh look-up (new navigation, new `GET`); set a role and got a success
    message matching what was actually submitted; deleted with a confirmation dialog first, then a
    fresh look-up of the same ID reported "not found".
18. **R21 — self-target refusal.** Looking up the signed-in admin's own ID rendered no role
    `<select>`, no "Set Role" button, and no "Delete User" button anywhere in the DOM — replaced
    with explanatory text — while the email panel remained usable (email is not restricted by R21).
19. **R28 — visible errors.** An invalid email on create was caught by native form validation
    (a visible on-screen message); looking up a nonexistent ID produced "User with ID … not found".
20. **R29 — unchanged entity behavior.** While signed in: created/edited/deleted a customer end to
    end (backend's pre-existing required-field validation surfaced correctly), and downloaded a
    real invoice PDF — all through the same gated session.
21. **Repo constraint — build/test gate.** `npm run build` (`tsc -b && vite build`) and `npm test`
    (30/30, `node --test`) were green after every increment; `deploy/verify-frontend-workflow.sh`
    stayed green throughout (deploy workflow untouched).
22. **R22 — admin-set password (blocked).** Not executable — backend endpoint does not exist.
23. **R24 — mismatched password fields prevent submission (blocked).** Not executable — no
    password field exists to test.
24. **R25 — policy-violation message (blocked).** Not executable — no password field exists.
25. **R23 — no dead password control (holds today).** Confirmed: no screen in the Users area
    presents any password input for an existing account.
26. **R26 — admin sets own password (blocked).** Not executable — backend endpoint does not exist.

## Loop history

Four gates per increment, in order: (1) TDD failing-test-first; (2) architecture check against
`CLAUDE.md`/`docs/`; (3) Opus subagent clean-code review, findings fixed inline; (4) Opus subagent
scholastic spec-compliance check per relevant Acceptance Criterion. Gate 1 was narrowed before
increment 1 began: the spec's own implementation notes state the repo's `node --test` setup cannot
exercise TSX/DOM/localStorage code and forbid adding a new test framework, so real TDD applied only
to pure, framework-free logic; everything React/DOM-coupled substituted Gate 4 manual browser
verification for Gate 1, agreed with the user up front.

- **Increment 1 — gate + sign-in (deliberately the smallest, a probe).** Gate 1: `src/lib/jwt.js`
  and `problem.js` written test-first (11 tests), green on first implementation. Gate 3: 9 findings
  (redundant post-login redirect/rethrow chain, duplicated `location.state` cast, misplaced type,
  stale docs, dead commented-out code, `subscribe()` wired inside the store factory, unnecessary
  `any` cast, unused exported types, non-string validation values) — all fixed in one pass, no
  second review. Gate 4: criteria 1–5, 7 all PASS on first check.
- **Increment 2 — identity + sign-out.** No pure logic to TDD (UI/DOM only). Gate 3: 2 findings
  (redundant `navigate()` call racing `RequireAuth`'s own redirect; long-email overflow) — fixed.
  Gate 4: found and fixed a real bug mid-review — the email span was hidden below the `sm` Tailwind
  breakpoint, violating R13's "no viewport carve-out"; re-verified at both viewport sizes, then
  criteria 10–11 PASS.
- **Increment 3 — silent renewal.** Gate 3 surfaced the most substantive findings of the whole
  task: the single-flight dedup only covered requests in flight *during* a refresh, not late
  arrivals with a stale token; a request that 401'd again *after* a successful refresh fell through
  with no session-clear; `catch { return false }` couldn't distinguish "refresh rejected" from
  "network blip"; the recursion guard was a fragile URL-substring match. Fixed by extracting the
  branching into `src/lib/refreshDecision.js` (TDD: 8 tests written first, then implemented, green)
  and rewiring `api.ts` around it. Gate 4 (criteria 8–9): passed, but the agent flagged that "no
  flicker to the login screen" had only been argued from code, not observed — closed with a
  `MutationObserver` spanning a real 401→refresh→retry cycle.
- **Increment 4 — Admin-only Users area.** No new pure logic (UI/routing). Gate 3: 10 findings
  (unguarded clipboard write, role set duplicated across 3 files with no compiler link, missing
  `autoComplete` on a create-other-user form, unencoded pasted ID, "Copied" state never resetting,
  loading state stuck on an unreachable branch, error dead-end with no way back, duplicated NavLink
  className, unchecked role cast) — fixed; `ROLES`/`isRole` collapsed to one source of truth in
  `src/types/user.ts`. Gate 4: the reviewing agent noted a numbering mismatch between the prompt and
  the spec's own criteria list (criterion 16, not 19, is R19's "role not shown" wording; criterion
  19 is R28) and that R28's error path had only been probed via direct API calls, not a real click
  — both closed by a real click-driven test (native email validation + a real "not found" lookup)
  before signing off.
- **Increment 5 — email/role/delete on a looked-up user.** No new pure logic. Gate 3: 6 findings —
  most importantly, per-action success/error state wasn't reset when the looked-up id changed (a
  stale "Role updated" banner could bleed onto a different user), the role `<select>` pre-selected
  `Manager` with no confirmation gate on a lock-out-capable action, and the role success message was
  derived from live (mutable) select state instead of what was actually submitted — all fixed. Gate
  4: criteria 17–18 PASS, verified with a real created/edited/role-set/deleted user and a real
  self-lookup.
- **Increment 6 — password panel.** Not started. Confirmed still blocked by re-grepping the backend
  source for a password-set endpoint at the end of the work; none exists.
- **Post-increment regression pass (not separately gated, added after increment 5).** Criterion 20
  (unchanged invoice/customer/sender behavior) had not yet been explicitly exercised; verified live
  — customer create/edit/delete and invoice PDF download all confirmed working while signed in.

## Plan vs. final

Initial plan (disposable HOW, written before increment 1): 6 increments matching the delivered
shape — gate+sign-in, chrome, silent renewal, Users landing+create, look-up+edit, password. Material
revisions:

- **Gate 1's scope was fixed before any code was written**, not discovered mid-course: pure logic
  (`jwt.js`, `problem.js`, later `refreshDecision.js`) is written as plain `.js` with a sibling
  `.d.ts` specifically so `node --test` can cover it without a new test framework, mirroring the
  existing `functions/_middleware.js` + `test/gate.test.js` pattern; React/DOM/session-storage code
  is verified manually (Gate 4) instead, per the spec's own stated constraint that the repo's test
  setup cannot exercise it.
- **`src/lib/refreshDecision.js` was not in the initial plan.** It was extracted mid-increment-3
  after the Gate 3 review found the single-flight/retry branching had no test coverage and several
  real edge-case gaps; extracting the decision logic as pure functions made both the fix and its
  test straightforward.
- **`ROLES`/`isRole` were added, removed, then re-added.** They shipped in increment 1's first draft,
  were removed after Gate 3 flagged them as unused at the time, and were reinstated in increment 4
  once the Users area actually consumed them — as a single source of truth (`as const` + derived
  union) rather than the three independent hardcodings the increment 4 review first produced.
- **The increment-4/5 split absorbed a numbering correction, not a scope change.** The plan's own
  text mapped criteria "16, 17, 18" to increment 5; the spec's actual Acceptance Criteria list has
  criterion 16 (role-not-shown) and criterion 19 (R28 error visibility) both naturally delivered by
  increment 4's read/lookup screen, with only 17–18 (edit/role/delete, self-refusal) landing in
  increment 5. Caught by a Gate 4 reviewing agent, corrected by verifying and closing 16 and 19
  within increment 4 rather than deferring them.
- **A regression check for criterion 20 was added after increment 5**, not planned as a separate
  increment — it surfaced as a gap only once all five increments were done and the acceptance-
  criteria list was reviewed end to end.
- **Operational friction, not a plan change:** the local backend's `invoice-builder` container
  wasn't running at the start of verification (only its `postgres`/`seq`/`jaeger` dependencies
  were, started under a different `docker compose` project name than this run produced); it had to
  be started and manually connected to the network those containers were actually on
  (`meer-rechnungen_docker-web`) before any live verification could proceed. No files changed; noted
  here so a future session isn't surprised by it.
- **Increment 6 not attempted**, exactly as the spec anticipates (requirement 23) — no code was
  written toward it because there is nothing on the backend for it to call yet.

## Changed files

Since the pre-existing spec commit `675a56b`, 5 commits on `spec/login-and-user-management`:

```
A  .claude/launch.json
M  CLAUDE.md
M  docs/api-contract.md
M  docs/known-issues-and-roadmap.md
M  src/App.tsx
M  src/components/Layout.tsx
A  src/components/RequireAdmin.tsx
A  src/components/RequireAuth.tsx
M  src/lib/api.ts
A  src/lib/jwt.js
A  src/lib/jwt.d.ts
A  src/lib/problem.js
A  src/lib/problem.d.ts
A  src/lib/refreshDecision.js
A  src/lib/refreshDecision.d.ts
A  src/lib/session.ts
A  src/pages/auth/LoginPage.tsx
A  src/pages/users/UserCreate.tsx
A  src/pages/users/UserLookup.tsx
A  src/pages/users/UsersHome.tsx
M  src/services/users.ts
A  src/store/authStore.ts
M  src/types/user.ts
A  test/jwt.test.js
A  test/problem.test.js
A  test/refreshDecision.test.js
A  processed-tasks/2026-07-28-login-and-user-management.md
```

## Acceptance

Accepted by **Yury Krasavin** on **2026-07-28** after random comprehension sampling of this
session's work and PR #4. No repair requests raised.
