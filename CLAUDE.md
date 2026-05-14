# meer-rechnungen-frontend – CLAUDE.md

**Project**: `meer-rechnungen-frontend` (v0.0.0)  
**Type**: React 19 / TypeScript 5.7 / Vite 6 SPA  
**Role**: Frontend for the **invoices-back** backend system  
**Status**: Analysis snapshot captured (2026-05-13)

---

## 1. Purpose & Scope

This is the **frontend SPA** for the invoice management system. It provides:
- Invoice CRUD operations with PDF download capability
- Customer management (create, list, update, delete)
- Sender/company configuration management
- Paginated list views and detailed forms
- JWT-based authentication (Bearer token from localStorage)
- Integration with the **invoices-back** backend API at `https://localhost:5001`

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js (via Vite dev server) | LTS recommended |
| **Language** | TypeScript | 5.7.2 |
| **Framework** | React | 19.0.0 |
| **Build Tool** | Vite | 6.3.1 |
| **State Management** | Zustand | 4.5.2 (with devtools middleware) |
| **HTTP Client** | Axios | 1.6.7 |
| **Routing** | React Router | 7.1.5 |
| **UI/Styling** | Tailwind CSS | 3.4.1 |
| **Icons** | Heroicons | 2.1.1 |
| **Linting** | ESLint | 9.22.0 + typescript-eslint |

---

## 3. Project Structure

```
src/
├── main.tsx              # Entry point; Axios configuration with VITE_API_URL
├── App.tsx               # Root component; routing setup (BrowserRouter)
├── App.css               # Global styles
├── index.css             # Tailwind + global resets
├── vite-env.d.ts         # Vite environment type definitions
│
├── components/           # Reusable UI components
│   ├── Layout.tsx        # Root layout wrapper (nav, sidebar, etc.)
│   ├── Form.tsx          # Generic form component
│   ├── Pagination.tsx    # Pagination control
│   ├── ConfirmDialog.tsx # Delete/action confirmation modal
│   ├── EmptyState.tsx    # "No data" placeholder
│   └── Loading.tsx       # Loading spinner/skeleton
│
├── pages/                # Page-level components
│   ├── InvoicesList.tsx  # (top-level) Invoice list view
│   ├── invoices/
│   │   ├── InvoicesList.tsx    # (detail) Invoice list with table
│   │   ├── InvoiceDetails.tsx  # Invoice view with PDF download
│   │   └── InvoiceForm.tsx     # Create/Edit invoice form
│   ├── customers/
│   │   ├── CustomersList.tsx
│   │   ├── CustomerDetails.tsx
│   │   └── CustomerForm.tsx
│   └── senders/
│       ├── SendersList.tsx
│       ├── SenderDetails.tsx
│       └── SenderForm.tsx
│
├── services/             # API service layer (HTTP calls)
│   ├── invoices.ts       # Invoices API (GET, POST, PUT, DELETE, download)
│   ├── customers.ts      # Customers API (CRUD)
│   └── senders.ts        # Senders API (CRUD)
│
├── store/                # Zustand state stores
│   ├── invoicesStore.ts  # Invoice state + CRUD actions
│   ├── customersStore.ts # Customer state + CRUD actions
│   └── sendersStore.ts   # Sender state + CRUD actions
│
├── types/                # TypeScript type definitions
│   ├── common.ts         # Paged<T> generic type
│   ├── invoice.ts        # Invoice, InvoiceDetail, LineItem types
│   ├── customer.ts       # Customer type
│   └── sender.ts         # Sender type
│
├── hooks/                # Custom React hooks
│   └── useKeyPress.ts    # Keyboard event hook
│
├── lib/                  # Utility libraries
│   └── api.ts            # Axios instance factory + JWT interceptor
│
├── utils/                # Utility functions
│   └── format.ts         # formatCurrency, formatDate helpers
│
└── assets/               # Static assets (images, fonts, etc.)
```

---

## 4. API Integration & Backend Contract

### Base URL Configuration
- **Environment Variable**: `VITE_API_URL`
- **Default**: `https://localhost:5001` (from `.env`)
- **Set in**: `src/main.tsx` → `axios.defaults.baseURL`

### Authentication
- **Method**: JWT Bearer token
- **Storage**: `localStorage.get('token')`
- **Header**: `Authorization: Bearer <token>`
- **Injected by**: `src/lib/api.ts` → axios request interceptor

### Endpoints (invoices-back contract)

#### Invoices
- `GET /api/invoices?offset=0&limit=10` → list with pagination
- `GET /api/invoices/{id}` → detail
- `POST /api/invoices` → create
- `PUT /api/invoices/{id}` → update
- `DELETE /api/invoices/{id}` → delete
- `GET /api/invoices/{id}/download` → PDF blob (Content-Disposition header)

#### Customers
- `GET /api/customers?offset=0&limit=10` → list
- `GET /api/customers/{id}` → detail
- `POST /api/customers` → create
- `PUT /api/customers/{id}` → update
- `DELETE /api/customers/{id}` → delete

#### Senders
- `GET /api/senders?offset=0&limit=10` → list
- `GET /api/senders/{id}` → detail
- `POST /api/senders` → create
- `PUT /api/senders/{id}` → update
- `DELETE /api/senders/{id}` → delete

---

## 5. Data Model

### Invoice
**List Item**:
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

**Upsert (Create/Update)**:
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

---

## 6. State Management (Zustand)

### useInvoicesStore
**State**:
- `list: InvoiceListItem[]` – paginated items
- `total: number` – total count
- `offset: number` – pagination offset
- `limit: number` – page size
- `current?: InvoiceDetail` – selected invoice
- `loading: boolean`
- `error?: string`

