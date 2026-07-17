import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Shell } from './components/Shell'
import { DashboardPage } from './pages/DashboardPage'
import { LedgerPage } from './pages/LedgerPage'
import { useApp } from './lib/store'
import { loadData, type WvData } from './lib/data'

const TITLES: Record<string, [string, string]> = {
  dashboard: ['Overview', 'Dashboard'],
  ledger: ['Full ledger', 'Transactions'],
  vendors: ['Directory', 'Vendors'],
  subscriptions: ['Recurring', 'Subscriptions'],
  networth: ['Wealth', 'Net Worth'],
}

function App() {
  const { page } = useApp()
  const [data, setData] = useState<WvData | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => { loadData().then(setData).catch((e) => setErr(String(e))) }, [])

  const [sub, title] = TITLES[page] ?? ['', page]
  return (
    <Shell title={title} sub={sub}>
      {err && <div className="p-8 text-expense text-sm">Failed to load data: {err}</div>}
      {!data && !err && <div className="p-8 text-muted text-sm animate-pulse">Loading ledger…</div>}
      {data && page === 'dashboard' && <DashboardPage data={data} />}
      {data && page === 'ledger' && <LedgerPage data={data} />}
      {data && !['dashboard', 'ledger'].includes(page) && (
        <div className="p-10 text-center text-muted text-sm">
          <div className="text-3xl mb-3 opacity-40">🏗</div>
          {title} is being ported from the SPA — Dashboard and Ledger are live in Pro.
        </div>
      )}
    </Shell>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
