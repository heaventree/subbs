# Wealthview

Single-file personal accounting companion built from a BudgetBakers CSV export.
Dark-first UI based on the Spendly design kit.

## What it does

- **Dashboard** — net worth, life running cost (3-month actual burn), income vs expenses (12m/24m/all), spend-by-group donut, top running costs, recent activity
- **Net Worth** — manually tracked assets (property, savings, investments, pension, vehicles) and liabilities (mortgage, loans, credit); auto-snapshots history and charts it
- **Cash Flow** — month-by-month income/expense/net table for the full history, click any month to drill in
- **Running Costs** — every vendor's actual average monthly cost ("what does my life cost"), charges, active period, lifetime total, status
- **Subscriptions** — recurring vendors as cards with 3-month actual cost, status management (active/review/paused/cancelled), recurring override
- **Transactions** — full ledger (7,540 rows) with search, type/group/category/year/amount/recurring filters and CSV export
- **Categories** — group → category drill-down by year
- **Rules Engine** — "if vendor name contains X → mark recurring / set status", with live match preview
- **Assistant** — rule-based chat: find vendors, totals, reports, monthly burn, add assets, mark recurring; live BudgetBakers pull via claude.ai connector when running as an Artifact

## Build

```
python3 prep_data.py    # CSV → compact JSON (set CSV path inside)
python3 build_app.py    # JSON → wealthview.html
```

Set `BFKEY` in `build_app.py` to a Brandfetch API key for vendor logos
(never commit the key). All user edits (statuses, rules, assets) persist
in browser localStorage.
