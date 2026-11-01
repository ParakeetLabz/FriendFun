// ✨ FunAI — game maker AI page for Funtopia (client).
// Describe a game -> the server asks the AI -> a playable HTML game
// appears in the preview frame. Remix it, download it, or keep it on
// your shelf (saved in this browser).
export async function funaiPage(D) {
  const { api, mount, esc, toast } = D;

  const shelf = () => { try { return JSON.parse(localStorage.getItem('funai_games') || '[]'); } catch { return []; } };
  const saveShelf = g => { try { localStorage.setItem('funai_games', JSON.stringify(g.slice(0, 24))); } catch { toast('Shelf is full in this browser', true); } };

  mount('funai', `
    <div class="funai-hero">
      <h1>✨ FunAI</h1>
      <p>Describe any game. FunAI builds it — playable right here, in seconds.</p>
    </div>
    <section class="funai-panel">
      <textarea class="funai-input" rows="3" maxlength="600" placeholder="e.g. a game where a cat catches falling pizzas and dodges broccoli"></textarea>
      <div class="funai-chips">
        ${['🐍 Neon snake that speeds up', '🚀 Space shooter with aliens', '🍕 Catch the falling pizzas', '🏎️ Tiny top-down racer', '🧱 Breakout with a rainbow ball', '🐸 Frog crossing a busy road', '👻 Spooky ghost maze chase', '🏀 Tap-to-shoot hoops'].map(i => `<button type="button" class="funai-chip">${esc(i)}</button>`).join('')}
      </div>
      <div class="funai-row">
        <select class="funai-style">
          <option value="">Any style</option><option>Arcade</option><option>Cute</option><option>Spooky</option><option>Space</option><option>Retro</option><option>Underwater</option>
        </select>
        <button class="btn-primary funai-go">✨ Make my game</button>
      </div>
      <p class="funai-status muted"></p>
    </section>
    <section class="funai-stage hidden">
      <div class="funai-stage-head">
        <h2 class="funai-title">Your game</h2>
        <div class="funai-actions">
          <button class="btn-secondary funai-replay">↻ Restart</button>
          <button class="btn-secondary funai-save">💾 Save to shelf</button>
          <button class="btn-secondary funai-dl">⬇ Download</button>
          <button class="btn-secondary funai-copy">📋 Copy code</button>
        </div>
      </div>
      <iframe class="funai-frame" title="Your FunAI game" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>
      <div class="funai-row funai-remix-row">
        <input class="funai-remix" maxlength="600" placeholder="Tell FunAI a change — e.g. make it faster, add coins, change colors">
        <button class="btn-primary funai-remix-btn">🔁 Remix</button>
      </div>
      <details class="funai-codewrap"><summary>See the code</summary><pre class="funai-code"></pre></details>
    </section>
    <section class="funai-shelf-wrap">
      <h2>📚 My FunAI shelf</h2>
      <div class="funai-shelf"></div>
    </section>`, () => {
    const q = s => document.querySelector(s);
    const input = q('.funai-input'), status = q('.funai-status'), stage = q('.funai-stage');
    const frame = q('.funai-frame'), titleEl = q('.funai-title'), codeEl = q('.funai-code');
    let current = null; // { title, html, prompt }
    let busy = false;

    const renderShelf = () => {
      const games = shelf();
      q('.funai-shelf').innerHTML = games.length ? games.map((g, i) => `
        <div class="funai-card">
          <b>${esc(g.title)}</b><span class="muted small">${esc(g.prompt || '')}</span>
          <div class="funai-actions"><button class="btn-secondary" data-play="${i}">▶ Play</button><button class="btn-secondary" data-dl="${i}">⬇</button><button class="btn-danger" data-del="${i}">Delete</button></div>
        </div>`).join('') : '<p class="muted">Nothing saved yet. Make a game and hit 💾 Save to shelf.</p>';
      q('.funai-shelf').querySelectorAll('[data-play]').forEach(b => b.onclick = () => { const g = shelf()[+b.dataset.play]; if (g) show({ title: g.title, html: g.html, prompt: g.prompt }); });
      q('.funai-shelf').querySelectorAll('[data-dl]').forEach(b => b.onclick = () => { const g = shelf()[+b.dataset.dl]; if (g) download(g); });
      q('.funai-shelf').querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const g = shelf(); g.splice(+b.dataset.del, 1); saveShelf(g); renderShelf(); });
    };

    const download = g => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([g.html], { type: 'text/html' }));
      a.download = (g.title || 'funai-game').replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() + '.html';
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };

    const show = g => {
      current = g;
      stage.classList.remove('hidden');
      titleEl.textContent = '🎮 ' + g.title;
      codeEl.textContent = g.html;
      frame.srcdoc = g.html;
      stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const think = on => {
      busy = on;
      q('.funai-go').disabled = on; q('.funai-remix-btn').disabled = on;
      if (on) {
        const msgs = ['FunAI is dreaming up your game…', 'Writing the code…', 'Drawing the sprites…', 'Testing the jumps…', 'Almost there…'];
        let i = 0; status.textContent = msgs[0];
        think.timer = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); status.textContent = msgs[i]; }, 4000);
      } else { clearInterval(think.timer); status.textContent = ''; }
    };

    const generate = async (prompt, code) => {
      if (busy || !prompt) return;
      think(true);
      try {
        const r = await api('POST', '/api/funai/generate', { prompt, style: q('.funai-style').value, ...(code ? { code } : {}) });
        show({ title: r.title, html: r.html, prompt });
        toast('✨ FunAI made your game!');
      } catch (e) { toast(e.message, true); status.textContent = '⚠️ ' + e.message; }
      think(false);
    };

    q('.funai-go').onclick = () => { const v = input.value.trim(); if (v.length < 3) { toast('Describe your game first!', true); input.focus(); return; } generate(v); };
    q('.funai-remix-btn').onclick = () => { const v = q('.funai-remix').value.trim(); if (!current) return; if (v.length < 3) { toast('Tell FunAI what to change!', true); return; } generate(v, current.html); q('.funai-remix').value = ''; };
    q('.funai-remix').onkeydown = e => { if (e.key === 'Enter') q('.funai-remix-btn').click(); };
    document.querySelectorAll('.funai-chip').forEach(c => c.onclick = () => { input.value = c.textContent.replace(/^\S+\s/, ''); input.focus(); });
    q('.funai-replay').onclick = () => { if (current) frame.srcdoc = current.html; };
    q('.funai-save').onclick = () => { if (!current) return; const g = shelf(); g.unshift({ ...current, at: Date.now() }); saveShelf(g); renderShelf(); toast('💾 Saved to your shelf'); };
    q('.funai-dl').onclick = () => { if (current) download(current); };
    q('.funai-copy').onclick = async () => { if (!current) return; try { await navigator.clipboard.writeText(current.html); toast('📋 Code copied'); } catch { toast('Copy failed — open "See the code"', true); } };

    renderShelf();
    api('GET', '/api/funai/status').then(s => { if (!s.configured) status.textContent = 'FunAI is not switched on yet — it lights up as soon as Zayd adds the key on Render.'; }).catch(() => {});
    input.focus();
  });
}
