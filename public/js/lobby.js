// Fortnite-style lobby: your avatar on a 3D podium, friends beside you,
// mode select + a giant PLAY button. Funtopia's own art and characters.
import * as THREE from 'three';
import { buildCharacter, animateCharacter, makeNameTag } from './avatar3d.js?v=97bd0103';

const escH = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 🎃 Halloween countdown — days until Oct 31, scarier every day. Pure date
// math, so the level climbs on its own with no daily pushes. After Oct 31 it
// runs at max scare through the Nov 1, 7pm local cutoff (matching the site
// HALLOWEEN_DATES end), then hides.
function halloweenCountdown(now = new Date()) {
  const y = now.getFullYear();
  const day = 86400000;
  const hw = new Date(y, 9, 31); // Oct 31 local
  const end = new Date(y, 10, 1, 19); // Nov 1, 7pm local — site cutoff
  const toHW = Math.ceil((hw - now) / day);
  const EMOJIS = ['🎃', '🎃🦇', '🎃🦇👻', '🎃🦇👻🕷️', '🎃🦇👻🕷️💀', '💀🎃🦇👻🕷️🩸'];
  if (toHW > 5 || now >= end) return null;
  if (toHW > 0) {
    const level = 6 - toHW;
    return { level, emojis: EMOJIS[level - 1], text: `${toHW} day${toHW === 1 ? '' : 's'} until Halloween` };
  }
  if (toHW === 0) return { level: 6, emojis: EMOJIS[5], text: 'HALLOWEEN IS HERE' };
  return { level: 6, emojis: EMOJIS[5], text: 'LAST DAY of Halloween' };
}

// 👻 Haunting creatures drifting across the lobby. Count grows with the scare
// level. Deterministic layout (no Math.random) so it renders the same every load.
function hauntHtml(level) {
  const EMOJIS = ['👻', '🦇', '🕷️', '💀', '🩸'];
  const n = level + 2;
  let out = '';
  for (let i = 0; i < n; i++) {
    const top = 8 + ((i * 37) % 70);
    const dur = 14 + ((i * 7) % 18);
    const delay = -((i * 5) % 20);
    const size = 22 + ((i * 13) % 22);
    const rev = i % 2 === 1;
    out += `<span style="top:${top}%;font-size:${size}px;animation-duration:${dur}s;animation-delay:${delay}s;${rev ? 'animation-direction:reverse;' : ''}">${EMOJIS[i % EMOJIS.length]}</span>`;
  }
  return out;
}

