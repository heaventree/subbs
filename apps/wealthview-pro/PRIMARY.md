# Classic is the primary app

As of 17 Jul 2026: Classic (`/classic.html`) has the full feature set —
Dashboard, Running Costs, Cash Flow, Categories, Subscriptions,
Lifetime Deals, Vendors workbench, Net Worth + holdings, Rules Engine,
AI Assistant, Dev Notes, Import. Pro (the React rewrite) has 5 pages so
far. Rather than block on reaching parity, **Classic is now what you land
on after logging in** — Pro stays available for anyone testing the new
build.

## How the routing works

- Log in at `/` → redirected straight to `/classic.html` (unless the
  login was reached via a `?return=...` deep link, which takes you back
  to wherever you came from)
- Visit `/?pro=1` to see the Pro dashboard/ledger/vendors/import/export
  instead
- `/classic.html` carries its own copy of the same session check — visit
  it directly with no session and it bounces to `/?return=/classic.html`,
  then back to Classic once you're signed in
- Both apps share the same Turso `kv` keys for vendor edits (see
  `IMPORT.md`), so nothing built in Pro so far is wasted — Vendors,
  Import and Export all keep working against whichever data you're
  looking at in Classic

## Why not just delete Pro

`apps/wealthview-pro`'s foundations (TanStack ledger grid, virtualized
tables, the Turso `txn_delta`/import architecture, the shared vendor-edit
layer) are the pieces genuinely worth having in an enterprise rebuild —
they're just not yet a majority of the surface area. Keeping both means
the working app stays the working app while the rebuild continues at
whatever pace makes sense, with zero risk to daily use.
