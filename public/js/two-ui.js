// two-ui.js — 2UI: GUI-only games people can make and play.
// A 2UI game is a regular game row whose world.twoUi holds the GUI definition:
//   { goal, bg, elements: [{ id, kind, x, y, w, h, text, color, bg, points, cooldown }] }
// Kinds: button (click for points), coin (click for points), label (text),
// panel (decorative frame). Positions/sizes are % of the play area.
// No 3D scene, no avatar — the whole game is the interface itself.

function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function sanitizeTwoUiLocal(t) {
  const num = v => (Number.isFinite(+v) ? +v : 0);
  const hex = v => (/^#[0-9a-fA-F]{6}$/.test(v) ? v : null);
  if (!t || typeof t !== 'object') return { goal: 100, bg: '#17172a', elements: [] };
  const els = (Array.isArray(t.elements) ? t.elements : []).slice(0, 100).map((e, i) => {
    const kind = ['button', 'label', 'coin', 'panel'].includes(e.kind) ? e.kind : 'button';
    return {
      id: String(e.id || 'e' + i).slice(0, 20),
      kind,
      x: Math.max(0, Math.min(92, num(e.x))),
      y: Math.max(0, Math.min(92, num(e.y))),
      w: Math.max(2, Math.min(100, num(e.w) || 20)),
      h: Math.max(2, Math.min(100, num(e.h) || 10)),
      text: String(e.text || '').slice(0, 60),
      color: hex(e.color) || '#ffffff',
      bg: hex(e.bg) || (kind === 'button' ? '#7c3aed' : kind === 'coin' ? '#f5cd30' : '#2a2a40'),
      points: (kind === 'button' || kind === 'coin') ? Math.max(0, Math.min(1000, Math.round(num(e.points) || 0))) : 0,
      cooldown: (kind === 'button' || kind === 'coin') ? Math.max(0, Math.min(60, num(e.cooldown) || 0)) : 0,
    };
  });
  return {
    goal: Math.max(10, Math.min(10000, Math.round(num(t.goal) || 100))),
    bg: hex(t.bg) || '#17172a',
    elements: els,
  };
}

export function starterTwoUi() {
  return {
    goal: 50,
    bg: '#17172a',
    elements: [
      { id: 'e-title', kind: 'label', x: 25, y: 4, w: 50, h: 9, text: 'Click the coins!', color: '#ffffff', bg: '#2a2a40', points: 0, cooldown: 0 },
      { id: 'e-coin1', kind: 'coin', x: 10, y: 25, w: 16, h: 16, text: '🪙', color: '#7c2d12', bg: '#f5cd30', points: 5, cooldown: 2 },
      { id: 'e-coin2', kind: 'coin', x: 42, y: 45, w: 16, h: 16, text: '🪙', color: '#7c2d12', bg: '#f5cd30', points: 5, cooldown: 2 },
      { id: 'e-coin3', kind: 'coin', x: 74, y: 25, w: 16, h: 16, text: '🪙', color: '#7c2d12', bg: '#f5cd30', points: 5, cooldown: 2 },
      { id: 'e-btn', kind: 'button', x: 30, y: 70, w: 40, h: 12, text: 'BIG BONUS +10', color: '#ffffff', bg: '#7c3aed', points: 10, cooldown: 5 },
    ],
  };
}

// ---------- player ----------
// Renders a playable 2UI game into `container` (emptied first).
// opts: { onWin(score), onScore(score), onExit }. Returns { destroy, getScore }.
export function renderTwoUi(container, def, opts = {}) {
  const d = sanitizeTwoUiLocal(def);
  let score = 0;
  let won = false;
  const timers = new Set();
  container.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'two-ui-play';
  root.style.background = d.bg;
  const head = document.createElement('div');
  head.className = 'two-ui-head';
  const scoreEl = document.createElement('div');
  scoreEl.className = 'two-ui-score';
  const barWrap = document.createElement('div');
  barWrap.className = 'two-ui-bar';
  const barFill = document.createElement('div');
  barFill.className = 'two-ui-bar-fill';
  barWrap.appendChild(barFill);
  head.appendChild(scoreEl);
  head.appendChild(barWrap);
  if (opts.onExit) {
    const exitBtn = document.createElement('button');
    exitBtn.className = 'btn-secondary two-ui-exit';
    exitBtn.textContent = '✕ Exit';
    exitBtn.onclick = () => opts.onExit();
    head.appendChild(exitBtn);
  }
  const area = document.createElement('div');
  area.className = 'two-ui-area';
  const winOv = document.createElement('div');
  winOv.className = 'two-ui-win';
  winOv.style.display = 'none';
  const updateHead = () => {
    scoreEl.textContent = '⭐ ' + score + ' / ' + d.goal;
    barFill.style.width = Math.min(100, (score / d.goal) * 100) + '%';
  };
  const floatUp = (parent, text) => {
    const f = document.createElement('span');
    f.className = 'two-ui-float';
    f.textContent = text;
    parent.appendChild(f);
    const t = setTimeout(() => f.remove(), 900);
    timers.add(t);
  };
  const doWin = () => {
    if (won) return;
    won = true;
    winOv.style.display = 'flex';
    winOv.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'two-ui-win-card';
    const h = document.createElement('h2');
    h.textContent = '🎉 You Win!';
    const p = document.createElement('p');
    p.textContent = 'You reached ' + d.goal + ' points with ' + score + ' total.';
    const row = document.createElement('div');
    row.className = 'row';
    const again = document.createElement('button');
    again.className = 'btn-primary';
    again.textContent = 'Play Again';
    again.onclick = () => { score = 0; won = false; winOv.style.display = 'none'; updateHead(); opts.onScore?.(score); };
    row.appendChild(again);
    if (opts.onExit) {
      const ex = document.createElement('button');
      ex.className = 'btn-secondary';
      ex.textContent = 'Exit';
      ex.onclick = () => opts.onExit();
      row.appendChild(ex);
    }
    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(row);
    winOv.appendChild(card);
    opts.onWin?.(score);
  };
  const onTap = (el, node) => {
    if (won) return;
    if (el.kind !== 'button' && el.kind !== 'coin') return;
    if (node.dataset.cd === '1') return;
    score += el.points || 0;
    floatUp(node, '+' + (el.points || 0));
    updateHead();
    opts.onScore?.(score);
    if (el.cooldown > 0) {
      node.dataset.cd = '1';
      node.classList.add('two-ui-cd');
      const t = setTimeout(() => { node.dataset.cd = ''; node.classList.remove('two-ui-cd'); }, el.cooldown * 1000);
      timers.add(t);
    }
    if (score >= d.goal) doWin();
  };
  d.elements.forEach(el => {
    const node = document.createElement(el.kind === 'button' || el.kind === 'coin' ? 'button' : 'div');
    node.className = 'two-ui-el two-ui-' + el.kind;
    node.style.left = el.x + '%';
    node.style.top = el.y + '%';
    node.style.width = el.w + '%';
    node.style.height = el.h + '%';
    node.style.color = el.color;
    node.style.background = el.bg;
    node.textContent = el.text || (el.kind === 'coin' ? '🪙' : '');
    node.dataset.eid = el.id;
    if (el.kind === 'button' || el.kind === 'coin') node.onclick = () => onTap(el, node);
    area.appendChild(node);
  });
  root.appendChild(head);
  root.appendChild(area);
  root.appendChild(winOv);
  container.appendChild(root);
  updateHead();
  return {
    getScore: () => score,
    destroy: () => { timers.forEach(t => clearTimeout(t)); timers.clear(); root.remove(); },
  };
}

// ---------- browse ----------
// Lists every published 2UI game.
export async function twoUiBrowsePage(D) {
  const { api, mount, esc } = D;
  const games = await api('GET', '/api/games');
  const list = (games || []).filter(g => g.is2ui);
  mount('2ui', `
    <h1>2UI Games</h1>
    <p class="muted">GUI-only games made by players — no 3D world, the whole game is the interface. Tap one to play, or <a class="link" href="#/2ui/new">make your own</a>.</p>
    <div class="row" style="margin-bottom:14px"><a class="btn-primary" href="#/2ui/new">+ Make a 2UI Game</a><a class="btn-secondary" href="#/create">Back to Create</a></div>
    <div class="gc-grid">${list.map(g => `<a class="game-card" href="#/games/${g.id}">
      <div class="gc-thumb"><span class="gc-2ui">2UI</span></div>
      <div class="gc-name">${esc(g.name || 'Untitled Game')}</div>
      <div class="gc-stats"><span>by ${esc(g.creator)}</span><span>👁 ${g.visits || 0}</span></div>
    </a>`).join('') || '<p class="muted">No 2UI games yet — be the first to make one!</p>'}</div>`, () => {});
}

// ---------- studio (builder) ----------
// D: { api, mount, esc, toast, setCleanup, get me }. gameId: null for new, or an existing game id to edit.
export async function twoUiStudioPage(D, gameId) {
  const { api, mount, esc, toast, setCleanup } = D;
  let name = 'My 2UI Game';
  let description = '';
  let published = false;
  let def = starterTwoUi();
  let game = null;
  if (gameId) {
    game = await api('GET', '/api/games/' + gameId);
    if (!game || (game.creator || '').toLowerCase() !== (D.me.name || '').toLowerCase()) { toast('You can only edit your own games', true); location.hash = '#/create'; return; }
    name = game.name || name;
    description = game.description || '';
    published = !game.unpublished;
    if (game.world?.twoUi) def = sanitizeTwoUiLocal(game.world.twoUi);
  }
  let selId = null;
  let savedId = game ? game.id : null;
  const uid = () => 'e' + Math.random().toString(36).slice(2, 8);
  mount('2ui', `
    <h1>2UI Studio</h1>
    <p class="muted">Build a GUI-only game — place buttons, coins, labels and panels. Players tap the buttons and coins to score points. First to the goal wins.</p>
    <div class="two-ui-studio">
      <div class="two-ui-side">
        <label class="two-ui-lbl">Game name<input class="two-ui-name" maxlength="50" value="${esc(name)}"></label>
        <label class="two-ui-lbl">Description<input class="two-ui-desc" maxlength="200" value="${esc(description)}"></label>
        <div class="row">
          <label class="two-ui-lbl">Goal (points)<input class="two-ui-goal" type="number" min="10" max="10000" value="${def.goal}"></label>
          <label class="two-ui-lbl">Background<input class="two-ui-bg" type="color" value="${esc(def.bg)}"></label>
        </div>
        <div class="sec-h"><h2>Add</h2></div>
        <div class="row two-ui-add">
          <button class="btn-secondary" data-add="button">🔘 Button</button>
          <button class="btn-secondary" data-add="coin">🪙 Coin</button>
          <button class="btn-secondary" data-add="label">🏷️ Label</button>
          <button class="btn-secondary" data-add="panel">▦ Panel</button>
        </div>
        <div class="sec-h"><h2>Selected</h2></div>
        <div class="two-ui-insp"><p class="muted">Tap an element on the canvas to edit it.</p></div>
        <div class="row two-ui-actions">
          <button class="btn-secondary two-ui-test">▶ Playtest</button>
          <button class="btn-primary two-ui-save">${published ? 'Save' : 'Save as private'}</button>
          <button class="btn-secondary two-ui-pub">${published ? 'Unpublish' : 'Publish'}</button>
          <a class="btn-secondary" href="#/create">Exit</a>
        </div>
      </div>
      <div class="two-ui-canvas-wrap">
        <div class="two-ui-area two-ui-edit"></div>
        <p class="muted small">Drag elements to move them. Tap to select. Buttons and coins give points when tapped in play.</p>
      </div>
    </div>
    <div class="two-ui-testov" style="display:none"></div>`, () => {
    const area = app.querySelector('.two-ui-area');
    const insp = app.querySelector('.two-ui-insp');
    const testOv = app.querySelector('.two-ui-testov');
    let testGame = null;
    const renderCanvas = () => {
      area.innerHTML = '';
      area.style.background = def.bg;
      def.elements.forEach(el => {
        const node = document.createElement('div');
        node.className = 'two-ui-el two-ui-' + el.kind + (el.id === selId ? ' two-ui-sel' : '');
        node.style.left = el.x + '%';
        node.style.top = el.y + '%';
        node.style.width = el.w + '%';
        node.style.height = el.h + '%';
        node.style.color = el.color;
        node.style.background = el.bg;
        node.textContent = el.text || (el.kind === 'coin' ? '🪙' : '');
        node.dataset.eid = el.id;
        area.appendChild(node);
      });
    };
    const renderInsp = () => {
      const el = def.elements.find(e => e.id === selId);
      if (!el) { insp.innerHTML = '<p class="muted">Tap an element on the canvas to edit it.</p>'; return; }
      const isClick = el.kind === 'button' || el.kind === 'coin';
      insp.innerHTML = `
        <label class="two-ui-lbl">Text<input class="in-text" maxlength="60" value="${esc(el.text)}"></label>
        <div class="row">
          <label class="two-ui-lbl">Text color<input class="in-color" type="color" value="${esc(el.color)}"></label>
          <label class="two-ui-lbl">Fill<input class="in-bg" type="color" value="${esc(el.bg)}"></label>
        </div>
        ${isClick ? `<div class="row">
          <label class="two-ui-lbl">Points<input class="in-points" type="number" min="0" max="1000" value="${el.points}"></label>
          <label class="two-ui-lbl">Cooldown (s)<input class="in-cd" type="number" min="0" max="60" value="${el.cooldown}"></label>
        </div>` : ''}
        <div class="row">
          <label class="two-ui-lbl">X %<input class="in-x" type="number" min="0" max="92" value="${el.x}"></label>
          <label class="two-ui-lbl">Y %<input class="in-y" type="number" min="0" max="92" value="${el.y}"></label>
          <label class="two-ui-lbl">W %<input class="in-w" type="number" min="2" max="100" value="${el.w}"></label>
          <label class="two-ui-lbl">H %<input class="in-h" type="number" min="2" max="100" value="${el.h}"></label>
        </div>
        <button class="btn-danger in-del">Delete element</button>`;
      const q = s => insp.querySelector(s);
      q('.in-text').oninput = e => { el.text = e.target.value; renderCanvas(); };
      q('.in-color').oninput = e => { el.color = e.target.value; renderCanvas(); };
      q('.in-bg').oninput = e => { el.bg = e.target.value; renderCanvas(); };
      if (isClick) {
        q('.in-points').oninput = e => { el.points = Math.max(0, Math.min(1000, +e.target.value || 0)); };
        q('.in-cd').oninput = e => { el.cooldown = Math.max(0, Math.min(60, +e.target.value || 0)); };
      }
      q('.in-x').oninput = e => { el.x = Math.max(0, Math.min(92, +e.target.value || 0)); renderCanvas(); };
      q('.in-y').oninput = e => { el.y = Math.max(0, Math.min(92, +e.target.value || 0)); renderCanvas(); };
      q('.in-w').oninput = e => { el.w = Math.max(2, Math.min(100, +e.target.value || 2)); renderCanvas(); };
      q('.in-h').oninput = e => { el.h = Math.max(2, Math.min(100, +e.target.value || 2)); renderCanvas(); };
      q('.in-del').onclick = () => { def.elements = def.elements.filter(e => e.id !== el.id); selId = null; renderCanvas(); renderInsp(); };
    };
    // drag to move + tap to select
    let drag = null;
    area.addEventListener('pointerdown', e => {
      const node = e.target.closest('.two-ui-el');
      if (!node) { selId = null; renderCanvas(); renderInsp(); return; }
      const el = def.elements.find(x => x.id === node.dataset.eid);
      if (!el) return;
      selId = el.id;
      renderCanvas();
      renderInsp();
      const rect = area.getBoundingClientRect();
      drag = { el, startX: e.clientX, startY: e.clientY, ox: el.x, oy: el.y, rect, moved: false };
      area.setPointerCapture(e.pointerId);
    });
    area.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = ((e.clientX - drag.startX) / drag.rect.width) * 100;
      const dy = ((e.clientY - drag.startY) / drag.rect.height) * 100;
      if (Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) > 4) drag.moved = true;
      drag.el.x = Math.max(0, Math.min(92, drag.ox + dx));
      drag.el.y = Math.max(0, Math.min(92, drag.oy + dy));
      renderCanvas();
    });
    area.addEventListener('pointerup', () => { if (drag?.moved) renderInsp(); drag = null; });
    app.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
      const kind = b.dataset.add;
      const el = { id: uid(), kind, x: 30 + Math.random() * 20, y: 30 + Math.random() * 20, w: kind === 'label' ? 40 : kind === 'panel' ? 40 : 20, h: kind === 'coin' ? 16 : 10,
        text: kind === 'button' ? 'Tap me!' : kind === 'coin' ? '🪙' : kind === 'label' ? 'Hello!' : '',
        color: '#ffffff', bg: kind === 'button' ? '#7c3aed' : kind === 'coin' ? '#f5cd30' : '#2a2a40',
        points: kind === 'button' ? 5 : kind === 'coin' ? 5 : 0, cooldown: kind === 'button' || kind === 'coin' ? 1 : 0 };
      def.elements.push(el);
      selId = el.id;
      renderCanvas();
      renderInsp();
    });
    app.querySelector('.two-ui-goal').oninput = e => { def.goal = Math.max(10, Math.min(10000, +e.target.value || 100)); };
    app.querySelector('.two-ui-bg').oninput = e => { def.bg = e.target.value; renderCanvas(); };
    const save = async pub => {
      name = app.querySelector('.two-ui-name').value.trim() || 'My 2UI Game';
      description = app.querySelector('.two-ui-desc').value.trim();
      const body = { name, description, world: { parts: [], twoUi: sanitizeTwoUiLocal(def) }, publish: pub };
      try {
        if (savedId) { await api('PUT', '/api/games/' + savedId, body); }
        else { const r = await api('POST', '/api/games', body); savedId = r.id; history.replaceState(null, '', '#/2ui/' + savedId); }
        published = pub;
        app.querySelector('.two-ui-save').textContent = published ? 'Save' : 'Save as private';
        app.querySelector('.two-ui-pub').textContent = published ? 'Unpublish' : 'Publish';
        toast(published ? '2UI game published!' : '2UI game saved (private)');
      } catch (err) { toast('Could not save: ' + (err?.message || 'error'), true); }
    };
    app.querySelector('.two-ui-save').onclick = () => save(published);
    app.querySelector('.two-ui-pub').onclick = () => save(!published);
    app.querySelector('.two-ui-test').onclick = () => {
      testOv.style.display = 'flex';
      testOv.innerHTML = '';
      testGame = renderTwoUi(testOv, sanitizeTwoUiLocal(def), { onExit: () => { testGame?.destroy(); testGame = null; testOv.style.display = 'none'; testOv.innerHTML = ''; } });
    };
    setCleanup(() => { testGame?.destroy(); });
    renderCanvas();
    renderInsp();
  });
}
