#!/usr/bin/env python3
"""Spendly v2 data prep — full ledger, compact columnar format."""
import csv, json, re, hashlib
from collections import defaultdict

CSV = '/root/.claude/uploads/b079a466-7434-53d3-8f62-638a5f604b40/8244fd7e-bbakersecportjuly6.csv'

# ── Category groups (85 raw → 16 groups) ─────────────────────────────────────
GROUPS = {
    'AI & Software': ['AI LICENSES','SOFTWARE/LICENSES','Software, apps, games','MICROSOFT',
                      'ACCOUNTING SOFTWARE','APPSUMO','SECURITY','PROJECT MANAGEMENT','CRM',
                      'EMAIL MARKETING','DESIGN SOFTWARE','STOCK IMAGES/VIDEO','PC/SOFTWARE'],
    'Hosting & Domains': ['HOSTING/SERVERS','DOMAIN REGISTRATION','CDN/SECURITY','WEBSITE SERVICES'],
    'Business Ops': ['SUB CONTRACTORS','Charges, Fees','ACCOUNTANCY','ADVERTISING','MARKETING',
                     'OFFICE SUPPLIES','POSTAGE','PRINTING','TRAINING','BANK FEES','LEGAL',
                     'Unknown expense','BUSINESS SERVICES','TELEPHONE'],
    'Income': ['Sale','Income','Interests, dividends','Refunds (tax, purchase)','Lending, renting',
               'Gifts','Sale of financial assets','Rental income'],
    'Savings & Investments': ['Savings','Financial investments','Collections','Vehicles, chattels'],
    'Family & Personal': ['FAMILY','DRAWINGS','Charity, gifts','Life events','Kids',
                          'Clothes & shoes','Personal - other','Wellness, beauty'],
    'Groceries & Food': ['Groceries','Restaurant, fast-food','Food & Drinks','Bar, cafe','Takeaway'],
    'Home & Utilities': ['Internet','Maintenance, repairs','Energy, utilities','Home, garden',
                         'Rent','Mortgage','Furniture & Appliances','TV, Streaming','Phone, cell phone',
                         'Property insurance','Water'],
    'Transport': ['MOTOR FUEL','Transportation','Fuel','Vehicle maintenance','Parking',
                  'Public transport','Taxi','Car rental','Vehicle insurance','MOTOR/TRAVEL','Flights'],
    'Amazon': ['AMAZON'],
    'Insurance & Loans': ['Insurances','Loans, interests','Life insurance','Health insurance'],
    'Health': ['Health care, doctor','Medicaments','Pharmacy','Dentist','Eye care'],
    'Pets': ['Pets, animals'],
    'Leisure': ['Life & Entertainment','Holiday, trips, hotels','Culture, sport events','Hobbies',
                'Active sport, fitness','Books, audio, subscriptions','Lottery, gambling',
                'Alcohol, tobacco','Entertainment','TOOLS/EQUIPMENT'],
    'Education': ['Education, development','Books'],
}
CAT2GROUP = {}
for g, cats in GROUPS.items():
    for c in cats:
        CAT2GROUP[c.lower()] = g

GROUP_COLORS = {
    'AI & Software': '#8B5CF6', 'Hosting & Domains': '#0EA5E9', 'Business Ops': '#64748B',
    'Income': '#22C55E', 'Savings & Investments': '#10B981', 'Family & Personal': '#EC4899',
    'Groceries & Food': '#F59E0B', 'Home & Utilities': '#06B6D4', 'Transport': '#3B82F6',
    'Amazon': '#F97316', 'Insurance & Loans': '#EF4444', 'Health': '#14B8A6',
    'Pets': '#A78BFA', 'Leisure': '#E879F9', 'Education': '#818CF8', 'Other': '#6B7280',
    'Transfers & Savings': '#475569',
}

