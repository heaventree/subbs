// JAMOPS dashboard-grid pattern: draggable/resizable widgets, edit mode,
// widget library, per-breakpoint layouts, persisted via the store.
import { useMemo, useState } from 'react'
import { Responsive, WidthProvider, type Layouts } from 'react-grid-layout'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Pencil, Check, Plus, X } from 'lucide-react'
import { useApp, type Widget } from '../lib/store'
import { eur, type WvData } from '../lib/data'

const RGL = WidthProvider(Responsive)

const WIDGET_LIB: { kind: Widget['kind']; label: string }[] = [
  { kind: 'kpi-burn', label: 'KPI · Life running cost' },
  { kind: 'kpi-income', label: 'KPI · Avg income' },
  { kind: 'kpi-net', label: 'KPI · Net this month' },
  { kind: 'kpi-recurring', label: 'KPI · Recurring/mo' },
  { kind: 'chart-cashflow', label: 'Chart · Income vs expenses' },
  { kind: 'top-vendors', label: 'List · Top vendors' },
  { kind: 'chart-groups', label: 'Chart · Spend by group' },
]

export function DashboardPage({ data }: { data: WvData }) {
  const { boards, activeBoard, editing, setEditing, updateLayouts, addWidget, removeWidget } = useApp()
  const board = boards.find((b) => b.id === activeBoard) ?? boards[0]
  const [libOpen, setLibOpen] = useState(false)

  const stats = useMemo(() => {
    const months = data.months
    const compl = months.slice(-4, -1)
    const burn = compl.reduce((a, m) => a + data.monthly[m].exp, 0) / compl.length
    const inc = compl.reduce((a, m) => a + data.monthly[m].inc, 0) / compl.length
    const cur = data.monthly[months[months.length - 1]]
    const recurring = data.vendors.filter((v) => v.type === 'e' && v.recurring).reduce((a, v) => a + v.avgMonthly, 0)
    const cash12 = months.slice(-12).map((m) => ({
      m: m.slice(2).replace('-', '/'),
      In: Math.round(data.monthly[m].inc),
      Out: Math.round(data.monthly[m].exp),
    }))
    const gTot: Record<string, number> = {}
    data.tx.forEach((t) => {
      if (t.t !== 'e' || !months.slice(-12).includes(t.d.slice(0, 7))) return
      const g = data.cats[t.c].group
      gTot[g] = (gTot[g] ?? 0) + t.a
    })
    const groups = Object.entries(gTot).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, value]) => ({ name, value: Math.round(value), color: data.groups.find((g) => g.name === name)?.color ?? '#6B7280' }))
    const topVendors = [...data.vendors].filter((v) => v.type === 'e').sort((a, b) => b.avgMonthly - a.avgMonthly).slice(0, 8)
    return { burn, inc, cur, recurring, cash12, groups, topVendors }
  }, [data])

  function renderWidget(w: Widget) {
    switch (w.kind) {
      case 'kpi-burn': return <Kpi label="Life running cost" value={eur(stats.burn) + '/mo'} tone="text-expense" />
      case 'kpi-income': return <Kpi label="Avg income" value={eur(stats.inc) + '/mo'} tone="text-income" />
      case 'kpi-net': return <Kpi label="This month net" value={eur(stats.cur.inc - stats.cur.exp)} tone={stats.cur.inc - stats.cur.exp >= 0 ? 'text-income' : 'text-expense'} />
      case 'kpi-recurring': return <Kpi label="Recurring / mo" value={eur(stats.recurring)} tone="text-accent-hover" />
      case 'chart-cashflow':
        return (
          <WidgetFrame title="Income vs Expenses" sub="last 12 months">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.cash12} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="m" stroke="#5B6373" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#5B6373" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ background: '#1A2030', border: '1px solid #232B3B', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="In" fill="#22C55E" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Out" fill="#6366F1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </WidgetFrame>
        )
      case 'chart-groups':
        return (
          <WidgetFrame title="Spend by Group" sub="last 12 months">
            <div className="flex h-full items-center gap-4">
              <ResponsiveContainer width="45%" height="90%">
                <PieChart>
                  <Pie data={stats.groups} dataKey="value" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
                    {stats.groups.map((g) => <Cell key={g.name} fill={g.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1A2030', border: '1px solid #232B3B', borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1 overflow-auto pr-2">
                {stats.groups.map((g) => (
                  <div key={g.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: g.color }} />
                    <span className="text-muted truncate flex-1">{g.name}</span>
                    <span className="font-mono">{eur(g.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </WidgetFrame>
        )
      case 'top-vendors':
        return (
          <WidgetFrame title="Top Vendors" sub="by avg monthly">
            <div className="space-y-1.5 overflow-auto h-full pr-1">
              {stats.topVendors.map((v) => (
                <div key={v.id} className="flex items-center gap-2.5 text-[13px] bg-raised border border-line rounded-lg px-3 py-2">
                  <span className="truncate flex-1">{v.name}</span>
                  <span className="font-mono text-expense">{eur(v.avgMonthly)}/mo</span>
                </div>
              ))}
            </div>
          </WidgetFrame>
        )
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-sm text-muted">{board.name}</span>
        <span className="flex-1" />
        {editing && (
          <div className="relative">
            <button className="btn-secondary h-8" onClick={() => setLibOpen(!libOpen)}><Plus size={14} /> Add widget</button>
            {libOpen && (
              <div className="absolute right-0 top-10 z-50 card p-1.5 w-64 shadow-2xl">
                {WIDGET_LIB.map((w) => (
                  <button key={w.kind} className="w-full text-left text-[13px] px-3 py-2 rounded-lg hover:bg-raised"
                    onClick={() => { addWidget(board.id, w.kind); setLibOpen(false) }}>
                    {w.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button className={editing ? 'btn-primary h-8' : 'btn-secondary h-8'} onClick={() => setEditing(!editing)}>
          {editing ? <><Check size={14} /> Done</> : <><Pencil size={14} /> Edit layout</>}
        </button>
      </div>
      <RGL
        className="layout"
        layouts={board.layouts}
        breakpoints={{ lg: 1100, md: 900, sm: 640, xs: 0 }}
        cols={{ lg: 12, md: 9, sm: 6, xs: 3 }}
        rowHeight={60}
        margin={[14, 14]}
        isDraggable={editing}
        isResizable={editing}
        onLayoutChange={(_: unknown, layouts: Layouts) => updateLayouts(board.id, layouts)}
      >
        {board.widgets.map((w) => (
          <div key={w.id} className="relative group">
            {editing && (
              <button
                className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-expense/90 text-white grid place-items-center opacity-0 group-hover:opacity-100"
                onClick={() => removeWidget(board.id, w.id)}
              ><X size={12} /></button>
            )}
            {renderWidget(w)}
          </div>
        ))}
      </RGL>
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="card h-full p-4 flex flex-col justify-center">
      <div className="kpi-label">{label}</div>
      <div className={`font-mono text-2xl font-semibold mt-1.5 ${tone}`}>{value}</div>
    </div>
  )
}

function WidgetFrame({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="card h-full p-4 flex flex-col">
      <div className="flex items-baseline gap-2 mb-2 shrink-0">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-[11px] text-dimmed">{sub}</span>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}
