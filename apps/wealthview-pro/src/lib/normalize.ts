// Vendor/category normalization — ported faithfully from ../../wealthview/prep_data.py,
// the rules already validated against the real 7,540-row export. Keep both in sync;
// this is the single source of truth for anything parsed client-side (CSV import).

export const GROUPS: Record<string, string[]> = {
  'AI & Software': ['AI LICENSES', 'SOFTWARE/LICENSES', 'Software, apps, games', 'MICROSOFT',
    'ACCOUNTING SOFTWARE', 'APPSUMO', 'SECURITY', 'PROJECT MANAGEMENT', 'CRM',
    'EMAIL MARKETING', 'DESIGN SOFTWARE', 'STOCK IMAGES/VIDEO', 'PC/SOFTWARE'],
  'Hosting & Domains': ['HOSTING/SERVERS', 'DOMAIN REGISTRATION', 'CDN/SECURITY', 'WEBSITE SERVICES'],
  'Business Ops': ['SUB CONTRACTORS', 'Charges, Fees', 'ACCOUNTANCY', 'ADVERTISING', 'MARKETING',
    'OFFICE SUPPLIES', 'POSTAGE', 'PRINTING', 'TRAINING', 'BANK FEES', 'LEGAL',
    'Unknown expense', 'BUSINESS SERVICES', 'TELEPHONE'],
  'Income': ['Sale', 'Income', 'Interests, dividends', 'Refunds (tax, purchase)', 'Lending, renting',
    'Gifts', 'Sale of financial assets', 'Rental income'],
  'Savings & Investments': ['Savings', 'Financial investments', 'Collections', 'Vehicles, chattels'],
  'Family & Personal': ['FAMILY', 'DRAWINGS', 'Charity, gifts', 'Life events', 'Kids',
    'Clothes & shoes', 'Personal - other', 'Wellness, beauty'],
  'Groceries & Food': ['Groceries', 'Restaurant, fast-food', 'Food & Drinks', 'Bar, cafe', 'Takeaway'],
  'Home & Utilities': ['Internet', 'Maintenance, repairs', 'Energy, utilities', 'Home, garden',
    'Rent', 'Mortgage', 'Furniture & Appliances', 'TV, Streaming', 'Phone, cell phone',
    'Property insurance', 'Water'],
  'Transport': ['MOTOR FUEL', 'Transportation', 'Fuel', 'Vehicle maintenance', 'Parking',
    'Public transport', 'Taxi', 'Car rental', 'Vehicle insurance', 'MOTOR/TRAVEL', 'Flights'],
  'Amazon': ['AMAZON'],
  'Insurance & Loans': ['Insurances', 'Loans, interests', 'Life insurance', 'Health insurance'],
  'Health': ['Health care, doctor', 'Medicaments', 'Pharmacy', 'Dentist', 'Eye care'],
  'Pets': ['Pets, animals'],
  'Leisure': ['Life & Entertainment', 'Holiday, trips, hotels', 'Culture, sport events', 'Hobbies',
    'Active sport, fitness', 'Books, audio, subscriptions', 'Lottery, gambling',
    'Alcohol, tobacco', 'Entertainment', 'TOOLS/EQUIPMENT'],
  'Education': ['Education, development', 'Books'],
}
export const CAT2GROUP: Record<string, string> = {}
for (const [g, cats] of Object.entries(GROUPS)) for (const c of cats) CAT2GROUP[c.toLowerCase()] = g

export const GROUP_COLORS: Record<string, string> = {
  'AI & Software': '#8B5CF6', 'Hosting & Domains': '#0EA5E9', 'Business Ops': '#64748B',
  'Income': '#22C55E', 'Savings & Investments': '#10B981', 'Family & Personal': '#EC4899',
  'Groceries & Food': '#F59E0B', 'Home & Utilities': '#06B6D4', 'Transport': '#3B82F6',
  'Amazon': '#F97316', 'Insurance & Loans': '#EF4444', 'Health': '#14B8A6',
  'Pets': '#A78BFA', 'Leisure': '#E879F9', 'Education': '#818CF8', 'Other': '#6B7280',
  'Transfers & Savings': '#475569',
}

