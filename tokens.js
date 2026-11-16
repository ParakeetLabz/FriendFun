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
// Tokens that can never be bought (granted only).
const NOT_BUYABLE = new Set(['token_pumpkin', 'token_scout', 'token_skull']);

export function createTokens(D) {
  const { app, auth, supabase, key } = D;
  const inv = u => Array.isArray(u.inventory) ? u.inventory : [];

  // Buy a token with FunTix (pumpkin/scout/skull are grant/jackpot-only).
  app.post('/api/tokens/buy', auth, async (req, res) => {
    const tokenId = String(req.body?.token || '').trim();
    const tok = ITEM[tokenId];
    if (!tok || tok.type !== 'token') return res.status(400).json({ error: 'No such token' });
    if (NOT_BUYABLE.has(tokenId)) return res.status(403).json({ error: 'That token cannot be bought — it is granted by admins or won as a jackpot' });
    const price = tok.price || 0;
    if ((Number(req.user.funtix) || 0) < price) return res.status(400).json({ error: 'Not enough FunTix' });
    const updatedInv = [...inv(req.user), tokenId];
    const { data, error } = await supabase.from('users').update({ funtix: (Number(req.user.funtix) || 0) - price, inventory: updatedInv }).eq('name', req.user.name).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, funtix: data.funtix, inventory: data.inventory, token: tokenId });
  });

  // Spin the wheel with a token. Wins a random prize for that token.
  app.post('/api/tokens/spin', auth, async (req, res) => {
    const tokenId = String(req.body?.token || '').trim();
    const tok = ITEM[tokenId];
    if (!tok || tok.type !== 'token') return res.status(400).json({ error: 'No such token' });
    if (tokenId === 'token_pumpkin') return res.status(400).json({ error: 'The Pumpkin Shop Token opens the pumpkin shop — it is not a wheel token' });
    const u = req.user;
    if (!inv(u).includes(tokenId)) return res.status(400).json({ error: 'You do not own that token' });
    if (tokenId === 'token_scout' && key(u.name) !== 'scout') return res.status(403).json({ error: 'The Scout Token is only for @scout' });
    let pool = ABILITY_BY_RARITY[tok.rarity] || [];
    if (tokenId === 'token_skull') pool = MYSTERY_POOL;
    else if (!pool.length) pool = PRIZE_BY_RARITY[tok.rarity] || [];
    if (!pool.length) return res.status(500).json({ error: 'No prizes for that token yet' });
    const itemId = pool[Math.floor(Math.random() * pool.length)];
    // Consume one token, grant the prize. Jackpot: pumpkin token (1 in 100M).
    const next = inv(u).filter((id, i) => !(id === tokenId && i === inv(u).indexOf(tokenId)));
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
    if (!inv(u).includes('token_pumpkin')) return res.status(400).json({ error: 'You need a Pumpkin Shop Token' });
    if (inv(u).includes(itemId)) return res.status(400).json({ error: 'You already own this' });
    const next = inv(u).filter((id, i) => !(id === 'token_pumpkin' && i === inv(u).indexOf('token_pumpkin')));
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
    });
  });
}
