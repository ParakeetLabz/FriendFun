// trade.js — Trading: offer your items for a friend's items.
// One-shot offers: pick what you give + what you want, send it, they Accept
// (items swap on the server) or Decline. Max 4 items per side.
import { ITEM } from './catalog.js?v=90a4da23';

const MAX_ITEMS = 4;
const tradeable = it => it && !it.free && !it.limited && !String(it.id).endsWith('_none');
const itemChip = (id, sel) => {
  const it = ITEM[id];
  if (!it) return '';
  return `<button class="trade-chip${sel ? ' sel' : ''}" data-item="${id}" title="${it.name}">${it.emoji || '📦'} ${it.name}</button>`;
};

// ---------- compose a trade with a player ----------
export async function tradeWithPage(D, username) {
  const { api, mount, esc, toast } = D;
  const me = D.me;
  let theirItems = [];
  try { const r = await api('GET', '/api/users/' + encodeURIComponent(username) + '/tradeable'); theirItems = r.items || []; }
  catch (e) { toast(e.message || 'Could not load their items', true); }
  const myItems = (me.inventory || []).filter(id => tradeable(ITEM[id]));
  const offer = new Set();
  const want = new Set();
  mount('trade', `
    <h1>Trade with ${esc(username)}</h1>
    <p class="muted">Pick up to ${MAX_ITEMS} items to offer, and up to ${MAX_ITEMS} you want from them. They accept and the items swap — or they decline.</p>
    <div class="trade-cols">
      <section><div class="sec-h"><h2>You offer <span class="muted small">(${offer.size}/${MAX_ITEMS})</span></h2></div>
        <div class="trade-grid trade-offer">${myItems.map(id => itemChip(id, false)).join('') || '<p class="muted">You have no tradeable items. Buy some in the Item Shop first!</p>'}</div></section>
      <section><div class="sec-h"><h2>You want <span class="muted small">(${want.size}/${MAX_ITEMS})</span></h2></div>
        <div class="trade-grid trade-want">${theirItems.map(id => itemChip(id, false)).join('') || `<p class="muted">${esc(username)} has no tradeable items.</p>`}</div></section>
    </div>
    <div class="row" style="margin-top:16px"><button class="btn-primary trade-send">Send Trade Offer</button><a class="btn-secondary" href="#/friends">Cancel</a></div>`, () => {
    const refreshCounts = () => {
      app.querySelectorAll('.sec-h h2 .muted').forEach((el, i) => { el.textContent = `(${i === 0 ? offer.size : want.size}/${MAX_ITEMS})`; });
    };
    app.querySelector('.trade-offer').addEventListener('click', e => {
      const b = e.target.closest('[data-item]');
      if (!b) return;
      const id = b.dataset.item;
      if (offer.has(id)) { offer.delete(id); b.classList.remove('sel'); }
      else if (offer.size < MAX_ITEMS) { offer.add(id); b.classList.add('sel'); }
      refreshCounts();
    });
    app.querySelector('.trade-want').addEventListener('click', e => {
      const b = e.target.closest('[data-item]');
      if (!b) return;
      const id = b.dataset.item;
      if (want.has(id)) { want.delete(id); b.classList.remove('sel'); }
      else if (want.size < MAX_ITEMS) { want.add(id); b.classList.add('sel'); }
      refreshCounts();
    });
    app.querySelector('.trade-send').onclick = async () => {
      if (!offer.size && !want.size) { toast('Pick at least one item', true); return; }
      try {
        await api('POST', '/api/trades', { to: username, offer: [...offer], want: [...want] });
        toast('Trade offer sent to ' + username + '!');
        location.hash = '#/trades';
      } catch (e) { toast(e.message || 'Could not send the trade', true); }
    };
  });
}

// ---------- my trades ----------
export async function tradePage(D) {
  const { api, mount, esc, toast } = D;
  const me = D.me;
  let data;
  try { data = await api('GET', '/api/trades'); }
  catch (e) {
    mount('trade', `<h1>🔄 Trades</h1><p class="muted">${esc(e.message || 'Trading is not set up yet.')}</p><p class="muted">The owner needs to run <b>supabase_trades.sql</b> once in Supabase.</p>`, () => {});
    return;
  }
  const trades = data.trades || [];
  const incoming = trades.filter(t => t.to === me.name && t.status === 'pending');
  const outgoing = trades.filter(t => t.from === me.name && t.status === 'pending');
  const history = trades.filter(t => t.status !== 'pending');
  const itemNames = ids => (ids || []).map(id => { const it = ITEM[id]; return it ? (it.emoji || '📦') + ' ' + it.name : id; }).join(', ') || '—';
  const row = t => {
    const isIn = t.to === me.name;
    const other = isIn ? t.from : t.to;
    return `<div class="trade-row">
      <div><b>${isIn ? 'From' : 'To'} ${esc(other)}</b> <span class="muted small">${new Date(t.created).toLocaleDateString()}</span>
      <div class="small">You ${isIn ? 'get' : 'give'}: ${esc(itemNames(t.offer))}</div>
      <div class="small">You ${isIn ? 'give' : 'get'}: ${esc(itemNames(t.want))}</div></div>
      <div class="row">${t.status === 'pending' ? (isIn
        ? `<button class="btn-primary btn-small" data-accept="${t.id}">Accept</button><button class="btn-secondary btn-small" data-decline="${t.id}">Decline</button>`
        : `<button class="btn-secondary btn-small" data-cancel="${t.id}">Cancel</button>`)
        : `<span class="muted small">${t.status}</span>`}</div>
    </div>`;
  };
  mount('trade', `
    <h1>🔄 Trades</h1>
    <p class="muted">Trade items with friends. Offer up to ${MAX_ITEMS} items for up to ${MAX_ITEMS} of theirs — when they accept, the items swap.</p>
    <section><div class="sec-h"><h2>Incoming (${incoming.length})</h2></div>${incoming.map(row).join('') || '<p class="muted">No incoming trade offers.</p>'}</section>
    <section><div class="sec-h"><h2>Outgoing (${outgoing.length})</h2></div>${outgoing.map(row).join('') || '<p class="muted">No outgoing trade offers. Trade with a friend from their profile or the Friends page!</p>'}</section>
    <section><div class="sec-h"><h2>History</h2></div>${history.map(row).join('') || '<p class="muted">No past trades yet.</p>'}</section>`, () => {
    const act = async (id, verb) => {
      try { await api('POST', '/api/trades/' + id + '/' + verb); toast(verb === 'accept' ? 'Trade accepted — items swapped!' : verb === 'decline' ? 'Trade declined.' : 'Trade cancelled.'); tradePage(D); }
      catch (e) { toast(e.message || 'That did not work', true); }
    };
    app.querySelectorAll('[data-accept]').forEach(b => b.onclick = () => act(b.dataset.accept, 'accept'));
    app.querySelectorAll('[data-decline]').forEach(b => b.onclick = () => act(b.dataset.decline, 'decline'));
    app.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => act(b.dataset.cancel, 'cancel'));
  });
}
