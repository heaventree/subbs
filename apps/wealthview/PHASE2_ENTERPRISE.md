# Wealthview Phase 2 — Enterprise Rebuild ("Project management for your wealth health")

*17 Jul 2026 · response to the first dev-notes export (12 notes) + strategic direction*

## Verdict

The single-file SPA has hit its ceiling. It stays as the **field prototype**
(fast to iterate, holds the data model), but every "enterprise" note —
fluid dashboards, deep filtering, compare tools, premium feel — lands in a
proper React build.

## Stack decision (from the 5 uploaded Horizon templates)

**Base: `horizon-tailwind-react-ts`** — TypeScript + Tailwind + Vite-able,
no Next.js server (local-first app), Tailwind maps 1:1 onto our Spendly
tokens. Mine `horizon-ui-chakra-ts-feature-react-table-v8` for its
TanStack Table v8 patterns (column defs, sorting, filtering, pagination).

| Need (from notes) | Component |
|---|---|
| Sortable/filterable/comparable grids everywhere | **TanStack Table v8** (headless) — AG Grid Community as fallback if pivoting needed |
| Fluid, resizable, editable dashboard | **react-grid-layout** (drag/resize/save layouts per user) |
| Charts: expanded categories, compare, donut, drill | **ECharts** (canvas, brush-zoom, dataZoom, rich interactions) via echarts-for-react |
| Data engine for 7.5k→100k tx client-side | **DuckDB-WASM** — SQL analytics in the browser (the ClickHouse/Spark links point at server OLAP; DuckDB-WASM gives that power without a server, and the SQL ports straight to Postgres later) |
| State/server | TanStack Query + the existing Postgres schema when backend lands |

The JAMOPS-AIOS repo (views/filters/compare bar) — this sandbox can only
reach `heaventree/subbs`, so upload a zip or add it as a session source and
I'll extract its patterns directly.

## Note-by-note disposition

| # | Note | Disposition |
|---|---|---|
| 1 | Search kicks you out per letter | ✅ **FIXED** (debounced render + focus restore, all pages) |
| 2 | Vendors columns sortable | ✅ **FIXED** (click headers, both directions) |
| 3 | Running Costs sortable columns | ✅ **FIXED** |
| 4 | Vendors/clients jumbled, skewing stats | ✅ **FIXED** — one-click ⇅ to-income/to-expense in Vendors actions; reclassify moves the vendor's transactions between income/expense in every stat |
| 5 | Vet counted as subscription | ✅ **FIXED** — detection now requires a service-type group OR ≥65% amount steadiness; organic spending (vet, food, fuel) excluded. 82 → 51 subs. Escape hatch: one-click sub toggle + rules |
| 6 | "Completed" status for loans/fixed terms | ✅ **FIXED** — new status with positive styling, excluded from active recurring, retro dataset intact |
| 7 | AI assistant hangs | ✅ **FIXED** — hard timeouts (90s chat / 180s reasoner) + precise error copy. If it still fails on localhost, the F12 console error tells us whether it's CORS or the key |
| 8 | Annuals page (insurance etc.) + renewal reminders | 🔜 **NEXT in SPA** — annual-cadence detection exists in the data (spanMonths/count); needs its own view + reminder banner |
| 9 | Categories: expanded views, bar/donut/compare, deep filtering | 🏗 Phase 2 (ECharts + DuckDB) |
| 10 | Cash Flow: refine by income/expense, yearly/monthly averages | 🏗 Phase 2 (pivot grid) — quick wins possible in SPA if wanted |
| 11 | Net Worth looks basic / emoji icons | 🏗 Phase 2 (Horizon cards, SVG icon set, wealth-grade design) |
| 12 | No true surgical forensic tool; dashboard not editable | 🏗 Phase 2 centrepiece: **Forensics workbench** — DuckDB SQL over the ledger, saved investigations, compare periods/vendors/categories side-by-side, drill-to-transaction everywhere + react-grid-layout dashboard |

## Phase 2 build order

1. **Scaffold** `apps/wealthview-pro` from horizon-tailwind-react-ts; port Spendly tokens; data adapter reads the same compact JSON (later the Postgres API)
2. **Ledger grid** (TanStack) — the workhorse: every column sortable/filterable, column picker, saved views, bulk actions (type/owner/status/merge)
3. **Forensics workbench** — DuckDB-WASM + query presets + compare mode (this is note 12, the reason the app exists)
4. **Dashboard** — react-grid-layout, widget library (KPI, chart, grid, AI insight), edit/save/reset
5. **Categories + Cash Flow analytics** — ECharts drill-downs, YoY/MoM compare, averages panel
6. **Net Worth premium** — holdings, allocation donut, net-worth bridge, proper iconography
7. AI copilot embedded per-view (DeepSeek), Annuals + renewals calendar

Each step ships usable; the SPA remains the fallback until parity.

## Immediate next actions

- [x] Track-A fixes shipped in SPA build 17.07-b
- [ ] Sean: upload JAMOPS-AIOS zip (or add repo as source) for pattern extraction
- [ ] Sean: green-light Phase 2 scaffold → I start `apps/wealthview-pro`
- [ ] Annuals view in SPA meanwhile (next SPA iteration)
