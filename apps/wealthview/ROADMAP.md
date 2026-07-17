# Wealthview Roadmap

*Owner: Sean O'Byrne / Heaventree · Last updated: 16 July 2026*
*Companion to PRD.md (target state) and PHASE0.md (ledger workshop pack)*

---

## Pinned decisions

> **D-001 — Phase 1 is single-view, not multi-entity.** *(16 Jul 2026, Sean)*
> Treat all money as one — personal, sole trader, and both Heaventree
> companies roll up into one unified "everything" overview. Do **not** build
> the entity/account/ownership separation in Phase 1.
>
> Multi-entity (PRD §7.1, §5.3) is **deferred, not dropped** — it moves to
> Phase 3. The schema still records `account` and a nullable `entity` field
> from day one (cheap to capture, expensive to backfill), but nothing in the
> Phase 1 UI or reports splits by entity. When entities are switched on later,
> historical data can be reclassified rather than re-imported.

---

## Phase map

| Phase | Theme | Entity handling | Status |
|---|---|---|---|
| 0 | Financial model + golden month | — | in progress |
| **1** | **Trusted unified ledger** | **single "everything" view** | **next** |
| 2 | Spend + operating control | single view | planned |
| 3 | Multi-entity + cash/tax | **entities switched on here** | planned |
| 4 | Wealth + decision reporting | per-entity + consolidated | planned |
| 5 | AI copilot | grounded on ledger | planned |
| 6 | Hardening | — | planned |

---

## Phase 1 — Trusted unified ledger (revised for D-001)

**Goal:** one accurate, persistent, reconcilable view of everything — every
euro in and out across all accounts, transfers removed, nothing lost to
localStorage. No entity separation.

### In scope
- Postgres backend + auth (replaces localStorage as source of truth)
- Account registry (Wise ×2, Revolut ×2, PTSB, Humm, crypto, Stripe) — captured, not yet split by owner
- Importers: BudgetBakers CSV backfill + MCP live pull; AppSumo/Subly enrichment
- Raw-record lineage + idempotent dedupe
- **Transfer matching** — the big correctness win: exclude the 281 BTC exchanges, 58 Wise→personal, 33 savings top-ups, card settlements, FX chains that currently inflate spend
- Ledger workbench: inline edit, splits, vendor/category overrides, review queue
- Migrate existing overrides + asset snapshots out of localStorage
- One unified dashboard, running costs, subscriptions, net worth, cash flow — all "everything" totals

### Out of scope (moved to Phase 3)
- Entity registry + consolidation groups
- Personal/business allocation + director/current accounts
- Intercompany balances
- Per-entity reporting + eliminations

### Exit criteria
- Every account's transactions import with lineage; no duplicates
- Transfers matched and excluded — burn figure is real, not inflated by internal moves
- May 2026 reconciles as a single combined book
- Authoritative data survives device loss (backend, not localStorage)

---

## Deferred to Phase 3 (the entity work)

Everything under PRD §7.1 (entity/account/ownership), consolidated reporting,
director/current accounts, intercompany matching. The nullable `entity` column
carried from Phase 1 means this is a reclassification exercise, not a rebuild.

---

## Still needed from Sean (non-blocking for Phase 1 now)

Because Phase 1 is single-view, the entity decisions (PRD §21.1, .2, .5) are
**no longer blocking** — they move to the Phase 3 gate. Phase 1 only needs:

1. Wealthview repo available as a session source (to scaffold the backend)
2. Accountant's export format (nice to have; not a blocker for the ledger itself)
3. Confirm bank-data path: BudgetBakers MCP primary + per-account CSV fallback (recommended)

The full account inventory + currencies (§21.3) is still useful so the account
registry is complete from the start.
