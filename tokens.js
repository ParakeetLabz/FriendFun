// 🪙 Tokens + prize wheel + pumpkin shop.
// Tokens unlock a spin on the prize wheel. Each spin wins a random avatar item
// (gear) of that token's rarity — and every ability item grants an in-game
// ability when equipped. The Pumpkin Shop Token is a 1-in-100,000,000 jackpot
// from any spin; it unlocks the pumpkin shop for exactly one purchase.
// Scout Token: only @scout can spin it (Blob Twirly Hat + Austee tornado shirt).
// Skull Token: admin-grant-only; a mystery roll for ANY non-limited item.
import { CATALOG, ITEM } from './public/js/catalog.js';

const RARITIES = ['common', 'uncommon', 'rare', 'superrare', 'king', 'galactic', 'universal'];
const TOKEN_BY_RARITY = {};
for (const it of CATALOG) if (it.type === 'token' && it.rarity) TOKEN_BY_RARITY[it.rarity] = it.id;
const ABILITY_BY_RARITY = {};
for (const it of CATALOG) if (it.ability && it.rarity) (ABILITY_BY_RARITY[it.rarity] ||= []).push(it.id);
// Non-ability prizes keyed by rarity (scout + drpepper tokens).
const PRIZE_BY_RARITY = {};
for (const it of CATALOG) if (it.rarity && !it.ability && it.type !== 'token') (PRIZE_BY_RARITY[it.rarity] ||= []).push(it.id);
const PUMPKIN_ITEMS = CATALOG.filter(it => it.pumpkin).map(it => it.id);
// Mystery roll pool: every normal shop item (no limited, no tokens, no passes).
const MYSTERY_POOL = CATALOG.filter(it => !it.limited && it.type !== 'token' && it.type !== 'pass').map(it => it.id);
// 0.000001% = 1 in 100,000,000
const PUMPKIN_JACKPOT = 1e-8;
// Token drop rates on every game win (each rarity is 10x rarer than the last).
export const TOKEN_DROP_RATES = [
  { rarity: 'common',    chance: 0.01,      label: '1%' },
  { rarity: 'uncommon',  chance: 0.001,     label: '0.1%' },
  { rarity: 'rare',      chance: 0.0001,    label: '0.01%' },
  { rarity: 'superrare', chance: 0.00001,   label: '0.001%' },
  { rarity: 'king',      chance: 0.000001,  label: '0.0001%' },
  { rarity: 'galactic',  chance: 0.0000001, label: '0.00001%' },
  { rarity: 'universal', chance: 0.00000001, label: '0.000001%' },
];
// Roll one win's token drop. Returns the token id or null.
export function rollTokenDrop() {
  const r = Math.random();
  let lo = 0;
  // Rarest first so the tiny chances are checked against the smallest slice.
  for (let i = TOKEN_DROP_RATES.length - 1; i >= 0; i--) {
    const { rarity, chance } = TOKEN_DROP_RATES[i];
    if (r < lo + chance) return TOKEN_BY_RARITY[rarity];
    lo += chance;
  }
  return null;
}
// Tokens that can never be bought (granted only).
const NOT_BUYABLE = new Set(['token_pumpkin', 'token_scout', 'token_skull']);

