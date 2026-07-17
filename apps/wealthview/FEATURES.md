# Wealthview — Feature Inventory & Roadmap

*Version: 16 July 2026 · Single-file SPA · Spendly design kit (dark, #0B0E14 / #6366F1)*
*Live: https://claude.ai/code/artifact/d078f45d-2639-40ba-ac6f-72ee7b7ddcb1*

---

## 1. Data foundation

| Source | Coverage | Rows | Notes |
|---|---|---|---|
| BudgetBakers CSV export | Jun 2023 → Jul 2026 | 7,540 tx (6,519 expense / 1,021 income) | 85 raw categories → 16 groups |
| Subly / AppSumo export | Jul 2020 → Jun 2026 | 164 lifetime deals, $30,104 | Kept separate from monthly burn |
| Vendor unification | — | 1,214 vendors | IBAN stripping, chain grouping (Aldi, PTSB, Amazon, Paddle-wrapped, Enix→Brixly…) |

**Known data gaps**
- No **account** column in the BudgetBakers CSV export → can't split by Wise HTMD / Wise personal / Revolut business / Revolut personal yet. The BudgetBakers **MCP connector** (`get_accounts` + `get_records`) does carry account IDs — live sync is the path to per-account views.
- BudgetBakers export starts Jun 2023; AppSumo data backfills software spend to 2020.

## 2. Current features (shipped)

### Dashboard
- Net worth KPI (from your assets/liabilities)
- **Life Running Cost** — actual average monthly spend, last 3 complete months
- Avg income / month, recurring / month, current-month net position
- Income vs expenses chart — 12m / 24m / all-time toggle, click any month to drill in
- Spend-by-group donut (click a slice to open filtered ledger)
- Top running costs + recent activity feeds

### Net Worth
- Assets: property, cash/savings, investments, pension, vehicle, business equity
- Liabilities: mortgage, loans, credit/flexi
- Inline value editing; every change auto-snapshots → net worth over time chart
- All stored in browser localStorage

### Cash Flow
- Every month since Jun 2023: income, expenses, net, savings-%
- Year filter, click any month for its top-spend breakdown

### Running Costs ("where does my life-money go")
- Every vendor: charge count, active period, **lifetime avg/month** AND **typical/month** (median of active months — the number that makes your mortgage read €600, not €200)
- Min-charges filter, group filter, 5 sort orders, CSV export
- Click any vendor → full dossier modal: 24-month spend histogram, typical vs 3-mo vs lifetime, every transaction, one-click status/recurring buttons

### Subscriptions
- Card grid of recurring vendors, cost = typical monthly
- Status per vendor: active / review / paused / cancelled (+ auto-status from charge recency)
- "Not recurring" demotion; every override persisted
- Brandfetch logos (client-side, key stays in your copy only)

### Transactions
- Full 7,540-row ledger, 100/page
- Search + type + group + category + year + amount range + recurring/one-off filters
- Sortable date/amount, in/out totals for current filter, CSV export

### Categories
- Group → raw category drill-down, per year or all-time, click-through to ledger

### Lifetime Deals (AppSumo)
- $30,104 / 164 deals, 2020–2026, spend-by-year chart
- Searchable, sortable deal table; free deals flagged
- Deliberately excluded from monthly burn (one-off payments, lifetime value)

### Rules Engine
- Conditions: vendor name / group / charge count ≥ / avg €/mo ≥
- Actions: mark recurring, mark NOT recurring, set status
- Live match preview before saving; apply-all with change count; override registry

### Assistant (rule-based, local)
- `find X` · `total X 2026` · `top 10 vendors` · `monthly burn` · `report June 2026` · `report 2025` · `subscriptions` · `appsumo` · `net worth` · `add asset House 385000` · `mark brixly recurring` · `sync wallet`
- Answers computed live from the embedded ledger — no data leaves the page

### BudgetBakers connector (beta)
- "Sync Wallet" calls your BudgetBakers MCP connector from inside the claude.ai artifact
- Currently **read-only proof of pipe** — confirms connection + record count

## 3. Answers to open questions

**Is the MCP bidirectional?**
Not today. The BudgetBakers Wallet connector exposes read tools (`get_records`, `get_accounts`, `get_categories`, `get_client_profile`). Recategorisations or status changes made in Wealthview live in the app (localStorage) and do **not** write back — do canonical edits in BudgetBakers, then re-export/sync. If BudgetBakers ships write tools on their MCP, wiring "push my recategorisation back" is straightforward.

**Per-account / per-company breakdown (2× Wise business, 1× Revolut business, personal accounts)?**
Blocked only by the export format (no account column). Two routes:
1. **Live MCP sync** — `get_records` includes account references; build account dimension from live pulls. Preferred.
2. Per-account CSV exports from BudgetBakers, tagged at import.
Once account data lands: company vs personal split, per-entity P&L, cross-account transfer detection (so a Wise→Revolut top-up isn't double-counted as spend).

## 4. Roadmap (proposed order)

1. **Live BudgetBakers merge** — pull new records via connector, dedupe against embedded ledger, account dimension → per-company/personal views
2. **Trend engine** — YoY per vendor ("Anthropic up 34% vs 2025"), category inflation, new-vendor alerts, price-creep detection on recurring charges
3. **Crossover/overlap detection** — flag multiple vendors in the same function (3 SEO tools, 2 screen recorders…) using a service taxonomy; pairs beautifully with the AppSumo list
4. **Budgets & envelopes** (Actual-style) — per-group monthly targets with pace indicators
5. **Forecast** — recurring schedule projection: "committed spend next 90 days"
6. **True AI assistant** — swap the rule-based parser for a Claude-backed one (needs an API route or future artifact LLM capability)
7. **Multi-currency** — proper USD/GBP→EUR at transaction date (AppSumo currently shown in USD)
8. **Wealthview repo** — move code to github.com/heaventree/Wealthview (needs that repo added as a session source)

## 5. Toolset research pointers (from the four repos)

- **Maybe (maybe-finance)** — account/balance model, net-worth rollups, their "Assistant" chat UX
- **Actual Budget** — rules engine grammar (conditions/actions), schedules for forecasting, local-first sync
- **Wealthfolio** — asset classes & valuation snapshots for the Net Worth view
- **FinceptTerminal** — dense terminal-style analytics tables (Running Costs view leans this way)
