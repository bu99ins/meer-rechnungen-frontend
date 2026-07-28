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
- **Not yet implemented**: silent renewal via `POST /api/users/refresh`. An expired access token
  currently reaches the backend as-is instead of being renewed first (see spec
  [login-and-user-management.md](../specs/login-and-user-management.md), requirement 10).

### Interim backend edge gate
- `VITE_API_GATE_KEY` is baked into the deployed bundle and sent as `X-Api-Gate` on every
  request. Accepted interim weakness: the key ends up in the built JS, which is itself only
  served behind the frontend's Basic-Auth gate. To be removed when JWT enforcement replaces it.

### Error boundaries
- No React error boundary component; errors are caught at service/store level only.
- **Risk**: unhandled promise rejections could fail silently.

### Leftover duplicate file
- `src/pages/InvoicesList.tsx` (top-level) is not routed or imported anywhere; the live one is
  `src/pages/invoices/InvoicesList.tsx`. Safe to delete.

## Recommendations / next steps

1. **Add an error boundary** component to gracefully handle React errors
2. **Implement token refresh** mechanism (if the backend supports it)
3. **Expand unit tests** for services & stores (the `node --test` setup currently covers only
   the edge gate)
4. **Add E2E tests** (Playwright/Cypress) for workflows
5. **Validate response schemas** (e.g., zod) at the service layer
6. **Add loading skeletons** for better UX during data fetches
7. **Document the backend API contract** in a shared schema (OpenAPI)
