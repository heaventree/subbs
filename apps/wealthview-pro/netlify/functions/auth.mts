// Passwordless auth for Wealthview Pro.
//   POST /api/auth/request {email}        -> emails a 6-digit code (Resend)
//   POST /api/auth/verify  {email, code}  -> returns signed session token (30d)
//   POST /api/auth/check   {token}        -> {ok}
// Codes are stored hashed in Turso (auth_code table), 10-minute expiry,
// max 5 attempts. Only ALLOWED_EMAIL may log in.
//
// Required Netlify env vars:
//   TURSO_URL, TURSO_TOKEN            - the wealth-manager database
//   AUTH_SECRET                       - any long random string (session signing)
//   RESEND_API_KEY                    - free key from resend.com
//   ALLOWED_EMAIL (required)          - the ONLY address allowed to log in.
//                                       Must match the Resend account email in
//                                       test mode (Resend only delivers there).
//   ALLOW_DEV_CODE (optional, "1")    - returns the code in the response
//                                       instead of emailing (testing only)

const ALLOWED = () => (process.env.ALLOWED_EMAIL || '').toLowerCase()
const enc = new TextEncoder()

async function sha256(s: string) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(s))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hmac(s: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(process.env.AUTH_SECRET || 'dev-secret'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(s))
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]!)
}

async function turso(stmts: { sql: string; args?: (string | number)[] }[]) {
  const url = (process.env.TURSO_URL || '').replace('libsql://', 'https://') + '/v2/pipeline'
  const requests: unknown[] = stmts.map((x) => ({
    type: 'execute',
    stmt: {
      sql: x.sql,
      args: (x.args ?? []).map((a) =>
        typeof a === 'number' ? { type: 'integer', value: String(Math.round(a)) } : { type: 'text', value: String(a) }),
    },
  }))
  requests.push({ type: 'close' })
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.TURSO_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  })
  if (!r.ok) throw new Error('turso ' + r.status)
  const j = await r.json()
  const bad = (j.results ?? []).find((x: { type: string }) => x.type === 'error')
  if (bad) throw new Error(bad.error?.message ?? 'turso error')
  return j.results
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  const action = new URL(req.url).pathname.split('/').pop()
  let body: { email?: string; code?: string; token?: string }
  try { body = await req.json() } catch { return json({ error: 'bad json' }, 400) }

  if (action === 'request') {
    if (!ALLOWED()) return json({ error: 'ALLOWED_EMAIL not configured' }, 500)
    const email = (body.email || '').trim().toLowerCase()
    // Do not reveal the allowlist: always claim success.
    if (email !== ALLOWED()) return json({ ok: true, sent: true })
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const hash = await sha256(code + email)
    await turso([
      { sql: 'CREATE TABLE IF NOT EXISTS auth_code (email TEXT PRIMARY KEY, hash TEXT, exp INTEGER, attempts INTEGER)' },
      { sql: 'INSERT INTO auth_code (email,hash,exp,attempts) VALUES (?,?,?,0) ON CONFLICT(email) DO UPDATE SET hash=excluded.hash, exp=excluded.exp, attempts=0',
        args: [email, hash, Date.now() + 10 * 60 * 1000] },
    ])
    if (process.env.ALLOW_DEV_CODE === '1') return json({ ok: true, sent: true, devCode: code })
    if (!process.env.RESEND_API_KEY) return json({ error: 'RESEND_API_KEY not configured' }, 500)
    const mail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Wealthview <onboarding@resend.dev>',
        to: [email],
        subject: `${code} — your Wealthview login code`,
        html: `<div style="font-family:sans-serif;max-width:420px"><h2 style="letter-spacing:-.5px">Wealthview</h2><p>Your login code:</p><p style="font-size:34px;font-weight:700;letter-spacing:6px;font-family:monospace">${code}</p><p style="color:#667">Valid for 10 minutes. If you didn't request this, ignore it.</p></div>`,
      }),
    })
    if (!mail.ok) return json({ error: 'email send failed: ' + (await mail.text()).slice(0, 200) }, 502)
    return json({ ok: true, sent: true })
  }

  if (action === 'verify') {
    const email = (body.email || '').trim().toLowerCase()
    const code = (body.code || '').trim()
    if (email !== ALLOWED() || !/^\d{6}$/.test(code)) return json({ error: 'invalid code' }, 401)
    const res = await turso([{ sql: 'SELECT hash,exp,attempts FROM auth_code WHERE email=?', args: [email] }])
    const rows = res[0]?.response?.result?.rows ?? []
    if (!rows.length) return json({ error: 'no code requested' }, 401)
    const [hash, exp, attempts] = [rows[0][0]?.value, +rows[0][1]?.value, +rows[0][2]?.value]
    if (Date.now() > exp) return json({ error: 'code expired' }, 401)
    if (attempts >= 5) return json({ error: 'too many attempts' }, 429)
    if ((await sha256(code + email)) !== hash) {
      await turso([{ sql: 'UPDATE auth_code SET attempts=attempts+1 WHERE email=?', args: [email] }])
      return json({ error: 'invalid code' }, 401)
    }
    await turso([{ sql: 'DELETE FROM auth_code WHERE email=?', args: [email] }])
    const expiry = Date.now() + 30 * 24 * 3600 * 1000
    const payload = `${email}|${expiry}`
    return json({ ok: true, token: btoa(payload) + '.' + (await hmac(payload)) })
  }

  if (action === 'check') {
    const t = body.token || ''
    const [b64, sig] = t.split('.')
    if (!b64 || !sig) return json({ ok: false })
    let payload = ''
    try { payload = atob(b64) } catch { return json({ ok: false }) }
    const [email, exp] = payload.split('|')
    if (email !== ALLOWED() || Date.now() > +exp) return json({ ok: false })
    return json({ ok: (await hmac(payload)) === sig })
  }

  return json({ error: 'unknown action' }, 404)
}

export const config = { path: '/api/auth/*' }
