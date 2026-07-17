// Parses a BudgetBakers CSV export into staged rows ready to dedupe against
// the ledger and insert into Turso. Column set matches the export used to
// build the original snapshot:
//   item_type,is_recurring,name,amount,currency,category,tags,website,
//   billing_freq,billing_range,payment_date,initial_payment_date,end_date,
//   renewal_date,refund_deadline,notes
import { normPayee, displayName, findDomain, classify, groupFor, cleanPayee } from './normalize'
import { fingerprint } from './fingerprint'

export interface StagedTxn {
  date: string          // YYYY-MM-DD
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
}

// Minimal RFC4180 CSV line splitter — handles quoted fields with embedded
// commas/quotes, which BudgetBakers exports use (e.g. product names with commas).
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

export interface ParseResult {
  staged: StagedTxn[]
  totalRows: number
  skipped: number
}

export function parseBudgetBakersCsv(text: string): ParseResult {
  const rows = parseCsv(text)
  if (!rows.length) return { staged: [], totalRows: 0, skipped: 0 }
  const header = rows[0].map((h) => h.trim())
  const idx = (name: string) => header.indexOf(name)
  const iType = idx('item_type'), iRec = idx('is_recurring'), iName = idx('name'),
    iAmount = idx('amount'), iCat = idx('category'), iDate = idx('payment_date')
  if (iType < 0 || iName < 0 || iAmount < 0 || iDate < 0) {
    throw new Error('Unrecognised CSV format — expected BudgetBakers export columns (item_type, name, amount, payment_date, ...)')
  }
  const staged: StagedTxn[] = []
  let skipped = 0
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length < 2) continue
    const amount = parseFloat(r[iAmount])
    const date = (r[iDate] || '').trim()
    if (!Number.isFinite(amount) || !date) { skipped++; continue }
    const raw = (r[iName] || '').trim()
    const category = (r[iCat] || 'Other').trim() || 'Other'
    const baseType: 'i' | 'e' = r[iType] === 'revenue' ? 'i' : 'e'
    const norm = normPayee(raw)
    const kind = classify(norm, raw, category, baseType)
    const group = groupFor(category, kind)
    const amountCents = Math.round(amount * 100)
    staged.push({
      date,
      raw,
      vendorNorm: norm,
      vendorName: displayName(norm, raw),
      vendorDomain: findDomain(norm),
      category,
      group,
      amountCents,
      kind,
      recurring: iRec >= 0 && r[iRec] === 'true',
      fingerprint: fingerprint(date, norm, amountCents, category, kind),
    })
  }
  return { staged, totalRows: rows.length - 1, skipped }
}

// Also used to compute fingerprints for the already-embedded base snapshot,
// so new imports can be deduped against it without a network round-trip.
export { fingerprint, cleanPayee }
