-- ════════════════════════════════════════════════════════════════════════════
-- Wealthview — Phase 1 schema (v1)
-- Trusted unified ledger. Single-view per decision D-001: all money is one book,
-- but every table that will later need entity separation already carries a
-- nullable entity_id so Phase 3 is a reclassification, not a rebuild.
--
-- Design rules (PRD §9):
--   - Money as NUMERIC(16,2), never float. Original + reporting amounts kept.
--   - Raw imported rows immutable (source_record). Normalised data separate.
--   - Soft-delete financial objects; audit history preserved.
--   - Every row carries provenance (created/updated timestamps).
--   - Timestamps in UTC.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy vendor/description search

-- ── Enumerated types ─────────────────────────────────────────────────────────
CREATE TYPE tx_direction  AS ENUM ('in', 'out');
CREATE TYPE tx_kind       AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE account_kind  AS ENUM (
  'current','savings','card','cash','loan','mortgage',
  'processor','investment','pension','crypto','manual'
);
CREATE TYPE review_state  AS ENUM ('unreviewed','reviewed','flagged','locked');
CREATE TYPE confidence    AS ENUM ('verified','inferred','unresolved');
CREATE TYPE vendor_kind   AS ENUM ('income','expense','transfer');
CREATE TYPE asset_kind    AS ENUM ('asset','liability');

-- ── Entity (deferred to Phase 3, but the column exists now) ──────────────────
-- One row seeded ('Everything') so Phase 1 is genuinely single-view.
CREATE TABLE entity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  kind        text NOT NULL DEFAULT 'combined',  -- person|sole_trader|company|combined
  base_ccy    char(3) NOT NULL DEFAULT 'EUR',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Account ──────────────────────────────────────────────────────────────────
CREATE TABLE account (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id     uuid REFERENCES entity(id),            -- nullable in Phase 1
  name          text NOT NULL,
  institution   text,
  kind          account_kind NOT NULL DEFAULT 'current',
  currency      char(3) NOT NULL DEFAULT 'EUR',
  opening_balance numeric(16,2) NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name)
);

-- ── Category (hierarchical: group → category) ────────────────────────────────
CREATE TABLE category (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  grp         text NOT NULL,                 -- one of the 16 groups
  color       text,
  is_transfer boolean NOT NULL DEFAULT false, -- savings/investment/internal
  UNIQUE (name)
);

-- ── Vendor / counterparty (with alias registry) ─────────────────────────────
CREATE TABLE vendor (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  norm          text NOT NULL UNIQUE,          -- normalised key
  display_name  text NOT NULL,
  kind          vendor_kind NOT NULL DEFAULT 'expense',
  domain        text,
  is_recurring  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendor_name_trgm ON vendor USING gin (display_name gin_trgm_ops);

CREATE TABLE vendor_alias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   uuid NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
  raw_name    text NOT NULL,
  seen_count  int NOT NULL DEFAULT 1,
  UNIQUE (raw_name)
);

-- ── Import lineage ───────────────────────────────────────────────────────────
CREATE TABLE import_batch (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source        text NOT NULL,                 -- budgetbakers_csv | mcp | appsumo | manual
  file_name     text,
  row_count     int NOT NULL DEFAULT 0,
  imported_at   timestamptz NOT NULL DEFAULT now()
);

-- Immutable raw record — never updated after insert.
CREATE TABLE source_record (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      uuid NOT NULL REFERENCES import_batch(id),
  source        text NOT NULL,
  source_id     text,                          -- upstream id when present
  fingerprint   text NOT NULL,                 -- dedupe key
  raw           jsonb NOT NULL,                -- verbatim source row
  imported_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fingerprint)                         -- idempotent import
);