export function createTokens(D) {
  const { app, auth, supabase, key } = D;
  const inv = u => Array.isArray(u.inventory) ? u.inventory : [];

  // Tokens are never purchasable — they are granted by admins (or won as a jackpot).
  app.post('/api/tokens/buy', auth, async (req, res) => {
    return res.status(403).json({ error: 'Tokens cannot be bought — they are granted by admins' });
  });

  // Spin the wheel with a token. Wins a random prize for that token.
  app.post('/api/tokens/spin', auth, async (req, res) => {
    const tokenId = String(req.body?.token || '').trim();
    const tok = ITEM[tokenId];
    if (!tok || tok.type !== 'token') return res.status(400).json({ error: 'No such token' });
    if (tokenId === 'token_pumpkin') return res.status(400).json({ error: 'The Pumpkin Shop Token opens the pumpkin shop — it is not a wheel token' });
    const u = req.user;
    const infinite = key(u.name) === 'fun';
    if (!infinite && !inv(u).includes(tokenId)) return res.status(400).json({ error: 'You do not own that token' });
    if (tokenId === 'token_scout' && key(u.name) !== 'scout') return res.status(403).json({ error: 'The Scout Token is only for @scout' });
    let pool = ABILITY_BY_RARITY[tok.rarity] || [];
    if (tokenId === 'token_skull') pool = MYSTERY_POOL;
    else if (!pool.length) pool = PRIZE_BY_RARITY[tok.rarity] || [];
    if (!pool.length) return res.status(500).json({ error: 'No prizes for that token yet' });
    const itemId = pool[Math.floor(Math.random() * pool.length)];
    // Consume one token, grant the prize. Jackpot: pumpkin token (1 in 100M).
    // @fun has infinite tokens — spins never consume one.
    const next = infinite ? [...inv(u)] : inv(u).filter((id, i) => !(id === tokenId && i === inv(u).indexOf(tokenId)));
    next.push(itemId);
    let jackpot = false;
    if (tokenId !== 'token_skull' && Math.random() < PUMPKIN_JACKPOT) { next.push('token_pumpkin'); jackpot = true; }
    const { data, error } = await supabase.from('users').update({ inventory: next }).eq('name', u.name).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, item: itemId, jackpot, inventory: data.inventory });
  });

  // Pumpkin shop: spend ONE pumpkin token to buy ONE pumpkin item.
  app.post('/api/tokens/pumpkin-buy', auth, async (req, res) => {
    const itemId = String(req.body?.item || '').trim();
    if (!PUMPKIN_ITEMS.includes(itemId)) return res.status(400).json({ error: 'That item is not in the pumpkin shop' });
    const u = req.user;
    const infinite = key(u.name) === 'fun';
    if (!infinite && !inv(u).includes('token_pumpkin')) return res.status(400).json({ error: 'You need a Pumpkin Shop Token' });
    if (inv(u).includes(itemId)) return res.status(400).json({ error: 'You already own this' });
    const next = infinite ? [...inv(u)] : inv(u).filter((id, i) => !(id === 'token_pumpkin' && i === inv(u).indexOf('token_pumpkin')));
    next.push(itemId);
    const { data, error } = await supabase.from('users').update({ inventory: next }).eq('name', u.name).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, item: itemId, inventory: data.inventory });
  });

  // What the client needs to render the wheel + shops.
  app.get('/api/tokens/info', auth, async (req, res) => {
    const allTokens = ['common', 'uncommon', 'rare', 'superrare', 'king', 'galactic', 'universal', 'scout', 'drpepper', 'skull'];
    const prizeList = r => {
      const ids = r === 'skull' ? [] : [...(ABILITY_BY_RARITY[r] || []), ...(PRIZE_BY_RARITY[r] || [])];
      return ids.map(id => ({ id, name: ITEM[id]?.name, emoji: ITEM[id]?.emoji, ability: ITEM[id]?.ability, color: ITEM[id]?.color }));
    };
    res.json({
      rarities: RARITIES,
      tokens: allTokens.map(r => ({ id: TOKEN_BY_RARITY[r], rarity: r, price: ITEM[TOKEN_BY_RARITY[r]]?.price || 0, buyable: !NOT_BUYABLE.has(TOKEN_BY_RARITY[r]) })),
      prizes: Object.fromEntries(allTokens.map(r => [r, prizeList(r)])),
      pumpkin: PUMPKIN_ITEMS.map(id => ({ id, name: ITEM[id]?.name, emoji: ITEM[id]?.emoji, type: ITEM[id]?.type, color: ITEM[id]?.color })),
      pumpkinChance: '0.000001%',
      skullNote: 'Mystery roll — any item in FunTopia!',
      dropRates: TOKEN_DROP_RATES.map(({ rarity, label }) => ({ id: TOKEN_BY_RARITY[rarity], rarity, label })),
    });
  });
}
