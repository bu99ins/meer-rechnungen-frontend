# Known Issues, Considerations & Roadmap

## Known issues & considerations

### Content-Disposition parsing (`src/services/invoices.ts`)
- Axios v1+ uses `AxiosHeaders`, which may not expose headers consistently in browser context,
  so `downloadInvoicePdf()` reads the header via both `.get()` and plain property access.
- Manual regex parsing extracts the filename (supports `filename*=UTF-8''…` and
  `filename="…"` forms).
- **Fallback**: uses `invoice-<id>.pdf` if header parsing fails.

### Token management
- JWT obtained via `/login` (`src/pages/auth/LoginPage.tsx`) and held by `src/lib/session.ts`
  under `localStorage` keys `mvr.accessToken` / `mvr.refreshToken`. Every route except `/login` is
  gated by `src/components/RequireAuth.tsx`.
- On a 401, `src/lib/api.ts`'s response interceptor silently calls `POST /api/users/refresh` (the
  backend requires both the old access token and the refresh token in that call) and replays the
  original request. Concurrent 401s share a single in-flight refresh
  (`src/lib/refreshDecision.js` holds the pure decision logic, unit-tested in
  `test/refreshDecision.test.js`). A 403 (authenticated but lacking a permission claim) is passed
  through untouched — it never triggers a refresh or a sign-out.
- If renewal is rejected outright, or an Admin changes their own password (which revokes their own
  refresh token server-side), the session is cleared with a reason
  (`src/lib/session.ts`'s `SessionEndedReason`: `'ended'` or `'password-changed'`) so the login
  screen shows a message distinct from a rejected-credentials message, and distinct between the
  two reasons.

### User management (Admin only)
- `src/pages/users/` (`UsersHome`, `UserCreate`, `UserLookup`), gated by
  `src/components/RequireAdmin.tsx` (checks `identity.role === 'Admin'`; the Users nav entry in
  `Layout.tsx` is hidden the same way).
- No list-users endpoint exists on the backend, so there is no user table — only create (by email
  + password + role) and look-up by pasted-in ID or email (`GET /api/users?email=` resolves an
  email to an id, then the same look-up screen loads). `GET /api/users/{id}` returns the role
  (nullable), shown directly.
- From a looked-up user, an Admin can change the email, set the role, delete the account, and set
  a new password without the old one (each independently submittable, with its own loading/
  success/error state that resets on a fresh look-up). The admin's own account cannot be the
  target of a role change or deletion — those controls are absent (not merely disabled) when the
  looked-up id matches the signed-in identity — but a self-password-change is allowed and signs
  the admin out immediately afterward (see above).

### Error boundaries
- No React error boundary component; errors are caught at service/store level only.
- **Risk**: unhandled promise rejections could fail silently.

### Leftover duplicate file
- `src/pages/InvoicesList.tsx` (top-level) is not routed or imported anywhere; the live one is
  `src/pages/invoices/InvoicesList.tsx`. Safe to delete.

## Recommendations / next steps

1. **Add an error boundary** component to gracefully handle React errors
2. **Expand unit tests** for services & stores (the `node --test` setup currently covers the edge
   gate plus the pure logic in `src/lib/jwt.js`, `problem.js`, and `refreshDecision.js`)
3. **Add E2E tests** (Playwright/Cypress) for workflows
4. **Validate response schemas** (e.g., zod) at the service layer
5. **Add loading skeletons** for better UX during data fetches
6. **Document the backend API contract** in a shared schema (OpenAPI)
