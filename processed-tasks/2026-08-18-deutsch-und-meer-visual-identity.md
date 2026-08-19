# Deutsch und Meer visual identity

Status: ACCEPTED (2026-08-19), with one documented known limitation (see Verdict, AC 13)
Spec: specs/deutsch-und-meer-visual-identity.md
Start date: 2026-08-18

## Verdict — every Acceptance Criterion, with evidence

1. **MET.** Header, browser tab, and login screen all read "Meer von Rechnungen"; `grep` for "Invoice Builder" / standalone "IB" across `src/` + `index.html` returns nothing; live DOM check confirmed the same.
2. **MET.** Favicon is `/logo.svg` (seagull + two wave arcs only, no ring text — confirmed 0 sky-blue `#1EABE2` pixels in the asset). Rendered at an exact 16×16 pixmap, the bird's head/beak/body/wing remain distinguishable (thin line art, so it's the weakest-margin criterion, but it reads as a bird).
3. **MET.** All 502 unique SVG path control points match the PDF's own page-1 drawings 0–4 exactly (reconstructed independently from `page.get_drawings()` and diffed against the shipped `public/logo.svg`) — same artwork, not a redraw.
4. **MET.** Header fill is `rgb(16,102,164)` = `#1066A4` exactly. Every text element in the header (wordmark, all 5 nav links, signed-in email, sign-out) measured 6.07:1 contrast live, comfortably over the 4.5:1 floor (also checked hovered states: 4.94:1, still passing). Active nav link marked by font-weight 600 + solid white bottom border + `aria-current="page"`, vs 400/transparent — verified by clicking through all three sections.
5. **MET.** `grep -ri "indigo\|4f46e5" src tailwind.config.js src/index.css` → zero matches, including against the compiled `dist/` stylesheet and a runtime sweep of every loaded CSS rule.
6. **MET.** Delete buttons and validation error messages traced byte-identical against HEAD in `git diff` — only the non-error ternary branches changed anywhere in the sweep. Live: delete controls `rgb(220,38,38)`, error messages/borders red on every gated form.
7. **MET.** Computed `font-family` resolves to `Montserrat, system-ui, sans-serif` on body, headings, table cells, and form inputs (verified via glyph-width probes proving the face actually renders, not just declared). No `Inter`/`Söhne` anywhere in `index.html`, `tailwind.config.js`, or `src/`. `Söhne` (previously dead, unused) removed from the font stack along with `Inter`.
8. **MET.** Structural diff (DOM text + className-stripped comparison) of invoices list, invoice details, invoice form, customers list, and login against the Step 0 baseline: 13 of 19 changed `.tsx` files show zero structural delta; the remainder reduce to exactly the product name, the logo mark, the `RequiredLegend` additions (req 12), and the currency-argument fix (reqs 15–17) — nothing moved, appeared, disappeared, or changed wording otherwise. (Pixel screenshots were unavailable this session — the Browser pane's screenshot action never composited — so this is a DOM/structural comparison, not a pixel diff; flagging in case a future session with working screenshots wants to double-check.)
9. **MET.** Sender form: all 5 required fields (Company Name, Full Name, Tax/VAT ID, Bank Details, Address) carry both the `::after` asterisk marker and the 4px sky-blue left-accent border; Phone and Email carry neither; the "* Required field" legend is present. Invoice form: Tax Rate and Notes carry neither marker nor treatment.
10. **MET.** Clearing a previously-filled required field via genuine keyboard interaction (and separately, via a real blocked-submit click) makes the field match `:user-invalid` and repaints all four border sides red (`rgb(252,165,165)`) — visibly an error, not merely required. Verified live with `getComputedStyle`, not just class-string assertions.
11. **MET.** Customer form: toggling Individual → Business adds Company Name and Tax/VAT ID with marker + treatment; Business → Individual removes both the fields and the treatment together; toggling back restores both. Verified live through the real `<select>`.
12. **MET.** All four invoice line-item inputs (no `id`/`label` passed) show zero asterisks and plain gray borders in every state, including when their native `min`/`step` constraints are violated — the required-treatment geometry (`border-l-4`) is only ever emitted on the required branch, so it's structurally unreachable for these inputs.
13. **NOT MET end-to-end — known limitation, accepted by the user.** The frontend code is correct and proven: `InvoicesList.tsx` passes each invoice's own `currency` into `formatCurrency`, which no longer defaults to USD, and unit tests confirm EUR/USD/missing/invalid all render distinctly and safely. However, the backend's `GetInvoices` projection does not include a `currency` field at all (confirmed by reading `GetInvoices.Handler.cs` in the backend repo) — every real invoice list row therefore renders a bare number, and a EUR vs. USD row cannot currently look different in the running system. This is a backend gap, not a frontend defect; documented in `docs/api-contract.md` and flagged to the user, who chose to accept it as a known limitation to be closed by a backend change later, rather than block this frontend change on it.
14. **MET.** An invoice with `currency: ""` (and separately: missing/undefined/invalid) renders its row without throwing and without a `$` — verified via component render with synthetic data and confirmed live against real invoices (which currently arrive with no currency at all, per AC 13's note, and correctly show plain numbers).
15. **MET.** `npm run build` and `npm test` both complete without errors — `tsc -b` clean, `vite build` succeeds, 32 `node --test` + 58 Vitest tests (12 files) all pass.

Requirements 18 and 19 (non-regression, docs) are folded into the ACs above and separately confirmed: `npm run lint` shows the same 19 errors / 13 warnings as the pre-change baseline (compared via `git stash`), all pre-existing and unrelated to this change — no new lint errors. `docs/visual-identity.md` records the palette, typeface, and mark provenance, linked from `docs/README.md`.

## Plan drift summary

- **Step 1** picked up one extra file (`src/types/invoice.ts`) beyond the original plan: `InvoiceListItem.currency` was changed from `string` to `string?` after gate-spec-what discovered the backend never actually sends it — the type was lying about the data shape.
- **Step 3** shipped Montserrat weights 400/500/600/700 instead of the planned 400/600: gate-spec-what caught that 400/600-only would silently collapse the app's existing `font-medium`/`font-bold` usages (30 elements) into the two loaded weights, which would have violated AC 8.
- **Step 4** absorbed an unplanned but in-scope fix: requirement 6's "warm gray is the muted text tone" clause was never implemented until gate-spec-what FAILed on it — fixed within the same step by mapping the app's muted-text tier (`text-gray-500`/`600`, 50 occurrences) to `text-brand-gray`, leaving primary text and the disabled-state token untouched.
- **Step 5** extended its own fix mid-step: the `:user-invalid` CSS repaint originally applied only to required fields; gate-spec-what found an optional field with a type constraint (e.g. Email) could block submission with zero visual feedback, so the repaint was made universal (colour-only; the required accent's 4px geometry stays required-only, so req 14 held).
- **Step 6 / AC 13**: could not be closed as originally scoped — the backend gap (see Verdict above) was discovered in Step 1, escalated then, and reconfirmed as the sole non-passing criterion at final verification. Accepted by the user as a known limitation rather than blocking the frontend change.
- Pixel screenshots (for AC 8) were substituted with DOM/structural comparison throughout, because the Browser pane's screenshot action did not composite frames in this session.

## Full list of changed files

- `index.html`
- `tailwind.config.js`
- `public/logo.svg` (new)
- `public/vite.svg` (deleted)
- `src/index.css`
- `src/types/invoice.ts`
- `src/utils/format.ts`
- `src/utils/format.test.ts`
- `src/components/Layout.tsx`
- `src/components/Form.tsx`
- `src/components/Form.test.tsx` (new)
- `src/components/EmptyState.tsx`
- `src/components/Loading.tsx`
- `src/components/ConfirmDialog.tsx`
- `src/components/Pagination.tsx`
- `src/pages/auth/LoginPage.tsx`
- `src/pages/customers/CustomerDetails.tsx`
- `src/pages/customers/CustomerForm.tsx`
- `src/pages/customers/CustomersList.tsx`
- `src/pages/invoices/InvoiceDetails.tsx`
- `src/pages/invoices/InvoiceForm.tsx`
- `src/pages/invoices/InvoicesList.tsx`
- `src/pages/senders/SenderDetails.tsx`
- `src/pages/senders/SenderForm.tsx`
- `src/pages/senders/SendersList.tsx`
- `src/pages/users/UserCreate.tsx`
- `src/pages/users/UserLookup.tsx`
- `src/pages/users/UsersHome.tsx`
- `docs/visual-identity.md` (new)
- `docs/README.md`
- `docs/api-contract.md`

## Acceptance

Accepted by the user 2026-08-19, after being presented with the one non-passing criterion (AC 13) and its cause. The user chose to accept the frontend work as complete with that limitation documented, rather than block on or pursue a backend fix within this change. No other repair requests were raised.
