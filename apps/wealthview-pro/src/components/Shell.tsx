import { LayoutDashboard, List, Building2, RefreshCw, Landmark, Settings2, AppWindow, UploadCloud, DownloadCloud } from 'lucide-react'
import { useApp } from '../lib/store'
import clsx from 'clsx'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ledger', label: 'Ledger', icon: List },
  { id: 'vendors', label: 'Vendors', icon: Building2 },
  { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { id: 'networth', label: 'Net Worth', icon: Landmark },
]

const DATA_NAV = [
  { id: 'import', label: 'Import', icon: UploadCloud },
  { id: 'export', label: 'Export / Backup', icon: DownloadCloud },
]

export function Shell({ children, title, sub, actions }: {
  children: React.ReactNode
  title: string
  sub: string
  actions?: React.ReactNode
}) {
  const { page, setPage } = useApp()
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[232px] shrink-0 border-r border-line flex flex-col">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-line">
          <div className="h-8 w-8 rounded-lg bg-accent grid place-items-center text-white font-bold">W</div>
          <div>
            <div className="font-bold tracking-tight leading-none">Wealthview</div>
            <div className="text-[10px] text-accent-hover font-medium tracking-wide">PRO</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-dimmed px-3 mb-2">Analytics</div>
          <a href="/classic.html" target="_blank" rel="noopener"
            className="w-full flex items-center gap-3 h-9 px-3 rounded-lg text-sm text-muted hover:bg-surface hover:text-ink transition-colors">
            <AppWindow size={15} />
            Classic (full app)
            <span className="ml-auto text-[9px] font-semibold text-warn border border-warn/40 rounded px-1">ALL FEATURES</span>
          </a>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={clsx(
                'w-full flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors',
                page === id ? 'bg-accent/10 text-ink font-medium' : 'text-muted hover:bg-surface hover:text-ink',
              )}
            >
              <Icon size={15} className={page === id ? 'text-accent-hover' : ''} />
              {label}
            </button>
          ))}
          <div className="text-[11px] font-semibold uppercase tracking-wider text-dimmed px-3 mb-2 mt-5">Data</div>
          {DATA_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={clsx(
                'w-full flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors',
                page === id ? 'bg-accent/10 text-ink font-medium' : 'text-muted hover:bg-surface hover:text-ink',
              )}
            >
              <Icon size={15} className={page === id ? 'text-accent-hover' : ''} />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-line flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-accent grid place-items-center text-white text-xs font-semibold">SO</div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium truncate">Sean O'Byrne</div>
            <div className="text-[11px] text-muted">wealthview-pro 0.1</div>
          </div>
          <Settings2 size={14} className="ml-auto text-dimmed" />
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 border-b border-line flex items-center justify-between px-7">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted">{sub}</div>
            <h1 className="text-lg font-semibold leading-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-2.5">{actions}</div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
