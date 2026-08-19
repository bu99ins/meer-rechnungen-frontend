# Deutsch und Meer visual identity

## Goal

The app still wears the generic "Invoice Builder" identity it was scaffolded with: an `IB` badge,
the Vite favicon, an indigo accent colour and Inter type — none of which belong to the company that
actually uses it. This change dresses the whole frontend in the Deutsch und Meer identity taken
from the company business card (`_design/Deuch und meer vis 90x50 bleed3mm.pdf`): the product names
itself **Meer von Rechnungen** everywhere it names itself, the seagull-and-waves logo mark replaces
the `IB` badge and the Vite favicon, the top header becomes a deep-blue branded bar, and the card's
palette (deep blue, sky blue, warm gray) and Montserrat typeface replace indigo and Inter
throughout. It is a re-skin, not a redesign: no page gains, loses or rearranges anything. Riding
along are two small correctness fixes in the same visual territory — required form fields become
visually distinguishable from optional ones (today they are identical), and the invoices list stops
labelling every total with a dollar sign regardless of the currency the invoice was actually
entered in.

## Requirements

### Name and mark

1. The site header shows the product name **Meer von Rechnungen**, replacing "Invoice Builder".
   The browser tab title (`index.html`) shows it too, replacing "Invoice Builder". The login
   screen already uses this name and must continue to.
2. The browser favicon is the company's seagull-and-waves mark, replacing `/vite.svg`. The
   circular "DEUTSCH UND MEER" ring text is **not** part of it — the mark is the seagull plus the
   two wave arcs only. It must remain recognisable rendered at 16×16.
3. The header badge shows the same seagull-and-waves mark, replacing the `IB` lettering.
4. Both the favicon and the header mark are derived from the business card's own vector artwork,
   not redrawn by eye — the shapes must match the card's seagull and arcs.

### Colour and type

5. The top header bar is filled with the brand deep blue `#1066A4`. Everything sitting in it — the
   wordmark, the nav links, the active-nav indication, the signed-in email, the sign-out control,
   and the logo mark — is re-treated so it remains legible against that fill, at a contrast ratio
   of at least 4.5:1 for text. An active nav link stays distinguishable from an inactive one.
6. The brand palette replaces indigo across the application: deep blue `#1066A4` is the primary
   action colour (primary buttons, links, focus rings, active states); sky blue `#1EABE2` is an
   accent only — never the primary action colour, never the sole carrier of a meaning, and never
   used for small text on a white background; warm gray `#6A6B6D` is the muted text tone.
7. No `indigo-*` utility class and no `#4f46e5` literal remains anywhere in `src/`,
   `tailwind.config.js` or `index.css`.
8. Red is preserved as-is for destructive actions (delete buttons) and validation/error states.
   These are semantic, not brand, colours and are out of the palette swap.
9. Montserrat replaces Inter as the application's sans-serif family for all text, loaded in at
   least the regular and semibold weights the UI already uses. No text renders in Inter. The
   unused `Söhne` entry in the `tailwind.config.js` font stack goes away with it.
10. Nothing about layout, structure, component inventory, page copy or behaviour changes: same
    pages, same routes, same table columns, same field order, same wording (apart from the product
    name), same interactions. Only colour, typeface, the logo mark and the affordances named in
    requirements 11–14 differ.

### Required-field affordance

11. A form field that the form enforces as required is visually distinguishable from an optional
    one in two ways at once: a marker (asterisk) on its label, and a distinct treatment of the
    input itself. An optional field carries neither.
12. Each form carries a short legend (e.g. "* Required field") explaining the marker.
13. The error/invalid treatment of an input remains visually distinct from — and takes precedence
    over — the required treatment, so a required field showing an error still reads as an error.
14. A field that is only conditionally required carries the marker only while it is actually
    required. (Today's case: Company Name and Tax/VAT ID in the customer form, required for
    Business customers, not for Individual.) Inputs that carry no label — the invoice line-item
    name/quantity/unit-price/total inputs, which are placeholder-only and not enforced as required
    — gain no marker and no required treatment.

### Currency in the invoices list

15. The Total column of the invoices list renders each invoice's amount in the currency that
    invoice actually carries, not a hardcoded default. An invoice entered in euros shows a euro
    amount.