**Actions**:
- `fetch(offset?, limit?)` – load page
- `fetchOne(id)` – load detail
- `create(payload) → InvoiceDetail` – create + refresh list
- `update(id, payload) → InvoiceDetail` – update + refresh list
- `remove(id)` – delete
- `download(id)` – trigger PDF download
- `setPage(offset, limit)` – set pagination
- `setCurrent(inv?)` – set selected invoice
- `clearError()` – reset error state

### useCustomersStore
**State**: Similar to invoices (list, total, offset, limit, current, loading, error)  
**Actions**: fetch, fetchOne, create, update, remove, setPage, setCurrent, clearError

### useSendersStore
**State**: Similar structure  
**Actions**: Same pattern

---

## 7. Development & Build

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (hot reload) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | ESLint check |
| `npm run preview` | Preview production build locally |

### Environment Setup
Create `.env` in project root:
```
VITE_API_URL=https://localhost:5001
```

### Build Output
- **Directory**: `dist/`
- **Generated by**: Vite (from `src/index.html` + bundle)
- **Artifacts**: Minified JS/CSS + source maps (if enabled in vite.config.ts)

### TypeScript Configuration
- **Target**: ES2020
- **Strict mode**: Enabled
- **No unused locals/params**: Enforced
- **Build info cache**: `.tsbuildinfo` in `node_modules/.tmp/`

---

## 8. Key Features & Workflows

### Invoice Management
1. **List View**: Paginated table with invoice#, date, due date, total
   - Actions: View details, Edit, Delete, Download PDF
   - Pagination controls at bottom
2. **Create/Edit Form**: Modal/dedicated page with customer/sender selection, line items
3. **Details View**: Read-only invoice display + PDF download button
4. **PDF Download**: Triggers backend `/invoices/{id}/download` endpoint; parses Content-Disposition header for filename

### Customer Management
1. **List**: Paginated customer table (company, name, email, tax ID)
2. **CRUD**: Create, view, edit, delete
3. **Used in**: Invoice forms (dropdown/selector)

### Sender Management
1. **List**: Paginated sender table
2. **CRUD**: Create, view, edit, delete
3. **Used in**: Invoice forms (dropdown/selector)

### Pagination
- Controlled via Zustand store (offset, limit)
- Form component passes offset/limit to API
- Store refreshes table after action (optimistic + server refresh)

### Error Handling
- Try-catch in each service call
- Zustand store captures `error` state
- Displayed in UI (typically toast or error banner)
- `clearError()` action to reset

### Loading States
- `loading` flag in store
- Component shows spinner while true
- Set to false in finally block

---

## 9. Development Patterns

### Adding a New Page
1. Create folder in `src/pages/newentity/`
2. Add List, Details, Form components
3. Add service file in `src/services/newentity.ts`
4. Add Zustand store in `src/store/newentityStore.ts`
5. Add types in `src/types/newentity.ts`
6. Add routes in `App.tsx` (List, Create, Details, Edit)

### Adding a New API Endpoint
1. Create/update service function in `src/services/`
2. Add to corresponding Zustand store as action
3. Call store action from page component
4. Handle loading/error states in component

### Form Component Pattern
- Generic `<Form />` component takes config + handlers
- Components import and use it with entity-specific fields
- Submit calls store action, which calls service, which calls Axios

---

## 10. Known Issues & Considerations

### Content-Disposition Parsing (invoices.ts)
- Comment in `downloadInvoicePdf()`: "Axios v1+ uses AxiosHeaders…"
- Manual fallback parsing for filename from Content-Disposition header
- Reason: axios v1.6.7 may not expose headers consistently in browser context
- **Fallback**: Uses `invoice-${id}.pdf` if header parse fails

### Token Management
- Token stored in localStorage
- No refresh token mechanism documented
- **Assumption**: Backend handles token validity; frontend just stores & sends it

### Error Boundaries
- No explicit error boundary component
- Errors caught in service/store level only
- **Risk**: Unhandled promise rejections could silently fail

---

## 11. Dependencies Summary

### Production
- `react@^19.0.0` – UI framework
- `react-dom@^19.0.0` – DOM rendering
- `axios@^1.6.7` – HTTP client
- `zustand@^4.5.2` – State management
- `@heroicons/react@^2.1.1` – Icon library
- `react-router-dom@^7.1.5` – Routing

### Development
- `typescript@~5.7.2` – Type checking
- `vite@^6.3.1` – Build tool
- `@vitejs/plugin-react@^4.3.4` – React plugin for Vite
- `tailwindcss@^3.4.1` – CSS utility framework
- `postcss@^8.4.35` – CSS processing
- `eslint@^9.22.0` + `typescript-eslint@^8.26.1` – Linting
- `autoprefixer@^10.4.17` – CSS vendor prefixing

---

## 12. Deployment Notes

- Build via `npm run build` → outputs to `dist/`
- Serve as static SPA (all routes → `index.html`)
- Must set `VITE_API_URL` before build or via runtime env injection
- No server-side rendering; purely client-side React

---

## 13. Next Steps & Recommendations

1. **Add error boundary** component to gracefully handle React errors
2. **Implement token refresh** mechanism (if backend supports)
3. **Add unit tests** (Jest/Vitest) for services & stores
4. **Add E2E tests** (Playwright/Cypress) for workflows
5. **Validate response schemas** (e.g., zod/yup) at service layer
6. **Add loading skeletons** for better UX during data fetches
7. **Document backend API contract** in a shared schema (OpenAPI/GraphQL)
8. **Set up CI/CD** pipeline (GitHub Actions, etc.)

---

**Generated**: 2026-05-13 | **Tool**: repo-minion  
**Context**: Scanned for backend integration awareness (invoices-back dependency noted)