export async function lobbyPage(D) {
  const { api, esc, fmt, toast, avatarImgTag } = D;
  const me = D.me;
  const cd = halloweenCountdown();
  const app = document.getElementById('app');
  app.className = 'fullscreen';
  let games = [], friends = [];
  try { [games, friends] = await Promise.all([api('GET', '/api/games'), api('GET', '/api/friends').then(r => r.friends || [])]); } catch {}
  const online = (friends || []).filter(f => f.online || f.gameId);
  const byPlaying = [...games].sort((a, b) => (b.playing || 0) - (a.playing || 0));
  const pick = mode => {
    if (mode === 'obby') return byPlaying.find(g => /obby|course|run|gauntlet|tower|climb/i.test(g.name)) || byPlaying[0];
    if (mode === 'hangout') return byPlaying.find(g => /hangout|plaza|town|baseplate|mansion|garden/i.test(g.name)) || byPlaying[0];
    return games.find(g => g.id === 'g_bvportal') || byPlaying[0];
  };
  let mode = 'featured';
  let feat = pick(mode);
  const recentId = (me.recent || [])[0];
  const recent = games.find(g => g.id === recentId);

  app.innerHTML = `
  <div class="lobby${cd ? ` scare-${cd.level}` : ''}">
    <div class="lb-bg"></div>
    <div class="lb-3d"></div>
    <header class="lb-top">
      <a class="lb-logo" href="#/home"><span class="lb-logo-badge">F</span> FUNTOPIA <span class="lb-tag">LOBBY</span></a>
      <div class="lb-top-right">
        <span class="lb-tix" title="FunTix">🪙 ${fmt(me.funtix ?? 0)}</span>
        <a class="lb-chip" href="#/users/${encodeURIComponent(me.name)}">${avatarImgTag(me.avatar, 'headshot')}<b>${esc(me.name)}</b></a>
        <a class="lb-iconbtn" href="#/dashboard" title="Classic home">🏠</a>
        <a class="lb-iconbtn" href="#/settings" title="Settings">⚙️</a>
      </div>
    </header>
    ${cd ? `<a class="lb-countdown scare-${cd.level}" href="#/halloween"><span>${cd.emojis}</span><b>${cd.text}</b></a>` : ''}
    ${cd ? `<div class="lb-glitch"></div><div class="lb-haunt">${hauntHtml(cd.level)}</div>${cd.level >= 5 ? '<div class="lb-eyes">👀</div>' : ''}` : ''}
    <nav class="lb-rail">
      <a class="lb-item active" href="#/discover"><span>▶</span>PLAY</a>
      <a class="lb-item" href="#/avatar"><span>🎽</span>LOCKER</a>
      <a class="lb-item" href="#/catalog"><span>🛒</span>ITEM SHOP</a>
      <a class="lb-item" href="#/create"><span>🔨</span>CREATE</a>
      <a class="lb-item" href="#/friends"><span>👥</span>FRIENDS${me.requests?.length ? ` <i class="lb-dot">${me.requests.length}</i>` : ''}</a>
      <a class="lb-item" href="#/blockverse"><span>🟩</span>EVENTS</a>
      <a class="lb-item" href="#/users/${encodeURIComponent(me.name)}"><span>🏅</span>PROFILE</a>
    </nav>
    <aside class="lb-panel">
      <div class="lb-mode-label">FEATURED MODE</div>
      <div class="lb-chips">
        <button data-m="featured" class="on">⭐ Featured</button>
        <button data-m="obby">🏃 Obby</button>
        <button data-m="hangout">🏡 Hangout</button>
      </div>
      <div class="lb-feat">
        <div class="lb-feat-thumb">${feat ? `<span>${feat.id === 'g_bvportal' ? '🌌' : feat.id.startsWith('g_hw') ? '🎃' : '🎮'}</span>` : '<span>🎮</span>'}</div>
        <h2 class="lb-feat-name">${feat ? esc(feat.name) : 'No games yet'}</h2>
        <div class="lb-feat-meta">${feat ? `By @${esc(feat.creator || 'Funtopia')} · 👥 ${fmt(feat.playing || 0)} playing · 👁 ${fmt(feat.visits || 0)}` : ''}</div>
      </div>
      <button class="lb-play" ${feat ? '' : 'disabled'}>▶ PLAY</button>
      <div class="lb-party">
        <div class="lb-mode-label">PARTY</div>
        <div class="lb-party-row">
          <span class="lb-pchip me">${avatarImgTag(me.avatar, 'headshot')}<b>You</b></span>
          ${online.slice(0, 3).map(f => `<span class="lb-pchip">${avatarImgTag(f.avatar, 'headshot')}<b>${esc(f.name)}</b>${f.gameId ? `<a href="#/play/${f.gameId}">Join</a>` : '<i>Online</i>'}</span>`).join('')}
          ${online.length ? '' : '<span class="lb-pempty">No friends online — invite some!</span>'}
        </div>
      </div>
    </aside>
    <div class="lb-nameplate"><b>${esc(me.name)}</b><span>🏅 ${(me.badges || []).length} badges · 🔥 ${me.streak || 0} day streak</span></div>
    <div class="lb-emotes">${[['wave', '👋'], ['dance', '💃'], ['spin', '🌀'], ['bow', '🙇'], ['cheer', '🎉'], ['laugh', '😂'], ['dab', '😎'], ['sit', '🪑']].map(([n, e]) => `<button data-e="${n}" title="${n}">${e}</button>`).join('')}</div>
    <footer class="lb-tiles">
      ${recent ? `<a class="lb-tile" href="#/play/${recent.id}"><span>⏩</span><b>Continue</b><i>${esc(recent.name)}</i></a>` : ''}
      <a class="lb-tile" href="#/discover"><span>🏆</span><b>Charts</b><i>Top games right now</i></a>
      <a class="lb-tile" href="#/blockverse"><span>🟩</span><b>Blockverse Collab</b><i>Free gifts + badge</i></a>
      <a class="lb-tile" href="#/halloween"><span>🎃</span><b>Halloween</b><i>Spooky games & loot</i></a>
      <a class="lb-tile" href="#/create"><span>👹</span><b>Horror Gauntlet</b><i>Remix the 250-part course</i></a>
    </footer>
    <div class="lb-overlay" id="lb-overlay">
      <button class="lb-ov-close" title="Back to lobby">✕</button>
      <div class="lb-ov-body"></div>
    </div>
  </div>`;

  const playBtn = app.querySelector('.lb-play');
  const setFeat = g => {
    feat = g;
    app.querySelector('.lb-feat-name').textContent = g ? g.name : 'No games yet';
    app.querySelector('.lb-feat-meta').textContent = g ? `By @${g.creator || 'Funtopia'} · 👥 ${fmt(g.playing || 0)} playing · 👁 ${fmt(g.visits || 0)}` : '';
    playBtn.disabled = !g;
  };
  app.querySelectorAll('.lb-chips button').forEach(b => b.onclick = () => {
    app.querySelectorAll('.lb-chips button').forEach(x => x.classList.toggle('on', x === b));
    mode = b.dataset.m; setFeat(pick(mode));
  });
  const overlay = app.querySelector('#lb-overlay');
  const overlayBody = overlay.querySelector('.lb-ov-body');
  function closeOverlay() {
    overlay.classList.remove('open');
    window.__clearOverlayApp();
    window.__closeLobbyOverlay = null;
    history.replaceState(null, '', '#/home');
  }
  function openOverlay(hash) {
    if (hash === '#/home' || hash === '#/lobby') { closeOverlay(); return; }
    overlayBody.innerHTML = '';
    overlay.classList.add('open');
    window.__setOverlayApp(overlayBody);
    window.__closeLobbyOverlay = closeOverlay;
    if (location.hash === hash) window.__route();
    else location.hash = hash;
  }
  // every lobby button opens its page as an overlay — the lobby stays underneath
  app.querySelectorAll('a[href^="#/"]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); openOverlay(a.getAttribute('href')); });
  });
  // links inside the overlay stay in the overlay
  overlay.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#/"]');
    if (a) { e.preventDefault(); e.stopPropagation(); openOverlay(a.getAttribute('href')); }
  });
  overlay.querySelector('.lb-ov-close').onclick = closeOverlay;
  playBtn.onclick = () => { if (feat) openOverlay('#/play/' + feat.id); };

  // ---------- 3D stage ----------
  const holder = app.querySelector('.lb-3d');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  holder.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0a14, 14, 30);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 4.1, 13.8);
  camera.lookAt(0, 2.1, 0);
  scene.add(new THREE.HemisphereLight(0x9db4ff, 0x2a0f14, 0.85));
  const key = new THREE.DirectionalLight(0xfff1d6, 1.6); key.position.set(4, 9, 7); scene.add(key);
  const rimR = new THREE.PointLight(0xe8112d, 60, 30); rimR.position.set(-7, 3.5, -4); scene.add(rimR);
  const rimV = new THREE.PointLight(0x7c4dff, 55, 30); rimV.position.set(7, 2.5, -5); scene.add(rimV);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(26, 48), new THREE.MeshStandardMaterial({ color: 0x101017, roughness: 0.35, metalness: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.5; scene.add(floor);
  const stage = new THREE.Group(); scene.add(stage);
  const podium = (x, z, r, ringColor) => {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, 0.5, 40), new THREE.MeshStandardMaterial({ color: 0x1c1e28, roughness: 0.4, metalness: 0.5 }));
    disc.position.y = -0.25; g.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, 0.055, 10, 48), new THREE.MeshStandardMaterial({ color: ringColor, emissive: ringColor, emissiveIntensity: 1.6 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; g.add(ring);
    g.position.set(x, 0, z); stage.add(g); return g;
  };
  const collab = Date.now() >= Date.parse('2026-10-22T00:00:00Z') && Date.now() <= Date.parse('2026-12-06T00:00:00Z');
  podium(0, 0, 2.3, collab ? 0x2ee06f : 0xb388ff);
  podium(-5.7, -0.9, 1.7, 0x39415e); podium(5.7, -0.9, 1.7, 0x39415e);
  const chars = [];
  const addChar = (avatar, name, x, z, s) => {
    try {
      const c = buildCharacter(avatar, { pet: false, gear: false });
      c.position.set(x, 0, z); c.scale.setScalar(s);
      const tag = makeNameTag(name); tag.position.y = 5.7; tag.scale.multiplyScalar(0.5); c.add(tag);
      stage.add(c); chars.push(c); return c;
    } catch { return null; }
  };
  addChar(me.avatar, me.name, 0, 0, 1);
  online.slice(0, 2).forEach((f, i) => addChar(f.avatar, f.name, i === 0 ? -5.7 : 5.7, -0.9, 0.94));
  let spin = 0, targetSpin = 0, dragging = false, lastX = 0;
  const el = renderer.domElement;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; });
  addEventListener('pointerup', () => { dragging = false; });
  el.addEventListener('pointermove', e => { if (dragging) { targetSpin += (e.clientX - lastX) * 0.008; lastX = e.clientX; } });
  const resize = () => { const w = holder.clientWidth, h = holder.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);
  let myEmote = 'idle', emoteEnd = 0;
  app.querySelectorAll('.lb-emotes button').forEach(b => b.onclick = () => {
    const e = b.dataset.e;
    if (myEmote === e && clock.elapsedTime < emoteEnd) { myEmote = 'idle'; emoteEnd = 0; }
    else { myEmote = e; emoteEnd = clock.elapsedTime + 4; }
    app.querySelectorAll('.lb-emotes button').forEach(x => x.classList.toggle('on', x.dataset.e === myEmote && clock.elapsedTime < emoteEnd));
  });
  let raf = 0; const clock = new THREE.Clock();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    if (!dragging) targetSpin += dt * 0.12;
    spin += (targetSpin - spin) * Math.min(1, dt * 6);
    stage.rotation.y = spin;
    if (myEmote !== 'idle' && t >= emoteEnd) { myEmote = 'idle'; app.querySelectorAll('.lb-emotes button').forEach(x => x.classList.remove('on')); }
    chars.forEach((c, i) => animateCharacter(c, i === 0 ? myEmote : 'idle', t + i * 1.7, dt));
    renderer.render(scene, camera);
  };
  tick();
  D.setCleanup(() => {
    cancelAnimationFrame(raf);
    removeEventListener('resize', resize);
    renderer.dispose();
    holder.innerHTML = '';
  });
}
