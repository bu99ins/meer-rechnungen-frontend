# Currency improvements

## Goal

Two currency loose ends remain on the frontend after the invoices-list currency work. First, the
invoice create form starts every new invoice at `USD`, which is wrong for this product's users —
a new invoice should start in euros, while still letting the user type a different currency.
Second, the app's own contract still describes the invoice list item's currency as a field the
backend does not send: the type marks it optional and `docs/api-contract.md` carries a KNOWN GAP
note, both written when the backend genuinely omitted it. Once the backend's list projection
includes the currency, that description is stale and understates what the list can rely on. This
change fixes the create-form default and, separately, brings the list-item contract and its
documentation in line with what the backend actually sends. No currency is ever converted, no
stored invoice's currency changes, and how amounts are presented is not otherwise altered.

## Requirements

### A. Create-form default

These requirements have no backend dependency and can be satisfied on their own.

1. Opening the invoice create form shows `EUR` as the pre-filled currency.
2. The currency field remains editable and remains required: the user can replace the pre-filled
   value with a different currency and create an invoice in it, and clearing the field still
   prevents submission exactly as it does today.
3. An invoice created without the user touching the currency field is submitted with `EUR`.
4. The edit form is unaffected: opening an existing invoice for editing shows that invoice's own
   stored currency. A stored non-euro invoice must never display, or be saved back as, `EUR`
   merely because it was opened for editing.

### B. List-item contract and documentation

**Precondition:** these requirements come into force only once the backend change that adds
currency to the `GET /api/invoices` projection is merged and deployed to the environment this
frontend talks to. Satisfying them before that point would state a guarantee the API does not yet
honour.

5. The invoice list item type describes currency as a value the API always sends, not an optional
   one, and the comment justifying its optionality is gone.
6. `docs/api-contract.md` no longer describes the list item's currency as a known gap or as a
   field the backend does not send, and its documented list-item shape matches the type in
   `src/types/invoice.ts`.
7. Tightening the type does not weaken runtime behaviour: `formatCurrency` still returns a
   symbol-free amount rather than throwing, or falling back to dollars, when it is handed a
   missing, empty, or invalid currency code. The list must still survive a malformed response.
8. The existing tests asserting that behaviour continue to pass unchanged — they are not deleted,
   loosened, or rewritten to accommodate the stricter type.

### C. Non-regression

9. `npm run build` succeeds with no new TypeScript or lint errors, and `npm test` passes.

## Acceptance Criteria

1. Navigating to the new-invoice route shows a Currency field whose value is `EUR`, with no
   interaction required.
2. On the create form, replacing the pre-filled value with `USD` and submitting sends `USD` as the
   invoice's currency; submitting without touching the field sends `EUR`.
3. On the create form, clearing the Currency field blocks submission, the same as before this
   change.
4. Opening an existing invoice stored with currency `USD` in the edit form shows `USD` in the
   Currency field, and saving without touching that field leaves the invoice stored as `USD`.
5. An automated test covers the create form defaulting to `EUR`, and it fails if the default is
   changed back to `USD` or to any other currency.
6. A search of `src/types/invoice.ts` and `docs/api-contract.md` finds no remaining claim that the
   backend's list projection omits currency, and no `currency?:` on the list-item shape in either.
7. `formatCurrency` called with `undefined`, `''`, and an invalid code such as `'not-a-currency'`
   still returns a dollar-free result and does not throw — verified by the existing tests in
   `src/utils/format.test.ts`, passing without modification.
8. With the backend change deployed, the invoices list shows a euro presentation for an `EUR`
   invoice and a dollar presentation for a `USD` invoice, in the same list, with both totals
   equal to the stored numbers.
9. `npm run build` and `npm test` both succeed.

## Implementation notes

Constraints, not steps:

- The currency input stays a free-text field. Turning it into a fixed dropdown, restricting the
  accepted set of currencies, or validating against ISO 4217 is **not** part of this change — the
  requirement is a default, not a constraint on what the user may enter.
- Section B is a contract- and documentation-level change. It must not alter how any amount is
  rendered, and it grants no permission to remove the defensive handling in `formatCurrency`,
  which exists because a type is a compile-time promise and not a runtime guarantee about what an
  API actually returns.
- No currency conversion is introduced anywhere, consistent with
  [deutsch-und-meer-visual-identity.md](deutsch-und-meer-visual-identity.md) requirement 16.

## Out of scope

- The backend's list projection change itself, which is specified separately in the backend repo
  as `specs/invoice-list-currency.md` and is a precondition for section B, not part of this work.
- Any change to the invoice detail page, the PDF download, or how the backend formats currency in
  the generated document.
