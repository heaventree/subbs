// Backup / export — and the direct proof that sorting work is safe. The
// "vendor edits" file below is the entire cleanup effort (renames, merges,
// owner tags, statuses) in one small portable JSON: back it up, move it
// between environments, or restore it if anything ever goes sideways.
// It is completely independent of the transaction data — importing a new
// CSV never touches it.
import { useMemo, useState } from 'react'
import { Download, Upload, ShieldCheck, AlertTriangle } from 'lucide-react'
import { eur, fmtDate, typicalMonthly, type WvData } from '../lib/data'
import { fetchVendorEdits, pushVendorEdit, applyVendorEdits, type VendorEdits, type EffectiveVendor } from '../lib/vendorEdits'

function csvCell(v: unknown): string {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}
function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
}
function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function ExportPage({ data }: { data: WvData }) {
  const [edits, setEdits] = useState<VendorEdits | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [restoring, setRestoring] = useState(false)

  useMemo(() => {
    setLoading(true)
    fetchVendorEdits().then(setEdits).catch(() => setEdits(null)).finally(() => setLoading(false))
  }, [])

  const effective = useMemo(() => (edits ? applyVendorEdits(data.vendors, edits) : []), [data.vendors, edits])
  const effByIdx = useMemo(() => {
    const m = new Map<number, EffectiveVendor>()
    effective.forEach((v) => m.set(v.idx, v))
    return m
  }, [effective])

  const editCount = edits
    ? Object.keys(edits.names).length + Object.keys(edits.merges).length + Object.keys(edits.owner).length +
      Object.keys(edits.ov).length + Object.keys(edits.rec).length + Object.keys(edits.typeOv).length
    : 0

  function downloadEditsBackup() {
    if (!edits) return
    const payload = { exportedAt: new Date().toISOString(), source: 'wealthview-pro', edits }
    download('wealthview-vendor-edits.json', JSON.stringify(payload, null, 2), 'application/json')
    setMsg('Downloaded — this file alone can fully restore every rename, merge, owner tag and status.')
  }

  function downloadVendorsCsv() {
    const rows: (string | number)[][] = [
      ['id', 'original_name', 'display_name', 'group', 'category', 'type', 'charges', 'lifetime_total', 'avg_monthly', 'typical_monthly', 'status', 'owner', 'recurring', 'merged_into'],
    ]
    for (const v of effective) {
      rows.push([
        v.id, v.name, v.displayName, v.group, v.category, v.type, v.count, v.total.toFixed(2),
        v.avgMonthly.toFixed(2), v.type === 'e' ? typicalMonthly(data, v.idx).toFixed(2) : '',
        v.status, v.owner ?? '', v.isRecurringEff ? 'yes' : 'no', v.absorbed ? edits?.merges[v.id] ?? '' : '',
      ])
    }
    download('wealthview-vendors.csv', toCsv(rows), 'text/csv')
    setMsg(`Downloaded ${effective.length} vendors with every edit already applied.`)
  }

  function downloadLedgerCsv() {
    const rows: (string | number)[][] = [['date', 'payee', 'category', 'group', 'amount', 'kind', 'recurring']]
    for (const t of data.tx) {
      const v = effByIdx.get(t.v)
      rows.push([t.d, v?.displayName ?? data.vendors[t.v]?.name ?? '?', data.cats[t.c]?.name ?? '', data.cats[t.c]?.group ?? '', t.a.toFixed(2), t.t, t.r ? 'yes' : 'no'])
    }
    download('wealthview-ledger.csv', toCsv(rows), 'text/csv')
    setMsg(`Downloaded all ${data.tx.length} transactions with cleaned-up vendor names.`)
  }

  async function restoreFromFile(file: File) {
    setRestoring(true); setMsg('')
    try {
      const parsed = JSON.parse(await file.text())
      const incoming: VendorEdits = parsed.edits ?? parsed
      if (!incoming.names && !incoming.merges && !incoming.owner) throw new Error('Not a recognised vendor-edits backup file')
      // Merge into current edits (incoming wins per-key) rather than blind overwrite.
      const merged: VendorEdits = {
        names: { ...edits?.names, ...incoming.names },
        merges: { ...edits?.merges, ...incoming.merges },
        owner: { ...edits?.owner, ...incoming.owner },
        ov: { ...edits?.ov, ...incoming.ov },
        rec: { ...edits?.rec, ...incoming.rec },
        typeOv: { ...edits?.typeOv, ...incoming.typeOv },
      }
      for (const key of Object.keys(merged) as (keyof VendorEdits)[]) {
        await pushVendorEdit(key, merged[key])
      }
      setEdits(merged)
      setMsg('Restored — every rename, merge, owner tag and status from that backup is now live.')
    } catch (e) {
      setMsg('Restore failed: ' + (e as Error).message)
    }
    setRestoring(false)
  }

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="card p-6">
        <div className="flex items-center gap-2 text-sm font-semibold mb-1"><ShieldCheck size={16} className="text-income" /> Your sorting work is already safe</div>
        <div className="text-xs text-muted leading-relaxed">
          Renames, merges, owner tags and statuses live in their own place in Turso, keyed by a stable
          vendor ID — not the transaction data. Importing a new CSV only ever adds new transactions;
          it never touches these edits. {loading ? 'Checking…' : `${editCount} edit${editCount !== 1 ? 's' : ''} currently stored.`}
        </div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-semibold mb-1">Vendor edits backup</div>
        <div className="text-xs text-muted mb-4">The entire cleanup effort in one small file — every rename, merge, owner tag and status. Back this up regularly; it's the fastest way to move your sorting to another environment or recover from anything.</div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-primary" onClick={downloadEditsBackup} disabled={!edits}><Download size={14} /> Download backup (.json)</button>
          <label className="btn-secondary cursor-pointer">
            <Upload size={14} /> {restoring ? 'Restoring…' : 'Restore from backup'}
            <input type="file" accept=".json" className="hidden" disabled={restoring}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) restoreFromFile(f) }} />
          </label>
        </div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-semibold mb-1">Full data export</div>
        <div className="text-xs text-muted mb-4">Human-readable spreadsheets with every edit already applied — vendors with their cleaned-up names, and the complete transaction ledger.</div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary" onClick={downloadVendorsCsv} disabled={!edits}><Download size={14} /> Vendors (.csv)</button>
          <button className="btn-secondary" onClick={downloadLedgerCsv}><Download size={14} /> Full ledger (.csv)</button>
        </div>
      </div>

      {msg && (
        <div className={`text-xs flex items-center gap-2 ${msg.startsWith('Restore failed') ? 'text-expense' : 'text-income'}`}>
          {msg.startsWith('Restore failed') && <AlertTriangle size={13} />} {msg}
        </div>
      )}
    </div>
  )
}
