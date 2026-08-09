# Customer business/individual classification toggle

## Goal

Companion to the backend's `spec/customer-b2b-b2c-classification`: the backend now stores an
explicit business/individual classification on every customer. Create defaults a customer to
**Individual** whenever a request omits the classification; Update requires it explicitly — a
request that omits it is rejected outright (400 validation error) rather than silently applied, so
an unmodified caller cannot corrupt a customer's classification, but it also cannot successfully
save *any* edit to *any* existing customer until it starts sending the field. This change adds the
classification to the customer create/edit form (Individual selected by default, matching the
backend's own default) and sends it explicitly on every Create/Update Customer request, so this
frontend's Update requests stop failing validation. Company Name and Tax/VAT ID become Business-only in
the form: hidden and unvalidated for Individual, required for Business — closing, in the same
pass, the pre-existing gap where Tax/VAT ID was never required client-side even though the
backend already required it for every customer. Everywhere the UI shows a customer's company name
as its primary label, an Individual customer's empty company name is replaced by their personal
name instead.

## Requirements

1. The customer create/edit form gains a Business/Individual classification control. A new
   customer defaults to Individual, matching the backend's own default.
2. Every Create Customer and Update Customer request sent by the frontend includes the
   classification explicitly, for both classifications — the frontend never omits it and never
   relies on the backend's own default-on-omission behavior, since relying on it on an Update
   would silently revert an existing Business customer to Individual.
3. Editing an existing customer loads and displays its actual stored classification (not the
   create-time default).
4. When Business is selected, Company Name and Tax/VAT ID are shown and both are required to
   save, matching the backend's validation for Business customers. When Individual is selected,
   both fields are hidden from the form entirely, and neither is required to save.
5. Toggling the classification back and forth within one form session does not discard whatever
   was already typed into Company Name/Tax-VAT ID while those fields were hidden — switching back
   to Business restores it.
6. Wherever the UI displays a customer's company name as its primary label — the customers list
   column, the customer details page heading, the invoice customer-picker option label, and the
   invoice details "Company" row — a customer whose company name is empty or whitespace-only
   displays their customer name instead. A Business customer with a company name is unchanged
   from today.
7. `npm run build` (the only deploy gate) succeeds with no new TypeScript or lint errors.
8. `docs/api-contract.md` is updated to reflect the classification field on the Customer shape.

## Acceptance Criteria

1. Creating a customer without touching the classification control results in an Individual
   customer, verified via `GET /api/customers/{id}` after creation.
2. Selecting Business in the create form, leaving Company Name or Tax/VAT ID blank, and
   attempting to save is blocked client-side (matching today's pattern for the existing required
   fields), with no request sent.
3. Selecting Individual in the create form allows saving with Company Name and Tax/VAT ID both
   blank; the two fields are not present/visible in the form while Individual is selected.
4. Opening the edit form for an existing Business customer shows Business selected, with Company
   Name and Tax/VAT ID visible and populated; opening it for an existing Individual customer shows
   Individual selected, with those two fields hidden.
5. In the edit form, typing into Company Name while Business is selected, switching to Individual
   and back to Business, still shows the typed value.
6. Saving an edit to an existing customer of either classification — having changed nothing about
   the classification itself — sends a request body that includes the unchanged classification
   value explicitly (inspectable via the network tab), never omitting it.
7. For a customer with an empty company name: the customers list row, that customer's details
   page heading, the invoice form's customer-picker option, and the invoice details "Company" row
   all display the customer's name instead of a blank company name.
8. `npm run build` completes without errors.

## Implementation notes (constraints, not steps)

- The exact JSON key/value shape used for the classification (its field name, and whether values
  are serialized as strings or numbers) must be verified against the actual backend
  request/response shape once the backend side is implemented, not assumed from this spec.
- Follow the existing per-entity three-layer pattern (`services/customers.ts`,
  `store/customersStore.ts`, `pages/customers/*`) and the existing `Form` components.
- Out of scope: senders, and any invoice field other than the customer-label display call out in
  requirement 6.
