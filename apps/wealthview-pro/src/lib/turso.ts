// Turso cloud sync — same kv contract as the SPA (key 'wvpro' for this app's
// boards + saved views). Credentials: VITE_TURSO_URL / VITE_TURSO_TOKEN in
// .env.local (never committed), or localStorage overrides.
const url = () => localStorage.getItem('wv_turso_url') || (import.meta.env.VITE_TURSO_URL as string) || ''
const token = () => localStorage.getItem('wv_turso_token') || (import.meta.env.VITE_TURSO_TOKEN as string) || ''

export let dbStatus: 'unknown' | 'ok' | 'offline' = 'unknown'

export type Stmt = { sql: string; args?: (string | number)[] }
export type Cell = { type: string; value?: string } | null

// Shared low-level pipeline call — the ledger module (src/lib/ledger.ts) reuses
// this for its own tables so there is exactly one place that knows the Turso
// HTTP wire format.
export async function tq(stmts: Stmt[], timeoutMs = 15000): Promise<{ response?: { result?: { rows: Cell[][] } } }[]> {
  const u = url(), t = token()
  if (!u || !t) throw new Error('no-turso')
  const requests: unknown[] = stmts.map((x) => ({
    type: 'execute',
    stmt: {
      sql: x.sql,
      args: (x.args ?? []).map((a) =>
        typeof a === 'number' ? { type: 'integer', value: String(Math.round(a)) } : { type: 'text', value: String(a) },
      ),
    },
  }))
  requests.push({ type: 'close' })
  const r = await fetch(u.replace('libsql://', 'https://') + '/v2/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined,
    body: JSON.stringify({ requests }),
  })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  const j = await r.json()
  const bad = (j.results ?? []).find((x: { type: string }) => x.type === 'error')
  if (bad) throw new Error(bad.error?.message ?? 'turso error')
  return j.results
}

const KEY = 'wvpro'
let pushT: ReturnType<typeof setTimeout> | null = null
let lastPushed = ''

export async function cloudPull(): Promise<string | null> {
  try {
    await tq([{ sql: 'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT, ts INTEGER)' }])
    const res = await tq([{ sql: 'SELECT v,ts FROM kv WHERE k=?', args: [KEY] }])
    dbStatus = 'ok'
    const rows = res[0]?.response?.result?.rows ?? []
    if (!rows.length) return null
    const v = rows[0][0]?.value as string
    const ts = +(rows[0][1]?.value ?? 0)
    const localTs = +(localStorage.getItem('wvpro_ts') ?? 0)
    lastPushed = v
    if (ts > localTs) {
      localStorage.setItem('wvpro_ts', String(ts))
      return v
    }
    return null
  } catch (e) {
    dbStatus = (e as Error).message === 'no-turso' ? 'unknown' : 'offline'
    return null
  }
}

export function cloudPush(stateJson: string) {
  if (stateJson === lastPushed) return
  if (pushT) clearTimeout(pushT)
  pushT = setTimeout(async () => {
    const now = Date.now()
    try {
      await tq([{
        sql: 'INSERT INTO kv (k,v,ts) VALUES (?,?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,ts=excluded.ts',
        args: [KEY, stateJson, now],
      }])
      lastPushed = stateJson
      localStorage.setItem('wvpro_ts', String(now))
      dbStatus = 'ok'
    } catch {
      dbStatus = 'offline'
    }
  }, 2000)
}