DOMAIN_MAP = {
    'anthropic':'anthropic.com','replit':'replit.com','brixly':'brixly.co.uk','enix':'brixly.co.uk',
    'netlify':'netlify.com','openrouter':'openrouter.ai','abacus':'abacus.ai','eir ':'eir.ie',
    'gomo':'gomo.ie','enterprise rent':'enterprise.com','20i':'20i.com','porkbun':'porkbun.com',
    'godaddy':'godaddy.com','namecheap':'namecheap.com','cloudflare':'cloudflare.com',
    'digitalocean':'digitalocean.com','hetzner':'hetzner.com','ovh':'ovhcloud.com',
    'microsoft':'microsoft.com','google':'google.com','apple':'apple.com','amazon':'amazon.com',
    'amzn':'amazon.com','aws':'aws.amazon.com','stripe':'stripe.com','paypal':'paypal.com',
    'wise':'wise.com','revolut':'revolut.com','adobe':'adobe.com','canva':'canva.com',
    'figma':'figma.com','github':'github.com','gitlab':'gitlab.com','openai':'openai.com',
    'midjourney':'midjourney.com','elevenlabs':'elevenlabs.io','zoho':'zoho.com',
    'mailchimp':'mailchimp.com','sendgrid':'sendgrid.com','twilio':'twilio.com',
    'shopify':'shopify.com','wordpress':'wordpress.com','elementor':'elementor.com',
    'envato':'envato.com','appsumo':'appsumo.com','paddle':'paddle.com','gumroad':'gumroad.com',
    'lemon squeezy':'lemonsqueezy.com','aldi':'aldi.ie','lidl':'lidl.ie','tesco':'tesco.ie',
    'dunnes':'dunnesstores.com','supervalu':'supervalu.ie','aviva':'aviva.ie','vhi':'vhi.ie',
    'electric ireland':'electricireland.ie','bord gais':'bordgaisenergy.ie','vodafone':'vodafone.ie',
    'three':'three.ie','sky ':'sky.com','netflix':'netflix.com','spotify':'spotify.com',
    'youtube':'youtube.com','disney':'disneyplus.com','audible':'audible.com','kindle':'amazon.com',
    'temu':'temu.com','ebay':'ebay.com','etsy':'etsy.com','ikea':'ikea.com','argos':'argos.ie',
    'circle k':'circlek.ie','applegreen':'applegreen.ie','maxol':'maxol.ie','texaco':'texaco.com',
    'ryanair':'ryanair.com','aer lingus':'aerlingus.com','booking':'booking.com','airbnb':'airbnb.com',
    'lorka':'lorka.ai','brizy':'brizy.io','brainstorm':'brizy.io','phantomwp':'phantomwp.com',
    'hostinger':'hostinger.com','siteground':'siteground.com','wpmu':'wpmudev.com','kinsta':'kinsta.com',
    'notion':'notion.so','slack':'slack.com','zoom':'zoom.us','dropbox':'dropbox.com',
    'cursor':'cursor.com','vercel':'vercel.com','supabase':'supabase.com','railway':'railway.app',
    'render':'render.com','fly.io':'fly.io','deepseek':'deepseek.com','perplexity':'perplexity.ai',
    'lovable':'lovable.dev','bolt':'bolt.new','v0':'v0.dev','windsurf':'codeium.com',
    'cfs formations':'cfsformations.com','friends first':'friendsfirst.ie','pocketbase':'pocketbase.io',
}

IBAN_RE = re.compile(r',\s*([A-Z]{2}\d{2}[A-Z0-9]{4,}|\d{8,}).*$', re.I)
CARD_RE = re.compile(r'\s*(CARD-\d+|Card transaction.*)$', re.I)

def clean_payee(name):
    n = IBAN_RE.sub('', name).strip()
    n = CARD_RE.sub('', n).strip()
    n = re.sub(r'\s+', ' ', n)
    return n or name

