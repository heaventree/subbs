# Deploying Wealthview Pro to Netlify

## 1. Create the site
- Netlify → Add new site → Import from Git → pick `heaventree/subbs`
- **Base directory:** `apps/wealthview-pro`
- Build command / publish dir auto-read from `netlify.toml`

## 2. Environment variables (Site settings → Environment variables)

| Var | Value |
|---|---|
| `VITE_TURSO_URL` | `libsql://wealth-manager-heaventree.aws-eu-west-1.turso.io` |
| `VITE_TURSO_TOKEN` | your Turso auth token |
| `TURSO_URL` | same libsql URL (used by the auth function) |
| `TURSO_TOKEN` | same token |
| `AUTH_SECRET` | any long random string (session signing) |
| `RESEND_API_KEY` | free key from resend.com (see below) |
| `ALLOWED_EMAIL` | **required** — the only address allowed to log in. In Resend test mode this MUST be the same address your Resend account is registered with, or codes won't deliver |
| `DEEPSEEK_KEY` | optional — injected into `/classic.html` at build time so the AI assistant works with no manual setup |
| `BRANDFETCH_KEY` | optional — injected into `/classic.html` at build time for vendor logos |
| `ALLOW_DEV_CODE` | optional, `1` — shows the login code on screen instead of emailing (testing only, remove after) |

Set every variable to **"Same value in all deploy contexts"** — a
value scoped to only one context (e.g. Deploy Previews) will be blank
in Production and cause hard-to-diagnose failures.

## Classic app key injection

`/classic.html` (the full-featured single-file app) normally asks you to
paste your Turso/DeepSeek/Brandfetch keys once via its Assistant
(`set turso url …`, `set deepseek key …`). On Netlify, `scripts/inject-classic.mjs`
runs after the Vite build and writes `TURSO_URL`, `TURSO_TOKEN`,
`DEEPSEEK_KEY` and `BRANDFETCH_KEY` straight into the shipped HTML, so the
deployed classic app works immediately with no setup step. Any key left
unset in Netlify simply falls back to the in-browser "set … key" flow.

**Trade-off:** these become part of the public static bundle, readable by
anyone with the URL — acceptable for an unlisted personal deployment.
Leave a key blank in Netlify if you'd rather keep it out of the bundle
and set it manually per-browser instead.

## 3. Email codes (Resend, ~2 minutes)
1. Sign up at resend.com **with the same email you'll log in with** (test-mode Resend only delivers to the account owner's address)
2. API Keys → Create → paste as `RESEND_API_KEY`
3. No domain setup needed: codes send from `onboarding@resend.dev`, which
   Resend allows to your own account email — exactly our single-email case.

Testing without email: set `ALLOW_DEV_CODE=1` and the request response
includes the code (remove for real use).

## 4. Login behaviour
- Only `ALLOWED_EMAIL` receives codes (other emails get a silent no-op); the login form is blank — no address disclosed on the public page
- 6-digit code, 10-minute expiry, 5 attempts, stored hashed in Turso
- Session = signed token, 30 days, in localStorage
- **localhost bypasses the gate** so local dev/testing is frictionless

## Honest security note
This gate keeps the site private, but the Turso token is baked into the
JS bundle (a static SPA can't hide it). Fine for a personal deployment on
an unlisted URL; when the app goes multi-user, we move Turso access behind
the functions and the bundle stops carrying credentials.
