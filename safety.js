// FunTopia Safety (Phase 1) — pure helpers, no I/O.
// Shared by server.js, family.js and the Node unit tests.
// IMPORTANT: FunTopia never collects home addresses from players —
// asking kids for their home address would itself be unsafe. The
// "same address" trusted-friend rule is done through Family membership
// instead (see adultChildBlocked + sameFamily in server.js): a mom in
// the same family as her kid can talk to them; strangers cannot.

// The mild swear list the platform has always filtered (kept as-is).
export const BAD = ['damn', 'hell', 'stupid', 'idiot', 'dumb', 'crap', 'shut up', 'loser'];

// ---------- age ----------
// birthday is a 'YYYY-MM-DD' string. Returns null when unknown/invalid.
export function ageYears(birthday) {
  const s = String(birthday || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + 'T00:00:00Z');
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

// 'adult' (18+), 'child' (under 18), or 'unknown' (no age proof on file).
// Since u151 the on-device face check (Funtopia Check) is the age gate
// at sign-up, so a recorded face result (face_age_group) is authoritative
// and wins over any birthday on file. Accounts made before signup asked
// for a birthday fall back to the birthday rule; with neither, the group
// is 'unknown'. Unknown is treated as a child everywhere it matters —
// the safe default.
export function ageGroupOf(u) {
  if (u?.face_age_group === 'adult') return 'adult';
  if (u?.face_age_group === 'kid') return 'child';
  const a = ageYears(u?.birthday);
  if (a === null) return 'unknown';
  return a >= 18 ? 'adult' : 'child';
}
export function isChildUser(u) { return ageGroupOf(u) !== 'adult'; }
export function isAdultUser(u) { return ageGroupOf(u) === 'adult'; }
// Swearing is unlocked only for adults who ALSO confirmed "I am 18 or older".
export function canSwear(u) { return isAdultUser(u) && !!u?.adult_verified; }

// ---------- chat text filtering ----------
// Links: no links in chat — a message with a link must never render clickable.
const LINK_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.[a-z]{2,}(?:\/[^\s]*)?)/gi;
// Addresses + phone numbers: automatically replaced with hashtags.
const PHONE_RE = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?){2}\d{4}|\b\d{7,}\b/g;
const STREET_RE = /\b\d{1,5}\s+(?:[A-Za-z0-9.'-]+\s+){1,4}?(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|court|ct|place|pl|way|parkway|pkwy|trail|trl|terrace|ter)\b/gi;

const hash = m => '#'.repeat(m.length);
export function maskLinks(t) { return String(t || '').replace(LINK_RE, hash); }
export function maskAddress(t) {
  return String(t || '').replace(PHONE_RE, hash).replace(STREET_RE, hash);
}
export function maskSwears(t) {
  let out = String(t || '');
  for (const w of BAD) out = out.replace(new RegExp('\\b' + w + '\\b', 'gi'), hash);
  return out;
}

// Universal filter: links + addresses, for everyone, everywhere.
// (No swearing here — swearing is per-recipient, see chatFilter.)
export function safetyFilter(text) {
  return maskAddress(maskLinks(String(text || '')));
}

// Per-recipient chat filter: the server filters what EACH recipient sees
// based on THEIR age/verified status, not the sender's. A child sees all
// swearing as hashtags — their own messages and adults' messages. A
// verified adult sees other verified adults' swearing unfiltered. An
// adult who has not verified sees swearing hashtagged too.
export function chatFilter(text, viewer) {
  let t = safetyFilter(text);
  if (!canSwear(viewer)) t = maskSwears(t);
  return t;
}

// ---------- signup validation ----------
export function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
}
export function validBirthday(bd) {
  const s = String(bd || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  if (isNaN(d.getTime()) || d > new Date()) return false;
  const a = ageYears(s);
  return a !== null && a >= 0 && a <= 120;
}

// ---------- adult / child chat ----------
// May `sender` talk to `recipient`? Adults automatically cannot talk to
// children — unless they are trusted friends (same family). Children can
// talk to anyone; adults can talk to adults.
export function adultChildBlocked(sender, recipient, inSameFamily) {
  if (!isAdultUser(sender)) return false;
  if (ageGroupOf(recipient) === 'adult') return false;
  return !inSameFamily;
}
