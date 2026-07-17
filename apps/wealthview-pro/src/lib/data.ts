// Data adapter — reads the same compact JSON the SPA embeds (public/wv-data.json)
// as the fast base layer, then merges in any transactions imported later via
// CSV (stored incrementally in Turso — see ledger.ts). The base snapshot never
// changes; growth happens through the delta, so there is no bulk-migration
// step and the common case (no imports yet) costs nothing extra.
import { fetchDeltaTxns, type DeltaTxn } from './ledger'
import { GROUP_COLORS } from './normalize'
import { fingerprint } from './fingerprint'

export interface Vendor {
  id: string
  name: string
  norm: string
  count: number
  total: number
  first: string
  last: string
  spanMonths: number
  activeMonths: number
  avgMonthly: number
  recurring: boolean
  group: string
  category: string
  type: 'i' | 'e' | 'x'
  domain: string | null
  idx: number
}

export interface Txn {
  d: string
  v: number
  a: number
  c: number
  t: 'i' | 'e' | 'x'
  r: boolean
  w: number
}

export interface Cat {
  name: string
  group: string
  color: string
}

export interface WvData {
  vendors: Vendor[]
  cats: Cat[]
  groups: { name: string; color: string }[]
  tx: Txn[]
  raws: string[]
  appsumo: [string, string, number][]
  months: string[]
  monthly: Record<string, { inc: number; exp: number; xfer: number }>
}

let cache: WvData | null = null

function monthsBetween(a: string, b: string): number {
  const ay = +a.slice(0, 4), am = +a.slice(5, 7), by = +b.slice(0, 4), bm = +b.slice(5, 7)
  return (by - ay) * 12 + (bm - am) + 1
}

// Rebuild every vendor's aggregates (count/total/first/last/avgMonthly/...)
// from the full tx list. Cheap even at ~8k rows (<50ms) and guarantees
// correctness after a merge, matching the original prep_data.py logic exactly.
function recomputeVendorStats(vendors: Vendor[], tx: Txn[]) {
  interface Acc { count: number; total: number; first: string; last: string; recurCt: number; months: Set<string>; hasI: boolean; hasX: boolean; hasE: boolean }
  const acc = new Map<number, Acc>()
  for (const t of tx) {
    let a = acc.get(t.v)
    if (!a) { a = { count: 0, total: 0, first: t.d, last: t.d, recurCt: 0, months: new Set(), hasI: false, hasX: false, hasE: false }; acc.set(t.v, a) }
    a.count++; a.total += t.a
    if (t.d < a.first) a.first = t.d
    if (t.d > a.last) a.last = t.d
    if (t.r) a.recurCt++
    a.months.add(t.d.slice(0, 7))
    if (t.t === 'i') a.hasI = true
    else if (t.t === 'x') a.hasX = true
    else a.hasE = true
  }
  for (const v of vendors) {
    const a = acc.get(v.idx)
    if (!a) { v.count = 0; v.total = 0; continue }
    const span = Math.max(1, monthsBetween(a.first, a.last))
    v.count = a.count
    v.total = Math.round(a.total * 100) / 100
    v.first = a.first
    v.last = a.last
    v.spanMonths = span
    v.activeMonths = a.months.size
    v.avgMonthly = Math.round((a.total / span) * 100) / 100
    v.recurring = a.recurCt > 0
    v.type = a.hasI ? 'i' : a.hasE ? 'e' : a.hasX ? 'x' : v.type
  }
}

