# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

React 19 / TypeScript / Vite 6 SPA for invoice management (invoices, customers, senders — CRUD + PDF download). Frontend for the **invoices-back** backend API, which lives in a separate repo/directory. Deployed to Cloudflare Pages behind an edge Basic-Auth gate.

Detailed reference docs (API contract & data models, store shapes, workflows, known issues) live in [docs/](docs/README.md).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server at http://localhost:5173 |
| `npm run build` | `tsc -b && vite build` → `dist/` (this is also the only deploy gate in CI) |
| `npm run lint` | ESLint |
| `npm test` | `node --test` — runs `test/*.test.js` (Node's built-in runner, no Jest/Vitest) |
| `node --test test/gate.test.js` | Run a single test file |
| `deploy/verify-frontend-workflow.sh` | Static check that the deploy workflow stays manual-only and test/lint-free (bash) |

Local dev needs the backend running via docker-compose at `http://localhost:5000` (committed in `.env.development`). There is **no Vite proxy** — the app calls the backend cross-origin and relies on the backend's CORS policy allowing `http://localhost:5173`.

## Architecture

Data flow per entity (invoices / customers / senders), each with the same three layers:

- `src/services/<entity>.ts` — plain async functions calling axios (`getApi()` from `src/lib/api.ts`), endpoints `/api/<entity>` with `?offset=&limit=` pagination returning `Paged<T>` (`{ items, total, offset, limit }`).
- `src/store/<entity>Store.ts` — Zustand store (with devtools) holding `list/total/offset/limit/current/loading/error` and actions (`fetch`, `fetchOne`, `create`, `update`, `remove`, …). Mutations re-fetch the list; errors are caught and stored in `error`, loading cleared in `finally`.
- `src/pages/<entity>/` — List / Details / Form pages wired to routes in `src/App.tsx` (`/<entity>`, `/<entity>/new`, `/<entity>/:id`, `/<entity>/:id/edit`). Forms take a `mode="create" | "edit"` prop.

To add a new entity, replicate all three layers plus `src/types/<entity>.ts` and routes in `App.tsx`.

### Axios setup (two places, order matters)

`src/main.tsx` sets `axios.defaults.baseURL = import.meta.env.VITE_API_URL` and, when `VITE_API_GATE_KEY` is set, a default `X-Api-Gate` header. `src/lib/api.ts` then lazily creates a singleton instance (`getApi()`) that copies those defaults and adds a request interceptor injecting `Authorization: Bearer <token>` from `localStorage.getItem('token')`. Services must go through `getApi()`, not raw axios.

### Auth / gating (three separate mechanisms)

1. **Frontend edge gate** — `functions/_middleware.js` is a Cloudflare Pages Function enforcing HTTP Basic Auth on every request to the deployed frontend. Credential comes from the Pages project env (`GATE_USER` / `GATE_PASSWORD`), never committed. Fails closed if unconfigured. Unit-tested in `test/gate.test.js`.
2. **Backend edge gate (interim)** — deployed builds bake `VITE_API_GATE_KEY` into the bundle; every API request carries it as `X-Api-Gate` so the gated backend admits it. Unset locally (no-op). Scheduled for removal once JWT enforcement replaces it.
3. **JWT Bearer token** — read from localStorage by the interceptor. There is currently no login UI or refresh flow; the frontend just stores and sends it.

## Deployment

`.github/workflows/deploy-frontend.yml` — **manual only** (`workflow_dispatch`), deliberately no push/PR trigger. The deploy gate is the build alone: tests and lint do NOT run in the pipeline and must not block a deploy (this is a spec requirement, verified by `deploy/verify-frontend-workflow.sh` — keep both in sync if you touch the workflow). Deploys `dist/` plus `functions/` to Cloudflare Pages via wrangler. Required repo config: vars `VITE_API_URL`, `CLOUDFLARE_PROJECT_NAME`; secrets `VITE_API_GATE_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Gotchas

- `tsconfig.app.json` has strict mode plus `noUnusedLocals`/`noUnusedParameters`; the build (and therefore deploy) fails on unused symbols.
- `functions/_middleware.js` and `test/gate.test.js` are plain JS ESM run at the Cloudflare edge / by Node — they are outside the Vite/TS build.
- PDF download (`downloadInvoicePdf` in `src/services/invoices.ts`) parses the `Content-Disposition` header defensively (Axios v1 AxiosHeaders vs plain object) and falls back to `invoice-<id>.pdf`.
- `src/pages/InvoicesList.tsx` (top-level) is a leftover duplicate; the routed one is `src/pages/invoices/InvoicesList.tsx`.
- Package name in `package.json` is `invoice-builder-frontend`; the product name is "Meer von Rechnungen".
