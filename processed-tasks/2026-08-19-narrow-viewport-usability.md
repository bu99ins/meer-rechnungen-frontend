# Narrow-viewport usability

Status: ACCEPTED (2026-08-19)
Spec: specs/narrow-viewport-usability.md
Started: 2026-08-19

## Acceptance verdict

All 18 acceptance criteria met, verified live in the browser plus 108/108 vitest + 32/32 node
tests across the 5-step implementation below.

1. 375px header shows brand+menu only; panel lists Invoices/Customers/Senders/New Invoice, each
   navigates and closes the panel (including the destination already open) — live-verified.
2. Users shown only for Admin — shared `NAV_ITEMS.adminOnly` filter drives both nav layouts;
   non-Admin live-verified, Admin verified via `Layout.test.tsx` (no Admin test account available
   live).
3. Panel closable without navigating (Escape, outside click, toggle button); current section
   marked via `aria-current` + style — live-verified.
4. 1280px header pixel-identical to `main` — live-verified, byte-identical element geometry.
5. 375px cards on all three lists, every field identifiable (labelled via `CardField`, headline
   field identified by position) — live-verified.
6. Card actions correct per entity (Edit/Download PDF/Delete for invoices; Edit/Delete for
   customers/senders), no View, fully in-viewport — live-verified at 320/375px.
7. 320px: no clipped/unreachable card action — live-verified, zero overflowing elements found by
   full-DOM scan.
8. 1280px: unchanged tables, View action present — live-verified.
9. Exactly one layout (table xor cards) at every width 320-1440px, no clipping at the 768px flip —
   live-swept.
10. Double-click opens a table row; single click does nothing — live-verified via real
    click/dblclick events.
11. Tap (375px, touch-emulated) and mouse click (400px, real mouse event sequence) both open a
    card — live-verified.
12. Delete/Edit/Download PDF isolated from navigation, including clicks landing on the inner
    `<svg>` icon — live-verified.
13. Keyboard-only reach to detail pages on both layouts — live-verified via real Tab+Enter
    sequences.
14. 320px pagination fully visible and operable (counter, per-page select, Previous/Next) —
    live-verified; `Pagination.tsx` fixed for `flex-wrap`.
15. 320px heading + New X button visible and reachable — live-verified.
16. 320px invoice line items show all fields, no page-level scroll — live-verified; line-items
    table scrolls within its own `overflow-x-auto` container.
17. `document.documentElement.scrollWidth` ≤ viewport width at 320/375px on all six pages —
    live-swept after two real overflow bugs were found and fixed (long unbreakable values in list
    cards via `CardField`, and in detail-page rows/headings via `DetailRow`/`break-words`).
18. `npm run build` and `npm test` pass — clean build, 32/32 node tests + 108/108 vitest tests
    throughout every increment.

## Plan drift summary

