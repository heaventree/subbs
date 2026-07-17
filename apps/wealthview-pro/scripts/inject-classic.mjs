// Post-build: inject runtime keys from Netlify env into dist/classic.html.
// Each key is optional — empty env leaves the in-app "set … key" flow as
// the fallback. Values land in the public bundle by design (personal site).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const f = 'dist/classic.html'
if (!existsSync(f)) { console.log('inject-classic: no dist/classic.html, skipping'); process.exit(0) }

const esc = (v) => (v ?? '').trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const pairs = [
  ["'wv_bfkey')||''", process.env.BRANDFETCH_KEY],
  ["'wv_dskey')||''", process.env.DEEPSEEK_KEY],
  ["'wv_turso_url')||''", process.env.TURSO_URL],
  ["'wv_turso_token')||''", process.env.TURSO_TOKEN],
]
let html = readFileSync(f, 'utf8')
let n = 0
for (const [needle, val] of pairs) {
  if (!val || !html.includes(needle)) continue
  html = html.replace(needle, needle.slice(0, -2) + "'" + esc(val) + "'")
  n++
}
writeFileSync(f, html)
console.log(`inject-classic: ${n} key(s) injected`)
