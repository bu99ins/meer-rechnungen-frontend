---
status: ACCEPTED
spec: specs/customer-classification-toggle.md
started: 2026-08-08
accepted: 2026-08-09
---

# Customer business/individual classification toggle (frontend)

Companion to the backend change `customer-b2b-b2c-classification` (spec + record live in
`../../backend/specs/` and `../../backend/processed-tasks/`).

## Verdict — all 8 acceptance criteria MET

| AC | Evidence |
|---|---|
| 1 | Live browser + real backend: created a customer without touching the control; captured `POST` body carried `customerType:"Individual"`; `GET /api/customers/{id}` confirmed `"Individual"`. The gate independently reproduced the same live leg via curl. |
| 2 | `onSubmit` guards with `if (!canSave) return;` before any store call — independent of the button's `disabled`, so the Enter-key path is covered too. Probe via `form.requestSubmit()` with Business + blanks: 0 requests sent. |
| 3 | Fields are conditionally *rendered* (`{isBusiness && …}`), not CSS-hidden — `queryByLabelText` returns null. Live `POST` with both blank for an Individual succeeded (200). |
| 4 | **Previously failed; fixed.** Verified against the real Zustand store (only the service layer mocked) and live in the browser against a genuine pre-migration customer (Ilona Gomon): Individual selected, both fields hidden; a Business customer shows Business with both fields populated. |
| 5 | Values live in the parent's `useState`, unaffected by the child input unmounting. Verified in create *and* edit mode: a renamed company name survived Business→Individual→Business and was not reverted to the stored value. |
| 6 | **Previously failed; fixed.** Asserted at the axios wire level (transport adapter stubbed, real component/store/service/interceptors in path): `PUT` for a Business customer carried `customerType:"Business"`; for an Individual, `"Individual"`. Confirmed live in the browser on a real migrated customer. |
| 7 | Live browser: customers list column, customer details heading, invoice customer-picker option (`"Company — Contact"` for Business, bare name with no dash for blank-company), and invoice details "Company" row all show the customer's name when the company name is blank. |
| 8 | `npm run build` (`tsc -b && vite build`) clean, 467 modules; `tsc -b --force` (cache-defeating) also clean. 32 node:test + 24 vitest passing. No new lint *errors* (the 19 are pre-existing `no-explicit-any` in untouched files). |

## Plan drift summary

Five increments were planned and all five shipped. Two deviations of substance:

1. **Increment 4 grew far beyond its scope** because gate-spec-what found a real, pre-existing
   production bug rather than a spec gap: `CustomerForm.tsx`'s edit-mode load read `store.current`
   from a `.then()` callback closed over the mount-time `store`. Because Zustand's `set()` replaces
   the state object rather than mutating it, that closure permanently read the pre-fetch snapshot —
   so editing *any* existing customer silently showed defaults, and saving sent
   `customerType:"Individual"` for stored Business customers, actively corrupting data. All 8
   committed component tests missed it because they fully mock the store and pre-seed `current`.
   Fixed by splitting the effect into fetch-trigger plus a population effect reactive on
   `store.current`, adding an identity-aware loading guard (`store.current.id !== id`), and adding
   `CustomerForm.realStore.test.tsx`, which drives the real store with only the service layer
   mocked. The final gate proved the fix with a **falsification probe** — the same assertions run
   against a restored copy of the buggy code, which fail there and pass here.
2. **A TypeScript inference trap** shaped two tests: `ReturnType<typeof useCustomersStore>` resolves
   to `unknown`, because `ReturnType<>` on Zustand's overloaded hook picks the generic-selector
   overload. The two payload-assertion tests therefore declare the spy up front and assert on it
   directly rather than on a captured store object; the reasoning is documented in-file so a future
   contributor doesn't "simplify" it back into a build break.

## Changed files (in this spec's scope — 26)

**Types / logic**
- `src/types/customer.ts`
- `src/lib/customerClassification.js` + `.d.ts` (new), `src/lib/customerDisplay.js` + `.d.ts` (new)

