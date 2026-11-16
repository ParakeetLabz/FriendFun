// tokens.js — Tokens + prize wheel + pumpkin shop.
// Spend a token to spin the wheel and win a random ability item of that
// rarity. Ability items equip in Gear and grant a real in-game ability.
// The Pumpkin Shop Token is a 1-in-100,000,000 wheel jackpot — it unlocks
// the pumpkin shop for exactly one purchase.
import { CATALOG, ITEM } from './catalog.js?v=3253bf8f';

const RARITY_LABEL = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', superrare: 'Super Rare', king: 'King', galactic: 'Galactic', universal: 'Universal', scout: 'Scout', drpepper: 'Dr. Pepper', skull: 'Skull', pumpkin: 'Pumpkin' };
let lastResult = '';
const ABILITY_LABEL = { speed: '⚡ +50% run speed', doublejump: '☁️ Double jump', magnet: '🧲 Coins fly to you', shield: '🛡️ Block kill parts', fly: '🪽 Hold Space to glide', star: '🌟 Speed + coin magnet', universal: '🌠 Speed + double jump + magnet', tornado: '🌪️ Tornado dash (Q) + speed' };

export async function tokensPage(D) {
  const { api, mount, esc, toast } = D;
  const me = D.me;
  let info;
  try { info = await api('GET', '/api/tokens/info'); } catch (e) { mount('tokens', `<h1>🪙 Tokens</h1><p class="muted">Could not load the wheel. ${esc(e.message || '')}</p>`); return; }
  const owned = new Set(me.inventory || []);
  const countOf = id => (me.inventory || []).filter(x => x === id).length;
  const tokenOf = r => info.tokens.find(t => t.rarity === r);

  const abilityItems = CATALOG.filter(i => i.ability);
  const ownedAbilities = abilityItems.filter(i => owned.has(i.id));
  const hasPumpkin = owned.has('token_pumpkin');

  mount('tokens', `
    <h1>🪙 Tokens</h1>
    <p class="muted">Spend a token to spin the prize wheel. Every spin wins an avatar item — and every one grants a real ability in games when you equip it in Gear. Your FunTix: <b>${esc(String(me.funtix ?? 0))}</b></p>
    <div class="token-wheel-wrap">
      <div class="token-wheel" id="tokenWheel"><div class="token-wheel-pointer">▼</div><div class="token-wheel-face">🎡</div></div>
      <div class="token-wheel-result" id="tokenResult">${lastResult || 'Pick a token below, then spin!'}</div>
    </div>
    <h2>Your tokens</h2>
    <div class="item-grid">${info.tokens.map(t => {
      const it = ITEM[t.id];
      const n = countOf(t.id);
      const prizes = info.prizes[t.rarity] || [];
      const prizeLine = t.rarity === 'skull' ? (info.skullNote || 'Mystery roll — any item!') : prizes.map(p => p.emoji).join(' ');
      return `<div class="item token-card">
        <span class="pet-emoji-big token-anim">${it?.emoji || '🪙'}</span>
        <b>${esc(it?.name || t.id)}</b>
        <span class="muted small">${RARITY_LABEL[t.rarity] || t.rarity} · You have <b>${n}</b></span>
        <span class="muted small">${prizeLine}</span>
        <button class="btn-primary token-spin" data-token="${t.id}" ${n < 1 ? 'disabled' : ''}>🎡 Spin (${n})</button>
        <span class="muted small">Granted by admins only</span>
      </div>`;
    }).join('')}</div>
    <h2>Ability items you own</h2>
    ${ownedAbilities.length ? `<div class="item-grid">${ownedAbilities.map(i => {
      const isEq = me.avatar?.[i.type] === i.id;
      return `<div class="item">
        <span class="pet-emoji-big">${i.emoji || '✨'}</span>
        <b>${esc(i.name)}</b>
        <span class="muted small">${RARITY_LABEL[i.rarity]} · ${ABILITY_LABEL[i.ability] || i.ability}</span>
        ${isEq ? '<button class="btn-owned" disabled>Equipped ✓</button>' : `<button class="btn-secondary token-equip" data-id="${i.id}">Equip</button>`}
      </div>`;
    }).join('')}</div>` : '<p class="muted">No ability items yet — spin the wheel to win one!</p>'}
    <h2>🎃 Pumpkin Shop ${hasPumpkin ? '<span class="muted small">— unlocked! One purchase per token.</span>' : '<span class="muted small">— locked. Needs a Pumpkin Shop Token (1-in-100,000,000 wheel jackpot).</span>'}</h2>
    ${hasPumpkin ? `<div class="item-grid">${info.pumpkin.map(p => {
      const has = owned.has(p.id);
      return `<div class="item">
        <span class="pet-emoji-big">${p.emoji || '🎃'}</span>
        <b>${esc(p.name)}</b>
        <span class="muted small">${has ? 'Owned' : '1 🎃 Pumpkin Shop Token'}</span>
        ${has ? '<button class="btn-owned" disabled>Owned</button>' : `<button class="btn-primary pumpkin-buy" data-id="${p.id}">Buy with 🎃 token</button>`}
      </div>`;
    }).join('')}</div>` : '<p class="muted">The pumpkin shop only opens for the lucky few who hit the jackpot. Every wheel spin has a 0.000001% chance to drop a Pumpkin Shop Token.</p>'}
  `, () => {
    const refresh = () => tokensPage(D);
    const wheel = app.querySelector('#tokenWheel');
    const result = app.querySelector('#tokenResult');
    app.querySelectorAll('.token-spin').forEach(b => b.onclick = async () => {
      b.disabled = true;
      result.textContent = 'Spinning…';
      wheel.classList.remove('spinning'); void wheel.offsetWidth; wheel.classList.add('spinning');
      try {
        const r = await api('POST', '/api/tokens/spin', { token: b.dataset.token });
        me.inventory = r.inventory;
        const item = ITEM[r.item];
        setTimeout(() => {
          wheel.classList.remove('spinning');
          lastResult = `🎉 You won <b>${esc(item?.name || r.item)}</b> ${item?.emoji || ''} — ${esc(ABILITY_LABEL[item?.ability] || '')}${r.jackpot ? '<br>🎃 <b>JACKPOT!</b> You also won a <b>Pumpkin Shop Token</b> (1 in 100,000,000)!' : ''}`;
          result.innerHTML = lastResult;
          toast(`You won ${item?.name || r.item}! Equip it in Gear for its ability.`);
          refresh();
        }, 1400);
      } catch (e) { wheel.classList.remove('spinning'); result.textContent = ''; toast(e.message || 'Spin failed', true); b.disabled = false; }
    });
    app.querySelectorAll('.token-buy').forEach(b => b.onclick = async () => {
      try {
        const r = await api('POST', '/api/tokens/buy', { token: b.dataset.token });
        me.inventory = r.inventory; if (typeof r.funtix === 'number') me.funtix = r.funtix;
        toast('Token bought! Spin the wheel.');
        refresh();
      } catch (e) { toast(e.message || 'Could not buy token', true); }
    });
    app.querySelectorAll('.token-equip').forEach(b => b.onclick = async () => {
      try {
        const it = ITEM[b.dataset.id];
        const slot = it?.type || 'gear';
        me.avatar = await api('PUT', '/api/me/avatar', { ...me.avatar, [slot]: b.dataset.id });
        toast('Ability equipped! It works in games now.');
        refresh();
      } catch (e) { toast(e.message || 'Could not equip', true); }
    });
    app.querySelectorAll('.pumpkin-buy').forEach(b => b.onclick = async () => {
      try {
        const r = await api('POST', '/api/tokens/pumpkin-buy', { item: b.dataset.id });
        me.inventory = r.inventory;
        toast('Pumpkin item bought! Your token is spent — one purchase per token.');
        refresh();
      } catch (e) { toast(e.message || 'Could not buy', true); }
    });
  });
}
