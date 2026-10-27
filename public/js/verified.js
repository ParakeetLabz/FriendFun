// Verified accounts — official and notable accounts get a blue ✓ next to their name.
// To verify someone, add their lowercase username here and push. The check is
// case-insensitive and ignores a leading @.
export const VERIFIED = new Set(['funtopia', 'fun']);

export function isVerified(name) {
  if (!name) return false;
  return VERIFIED.has(String(name).toLowerCase().replace(/^@/, ''));
}