**Components**
- `src/pages/customers/CustomerForm.tsx`, `CustomerDetails.tsx`, `CustomersList.tsx`
- `src/pages/invoices/InvoiceDetails.tsx`

**Tests (new)**
- `src/pages/customers/CustomerForm.test.tsx`, `CustomerForm.realStore.test.tsx`,
  `CustomerDetails.test.tsx`, `CustomersList.test.tsx`
- `src/pages/invoices/InvoiceDetails.test.tsx`, `InvoiceForm.test.tsx`
- `src/components/Loading.test.tsx`
- `test/customerClassification.test.js`, `test/customerDisplay.test.js`

**Test infrastructure**
- `vite.config.ts`, `src/test-setup.ts` (new), `package.json`, `package-lock.json`

**Docs**
- `docs/api-contract.md`, `CLAUDE.md`, `docs/development-guide.md`, `docs/project-structure.md`

**Record**
- `processed-tasks/2026-08-08-customer-classification-toggle.md` (this file)

**Out of this spec's scope, present in the same commit** (separate task the owner ran independently;
same stale-closure bug class, its own scope, reviewed on its own terms):
- `src/pages/invoices/InvoiceForm.tsx`, `src/pages/senders/SenderForm.tsx`
- `src/pages/invoices/InvoiceForm.realStore.test.tsx`, `src/pages/senders/SenderForm.realStore.test.tsx`
  (note: `InvoiceForm.tsx` is also in this spec's scope for requirement 6's picker label; the
  stale-closure fix within it is the out-of-scope part)

## Acceptance

Accepted by the project owner on 2026-08-09 after review. The one blocking repair request raised
during the gate sequence — the AC 4 / AC 6 stale-closure data-corruption bug — was fixed and
re-gated clean (architecture, clean-code, and spec-what all re-run) before acceptance. No open
repair requests at acceptance time.

**Deployment note:** this frontend must ship before or together with the backend. Once the backend
is deployed, a client that does not send `customerType` on `PUT /api/customers/{id}` gets a hard 400
on every customer edit — this change is what makes the frontend send it.

## Increment 1 — Test infrastructure (Vitest + jsdom + React Testing Library)

**Intent:** Add a component-testing harness (this repo previously only had `node --test` for plain-JS
logic files) so later increments implementing the classification toggle can get real TDD coverage of
React form behavior, matching this repo's existing "extract pure logic to a plain file, test it
directly" precedent (`src/lib/refreshDecision.js` etc.) plus new React component coverage.

**Gate history:**
- TDD: PASS (2 smoke tests for the harness itself, rendering the existing `Loading` component)
- Architecture: PASS (node --test / vitest glob scopes don't overlap; test infra correctly exempt from
  the per-entity three-layer pattern; build/lint/deploy-workflow invariants all held)
