// Server-to-server bridge to open-banking.io. Holds the API key + decryption
// private key from the credentials.json exported at open-banking.io — NEVER
// sent to the browser. Returns already-decrypted transactions to the
// authenticated session only; Classic/Pro then run them through the exact
// same normPayee/classify/fingerprint pipeline CSV import already uses, so
// there's no separate categorization or dedup path to keep in sync.
//
// Required Netlify env vars (from the credentials.json open-banking.io gives
// you — never paste the private key anywhere but the Netlify env UI):
//   OBIO_API_BASE_URL       - credentials.json's "apiBaseUrl"
//   OBIO_API_KEY             - credentials.json's "apiKey" (or "user")
//   OBIO_PRIVATE_KEY_PKCS8   - credentials.json's "encryptionKey.privateKey"
//   AUTH_SECRET, ALLOWED_EMAIL - same as auth.mts; sessions are verified
//                                identically so only the logged-in owner can sync
//
//   GET /api/bank/sync?days=90  ->  { accounts: [...], transactions: [...] }
//   Session token goes in the X-Wv-Session header (never a query string).

import { OpenBankingClient } from '@open-banking-io/client'

const enc = new TextEncoder()
const ALLOWED = () => (process.env.ALLOWED_EMAIL || '').toLowerCase()

async function hmac(s: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(process.env.AUTH_SECRET || 'dev-secret'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(s))
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]!)
}

// Mirrors auth.mts's /api/auth/check verification exactly — same token, same secret.
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
  const url = new URL(req.url)
  const token = req.headers.get('x-wv-session') || ''
  if (!(await verifySession(token))) return json({ error: 'unauthorized' }, 401)

  const apiBaseUrl = process.env.OBIO_API_BASE_URL
  const apiKey = process.env.OBIO_API_KEY
  const privateKeyPkcs8 = process.env.OBIO_PRIVATE_KEY_PKCS8
  if (!apiBaseUrl || !apiKey || !privateKeyPkcs8) {
    return json({ error: 'open-banking.io not configured (missing OBIO_API_BASE_URL/OBIO_API_KEY/OBIO_PRIVATE_KEY_PKCS8)' }, 500)
  }

  const client = new OpenBankingClient({ apiBaseUrl, apiKey, privateKeyPkcs8 })

  // Best-effort refresh from the bank; stale-but-present data still beats a hard failure.
  await client.syncAll().catch(() => {})

  const days = Math.min(Math.max(+(url.searchParams.get('days') || 90), 1), 3650)
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const accounts = await client.getAccounts()
  const transactions: Record<string, unknown>[] = []
  const PAGE = 200, MAX_PAGES_PER_ACCOUNT = 5 // bounds worst-case function runtime
  for (const acct of accounts) {
    let offset = 0
    for (let page = 0; page < MAX_PAGES_PER_ACCOUNT; page++) {
      const res = await client.getTransactions(acct.id, { from, limit: PAGE, offset })
      for (const t of res.items) transactions.push({ ...t, accountId: acct.id })
      offset += res.items.length
      if (res.items.length < PAGE || offset >= res.total) break
    }
  }

  return json({
    accounts: accounts.map((a) => {
      const booked = a.balances.find((b) => b.type === 'ITBD') ?? a.balances[0]
      return {
        id: a.id, name: a.displayName ?? a.ownerName ?? a.aspspName,
        aspspName: a.aspspName, aspspCountry: a.aspspCountry, accountType: a.accountType,
        iban: a.iban, currency: a.currency, needsReconnect: a.needsReconnect,
        balance: booked ? booked.amount : null,
      }
    }),
    transactions,
  })
}

export const config = { path: '/api/bank/sync' }
