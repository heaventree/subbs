# Wealthview — Phase 1 database

Trusted unified ledger in PostgreSQL. Single-view per decision **D-001**
(all money is one book), but every table already carries a nullable
`entity_id` so Phase 3 multi-entity is a reclassification, not a rebuild.

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Full schema v1 — tables, enums, indexes, triggers, reporting views |
| `load.py` | Loader: populates the ledger from `prep_data.py`'s compact JSON |

## What's modelled

- **Provenance & lineage** — `import_batch`, `source_record` (immutable raw rows, `fingerprint` UNIQUE = idempotent import)
- **Ledger** — `txn` with original + reporting (EUR) amounts, direction, kind (income/expense/transfer), review state, confidence, soft-delete
- **Splits** — `txn_split` for one transaction across many dimensions
- **Transfer matching** — `transfer_match` (two-sided) so internal moves never inflate spend
- **Vendors** — `vendor` + `vendor_alias` registry, trigram search
- **Categories** — `category` (group → category, `is_transfer` flag)
- **Automation** — `rule`, `vendor_override` (migrated out of localStorage)
- **Wealth** — `asset`, `nw_snapshot`
- **Lifetime deals** — `lifetime_deal` (AppSumo, kept out of monthly burn)
- **Audit** — `audit_event` for every material action

### Reporting views
- `v_monthly` — income vs real expenses (transfers excluded) + transfers + net, per month
- `v_vendor_running` — lifetime + typical monthly (median of active months) per vendor

## Run locally

```bash
# 1. create db + load schema
createdb wealthview
psql -d wealthview -f schema.sql

# 2. produce the compact JSON, then load it
python3 ../prep_data.py                       # writes /tmp/spendly2_data.json
pip install 'psycopg[binary]'
DATABASE_URL=postgresql:///wealthview python3 load.py /tmp/spendly2_data.json
```

Validated against the full BudgetBakers export (7,486 tx loaded, 54
duplicates skipped, 1,214 vendors, 164 AppSumo deals). `v_monthly` matches
the SPA figures exactly (e.g. Jul 2026: in €4,388 / out €5,634 / net −€1,246).

## Design rules (PRD §9)

- Money as `NUMERIC(16,2)`, never float; original + reporting amounts kept
- Raw imported rows immutable; normalised data separate
- Soft-delete financial objects; audit history preserved
- Timestamps in UTC; `updated_at` maintained by trigger

## Next (Phase 1 continued)

- BudgetBakers MCP live pull → account-aware records (unlocks per-account balances)
- Two-sided transfer matching (pairs debit+credit; replaces the SPA's pattern heuristic)
- Reconciliation screen against entered statement balances
- API layer + auth; the SPA becomes a client of this backend