Execution followed the 5-step plan from the interview with no step reordering or scope change.
Drift was in what each step's live verification surfaced, not in the plan's shape:
- Step 1 (header): two real dismiss-panel bugs found by gate-spec-what (toggle button couldn't
  close its own panel; same-route clicks didn't close it) — fixed within the step, not deferred.
- Step 2 (invoices list): no drift — the pattern-setting increment passed all gates first try.
- Step 3 (customers/senders): as anticipated in the original plan, the pattern reuse triggered two
  extractions (`src/lib/rowActivation.ts`, `src/components/CardField.tsx`) rather than being
  purely mechanical; the extraction itself fixed a real 320px overflow bug (`CardField`'s
  `min-w-0`/`break-words`).
- Step 4 (details + sweep): the live sweep — the step's actual purpose — found the same class of
  overflow bug on the three detail pages' `Row` component and header rows, not anticipated in the
  original plan's description of this step as "wrap the line-items table". Fixed in place; a
  clean-code pass then extracted the customers/senders duplication into `src/components/
  DetailRow.tsx`, mirroring `CardField.tsx`.
- Step 5 (docs): as planned; two factual errors in the first draft were caught by gate-clean-code
  and corrected before the final spec-what pass.
- One session was interrupted mid-gate-call by a usage limit (during step 3's spec-what gate) and
  resumed by re-running that gate call from scratch in a later session — no work was lost or
  silently skipped.

## Acceptance

Accepted by the user after delivery of the completion report; no repair requests raised at
acceptance.

## Decisions locked in the plan interview

- Single narrow/wide breakpoint at 768px (`max-width: 767.98px`) for both the header nav and the
  three list grids — not Tailwind's existing 640px (`sm`) nav collapse point.
- Layout choice (table vs cards, inline nav vs menu) is driven by a `matchMedia`-backed hook so
  only one layout is ever mounted at a time (satisfies req 10's "never both, never neither"
  literally, not just visually).
- Narrow-width nav presents as a dropdown panel inside the sticky header (not a full-screen
  drawer).
- Verification is live in the Browser pane for viewport-dependent ACs (clipping, scrollWidth,
  layout-switch sweeps); the user signs in once (manager@test.com / seeded test password — Claude
  does not type credentials itself), Claude drives everything after that.

## Steps completed

### Step 1 — Header/nav collapse (reqs 1-6, ACs 1-4)

Files added:
- `src/hooks/useIsNarrow.ts` — the single source of truth for the narrow/wide breakpoint,
  `useSyncExternalStore` over `matchMedia('(max-width: 767.98px)')`.
- `src/hooks/useIsNarrow.test.tsx`
- `src/components/Layout.test.tsx`

Files modified:
- `src/components/Layout.tsx` — below 768px renders brand + hamburger only; a dropdown panel
  (`role="dialog"`, `aria-label="Menu"`) lists Invoices/Customers/Senders/New Invoice (+Users for
  Admin) from a single shared `NAV_ITEMS` array also used by the wide inline nav (drift-proof by
  construction), plus the signed-in email and Sign out. Closes on Escape, on an outside
  mousedown, on choosing any panel destination (including the one already open), and via the
  toggle button itself. At ≥768px renders unchanged from before this branch.
- `src/test-setup.ts` — added a `matchMedia` stub (jsdom has none) defaulting to wide (1024px, so
  every pre-existing test that assumes the wide table/nav keeps passing unchanged) plus an
  exported `setViewportWidth(px)` test helper that notifies live listeners.

Gate history:
- gate-architecture: PASS on first pass. Noted (non-blocking) that `docs/project-structure.md`
  and `docs/features-and-workflows.md` don't yet mention the hook/breakpoint — expected, req 22
  covers documenting this at the end of the whole change, not this step.
- gate-clean-code: FAIL (1 retry) → PASS.
  - Must-fix 1: a code comment in `useIsNarrow.ts` pointed at
    `docs/features-and-workflows.md` as if the breakpoint were already documented there. Fixed by
    rephrasing as a forward commitment ("recorded ... once the narrow-viewport work lands").
  - Must-fix 2: the five nav destinations were hand-duplicated between the wide `<nav>` and the
    narrow panel `<nav>` in `Layout.tsx`, risking drift. Fixed by extracting a shared
    `NAV_ITEMS` array mapped by both layouts.
  - Nice-to-haves also taken: renamed a misleadingly-named `onPointerDown` handler (it handled
    `mousedown`, not pointer events) to `onMouseDown`; hoisted the admin-gate filter
    (`NAV_ITEMS.filter(...)`), previously written out identically at both call sites, into one
    `visibleNavItems` computed once per render.
- gate-spec-what: FAIL (1 retry) → PASS. Live-viewport testing (375px, real DOM events, not just
  the component test) found two real bugs the component tests hadn't caught:
  1. AC 3 / req 4: the toggle button couldn't close the open panel — its own `mousedown` fired the
     "click outside the panel" handler (the button is a header-level sibling of `panelRef`'s
     subtree, so it read as "outside"), closing the panel, and the same gesture's `click` then
     reopened it — the control looked inert. Fixed with a second ref (`menuButtonRef`) excluded
     from the outside-click check.
  2. AC 1 / req 4: choosing the panel destination for the section already open didn't close the
     panel, because closing was driven only by a `[location.pathname]` effect, which never re-runs
     when the path doesn't change. Fixed by also calling `setMenuOpen(false)` directly from each
     panel `NavLink`'s own `onClick`.
  Two regression tests added to `Layout.test.tsx` for both cases. Re-verified live: panel closes
  correctly via toggle button and via same-route click; both gates re-ran and passed.

Verification: `npx vitest run` — 75/75 passing (was 66 before this step; +9 new tests across the
two new test files). `npm run build` — clean. `npm run lint` — same 19 pre-existing errors/13
warnings as the unmodified baseline (verified via `git stash` diff), none in touched files. Live
in the Browser pane at 320/375/767/768/1280px: header collapses/expands at the right boundary, no
horizontal overflow, panel contents correct for Manager (no Users) — Admin case verified via
`Layout.test.tsx` only, no Admin test account was available to sign in with live.

The narrow panel initially had no scrim and dismissed on `mousedown` outside it — flagged during
step 1's gate review as a risk that tapping a card underneath the panel (once step 2 landed card
activation) might also fire that card's navigation in the same gesture. Turned out to be moot:
the panel is a dropdown that displaces the document flow (not a `fixed`/absolute overlay), so page
content is pushed down below it rather than covered by it — there is no overlap for a tap to hit
both at once. Confirmed by re-reading `Layout.tsx`: the panel `<div>` is a static-flow sibling
inside `<header>`, not positioned over `<main>`. No code change needed; recorded here so the
concern isn't silently dropped.

### Step 2 — Invoices list cards + activation (reqs 7-17, 19 for `/invoices`; ACs 5-7, 9-15, 17)

Files added:
- `src/pages/invoices/InvoicesList.test.tsx`

Files modified:
- `src/pages/invoices/InvoicesList.tsx` — below 768px renders `InvoiceCard` components: Invoice #
  as a real `Link` (headline position, doubles as the keyboard/AT route to the detail page now
  that View is dropped — req 15), Invoice Date / Due Date / Total as labelled `Field`s (req 7),
  actions Edit / Download PDF / Delete (no View, req 8/20). Whole-card `onClick` navigates unless
  the event target is inside an `a`/`button` (shared `isActionTarget` helper, also used by the
  table). At/above 768px renders the existing table unchanged in columns/actions, now wrapped in
  its own `overflow-x-auto` div (was `overflow-hidden` on the outer card, which caused clipping
  right at the flip width — moved the scroll boundary to just the table, leaving Pagination
  outside it). Each `<tr>` gained `onDoubleClick` (same `isActionTarget` guard) navigating to the
  detail page; the View link stays as the keyboard/AT route on this layout, per req 9/15.
  `useIsNarrow()` picks exactly one branch, never both.
- `src/components/Pagination.tsx` — container gained `flex-wrap`/`gap-y-2`; without it the page
  counter + per-page select + Previous/Next overflowed by ~5px at exactly 320px (found live, not
  by the component tests, which don't measure pixel widths). Shared by all three lists, so this
  fix also covers customers/senders ahead of step 3.

Gate history:
- gate-architecture: PASS on first pass. Same doc-drift warning as step 1 (project-structure.md /
  features-and-workflows.md not yet updated) — expected, deferred to step 5 (req 22).
- gate-clean-code: PASS on first pass, two nice-to-haves (not blocking, one taken anyway): a test
  named "does not navigate when tapping Edit, Download PDF or Delete" only actually exercised
  Edit — split into two tests and added real Download-PDF coverage (`InvoicesList.test.tsx`).
  Left as-is: `ConfirmDialog`'s delete button lookup in a test walks `.closest('div')!.parentElement!`,
  coupled to the dialog's internal markup — flagged as an option for later, not required now.
- gate-spec-what: PASS on first pass (live verification: 320/375/400/767/768/1280/1440px sweeps,
  real click/dblclick/keyboard event sequences, SVG-icon-child click targets specifically, a real
  Download-PDF click with `HTMLAnchorElement.prototype.click` stubbed for that one call so no file
  hit disk). One judgement call surfaced, decided in favour of the existing design rather than
  changed: the invoice number on a card carries no separate "Invoice #" label the way the other
  three fields do — it's the card's bold headline and the link target, which the gate accepted as
  "identifiable" under req 7 rather than an anonymous value. Recorded here because step 3 will
  copy this pattern to customers (Company) and senders (Company) — if that reading is ever
  revisited, it changes three list pages, not one.

Verification: `npx vitest run` — 84/84 (was 75 after step 1; +9 new tests). `npm run build` —
clean. Live in the Browser pane: card tap-to-navigate at 375px (touch-emulated) and 400px (mouse
event sequence), table single-click does nothing / double-click navigates at 1280px, action
buttons (including their inner `<svg>` as the literal click target) never trigger navigation,
confirm dialog fully usable at 320px, pagination select/Previous/Next operate and reach the
backend (`GET /api/invoices?...&limit=20` observed), heading + New Invoice button fully visible
and reachable at 320px, `document.documentElement.scrollWidth` == viewport width at every width
tested including 320/375 with the confirm dialog open, exactly one layout (table xor cards) at
every width from 320 to 1440 with no clipped table at the 768px flip point.

### Step 3 — Customers and senders lists (reqs 7-17, 19 for `/customers` and `/senders`; ACs 5-7, 9-15, 17)

Files added:
- `src/pages/senders/SendersList.test.tsx`
- `src/lib/rowActivation.ts` — extracted `isActionTarget(target)`, previously defined locally in
  `InvoicesList.tsx` (step 2), now shared by all three lists' row-dblclick and card-click guards.
- `src/components/CardField.tsx` — extracted the labelled-field card component, previously
  duplicated identically as a local `Field` in each list page. Fixes a real bug found live: a long
  unbreakable value (e.g. a customer's email) in a `grid-cols-2`/`grid-cols-3` card pushed the page
  wider than the viewport at 320px. `break-words` is the fix that actually holds the layout (the
  first version of the comment credited `min-w-0`; corrected after gate-spec-what measured it —
  removing `break-words` alone reproduces the overflow, removing `min-w-0` alone does not).

Files modified:
- `src/pages/customers/CustomersList.tsx` — below 768px renders `CustomerCard`: Company (via
  `resolveCustomerDisplayName`) as a real `Link` headline, Contact/Email as `CardField`s, Edit/
  Delete actions (no View). Wide table unchanged, wrapped in `overflow-x-auto`, rows gained
  `onDoubleClick`. Same `isActionTarget`-guarded activation pattern as invoices.
- `src/pages/customers/CustomersList.test.tsx` — extended with wide/narrow/activation tests;
  the two pre-existing display-name-fallback tests kept passing unchanged.
- `src/pages/senders/SendersList.tsx` — same pattern: Company headline, Full Name/Tax-VAT as
  `CardField`s, Edit/Delete.
- `src/pages/invoices/InvoicesList.tsx` — now imports `isActionTarget` and `CardField` from the
  new shared modules instead of defining them locally; invoices' own behaviour is unchanged from
  its step-2 gated state.

Gate history:
- gate-architecture: PASS on first pass. Confirmed the two new shared files fit `lib/` (pure,
  stateless helper) vs `components/` (presentational, no store access) per existing conventions;
  confirmed the invoices extraction left no leftover local duplicate. Same doc-drift warning as
  steps 1-2, deferred to step 5.
- gate-clean-code: PASS on first pass. One nice-to-have not taken: the four-line "why this Link is
  the keyboard route" comment is duplicated verbatim across all three card components — left as
  local, self-contained documentation rather than a one-line cross-reference, since each file
  reads standalone. Explicitly did not further unify `CustomerCard`/`SenderCard`/`InvoiceCard`
  beyond the two extractions already made — the project's documented per-entity-replication idiom
  (CLAUDE.md) plus the shallow, fiddly render-prop interface a further merge would need weighed
  against a small line-count saving.
- gate-spec-what: PASS on first pass after one retry of the gate call itself (a session usage
  limit cut the first attempt off mid-verification; re-run from scratch, not resumed, to be safe).
  Live verification (320/375/400/640/767/768/1280/1440px, real click/dblclick/Tab+Enter sequences,
  SVG-icon-child click targets, synthetic 42+46-char unbreakable values injected live) confirmed
  the `CardField` fix holds — `scrollWidth` stayed at the viewport width even under stress values
  longer than any real seeded data. Two non-blocking observations acted on: (1) the `min-w-0`/
  `break-words` comment mis-attributed which class does the actual work — corrected in
  `CardField.tsx` after this record's step. (2) at exactly 768px `/customers`' table container
  shows a 0.8px sub-pixel scroll from a fractional 703.7px table width — measured as genuinely
  nothing-clipped (no cell overflows, rightmost button 15px inside the edge), recorded so it isn't
  mistaken for a regression later, no code change made.

Verification: `npx vitest run` — 98/98 (was 84 after step 2; +14 new tests: 5 more in
`CustomersList.test.tsx`, 9 new in `SendersList.test.tsx`). `npm run build` — clean. Live: all
three lists confirmed overflow-free at 320px after the `CardField` fix (`documentElement.
scrollWidth` == viewport width on `/customers`, `/senders`, and re-confirmed on `/invoices` to
rule out a regression from the shared-helper extraction); exactly one layout per list at every
width 320-1440 on all three lists; keyboard-only reach to detail pages confirmed via real Tab+Enter
on both narrow and wide layouts, both entities.

### Step 4 — Details pages + global sweep (reqs 18-19; ACs 16-17)

Files added:
- `src/components/DetailRow.tsx` — extracted from byte-identical local `Row` components in
  `CustomerDetails.tsx`/`SenderDetails.tsx` (label/value grid row, empty-value guard, `break-words`
  on the value). Mirrors `CardField.tsx`'s established shape/rationale.

Files modified:
- `src/pages/invoices/InvoiceDetails.tsx` — line-items table wrapped in its own `overflow-x-auto`
  div (was inside the outer `overflow-hidden` card, so a wide table was genuinely unreachable —
  the exact failure the spec's Goal describes). Header row got the same `flex-wrap` treatment as
  the list pages (a real bug found live: at 320px the Download PDF/Edit buttons pushed the page
  wider than the viewport). `break-words` added to the h1 and to the local `Row`'s value cell
  (kept local, not folded into `DetailRow`, because it renders `ReactNode` with a `-` fallback and
  no empty-guard — genuinely different contract).
- `src/pages/invoices/InvoiceDetails.test.tsx`, `src/pages/customers/CustomerDetails.tsx`,
  `src/pages/customers/CustomerDetails.test.tsx`, `src/pages/senders/SenderDetails.tsx`,
  `src/pages/senders/SenderDetails.test.tsx` — same header-row `flex-wrap` fix and `break-words` on
  h1; customers/senders now import the shared `DetailRow` instead of a local copy.

Gate history:
- gate-architecture: PASS on first pass. Same doc-drift warning as steps 1-3, still deferred to
  step 5 (last chance before it becomes a real gap).
- gate-clean-code: FAIL (1 retry) → PASS. Must-fix: `CustomerDetails.tsx` and `SenderDetails.tsx`
  had byte-identical local `Row` components, and the `break-words` fix had been added to both in
  lockstep rather than once — extracted to `DetailRow.tsx`. Two nice-to-haves also taken: added the
  header-wrap regression test to `InvoiceDetails.test.tsx` (the other two already had one), and
  added `toHaveClass('break-words')` assertions on a value cell and the h1 in all three test files
  so the specific fix this step exists for can't silently regress.
- gate-spec-what: FAIL (1 retry) → PASS. First pass found a real bug: three live records (a
  sender's email, a customer's email, and the same customer surfaced via an invoice) overflowed
  the page at 320px by 1-14px because the shared `Row`'s value cell had no wrapping rule for an
  unbreakable long value — the same class of bug as `CardField` in step 3, on a different
  component. Fix: `break-words` on the `Row`/`DetailRow` value cell (verified live as the
  load-bearing class — `min-w-0` alone did not fix it). Re-verification surfaced a second,
  non-blocking gap in the same family (the h1 heading had no `break-words` either; no real seeded
  record hits it, but a synthetic long unbroken name would) — fixed proactively rather than left as
  a known landmine. A second re-run (after the clean-code extraction) confirmed the refactor didn't
  regress the fix or change any rendered field/label content.

Verification: `npx vitest run` — 108/108 (was 98 after step 3; +10 new tests). `npm run build` —
clean. Live: all three previously-failing records confirmed fixed at 320px and 375px
(`document.documentElement.scrollWidth` == viewport width); a full sweep of all 18 pages (3 lists +
3×5 detail records) at 320/375px found zero remaining overflow; line-items table scrolls fully
within its own container (confirmed by scrolling it to its end and finding the Total column inside
the viewport) while the page itself never scrolls; 1280px spot-checked on all six pages for
regression — clean, tables/headers unchanged.

### Step 5 — Docs + final gates (reqs 21-22)

Files modified (docs only, no source changes):
- `docs/features-and-workflows.md` — new "Narrow-viewport behavior" section: the single
  `useIsNarrow()` breakpoint and why 767.98 not 768, the mount-exactly-one-layout rule and why it
  matters (a11y + testability), the header's collapse/panel mechanics, the card layout and
  `CardField`, click/dblclick activation via `isActionTarget()`, the confirm dialog's exclusion by
  DOM position (not by the guard), the `break-words`-not-just-`min-w-0` gotcha for long values, and
  a closing note on the two other surfaces (line-items scroll, `Pagination` wrap) that reuse the
  same patterns rather than inventing new ones.
- `docs/project-structure.md` — added `useIsNarrow.ts`, `CardField.tsx`, `DetailRow.tsx`,
  `rowActivation.ts` to the source tree; removed a stale entry for a top-level `InvoicesList.tsx`
  duplicate that was actually deleted in an earlier, unrelated commit (`27a0ecd`) but never
  removed from this doc.

Gate history:
- gate-architecture: PASS on first pass. Confirmed doc claims accurate against source
  (`useIsNarrow.ts`, `Layout.tsx`, `CardField.tsx`, `rowActivation.ts`, `InvoicesList.tsx`) and
  that req 22 is satisfied — a later engineer reading both docs would understand the mechanism,
  not just a narrative summary.
- gate-clean-code: FAIL (1 retry) → PASS. Two must-fix factual errors: (1) the doc claimed
  `overflow-x-auto` "replaced" `overflow-hidden` on list tables — actually `overflow-hidden` stays
  on the outer wrapper (rounded corners) and `overflow-x-auto` is a new *nested* div around just
  the `<table>`; corrected. (2) the doc implied `isActionTarget()` was what excludes the confirm
  dialog from activation — actually the dialog is excluded because it's rendered outside every
  row/card's DOM subtree entirely, so its clicks never reach the guard; corrected to state the
  real mechanism. Three nice-to-haves also taken (trimmed redundant phrasing, removed redundant
  parenthetical tags, gave full paths for the three list page files).
- gate-spec-what: PASS on first pass for the in-scope criteria (req 21/AC 18, req 22), plus a
  holistic sweep across all 22 requirements and 18 ACs confirming nothing from steps 1-4 was left
  inconsistent. Three non-blocking observations, all closed proactively: a stale
  `project-structure.md` entry for an already-deleted file (unrelated to this spec, fixed anyway
  since this step was already touching that doc); a doc sentence overstating that *every* card
  field is labelled via `CardField` when the headline field is deliberately unlabelled-by-position
  (reworded to state the actual convention); and a suggestion to mention the two other
  narrow-viewport surfaces (line-items scroll, `Pagination` wrap) in the doc, added as a closing
  paragraph.

Verification: `npm test` — 32/32 node tests + 108/108 vitest (17 files) — unchanged from step 4,
confirming this was genuinely docs-only. `npm run build` — clean. `npm run lint` — same 19
pre-existing errors as the unmodified baseline, none in any file this whole change touched.

## Final state

All 5 steps complete and gated. All 22 requirements and all 18 acceptance criteria in
`specs/narrow-viewport-usability.md` are met — see the completion report delivered to the user for
the criterion-by-criterion verdict with evidence.