- Clean-code: FAIL (1 MUST-FIX: new test file used tabs instead of the 2-space `src/` convention) →
  PASS (re-indented; also fixed a NICE-TO-HAVE: CLAUDE.md's `npm test` description was stale)
- Spec-What: PASS as an infrastructure increment — all 8 spec ACs correctly reported PENDING (none
  applicable yet; nothing overclaimed, nothing broken). Verified via actual npm test/build/lint runs,
  not just static reading.

**Outcome:**
- `package.json`: added devDependencies (vitest, jsdom, @testing-library/react, @testing-library/jest-dom,
  @testing-library/user-event); `"test": "node --test && vitest run"`; new `"test:watch": "vitest"`
- `vite.config.ts`: `test` block — `include: ['src/**/*.test.{ts,tsx}']` (deliberately disjoint from
  `test/*.test.js`), `environment: 'jsdom'`, `setupFiles: ['./src/test-setup.ts']`, no `globals: true`
  (matches existing explicit-import convention)
- `src/test-setup.ts` (new): imports `@testing-library/jest-dom/vitest`
- `src/components/Loading.test.tsx` (new): harness smoke test
- `CLAUDE.md`, `docs/development-guide.md`, `docs/project-structure.md`: updated to describe the split
  test runner and the new `npm run test:watch` script; project-structure.md's source-tree listing
  updated with `test-setup.ts` and the `*.test.tsx` co-location convention

Tests: `npm test` → 19 (node --test) + 2 (vitest) passing. `npm run build` clean. `npm run lint`: 19
pre-existing errors/10 warnings, zero in files touched by this increment.

**Plan drift:** None.

**Design note surfaced by gate-spec-what (not a defect, a conscious tradeoff to record):**
`tsconfig.app.json` includes all of `src/`, so co-located `*.test.tsx` files are typechecked by
`tsc -b` — the *only* deploy gate (`.github/workflows/deploy-frontend.yml` deliberately never runs
`vitest`/`node --test` in CI). This means a **type error** in a test file can now block a deploy, even
though a **failing assertion** in a test still cannot (Vitest is never invoked in CI). This is normal
for co-located TS tests and was accepted as-is rather than excluding test files from the typecheck —
recorded here so it's a documented choice, not a silent side effect.

## Increment 2 — Pure logic: display-name fallback

**Intent:** `resolveCustomerDisplayName({ companyName, customerName })` — trimmed companyName if
non-empty, else customerName. Plain JS + companion `.d.ts`, matching the `refreshDecision.js` precedent.
No product wiring yet, and deliberately no dependency on the backend's `customerType` field (keys purely
off whether companyName is blank, per requirement 6's own wording).

**Gate history:**
- TDD: PASS (6 node:test cases: present, empty string, whitespace-only, undefined, null, trim)
- Architecture: PASS with 1 WARNING → PASS (sibling plain-JS files each ship a companion `.d.ts`;
  `customerDisplay.js` didn't — added `customerDisplay.d.ts` matching `refreshDecision.d.ts`'s style)
- Clean-code: PASS, no findings (naming/vocabulary matches `src/types/customer.ts` exactly; correctly
  scoped — no page/component imports it yet; edge-case handling and test coverage both clean)
- Spec-What: PASS as a scoped logic increment. AC 7 correctly PENDING (zero product imports of the new
  function confirmed by repo-wide grep — the four UI call sites are still unmodified). Underlying logic
  independently stress-tested against 20 additional inputs beyond the 6 committed tests (tab/newline/CRLF
  whitespace, absent/null/undefined, non-mutation, full `Customer`-shaped object) — all correct. A
  type-compatibility probe confirmed both `Customer` and a slimmer `CustomerRef`-shaped literal
  structurally satisfy the `.d.ts` parameter, so Increment 3's four call sites can pass whole objects.
  AC 8 (build) MET — build/lint problem counts unchanged from baseline.

**Outcome:**
- `src/lib/customerDisplay.js` (new)
- `src/lib/customerDisplay.d.ts` (new)
- `test/customerDisplay.test.js` (new): 6 tests

Tests: `npm test` → 25 (node --test) + 2 (vitest) passing. Build/lint unchanged from Increment 1 baseline.

**Plan drift:** None.

**Non-blocking observations carried to Increment 3/4 (from gate-spec-what):**
- The function returns the *trimmed* company name, not the original — invisible today since all 4 render
  sites collapse whitespace by default, but worth remembering if the value is ever reused in a context
  that preserves whitespace (e.g. a `title`/`aria-label` attribute).
- `.d.ts` accepts `companyName: string | null | undefined`, but `src/types/customer.ts` and
  `src/types/invoice.ts` both currently declare `companyName: string` (non-nullable) — widen those types
  in Increment 4 once the real backend contract is confirmed, if the backend can actually return null.

## Increment 3 — Wire the fallback into the four display spots

**Intent:** `CustomersList.tsx`, `CustomerDetails.tsx` (heading only), `InvoiceForm.tsx` (customer
picker), `InvoiceDetails.tsx` switch from raw `companyName` to `resolveCustomerDisplayName(...)`.
Fully satisfies spec requirement 6 / AC 7 — no backend dependency.

**Gate history:**
- TDD: PASS. Discovered and fixed a real test-isolation bug along the way: RTL's auto-cleanup
  requires global test hooks, which this project deliberately doesn't enable (`globals: true` is
  off) — added explicit `afterEach(cleanup)` to `src/test-setup.ts`, without which a false-positive
  had appeared (first test's DOM leaking into the second). 8 RTL tests across 4 new `.test.tsx`
  files, all real red→green.
- Architecture: PASS (plain-JS `.js` import from `.tsx` correct per bundler moduleResolution;
  services/store layers untouched; CustomerDetails' separate internal "Company" Row deliberately
  left unwired — not one of the spec's four named locations, judged architecturally sound)
- Clean-code: PASS with 2 NICE-TO-HAVEs → applied one (extracted `hasCompanyName(companyName)` from
  `customerDisplay.js` so `InvoiceForm.tsx`'s " — " separator decision reuses the same presence
  check instead of re-implementing it inline; TDD'd with 5 new node:test cases). Left the other
  (duplicated 7-field customer fixture across 4 test files) as-is — no existing shared-fixture
  convention in this repo yet, not worth introducing for 4 call sites.
- Spec-What: PASS, exhaustively verified. A temporary probe (deleted after, git-clean) rendered all
  four real components against 6 blank-value variants (`''`, whitespace, tab, newline, `undefined`,
  `null`) and a mixed list — confirmed correct at every point, including exact DOM text content (no
  stray whitespace/dash in the picker option). AC 8 (build) reconfirmed with `tsc -b --force` (full,
  cache-defeating recheck), not just an incremental build.

**Outcome:**
- `src/test-setup.ts`: explicit `afterEach(cleanup)`
- `src/lib/customerDisplay.js` + `.d.ts`: added `hasCompanyName(companyName)` export
- `test/customerDisplay.test.js`: +5 tests for `hasCompanyName`
- `src/pages/customers/CustomersList.tsx` + `.test.tsx` (new, 2 tests)
- `src/pages/customers/CustomerDetails.tsx` + `.test.tsx` (new, 2 tests)
- `src/pages/invoices/InvoiceDetails.tsx` + `.test.tsx` (new, 2 tests)
- `src/pages/invoices/InvoiceForm.tsx` + `.test.tsx` (new, 2 tests, mocking 3 stores)

Tests: `npm test` → 30 (node --test) + 10 (vitest) passing. Build clean, lint unchanged (29
pre-existing problems, zero new).

**Plan drift:** None on scope; one internal refactor (hasCompanyName extraction) beyond the original
plan, done in response to a clean-code finding.

**Non-blocking observations carried to Increment 4 (from gate-spec-what):**
- `CustomerDetails.tsx`'s internal "Company" `Row` (distinct from the heading) renders an empty
  string rather than the `-` placeholder for a blank company name, since `value ?? '-'` treats `''`
  as present, not absent. Outside requirement 6's four named locations, but worth a deliberate
  decision once Individual customers are common — currently a silent blank field.
- `CustomerForm.tsx:66`'s edit-mode heading (`Edit ${companyName || 'Customer'}`) is the one
  remaining company-name-as-heading spot not routed through `resolveCustomerDisplayName`. Not one of
  the four spec-named locations and already has its own fallback, but Increment 4 touches this file
  anyway — consider routing it through the shared helper for consistency.

## Remaining plan

**Boundary resolved — backend contract confirmed:** the backend plan (`../../backend/`) has now
completed all 4 increments plus a correction. Confirmed contract, read directly from the backend
source (not assumed):
- Field name: `customerType` (camelCase in JSON, `CustomerType` in C#).
- Wire format: **JSON string**, `"Individual"` or `"Business"` — the backend registers a global
  `JsonStringEnumConverter` (`Common/Modules.Common.API/DependencyInjection.cs`), confirmed by
  reading that registration directly, not inferred.
- `POST /api/customers` (Create): `customerType` optional in the request body; omitted → `Individual`.
- `PUT /api/customers/{id}` (Update): `customerType` is **required** — a request omitting it now
  fails with a 400 `ValidationProblem` (this was tightened during the backend's own review: the
  original "no C# default" design did NOT prevent System.Text.Json from silently binding a missing
  enum property to `Individual`, so the backend added an explicit `NotNull()` validator rule; the
  field's C# type is `CustomerType?` on the Update request specifically so "omitted" and "explicitly
  Individual" are distinguishable). **This means once the backend is deployed, this frontend's
  current (unmodified) `CustomerForm.tsx` save action will get a 400 on every edit to every
  existing customer** — not a silent corruption, but a hard failure — until Increment 4 ships.
- `customerType` appears on every `CustomerResponse`: single customer, customer list, and the
  customer data embedded in `CreateInvoice`/`GetInvoiceById`/`UpdateInvoice`/`DownloadInvoice`
  responses. It does **not** appear on `GetInvoices`'s list items (no customer data embedded there
  at all).
- `companyName`/`customerTaxVatId` are required only when `customerType` is `Business`.

## Increment 4 — Classification toggle wiring

**Intent:** `src/types/customer.ts` gains `customerType`; `SelectInput` (Individual default on
create); Company Name/Tax-VAT ID shown+required only for Business; classification always sent
explicitly in the payload (both create and update); edit mode loads real stored value.

**Gate history:**
- TDD: PASS (pure logic: 2 node:test cases for `requiresCompanyFields`; component: 8 RTL tests in
  `CustomerForm.test.tsx`, all real red→green). Hit and resolved a genuine TypeScript inference
  quirk along the way (see Clean-code below).
- Architecture: PASS (services/store layers correctly untouched — already generic over `Customer`;
  `.js` plain-module imports correct; existing `SelectInput` reused, no new form primitive)
- Clean-code: PASS with 3 NICE-TO-HAVEs → applied 2 (layout via existing `sm:col-span-2` idiom
  instead of a filler div; documented the TS-inference workaround with the correct root cause —
  `ReturnType<typeof useCustomersStore>` collapses to `unknown` because TS's `ReturnType<>` on an
  overloaded Zustand hook picks the generic-selector overload, not the plain-call one, not an
  "await boundary" as first suspected)
- Spec-What: **FAIL on first pass** — found via empirical testing (not just the committed mocked-store
  tests) that `CustomerForm.tsx`'s edit-mode load had a **real, serious pre-existing bug**: it read
  `store.current` from inside a `.then()` callback closed over the `store` variable captured at
  mount time. Since Zustand's `set()` replaces the state object rather than mutating it, that
  closure permanently read the mount-time snapshot (`current: undefined`), never the freshly-fetched
  customer. Editing any existing customer silently showed defaults (Individual, blank fields)
  regardless of real data, and saving would send `"customerType":"Individual"` for a stored
  Business customer — **active data corruption**, exactly what this spec exists to prevent. The
  bug was invisible to all 8 committed tests because they fully mock the store and pre-seed
  `current` before render, never exercising the real fetch→populate path.

**Fix (re-gated in full):**
- Split the single `useEffect` into two: one triggers `store.fetchOne(id)` (deps include
  `store.fetchOne` specifically — Zustand's `create()` defines action functions once, so the
  reference is stable across renders, unlike the full `store` object which is replaced on every
  state change); a second is reactive on `store.current` itself and populates local form state
  whenever it actually changes.
- Loading guard strengthened from `!store.current` to `!store.current || store.current.id !== id`,
  closing a related edge case a clean-code re-review found: navigating directly from editing
  customer A to editing customer B (same mounted component) would otherwise show A's stale,
  fully-interactive, savable data until B's fetch resolved.
- New `CustomerForm.realStore.test.tsx` (2 tests): mocks only `services/customers.ts`, uses the
  real Zustand store singleton, so the fetch→`set()`→reactive-effect path is genuinely exercised.
- Final gate-spec-what re-verification went further than the fix's own tests: built a harness
  stubbing only the axios transport adapter (real component, store, service layer, and `lib/api.ts`
  interceptors all in the path) to assert on the actual JSON wire body, and ran a **falsification
  probe** — the identical assertions against a restored copy of the pre-fix buggy code — confirming
  they fail on the bug and pass on the fix. AC 4 and AC 6: **MET**, with falsifiable proof, not
  just passing tests.

**Outcome (final):**
- `src/types/customer.ts`: `CustomerType = 'Individual' | 'Business'`, added to `Customer`
- `src/lib/customerClassification.js` + `.d.ts` (new): `requiresCompanyFields(customerType)`
- `test/customerClassification.test.js` (new): 2 tests
- `src/pages/customers/CustomerForm.tsx`: full classification wiring + the stale-closure fix +
  identity-aware loading guard + edit-heading routed through `resolveCustomerDisplayName`
- `src/pages/customers/CustomerForm.test.tsx` (new): 8 RTL tests (mocked store)
- `src/pages/customers/CustomerForm.realStore.test.tsx` (new): 2 RTL tests (real store, mocked
  service layer only) — the regression guard for the bug this increment found and fixed
- `CustomerDetails.test.tsx`, `CustomersList.test.tsx`, `InvoiceForm.test.tsx`: fixtures updated
  with `customerType: 'Business'` (required-field addition, no behavior change)

Tests: `npm test` → 32 (node --test) + 20 (vitest) passing. Build clean. Lint: 30 problems (was 29;
+1 new warning — `react-hooks/exhaustive-deps` on `store.current` as a dependency, a known
false-positive for this exact library/pattern combo, confirmed factually wrong by the gate's own
empirical testing; not part of the deploy gate).

**Plan drift:** The increment grew substantially beyond its original scope because gate-spec-what
found and required fixing a real, pre-existing production bug rather than a spec gap. This is
exactly the kind of "reality contradicts the plan" moment the loop calls for stopping and fixing
before advancing — done here across 3 re-gate cycles (architecture, clean-code, spec-what all
re-run clean on the final state).

**Non-blocking observations carried to Increment 5:**
- `docs/api-contract.md` still lacks `customerType` on the Customer shape — Increment 5's job.
- AC 1's live-backend leg (`GET` after create, against the real deployed backend) and a manual
  browser walkthrough remain for Increment 5.
- If a `GET` response ever omitted `customerType` (contract violation, not possible today per the
  backend's guarantee), `setCustomerType(undefined)` would make the select uncontrolled and silently
  drop the key from the payload. Purely defensive, not required unless the backend contract loosens.
- The same stale-closure pattern (`.then()` closing over a stale `store`) exists in `SenderForm.tsx`
  and `InvoiceForm.tsx`. Out of scope for this spec (senders/invoices aren't touched), flagged for
  a separate fix.

## Increment 5 — Docs + end-to-end check

**Intent:** `docs/api-contract.md` updated with `customerType`; full green build/test/lint; a real
end-to-end browser walkthrough against the live backend (Requirement 8, and the live-backend leg
of AC 1 that no unit test can cover).

**Gate history:**
- Spec-What: PASS. Verified `docs/api-contract.md`'s new content against the live running backend
  directly (not just source reading) — created/fetched real customers via curl to confirm every
  documented claim: string enum values, Create-defaults-Individual, Update-requires-explicit
  (`NotNull().IsInEnum()`, 400 on omission), `companyName`/`customerTaxVatId` present-but-blank-ok
  semantics, and that `GET /api/invoices` list items carry no customer data. All 8 requirements and
  all 8 ACs re-verified MET, several (AC 1's live leg, AC 4, AC 6) with the gate's own independent
  reproduction rather than trusting the implementer's report.

**Outcome:**
- `docs/api-contract.md`: `customerType: 'Individual' | 'Business'` added to both the invoice-embedded
  customer shape and the standalone Customer shape, with prose on requiredness/blank-vs-omitted
  semantics and the `GetInvoices`-list exclusion.
- **Manual end-to-end walkthrough**, performed against a freshly rebuilt local backend (`Build.bat`/
  `Run.bat`) and the real Vite dev server, browser-automated:
  - Created an Individual customer (blank Company Name/VAT, backend accepted, `GET` confirmed
    `customerType:"Individual"`).
  - Created a Business customer (backend correctly 400'd until Company Name/VAT/Address/PostalCode
    were filled — surfaced a **pre-existing, out-of-spec** gap: `canSave` doesn't require
    Address/PostalCode even though the backend always has; not part of this spec, not fixed here).
  - Edited the Business customer unchanged; `PUT` body carried `customerType:"Business"` explicitly.
  - Edited a real pre-migration customer (Ilona Gomon, Individual, blank company name from the
    Increment-1 migration) — loaded correctly (Individual selected, fields hidden) and saved with
    `customerType:"Individual"` preserved. This is the AC 4/AC 6 proof against genuine historical
    data, not a fixture.
  - Confirmed the customers list and invoice customer-picker fallback display live (blank-company
    customers show their name; `"Company — Contact"` format only for customers with a company name).
  - Created a real invoice for the Individual customer; confirmed the invoice details "Company" row
    shows the customer's name, and downloaded the real generated `.docx` — BILL TO block correctly
    omits Company Name and VAT/Tax ID lines and the "Thank you for your business!" line for the
    Individual customer, and the "computer-generated invoice" signature line is absent from every
    invoice, unconditionally. This is the full stack (backend classification → docx generation →
    frontend toggle → frontend display fallback) verified working together in one real run.
  - All test data (2 customers, 1 invoice) deleted afterward; confirmed the customer list returned
    to its original 5 entries.

Tests: `npm test` → 32 (node --test) + 24 (vitest) passing. Build clean. Lint: 32 problems (19
pre-existing errors, unchanged; warnings include the accepted `store.current`-dependency
false-positive pattern, now also present in `InvoiceForm.tsx`/`SenderForm.tsx` — see disclosure below).

**Plan drift / disclosure — two items surfaced by the final gate, both resolved:**

1. **Scope drift, already disclosed at the time it happened:** while this increment was in
   progress, a separately-spawned background task (flagged at the end of Increment 4, see that
   section) completed independently and applied the same stale-closure + identity-guard fix to
   `SenderForm.tsx` and `InvoiceForm.tsx`, plus `InvoiceForm.realStore.test.tsx` and
   `SenderForm.realStore.test.tsx` regression tests. This is **out of this spec's declared scope**
   (the spec explicitly excludes senders, and invoices only insofar as requirement 6's display
   fallback) — it was a separate, independently-tracked bug-fix task the user started themselves
   via the spawned-task chip, not part of this plan's work. Verified integrated cleanly (all tests
   pass, build clean) but is **not** claimed as part of this spec's deliverable; it has its own
   scope and should be accepted/reviewed on its own terms, not folded into this spec's acceptance.
2. **This record itself** was behind the actual work at the moment the gate ran — now caught up.

**Non-blocking observations for future work (not part of this spec, not fixed here):**
- Pre-existing gap: frontend `canSave` for customers doesn't require Address/PostalCode even though
  the backend always does — surfaced live during the walkthrough, existed before this spec.
- Two pre-existing `docs/api-contract.md` inaccuracies unrelated to this change: the Invoice list
  item block documents a `currency` field `InvoiceListItem` doesn't have; the Customer section
  doesn't distinguish the slimmer list-item shape (`id`/`companyName`/`customerName`/`customerEmail`/
  `customerType` only) from the fuller detail shape, unlike the Invoice section's own list/detail split.
- A customer switched to Individual after having a Company Name typed in retains that value in the
  payload (correct per AC 5 — toggling must preserve typed values) but it becomes invisible in the
  UI (fields hidden) while still being sent and stored. Not a bug against any AC — the display
  fallback and the backend's docx generation both key off `CustomerType`, not blankness, so nothing
  user-visible is wrong — but worth a deliberate product decision later (e.g. clear the fields on
  toggle instead of preserving them) if it proves confusing in practice.

## Frontend plan status: COMPLETE, ready for final acceptance

All 5 increments have passed every gate. All 8 spec requirements and all 8 acceptance criteria are
MET, most with real end-to-end evidence (live backend, real historical data, downloaded `.docx`
files) rather than mocked tests alone. The increment 4 correction (stale-closure data-corruption
bug) was the most significant finding of the whole plan — caught before shipping, not after.
- Manual browser walkthrough against the real backend
