# Technology Stack & Project Structure

## Technology stack

| Layer | Technology | Version (package.json) |
|-------|-----------|------------------------|
| **Language** | TypeScript | ~5.7.3 |
| **Framework** | React | ^19.2.6 |
| **Build Tool** | Vite | ^6.4.2 |
| **State Management** | Zustand (with devtools middleware) | ^4.5.7 |
| **HTTP Client** | Axios | ^1.16.0 |
| **Routing** | React Router DOM | ^7.15.0 |
| **UI/Styling** | Tailwind CSS | ^3.4.19 |
| **Icons** | Heroicons | ^2.2.0 |
| **Linting** | ESLint + typescript-eslint | ^9.39.4 / ^8.59.3 |
| **Tests** | Node built-in test runner (`node --test`, plain-JS logic) + Vitest/jsdom/React Testing Library (`src/**/*.test.{ts,tsx}`, component tests) | Node 22 in CI |

## Repository layout

```
├── src/                      # The React SPA (see below)
├── test/
│   └── *.test.js             # node:test unit tests (jwt, problem, refreshDecision)
├── deploy/
│   └── verify-frontend-workflow.sh  # Static checks on the deploy workflow
├── .github/workflows/
│   └── deploy-frontend.yml   # Manual-only Cloudflare Pages deploy
├── .env.development          # Committed local-dev config (VITE_API_URL=http://localhost:5000)
└── dist/                     # Build output (generated)
```

## Source tree (`src/`)

```
src/
├── main.tsx              # Entry point; axios defaults (VITE_API_URL)
├── App.tsx               # Root component (BrowserRouter) wrapping the exported AppRoutes, which
│                         # holds the actual route tree; sibling create/edit routes are keyed on
│                         # the pathname so React Router remounts the form instead of reusing it
├── App.css               # Global styles
├── index.css             # Tailwind + global resets
├── vite-env.d.ts         # Vite environment type definitions
├── test-setup.ts         # Vitest setup (jest-dom matchers); loaded via vite.config.ts's test.setupFiles
│
├── components/           # Reusable UI components (co-located *.test.tsx run under Vitest)
│   ├── Layout.tsx        # Root layout wrapper: header (nav or, below the narrow breakpoint, a
│   │                     # menu button + dropdown panel — see docs/features-and-workflows.md
│   │                     # "Narrow-viewport behavior") + <Outlet/>
│   ├── Form.tsx          # Generic form component
│   ├── Pagination.tsx    # Pagination control
│   ├── ConfirmDialog.tsx # Delete/action confirmation modal
│   ├── EmptyState.tsx    # "No data" placeholder
│   ├── Loading.tsx       # Loading spinner/skeleton
│   ├── Loading.test.tsx  # Vitest + React Testing Library smoke test
│   ├── CardField.tsx     # Labelled value on a narrow-viewport list card
│   └── DetailRow.tsx     # Labelled value on a detail page, omitted when blank
│
├── pages/                # Page-level components
│   ├── invoices/
│   │   ├── InvoicesList.tsx    # Invoice list: table (wide) or cards (narrow) — see
│   │   │                       # docs/features-and-workflows.md "Narrow-viewport behavior"
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
│   ├── useKeyPress.ts    # Keyboard event hook
│   └── useIsNarrow.ts    # The single narrow/wide breakpoint (matchMedia-backed) — see
│                         # docs/features-and-workflows.md "Narrow-viewport behavior"
│
├── lib/                  # Utility libraries
│   ├── api.ts            # Axios instance factory + JWT interceptor
│   └── rowActivation.ts  # isActionTarget() — shared list-row/card click/dblclick activation guard
│
├── utils/                # Utility functions
│   └── format.ts         # formatCurrency, formatDate helpers
│
└── assets/               # Static assets (images, fonts, etc.)
```

## Dependencies summary

### Production
- `react` / `react-dom` — UI framework and DOM rendering
- `axios` — HTTP client
- `zustand` — state management
- `@heroicons/react` — icon library
- `react-router-dom` — routing

### Development
- `typescript`, `vite`, `@vitejs/plugin-react` — build toolchain
- `tailwindcss`, `postcss`, `autoprefixer` — styling pipeline
- `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` — linting

Exact versions live in [package.json](../package.json); the table above is a snapshot and
`package.json` is authoritative.
