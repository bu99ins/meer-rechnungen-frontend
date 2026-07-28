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
| `Authorization: Bearer <token>` | `localStorage.getItem('token')`, injected by the interceptor in `src/lib/api.ts` | JWT user auth |
| `X-Api-Gate: <key>` | `VITE_API_GATE_KEY` build-time env, set as an axios default in `src/main.tsx` | Interim shared edge-gate credential for the deployed backend; unset (no-op) locally |

## Endpoints

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
  invoiceDate: string;      // ISO date
  dueDate: string;          // ISO date
  currency: string;
  totalAmount: number;
}
```

**Detail**:
```typescript
{
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
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

**Upsert (create/update)**:
```typescript
{
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
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
  companyName: string;
  customerName: string;
  customerAddress: string;
  postalCode: string;
  customerEmail: string;
  customerTaxVatId: string;
}
```

### Sender
```typescript
{
  id?: string;
  senderCompanyName: string;
  senderFullName: string;
  senderAddress: string;
  senderTaxVatId: string;
  bankDetails: string;
}
```