-- ── Transaction (the normalised ledger) ──────────────────────────────────────
CREATE TABLE txn (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      uuid REFERENCES source_record(id),
  entity_id      uuid REFERENCES entity(id),          -- nullable in Phase 1
  account_id     uuid REFERENCES account(id),
  vendor_id      uuid REFERENCES vendor(id),
  category_id    uuid REFERENCES category(id),

  txn_date       date NOT NULL,
  settled_date   date,
  direction      tx_direction NOT NULL,
  kind           tx_kind NOT NULL,                    -- income|expense|transfer

  -- original amount as it appeared on the source
  amount         numeric(16,2) NOT NULL,
  currency       char(3) NOT NULL DEFAULT 'EUR',
  -- reporting amount (EUR) + the rate used
  amount_eur     numeric(16,2) NOT NULL,
  fx_rate        numeric(16,8) NOT NULL DEFAULT 1,

  description     text,                               -- original bank description
  is_recurring    boolean NOT NULL DEFAULT false,
  review          review_state NOT NULL DEFAULT 'unreviewed',
  confidence      confidence NOT NULL DEFAULT 'inferred',
  transfer_match_id uuid,                             -- FK added below

  notes           text,
  deleted_at      timestamptz,                        -- soft delete
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX txn_date_idx      ON txn (txn_date);
CREATE INDEX txn_vendor_idx    ON txn (vendor_id);
CREATE INDEX txn_account_idx   ON txn (account_id);
CREATE INDEX txn_kind_idx      ON txn (kind);
CREATE INDEX txn_live_idx      ON txn (txn_date) WHERE deleted_at IS NULL;

-- ── Transaction splits (one txn → many dimensioned lines) ────────────────────
CREATE TABLE txn_split (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  txn_id       uuid NOT NULL REFERENCES txn(id) ON DELETE CASCADE,
  entity_id    uuid REFERENCES entity(id),
  category_id  uuid REFERENCES category(id),
  amount_eur   numeric(16,2) NOT NULL,
  note         text
);
CREATE INDEX txn_split_txn_idx ON txn_split (txn_id);

-- ── Transfer matching (two-sided; excludes internal moves from spend) ────────
CREATE TABLE transfer_match (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  out_txn_id    uuid REFERENCES txn(id),
  in_txn_id     uuid REFERENCES txn(id),
  method        text NOT NULL DEFAULT 'pattern',    -- pattern|amount_date|manual
  confidence    confidence NOT NULL DEFAULT 'inferred',
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE txn
  ADD CONSTRAINT txn_transfer_match_fk
  FOREIGN KEY (transfer_match_id) REFERENCES transfer_match(id);

-- ── Rules (classification automation) ────────────────────────────────────────
CREATE TABLE rule (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  field       text NOT NULL,       -- name|group|count|avg
  op          text NOT NULL,       -- contains|starts|equals|gte|lte
  value       text NOT NULL,
  action      text NOT NULL,       -- set_recurring|set_not_recurring|set_status|set_category
  action_val  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Manual overrides (migrated out of localStorage) ─────────────────────────
CREATE TABLE vendor_override (
  vendor_id     uuid PRIMARY KEY REFERENCES vendor(id) ON DELETE CASCADE,
  status        text,              -- active|review|paused|cancelled
  is_recurring  boolean,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Net worth (assets, liabilities, snapshots) ──────────────────────────────
CREATE TABLE asset (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id   uuid REFERENCES entity(id),
  kind        asset_kind NOT NULL,
  cls         text NOT NULL,       -- property|cash|investment|pension|vehicle|mortgage|loan|...
  name        text NOT NULL,
  value_eur   numeric(16,2) NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE TABLE nw_snapshot (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snap_date   date NOT NULL,
  assets_eur  numeric(16,2) NOT NULL,
  liab_eur    numeric(16,2) NOT NULL,
  net_eur     numeric(16,2) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snap_date)
);

-- ── AppSumo / lifetime deals (kept out of monthly burn) ─────────────────────
CREATE TABLE lifetime_deal (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bought_date date NOT NULL,
  product     text NOT NULL,
  amount      numeric(16,2) NOT NULL,
  currency    char(3) NOT NULL DEFAULT 'USD',
  source      text NOT NULL DEFAULT 'appsumo'
);

-- ── Audit trail (tamper-evident material actions) ───────────────────────────
CREATE TABLE audit_event (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor       text NOT NULL DEFAULT 'system',
  action      text NOT NULL,       -- import|edit|split|match|rule_apply|delete|reconcile
  object_type text NOT NULL,
  object_id   uuid,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_object_idx ON audit_event (object_type, object_id);

-- ── updated_at trigger for txn ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER txn_touch BEFORE UPDATE ON txn
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Reporting views ──────────────────────────────────────────────────────────
-- Monthly cash flow: income vs real expenses (transfers excluded), plus transfers.
CREATE VIEW v_monthly AS
SELECT to_char(txn_date,'YYYY-MM')                              AS month,
       sum(amount_eur) FILTER (WHERE kind='income')             AS income,
       sum(amount_eur) FILTER (WHERE kind='expense')            AS expense,
       sum(amount_eur) FILTER (WHERE kind='transfer')           AS transfers,
       sum(amount_eur) FILTER (WHERE kind='income')
         - sum(amount_eur) FILTER (WHERE kind='expense')        AS net
FROM txn
WHERE deleted_at IS NULL
GROUP BY 1 ORDER BY 1;

-- Vendor running costs: lifetime + typical monthly (median of active months).
CREATE VIEW v_vendor_running AS
WITH per AS (
  SELECT vendor_id, to_char(txn_date,'YYYY-MM') AS m, sum(amount_eur) AS spent
  FROM txn
  WHERE deleted_at IS NULL AND kind='expense'
  GROUP BY 1,2
)
SELECT v.id, v.display_name, v.is_recurring,
       count(*)                                            AS active_months,
       sum(p.spent)                                        AS lifetime,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY p.spent)::numeric(16,2) AS typical_monthly
FROM vendor v JOIN per p ON p.vendor_id = v.id
GROUP BY v.id, v.display_name, v.is_recurring;

COMMIT;
