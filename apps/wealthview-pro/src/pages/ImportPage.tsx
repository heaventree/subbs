// The real "BudgetBakers sync" today: drop a fresh CSV export, it's parsed
// with the exact same rules as the original snapshot, deduped against both
// the base data and anything already imported, and only genuinely new rows
// get written to Turso. No external API dependency — works right now.
import { useCallback, useMemo, useState } from 'react'
import { UploadCloud, FileCheck2, AlertTriangle, Loader2 } from 'lucide-react'
import { parseBudgetBakersCsv, type StagedTxn } from '../lib/csvImport'
import { fetchExistingDeltaFingerprints, insertDeltaTxns } from '../lib/ledger'
import { computeBaseFingerprints, eur, fmtDate, type WvData } from '../lib/data'

type Phase = 'idle' | 'parsing' | 'preview' | 'importing' | 'done' | 'error'

export function ImportPage({ data, onImported }: { data: WvData; onImported: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [fileName, setFileName] = useState('')
  const [staged, setStaged] = useState<StagedTxn[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [skippedRows, setSkippedRows] = useState(0)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const baseFps = useMemo(() => computeBaseFingerprints(data), [data])

  const handleFile = useCallback(async (file: File) => {
    setPhase('parsing'); setError(''); setFileName(file.name)
    try {
      const text = await file.text()
      const { staged: parsed, totalRows: total, skipped } = parseBudgetBakersCsv(text)
      setTotalRows(total); setSkippedRows(skipped)
      setStaged(parsed)
      setPhase('preview')
    } catch (e) {
      setError((e as Error).message)
      setPhase('error')
    }
  }, [])

  const { fresh, dupes } = useMemo(() => {
    const seen = new Set<string>()
    const fresh: StagedTxn[] = []
    let dupes = 0
    for (const s of staged) {
      if (baseFps.has(s.fingerprint) || seen.has(s.fingerprint)) { dupes++; continue }
      seen.add(s.fingerprint)
      fresh.push(s)
    }
    return { fresh, dupes }
  }, [staged, baseFps])

  const [importResult, setImportResult] = useState<{ inserted: number } | null>(null)

  async function doImport() {
    setPhase('importing'); setError('')
    try {
      const existingDelta = await fetchExistingDeltaFingerprints()
      const toInsert = fresh.filter((r) => !existingDelta.has(r.fingerprint))
      const alreadyImported = fresh.length - toInsert.length
      const res = await insertDeltaTxns(toInsert)
      setImportResult({ inserted: res.inserted })
      setPhase('done')
      if (alreadyImported > 0) setError(`(${alreadyImported} of the "new" rows were already imported previously and were skipped)`)
      onImported()
    } catch (e) {
      setError((e as Error).message)
      setPhase('error')
    }
  }

  function reset() {
    setPhase('idle'); setStaged([]); setFileName(''); setError(''); setImportResult(null)
  }

  const kindCounts = useMemo(() => {
    const c = { e: 0, i: 0, x: 0 }
    for (const r of fresh) c[r.kind]++
    return c
  }, [fresh])

  return (
    <div className="p-6 max-w-3xl">
      <div className="card p-6 mb-6">
        <div className="text-sm font-semibold mb-1">Import a BudgetBakers export</div>
        <div className="text-xs text-muted mb-4">
          Export your latest transactions from BudgetBakers as CSV and drop it here. Rows already
          in the ledger (by date + vendor + amount + category) are skipped automatically — only
          genuinely new transactions get added.
        </div>

        {phase === 'idle' && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            className={`flex flex-col items-center justify-center gap-2 h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${dragOver ? 'border-accent bg-accent/5' : 'border-line hover:border-accent/50'}`}
          >
            <UploadCloud size={28} className="text-muted" />
            <div className="text-sm text-muted">Drop CSV here, or click to browse</div>
            <input type="file" accept=".csv,text/csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </label>
        )}

        {phase === 'parsing' && (
          <div className="flex items-center gap-2 text-sm text-muted py-8 justify-center">
            <Loader2 size={16} className="animate-spin" /> Parsing {fileName}…
          </div>
        )}

        {phase === 'preview' && (
          <div>
            <div className="flex items-center gap-2 text-sm mb-4"><FileCheck2 size={16} className="text-income" /> {fileName}</div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <Stat label="Total rows" value={String(totalRows)} />
              <Stat label="Already known" value={String(dupes)} tone="text-muted" />
              <Stat label="New" value={String(fresh.length)} tone="text-income" />
              <Stat label="Unparseable" value={String(skippedRows)} tone={skippedRows ? 'text-warn' : 'text-muted'} />
            </div>
            {fresh.length > 0 && (
              <>
                <div className="text-xs text-muted mb-2">
                  {kindCounts.e} expense · {kindCounts.i} income · {kindCounts.x} transfer
                </div>
                <div className="max-h-64 overflow-auto rounded-lg border border-line mb-4">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-canvas"><tr className="text-muted text-left">
                      <th className="px-3 py-2">Date</th><th className="px-3 py-2">Payee</th>
                      <th className="px-3 py-2">Category</th><th className="px-3 py-2 text-right">Amount</th>
                    </tr></thead>
                    <tbody>
                      {fresh.slice(0, 50).map((r, i) => (
                        <tr key={i} className="border-t border-line/40">
                          <td className="px-3 py-1.5 font-mono text-muted">{fmtDate(r.date)}</td>
                          <td className="px-3 py-1.5">{r.vendorName}</td>
                          <td className="px-3 py-1.5 text-muted">{r.category}</td>
                          <td className={`px-3 py-1.5 text-right font-mono font-semibold ${r.kind === 'i' ? 'text-income' : r.kind === 'x' ? 'text-muted' : 'text-expense'}`}>
                            {r.kind === 'i' ? '+' : r.kind === 'x' ? '⇄' : '-'}{eur(r.amountCents / 100, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {fresh.length > 50 && <div className="text-center text-[11px] text-dimmed py-2">+{fresh.length - 50} more</div>}
                </div>
              </>
            )}
            <div className="flex gap-2">
              {fresh.length > 0
                ? <button className="btn-primary" onClick={doImport}>Import {fresh.length} new transaction{fresh.length !== 1 ? 's' : ''}</button>
                : <div className="text-sm text-muted py-2">Nothing new to import — this export matches what's already here.</div>}
              <button className="btn-secondary" onClick={reset}>Choose a different file</button>
            </div>
          </div>
        )}

        {phase === 'importing' && (
          <div className="flex items-center gap-2 text-sm text-muted py-8 justify-center">
            <Loader2 size={16} className="animate-spin" /> Writing to Turso…
          </div>
        )}

        {phase === 'done' && importResult && (
          <div>
            <div className="flex items-center gap-2 text-sm text-income mb-2"><FileCheck2 size={16} /> Imported {importResult.inserted} new transactions.</div>
            {error && <div className="text-xs text-warn mb-3">{error}</div>}
            <button className="btn-secondary" onClick={reset}>Import another file</button>
          </div>
        )}

        {phase === 'error' && (
          <div>
            <div className="flex items-center gap-2 text-sm text-expense mb-3"><AlertTriangle size={16} /> {error}</div>
            <button className="btn-secondary" onClick={reset}>Try again</button>
          </div>
        )}
      </div>

      <div className="text-xs text-dimmed leading-relaxed">
        New rows are written to a small Turso table separate from the base snapshot, then merged
        in every time the app loads — vendor totals, running costs and the dashboard all update
        automatically. This runs entirely in your browser; the CSV never leaves your machine
        except as the individual new rows sent to your own Turso database.
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-raised border border-line px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-dimmed">{label}</div>
      <div className={`font-mono text-lg font-semibold ${tone ?? ''}`}>{value}</div>
    </div>
  )
}
