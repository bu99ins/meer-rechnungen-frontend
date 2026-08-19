# Narrow-viewport usability

## Goal

On a phone the application is currently crippled in two independent ways. The header nav is
`hidden sm:flex`, so below 640px every destination — Customers, Senders, New Invoice, and Users for
an Admin — silently disappears with nothing in its place; the only reachable page is `/invoices`,
via the logo. And all three list grids put a `min-w-full` table inside an `overflow-hidden`
container, so the rightmost Actions column is not merely off-screen but genuinely unreachable —
there is no scroll to reach it. This change makes the whole application operable at narrow widths:
the nav collapses into a menu that still leads everywhere, list rows become stacked cards whose
actions are fully on-screen, and a row opens its detail page directly — by double-click on the wide
table layout, by a single click or tap on a card. The data, the actions, the routes and the wording
all stay exactly as they are; what changes is whether a person holding a phone can reach them.

## Requirements

### Navigation at narrow widths

1. Below the narrow breakpoint, every destination the wide nav offers today — Invoices, Customers,
   Senders, New Invoice, and Users — is reachable through a menu control in the header that opens
   a panel listing them.
2. The Users entry appears in that panel only for an Admin identity, exactly as the wide nav gates
   it today. A non-Admin sees the other four.
3. The panel also carries the signed-in email and the Sign out control. At narrow widths the header
   bar itself carries only the brand lock-up and the menu control, so the bar stops competing for
   space with the email and the button.
4. The panel can be dismissed without navigating. Choosing a destination navigates to it and closes
   the panel.
5. The panel indicates the current section, as the wide nav does today.
6. At wide widths nothing about the header changes: the inline nav, the email and the Sign out
   button render exactly as they do now, and no menu control is present.

### List grids at narrow widths

7. Below a breakpoint, each row of the invoices, customers and senders lists renders as a stacked
   card carrying the same fields that row's table columns carry today, each field identifiable —
   no field becomes anonymous by losing its column header.
8. A card carries the row's actions minus View: Edit, Download PDF and Delete for an invoice; Edit
   and Delete for a customer and for a sender. Every one of them is fully within the viewport at
   320px — reaching an action never requires horizontal scrolling.
9. At wide widths each list renders today's table unchanged: same columns, same order, same
   wording, and the View action still present in the row.
10. At any given viewport width exactly one of the two layouts is present — never both, and never
    neither. The width at which a list switches to cards is a width at which its table still fits
    without clipping.
11. Deleting from a card goes through the same confirmation dialog as deleting from a table row,
    and that dialog is fully usable at 320px.

### Opening a record

12. Double-clicking a row of the invoices, customers or senders table opens that record's detail
    page.
13. A single click or tap anywhere on a card's body opens that record's detail page. The rule
    follows the layout, not the input device: cards always single-activate, table rows always
    require a double-click, on every machine.
14. Activation never fires when the interaction targets an action control — Edit, Download PDF,
    Delete or View — or anything inside the confirmation dialog. Tapping Delete on a card opens the
    confirmation and nothing else.
15. On both layouts a record's detail page is reachable using the keyboard alone and is exposed to
    assistive technology as a navigation to that record. The pointer gesture is never the only
    route to a detail page — this holds on cards too, where the View button has been dropped.

### Other surfaces that must survive a narrow viewport

16. The pagination controls under every list — the page counter, the per-page selector and
    Previous/Next — are fully visible and operable at 320px.
17. On every list page the heading, its description and the primary New X button are all legible
    and the button is fully reachable at 320px.
18. The invoice details line-items table shows all of its content at 320px without clipping. It may
    scroll horizontally within its own container, but it must not make the page itself scroll
    horizontally.

### Global

19. At every viewport width from 320px upwards, no page-level horizontal scrolling occurs on the
    three list pages, the three detail pages, or the header on any page.
20. Nothing about data, behaviour, routes, permissions or wording changes. Same columns, same
    field values, same actions, same confirmation flows, same copy. The only behavioural addition
    is row activation (requirements 12–15); the only removal is the View button on cards.
