# Wealthview Phase 0 — Ledger Foundation Workshop Pack

*Response to WEALTHVIEW_ENTERPRISE_PRD v1.0 · 16 July 2026*
*Prepared from evidence in the existing BudgetBakers + Subly exports*

---

## 1. Assessment of the PRD

The PRD is the right target and its sequencing is correct. Three verdicts up front:

1. **Agreed — stop adding tiles.** The single-file SPA stays as the *exploration prototype* (it's genuinely useful for spend review) and nothing in it becomes authoritative. All new engineering effort goes to the ledger foundation.
2. **Agreed — entity model first.** The data already proves the problem: the current export counts **cross-account transfers as spending** (58 × "wise → personal" transfers, 33 × Savings Vault top-ups, 281 × "Exchanged to BTC" conversions are all inflating the burn figures today). Transfer matching isn't a nice-to-have; it's the difference between a real number and a wrong one.
3. **One pushback — scale Phase 1 to a team of one.** The PRD's architecture (Fastify/NestJS + Postgres + queues + object storage + AI gateway) is correct *shape* but enterprise *weight*. Recommendation below keeps the same boundaries with ~20% of the moving parts, so a solo build can actually reach Phase 3 within months, not years.

## 2. Recommended stack (pragmatic version of PRD §12)

| PRD component | Pragmatic pick | Why |
|---|---|---|
| API + DB + auth + storage | **PostgreSQL + PostgREST-style layer via Supabase** (or self-hosted Postgres + PocketBase-successor if you prefer owning it) | RLS row security, auth with MFA, encrypted storage, backups — all managed; zero ops until Phase 6 |
| Frontend | **React + TypeScript + Vite + TanStack Query/Table** | As PRD; reuse the Spendly design tokens already built |
| Jobs | **pg_cron + edge functions** initially | Durable queue only when OCR/e-mail ingestion arrives (Phase 3+) |
| AI gateway | **Claude API with tool use** (deterministic SQL tools; model never free-queries) | Matches PRD §7.12 "no silent AI"; swap-able later |
| Search | Postgres full-text | As PRD |
| Money | `NUMERIC(14,2)` + currency column; original + reporting amounts | As PRD §9 |

The existing `subbs` repo's PocketBase backend was a good v0; the PRD's audit/RLS/multi-user requirements outgrow it. Keep Zublo as-is; Wealthview gets its own backend in the **Wealthview repo**.

## 3. Entity & account map — DRAFT (correct me)

Drafted from account names seen in your BudgetBakers data. Every "?" is a workshop question.

### Entities

| ID | Entity | Type | Base ccy | Tax profile | Status |
|---|---|---|---|---|---|
| E1 | Sean O'Byrne (personal/household) | Person | EUR | IE PAYE/CGT | confirm |
| E2 | Sean O'Byrne (sole trader) | Sole trade | EUR | IE income tax + VAT? | **active? (PRD §21.2)** |
| E3 | Heaventree Company A — *legal name?* | Ltd | EUR? | IE CT + VAT? | **name? (PRD §21.1)** |
| E4 | Heaventree Company B — *legal name?* | Ltd | GBP? | UK/IE CT? ("HTMD UK" suggests UK entity) | **name? (PRD §21.1)** |
| G1 | Heaventree Group (consolidated) | View | EUR | — | derived |

### Accounts (from BudgetBakers account names)

| Account | Institution | Entity guess | Ccy | Evidence |
|---|---|---|---|---|
| WISE — HTMD UK | Wise | E4? | GBP? | named in your data |
| Wise — HT GBR | Wise | E3/E4? | GBP? | named in your data |
| Revolut — SOLE TRADER | Revolut | E2 | EUR | named in your data |
| WISE — PERSONAL | Wise | E1 | EUR | 58 transfer tx found |
| RV — PERSONAL | Revolut | E1 | EUR | IE43REVO transfers found |
| PTSB mortgage account | PTSB | E1 | EUR | IE81IPBS…, €600/mo |
| Revolut Savings Vault | Revolut | E1 | EUR | 33 top-ups found |
| **Crypto (BTC/XAU)** | Revolut? | E1? | BTC/XAU | **281 BTC + 3 XAU conversions — currently counted as spending!** |
| Stripe (payment processor) | Stripe | E3/E4 | EUR/GBP | "Stripe Payments UK Ltd" income tx |
| HUMM Flexi-Fi | Humm | E1? | EUR | 69 payments, €13,992 — liability, needs schedule |

### Known counterparty roles to encode

- Thahira Banu — 253 tx / €34,891 → **sub-contractor** (E3/E4 payable)
- Kaya Quinlan O'Byrne, Sean Padraig O'Byrne — **family/drawings** (E1, or director drawings from E3/E4?)
- Revenue Commissioners — tax authority
- Ivor Fitzpatrick & Co (solicitor client account) — one-off legal/property

## 4. Source-of-truth hierarchy (proposal)

1. **Bank statement (PDF/CSV per account)** — authoritative for balances + completeness
2. **BudgetBakers MCP `get_records` + `get_accounts`** — primary automated feed (carries account refs the CSV lacks)
3. BudgetBakers CSV export — bulk backfill only
4. Subly/AppSumo export — vendor detail enrichment for software spend
5. Manual entry — always allowed, always flagged

Fingerprint on `(source_id)` where present else `(account, date, amount, normalised_desc)`; imports idempotent; raw rows immutable.

## 5. Golden month — proposal: **May 2026**

215 transactions, €10,871 in / €9,802 out, all entities active, contains: mortgage payment, sub-contractor runs, Stripe income, personal transfers, savings top-ups, BTC exchanges, Amazon, subscriptions.

**What we can already reconcile:** category totals, vendor totals, in/out by month.
**What we cannot reconcile until account data lands:** per-account closing balances (export has no account column, no balances) — this is the first thing the MCP sync or per-account statements must fix.

Acceptance for Phase 1 (per PRD §19): May 2026 reconciles per account to statement close, transfers matched and excluded, mixed costs split, and the consolidated month agrees with entity ledgers.

## 6. PRD §21 decisions — status

| # | Decision | Status |
|---|---|---|
| 1 | Legal names of the two companies + activity split | **need from you** |
| 2 | Sole trader still active? which accounts mixed? | **need from you** |
| 3 | Full account inventory + currencies | drafted above — confirm/extend |
| 4 | Accounting package + accountant export format | **need from you** |
| 5 | VAT status per entity | **need from you** |
| 6 | Invoices/bills system to integrate | **need from you** (Zoho Books seen in design kit?) |
| 7 | Bank-data path: BudgetBakers / Open Banking / hybrid | recommend **hybrid**: BudgetBakers MCP primary + per-account CSV fallback; revisit GoCardless Bank Account Data if reliability disappoints |
| 8 | Mobile/offline | recommend responsive web only until Phase 4 |
| 9 | Cloud AI tolerance | recommend Claude API with redaction layer, external AI off for restricted fields (PRD §11.2) |
| 10 | Hosting + budget | recommend Supabase Pro (~$25/mo) or Hetzner VPS (~€10/mo self-hosted) |

## 7. Immediate build sequence (once decisions land)

1. **Week 1** — Schema v1 in Postgres: workspace, entity, account, import_batch, source_record, transaction (+splits), transfer_match, counterparty, category, rule, audit_event. Migrations + golden-month fixtures as tests.
2. **Week 2** — Importers: BudgetBakers CSV (backfill) + MCP live pull (accounts + records with account refs); dedupe + lineage; transfer-match engine v1 (the 5 patterns already identified: inter-account, savings vault, BTC/XAU exchange, card settlement, FX).
3. **Week 3** — Ledger workbench UI (Spendly tokens): inline edit, splits, review queue, reconciliation screen against entered statement balances.
4. **Week 4** — May 2026 golden-month sign-off. Then Phase 2 begins with credibility.

*Prototype SPA keeps living at the current artifact URL for day-to-day spend review until Phase 2 replaces it.*
