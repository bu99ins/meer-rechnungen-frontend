# API Contract (invoices-back)

The frontend integrates with the **invoices-back** backend API.

## Base URL configuration

- **Environment variable**: `VITE_API_URL`
- **Local dev default**: `http://localhost:5000` (from `.env.development`; the docker-compose
  backend). The frontend calls the backend directly and relies on its CORS policy — there is no
  Vite `/api` proxy.
- **Deployments**: `VITE_API_URL` is injected at build time (points at the deployed backend
  HTTPS URL).
- **Set in**: `src/main.tsx` → `axios.defaults.baseURL`

## Authentication headers

| Header | Source | Purpose |
|--------|--------|---------|
| `Authorization: Bearer <token>` | `src/lib/session.ts` (`localStorage` key `mvr.accessToken`), injected by the interceptor in `src/lib/api.ts` | JWT user auth |

## Endpoints

### Users
- `POST /api/users/login` → `{Email, Password}` → `{token, refreshToken}`. Anonymous. Wrong
  credentials: 400/404. Consumed by `src/services/users.ts` (`login()`) from `LoginPage`.
- `POST /api/users/refresh` → `{Token, RefreshToken}` → `{token, refreshToken}`. Anonymous, but
  needs the (possibly expired) old access token alongside the refresh token. Called only by the
  response interceptor in `src/lib/api.ts` on a 401 — see
  [known-issues-and-roadmap.md](known-issues-and-roadmap.md).
- `POST /api/users/register` → `{Email, Password, Role}` → 201 `{id, email}` (no role). Anonymous
  (the backend does not gate this). Consumed by `src/services/users.ts` (`register()`) from
  `UserCreate`, Admin-only in the UI via `RequireAdmin`. `Role` is restricted client-side to
  `Admin`/`Manager` (`src/types/user.ts`'s `ROLES`).
- `GET /api/users/{userId}` → `{id, email, role}` (`role` nullable — absent if no role assigned).
  Requires `users:read`. Consumed by `getUserById()` from `UserLookup`.
- `GET /api/users?email=` → `{id}` only, 404 if no match; single-record resolution, not a search
  or list endpoint. Requires `users:read`. Consumed by `getUserIdByEmail()` from `UsersHome`'s
  email-lookup form, which then navigates to `/users/{id}`.
- `PUT /api/users/{userId}` → `{Email}` → `{id, email}` (no role). Requires `users:update`.
  Consumed by `updateUserEmail()` from `UserLookup`'s email panel; the UI merges the response into
  its existing user state rather than replacing it wholesale, so the already-known role isn't lost.
- `POST /api/users/{userId}/role` → `{NewRole}` → 204. Requires `users:update`; invalidates the
  target user's refresh tokens. Consumed by `setUserRole()`. The UI refuses this action when the
  target is the signed-in admin's own account (`UserLookup`'s `isSelf` check).
- `DELETE /api/users/{userId}` → 204. Requires `users:delete`. Consumed by `deleteUser()`. Also
  refused by the UI when the target is the signed-in admin's own account.
- `POST /api/users/{userId}/password` → `{NewPassword}` → 204. Requires `users:update`;
  invalidates the target user's refresh tokens (so a self-password-change ends the current
  session — the UI signs out immediately with a distinct message rather than leaving a session
  that will silently fail on its next renewal attempt). Consumed by `resetPassword()` from
  `UserLookup`'s password panel, available for self and other users alike (unlike role/delete).

All list endpoints paginate with `?offset=0&limit=10` and return `Paged<T>`:
`{ items: T[], total: number, offset: number, limit: number }`.

### Invoices
- `GET /api/invoices?offset=0&limit=10` → list with pagination
- `GET /api/invoices/{id}` → detail
- `POST /api/invoices` → create
- `PUT /api/invoices/{id}` → update
- `DELETE /api/invoices/{id}` → delete
- `GET /api/invoices/{id}/download` → PDF blob (filename in `Content-Disposition` header)

### Customers
- `GET /api/customers?offset=0&limit=10` → list
- `GET /api/customers/{id}` → detail
- `POST /api/customers` → create
- `PUT /api/customers/{id}` → update
- `DELETE /api/customers/{id}` → delete

### Senders
- `GET /api/senders?offset=0&limit=10` → list
- `GET /api/senders/{id}` → detail
- `POST /api/senders` → create
- `PUT /api/senders/{id}` → update
- `DELETE /api/senders/{id}` → delete

## Data models

TypeScript sources: [src/types/](../src/types/).

### Invoice

**List item**:
```typescript
{
  id: string;
  invoiceNumber: string;
  invoiceDate: string;      // "yyyy-MM-dd" calendar date, no time/timezone component
  dueDate: string;          // "yyyy-MM-dd" calendar date, no time/timezone component
  currency: string;
  totalAmount: number;
}
```