export const DOMAIN_MAP: [string, string][] = [
  ['anthropic', 'anthropic.com'], ['replit', 'replit.com'], ['brixly', 'brixly.co.uk'], ['enix', 'brixly.co.uk'],
  ['netlify', 'netlify.com'], ['openrouter', 'openrouter.ai'], ['abacus', 'abacus.ai'], ['eir ', 'eir.ie'],
  ['gomo', 'gomo.ie'], ['enterprise rent', 'enterprise.com'], ['20i', '20i.com'], ['porkbun', 'porkbun.com'],
  ['godaddy', 'godaddy.com'], ['namecheap', 'namecheap.com'], ['cloudflare', 'cloudflare.com'],
  ['digitalocean', 'digitalocean.com'], ['hetzner', 'hetzner.com'], ['ovh', 'ovhcloud.com'],
  ['microsoft', 'microsoft.com'], ['google', 'google.com'], ['apple', 'apple.com'], ['amazon', 'amazon.com'],
  ['amzn', 'amazon.com'], ['aws', 'aws.amazon.com'], ['stripe', 'stripe.com'], ['paypal', 'paypal.com'],
  ['wise', 'wise.com'], ['revolut', 'revolut.com'], ['adobe', 'adobe.com'], ['canva', 'canva.com'],
  ['figma', 'figma.com'], ['github', 'github.com'], ['gitlab', 'gitlab.com'], ['openai', 'openai.com'],
  ['midjourney', 'midjourney.com'], ['elevenlabs', 'elevenlabs.io'], ['zoho', 'zoho.com'],
  ['mailchimp', 'mailchimp.com'], ['sendgrid', 'sendgrid.com'], ['twilio', 'twilio.com'],
  ['shopify', 'shopify.com'], ['wordpress', 'wordpress.com'], ['elementor', 'elementor.com'],
  ['envato', 'envato.com'], ['appsumo', 'appsumo.com'], ['paddle', 'paddle.com'], ['gumroad', 'gumroad.com'],
  ['lemon squeezy', 'lemonsqueezy.com'], ['aldi', 'aldi.ie'], ['lidl', 'lidl.ie'], ['tesco', 'tesco.ie'],
  ['dunnes', 'dunnesstores.com'], ['supervalu', 'supervalu.ie'], ['aviva', 'aviva.ie'], ['vhi', 'vhi.ie'],
  ['electric ireland', 'electricireland.ie'], ['bord gais', 'bordgaisenergy.ie'], ['vodafone', 'vodafone.ie'],
  ['three', 'three.ie'], ['sky ', 'sky.com'], ['netflix', 'netflix.com'], ['spotify', 'spotify.com'],
  ['youtube', 'youtube.com'], ['disney', 'disneyplus.com'], ['audible', 'audible.com'], ['kindle', 'amazon.com'],
  ['temu', 'temu.com'], ['ebay', 'ebay.com'], ['etsy', 'etsy.com'], ['ikea', 'ikea.com'], ['argos', 'argos.ie'],
  ['circle k', 'circlek.ie'], ['applegreen', 'applegreen.ie'], ['maxol', 'maxol.ie'], ['texaco', 'texaco.com'],
  ['ryanair', 'ryanair.com'], ['aer lingus', 'aerlingus.com'], ['booking', 'booking.com'], ['airbnb', 'airbnb.com'],
  ['lorka', 'lorka.ai'], ['brizy', 'brizy.io'], ['brainstorm', 'brizy.io'], ['phantomwp', 'phantomwp.com'],
  ['hostinger', 'hostinger.com'], ['siteground', 'siteground.com'], ['wpmu', 'wpmudev.com'], ['kinsta', 'kinsta.com'],
  ['notion', 'notion.so'], ['slack', 'slack.com'], ['zoom', 'zoom.us'], ['dropbox', 'dropbox.com'],
  ['cursor', 'cursor.com'], ['vercel', 'vercel.com'], ['supabase', 'supabase.com'], ['railway', 'railway.app'],
  ['render', 'render.com'], ['fly.io', 'fly.io'], ['deepseek', 'deepseek.com'], ['perplexity', 'perplexity.ai'],
  ['lovable', 'lovable.dev'], ['bolt', 'bolt.new'], ['v0', 'v0.dev'], ['windsurf', 'codeium.com'],
  ['cfs formations', 'cfsformations.com'], ['friends first', 'friendsfirst.ie'], ['pocketbase', 'pocketbase.io'],
]

const IBAN_RE = /,\s*([A-Z]{2}\d{2}[A-Z0-9]{4,}|\d{8,}).*$/i
const CARD_RE = /\s*(CARD-\d+|Card transaction.*)$/i

export function cleanPayee(name: string): string {
  let n = name.replace(IBAN_RE, '').trim()
  n = n.replace(CARD_RE, '').trim()
  n = n.replace(/\s+/g, ' ')
  return n || name
}

