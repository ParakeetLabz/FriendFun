// 🔄 Trading: offer your items for a friend's items. One-shot offers —
// you pick what you give and what you want, they Accept (items swap) or
// Decline. Wired into server.js via createTrade({ app, auth, supabase, notify, key }).
// Needs supabase_trades.sql (trades table) run once; until then every route
// answers with a clear "run the SQL" message.
import crypto from 'crypto';
import { ITEM } from './public/js/catalog.js';

const MAX_ITEMS = 4;

export function createTrade(D) {
  const { app, auth, supabase, notify, key } = D;
  const norm = n => String(n || '').trim().toLowerCase();

  // Re-checked on every request (not sticky) so trading turns on the moment
  // the SQL runs — no restart needed.
  const tableOk = async () => {
    const { error } = await supabase.from('trades').select('id').limit(1);
    return !error;
  };
  const needTable = async res => {
    if (await tableOk()) return true;
    res.status(500).json({ error: 'Trading is not set up yet — run supabase_trades.sql in Supabase.' });
    return false;
  };

  // Only real, owned, non-free, non-limited catalog items can be traded.
  // (No trading the "No Hat" freebies, and no trading limited one-offs like
  // the Neon Party Hat or the Dr. Pepper theme.)
  const tradeable = it => it && !it.free && !it.limited && !String(it.id).endsWith('_none');
  const cleanItems = (ids, inv) => {
    const out = [];
    for (const id of Array.isArray(ids) ? ids : []) {
      const s = String(id || '').slice(0, 40);
      if (!s || out.includes(s)) continue;
      if (!inv.includes(s)) continue;
      if (!tradeable(ITEM[s])) continue;
      out.push(s);
    }
    return out.slice(0, MAX_ITEMS);
  };
  const pubTrade = t => ({
    id: t.id, from: t.from_user, to: t.to_user,
    offer: t.offer || [], want: t.want || [],
    status: t.status, created: t.created,
  });

  // Tradeable items of any player (only buyable, non-limited items — the
  // only ones a trade can ask for). Used by the trade composer.
  app.get('/api/users/:name/tradeable', auth, async (req, res) => {
    const { data: u } = await supabase.from('users').select('inventory').eq('name', norm(req.params.name)).single();
    if (!u) return res.status(404).json({ error: 'Player not found' });
    const inv = Array.isArray(u.inventory) ? u.inventory : [];
    res.json({ items: inv.filter(id => tradeable(ITEM[id])) });
  });

  // My trades (incoming + outgoing), newest first.
  app.get('/api/trades', auth, async (req, res) => {
    if (!await needTable(res)) return;
    const me = key(req.user.name);
    const { data, error } = await supabase.from('trades')
      .select('*').or(`from_user.eq.${me},to_user.eq.${me}`)
      .order('created', { ascending: false }).limit(50);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ trades: (data || []).map(pubTrade), table: true });
  });

  // One trade.
  app.get('/api/trades/:id', auth, async (req, res) => {
    if (!await needTable(res)) return;
    const { data: t, error } = await supabase.from('trades').select('*').eq('id', req.params.id).single();
    if (error || !t) return res.status(404).json({ error: 'Trade not found' });
    const me = key(req.user.name);
    if (key(t.from_user) !== me && key(t.to_user) !== me) return res.status(403).json({ error: 'Not your trade' });
    res.json(pubTrade(t));
  });

  // Send a trade offer.
  app.post('/api/trades', auth, async (req, res) => {
    if (!await needTable(res)) return;
    const to = norm(req.body?.to);
    const me = key(req.user.name);
    if (!to || to === me) return res.status(400).json({ error: 'Pick someone to trade with' });
    const { data: other } = await supabase.from('users').select('name, inventory').eq('name', to).single();
    if (!other) return res.status(404).json({ error: 'Player not found' });
    const myInv = Array.isArray(req.user.inventory) ? req.user.inventory : [];
    const theirInv = Array.isArray(other.inventory) ? other.inventory : [];
    const offer = cleanItems(req.body?.offer, myInv);
    const want = cleanItems(req.body?.want, theirInv);
    if (!offer.length && !want.length) return res.status(400).json({ error: 'Pick at least one item to offer or ask for' });
    // No duplicate pending trade for the same pair + same items.
    const { data: dup } = await supabase.from('trades').select('id')
      .eq('from_user', me).eq('to_user', to).eq('status', 'pending').limit(1);
    if (dup?.length) return res.status(400).json({ error: 'You already have a pending trade with them' });
    const id = 'tr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const { data, error } = await supabase.from('trades').insert({
      id, from_user: me, to_user: to, offer, want, status: 'pending', created: Date.now(),
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    notify(to, 'trade', `${req.user.name} sent you a trade offer! 🔄`, '#/trades');
    res.json(pubTrade(data));
  });

  // Accept a trade (recipient only) — re-validates ownership, then swaps.
  app.post('/api/trades/:id/accept', auth, async (req, res) => {
    if (!await needTable(res)) return;
    const me = key(req.user.name);
    const { data: t, error } = await supabase.from('trades').select('*').eq('id', req.params.id).single();
    if (error || !t) return res.status(404).json({ error: 'Trade not found' });
    if (key(t.to_user) !== me) return res.status(403).json({ error: 'Only the recipient can accept' });
    if (t.status !== 'pending') return res.status(400).json({ error: 'This trade is already ' + t.status });
    const { data: fromU } = await supabase.from('users').select('name, inventory').eq('name', key(t.from_user)).single();
    const { data: toU } = await supabase.from('users').select('name, inventory').eq('name', me).single();
    if (!fromU || !toU) return res.status(400).json({ error: 'A player is missing' });
    const fromInv = Array.isArray(fromU.inventory) ? fromU.inventory : [];
    const toInv = Array.isArray(toU.inventory) ? toU.inventory : [];
    const offer = (t.offer || []).filter(id => fromInv.includes(id) && tradeable(ITEM[id]));
    const want = (t.want || []).filter(id => toInv.includes(id) && tradeable(ITEM[id]));
    if (offer.length !== (t.offer || []).length || want.length !== (t.want || []).length) {
      await supabase.from('trades').update({ status: 'failed' }).eq('id', t.id);
      return res.status(400).json({ error: 'Someone no longer owns those items — trade failed' });
    }
    // Swap: I give my "want" items, I receive their "offer" items.
    const newToInv = [...toInv.filter(id => !want.includes(id)), ...offer];
    const newFromInv = [...fromInv.filter(id => !offer.includes(id)), ...want];
    // If anyone currently wears a traded-away item, unequip it to the free default.
    const fixAvatar = (u, lost) => {
      const av = u.avatar || {};
      let changed = false;
      for (const slot of ['hat', 'face', 'shirt', 'head', 'pet', 'gear', 'vehicle']) {
        if (lost.includes(av[slot])) { av[slot] = slot === 'head' ? 'head_classic' : slot + '_none'; changed = true; }
      }
      return changed ? av : null;
    };
    const toAv = fixAvatar(toU, want);
    const fromAv = fixAvatar(fromU, offer);
    await supabase.from('users').update({ inventory: newToInv, ...(toAv ? { avatar: toAv } : {}) }).eq('name', me);
    await supabase.from('users').update({ inventory: newFromInv, ...(fromAv ? { avatar: fromAv } : {}) }).eq('name', key(t.from_user));
    await supabase.from('trades').update({ status: 'accepted' }).eq('id', t.id);
    notify(key(t.from_user), 'trade', `${req.user.name} accepted your trade! 🔄`, '#/trades');
    res.json({ ok: true });
  });

  // Decline (recipient) or cancel (sender) a pending trade.
  app.post('/api/trades/:id/decline', auth, async (req, res) => {
    if (!await needTable(res)) return;
    const me = key(req.user.name);
    const { data: t, error } = await supabase.from('trades').select('*').eq('id', req.params.id).single();
    if (error || !t) return res.status(404).json({ error: 'Trade not found' });
    if (key(t.to_user) !== me) return res.status(403).json({ error: 'Only the recipient can decline' });
    if (t.status !== 'pending') return res.status(400).json({ error: 'This trade is already ' + t.status });
    await supabase.from('trades').update({ status: 'declined' }).eq('id', t.id);
    notify(key(t.from_user), 'trade', `${req.user.name} declined your trade.`, '#/trades');
    res.json({ ok: true });
  });
  app.post('/api/trades/:id/cancel', auth, async (req, res) => {
    if (!await needTable(res)) return;
    const me = key(req.user.name);
    const { data: t, error } = await supabase.from('trades').select('*').eq('id', req.params.id).single();
    if (error || !t) return res.status(404).json({ error: 'Trade not found' });
    if (key(t.from_user) !== me) return res.status(403).json({ error: 'Only the sender can cancel' });
    if (t.status !== 'pending') return res.status(400).json({ error: 'This trade is already ' + t.status });
    await supabase.from('trades').update({ status: 'cancelled' }).eq('id', t.id);
    res.json({ ok: true });
  });
}
