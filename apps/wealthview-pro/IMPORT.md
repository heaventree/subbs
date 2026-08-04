# BudgetBakers sync — how it actually works today

`window.claude.mcp` (the classic app's "Sync Wallet" button) only exists
inside a page rendered by claude.ai as a published Artifact. A normal
hosted site — including this one on Netlify — has no such API, and the
Wallet connector isn't reachable from a plain server either without a
BudgetBakers-issued API token (separate from the Claude MCP connector).

So the real, working sync today is **Data → Import**: export a fresh CSV
from BudgetBakers, drop it in. It's parsed with the exact same rules as
the original snapshot (`../wealthview/prep_data.py`, ported to
`src/lib/normalize.ts`), deduped by a fingerprint of
`(date, vendor, amount, category, kind)` against both the base snapshot
and anything already imported, and only genuinely new rows are written.

## Where the data lives

- **Base snapshot** (`public/wv-data.json`) — the original 7,540-row
  export, baked at build time. Never changes.
- **Delta** (Turso `txn_delta` table) — only rows added via Import.
  Small, fast to query, grows over time.
- On load, `src/lib/data.ts` fetches the delta and merges it into the
  base in memory — vendor totals, running costs, dashboard, everything
  recomputes automatically. No migration step, no risk to the working base.

## Vendor edits are shared with classic.html

Renames, merges, status, owner tags and recurring overrides read/write
the **same Turso `kv` keys** classic.html already uses (`names`, `merges`,
`owner`, `ov`, `rec`, `typeOv`). Sort vendors in either app — the other
sees it immediately.

## If a real BudgetBakers API token ever exists

`rest.budgetbakers.com` is a documented REST API separate from the MCP
connector. A Netlify function could pull from it server-side (Netlify's
functions can reach the open internet — proven, since the auth function
already talks to Turso and Resend). That would write into the same
`txn_delta` table this import path already uses — the merge/dashboard
side needs no changes, only a new writer.

## Data → Import: bank sync (open-banking.io)

This is now real, not hypothetical — same idea as above, but for direct
bank connections instead of a BudgetBakers token. `netlify/functions/bank-sync.mts`
holds the open-banking.io API key and decryption private key **server-side
only** and returns already-decrypted transactions to the logged-in session;
the browser never sees the private key. Classic's "Sync connected banks"
button (Data → Import) then runs those transactions through the exact
same `normPayee`/`classify`/`fingerprint` pipeline a CSV import uses, so
there's one dedup path and one Turso writer (`txn_delta`) for both sources.

**Required Netlify env vars** (from the `credentials.json` you export at
[open-banking.io](https://open-banking.io) after connecting your bank
accounts — never paste the private key anywhere but the Netlify env UI):

- `OBIO_API_BASE_URL` — `credentials.json`'s `apiBaseUrl`
- `OBIO_API_KEY` — `credentials.json`'s `apiKey`
- `OBIO_PRIVATE_KEY_PKCS8` — `credentials.json`'s `encryptionKey.privateKey`

(`AUTH_SECRET` and `ALLOWED_EMAIL` are already required for login — the
bank-sync endpoint reuses them to verify the same session token, so only
the logged-in owner can trigger a sync.)

**Why CSV import is still worth keeping**: a raw bank feed carries an MCC
(merchant category code, numeric) rather than BudgetBakers' human category
names, so bank-synced rows land in category "Other" and rely on the
existing Vendors rename/merge workbench to clean up — whereas a BudgetBakers
CSV export already has real categories. Bank sync is for staying current
day-to-day; a periodic BudgetBakers CSV export still gives the richest
categorization for the full history.
