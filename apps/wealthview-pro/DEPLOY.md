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
| `ALLOWED_EMAIL` | `s.byrne@heaventreedesign.com` (optional, this is the default) |

## 3. Email codes (Resend, ~2 minutes)
1. Sign up at resend.com **with s.byrne@heaventreedesign.com**
2. API Keys → Create → paste as `RESEND_API_KEY`
3. No domain setup needed: codes send from `onboarding@resend.dev`, which
   Resend allows to your own account email — exactly our single-email case.

Testing without email: set `ALLOW_DEV_CODE=1` and the request response
includes the code (remove for real use).

## 4. Login behaviour
- Only `ALLOWED_EMAIL` receives codes (other emails get a silent no-op)
- 6-digit code, 10-minute expiry, 5 attempts, stored hashed in Turso
- Session = signed token, 30 days, in localStorage
- **localhost bypasses the gate** so local dev/testing is frictionless

## Honest security note
This gate keeps the site private, but the Turso token is baked into the
JS bundle (a static SPA can't hide it). Fine for a personal deployment on
an unlisted URL; when the app goes multi-user, we move Turso access behind
the functions and the bundle stops carrying credentials.
