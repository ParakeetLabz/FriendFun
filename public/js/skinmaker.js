import { icons } from './icons.js?v=1aa0a4d3';
// 🎨 AI Skin Maker — describe a look, FunAI designs the outfit (client).
// FunAI picks pieces from the Marketplace (POST /api/funai/skin); the page
// previews the full look, buys any pieces you don't own yet, and wears it
// with the same PUT /api/me/avatar the Avatar Editor uses — the server
// still enforces ownership on save, so a look can never grant free items.
// Your shelf lives in this browser, like the FunAI world shelf.
import { ITEM } from './catalog.js?v=56507280';

const SLOTS = [['head', 'Head'], ['face', 'Face'], ['hat', 'Hat'], ['shirt', 'Shirt']];
const COLOR_LABELS = [['head', 'Head'], ['torso', 'Torso'], ['larm', 'Left arm'], ['rarm', 'Right arm'], ['lleg', 'Left leg'], ['rleg', 'Right leg']];

export async function skinmakerPage(D) {
  const { api, mount, esc, toast, avatarImgTag, avatarImage, setMoney } = D;

  const shelf = () => { try { return JSON.parse(localStorage.getItem('funai_skins') || '[]'); } catch { return []; } };
  const saveShelf = g => { try { localStorage.setItem('funai_skins', JSON.stringify(g.slice(0, 24))); } catch { toast('Shelf is full in this browser', true); } };
  const owned = id => !id || id.endsWith('_none') || (D.me.inventory || []).includes(id);
  const priceOf = id => { const it = ITEM[id]; return !it || it.free ? 0 : (it.price || 0); };
  // A generated look only sets the 4 outfit slots + colors; pet/gear/vehicle stay yours.
  const fullAvatar = spec => ({ ...(D.me.avatar || {}), head: spec.head, face: spec.face, hat: spec.hat, shirt: spec.shirt, colors: spec.colors });
  const missing = spec => SLOTS.map(([s]) => spec[s]).filter(id => !owned(id));

  mount('skinmaker', `
    <div class="funai-hero">
      <h1><span class="ic">${icons.palette}</span> AI Skin Maker</h1>
      <p>Describe a look. FunAI designs the outfit from the Marketplace — then wear it, or save it to your shelf.</p>
    </div>
    <section class="funai-panel">
      <textarea class="funai-input skin-input" rows="3" maxlength="600" placeholder="e.g. a vampire knight with a dark cape and glowing eyes"></textarea>
      <div class="funai-chips">
        ${['🧛 Vampire knight', '🤖 Golden robot king', '🧜‍♀️ Ocean mermaid', '🥷 Shadow ninja', '🌈 Rainbow party star', '👑 Royal golden king', '🦖 Dino explorer', '🧊 Ice queen'].map(i => `<button type="button" class="funai-chip">${esc(i)}</button>`).join('')}
      </div>
      <div class="funai-row">
        <button class="btn-primary skin-go"><span class="ic">${icons.palette}</span> Design my look</button>
      </div>
      <p class="funai-status skin-status muted"></p>
    </section>
    <section class="funai-stage skin-stage hidden">
      <div class="funai-stage-head">
        <h2 class="skin-title">Your look</h2>
        <div class="funai-actions">
          <button class="btn-primary skin-wear"><span class="ic">${icons.sparkles}</span> Wear this look</button>
          <button class="btn-secondary skin-save"><span class="ic">${icons.save}</span> Save to shelf</button>
        </div>
      </div>
      <p class="skin-desc muted"></p>
      <div class="skin-preview">
        <div class="skin-preview-img"></div>
        <div class="skin-slots"></div>
      </div>
      <p class="skin-swaps muted small"></p>
      <div class="funai-row funai-remix-row">
        <input class="skin-remix" maxlength="600" placeholder="Tell FunAI a change — e.g. make the hat spookier, swap the shirt for gold">
        <button class="btn-primary skin-remix-btn"><span class="ic">${icons.refresh}</span> Remix</button>
      </div>
    </section>
    <section class="funai-shelf-wrap">
      <h2><span class="ic">${icons.book}</span> My skin shelf</h2>
      <div class="funai-shelf skin-shelf"></div>
    </section>
    <p class="muted small">Looks are designed from Marketplace pieces. Pieces you don't own yet can be bought right here — wearing applies everything you own.</p>`, () => {
    const q = s => document.querySelector(s);
    const input = q('.skin-input'), status = q('.skin-status'), stage = q('.skin-stage');
    let current = null; // { name, description, avatar, swaps }
    let busy = false;

    const show = skin => {
      current = skin;
      stage.classList.remove('hidden');
      q('.skin-title').textContent = skin.name;
      q('.skin-desc').textContent = skin.description || '';
      q('.skin-preview-img').innerHTML = avatarImgTag(fullAvatar(skin.avatar), 'full', 'skin-big');
      const rows = SLOTS.map(([s, label]) => {
        const id = skin.avatar[s], it = ITEM[id];
        const isOwned = owned(id);
        const price = priceOf(id);
        return `<div class="skin-slot"><span><b>${label}</b> — ${esc(it?.name || id)}</span>${isOwned ? '<span class="skin-owned"><span class="ic">' + icons.check + '</span> Owned</span>' : `<button class="btn-secondary skin-buy" data-id="${id}">Buy · ${price} FunTix</button>`}</div>`;
      }).join('');
      const swatches = `<div class="skin-slot"><span><b>Colors</b></span><span class="skin-swatches">${COLOR_LABELS.map(([k, label]) => `<span class="skin-sw" title="${label}" style="background:${esc(skin.avatar.colors?.[k] || '#888')}"></span>`).join('')}</span></div>`;
      q('.skin-slots').innerHTML = rows + swatches;
      const miss = missing(skin.avatar);
      const cost = miss.reduce((sum, id) => sum + priceOf(id), 0);
      q('.skin-wear').textContent = miss.length ? `Buy ${miss.length} missing piece${miss.length > 1 ? 's' : ''} (${cost} FunTix) + wear` : 'Wear this look';
      q('.skin-wear').disabled = busy;
      q('.skin-swaps').textContent = skin.swaps?.length ? 'FunAI swapped ' + skin.swaps.join(', ') + ' for the closest match.' : '';
      q('.skin-slots').querySelectorAll('.skin-buy').forEach(b => b.onclick = async () => {
        if (busy) return;
        busy = true;
        try {
          const r = await api('POST', '/api/buy/' + b.dataset.id);
          D.me.inventory = r.inventory; if (typeof setMoney === 'function') setMoney(r);
          toast(`You bought ${ITEM[b.dataset.id]?.name || b.dataset.id}!`);
          show(current);
        } catch (e) { toast(e.message, true); }
        busy = false;
      });
      stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const wear = async () => {
      if (!current || busy) return;
      busy = true;
      q('.skin-wear').disabled = true;
      try {
        for (const id of missing(current.avatar)) {
          const r = await api('POST', '/api/buy/' + id);
          D.me.inventory = r.inventory; if (typeof setMoney === 'function') setMoney(r);
          toast(`You bought ${ITEM[id]?.name || id}!`);
        }
        const av = fullAvatar(current.avatar);
        D.me.avatar = await api('PUT', '/api/me/avatar', av);
        const tb = document.querySelector('.tb-user img');
        if (tb) tb.src = avatarImage(D.me.avatar);
        toast('You are wearing ' + current.name + '!');
        show(current);
      } catch (e) { toast(e.message, true); show(current); }
      busy = false;
      q('.skin-wear').disabled = false;
    };

    const renderShelf = () => {
      const skins = shelf();
      q('.skin-shelf').innerHTML = skins.length ? skins.map((g, i) => `
        <div class="funai-card skin-card">
          ${avatarImgTag(fullAvatar(g.avatar), 'headshot', 'skin-thumb')}
          <b>${esc(g.name)}</b><span class="muted small">${esc(g.description || '')}</span>
          <div class="funai-actions"><button class="btn-secondary" data-view="${i}"><span class="ic">${icons.eye}</span> View</button><button class="btn-primary" data-wear="${i}"><span class="ic">${icons.sparkles}</span> Wear</button><button class="btn-danger" data-del="${i}">Delete</button></div>
        </div>`).join('') : '<p class="muted">Nothing saved yet. Design a look and hit Save to shelf.</p>';
      q('.skin-shelf').querySelectorAll('[data-view]').forEach(b => b.onclick = () => { const g = shelf()[+b.dataset.view]; if (g) show(g); });
      q('.skin-shelf').querySelectorAll('[data-wear]').forEach(b => b.onclick = async () => { const g = shelf()[+b.dataset.wear]; if (g) { show(g); await wear(); } });
      q('.skin-shelf').querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const g = shelf(); g.splice(+b.dataset.del, 1); saveShelf(g); renderShelf(); });
    };

    const think = on => {
      busy = on;
      q('.skin-go').disabled = on; q('.skin-remix-btn').disabled = on; q('.skin-wear').disabled = on;
      if (on) {
        const msgs = ['FunAI is sketching your look…', 'Matching the pieces…', 'Picking the colors…', 'Almost there…'];
        let i = 0; status.textContent = msgs[0];
        think.timer = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); status.textContent = msgs[i]; }, 4000);
      } else { clearInterval(think.timer); status.textContent = ''; }
    };

    const generate = async (prompt, prev) => {
      if (busy || !prompt) return;
      think(true);
      try {
        const r = await api('POST', '/api/funai/skin', { prompt, ...(prev ? { prev } : {}) });
        show({ name: r.name, description: r.description, avatar: r.avatar, swaps: r.swaps || [] });
        toast('FunAI designed your look!');
      } catch (e) { toast(e.message, true); status.textContent = e.message; }
      think(false);
    };

    q('.skin-go').onclick = () => { const v = input.value.trim(); if (v.length < 3) { toast('Describe your look first!', true); input.focus(); return; } generate(v); };
    q('.skin-remix-btn').onclick = () => { const v = q('.skin-remix').value.trim(); if (!current) return; if (v.length < 3) { toast('Tell FunAI what to change!', true); return; } generate(v, current.avatar); q('.skin-remix').value = ''; };
    q('.skin-remix').onkeydown = e => { if (e.key === 'Enter') q('.skin-remix-btn').click(); };
    document.querySelectorAll('.funai-chip').forEach(c => c.onclick = () => { input.value = c.textContent.replace(/^\S+\s/, ''); input.focus(); });
    q('.skin-wear').onclick = wear;
    q('.skin-save').onclick = () => { if (!current) return; const g = shelf(); g.unshift({ ...current, at: Date.now() }); saveShelf(g); renderShelf(); toast('💾 Saved to your shelf'); };

    renderShelf();
    api('GET', '/api/funai/status').then(s => { if (!s.configured) status.textContent = 'FunAI is not switched on yet — it lights up as soon as Zayd adds the key on Render.'; }).catch(() => {});
    input.focus();
  });
}
