import { icons } from './icons.js?v=1aa0a4d3';
// ✨ FunAI — game maker AI page for Funtopia (client).
// Describe a game -> FunAI designs a Funtopia Studio world -> save it
// as a real experience and open it straight in Funtopia Studio, or
// publish it for everyone. Your shelf lives in this browser.
export async function funaiPage(D) {
  const { api, mount, esc, toast } = D;

  const shelf = () => { try { return JSON.parse(localStorage.getItem('funai_worlds') || '[]'); } catch { return []; } };
  const saveShelf = g => { try { localStorage.setItem('funai_worlds', JSON.stringify(g.slice(0, 24))); } catch { toast('Shelf is full in this browser', true); } };

  mount('funai', `
    <div class="funai-hero">
      <h1><span class="ic">${icons.sparkles}</span> FunAI</h1>
      <p>Describe any game. FunAI builds it as a real Funtopia Studio world — then open it in Studio and make it yours.</p>
    </div>
    <section class="funai-panel">
      <textarea class="funai-input" rows="3" maxlength="600" placeholder="e.g. a lava obby on floating islands with moving platforms and coins"></textarea>
      <div class="funai-chips">
        ${['🧗 Lava obby with moving platforms', '🏰 Cozy castle hangout', '🏝️ Coin rush islands', '👻 Spooky haunted mansion course', '🌈 Rainbow parkour tower', '🏎️ Racetrack in the sky', '🍕 Pizza restaurant hangout', '❄️ Icy slide mountain'].map(i => `<button type="button" class="funai-chip">${esc(i)}</button>`).join('')}
      </div>
      <div class="funai-row">
        <select class="funai-style">
          <option value="">Any style</option><option>Obby</option><option>Hangout</option><option>Parkour</option><option>Spooky</option><option>Cute</option><option>Space</option><option>Race</option>
        </select>
        <button class="btn-primary funai-go"><span class="ic">${icons.sparkles}</span> Build my game</button>
      </div>
      <p class="funai-status muted"></p>
    </section>
    <section class="funai-stage hidden">
      <div class="funai-stage-head">
        <h2 class="funai-title">Your world</h2>
        <div class="funai-actions">
          <button class="btn-primary funai-studio"><span class="ic">${icons.edit}</span> Open in Studio</button>
          <button class="btn-secondary funai-publish"><span class="ic">${icons.globe}</span> Publish &amp; play</button>
          <button class="btn-secondary funai-save"><span class="ic">${icons.save}</span> Save to shelf</button>
          <button class="btn-secondary funai-dl"><span class="ic">${icons.download}</span> World JSON</button>
        </div>
      </div>
      <p class="funai-desc muted"></p>
      <p class="funai-meta muted small"></p>
      <canvas class="funai-map" width="720" height="420"></canvas>
      <p class="muted small">Top-down map of your world — every block FunAI placed, colored like the real thing. The blue square is the spawn.</p>
      <div class="funai-row funai-remix-row">
        <input class="funai-remix" maxlength="600" placeholder="Tell FunAI a change — e.g. add more coins, make it taller, add a castle">
        <button class="btn-primary funai-remix-btn"><span class="ic">${icons.refresh}</span> Remix</button>
      </div>
      <details class="funai-codewrap"><summary>See the world data</summary><pre class="funai-code"></pre></details>
    </section>
    <section class="funai-shelf-wrap">
      <h2><span class="ic">${icons.book}</span> My FunAI shelf</h2>
      <div class="funai-shelf"></div>
    </section>
    <p class="muted">Want a new look to match? <a href="#/skinmaker"><span class="ic">${icons.palette}</span> Try the AI Skin Maker →</a></p>`, () => {
    const q = s => document.querySelector(s);
    const input = q('.funai-input'), status = q('.funai-status'), stage = q('.funai-stage');
    let current = null; // { title, description, world }
    let busy = false;

    const kindCounts = w => {
      const c = {};
      for (const p of w.parts) c[p.k] = (c[p.k] || 0) + 1;
      return Object.entries(c).map(([k, n]) => `${n} ${k}`).join(' · ');
    };

    const drawMap = w => {
      const cv = q('.funai-map'); if (!cv) return;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = w.sky || '#8fc8ff'; ctx.fillRect(0, 0, cv.width, cv.height);
      let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
      for (const p of w.parts) { minX = Math.min(minX, p.p[0] - p.s[0] / 2); maxX = Math.max(maxX, p.p[0] + p.s[0] / 2); minZ = Math.min(minZ, p.p[2] - p.s[2] / 2); maxZ = Math.max(maxZ, p.p[2] + p.s[2] / 2); }
      const pad = 16, sc = Math.min((cv.width - pad * 2) / Math.max(1, maxX - minX), (cv.height - pad * 2) / Math.max(1, maxZ - minZ));
      const ox = pad - minX * sc + (cv.width - pad * 2 - (maxX - minX) * sc) / 2;
      const oz = pad - minZ * sc + (cv.height - pad * 2 - (maxZ - minZ) * sc) / 2;
      // draw low parts first so platforms sit on top of the ground
      for (const p of [...w.parts].sort((a, b) => a.p[1] - b.p[1])) {
        ctx.fillStyle = p.c || '#888';
        ctx.fillRect(ox + (p.p[0] - p.s[0] / 2) * sc, oz + (p.p[2] - p.s[2] / 2) * sc, Math.max(2, p.s[0] * sc), Math.max(2, p.s[2] * sc));
        if (p.k === 'spawn') { ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3; ctx.strokeRect(ox + (p.p[0] - p.s[0] / 2) * sc, oz + (p.p[2] - p.s[2] / 2) * sc, Math.max(2, p.s[0] * sc), Math.max(2, p.s[2] * sc)); }
        if (p.k === 'win') { ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.strokeRect(ox + (p.p[0] - p.s[0] / 2) * sc, oz + (p.p[2] - p.s[2] / 2) * sc, Math.max(2, p.s[0] * sc), Math.max(2, p.s[2] * sc)); }
      }
    };

    const show = g => {
      current = g;
      stage.classList.remove('hidden');
      q('.funai-title').textContent = g.title;
      q('.funai-desc').textContent = g.description || '';
      q('.funai-meta').textContent = g.world.parts.length + ' parts · ' + kindCounts(g.world);
      q('.funai-code').textContent = JSON.stringify(g.world, null, 1).slice(0, 20000);
      drawMap(g.world);
      stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const createGame = async (g, publish) => {
      try {
        const r = await api('POST', '/api/games', { name: g.title, description: g.description, world: g.world, publish });
        toast(publish ? 'Published! Opening your game…' : 'Created! Opening Studio…');
        location.hash = publish ? '#/games/' + r.id : '#/studio/' + r.id;
      } catch (e) { toast(e.message, true); }
    };

    const renderShelf = () => {
      const games = shelf();
      q('.funai-shelf').innerHTML = games.length ? games.map((g, i) => `
        <div class="funai-card">
          <b>${esc(g.title)}</b><span class="muted small">${esc(g.description || '')}</span><span class="muted small">${g.world?.parts?.length || 0} parts</span>
          <div class="funai-actions"><button class="btn-secondary" data-view="${i}"><span class="ic">${icons.eye}</span> View</button><button class="btn-secondary" data-studio="${i}"><span class="ic">${icons.edit}</span> Studio</button><button class="btn-danger" data-del="${i}">Delete</button></div>
        </div>`).join('') : '<p class="muted">Nothing saved yet. Build a world and hit Save to shelf.</p>';
      q('.funai-shelf').querySelectorAll('[data-view]').forEach(b => b.onclick = () => { const g = shelf()[+b.dataset.view]; if (g) show(g); });
      q('.funai-shelf').querySelectorAll('[data-studio]').forEach(b => b.onclick = () => { const g = shelf()[+b.dataset.studio]; if (g) createGame(g, false); });
      q('.funai-shelf').querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const g = shelf(); g.splice(+b.dataset.del, 1); saveShelf(g); renderShelf(); });
    };

    const think = on => {
      busy = on;
      q('.funai-go').disabled = on; q('.funai-remix-btn').disabled = on;
      if (on) {
        const msgs = ['FunAI is sketching your world…', 'Placing the blocks…', 'Painting the parts…', 'Checking the jumps…', 'Almost there…'];
        let i = 0; status.textContent = msgs[0];
        think.timer = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); status.textContent = msgs[i]; }, 4000);
      } else { clearInterval(think.timer); status.textContent = ''; }
    };

    const generate = async (prompt, world) => {
      if (busy || !prompt) return;
      think(true);
      try {
        const r = await api('POST', '/api/funai/generate', { prompt, style: q('.funai-style').value, ...(world ? { world } : {}) });
        show({ title: r.title, description: r.description, world: r.world });
        toast('FunAI built your world!');
      } catch (e) { toast(e.message, true); status.textContent = e.message; }
      think(false);
    };

    q('.funai-go').onclick = () => { const v = input.value.trim(); if (v.length < 3) { toast('Describe your game first!', true); input.focus(); return; } generate(v); };
    q('.funai-remix-btn').onclick = () => { const v = q('.funai-remix').value.trim(); if (!current) return; if (v.length < 3) { toast('Tell FunAI what to change!', true); return; } generate(v, current.world); q('.funai-remix').value = ''; };
    q('.funai-remix').onkeydown = e => { if (e.key === 'Enter') q('.funai-remix-btn').click(); };
    document.querySelectorAll('.funai-chip').forEach(c => c.onclick = () => { input.value = c.textContent.replace(/^\S+\s/, ''); input.focus(); });
    q('.funai-studio').onclick = () => { if (current) createGame(current, false); };
    q('.funai-publish').onclick = () => { if (current) createGame(current, true); };
    q('.funai-save').onclick = () => { if (!current) return; const g = shelf(); g.unshift({ ...current, at: Date.now() }); saveShelf(g); renderShelf(); toast('💾 Saved to your shelf'); };
    q('.funai-dl').onclick = () => {
      if (!current) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(current.world, null, 1)], { type: 'application/json' }));
      a.download = (current.title || 'funai-world').replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() + '.json';
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };

    renderShelf();
    api('GET', '/api/funai/status').then(s => { if (!s.configured) status.textContent = 'FunAI is not switched on yet — it lights up as soon as Zayd adds the key on Render.'; }).catch(() => {});
    input.focus();
  });
}
