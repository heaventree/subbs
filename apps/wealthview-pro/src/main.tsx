import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Shell } from './components/Shell'
import { AuthGate } from './components/AuthGate'
import { DashboardPage } from './pages/DashboardPage'
import { LedgerPage } from './pages/LedgerPage'
import { VendorsPage } from './pages/VendorsPage'
import { ImportPage } from './pages/ImportPage'
import { ExportPage } from './pages/ExportPage'
import { useApp } from './lib/store'
import { loadData, invalidateCache, type WvData } from './lib/data'
import { cloudPull, cloudPush } from './lib/turso'

const TITLES: Record<string, [string, string]> = {
  dashboard: ['Overview', 'Dashboard'],
  ledger: ['Full ledger', 'Transactions'],
  vendors: ['Directory', 'Vendors'],
  subscriptions: ['Recurring', 'Subscriptions'],
  networth: ['Wealth', 'Net Worth'],
  import: ['Data', 'Import'],
  export: ['Data', 'Export / Backup'],
}

function App() {
  const { page } = useApp()
  const [data, setData] = useState<WvData | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    loadData().then(setData).catch((e) => setErr(String(e)))
    // Turso: pull newer board/view state, then mirror every change up
    cloudPull().then((remote) => {
      if (remote) {
        try {
          const parsed = JSON.parse(remote)
          useApp.setState(parsed.state ?? parsed)
        } catch { /* ignore malformed remote */ }
      }
      useApp.subscribe((s) =>
        cloudPush(JSON.stringify({ state: { boards: s.boards, ledgerViews: s.ledgerViews, activeBoard: s.activeBoard } })),
      )
    })
  }, [])

  function refreshAfterImport() {
    invalidateCache()
    loadData().then(setData).catch((e) => setErr(String(e)))
  }

  const [sub, title] = TITLES[page] ?? ['', page]
  return (
    <Shell title={title} sub={sub}>
      {err && <div className="p-8 text-expense text-sm">Failed to load data: {err}</div>}
      {!data && !err && <div className="p-8 text-muted text-sm animate-pulse">Loading ledger…</div>}
      {data && page === 'dashboard' && <DashboardPage data={data} />}
      {data && page === 'ledger' && <LedgerPage data={data} />}
      {data && page === 'vendors' && <VendorsPage data={data} />}
      {data && page === 'import' && <ImportPage data={data} onImported={refreshAfterImport} />}
      {data && page === 'export' && <ExportPage data={data} />}
      {data && !['dashboard', 'ledger', 'vendors', 'import', 'export'].includes(page) && (
        <div className="p-10 text-center text-muted text-sm">
          <div className="text-3xl mb-3 opacity-40">🏗</div>
          {title} is being ported from the SPA — Dashboard, Ledger, Vendors, Import and Export are live in Pro.
        </div>
      )}
    </Shell>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>,
)
