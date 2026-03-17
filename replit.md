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

## Project: FreightFlow — Freight Invoice Automation & Reconciliation SaaS

Full-stack commercial SaaS platform for Indian SME logistics companies. Built to be a multi-crore revenue business.

### Core App Features
- **Dashboard** — 6 stat cards: pending amount, total paid, disputed, reconciliation rate, savings, active shipments. Freight cost trends + dispute rate charts.
- **Invoice Management** — create, filter, bulk-select, bulk-action (mark paid/overdue/disputed/delete), Export CSV, Import CSV, status badges (pending/paid/matched/disputed/overdue)
- **Vendor & Carrier Management** — 15 vendors seeded with GSTIN, category, payment terms, vendor performance endpoint
- **Shipment Tracking** — 28 shipments across India with origin/destination, status, agreed freight cost
- **Automated Reconciliation** — 3-way match engine: invoice vs. agreed cost → discrepancies auto-flagged. Resolve/escalate workflow.
- **Payment Tracking** — record payments with method (NEFT/RTGS/UPI/Cheque/Bank Transfer/Cash), TDS deduction, UTR reference number
- **Aging Report** — invoices bucketed by overdue days (current, 1–30, 31–60, 61–90, 90+) with amount totals and percentages
- **GST Reconciliation Report** — GSTR-2B style vendor-wise GST breakdown with GSTIN, taxable amount, GST collected, TDS deducted. Month selector + CSV export.
- **Vendor Performance Scorecards** — composite 0–100 score based on on-time delivery rate, dispute rate, avg delay. Sortable leaderboard.
- **Commercial Landing Page** at `/landing` — full marketing site with hero, features, pricing tiers (₹999/₹2999/₹7999 per month), testimonials, how-it-works, CTA. India-specific copy.

### India-Specific Features
- INR formatting with ₹ symbol throughout
- GSTIN field on vendors (format: 27AABCD1234A1Z5)
- TDS tracking under Section 194C on payments
- GST reconciliation (GSTR-2B style)
- HSN code support on invoices

### Commercial Positioning
- Pricing tiers: Starter ₹999/mo, Growth ₹2999/mo, Enterprise ₹7999/mo
- Target: 340+ SME logistics companies
- Revenue milestone: ₹47 Cr+ in freight processed
- TAM: Indian logistics SME market ₹8L crore

### Database Scale (seeded)
- 15 vendors (BlueDart, DTDC, VRL, Mahindra Logistics, Gati KWE, TCI Express, Safexpress, Rivigo, etc.)
- 50 invoices with realistic amounts (₹5k–₹1.5L range)
- 28 shipments across major Indian routes
- 10 payment records with TDS deduction

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

Express 5 API server on port 8080. Routes:
- `GET/POST /api/invoices` — list and create invoices (with status/vendor filter)
- `GET/PATCH/DELETE /api/invoices/:id` — invoice CRUD
- `POST /api/invoices/bulk` — bulk action (mark_paid, mark_overdue, mark_disputed, delete)
- `GET/POST /api/vendors` — vendor management
- `GET/PATCH /api/vendors/:id`
- `GET /api/vendors/:id/performance` — vendor performance score
- `GET/POST /api/shipments` — shipment tracking
- `GET/PATCH /api/shipments/:id`
- `POST /api/reconciliation/run` — run reconciliation engine
- `GET /api/reconciliation/discrepancies` — list discrepancies
- `PATCH /api/reconciliation/discrepancies/:id/resolve`
- `GET /api/dashboard/stats` — summary (totalAmountPaid, savingsFromReconciliation, etc.)
- `GET /api/dashboard/trends` — freight cost trends by period
- `GET/POST /api/payments` — payment CRUD with TDS tracking
- `GET /api/reports/aging` — aging buckets (current, 30/60/90/90+ days)
- `GET /api/reports/gst` — GSTR-2B vendor-wise GST breakdown (month param)
- `GET /api/reports/vendor-performance` — all vendor performance scores
- `GET /api/reports/export/invoices` — CSV export of invoices

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
