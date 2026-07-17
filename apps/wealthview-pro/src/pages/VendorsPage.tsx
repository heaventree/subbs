// Vendor directory — TanStack grid over the merged ledger, with the same
// rename/merge/owner/status/recurring controls as classic.html, writing to
// the SAME Turso kv keys so edits are shared between both apps instantly.
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, useReactTable, type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, GitMerge, X, Building2, User } from 'lucide-react'
import { eur, fmtDate, typicalMonthly, type WvData, type Vendor } from '../lib/data'
import {
  fetchVendorEdits, pushVendorEdit, applyVendorEdits,
  type VendorEdits, type EffectiveVendor, type Status, type Owner,
} from '../lib/vendorEdits'

const STATUS_STYLE: Record<Status, string> = {
  active: 'bg-income/10 text-income', review: 'bg-warn/10 text-warn',
  paused: 'bg-accent/10 text-accent-hover', cancelled: 'bg-expense/10 text-expense',
  completed: 'bg-cyan-400/10 text-cyan-400',
}

export function VendorsPage({ data }: { data: WvData }) {
  const [edits, setEdits] = useState<VendorEdits | null>(null)
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<'e' | 'i' | 'x' | 'all'>('e')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'total', desc: true }])
  const [renaming, setRenaming] = useState<EffectiveVendor | null>(null)
  const [merging, setMerging] = useState<EffectiveVendor | null>(null)

  useEffect(() => { fetchVendorEdits().then(setEdits).catch(() => setEdits({ names: {}, merges: {}, owner: {}, ov: {}, rec: {}, typeOv: {} })) }, [])

  const effective = useMemo(() => (edits ? applyVendorEdits(data.vendors, edits) : []), [data.vendors, edits])

  async function setOwner(id: string, owner: Owner | null) {
    if (!edits) return
    const next = { ...edits.owner }
    if (owner) next[id] = owner; else delete next[id]
    setEdits({ ...edits, owner: next })
    await pushVendorEdit('owner', next)
  }
  async function setStatus(id: string, status: Status) {
    if (!edits) return
    const next = { ...edits.ov, [id]: status }
    setEdits({ ...edits, ov: next })
    await pushVendorEdit('ov', next)
  }
  async function doRename(id: string, name: string) {
    if (!edits) return
    const next = { ...edits.names, [id]: name }
    setEdits({ ...edits, names: next })
    await pushVendorEdit('names', next)
    setRenaming(null)
  }
  async function doMerge(fromId: string, toId: string) {
    if (!edits) return
    const next = { ...edits.merges, [fromId]: toId }
    setEdits({ ...edits, merges: next })
    await pushVendorEdit('merges', next)
    setMerging(null)
  }
  async function unmerge(fromId: string) {
    if (!edits) return
    const next = { ...edits.merges }
    delete next[fromId]
    setEdits({ ...edits, merges: next })
    await pushVendorEdit('merges', next)
  }

  const rows = useMemo(() => {
    let l = effective.filter((v) => !v.absorbed)
    if (kind !== 'all') l = l.filter((v) => v.type === kind)
    if (search) {
      const q = search.toLowerCase()
      l = l.filter((v) => v.displayName.toLowerCase().includes(q) || v.name.toLowerCase().includes(q))
    }
    return l
  }, [effective, kind, search])

  const col = createColumnHelper<EffectiveVendor>()
  const columns = useMemo(() => [
    col.accessor('displayName', {
      header: 'Vendor',
      cell: (c) => {
        const v = c.row.original
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate font-medium text-[13px]" title={v.name !== v.displayName ? v.name : undefined}>{v.displayName}</span>
            {v.name !== v.displayName && <Pencil size={10} className="text-accent-hover shrink-0" />}
          </div>
        )
      },
      size: 260,
    }),
    col.accessor('group', { header: 'Group', cell: (c) => <span className="text-xs text-muted">{c.getValue()}</span>, size: 150 }),
    col.accessor('count', { header: 'Charges', cell: (c) => <span className="font-mono text-xs">{c.getValue()}×</span>, size: 90 }),
    col.accessor('last', { header: 'Last', cell: (c) => <span className="font-mono text-xs text-muted">{fmtDate(c.getValue())}</span>, size: 100 }),
    col.accessor('total', { header: 'Lifetime', cell: (c) => <span className="font-mono text-[13px] font-semibold">{eur(c.getValue())}</span>, size: 120 }),
    col.display({
      id: 'typical', header: 'Typical/mo',
      cell: (c) => c.row.original.type === 'e'
        ? <span className="font-mono text-xs text-warn">{eur(typicalMonthly(data, c.row.original.idx))}</span>
        : <span className="text-dimmed text-xs">—</span>,
      size: 110,
    }),
    col.accessor('status', {
      header: 'Status',
      cell: (c) => {
        const v = c.row.original
        return (
          <select
            className={`text-[11px] font-medium rounded-full px-2 py-0.5 border-0 outline-none cursor-pointer ${STATUS_STYLE[v.status]}`}
            value={v.status}
            onChange={(e) => setStatus(v.id, e.target.value as Status)}
          >
            {(['active', 'review', 'paused', 'cancelled', 'completed'] as Status[]).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )
      },
      size: 110,
    }),
    col.accessor('owner', {
      header: 'Owner',
      cell: (c) => {
        const v = c.row.original
        return (
          <div className="flex gap-1">
            <button title="Heaventree (business)" onClick={() => setOwner(v.id, v.owner === 'heaventree' ? null : 'heaventree')}
              className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold border ${v.owner === 'heaventree' ? 'bg-accent/15 border-accent text-accent-hover' : 'border-line text-dimmed'}`}>
              <Building2 size={11} />
            </button>
            <button title="Personal" onClick={() => setOwner(v.id, v.owner === 'personal' ? null : 'personal')}
              className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold border ${v.owner === 'personal' ? 'bg-pink-500/15 border-pink-500 text-pink-400' : 'border-line text-dimmed'}`}>
              <User size={11} />
            </button>
          </div>
        )
      },
      size: 80,
    }),
    col.display({
      id: 'actions', header: '',
      cell: (c) => (
        <div className="flex gap-1">
          <button className="h-6 w-6 rounded-md hover:bg-raised flex items-center justify-center text-muted" title="Rename" onClick={() => setRenaming(c.row.original)}><Pencil size={12} /></button>
          <button className="h-6 w-6 rounded-md hover:bg-raised flex items-center justify-center text-muted" title="Merge into another vendor" onClick={() => setMerging(c.row.original)}><GitMerge size={12} /></button>
        </div>
      ),
      size: 70,
    }),
  ], [data, edits])

  const table = useReactTable({
    data: rows, columns, state: { sorting }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
  })
  const parentRef = useRef<HTMLDivElement>(null)
  const tableRows = table.getRowModel().rows
  const virtualizer = useVirtualizer({ count: tableRows.length, getScrollElement: () => parentRef.current, estimateSize: () => 42, overscan: 14 })

  const mergedList = useMemo(() => edits ? Object.entries(edits.merges) : [], [edits])
  const byId = useMemo(() => new Map(effective.map((v) => [v.id, v])), [effective])

  if (!edits) return <div className="p-8 text-muted text-sm animate-pulse">Loading vendor edits…</div>

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-2.5 mb-4 shrink-0">
        <input className="input w-64" placeholder="Search vendors…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="seg flex bg-surface border border-line rounded-lg p-0.5">
          {(['e', 'i', 'x', 'all'] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)}
              className={`h-7 px-3 rounded-md text-xs ${kind === k ? 'bg-accent text-white' : 'text-muted'}`}>
              {{ e: 'Expense', i: 'Income', x: 'Transfer', all: 'All' }[k]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-dimmed">{rows.length} vendors · {mergedList.length} merged</span>
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
                    {h.column.getCanSort() && ({ asc: <ArrowUp size={11} />, desc: <ArrowDown size={11} /> }[h.column.getIsSorted() as string] ?? <ArrowUpDown size={11} className="opacity-30" />)}
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
                    <td key={cell.id} style={{ width: cell.column.getSize(), display: 'flex' }} className="items-center px-3 h-[42px] overflow-hidden">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {mergedList.length > 0 && (
        <div className="mt-4 shrink-0 max-h-32 overflow-auto card p-3">
          <div className="text-xs font-semibold text-muted mb-2">Merged vendors</div>
          {mergedList.map(([fromId, toId]) => {
            const from = byId.get(fromId), to = byId.get(toId)
            if (!from || !to) return null
            return (
              <div key={fromId} className="flex items-center justify-between text-xs py-1 border-t border-line/40 first:border-0">
                <span><span className="text-dimmed">{from.name}</span> → <b>{to.displayName}</b></span>
                <button className="text-expense hover:opacity-70" onClick={() => unmerge(fromId)}><X size={12} /></button>
              </div>
            )
          })}
        </div>
      )}

      {renaming && (
        <Modal onClose={() => setRenaming(null)} title="Rename vendor">
          <RenameForm vendor={renaming} onSave={(name) => doRename(renaming.id, name)} />
        </Modal>
      )}
      {merging && (
        <Modal onClose={() => setMerging(null)} title={`Merge "${merging.displayName}" into…`}>
          <MergeForm source={merging} candidates={effective.filter((v) => !v.absorbed && v.id !== merging.id)} onPick={(toId) => doMerge(merging.id, toId)} />
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-md p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">{title}</div>
          <button className="text-muted hover:text-ink" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function RenameForm({ vendor, onSave }: { vendor: EffectiveVendor; onSave: (name: string) => void }) {
  const [name, setName] = useState(vendor.displayName)
  return (
    <div>
      <div className="text-xs text-muted mb-2">Original bank name: <span className="font-mono">{vendor.name}</span></div>
      <input className="input w-full mb-3" value={name} autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSave(name.trim())} />
      <button className="btn-primary" onClick={() => name.trim() && onSave(name.trim())}>Save</button>
    </div>
  )
}

function MergeForm({ source, candidates, onPick }: { source: EffectiveVendor; candidates: EffectiveVendor[]; onPick: (id: string) => void }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(
    () => candidates.filter((v) => v.displayName.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.total - a.total).slice(0, 30),
    [candidates, q],
  )
  return (
    <div>
      <div className="text-xs text-muted mb-3">All {source.count} of "{source.displayName}"'s transactions move under the vendor you pick. Reversible any time from the merged-vendors list.</div>
      <input className="input w-full mb-3" placeholder="Search target vendor…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="max-h-72 overflow-auto space-y-1">
        {filtered.map((v) => (
          <button key={v.id} onClick={() => onPick(v.id)} className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-raised text-sm">
            <span>{v.displayName}</span>
            <span className="text-xs text-dimmed">{v.count}× · {eur(v.total)}</span>
          </button>
        ))}
        {!filtered.length && <div className="text-xs text-dimmed py-4 text-center">No matches.</div>}
      </div>
    </div>
  )
}
