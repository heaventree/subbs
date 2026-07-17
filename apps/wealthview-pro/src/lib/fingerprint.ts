// Fast, deterministic, non-cryptographic hash for transaction dedup — same
// scheme must be used for both the base JSON snapshot and freshly imported
// CSV rows so duplicates are caught across sources. Not security-sensitive:
// this is purely a "have I seen this row before" key (cyrb53 variant).
export function fingerprint(date: string, vendorNorm: string, amountCents: number, category: string, kind: string): string {
  const s = `${date}|${vendorNorm}|${amountCents}|${category}|${kind}`
  let h1 = 0xdeadbeef ^ s.length
  let h2 = 0x41c6ce57 ^ s.length
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')
}