21. `npm run build` succeeds with no new TypeScript or lint errors, and `npm test` passes.
22. The narrow-viewport behaviour — the collapse of the nav, the card layout, and the activation
    rules — is recorded in `docs/`, so later work does not reintroduce a fixed-width grid.

## Acceptance Criteria

1. At a 375px viewport, the header shows the brand lock-up and a menu control, and no nav links,
   no email and no Sign out button inline. Opening the menu lists Invoices, Customers, Senders and
   New Invoice; each one navigates to the right route and closes the panel.
2. Signed in as an Admin at 375px, the panel additionally lists Users; signed in as a non-Admin it
   does not.
3. At 375px the panel can be closed without navigating, and the section currently open is marked
   in it.
4. At 1280px the header is pixel-identical to `main` before this change: inline nav, email, Sign
   out, and no menu control anywhere.
5. At 375px each of `/invoices`, `/customers` and `/senders` shows card-shaped rows, not a table.
   Every field that the wide table shows for that row is present on the card and identifiable.
6. At 375px an invoice card shows Edit, Download PDF and Delete and no View; a customer card and a
   sender card show Edit and Delete and no View. Every button is fully inside the viewport.
7. At 320px — the narrowest width the app declares support for — no action button on any card is
   clipped or requires horizontal scrolling to reach.
8. At 1280px all three lists render the same table as before, View button included, with the same
   columns in the same order.
9. Sweeping the viewport width from 320px to 1440px, each list shows exactly one layout at every
   width; at the width where it flips to a table, the table is not clipped.
10. At 1280px, double-clicking an invoice row navigates to that invoice's detail page; the same
    holds for a customer row and a sender row. A single click on a row navigates nowhere.
11. At 375px, a single tap on a card body navigates to that record's detail page. At 400px in a
    desktop browser with a mouse, a single click on a card body does the same.
12. Tapping Delete on a card opens the confirmation dialog and does not navigate to the detail
    page. The same holds for Edit and for Download PDF — each performs its own action only.
13. Using only the keyboard, a detail page can be reached from each of the three lists at 375px
    and at 1280px.
14. At 320px, the pagination row under each list is fully visible: the counter is readable, the
    per-page selector opens and changes the page size, and Previous/Next are tappable.
15. At 320px, each list page's heading and its New X button are both fully visible and the button
    is tappable.
16. At 320px, `/invoices/:id` shows every line item's Item, Qty, Unit Price and Total; nothing is
    cut off, and the page itself does not scroll horizontally.
17. On the three list pages and the three detail pages, at 320px and 375px,
    `document.documentElement.scrollWidth` does not exceed the viewport width.
18. `npm run build` and `npm test` both complete without errors.

## Implementation notes (constraints, not steps)

- `index.css` declares `body { min-width: 320px }` — 320px is the floor this spec verifies against,
  not an arbitrary choice.
- Today's collapse point is Tailwind's `sm` (640px), where `Layout.tsx` hides the nav. Requirement
  10 does not force the lists to flip at that same width; a list whose table needs more room may
  flip later, so long as no width leaves a clipped table.
- The three lists have different action sets — invoices carry a Download PDF the other two do not —
  so "the row's actions minus View" is per-entity, not one fixed set.
- Adding double-click activation to table rows costs the browser's native double-click
  word-selection inside those rows. That is an accepted consequence of the chosen gesture, not an
  oversight.
- The list pages are the only place `overflow-hidden` currently wraps a table; the invoice details
  line-items table (requirement 18) sits in the same kind of container and is in scope for
  reachability only — it has no actions and gains no activation behaviour.
- Requirement 15 exists because dropping View from cards would otherwise leave a pointer gesture as
  the sole route to a detail page on narrow screens, which is unreachable by keyboard and invisible
  to a screen reader.
- Out of scope: the invoice/customer/sender **forms** (their line-item grid already has responsive
  handling), the Users pages' internals, the login screen, the PDF download button's busy state,
  and any change to the brand palette or typography settled in `docs/visual-identity.md`.
