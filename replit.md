# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Project: FreightFlow — Freight Invoice Automation & Reconciliation

Full-stack logistics SaaS platform for Indian SMEs. Solves freight invoice visibility, reconciliation automation, and discrepancy management.

### Features
- Dashboard with stats (pending amounts in INR, dispute rate, reconciliation rate, shipment tracking)
- Freight cost trend charts by month/week/quarter
- Invoice management (create, filter by status/vendor, update status, delete)
- Vendor/Carrier management with GSTIN tracking
- Shipment tracking linked to invoices
- Automated reconciliation engine comparing invoice amounts vs. agreed freight costs
- Discrepancy management with resolve/escalate workflow

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   │   └── src/routes/     # invoices, vendors, shipments, reconciliation, dashboard
│   └── freightflow/        # React + Vite frontend
│       └── src/
│           ├── pages/      # Dashboard, Invoices, Vendors, Shipments, Reconciliation
│           ├── components/ # Layout (sidebar, app-layout), UI (modal, status-badge)
│           └── index.css   # Theme with blue primary, clean light mode
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/     # vendors, shipments, invoices, discrepancies tables
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes:
- `GET/POST /api/invoices` — list and create invoices
- `GET/PATCH/DELETE /api/invoices/:id` — invoice CRUD
- `GET/POST /api/vendors` — vendor management
- `GET/PATCH /api/vendors/:id`
- `GET/POST /api/shipments` — shipment tracking
- `GET/PATCH /api/shipments/:id`
- `POST /api/reconciliation/run` — run reconciliation engine
- `GET /api/reconciliation/discrepancies` — list discrepancies
- `PATCH /api/reconciliation/discrepancies/:id/resolve`
- `GET /api/dashboard/stats` — summary statistics
- `GET /api/dashboard/trends` — freight cost trends

### `artifacts/freightflow` (`@workspace/freightflow`)

React + Vite frontend. Wouter for routing, React Query for data fetching, Recharts for charts, react-hook-form for forms.

### `lib/db` (`@workspace/db`)

Database schema:
- `vendors` — carrier/vendor records with GSTIN, category (road/rail/air/sea/multimodal)
- `shipments` — shipment tracking with origin, destination, agreed freight cost
- `invoices` — freight invoices with status (pending/matched/disputed/paid/overdue)
- `discrepancies` — reconciliation discrepancies with type and resolution

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
