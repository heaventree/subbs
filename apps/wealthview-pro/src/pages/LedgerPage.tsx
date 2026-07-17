// The workhorse: TanStack Table v8 over the full ledger with virtualized rows,
// global search, kind/group/year filters, sortable columns, column picker,
// and saved views (JAMOPS-style persisted state).
import { useMemo, useRef, useState } from 'react'
import {
  createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, useReactTable, type SortingState, type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowUpDown, ArrowUp, ArrowDown, Columns3, Save, Trash2 } from 'lucide-react'
import { eur, fmtDate, type WvData } from '../lib/data'
import { useApp } from '../lib/store'

interface Row {
  date: string
  payee: string
  raw: string
  category: string
  group: string
  amount: number
  kind: string
  recurring: boolean
}

const col = createColumnHelper<Row>()

export function LedgerPage({ data }: { data: WvData }) {
  const { ledgerViews, saveLedgerView, deleteLedgerView } = useApp()
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('')
  const [group, setGroup] = useState('')
  const [year, setYear] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const [colVis, setColVis] = useState<VisibilityState>({})
  const [colsOpen, setColsOpen] = useState(false)

  const rows = useMemo<Row[]>(() =>
    data.tx.map((t) => ({
      date: t.d,
      payee: data.vendors[t.v].name,
      raw: data.raws[t.w] ?? '',
      category: data.cats[t.c].name,
      group: data.cats[t.c].group,
      amount: t.a,
      kind: t.t === 'i' ? 'income' : t.t === 'x' ? 'transfer' : 'expense',
      recurring: t.r,
    })), [data])

  const filtered = useMemo(() => rows.filter((r) => {
    if (kind && r.kind !== kind) return false
    if (group && r.group !== group) return false
    if (year && !r.date.startsWith(year)) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.payee.toLowerCase().includes(q) && !r.category.toLowerCase().includes(q) && !r.raw.toLowerCase().includes(q)) return false
    }
    return true
  }), [rows, kind, group, year, search])

  const columns = useMemo(() => [
    col.accessor('date', { header: 'Date', cell: (c) => <span className="font-mono text-xs text-muted">{fmtDate(c.getValue())}</span>, size: 100 }),
    col.accessor('payee', { header: 'Payee', cell: (c) => <span className="font-medium text-[13px]" title={c.row.original.raw}>{c.getValue()}</span>, size: 260 }),
    col.accessor('category', { header: 'Category', cell: (c) => <span className="text-xs text-muted">{c.getValue()}</span>, size: 180 }),
    col.accessor('group', { header: 'Group', cell: (c) => <span className="text-xs text-muted">{c.getValue()}</span>, size: 150 }),
    col.accessor('amount', {
      header: 'Amount',
      cell: (c) => {
        const k = c.row.original.kind
        return <span className={`font-mono text-[13px] font-semibold ${k === 'income' ? 'text-income' : k === 'transfer' ? 'text-muted' : 'text-expense'}`}>
          {k === 'income' ? '+' : k === 'transfer' ? '⇄' : '-'}{eur(c.getValue(), 2)}
        </span>
      },
      size: 130,
    }),
    col.accessor('kind', { header: 'Kind', cell: (c) => <span className="text-xs text-dimmed">{c.getValue()}</span>, size: 90 }),
    col.accessor('recurring', { header: '↺', cell: (c) => (c.getValue() ? <span className="text-accent-hover text-xs">↺</span> : null), size: 40 }),
  ], [])

  const table = useReactTable({
    data: filtered, columns,
    state: { sorting, columnVisibility: colVis },
    onSortingChange: setSorting, onColumnVisibilityChange: setColVis,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
  })

  const parentRef = useRef<HTMLDivElement>(null)
  const tableRows = table.getRowModel().rows
  const virtualizer = useVirtualizer({ count: tableRows.length, getScrollElement: () => parentRef.current, estimateSize: () => 40, overscan: 14 })

  const groups = useMemo(() => [...new Set(data.cats.map((c) => c.group))].sort(), [data])
  const years = useMemo(() => [...new Set(data.months.map((m) => m.slice(0, 4)))].sort().reverse(), [data])
  const totals = useMemo(() => ({
    inc: filtered.filter((r) => r.kind === 'income').reduce((a, r) => a + r.amount, 0),
    exp: filtered.filter((r) => r.kind === 'expense').reduce((a, r) => a + r.amount, 0),
  }), [filtered])

  function applyView(id: string) {
    const v = ledgerViews.find((x) => x.id === id)
    if (!v) return
    setSearch(v.search); setKind(v.kind); setGroup(v.group); setYear(v.year)
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-2.5 flex-wrap mb-4 shrink-0">
        <input className="input w-64" placeholder="Search payee, category, bank descriptor…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">All kinds</option><option value="expense">Expense</option><option value="income">Income</option><option value="transfer">Transfer</option>
        </select>
        <select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">All groups</option>{groups.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select className="input" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">All years</option>{years.map((y) => <option key={y}>{y}</option>)}
        </select>
        <div className="relative">
          <button className="btn-secondary h-9" onClick={() => setColsOpen(!colsOpen)}><Columns3 size={14} /> Columns</button>
          {colsOpen && (
            <div className="absolute z-50 top-11 card p-2 w-48 shadow-2xl">
              {table.getAllLeafColumns().map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-[13px] px-2 py-1.5 rounded-md hover:bg-raised cursor-pointer">
                  <input type="checkbox" className="accent-accent" checked={c.getIsVisible()} onChange={c.getToggleVisibilityHandler()} />
                  {typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id}
                </label>
              ))}
            </div>
          )}
        </div>
        <button className="btn-secondary h-9" onClick={() => {
          const name = prompt('Save current filters as view:')
          if (name) saveLedgerView({ id: 'v' + Date.now(), name, search, kind, group, year })
        }}><Save size={14} /> Save view</button>
        {ledgerViews.map((v) => (
          <span key={v.id} className="inline-flex items-center gap-1.5 h-8 pl-3 pr-1.5 rounded-full bg-accent/10 text-accent-hover text-xs font-medium">
            <button onClick={() => applyView(v.id)}>{v.name}</button>
            <button className="opacity-60 hover:opacity-100" onClick={() => deleteLedgerView(v.id)}><Trash2 size={11} /></button>
          </span>
        ))}
        <span className="ml-auto text-xs text-dimmed">
          {filtered.length.toLocaleString()} rows · in <span className="text-income">{eur(totals.inc)}</span> · out <span className="text-expense">{eur(totals.exp)}</span>
        </span>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto card">
        <table className="w-full text-sm" style={{ display: 'grid' }}>
          <thead className="sticky top-0 z-10 bg-canvas" style={{ display: 'grid' }}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} style={{ display: 'flex', width: '100%' }}>
                {hg.headers.map((h) => (
                  <th key={h.id} style={{ width: h.getSize(), display: 'flex' }}
                    className="items-center gap-1 px-3 h-10 text-[11px] font-semibold uppercase tracking-wide text-muted border-b border-line cursor-pointer select-none hover:text-ink"
                    onClick={h.column.getToggleSortingHandler()}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: <ArrowUp size={11} />, desc: <ArrowDown size={11} /> }[h.column.getIsSorted() as string] ?? <ArrowUpDown size={11} className="opacity-30" />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody style={{ display: 'grid', height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vr) => {
              const row = tableRows[vr.index]
              return (
                <tr key={row.id} style={{ display: 'flex', position: 'absolute', transform: `translateY(${vr.start}px)`, width: '100%' }}
                  className="border-b border-line/40 hover:bg-raised/60">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ width: cell.column.getSize(), display: 'flex' }} className="items-center px-3 h-10 overflow-hidden">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
