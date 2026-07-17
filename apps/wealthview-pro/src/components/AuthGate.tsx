// Passwordless login gate. Active only when served with backing functions
// (i.e. on Netlify) — localhost/dev bypasses so the local workflow is untouched.
import { useEffect, useState } from 'react'
import { Lock, MailCheck } from 'lucide-react'

const DEV = ['localhost', '127.0.0.1'].includes(location.hostname)
const TOKEN_KEY = 'wv_session'

type Phase = 'checking' | 'email' | 'code' | 'authed'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>(DEV ? 'authed' : 'checking')
  const [email, setEmail] = useState('s.byrne@heaventreedesign.com')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (DEV) return
    const t = localStorage.getItem(TOKEN_KEY)
    if (!t) { setPhase('email'); return }
    fetch('/api/auth/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: t }) })
      .then((r) => r.json())
      .then((j) => setPhase(j.ok ? 'authed' : 'email'))
      .catch(() => setPhase('email'))
  }, [])

  async function requestCode() {
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/auth/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'request failed')
      setPhase('code')
      setMsg(j.devCode ? `Dev code: ${j.devCode}` : 'Code sent — check your inbox.')
    } catch (e) { setMsg(String((e as Error).message)) }
    setBusy(false)
  }

  async function verify() {
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) })
      const j = await r.json()
      if (!r.ok || !j.token) throw new Error(j.error || 'verify failed')
      localStorage.setItem(TOKEN_KEY, j.token)
      setPhase('authed')
    } catch (e) { setMsg(String((e as Error).message)) }
    setBusy(false)
  }

  if (phase === 'authed') return <>{children}</>
  if (phase === 'checking')
    return <div className="h-screen grid place-items-center text-muted text-sm animate-pulse">Checking session…</div>

  return (
    <div className="h-screen grid place-items-center p-6">
      <div className="card w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-accent grid place-items-center text-white font-bold text-lg">W</div>
          <div>
            <div className="font-bold tracking-tight text-lg leading-none">Wealthview</div>
            <div className="text-[10px] text-accent-hover font-medium tracking-wide">PRO · PRIVATE</div>
          </div>
        </div>
        {phase === 'email' && (
          <>
            <div className="kpi-label mb-2 flex items-center gap-1.5"><Lock size={11} /> Sign in</div>
            <input className="input w-full mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && requestCode()} placeholder="you@example.com" />
            <button className="btn-primary w-full justify-center" disabled={busy} onClick={requestCode}>
              {busy ? 'Sending…' : 'Email me a login code'}
            </button>
          </>
        )}
        {phase === 'code' && (
          <>
            <div className="kpi-label mb-2 flex items-center gap-1.5"><MailCheck size={11} /> Enter the 6-digit code</div>
            <input className="input w-full mb-3 font-mono text-center text-xl tracking-[8px]" maxLength={6} autoFocus
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && verify()} placeholder="••••••" />
            <button className="btn-primary w-full justify-center mb-2" disabled={busy || code.length !== 6} onClick={verify}>
              {busy ? 'Verifying…' : 'Sign in'}
            </button>
            <button className="btn-secondary w-full justify-center" disabled={busy} onClick={requestCode}>Resend code</button>
          </>
        )}
        {msg && <div className="mt-4 text-xs text-warn">{msg}</div>}
      </div>
    </div>
  )
}
