# Completion record — password reset + email lookup (follow-on to login-and-user-management)

- **Spec:** `specs/login-and-user-management.md` (updated in place by this change; see
  [Plan vs. final](#plan-vs-final) below). Prior record for increments 1–5:
  [2026-07-28-login-and-user-management.md](2026-07-28-login-and-user-management.md).
- **Trigger:** the backend gained three capabilities this round: `GET /api/users/{userId}` now
  returns `role` (previously `{Id, Email}` only); a new `GET /api/users?email=` resolves an email
  to `{Id}`; a new `POST /api/users/{userId}/password` sets a password without the old one —
  exactly the contract the prior record's spec had assumed and left blocked. The user asked to
  finish the now-unblocked password panel (increment 6) and add email-based lookup alongside the
  existing ID-based one.
- **Verdict:** Accepted — all 7 criteria in scope (16, 22–27) met; criterion 25 is explicitly
  superseded, as the spec itself now states. Increments 1–5's 21 criteria are unaffected and remain
  as recorded in the prior completion record; they were not re-verified in this round.
- **Branch:** `spec/login-and-user-management`, commit `5184121` on top of the prior record's
  `f20d1e3`. PR: https://github.com/bu99ins/meer-rechnungen-frontend/pull/4 (open, updated by this
  commit).

## Acceptance criteria — evidence

Only the criteria newly in scope this round (see spec's Acceptance Criteria section for full text).

16. **R19 — role shown.** Created a user, looked it up: page showed "Role / Manager" directly, no
    "API doesn't return role" disclaimer (that text no longer exists in the code). `LookedUpUser`
    is typed `{id, email, role: Role | null}`, sourced from `GET /api/users/{userId}`'s new
    `role` field.
22. **R22 — admin sets a password without the old one.** Set a new password on a created user via
    the real panel; signed out and back in with the new password (succeeded, reached `/invoices`);
    a raw call to `/api/users/login` with the old password returned 400 "Invalid email or
    password".
23. **R24 — mismatched fields block submission.** Entered two different values in the new-password
    fields on a non-self user: submit stayed disabled, and an inline "Passwords don't match."
    message appeared under the confirm field.
24. **R25 — policy violations surfaced.** Submitted `weak` in both password fields (they matched,
    so submit was enabled): the panel showed the exact backend messages ("Passwords must be at
    least 8 characters.", "...one non alphanumeric character.", "...one digit...", "...one
    uppercase...").
25. **Superseded, correctly.** The criterion's original text ("no screen presents a password field
    for an existing account") no longer holds by design — a functional panel now ships everywhere
    a looked-up user is shown. The spec marks this explicitly rather than silently dropping it.
26. **R26 — admin sets their own password.** On the admin's own record, the role/delete panels
    showed the lock-out explanation with no functional controls, but the password panel was
    present and worked: submitted a new password, `location.href` became `/login` immediately with
    the message "Your password was changed. Please sign in with the new password." — textually
    distinct from both the rejected-credentials message and the session-ended message from
    requirement 11. Signed back in with the new password and landed back on the same URL that was
    open before the forced sign-out. The seed password was restored afterward via the same panel
    for environment hygiene.
27. **R30 — email lookup.** Typed a known user's email into the new landing-screen field and
    submitted: browser navigated to `/users/{id}` and the correct record loaded (same id the
    earlier ID-based lookup had shown). Typed an unmatched email: URL stayed at `/users`, and the
    page showed "User with email nobody-here@example.com not found" with no navigation to a dead
    page.

## Loop history

No new pure logic was extracted this round (unlike `jwt.js`/`problem.js`/`refreshDecision.js` in
the earlier increments), so there was no TDD red/green cycle — all changes are type/service/UI
wiring against already-confirmed backend contracts, consistent with the rationale established
before increment 1 (real unit tests only for framework-free logic; everything else verified live).
The build/test gate, a clean-code review pass, and a spec-compliance check were still run:

- **Backend contract verification, done first.** Read the actual `.cs` source for
  `ResetUserPassword`, the updated `GetUserById`, and the new `GetUserByEmail` (route, request/
  response shapes, authorization policy, validators) before writing any frontend code, then
  confirmed each against the live container with `curl` (a weak-password reset attempt reproduced
  the exact validation-message shape assumed).
- **Two clarifying questions asked before implementing:** whether email search should replace or
  sit alongside ID search (chose alongside), and whether the accepted spec should be updated in
  place or left as history (chose update in place) — both per explicit user answers, not assumed.
- **Build/test gate:** `npm run build` and `npm test` (30/30) green on the first implementation
  pass and after every subsequent fix; `deploy/verify-frontend-workflow.sh` unaffected throughout.
- **Clean-code review (Opus subagent), one pass, all findings fixed:** the sign-out button's
  `onClick={logout}` would have passed the click `MouseEvent` into `logout`'s new optional `reason`
  parameter — caught before it shipped, fixed to `onClick={() => logout()}`; a self-password-reset
  logged the admin out with no way to tell them why (the success message was `!isSelf`-gated and
  dead-written otherwise) — fixed by widening `SessionEndedReason` to carry a `'password-changed'`
  value through to the login screen; `isSelf`'s fail-open (`!currentIdentity || …`) had started
  driving the logout decision itself, not just hiding controls — split into `identityUnknown` (for
  hiding) and a strict `isSelf` (for the logout trigger only); mismatched password fields disabled
  submission with no visible reason — added an inline error; `CreatedUser` was a misleading name
  for a type also used by the email-update response — renamed to `UserSummary`; the "Looked up by
  ID." subheading was stale once email lookup also landed on the same screen — updated.
- **Spec-compliance check (Opus subagent), scholastic method, one pass:** all 7 in-scope criteria
  passed. It flagged one spec-wording inaccuracy — criterion 25's citation "— R23 (historical)" was
  confusing once R23 became a live, non-historical requirement — fixed by rewording the citation
  rather than removing it.
- **Manual verification against the live backend**, not the deployed one: covered in Acceptance
  Criteria evidence above. Included restoring the admin seed password (`Test1234!`) after testing
  self-password-change, since that credential is documented in the spec's Acceptance Criteria
  preamble and the prior completion record.

## Plan vs. final

There was no separate written plan for this round (a direct implementation request, not a
plan-mode session); the two points below are what emerged during the work rather than deviations
from a prior plan:

- **The spec was edited in place, not left untouched or replaced.** This was an explicit choice
  point (see the clarifying questions above), not a default — the alternative of leaving the
  spec as pure history was offered and declined.
- **Two real correctness gaps were found only by reviewing the diff, not by the original
  implementation plan:** the `onClick={logout}` event-as-reason hazard and the dead
  self-password-success message. Neither was anticipated when the password panel was first
  written; both were caught by the clean-code review pass before the code was committed, not
  after.

## Changed files

Since the prior completion record's commit `f20d1e3`, 1 commit (`5184121`) on
`spec/login-and-user-management`:

```
M  docs/api-contract.md
M  docs/known-issues-and-roadmap.md
M  specs/login-and-user-management.md
M  src/components/Layout.tsx
M  src/lib/session.ts
M  src/pages/auth/LoginPage.tsx
M  src/pages/users/UserLookup.tsx
M  src/pages/users/UsersHome.tsx
M  src/services/users.ts
M  src/store/authStore.ts
M  src/types/user.ts
A  processed-tasks/2026-07-29-login-and-user-management-password-and-email-lookup.md
```

## Acceptance

Accepted by **Yury Krasavin** on **2026-07-29**. No repair requests raised at acceptance; two
repair-shaped findings (the `onClick`/reason hazard and the dead self-password success message)
were caught and resolved during the clean-code review pass before this change was presented for
acceptance, not after.
