# Currency improvements

Status: IN PROGRESS
Spec: [specs/currency-improvements.md](../specs/currency-improvements.md)
Started: 2026-08-19

## Steps completed

### Increment 1 — Section A: create-form currency default

Intent: opening the invoice create form pre-fills Currency with `EUR` instead of `USD`; field
stays free-text, required, and fully editable; edit mode is unaffected.

Files touched:
- `src/pages/invoices/InvoiceForm.tsx` — added module constant `DEFAULT_CURRENCY = 'EUR'`;
  changed `currency` state's initial value from `useState('USD')` to `useState(DEFAULT_CURRENCY)`.
- `src/pages/invoices/InvoiceForm.realStore.test.tsx` — changed the shared edit-mode fixture's
  currency from `'EUR'` to `'USD'` (so edit-mode assertions can't pass by coincidence against the
  new create-mode default); added an explicit `currency: 'USD'` assertion to the existing
  save-payload test; added `vi.clearAllMocks()` to the shared `afterEach` (mock call history was
  bleeding across tests, which would have made a `.not.toHaveBeenCalled()` assertion pass for the
  wrong reason); added a new describe block with 4 tests: Currency pre-fills `EUR` with no
  interaction; submitting untouched sends `EUR`; submitting after replacing the value sends the
  replacement; clearing the field blocks submission.

TDD: new/changed tests written first and confirmed red (2 of 4 new tests failed against the
unmodified `useState('USD')`), then the one-line production change made them green.

Gate history:
1. gate-architecture — PASS, first try. No constraint violations against CLAUDE.md; noted Section B
   intentionally out of scope for this increment.
2. gate-clean-code — PASS, first try. No findings.
3. gate-spec-what — PASS, first try, verified against Section A requirements 1–4 and Acceptance
   Criteria 1–5. Verified via mutation testing (swapped default to `USD`/`GBP`, removed `required`
   from the Currency input, deleted the edit-load `setCurrency(cur.currency)` call — each broke the
   correct test). Reported one residual finding, described below.

Baseline: `npm test` (32 node tests + 62 vitest tests) all pass; `npm run build` succeeds; `npm run
lint` shows only pre-existing warnings/errors untouched by this diff.

**Residual finding (pre-existing, not caused by this change, not part of this spec):**
Navigating client-side from `/invoices/:id/edit` directly to `/invoices/new` reuses the mounted
`InvoiceForm` instance (both routes render the same component type in `App.tsx`'s `<Routes>`), so
`useState` initializers do not rerun and the previously-edited invoice's field values — including
currency — leak into the "new" form. Affects every field, not just currency; predates this change
(before it, the leaked value was whatever the edited invoice had, never `USD` either). Every fresh
mount (direct URL, page load, list → new) correctly shows `EUR`. Not fixed here — left for the user
to decide whether it warrants its own spec.

No plan drift on this step.

### Increment 2 — Section B: list-item contract and documentation

Intent: `InvoiceListItem.currency` describes a value the API always sends (no longer optional);
`docs/api-contract.md` no longer describes it as a known gap; `formatCurrency`'s defensive
behavior and its existing tests are untouched.

Plan drift: the original remaining-plan entry (written at the end of increment 1) scoped
verification to `npm test` + `npm run build` only, leaving AC 8 (EUR/USD rows rendering distinctly
against a live deployed backend) explicitly open/unverifiable — Section B's stated precondition
(backend's `GetInvoices` projection sending currency, merged and deployed to the environment this
frontend talks to) was not yet met at that time (backend repo `../backend` on branch
`spec/invoice-list-currency` had only a spec commit). This session, the user reported the backend
now staging at `localhost:5000` with the currency field live — confirmed via source (backend
commit "Add currency to invoice list projection", `GetInvoices.Handler.cs` now projects
`Currency`) and via `.env.development`'s `VITE_API_URL` already pointing at that host/port. This
genuinely satisfied Section B's precondition (not merely the user's earlier override to proceed
regardless), so a live browser verification step for AC 8 was added on top of the original
tests+build plan.

Files touched:
- `src/types/invoice.ts` — `InvoiceListItem.currency` changed from `currency?: string` (with a
  5-line "KNOWN GAP" justification comment) to `currency: string`; header comment listing
  list-item fields updated to include `currency`.
- `docs/api-contract.md` — replaced the 7-line "KNOWN GAP" comment block on the list-item's
  `currency` field with a plain `currency: string;` line; now matches `src/types/invoice.ts`
  field-for-field.
- No other files. `src/utils/format.ts` / `src/utils/format.test.ts` deliberately untouched
  (confirmed byte-identical to `main`).
