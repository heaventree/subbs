// Vendor edit overlay — reads/writes the SAME Turso kv keys that classic.html
// already uses (names, merges, owner, ov=status, rec=recurring override,
// typeOv=income/expense reclass). This is deliberate: sorting done in either
// app is instantly visible in the other — one shared edit layer, two front ends.
import { tq } from './turso'
import type { Vendor } from './data'

export type Status = 'active' | 'review' | 'paused' | 'cancelled' | 'completed'
export type Owner = 'heaventree' | 'personal'

export interface VendorEdits {
  names: Record<string, string>          // vendorId -> display name override
  merges: Record<string, string>         // absorbedVendorId -> primaryVendorId
  owner: Record<string, Owner>           // vendorId -> owner
  ov: Record<string, Status>             // vendorId -> manual status
  rec: Record<string, boolean>           // vendorId -> recurring override
  typeOv: Record<string, 'i' | 'e'>      // vendorId -> income/expense reclass
}

const EMPTY: VendorEdits = { names: {}, merges: {}, owner: {}, ov: {}, rec: {}, typeOv: {} }
const KEYS = Object.keys(EMPTY) as (keyof VendorEdits)[]

export async function fetchVendorEdits(): Promise<VendorEdits> {
  await tq([{ sql: 'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT, ts INTEGER)' }])
  const res = await tq([{ sql: `SELECT k,v FROM kv WHERE k IN (${KEYS.map(() => '?').join(',')})`, args: KEYS }])
  const rows = res[0]?.response?.result?.rows ?? []
  const out: VendorEdits = { ...EMPTY }
  for (const r of rows) {
    const k = r[0]?.value as keyof VendorEdits
    const v = r[1]?.value
    if (k && v && k in out) {
      try { out[k] = JSON.parse(v) } catch { /* keep default */ }
    }
  }
  return out
}

export async function pushVendorEdit(key: keyof VendorEdits, value: unknown) {
  await tq([{
    sql: 'INSERT INTO kv (k,v,ts) VALUES (?,?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,ts=excluded.ts',
    args: [key, JSON.stringify(value), Date.now()],
  }])
}

// Effective view of a vendor list after applying the edit overlay: renames,
// merges (absorbed vendors folded into their target, stats combined), status,
// owner, recurring override. Mirrors classic.html's rebuild()/detectSub() logic.
export interface EffectiveVendor extends Vendor {
  displayName: string
  status: Status
  owner: Owner | null
  isRecurringEff: boolean
  absorbed: boolean
}

function isRecurringDefault(v: Vendor): boolean {
  if (v.type !== 'e' || v.activeMonths < 3 || !(v.avgMonthly > 0)) return false
  const coverage = v.activeMonths / Math.max(v.spanMonths, 1)
  const perMonth = v.count / v.activeMonths
  const SUB_GROUPS = new Set(['AI & Software', 'Hosting & Domains', 'Home & Utilities', 'Insurance & Loans', 'Business Ops', 'Education'])
  return coverage >= 0.4 && perMonth <= 1.6 && (SUB_GROUPS.has(v.group) || v.recurring)
}

function defaultStatus(v: Vendor): Status {
  const days = (Date.now() - new Date(v.last).getTime()) / 86400000
  if (days < 50) return 'active'
  if (days < 100) return 'review'
  return 'cancelled'
}

export function applyVendorEdits(vendors: Vendor[], edits: VendorEdits): EffectiveVendor[] {
  // Resolve merge chains (cycle-safe)
  const resolve = (id: string): string => {
    let cur = id, guard = 0
    while (edits.merges[cur] && guard++ < 10) cur = edits.merges[cur]
    return cur
  }
  const byId = new Map(vendors.map((v) => [v.id, v]))
  const out: EffectiveVendor[] = vendors.map((v) => {
    const targetId = resolve(v.id)
    const absorbed = targetId !== v.id
    const target = absorbed ? byId.get(targetId) ?? v : v
    return {
      ...v,
      displayName: edits.names[target.id] ?? target.name,
      status: edits.ov[target.id] ?? defaultStatus(target),
      owner: edits.owner[target.id] ?? null,
      isRecurringEff: edits.rec[target.id] ?? isRecurringDefault(target),
      absorbed,
    }
  })
  return out
}