**Detail**:
```typescript
{
  id: string;
  invoiceNumber: string;
  invoiceDate: string;      // "yyyy-MM-dd" calendar date, no time/timezone component
  dueDate: string;          // "yyyy-MM-dd" calendar date, no time/timezone component
  currency: string;
  notes?: string;
  customer: {
    id: string;
    companyName: string;
    customerName: string;
    customerAddress: string;
    postalCode: string;
    customerEmail: string;
    customerTaxVatId: string;
    customerType: 'Individual' | 'Business';
    documentLanguage: 'Estonian' | 'English';
  };
  sender: {
    id: string;
    senderCompanyName: string;
    senderFullName: string;
    senderAddress: string;
    senderTaxVatId: string;
    bankDetails: string;
  };
  lineItems: [
    {
      id?: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }
  ];
  subtotal: number;
  taxRate: number;
  totalAmount: number;
}
```
The backend's `sender` payload here also carries `senderPhone`/`senderEmail` (same shape as the
standalone Sender response below), but `SenderRef` in `src/types/invoice.ts` deliberately doesn't
declare them — the invoice editor has no use for them and is out of scope for exposing them.
Likewise, the backend's `customer` payload here carries `companyName`/`customerAddress`/
`postalCode`/`customerTaxVatId` as `string | null` (same canonicalize-to-`null` convention as the
standalone Customer response below), but `CustomerRef` in `src/types/invoice.ts` still declares
them as plain `string` — the invoice editor is out of scope for this change, so this divergence
was left as-is rather than widened; `src/pages/invoices/InvoiceDetails.tsx`'s own `Row` component tolerates it at
runtime (`value ?? '-'`) but renders a `-` for a blank value rather than omitting the row, unlike
the customer/sender details pages.

**Upsert (create/update)**:
```typescript
{
  invoiceNumber: string;
  invoiceDate: string;      // "yyyy-MM-dd" calendar date, no time/timezone component
  dueDate: string;          // "yyyy-MM-dd" calendar date, no time/timezone component
  currency: string;
  notes?: string;
  customerId: string;       // Reference by ID
  senderId: string;         // Reference by ID
  subtotal: number;
  taxRate: number;
  totalAmount: number;
  lineItems: LineItem[];
}
```

### Customer
```typescript
{
  id?: string;
  companyName: string | null;
  customerName: string;
  customerAddress: string | null;
  postalCode: string | null;
  customerEmail: string;
  customerTaxVatId: string | null;
  customerType: 'Individual' | 'Business';
  documentLanguage: 'Estonian' | 'English';
}
```
`customerType` is `'Individual'` or `'Business'`. `companyName`, `customerAddress`, `postalCode`,
and `customerTaxVatId` are all optional: a request may send `null`, `""`, a whitespace-only string,
or omit the key entirely, and none of these raise a validation error — except `companyName`/
`customerTaxVatId` for a `Business` customer, which still require a real non-blank value. Whatever
"absent" form is sent, the backend canonicalizes the stored and returned value to `null` — GET
responses (and the customer embedded in invoice responses) never distinguish a request that sent
`""` from one that sent `null`. The frontend's local component state coalesces this to `''` once, at
population, so downstream code (`.trim()` checks, controlled inputs) never has to handle `null` directly — see
`src/pages/customers/CustomerForm.tsx`. Create defaults `customerType` to `'Individual'` when
omitted; Update requires it explicitly on every request (an omission fails validation rather than
being applied) — the frontend must always send it, including on saves where the classification
itself is unchanged. `GET /api/invoices` list items do not embed customer data at all, so
`customerType` (like the rest of the customer shape) does not appear there. `customerName` and
`customerEmail` remain required non-blank and are never `null`.

`documentLanguage` is `'Estonian'` or `'English'` — the language the customer's downloaded invoice
PDF is generated in (fixed text, dates, numbers, and the filename's invoice word; see
[features-and-workflows.md](features-and-workflows.md#invoice-management) for the download
workflow). It is always present — there is no `null`/unset state — and is
handled exactly like `customerType`: Create defaults it to `'Estonian'` when omitted (matching the
`CustomerForm` control's pre-selected value), and Update requires it explicitly on every request,
the same "always send it, even unchanged" rule as `customerType`. `GET /api/invoices` list items
omit it along with the rest of the embedded customer shape, for the same reason `customerType`
is omitted there.

### Sender
```typescript
{
  id?: string;
  senderCompanyName: string;
  senderFullName: string;
  senderAddress: string;
  senderTaxVatId: string;
  bankDetails: string;
  senderPhone: string | null;
  senderEmail: string | null;
}
```
`senderPhone` and `senderEmail` are optional, with the same canonicalize-to-`null` convention as
the Customer fields above: a request may send `null`, `""`, a whitespace-only string, or omit the
key, and the backend always returns `null` for an absent value. When `senderEmail` is non-blank it must be a
syntactically valid email address; `senderPhone` is accepted as free text. `senderCompanyName`,
`senderFullName`, `senderAddress`, `senderTaxVatId` and `bankDetails` remain required and are never
`null`.