- No test fixtures needed updating in this increment: the only `InvoiceListItem`-shaped fixture in
  the test suite (`InvoiceForm.realStore.test.tsx`'s `getInvoices` mock) already carried
  `currency: 'USD'` from increment 1's fixture change.

Gate history:
1. gate-architecture — PASS, first try. No constraint violations; noted the backend-deployment-state
   precondition is outside this gate's scope.
2. gate-clean-code — PASS, first try. No findings.
3. gate-spec-what — PASS, first try, against Section B requirements 5–8 and AC 6–7. Verified via
   targeted greps (no remaining "known gap"/optional-currency claims in the two files), field-by-
   field match between type and docs, a runtime probe of the actual `formatCurrency` module
   (undefined/''/whitespace/null/invalid-code all still symbol-free and non-throwing), and a
   mutation test reimplementing the old USD-default/no-try-catch `formatCurrency` to confirm
   `format.test.ts`'s assertions are non-vacuous (all 4 currency tests failed against the mutant).
   `format.test.ts` diff confirmed empty against `main`. Gate could only confirm the backend change
   at the source level (everything on `localhost:5000` 401s without auth from the gate's context);
   left the running-process confirmation (AC 8) to the orchestrating session.

Post-gate live verification (performed directly against the running app, not by a gate subagent):
started the Vite dev server, logged in with the backend's seeded dev admin account
(`admin@test.com` / `Test1234!`, from `MeerRechnungen.Host/Seeding/UserSeedService.cs` — a
local-only seed credential). Confirmed via the real network response that `GET /api/invoices` now
returns `"currency":"EUR"` per row (not a frontend fallback). Confirmed the create form's Currency
field rendered `EUR` on first paint with no interaction (real-browser corroboration of AC 1).
Created a temporary invoice (`USD-VERIFY-01`, $75.00, currency overridden to `USD`) via the create
form. The invoices list then showed `$75.00` for that row alongside the three existing EUR
invoices as `€88.00` / `€220.00` / `€120.00` — one list, both currencies, totals matching stored
amounts. This is direct evidence for AC 8. Deleted the test invoice afterward via the app's own
Delete action (with confirmation) to leave the shared local backend's data as found, then stopped
the dev server.

Baseline: `npm test` (32 node tests + 62 vitest tests, including `format.test.ts`'s 10 tests
passing unmodified) and `npm run build` both succeed with no new errors.

## Remaining plan

None. All Acceptance Criteria in the spec are met:
- AC 1–5 (Section A): met per increment 1's gates.
- AC 6 (Section B type/docs): met per increment 2's gates.
- AC 7 (`formatCurrency` defensive behavior + existing tests unmodified): met per increment 2's
  gates.
- AC 8 (EUR/USD rows in one list, live backend): met via direct browser verification in
  increment 2.
- AC 9 (build + test succeed): met, confirmed in both increments.

Ready for final/ACCEPTED mode once the user reviews and accepts.

### Additional fix — sibling create/edit route remount (out of spec scope, done by user request)

The pre-existing bug flagged during increment 1's gate-spec-what (see above) was fixed at the
user's explicit request, in the same working session/PR as this spec, but it is not part of
`specs/currency-improvements.md` and has no acceptance criteria of its own — recorded here as an
addendum rather than under a separate spec record.

Root cause: `/invoices/new` and `/invoices/:id/edit` (and the identical `/customers` and
`/senders` create/edit pairs) render the same component type at the same position in the route
tree, so React Router reused the mounted instance across a client-side navigation between them
instead of remounting — `useState` initializers never rerun, so the previous form's field values
leaked into the "new" form. Affected all three entity forms, not just invoices.

Files touched:
- `src/App.tsx` — route JSX extracted into an exported `AppRoutes` component (was inline in `App`,
  which now only wraps it in `BrowserRouter`); added `useLocation()` and `key={location.pathname}`
  on each create/edit form element (`InvoiceForm`, `CustomerForm`, `SenderForm`) so React Router
  remounts the form on every route change.
- `src/App.routing.test.tsx` (new) — regression test: renders `AppRoutes` in a `MemoryRouter`
  starting on an edit route for a USD invoice, confirms the loaded state, clicks the "New Invoice"
  nav link (real client-side navigation, not a fresh mount), and asserts the create form shows a
  clean EUR/empty state rather than the leaked edit-mode values. Covers `InvoiceForm` only —
  `CustomerForm`/`SenderForm` share the identical routing-level fix and aren't re-tested per
  entity, since this is a routing-mechanism regression, not an entity-specific one.
- `docs/project-structure.md` — updated the one-line description of `App.tsx`, stale after the
  `AppRoutes` extraction (flagged by the architecture gate as a non-blocking warning).

TDD: wrote the regression test first, confirmed it fails for the right reason with the fix
reverted (`AppRoutes` doesn't exist without it — import error), then applied the fix and confirmed
green.

Gate history:
1. gate-architecture — PASS, first try. One non-blocking WARNING (stale doc line), fixed
   immediately as part of this step.
2. gate-clean-code — PASS, first try. One NICE-TO-HAVE (test fixture duplicated from
   `InvoiceForm.realStore.test.tsx`, matches existing per-file-fixture idiom, not blocking).
3. No gate-spec-what — this fix has no governing spec/acceptance-criteria document.

Live verification: started the dev server, logged in with the seeded dev admin account, opened
`DM00001` (a stored EUR invoice) for edit, confirmed its data loaded, then clicked the header's
"New Invoice" link (client-side navigation) and confirmed via direct DOM inspection the resulting
form showed an empty Invoice Number and `EUR` currency — not the leaked `DM00001`/stored values.

Baseline: `npm test` (32 node + 63 vitest, one new test added) and `npm run build` both succeed.
