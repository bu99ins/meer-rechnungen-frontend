# State Management (Zustand)

All three stores follow the same shape; sources in [src/store/](../src/store/). Each is created
with `create(...)` wrapped in the `devtools` middleware.

## useInvoicesStore

**State**:
- `list: InvoiceListItem[]` – paginated items
- `total: number` – total count
- `offset: number` – pagination offset
- `limit: number` – page size (default 10)
- `current?: InvoiceDetail` – selected invoice
- `loading: boolean`
- `error?: string`

**Actions**:
- `fetch(offset?, limit?)` – load page (defaults to current offset/limit from state)
- `fetchOne(id)` – load detail into `current`
- `create(payload) → InvoiceDetail` – create, then refresh list from page 0
- `update(id, payload) → InvoiceDetail` – update, then refresh current page
- `remove(id)` – delete, then refresh current page
- `download(id)` – fetch PDF blob and trigger a browser download
- `setPage(offset, limit)` – set pagination
- `setCurrent(inv?)` – set selected invoice
- `clearError()` – reset error state

## useCustomersStore / useSendersStore

Same state shape (list, total, offset, limit, current, loading, error) and the same actions
minus `download`.

## Conventions

- Mutating actions (`create`, `update`, `remove`) re-fetch the list after success so the table
  reflects server state.
- Every async action wraps its service call in try/catch: failures set `error` (with a
  per-action fallback message) and re-throw for `create`/`update`/`remove` so forms can react.
- `loading` is set `true` at the start and cleared in `finally`.
- Components read state with selectors and call actions directly; there is no dispatch layer.