16. No currency conversion happens anywhere — the number is displayed as stored, only its currency
    presentation changes.
17. An invoice whose currency is missing, empty or not a valid currency code must neither crash the
    list nor silently present the amount as US dollars.

### Non-regression

18. `npm run build` succeeds with no new TypeScript or lint errors, and `npm test` passes.
19. The brand palette and typeface are recorded in `docs/` so later work does not reintroduce
    indigo or Inter.

## Acceptance Criteria

1. Loading any page shows "Meer von Rechnungen" in the header; the browser tab reads "Meer von
   Rechnungen"; the login screen still reads "Meer von Rechnungen". The strings "Invoice Builder"
   and "IB" appear nowhere in the running UI.
2. The browser tab icon is the seagull-and-waves mark, not the Vite logo. Viewed at 16×16 the
   seagull is still identifiable as a bird; no ring text is present.
3. Placing the favicon/header mark side by side with page 1 of
   `_design/Deuch und meer vis 90x50 bleed3mm.pdf` at the same size, the seagull and wave shapes
   coincide — it is the same artwork, not a lookalike.
4. The header bar renders filled with `#1066A4`. Every piece of text and every control in it is
   readable against that fill, measured at ≥4.5:1; clicking through Invoices / Customers / Senders,
   the current section is visibly marked.
5. `grep -ri "indigo\|4f46e5" src tailwind.config.js index.css` returns nothing.
6. Delete buttons and validation error messages are still red, on the lists and in every form.
7. Computed `font-family` on body text, table cells, form inputs and headings resolves to
   Montserrat in the browser; neither `Inter` nor `Söhne` appears in the `index.html` webfont link
   or in the `tailwind.config.js` font stack.
8. Screenshots of the invoices list, invoice details, invoice form, customers list and login taken
   before and after differ only in colour, typeface and the logo mark — no element has moved,
   appeared, disappeared or changed its wording (product name aside).
9. In the sender form, every required field shows the label marker and the required input
   treatment, and the form shows the "* Required field" legend. In the invoice form, the Notes and
   Tax Rate fields — which are not required — show neither marker nor required treatment.
10. Submitting a form with a required field empty produces the error treatment on that field, and
    the field visibly reads as an error rather than merely as required.
11. In the customer form, switching the classification from Business to Individual removes the
    marker/required treatment from Company Name and Tax/VAT ID along with the fields themselves;
    switching back restores both.
12. The invoice line-item rows show no asterisks and no required input treatment.
13. An invoice created with currency `EUR` shows its total with a euro presentation in the
    invoices list, matching what its own details page already shows; an invoice created with `USD`
    shows a dollar presentation. The two are visibly different in the same list.
14. An invoice list response whose item has `currency: ""` renders a row without throwing, and that
    row does not display a `$`.
15. `npm run build` and `npm test` both complete without errors.

## Implementation notes (constraints, not steps)

- The brand colours are sampled from the card artwork: deep blue `#1066A4`, sky blue `#1EABE2`,
  warm gray `#6A6B6D`, white. The card's type is Montserrat (Regular and SemiBold).
- The logo exists only as vector paths inside the business-card PDF — there is no exported asset in
  the repo. Getting a usable SVG out of it is part of this change.
- On the deep-blue header the card's own mark colours (gray seagull, deep-blue arcs) will not read
  against the fill. Whatever treatment resolves this — a light tile behind the mark, a light
  monochrome variant of it — must not alter the mark's shapes (requirement 4).
- `index.html` currently loads Inter from Google Fonts; the app has no other webfont mechanism.
- `formatCurrency` in `src/utils/format.ts` already takes a currency argument and defaults it to
  `'USD'`; `InvoiceListItem` already carries `currency`; `InvoiceDetails` already passes it. The
  list is the only caller that does not.
- Indigo occurrences span 17 files under `src/`, plus `tailwind.config.js` and `index.css` — the
  swap is app-wide, not confined to the shared components.
- The required-field affordance belongs in the shared `src/components/Form.tsx` primitives rather
  than being repeated per page; the invoice line-item inputs use those same primitives without
  labels, which is what keeps them out of scope (requirement 14).
- Out of scope: mobile/responsive fixes to the list tables, row click-to-open behaviour, the PDF
  download button's busy state, dark mode, and any change to UI language (the interface stays
  English despite the German product name).
