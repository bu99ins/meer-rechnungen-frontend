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
