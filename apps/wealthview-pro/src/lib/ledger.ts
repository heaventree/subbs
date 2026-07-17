// Incremental ledger delta stored in Turso. The base 7,540 transactions stay
// in the static public/wv-data.json snapshot (fast, cached, no query cost);
// this table holds ONLY transactions added later via CSV import (or, later,
// a live API sync) — so there is no bulk-migration step and no risk to the
// working base data. data.ts merges base + delta at load time.
import { tq, type Cell } from './turso'
import type { StagedTxn } from './csvImport'

const cell = (c: Cell) => c?.value ?? ''

export interface DeltaTxn {
  id: string
  date: string
  raw: string
  vendorNorm: string
  vendorName: string
  vendorDomain: string | null
  category: string
  group: string
  amountCents: number
  kind: 'i' | 'e' | 'x'
  recurring: boolean
  fingerprint: string
  importedAt: number
}

let schemaReady = false
export async function ensureLedgerSchema() {
  if (schemaReady) return
  await tq([
    {
      sql: `CREATE TABLE IF NOT EXISTS txn_delta (
        id TEXT PRIMARY KEY, txn_date TEXT NOT NULL, raw TEXT,
        vendor_norm TEXT NOT NULL, vendor_name TEXT NOT NULL, vendor_domain TEXT,
        category TEXT NOT NULL, grp TEXT NOT NULL, amount_cents INTEGER NOT NULL,
        kind TEXT NOT NULL, recurring INTEGER NOT NULL DEFAULT 0,
        fingerprint TEXT UNIQUE NOT NULL, imported_at INTEGER NOT NULL)`,
    },
    { sql: 'CREATE INDEX IF NOT EXISTS txn_delta_date_idx ON txn_delta(txn_date)' },
  ])
  schemaReady = true
}

export async function fetchExistingDeltaFingerprints(): Promise<Set<string>> {
  await ensureLedgerSchema()
  const res = await tq([{ sql: 'SELECT fingerprint FROM txn_delta' }])
  const rows = res[0]?.response?.result?.rows ?? []
  return new Set(rows.map((r) => cell(r[0])))
}

export async function fetchDeltaTxns(): Promise<DeltaTxn[]> {
  await ensureLedgerSchema()
  const res = await tq([{
    sql: `SELECT id,txn_date,raw,vendor_norm,vendor_name,vendor_domain,category,grp,
                 amount_cents,kind,recurring,fingerprint,imported_at
          FROM txn_delta ORDER BY txn_date DESC`,
  }])
  const rows = res[0]?.response?.result?.rows ?? []
  return rows.map((r) => ({
    id: cell(r[0]), date: cell(r[1]), raw: cell(r[2]),
    vendorNorm: cell(r[3]), vendorName: cell(r[4]), vendorDomain: cell(r[5]) || null,
    category: cell(r[6]), group: cell(r[7]), amountCents: +cell(r[8]),
    kind: cell(r[9]) as DeltaTxn['kind'], recurring: cell(r[10]) === '1',
    fingerprint: cell(r[11]), importedAt: +cell(r[12]),
  }))
}

export interface InsertSummary { inserted: number; batches: number }

// Inserts pre-filtered rows (caller already excluded anything matching an
// existing fingerprint) in batches of 200 statements per pipeline call.
export async function insertDeltaTxns(rows: StagedTxn[]): Promise<InsertSummary> {
  await ensureLedgerSchema()
  const now = Date.now()
  const BATCH = 200
  let inserted = 0, batches = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    await tq(
      chunk.map((r) => ({
        sql: `INSERT INTO txn_delta
              (id,txn_date,raw,vendor_norm,vendor_name,vendor_domain,category,grp,
               amount_cents,kind,recurring,fingerprint,imported_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON CONFLICT(fingerprint) DO NOTHING`,
        args: [
          crypto.randomUUID(), r.date, r.raw, r.vendorNorm, r.vendorName, r.vendorDomain ?? '',
          r.category, r.group, r.amountCents, r.kind, r.recurring ? 1 : 0, r.fingerprint, now,
        ],
      })),
      20000,
    )
    inserted += chunk.length
    batches++
  }
  return { inserted, batches }
}
