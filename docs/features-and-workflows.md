# Key Features & Workflows

## Invoice management

1. **List view**: paginated table with invoice#, date, due date, total
   - Actions: view details, edit, delete, download PDF
   - Pagination controls at the bottom
2. **Create/Edit form**: dedicated page with customer/sender selection and line items
3. **Details view**: read-only invoice display + PDF download button
4. **PDF download**: calls the backend `GET /api/invoices/{id}/download` endpoint; parses the
   `Content-Disposition` header for the filename and falls back to `invoice-<id>.pdf`

## Customer management

1. **List**: paginated customer table (company, name, email, tax ID)
2. **CRUD**: create, view, edit, delete
3. **Used in**: invoice forms (dropdown/selector)

## Sender management

1. **List**: paginated sender table
2. **CRUD**: create, view, edit, delete
3. **Used in**: invoice forms (dropdown/selector)

## Narrow-viewport behavior

The app is operable down to 320px (`index.css`'s `body { min-width: 320px }` is the declared
floor). One breakpoint governs everything: `src/hooks/useIsNarrow.ts` exports a `useIsNarrow()`
hook backed by `matchMedia('(max-width: 767.98px)')` (767.98, not 768, so the query and Tailwind's
`md:` prefix — which activates *at* 768px — never both claim the same pixel). This is the single
source of truth for narrow vs. wide; the header nav and all three list grids switch at the same
width, and each switch mounts exactly one of its two layouts — never both, never neither — because
each is a plain `isNarrow ? <A/> : <B/>` in the component, not a CSS `hidden`/`block` toggle. That
matters for accessibility (no duplicated content for a screen reader) and for tests (`vitest`
mocking `matchMedia` — see `src/test-setup.ts`'s `setViewportWidth` helper — can assert on exactly
one branch being present).

**Header** (`src/components/Layout.tsx`): below the breakpoint the header bar shows only the brand
lock-up and a menu button; the inline nav, signed-in email and Sign out button disappear from the
bar (not just visually — they aren't rendered) so the bar never competes for space with them at
320px. The menu button opens a dropdown panel (`role="dialog"`) inside the header, listing the
same destinations as the wide nav — from a single shared `NAV_ITEMS` array so the two layouts
cannot drift apart — plus the email and Sign out. The panel closes on Escape, on an outside click,
on choosing any destination (including the one already open), and via the toggle button itself. At
and above the breakpoint the header is unchanged from before this behavior existed.

**Lists** (`src/pages/invoices/InvoicesList.tsx`, `src/pages/customers/CustomersList.tsx`,
`src/pages/senders/SendersList.tsx`): below the breakpoint each table row becomes a card. A card's
headline is the row's identifying field (invoice number / company name), unlabelled by position —
the same way a table's leftmost cell needs no per-row label because the column header already
carries it. Every other field the table's columns show appears below the headline, labelled via
the shared `src/components/CardField.tsx` (mirrors a column header + cell, so no value is
anonymous), plus the row's actions minus View — Edit, Download PDF and Delete for an invoice; Edit
and Delete for a customer or sender (invoices are the only entity with a Download PDF action). At
and above the breakpoint the table is unchanged in columns, order and actions; its outer wrapper
still carries `overflow-hidden` (for the card's rounded corners) but the `<table>` itself now sits
inside its own nested `overflow-x-auto` div, so a table too wide for its viewport scrolls within
that inner div — reachably, not clipped by the outer `overflow-hidden` — rather than losing the
Actions column with
no way to reach it, which is what the same `overflow-hidden` directly on the table used to do.

**Opening a record**: a card's body is a single click/tap target — the whole card navigates to the
record's detail page unless the interaction targets an action control (Edit/Download
PDF/Delete/View), via a shared `isActionTarget()` guard (`src/lib/rowActivation.ts`) checking
`event.target.closest('a, button')`. The confirm dialog needs no such guard: it's rendered once at
the bottom of the page, outside every row/card's DOM subtree, so a click inside it never bubbles
through a row's or card's handler in the first place. A table row instead
requires a double-click (its single click still does nothing — the browser's native double-click
word-selection inside a row is an accepted cost of this gesture). Every card also carries a real
`<Link>` on its headline field (invoice number / company name) — since View is dropped from cards,
this is the keyboard- and screen-reader-reachable route to the detail page; a wide row keeps its
View link for the same purpose. The activation rule follows the layout, not the input device: cards
always single-activate, table rows always require a double-click, on every machine.

**Long values**: a labelled value that can be an arbitrarily long, unbreakable string (an email
address, an IBAN, a company name) needs an explicit `break-words` (Tailwind's
`overflow-wrap: break-word`) wherever it's rendered, or it can push the whole page wider than the
viewport even though it visually looks fine — the overflow shows up only in
`document.documentElement.scrollWidth`, not in a screenshot, because the unwrapped text still
renders at its natural (off-screen) position while an ancestor merely doesn't visibly clip it.
`CardField.tsx` and `src/components/DetailRow.tsx` (the list-card and detail-page equivalents of a
labelled field) both carry this; a *new* place that renders user-entered text at a fixed narrow
width needs the same treatment, not just a `min-w-0` on its grid/flex container (which is
insufficient on its own — verified live during this behavior's implementation).

**Other narrow-viewport surfaces**: the invoice details page's line-items table gets the same
nested `overflow-x-auto` treatment as the three list tables (its own scroll boundary, not the
page's — see `InvoiceDetails.tsx`); `src/components/Pagination.tsx`'s controls wrap
(`flex-wrap`/`gap-y-2`) instead of overflowing at 320px, which every list and the invoice details
page share via the same component. Neither of these is a second breakpoint or a second mechanism —
they're the same `overflow-x-auto`-for-tables and wrap-instead-of-clip rules applied wherever a
fixed-width row of content exists, so a future fixed-width addition anywhere in the app should
default to the same pattern rather than reinvent one.

## Routing

All routes are declared in [src/App.tsx](../src/App.tsx). Per entity:
`/<entity>` (list), `/<entity>/new` (create), `/<entity>/:id` (details),
`/<entity>/:id/edit` (edit). `/` and unknown paths redirect to `/invoices`.

## Pagination

- Controlled via the Zustand store (`offset`, `limit`)
- List pages pass offset/limit to the store's `fetch` action
- Store refreshes the table after any mutation

## Error handling

- Try/catch in each store action; service errors land in the store's `error` state
- Displayed in the UI (error banner); `clearError()` resets it
- No React error boundary exists yet (see known issues)

## Loading states

- `loading` flag in each store
- Components show a spinner (`components/Loading.tsx`) while true
- Cleared in the store action's `finally` block
