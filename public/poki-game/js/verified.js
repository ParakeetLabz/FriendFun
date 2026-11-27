// Verified accounts — official and notable accounts get a blue ✓ next to their name.
// The owner manages the list from the Owner Panel; the server list is fetched
// on load and merged in. 'funtopia' + 'fun' are always verified as built-in
// defaults, so the checkmark still works if the server list is unreachable.
export const VERIFIED = new Set(['funtopia', 'fun']);
const norm = n => String(n || '').toLowerCase().replace(/^@/, '');

export async function refreshVerified() {
  try {
    const r = await fetch('/api/verified');
    if (!r.ok) return [...VERIFIED];
    const d = await r.json();
    const names = (d.verified || []).map(norm).filter(Boolean);
    if (names.length) { names.forEach(n => VERIFIED.add(n)); }
    return [...VERIFIED];
  } catch { return [...VERIFIED]; }
}
// Load the server list as soon as this module is imported (fire-and-forget);
// renders after it lands see the new names. Failures keep the defaults.
refreshVerified();

export function isVerified(name) {
  if (!name) return false;
  return VERIFIED.has(norm(name));
}