function mergeDelta(base: WvData, delta: DeltaTxn[]): WvData {
  if (!delta.length) return base
  const vendors = base.vendors.map((v) => ({ ...v }))
  const cats = base.cats.map((c) => ({ ...c }))
  const raws = [...base.raws]
  const tx = [...base.tx]

  const vendorByNorm = new Map(vendors.map((v) => [v.norm, v]))
  const catByName = new Map(cats.map((c) => [c.name, c]))
  const rawIdx = new Map(raws.map((r, i) => [r, i]))

  let addedTx = 0
  for (const d of delta) {
    let v = vendorByNorm.get(d.vendorNorm)
    if (!v) {
      v = {
        id: 'v_' + d.vendorNorm.replace(/[^a-z0-9]+/g, '_').slice(0, 24) + '_' + Math.random().toString(36).slice(2, 6),
        name: d.vendorName, norm: d.vendorNorm, count: 0, total: 0, first: d.date, last: d.date,
        spanMonths: 1, activeMonths: 0, avgMonthly: 0, recurring: false,
        group: d.group, category: d.category, type: d.kind, domain: d.vendorDomain, idx: vendors.length,
      }
      vendors.push(v)
      vendorByNorm.set(d.vendorNorm, v)
    }
    let c = catByName.get(d.category)
    if (!c) {
      c = { name: d.category, group: d.group, color: GROUP_COLORS[d.group] ?? '#6B7280' }
      cats.push(c)
      catByName.set(d.category, c)
    }
    let w = rawIdx.get(d.raw)
    if (w === undefined) { w = raws.length; raws.push(d.raw); rawIdx.set(d.raw, w) }

    tx.push({ d: d.date, v: v.idx, a: d.amountCents / 100, c: cats.indexOf(c), t: d.kind, r: d.recurring, w })
    addedTx++
  }
  if (!addedTx) return base

  recomputeVendorStats(vendors, tx)
  const months = [...new Set(tx.map((t) => t.d.slice(0, 7)))].sort()
  const monthly: WvData['monthly'] = {}
  months.forEach((m) => (monthly[m] = { inc: 0, exp: 0, xfer: 0 }))
  tx.forEach((t) => {
    const m = monthly[t.d.slice(0, 7)]
    if (t.t === 'i') m.inc += t.a
    else if (t.t === 'x') m.xfer += t.a
    else m.exp += t.a
  })
  return { ...base, vendors, cats, raws, tx, months, monthly }
}

export async function loadData(): Promise<WvData> {
  if (cache) return cache
  const raw = await fetch('/wv-data.json').then(r => r.json())
  const vendors: Vendor[] = raw.vendors.map((v: Vendor, i: number) => ({ ...v, idx: i }))
  const tx: Txn[] = raw.tx.map((t: [string, number, number, number, string, number, number]) => ({
    d: t[0], v: t[1], a: t[2], c: t[3], t: t[4] as Txn['t'], r: t[5] === 1, w: t[6],
  }))
  const months = [...new Set(tx.map(t => t.d.slice(0, 7)))].sort()
  const monthly: WvData['monthly'] = {}
  months.forEach(m => (monthly[m] = { inc: 0, exp: 0, xfer: 0 }))
  tx.forEach(t => {
    const m = monthly[t.d.slice(0, 7)]
    if (t.t === 'i') m.inc += t.a
    else if (t.t === 'x') m.xfer += t.a
    else m.exp += t.a
  })
  const base: WvData = { vendors, cats: raw.cats, groups: raw.groups, tx, raws: raw.raws ?? [], appsumo: raw.appsumo ?? [], months, monthly }

  // Best-effort: merge in anything imported since the snapshot was built.
  // Never let a Turso hiccup block the app from showing the base data.
  try {
    const delta = await fetchDeltaTxns()
    cache = mergeDelta(base, delta)
  } catch {
    cache = base
  }
  return cache
}

export function invalidateCache() { cache = null }

// Typical monthly cost: median of a vendor's monthly totals over its last 12
// active months. More representative than a lifetime average for bills that
// only started recently or lapsed (mirrors classic.html's typical()).
export function typicalMonthly(data: WvData, vendorIdx: number): number {
  const perMonth = new Map<string, number>()
  for (const t of data.tx) {
    if (t.v !== vendorIdx || t.t !== 'e') continue
    const m = t.d.slice(0, 7)
    perMonth.set(m, (perMonth.get(m) ?? 0) + t.a)
  }
  const vals = [...perMonth.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).slice(-12).map(([, v]) => v).sort((a, b) => a - b)
  if (!vals.length) return 0
  const mid = Math.floor(vals.length / 2)
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2
}

// Fingerprints of every base-snapshot transaction — used by the Import page
// to dedupe a fresh CSV export against what's already baked into wv-data.json,
// without needing a network round-trip for the 7,540 historical rows.
export function computeBaseFingerprints(data: WvData): Set<string> {
  const set = new Set<string>()
  for (const t of data.tx) {
    const vendor = data.vendors[t.v]
    const cat = data.cats[t.c]
    if (!vendor || !cat) continue
    set.add(fingerprint(t.d, vendor.norm, Math.round(t.a * 100), cat.name, t.t))
  }
  return set
}

export const eur = (n: number, digits = 0) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: digits }).format(n)

export const fmtDate = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: '2-digit' })
