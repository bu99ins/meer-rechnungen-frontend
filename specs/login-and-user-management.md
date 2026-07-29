# Login and User Management

## Goal

Make a signed-in user a precondition for using the Meer von Rechnungen frontend, and give
Admins a place inside the app to create and maintain user accounts. Today the SPA has no login
surface at all: a JWT is expected to appear in `localStorage` by unknown means, no screen
produces one, no screen shows who you are, and there is no way to end a session. After this
change the app opens on a login screen, exchanges credentials for a session that survives
browser restarts and renews itself silently for as long as the backend allows, shows the
signed-in identity with a way to sign out, and — for Admins only — offers screens to register a
new user and to look up (by ID or by email), re-role, re-password, or delete an existing one.
Because accounts can only be created by an Admin, an Admin must also be able to set a password
for an existing account; this originally depended on a backend endpoint that did not exist,
tracked in [Backend dependency, resolved](#backend-dependency-resolved) — the endpoint has since
shipped exactly as assumed there. Elsewhere the user-management screens are deliberately shaped around
what the backend offers **today** (no bulk user listing) rather than around what a complete admin
console would look like; where the API cannot support the obvious design, the UI must be explicit
about the limitation instead of hiding it.

## Requirements

### Gating

1. With no valid session, every route of the app renders the login screen and nothing else — no
   navigation chrome, no entity data, no user-management screens. This applies to direct URL
   entry and to bookmarks, not only to in-app navigation.
2. Gating behaves identically in local development and in deployed builds. There is no
   environment flag, build flag, or dev-only path that bypasses login.
3. After a successful sign-in the person arrives at the route they originally requested; if they
   requested no particular route, they arrive at the invoices list.

### Signing in

4. The login screen collects an email address and a password and exchanges them for a session
   via `POST /api/users/login`.
5. Rejected credentials leave the person on the login screen with a message saying the
   credentials were not accepted, and establish no session.
6. A session consists of the access token, the refresh token, and the identity carried in the
   access token: the user's id, email, and role.
7. The login screen offers no route to self-registration and no forgotten-password link;
   creating accounts and setting passwords are in-app actions for Admins only (requirements 17
   and 22).

### Holding and renewing the session

8. Every request the app makes to the backend carries the current access token, and continues to
   carry the interim `X-Api-Gate` credential exactly as it does today.
9. A session survives closing and reopening the browser. It ends only by signing out, by a
   failed renewal, or by the refresh token expiring (7 days, enforced by the backend).
10. When a backend request fails because the access token has expired, the app renews the session
    via `POST /api/users/refresh` and completes the original request. The person sees no
    interruption, no flicker to the login screen, and no lost page state.
11. When renewal fails or is refused, the session is discarded and the person lands on the login
    screen with a message stating that their session ended — worded distinguishably from the
    rejected-credentials message of requirement 5.
12. Unsaved form input is not required to survive the interruption in requirement 11.

### Identity and signing out

13. On every signed-in screen, the app shows who is signed in (at minimum the email) and offers a
    sign-out control.
14. Signing out discards the session and returns to the login screen. Navigating back afterwards
    does not reveal application data or restore the session.

### User management

15. The user-management area is reachable only by a person whose role is `Admin`. For any other
    role it is absent from the navigation **and** does not render on direct URL entry.
16. The area's landing screen offers three things and no user table: an action to create a user,
    an input that looks a user up by an ID pasted in by the operator, and an input that looks a
    user up by email (requirement 30).
17. Creating a user takes an email, a password, and a role, and submits them to
    `POST /api/users/register`. On success the new user's ID is displayed and can be copied out of
    the screen.
18. Role is chosen from a fixed set of exactly `Admin` and `Manager` wherever a role is set. A role
    outside that set cannot be submitted from the UI.
19. Looking a user up by ID calls `GET /api/users/{userId}` and shows the id, email, and role
    returned (the role may be absent if the account has none assigned).
20. From a looked-up user, an Admin can change the email (`PUT /api/users/{userId}`), set the role
    (`POST /api/users/{userId}/role`), and delete the account (`DELETE /api/users/{userId}`).
    Deletion requires an explicit confirmation.
21. The signed-in Admin's own account cannot be the target of a role change or a deletion. The UI
    refuses the action and explains that it would lock them out.
30. The landing screen also offers a second lookup path: entering an email resolves it to a user
    id via `GET /api/users?email={email}` and opens the same look-up screen requirement 19
    describes. An email that matches no account produces the same visible not-found handling as
    an unmatched ID (requirement 28), on the landing screen itself — no navigation to a dead
    look-up page.

### Password management

22. From the same screen that edits a looked-up user, an Admin can set a new password for that
    user **without** supplying the user's existing password. This is the only way a password can
    ever be changed after an account is created.
23. Requirement 22 is satisfied via `POST /api/users/{userId}/password` with body
    `{NewPassword}`, requiring the same `users:update` permission as the other administrative
    edits (see [Backend dependency, resolved](#backend-dependency-resolved)). This endpoint did
    not exist when this spec was first written; the dependency has since been delivered exactly
    as assumed.
24. Setting a password requires the new value to be entered twice and to match before it can be
    submitted.
25. The screen states the password rules the backend enforces — at least 8 characters, with an
    uppercase letter, a lowercase letter, a digit, and a non-alphanumeric character — and any
    rejection the backend returns is shown to the operator in enough detail to correct it. The UI
    is not required to duplicate the backend's enforcement, only to state the rules and surface
    the failures.
26. An Admin may set their own password. Unlike a role change or a deletion (requirement 21) this
    does not lock them out, so it is permitted.
27. There is no forgotten-password or self-service password flow: a person who forgets their
    password depends on an Admin setting a new one under requirement 22.

### Errors and unchanged behaviour

28. A failure from any user-management or password call — validation problem, 403, 404, conflict —
    is shown to the operator on the screen they are on. No failure leaves a blank screen or a
    silent no-op.
29. Invoices, customers, and senders keep their current routes, screens, pagination, error
    handling, and PDF/document download behaviour. The only change to them is that they are now
    behind the gate.

## Backend dependency, resolved

This section originally blocked requirement 22 and is kept for history: at the time this spec was
written, the Users module exposed password handling only in `LoginUser` and `RegisterUser`;
`UpdateUserRequest` was `{Email, Role?}` and `UpdateUserHandler` wrote only `Email`, `UserName`,
and role. There was no change-password, reset-password, or admin-set-password endpoint.

The contract asked for was: an authenticated endpoint that, given a user id and a new password,
sets that user's password without requiring the user's current password; authorized by
`users:update`, the same permission as the other administrative user edits; password-policy
failures returned in the same problem shape as the module's other validation failures.

**Delivered as assumed.** `POST /api/users/{userId}/password` with body `{NewPassword}`, requiring
`users:update`, mirrors `POST /api/users/{userId}/role`. Verified live: a rejected password (e.g.
too short, missing a required character class) returns `400` with an `errors` map whose messages
name the specific rules violated, exactly matching requirement 25's needs. A successful reset also
invalidates the target user's outstanding refresh tokens (same revocation path as a role change),
which is why requirement 26 matters — this is the only way a password is ever changed after
account creation, and it always ends the target's existing sessions.

## Acceptance Criteria

Verified against a local backend (`docker-compose`, `http://localhost:5000`) whose Development
seeding provides `admin@test.com` (Admin) and `manager@test.com` (Manager), both with password
`Test1234!`.

1. With browser storage cleared, opening `/`, `/invoices`, `/customers/new`, `/invoices/<id>`,
   and `/users` each shows the login screen and no application data. — R1
2. Opening `/customers/new` while signed out, then signing in, lands on `/customers/new`; signing
   in from `/` lands on the invoices list. — R3
3. Signing in as `admin@test.com` / `Test1234!` reaches the invoices list showing backend data. — R4
4. Signing in with a wrong password shows a credentials-rejected message, and reloading the page
   still shows the login screen. — R5
5. The login screen offers no sign-up link and no forgotten-password link. — R7
6. In DevTools, a request to `/api/invoices` after sign-in carries both `Authorization: Bearer …`
   and `X-Api-Gate`. — R8
7. `npm run dev` against the local backend requires sign-in exactly as the deployed build does;
   no configuration in the repo turns the gate off. — R2
8. With a session whose access token has expired (wait past 30 minutes, or corrupt the stored
   access token while leaving the refresh token intact), the next in-app action completes
   successfully; the network log shows one call to `/api/users/refresh` followed by the original
   request succeeding, and the screen never shows the login form. — R10
9. With both stored tokens corrupted, the next in-app action lands on the login screen showing the
   session-ended message, which reads differently from the message in criterion 4. — R11
10. Signing in, fully closing the browser, and reopening the app shows the invoices list without
    re-entering credentials. — R9
11. Every signed-in screen shows the signed-in email and a sign-out control; using it returns to
    the login screen, and the browser Back button afterwards shows no application data. — R13, R14
12. Signed in as `manager@test.com`: no user-management entry appears in the navigation, and
    entering the user-management URL directly does not render those screens. — R15
13. Signed in as `admin@test.com`: the user-management landing screen shows a create action, a
    look-up-by-ID input, and a look-up-by-email input, and no table or list of users. — R16
14. Creating a user with a fresh email, a password, and role `Manager` succeeds and displays the
    new user's ID; pasting that ID into the look-up input returns the same email. — R17, R19
15. Every place a role is set offers exactly `Admin` and `Manager` and no way to submit any other
    value. — R18
16. The look-up result screen shows the user's current role (or its absence) as returned by the
    API. — R19
17. For a looked-up user other than oneself: changing the email is reflected on a fresh look-up;
    setting the role reports success; deleting asks for confirmation first, and looking the ID up
    afterwards reports that the user was not found. — R20
18. Pasting one's own user ID into the look-up offers no working role-change or delete action, and
    states why. — R21
19. Submitting an invalid email on create, and looking up a nonexistent ID, each produce a visible
    message on the current screen. — R28
20. Invoices, customers, and senders list/detail/create/edit/delete and the invoice document
    download all behave as before, once signed in. — R29
21. `npm run build` succeeds (this is the deploy gate) and `npm test` still passes. — repo constraint

### Password management

These were blocked pending the endpoint in
[Backend dependency, resolved](#backend-dependency-resolved); it has since shipped, so all of the
below are now executable (criterion 25 below is retained as a historical record — it held only
while the endpoint didn't exist, and is superseded by 22–24 and 26).

22. For a user created earlier in these checks, an Admin sets a new password from the user's edit
    screen without entering the old one; signing out and signing in as that user with the new
    password succeeds, and the old password is rejected. — R22
23. Entering two different values in the new-password fields prevents submission. — R24
24. Submitting a password that violates the backend policy (e.g. `alllowercase`) shows a message
    on the screen naming what is wrong, and the password is unchanged. — R25
25. **Superseded.** Originally: "until the endpoint exists, no screen presents a password field for
    an existing account." The endpoint now exists (R23's current wording states its contract; this
    criterion described the interim state before it existed); a password panel is present and
    functional (criteria 22–24, 26).
26. An Admin can set their own password from their own user record, and afterwards signs in with
    it. — R26

### Email look-up

27. Typing a known email into the email-lookup input on the Users landing screen opens the same
    look-up screen pasting that user's ID would, showing the same id, email, and role. An unknown
    email produces a visible not-found message on the landing screen without navigating away. — R30

## Implementation notes

Constraints on the solution, not steps toward it.

- **Build is the deploy gate.** `tsc -b` runs with `strict`, `noUnusedLocals`, and
  `noUnusedParameters`; an unused symbol fails the build and therefore the deploy. Tests and lint
  do not run in CI and must not become a deploy blocker (see
  [verify-frontend-workflow.sh](../deploy/verify-frontend-workflow.sh)).
- **The existing test setup cannot test this.** `npm test` is `node --test` over plain-JS
  `test/*.test.js`; it cannot load TSX or the Vite build. The acceptance criteria above are
  therefore manual. Introducing a new test framework is out of scope; `test/gate.test.js` must
  keep passing.
- **All backend calls go through `getApi()`** (`src/lib/api.ts`), never raw axios, so that the
  gate credential and auth header stay consistent in one place.
- **The Cloudflare Basic-Auth edge gate stays as it is.** `functions/_middleware.js` is untouched
  by this change, so a deployed user faces the browser Basic-Auth prompt *and then* the app's
  login screen. That double prompt is accepted, not a defect.
- **A session that survives browser restart is readable by any script on the origin.** That is the
  accepted cost of requirement 9 and does not need mitigating in this change.
- **Role visibility is coupled to the backend's roles.** Requirement 18 hard-codes `Admin` and
  `Manager` because no endpoint lists roles, and requirement 15 keys the Users area off the role
  claim while the backend actually authorizes on the `users:*` permission claims. If the backend
  gains a role, or grants users-permissions to a non-Admin role, this UI must be updated by hand.
- **Cross-tab session synchronisation is not required.** Signing out in one tab need not sign out
  another tab that is already open.

### Backend limitations recorded, not addressed here

These are facts about the current backend that shape this spec. None of them is fixed by this
change, and none should be worked around by inventing frontend behaviour the API cannot back.

- There is still no bulk-listing endpoint — `GET /api/users?email=` resolves exactly one email to
  exactly one id (`{Id}`, 404 if no match); it is not a search or paging endpoint. Hence
  requirement 16 still holds no user table even with two look-up paths.
- ~~`GET /api/users/{userId}` returns `{Id, Email}` only, with no role.~~ Resolved: it now returns
  `{Id, Email, Role}` (role nullable). Requirement 19 updated accordingly.
- ~~No password endpoint of any kind exists beyond login and register.~~ Resolved: see
  [Backend dependency, resolved](#backend-dependency-resolved).
- `POST /api/users/register` is **anonymous and accepts a `Role`**, so anyone who can reach the
  backend can create themselves an Admin account. Requirement 7 keeps the frontend from
  advertising this, but does not close it.
- Invoice, customer, and sender endpoints carry **no authorization at all**. The gate in
  requirement 1 keeps unauthenticated people out of the *UI*; it does not protect the data.
  Anyone who can reach the backend URL can still read and write those entities directly. This
  spec must not be read as making the application's data secure.
