// pets.js — Pets: adopt a pet, equip it, and it follows you.
// Pets already live in the catalog and follow you in 3D games; this page
// makes them a first-class feature, and the lobby now shows your pet too.
import { CATALOG } from './catalog.js?v=843f2486';

export async function petsPage(D) {
  const { api, mount, esc, toast } = D;
  const me = D.me;
  const pets = CATALOG.filter(i => i.type === 'pet');
  const owned = new Set(me.inventory || []);
  const equipped = me.avatar?.pet || 'pet_none';
  mount('pets', `
    <h1>🐾 Pets</h1>
    <p class="muted">Adopt a pet and it follows you — in the lobby and in games. Buy one with FunTix, then tap Equip.</p>
    <div class="item-grid">${pets.map(p => {
      const has = owned.has(p.id);
      const isEq = equipped === p.id;
      return `<div class="item pet-card">
        <span class="pet-emoji-big">${p.emoji || '🐾'}</span>
        <b>${esc(p.name)}</b>
        <span class="muted small">${has ? (isEq ? 'Equipped ✓' : 'Owned') : p.price + ' FunTix'}</span>
        ${isEq ? '<button class="btn-owned" disabled>Equipped</button>'
          : has ? `<button class="btn-secondary pet-equip" data-id="${p.id}">Equip</button>`
          : `<button class="btn-buy pet-buy" data-id="${p.id}">Buy</button>`}
      </div>`;
    }).join('')}</div>`, () => {
    const refresh = () => petsPage(D);
    app.querySelectorAll('.pet-equip').forEach(b => b.onclick = async () => {
      try {
        me.avatar = await api('PUT', '/api/me/avatar', { ...me.avatar, pet: b.dataset.id });
        toast('Pet equipped! Check the lobby — it follows you now.');
        refresh();
      } catch (e) { toast(e.message || 'Could not equip', true); }
    });
    app.querySelectorAll('.pet-buy').forEach(b => b.onclick = async () => {
      try {
        const r = await api('POST', '/api/buy/' + b.dataset.id);
        me.inventory = r.inventory;
        if (typeof r.funtix === 'number') me.funtix = r.funtix;
        toast('You adopted a pet! Tap Equip to bring it along.');
        refresh();
      } catch (e) { toast(e.message || 'Could not buy', true); }
    });
  });
}