CHAINS = [
    ('ie81ipbs','ptsb mortgage'),        # bare mortgage IBAN payments
    ('ie43revo','revolut transfer'),
    ('aldi','aldi'),('lidl','lidl'),('tesco','tesco'),('dunnes','dunnes stores'),
    ('supervalu','supervalu'),('circle k','circle k'),('applegreen','applegreen'),
    ('ptsb','ptsb mortgage'),('pstb','ptsb mortgage'),('humm','humm'),
    ('electric ireland','electric ireland'),('thahira banu','thahira banu'),
    ('sean padraig','sean padraig o\'byrne'),('kaya quinlan','kaya quinlan o\'byrne'),
    ('bord gais','bord gais'),('vodafone','vodafone'),('an post','an post'),
    ('revenue','revenue commissioners'),('aviva','aviva'),('wise','wise'),
    ('mcdonald','mcdonalds'),('supermac','supermacs'),('boots','boots'),
    ('centra','centra'),('spar ','spar'),('costa','costa coffee'),
    ('starbucks','starbucks'),('penneys','penneys'),('ikea','ikea'),
    ('woodie','woodies'),('screwfix','screwfix'),('harvey norman','harvey norman'),
    ('currys','currys'),('halfords','halfords'),('smyths','smyths toys'),
]

