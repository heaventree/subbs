#!/usr/bin/env python3
"""
Wealthview Phase 1 loader — populate the Postgres ledger from the compact
JSON produced by prep_data.py (same data the SPA embeds).

Usage:
    python3 db/load.py <spendly2_data.json> [DATABASE_URL]

DATABASE_URL defaults to $DATABASE_URL or a local dev instance.
Idempotent: re-running upserts vendors/categories and skips duplicate
transactions via the source_record.fingerprint UNIQUE constraint.
"""
import sys, os, json, hashlib

try:
    import psycopg
except ImportError:
    sys.exit("psycopg (v3) required: pip install 'psycopg[binary]'")


def fp(*parts):
    return hashlib.sha256('|'.join(str(p) for p in parts).encode()).hexdigest()


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    data = json.load(open(sys.argv[1]))
    dsn = sys.argv[2] if len(sys.argv) > 2 else os.environ.get(
        'DATABASE_URL', 'postgresql://wv:wv@localhost:5432/wealthview')

    vendors, cats, groups, tx = (data['vendors'], data['cats'],
                                 data['groups'], data['tx'])
    appsumo = data.get('appsumo', [])
    gc = {g['name']: g['color'] for g in groups}

    with psycopg.connect(dsn) as conn, conn.cursor() as cur:
        # single-view entity
        cur.execute("""INSERT INTO entity (name, kind) VALUES ('Everything','combined')
                       ON CONFLICT DO NOTHING RETURNING id""")

        # categories
        cat_id = {}
        for c in cats:
            grp = c['group']
            is_x = grp == 'Transfers & Savings'
            cur.execute("""INSERT INTO category (name, grp, color, is_transfer)
                           VALUES (%s,%s,%s,%s)
                           ON CONFLICT (name) DO UPDATE SET grp=EXCLUDED.grp,
                             color=EXCLUDED.color, is_transfer=EXCLUDED.is_transfer
                           RETURNING id""",
                        (c['name'], grp, c.get('color') or gc.get(grp), is_x))
            cat_id[c['name']] = cur.fetchone()[0]

        # vendors
        ven_id = {}
        for i, v in enumerate(vendors):
            kind = {'i': 'income', 'x': 'transfer'}.get(v['type'], 'expense')
            cur.execute("""INSERT INTO vendor (norm, display_name, kind, domain, is_recurring)
                           VALUES (%s,%s,%s,%s,%s)
                           ON CONFLICT (norm) DO UPDATE SET display_name=EXCLUDED.display_name,
                             kind=EXCLUDED.kind, domain=EXCLUDED.domain,
                             is_recurring=EXCLUDED.is_recurring
                           RETURNING id""",
                        (v['norm'], v['name'], kind, v.get('domain'), v['recurring']))
            ven_id[i] = cur.fetchone()[0]

        # one import batch for this load
        cur.execute("""INSERT INTO import_batch (source, file_name, row_count)
                       VALUES ('budgetbakers_csv', %s, %s) RETURNING id""",
                    (os.path.basename(sys.argv[1]), len(tx)))
        batch = cur.fetchone()[0]

        cat_by_idx = [c['name'] for c in cats]
        inserted = skipped = 0
        for row in tx:
            d, vidx, amt, cidx, typ, rec = row
            kind = {'i': 'income', 'x': 'transfer'}.get(typ, 'expense')
            direction = 'in' if typ == 'i' else 'out'
            f = fp(d, vidx, amt, cidx, typ)
            cur.execute("""INSERT INTO source_record (batch_id, source, fingerprint, raw)
                           VALUES (%s,'budgetbakers_csv',%s,%s)
                           ON CONFLICT (fingerprint) DO NOTHING RETURNING id""",
                        (batch, f, json.dumps(row)))
            got = cur.fetchone()
            if not got:
                skipped += 1
                continue
            src = got[0]
            cur.execute("""INSERT INTO txn
                (source_id, account_id, vendor_id, category_id, txn_date, direction,
                 kind, amount, currency, amount_eur, fx_rate, is_recurring, confidence)
                VALUES (%s,NULL,%s,%s,%s,%s,%s,%s,'EUR',%s,1,%s,'inferred')""",
                        (src, ven_id[vidx], cat_id.get(cat_by_idx[cidx]),
                         d, direction, kind, amt, amt, bool(rec)))
            inserted += 1

        # lifetime deals
        for d, product, amount in appsumo:
            cur.execute("""INSERT INTO lifetime_deal (bought_date, product, amount, currency)
                           VALUES (%s,%s,%s,'USD')""", (d, product, amount))

        cur.execute("""INSERT INTO audit_event (action, object_type, detail)
                       VALUES ('import','import_batch',%s)""",
                    (json.dumps({'inserted': inserted, 'skipped': skipped,
                                 'vendors': len(vendors), 'deals': len(appsumo)}),))
        conn.commit()

        print(f"vendors={len(vendors)} categories={len(cats)} "
              f"tx_inserted={inserted} tx_skipped={skipped} deals={len(appsumo)}")
        # quick sanity read-back
        cur.execute("SELECT month, income, expense, transfers, net FROM v_monthly "
                    "ORDER BY month DESC LIMIT 3")
        print("recent months (month, in, out, transfers, net):")
        for r in cur.fetchall():
            print("  ", r)


if __name__ == '__main__':
    main()
