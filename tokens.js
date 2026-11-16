// 🪙 Tokens + prize wheel + pumpkin shop.
// Tokens unlock a spin on the prize wheel. Each spin wins a random avatar item
// (gear) of that token's rarity — and every ability item grants an in-game
// ability when equipped. The Pumpkin Shop Token is a 1-in-100,000,000 jackpot
// from any spin; it unlocks the pumpkin shop for exactly one purchase.
import { CATALOG, ITEM } from './public/js/catalog.js';

const RARITIES = ['common', 'uncommon', 'rare', 'superrare', 'king', 'galactic', 'universal'];
const TOKEN_BY_RARITY = {};
for (const it of CATALOG) if (it.type === 'token' && it.rarity) TOKEN_BY_RARITY[it.rarity] = it.id;
const ABILITY_BY_RARITY = {};
for (const it of CATALOG) if (it.ability && it.rarity) (ABILITY_BY_RARITY[it.rarity] ||= []).push(it.id);
const PUMPKIN_ITEMS = CATALOG.filter(it => it.pumpkin).map(it => it.id);
// 0.000001% = 1 in 100,000,000
const PUMPKIN_JACKPOT = 1e-8;

export function createTokens(D) {
  const { app, auth, supabase, key } = D;
  const inv = u => Array.isArray(u.inventory) ? u.inventory : [];

  // Buy a token with FunTix (pumpkin token is jackpot-only, never buyable).
  app.post('/api/tokens/buy', auth, async (req, res) => {
    const tokenId = String(req.body?.token || '').trim();
    const tok = ITEM[tokenId];
    if (!tok || tok.type !== 'token') return res.status(400).json({ error: 'No such token' });
    if (tokenId === 'token_pumpkin') return res.status(403).json({ error: 'The Pumpkin Shop Token cannot be bought — it is a 1-in-100,000,000 wheel jackpot' });
    const price = tok.price || 0;
    if ((Number(req.user.funtix) || 0) < price) return res.status(400).json({ error: 'Not enough FunTix' });
    const updatedInv = [...inv(req.user), tokenId];
    const { data, error } = await supabase.from('users').update({ funtix: (Number(req.user.funtix) || 0) - price, inventory: updatedInv }).eq('name', req.user.name).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, funtix: data.funtix, inventory: data.inventory, token: tokenId });
  });

  // Spin the wheel with a token. Wins a random ability item of that rarity.
  app.post('/api/tokens/spin', auth, async (req, res) => {
    const tokenId = String(req.body?.token || '').trim();
    const tok = ITEM[tokenId];
    if (!tok || tok.type !== 'token') return res.status(400).json({ error: 'No such token' });
    if (tokenId === 'token_pumpkin') return res.status(400).json({ error: 'The Pumpkin Shop Token opens the pumpkin shop — it is not a wheel token' });
    const u = req.user;
    if (!inv(u).includes(tokenId)) return res.status(400).json({ error: 'You do not own that token' });
    const pool = ABILITY_BY_RARITY[tok.rarity] || [];
    if (!pool.length) return res.status(500).json({ error: 'No prizes for that rarity yet' });
    const itemId = pool[Math.floor(Math.random() * pool.length)];
    // Consume one token, grant the prize. Jackpot: pumpkin token (1 in 100M).
    const next = inv(u).filter((id, i) => !(id === tokenId && i === inv(u).indexOf(tokenId)));
    next.push(itemId);
    let jackpot = false;
    if (Math.random() < PUMPKIN_JACKPOT) { next.push('token_pumpkin'); jackpot = true; }
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
    res.json({
      rarities: RARITIES,
      tokens: RARITIES.map(r => ({ id: TOKEN_BY_RARITY[r], rarity: r, price: ITEM[TOKEN_BY_RARITY[r]]?.price || 0 })),
      prizes: Object.fromEntries(RARITIES.map(r => [r, (ABILITY_BY_RARITY[r] || []).map(id => ({ id, name: ITEM[id]?.name, emoji: ITEM[id]?.emoji, ability: ITEM[id]?.ability, color: ITEM[id]?.color })) ])),
      pumpkin: PUMPKIN_ITEMS.map(id => ({ id, name: ITEM[id]?.name, emoji: ITEM[id]?.emoji, type: ITEM[id]?.type, color: ITEM[id]?.color })),
      pumpkinChance: '0.000001%',
    });
  });
}