def norm_payee(name):
    n = IBAN_RE.sub('', name.lower()).strip()
    for pre, canon in CHAINS:
        if n.startswith(pre): return canon
    if re.match(r'^[a-z]{2}\d{2}[a-z0-9]{8,}$', n.replace(' ', '')):
        return 'bank transfer (iban)'
    # Vendor grouping heuristics
    if '20i' in n: return '20i'
    if n.startswith('aa ') or n.startswith('the aa') or n.startswith('aa,'): return 'the aa'
    if n.startswith('amzn') or n.startswith('amazon'): return 'amazon'
    if 'paddle.net' in n or n.startswith('paddle'):
        m = re.search(r'paddle\.net\*\s*(\w+)', n)
        return 'paddle ' + m.group(1) if m else 'paddle'
    if 'enix' in n or 'brixly' in n: return 'brixly'
    if n.startswith('anthropic'): return 'anthropic'
    if n.startswith('replit'): return 'replit'
    if n.startswith('google'): return 'google'
    if n.startswith('microsoft') or n.startswith('msft'): return 'microsoft'
    if n.startswith('enterprise rent'): return 'enterprise rent-a-car'
    if n.startswith('stripe'): return 'stripe'
    if 'temu' in n: return 'temu'
    n = re.sub(r'\*\S*', '', n)          # strip *ref codes
    n = re.sub(r'[^a-z0-9 &.\-]', ' ', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n[:40]

DISPLAY = {
    'amazon':'Amazon','anthropic':'Anthropic (Claude)','replit':'Replit','brixly':'Brixly (Enix)',
    'enterprise rent-a-car':'Enterprise Rent-A-Car','stripe':'Stripe','microsoft':'Microsoft',
    'google':'Google','temu':'Temu','bank transfer (iban)':'Bank Transfer (IBAN)',
    'ptsb mortgage':'PTSB Mortgage','aldi':'Aldi','humm':'Humm Flexi-Fi',
    'electric ireland':'Electric Ireland','thahira banu':'Thahira Banu',
    'revolut transfer':'Revolut Transfer',
    '20i':'20i (Hosting)','the aa':'The AA',
}

def display_name(norm, raw):
    if norm in DISPLAY: return DISPLAY[norm]
    return clean_payee(raw)

def find_domain(norm):
    for k, v in DOMAIN_MAP.items():
        if k in norm: return v
    return None

# ── Parse ────────────────────────────────────────────────────────────────────
# ── Internal-transfer detection ──────────────────────────────────────────────
# Money moved between your own accounts / into savings / crypto conversions is
# NOT consumption — it inflates spend if counted. Tag as type 'x' (transfer) so
# it is excluded from burn, running costs and expense totals.
TRANSFER_NAME = re.compile(
    r'exchanged to|savings vault|transferwise|money transfer|withdrawal|'
    r'^wise( -|$)|wise - personal|revolut transfer|bank transfer|top-?up|'
    r'transfer to|transfer from|own account|to savings|xau|to btc', re.I)
TRANSFER_CATS = {'savings', 'financial investments'}  # moved to your own reserves

def classify(norm, raw, cat, base_type):
    if base_type == 'i':
        return 'i'
    if cat.lower() in TRANSFER_CATS:
        return 'x'
    if TRANSFER_NAME.search(norm) or TRANSFER_NAME.search(raw):
        return 'x'
    return 'e'

rows = list(csv.DictReader(open(CSV)))
txs = []
for r in rows:
    try: amt = float(r['amount'])
    except: continue
    date = r['payment_date']
    if not date: continue
    base = 'i' if r['item_type'] == 'revenue' else 'e'
    cat = r['category'] or 'Other'
    grp = CAT2GROUP.get(cat.lower(), 'Income' if base == 'i' else 'Other')
    raw = r['name']
    norm = norm_payee(raw)
    typ = classify(norm, raw, cat, base)
    if typ == 'x':
        grp = 'Transfers & Savings'
    txs.append({'d': date, 'raw': raw, 'norm': norm, 'a': round(amt, 2), 't': typ,
                'c': cat, 'g': grp, 'r': r['is_recurring'] == 'true'})

txs.sort(key=lambda x: x['d'], reverse=True)

# ── Vendor registry ──────────────────────────────────────────────────────────
vendors = {}
for t in txs:
    key = t['norm']
    if key not in vendors:
        vendors[key] = {'norm': key, 'raws': defaultdict(int), 'count': 0, 'total': 0.0,
                        'first': t['d'], 'last': t['d'], 'recurCt': 0, 'grps': defaultdict(float),
                        'cats': defaultdict(float), 'type': t['t'], 'months': set()}
    v = vendors[key]
    v['raws'][t['raw']] += 1
    v['count'] += 1
    v['total'] += t['a']
    v['first'] = min(v['first'], t['d'])
    v['last'] = max(v['last'], t['d'])
    if t['r']: v['recurCt'] += 1
    v['grps'][t['g']] += t['a']
    v['cats'][t['c']] += t['a']
    v['months'].add(t['d'][:7])
    # Vendor type precedence: income > transfer > expense
    if t['t'] == 'i': v['type'] = 'i'
    elif t['t'] == 'x' and v['type'] != 'i': v['type'] = 'x'

def months_between(a, b):
    ay, am = int(a[:4]), int(a[5:7]); by, bm = int(b[:4]), int(b[5:7])
    return (by - ay) * 12 + (bm - am) + 1

vendor_list = []
for key, v in vendors.items():
    raw_top = max(v['raws'], key=v['raws'].get)
    span = months_between(v['first'], v['last'])
    grp = max(v['grps'], key=v['grps'].get)
    cat = max(v['cats'], key=v['cats'].get)
    vendor_list.append({
        'id': re.sub(r'[^a-z0-9]+', '_', key)[:28].strip('_') or 'v',
        'name': display_name(key, raw_top), 'norm': key,
        'count': v['count'], 'total': round(v['total'], 2),
        'first': v['first'], 'last': v['last'],
        'spanMonths': span, 'activeMonths': len(v['months']),
        'avgMonthly': round(v['total'] / span, 2),
        'recurring': v['recurCt'] > 0, 'recurCt': v['recurCt'],
        'group': grp, 'category': cat, 'type': v['type'],
        'domain': find_domain(key),
    })

# Dedupe vendor ids
seen = {}
for v in vendor_list:
    if v['id'] in seen:
        seen[v['id']] += 1
        v['id'] = f"{v['id']}_{seen[v['id']]}"
    else:
        seen[v['id']] = 0
vid = {v['norm']: i for i, v in enumerate(vendor_list)}

# ── Compact transactions: [dateStr, vendorIdx, amount, catIdx, type, recurring, rawIdx]
cats_list = sorted(set(t['c'] for t in txs))
cidx = {c: i for i, c in enumerate(cats_list)}
raw_names = []
raw_idx = {}
def rid(raw):
    r = clean_payee(raw)[:60]
    if r not in raw_idx:
        raw_idx[r] = len(raw_names)
        raw_names.append(r)
    return raw_idx[r]
tx_compact = [[t['d'], vid[t['norm']], t['a'], cidx[t['c']], t['t'], 1 if t['r'] else 0, rid(t['raw'])]
              for t in txs]

# Category meta
cat_meta = [{'name': c, 'group': CAT2GROUP.get(c.lower(), 'Other'),
             'color': GROUP_COLORS.get(CAT2GROUP.get(c.lower(), 'Other'), '#6B7280')}
            for c in cats_list]

group_meta = [{'name': g, 'color': c} for g, c in GROUP_COLORS.items()]

# ── AppSumo lifetime deals (Subly export, 16 Jul 2026) ───────────────────────
# Two sections in one file:
#   1. Structured redemption rows (2020-2026): name / initialPaymentDate / cost
#   2. Invoice history tail (2019-2020): actual amounts charged, incl. refunds.
# Combined they give the true spend (~$15.8k) vs the old inflated $30k dump.
APPSUMO_CSV = '/root/.claude/uploads/b079a466-7434-53d3-8f62-638a5f604b40/d5b05921-subly_export_16_07_202622222.csv'
appsumo = []
try:
    raw_lines = open(APPSUMO_CSV, encoding='utf-8', errors='replace').read().splitlines()

    # Section 1 — structured redemptions
    for r in csv.DictReader(raw_lines):
        if r.get('data_source') != 'appsumo':
            continue
        ipd = r.get('initialPaymentDate') or ''
        if '/' not in ipd:
            continue
        d, m, y = ipd.split('/')
        try: cost = round(float(r.get('cost') or 0), 2)
        except ValueError: continue
        appsumo.append([f'{y}-{m}-{d}', r['name'], cost])

    # Section 2 — invoice history (messy tail); each invoice = one real payment
    inv_hdr = re.compile(
        r'(\d{2})\.(\d{2})\.(\d{4})Invoice ID:\W*[0-9a-f-]+(PAID|HAS REFUND)'
        r'\$([\d.]+)\s*USD(.*)')
    for ln in raw_lines:
        m = inv_hdr.search(ln)
        if not m:
            continue
        mm, dd, yy, status, amt, rest = m.groups()
        refunded = status == 'HAS REFUND' or 'REFUND' in rest.upper()
        if refunded:
            continue  # net spend excludes refunds
        prod = re.sub(r'\W*-\s*(PAID|REFUNDED).*$', '', rest).strip().lstrip('�').strip()
        prod = prod or 'AppSumo purchase'
        appsumo.append([f'{yy}-{mm}-{dd}', prod, round(float(amt), 2)])

    appsumo.sort(key=lambda x: x[0], reverse=True)
except FileNotFoundError:
    pass

out = {
    'meta': {'generated': '2026-07-16', 'source': 'BudgetBakers export (Jun 2023 – Jul 2026)',
             'txCount': len(tx_compact), 'vendorCount': len(vendor_list)},
    'vendors': vendor_list,
    'cats': cat_meta,
    'groups': group_meta,
    'tx': tx_compact,
    'raws': raw_names,
    'appsumo': appsumo,
}

with open('/tmp/spendly2_data.json', 'w') as f:
    json.dump(out, f, separators=(',', ':'))

import os
size = os.path.getsize('/tmp/spendly2_data.json')
print(f"tx: {len(tx_compact)}  vendors: {len(vendor_list)}  cats: {len(cats_list)}")
print(f"size: {size//1024}KB")
print("\nTop 15 expense vendors by avg monthly (running cost):")
exp = sorted([v for v in vendor_list if v['type'] == 'e' and v['count'] >= 3],
             key=lambda x: -x['avgMonthly'])
for v in exp[:15]:
    print(f"  €{v['avgMonthly']:>8.2f}/mo  {v['name'][:36]:<38} {v['count']:>4}× total €{v['total']:>10.2f}  [{v['group']}]")
print("\nAmazon check:")
am = [v for v in vendor_list if v['norm'] == 'amazon']
if am: print(f"  Amazon: {am[0]['count']} transactions, €{am[0]['total']:.2f} total, €{am[0]['avgMonthly']:.2f}/mo avg")
ent = [v for v in vendor_list if 'enterprise' in v['norm']]
if ent: print(f"  Enterprise: {ent[0]['count']} tx, €{ent[0]['total']:.2f} total, €{ent[0]['avgMonthly']:.2f}/mo")
