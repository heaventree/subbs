// Data adapter — reads the same compact JSON the SPA embeds (public/wv-data.json).
// Later this swaps for the Postgres/Turso API without touching the pages.

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
  cache = { vendors, cats: raw.cats, groups: raw.groups, tx, raws: raw.raws ?? [], appsumo: raw.appsumo ?? [], months, monthly }
  return cache
}

export const eur = (n: number, digits = 0) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: digits }).format(n)

export const fmtDate = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: '2-digit' })