const CHAINS: [string, string][] = [
  ['ie81ipbs', 'ptsb mortgage'], ['ie43revo', 'revolut transfer'],
  ['aldi', 'aldi'], ['lidl', 'lidl'], ['tesco', 'tesco'], ['dunnes', 'dunnes stores'],
  ['supervalu', 'supervalu'], ['circle k', 'circle k'], ['applegreen', 'applegreen'],
  ['ptsb', 'ptsb mortgage'], ['pstb', 'ptsb mortgage'], ['humm', 'humm'],
  ['electric ireland', 'electric ireland'], ['thahira banu', 'thahira banu'],
  ["sean padraig", "sean padraig o'byrne"], ["kaya quinlan", "kaya quinlan o'byrne"],
  ['bord gais', 'bord gais'], ['vodafone', 'vodafone'], ['an post', 'an post'],
  ['revenue', 'revenue commissioners'], ['aviva', 'aviva'], ['wise', 'wise'],
  ['mcdonald', 'mcdonalds'], ['supermac', 'supermacs'], ['boots', 'boots'],
  ['centra', 'centra'], ['spar ', 'spar'], ['costa', 'costa coffee'],
  ['starbucks', 'starbucks'], ['penneys', 'penneys'], ['ikea', 'ikea'],
  ['woodie', 'woodies'], ['screwfix', 'screwfix'], ['harvey norman', 'harvey norman'],
  ['currys', 'currys'], ['halfords', 'halfords'], ['smyths', 'smyths toys'],
]

export function normPayee(rawName: string): string {
  let n = rawName.toLowerCase().replace(IBAN_RE, '').trim()
  for (const [pre, canon] of CHAINS) if (n.startsWith(pre)) return canon
  if (/^[a-z]{2}\d{2}[a-z0-9]{8,}$/.test(n.replace(/\s+/g, ''))) return 'bank transfer (iban)'
  if (n.includes('20i')) return '20i'
  if (n.startsWith('aa ') || n.startsWith('the aa') || n.startsWith('aa,')) return 'the aa'
  if (n.startsWith('amzn') || n.startsWith('amazon')) return 'amazon'
  if (n.includes('paddle.net') || n.startsWith('paddle')) {
    const m = n.match(/paddle\.net\*\s*(\w+)/)
    return m ? 'paddle ' + m[1] : 'paddle'
  }
  if (n.includes('enix') || n.includes('brixly')) return 'brixly'
  if (n.startsWith('anthropic')) return 'anthropic'
  if (n.startsWith('replit')) return 'replit'
  if (n.startsWith('google')) return 'google'
  if (n.startsWith('microsoft') || n.startsWith('msft')) return 'microsoft'
  if (n.startsWith('enterprise rent')) return 'enterprise rent-a-car'
  if (n.startsWith('stripe')) return 'stripe'
  if (n.includes('temu')) return 'temu'
  n = n.replace(/\*\S*/g, '')
  n = n.replace(/[^a-z0-9 &.-]/g, ' ')
  n = n.replace(/\s+/g, ' ').trim()
  return n.slice(0, 40)
}

const DISPLAY: Record<string, string> = {
  amazon: 'Amazon', anthropic: 'Anthropic (Claude)', replit: 'Replit', brixly: 'Brixly (Enix)',
  'enterprise rent-a-car': 'Enterprise Rent-A-Car', stripe: 'Stripe', microsoft: 'Microsoft',
  google: 'Google', temu: 'Temu', 'bank transfer (iban)': 'Bank Transfer (IBAN)',
  'ptsb mortgage': 'PTSB Mortgage', aldi: 'Aldi', humm: 'Humm Flexi-Fi',
  'electric ireland': 'Electric Ireland', 'thahira banu': 'Thahira Banu',
  'revolut transfer': 'Revolut Transfer', '20i': '20i (Hosting)', 'the aa': 'The AA',
}

export function displayName(norm: string, raw: string): string {
  return DISPLAY[norm] ?? cleanPayee(raw)
}

export function findDomain(norm: string): string | null {
  for (const [k, v] of DOMAIN_MAP) if (norm.includes(k)) return v
  return null
}

// ── Internal-transfer detection (money moved between own accounts is not spend) ──
const TRANSFER_NAME = /exchanged to|savings vault|transferwise|money transfer|withdrawal|^wise( -|$)|wise - personal|revolut transfer|bank transfer|top-?up|transfer to|transfer from|own account|to savings|xau|to btc/i
const TRANSFER_CATS = new Set(['savings', 'financial investments'])

export type Kind = 'i' | 'e' | 'x'

export function classify(norm: string, raw: string, category: string, baseType: 'i' | 'e'): Kind {
  if (baseType === 'i') return 'i'
  if (TRANSFER_CATS.has(category.toLowerCase())) return 'x'
  if (TRANSFER_NAME.test(norm) || TRANSFER_NAME.test(raw)) return 'x'
  return 'e'
}

export function groupFor(category: string, kind: Kind): string {
  if (kind === 'x') return 'Transfers & Savings'
  return CAT2GROUP[category.toLowerCase()] ?? (kind === 'i' ? 'Income' : 'Other')
}
