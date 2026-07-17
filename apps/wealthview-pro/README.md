# Wealthview Pro (Phase 2)

Enterprise rebuild per `../wealthview/PHASE2_ENTERPRISE.md`, patterned on
JAMOPS-AIOS (dashboard-grid/store architecture) with Spendly design tokens.

Stack: Vite · React 19 · TypeScript · Tailwind · TanStack Table v8 (+virtual)
· react-grid-layout · Recharts · Zustand · Lucide.

## Run

```
bun install
bun run dev      # http://localhost:5173
```

Data: `public/wv-data.json` — same compact JSON `../wealthview/prep_data.py`
produces; regenerate and copy to refresh. Swaps for the Postgres/Turso API later.

## Shipped

- **Dashboard** — JAMOPS-style board: drag/resize/add/remove widgets in edit
  mode, per-breakpoint layouts, persisted (KPIs, income-vs-expenses,
  spend-by-group donut, top vendors)
- **Ledger** — TanStack grid over all 7,540 tx: virtualized, sortable columns,
  global search (raw bank descriptors included), kind/group/year filters,
  column picker, saved views, live in/out totals

## Next (build order in PHASE2 doc)

Vendors + Subscriptions + Net Worth ports · forensics workbench (DuckDB-WASM)
· ECharts category deep-dives · Annuals + renewals · per-view AI copilot.

Known scaffold shortcuts: recurring KPI uses the raw recurring flag and top
vendors uses lifetime avgMonthly — the SPA's typical()/detectSub() logic
ports across with the Vendors page.
