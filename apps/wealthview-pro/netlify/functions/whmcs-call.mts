// Server-to-server WHMCS API proxy, read-only.
//
// Uses the pattern proven working in heaventree/heaventree-desktop and
// heaventree/Workdo-dash after both hit the same silent-failure bug: WHMCS
// "API Credentials" (Setup → Staff Management → API Credentials) must be
// sent as `identifier`+`secret` with the RAW secret — no MD5. MD5-hashing
// the secret (the legacy admin-auth scheme) makes every call fail with a
// generic error and no exception, which is why the original PAYYMO-4.2
// attempt never worked. Do not "helpfully" hash this field.
//
// Read-only by design: Wealthview only needs to reconcile invoice/payment
// status against the bank/Stripe/GoCardless feeds already synced — it
// never needs to create, update, or delete anything in WHMCS. The action
// whitelist below has no write actions in it at all, unlike the ticket
// tooling in heaventree-desktop.
//
// Required Netlify env vars (Site settings → Environment variables, NOT
// prefixed VITE_ — these must never reach the browser bundle):
//   WHMCS_API_URL          e.g. https://billing.example.com/includes/api.php
//   WHMCS_API_IDENTIFIER   Setup → Staff Management → API Credentials
//   WHMCS_API_SECRET       same page — the raw secret, not a password
//
//   POST /api/whmcs/call   body: { action, params? }
//   Session token goes in the X-Wv-Session header (never a query string) —
//   verified identically to bank-sync.mts / auth.mts so only the logged-in
//   owner can trigger a call.

const ALLOWED_ACTIONS = new Set([
  'WhmcsDetails', // health check
  'GetInvoices', 'GetInvoice', // invoice + payment status — the whole point
  'GetClients', 'GetClientsDetails', // optional, for name/email matching later
])

interface Body {
  action: string
  params?: Record<string, string | number | boolean | null>
}

const enc = new TextEncoder()
const ALLOWED = () => (process.env.ALLOWED_EMAIL || '').toLowerCase()

async function hmac(s: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(process.env.AUTH_SECRET || 'dev-secret'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(s))
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]!)
}

// Mirrors bank-sync.mts's session check exactly — same token, same secret.
async function verifySession(token: string) {
  const [b64, sig] = (token || '').split('.')
  if (!b64 || !sig) return false
  let payload = ''
  try { payload = atob(b64) } catch { return false }
  const [email, exp] = payload.split('|')
  if (email !== ALLOWED() || Date.now() > +exp) return false
  return (await hmac(payload)) === sig
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export default async (req: Request) => {
  try {
    return await handle(req)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
}

async function handle(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const token = req.headers.get('x-wv-session') || ''
  if (!(await verifySession(token))) return json({ error: 'unauthorized' }, 401)

  const apiUrl = process.env.WHMCS_API_URL
  const identifier = process.env.WHMCS_API_IDENTIFIER
  const secret = process.env.WHMCS_API_SECRET
  if (!apiUrl || !identifier || !secret) {
    return json({ error: 'WHMCS_API_URL / WHMCS_API_IDENTIFIER / WHMCS_API_SECRET not configured' }, 500)
  }

  let body: Body
  try { body = await req.json() as Body }
  catch { return json({ error: 'Invalid JSON body' }, 400) }
  if (!body.action) return json({ error: 'action is required' }, 400)
  if (!ALLOWED_ACTIONS.has(body.action)) {
    return json({ error: `Action '${body.action}' not allowed` }, 403)
  }

  const form = new URLSearchParams()
  for (const [k, v] of Object.entries(body.params ?? {})) {
    if (v === null || v === undefined) continue
    form.set(k, String(v))
  }
  // Trusted fields are set LAST so a caller can never smuggle an
  // unwhitelisted action (or forge identifier/secret) via params — e.g.
  // { action: 'GetInvoices', params: { action: 'DeleteClient' } } must
  // still submit as GetInvoices, not silently become the params value.
  form.set('identifier', identifier) // raw API Identifier — never username
  form.set('secret', secret)         // raw API Secret — never MD5(password)
  form.set('action', body.action)
  form.set('responsetype', 'json')

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: AbortSignal.timeout(15_000),
    })
    const text = await res.text()
    let data: unknown
    try { data = JSON.parse(text) } catch { data = { result: 'error', message: 'non-JSON response from WHMCS', raw: text } }
    // WHMCS returns HTTP 200 even on logical errors (bad auth, unknown
    // action, etc) — pass the body through as-is and let the caller
    // branch on the `result` field, not the status code.
    return json(data, 200)
  } catch (err) {
    return json({ result: 'error', message: err instanceof Error ? err.message : 'fetch failed' }, 502)
  }
}

export const config = { path: '/api/whmcs/call' }
