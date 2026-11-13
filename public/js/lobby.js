// Fortnite-style lobby: your avatar on a 3D podium, friends beside you,
// mode select + a giant PLAY button. Funtopia's own art and characters.
import * as THREE from 'three';
import { buildCharacter, animateCharacter, makeNameTag } from './avatar3d.js?v=0e183037';
import { icons } from './icons.js?v=1aa0a4d3';
import { LOGO } from './ui.js?v=f35f8472';

const escH = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function lobbyPage(D) {
  const { api, esc, fmt, toast, avatarImgTag } = D;
  const me = D.me;
  const app = document.getElementById('app');
  app.className = 'fullscreen';
  let games = [], friends = [], party = { active: false };
  try { [games, friends] = await Promise.all([api('GET', '/api/games'), api('GET', '/api/friends').then(r => r.friends || [])]); } catch {}
  try { party = await api('GET', '/api/event/party'); } catch {}
  const online = (friends || []).filter(f => f.online || f.gameId);
  const byPlaying = [...games].sort((a, b) => (b.playing || 0) - (a.playing || 0));
  const pick = mode => {
    if (mode === 'obby') return byPlaying.find(g => /obby|course|run|gauntlet|tower|climb/i.test(g.name)) || byPlaying[0];
    if (mode === 'hangout') return byPlaying.find(g => /hangout|plaza|town|baseplate|mansion|garden/i.test(g.name)) || byPlaying[0];
    return byPlaying[0];
  };
  let mode = 'featured';
  let feat = pick(mode);
  const featThumb = feat ? (feat.icon ? esc(feat.icon) : `<span class="ic">${icons.gamepad}</span>`) : `<span class="ic">${icons.gamepad}</span>`;
  const recentId = (me.recent || [])[0];
  const recent = games.find(g => g.id === recentId);

  app.innerHTML = `
  <div class="lobby">
    <div class="lb-bg"></div>
    <div class="lb-3d"></div>
    <header class="lb-top">
      <a class="lb-logo" href="#/home"><span class="lb-logo-mark">${LOGO}</span><span class="lb-logo-word">FUNTOPIA</span><span class="lb-tag">LOBBY</span></a>
      <div class="lb-top-right">
        <span class="lb-tix" title="FunTix"><span class="ic">${icons.coins}</span> ${fmt(me.funtix ?? 0)}</span>
        <a class="lb-chip" href="#/users/${encodeURIComponent(me.name)}">${avatarImgTag(me.avatar, 'headshot')}<b>${esc(me.name)}</b></a>
        <a class="lb-iconbtn" href="#/settings" title="Settings"><span class="ic">${icons.gear}</span></a>
      </div>
    </header>
    ${party.active ? `<a class="lb-party-banner" href="#/play/g_party100"><span>🎉</span><b>100 Players Party is LIVE!</b> Free Neon Party Hat + disco plaza ›</a>` : ''}
    <nav class="lb-rail">
      <a class="lb-item active" href="#/discover"><span>▶</span>PLAY</a>
      <a class="lb-item" href="#/avatar"><span class="ic">${icons.avatar}</span>LOCKER</a>
      <a class="lb-item" href="#/catalog"><span class="ic">${icons.shop}</span>ITEM SHOP</a>
      <a class="lb-item" href="#/create"><span class="ic">${icons.create}</span>CREATE</a>
      <a class="lb-item" href="#/friends"><span class="ic">${icons.people}</span>FRIENDS${me.requests?.length ? ` <i class="lb-dot">${me.requests.length}</i>` : ''}</a>
      <a class="lb-item" href="#/suggest"><span class="ic">${icons.bulb}</span>SUGGESTIONS</a>
      <a class="lb-item" href="#/users/${encodeURIComponent(me.name)}"><span class="ic">${icons.award}</span>PROFILE</a>
    </nav>
    <aside class="lb-panel">
      <div class="lb-mode-label">FEATURED MODE</div>
      <div class="lb-chips">
        <button data-m="featured" class="on"><span class="ic">${icons.star}</span> Featured</button>
        <button data-m="obby"><span class="ic">${icons.zap}</span> Obby</button>
        <button data-m="hangout"><span class="ic">${icons.home}</span> Hangout</button>
      </div>
      <div class="lb-feat">
        <div class="lb-feat-thumb"><span>${featThumb}</span></div>
        <h2 class="lb-feat-name">${feat ? esc(feat.name) : 'No games yet'}</h2>
        <div class="lb-feat-meta">${feat ? `By @${esc(feat.creator || 'Funtopia')} · <span class="ic">${icons.people}</span> ${fmt(feat.playing || 0)} playing · <span class="ic">${icons.eye}</span> ${fmt(feat.visits || 0)}` : ''}</div>
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
    <div class="lb-nameplate"><b>${esc(me.name)}</b><span><span class="ic">${icons.award}</span> ${(me.badges || []).length} badges · <span class="ic">${icons.zap}</span> ${me.streak || 0} day streak</span></div>
    <div class="lb-emotes">${[['wave', '👋'], ['dance', '💃'], ['spin', '🌀'], ['bow', '🙇'], ['cheer', '🎉'], ['laugh', '😂'], ['dab', '😎'], ['sit', '🪑'], ['bow', '🫡'], ['dance', '🎸'], ['cheer', '🥳'], ['dab', '🤟']].map(([n, e]) => `<button data-e="${n}" title="${n}">${e}</button>`).join('')}</div>
    <footer class="lb-tiles">
      ${recent ? `<a class="lb-tile" href="#/play/${recent.id}"><span>⏩</span><b>Continue</b><i>${esc(recent.name)}</i></a>` : ''}
      <a class="lb-tile" href="#/discover"><span class="ic">${icons.trophy}</span><b>Charts</b><i>Top games right now</i></a>
      ${party.active ? `<a class="lb-tile" href="#/play/g_party100"><span>🎉</span><b>100 Players Party</b><i>Disco floor, DJ & free hat</i></a>` : ''}
      <a class="lb-tile" href="#/create"><span class="ic">${icons.alert}</span><b>Horror Gauntlet</b><i>Remix the 250-part course</i></a>
    </footer>
    <div class="lb-overlay" id="lb-overlay">
      <button class="lb-ov-close" title="Back to lobby">✕</button>
      <div class="lb-ov-body"></div>
    </div>
  </div>`;

  api('GET', '/api/social/me').then(soc => {
    const tiles = app.querySelector('.lb-tiles'); if (!tiles) return;
    const streak = me.streak || 0;
    const claimable = [7, 14, 30].find(m => streak >= m && !(soc.streakClaims || []).includes(m));
    const tile = document.createElement('div'); tile.className = 'lb-tile';
    if (claimable) {
      tile.innerHTML = `<span class="ic">${icons.gift}</span><b>Streak reward!</b><i>${claimable}-day streak — tap to claim</i>`;
      tile.style.cursor = 'pointer';
      tile.onclick = async () => { try { const r = await api('POST', '/api/social/streak-claim', { milestone: claimable }); toast(`+${r.amount} FunTix streak bonus!`); tile.querySelector('b').textContent = 'Claimed!'; } catch (err) { toast(err.message, true); } };
    } else tile.innerHTML = `<span class="ic">${icons.zap}</span><b>${streak}-day streak</b><i>${streak >= 30 ? 'All streak rewards claimed!' : `Next reward at ${[7, 14, 30].find(m => m > streak) || 30} days`}</i>`;
    tiles.appendChild(tile);
  }).catch(() => {});
  const playBtn = app.querySelector('.lb-play');
  const setFeat = g => {
    feat = g;
    app.querySelector('.lb-feat-name').textContent = g ? g.name : 'No games yet';
    app.querySelector('.lb-feat-meta').textContent = g ? `By @${g.creator || 'Funtopia'} · ${fmt(g.playing || 0)} playing · ${fmt(g.visits || 0)} visits` : '';
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
  podium(0, 0, 2.3, 0xb388ff);
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
  // Owner TV: a big screen at the back of the lobby, only the owner sees it.
  // Tap it to open the Owner Panel.
  if (me.owner) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 288;
    const cx = cv.getContext('2d');
    // Mr. Puzzles theme: dark CRT casing, light static face, color-bar grin.
    cx.fillStyle = '#26262c'; cx.fillRect(0, 0, 512, 288);
    for (let i = 0; i < 500; i++) { cx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.18)'; cx.fillRect(Math.random() * 512, Math.random() * 288, 2, 2); }
    cx.fillStyle = '#d9d9d2';
    cx.beginPath(); cx.roundRect(28, 30, 456, 228, 14); cx.fill();
    for (let i = 0; i < 700; i++) { cx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.12)'; cx.fillRect(30 + Math.random() * 452, 32 + Math.random() * 224, 2, 2); }
    // bowler hat with one straight antenna and one bent antenna
    cx.fillStyle = '#111';
    cx.beginPath(); cx.ellipse(256, 38, 62, 30, 0, Math.PI, 0); cx.fill();
    cx.fillRect(176, 36, 160, 8);
    cx.fillStyle = '#555'; cx.fillRect(206, 26, 100, 6);
    cx.strokeStyle = '#111'; cx.lineWidth = 4; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(232, 12); cx.lineTo(226, 2); cx.stroke();
    cx.beginPath(); cx.moveTo(282, 12); cx.lineTo(296, 4); cx.lineTo(310, 10); cx.stroke();
    cx.beginPath(); cx.arc(226, 2, 4, 0, 7); cx.fill();
    cx.beginPath(); cx.arc(310, 10, 4, 0, 7); cx.fill();
    // mismatched eyes: one big, one small, with a zigzag eyebrow
    cx.fillStyle = '#111';
    cx.beginPath(); cx.arc(185, 102, 26, 0, 7); cx.fill();
    cx.beginPath(); cx.arc(328, 106, 15, 0, 7); cx.fill();
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.arc(193, 94, 8, 0, 7); cx.fill();
    cx.beginPath(); cx.arc(333, 101, 5, 0, 7); cx.fill();
    cx.strokeStyle = '#111'; cx.lineWidth = 4; cx.lineJoin = 'round';
    cx.beginPath(); cx.moveTo(306, 78); cx.lineTo(318, 86); cx.lineTo(330, 78); cx.lineTo(342, 86); cx.stroke();
    // title (kept at the same spot as before)
    cx.textAlign = 'center';
    cx.fillStyle = '#1a1a1f'; cx.font = '900 44px system-ui, sans-serif';
    cx.fillText('OWNER PANEL', 256, 168);
    // big grin with TV color-bar teeth
    const bars = ['#ffd800', '#00c8ff', '#7dff2e', '#ff6da5', '#ff3b30', '#2f6bff'];
    cx.save();
    cx.beginPath(); cx.moveTo(150, 188); cx.quadraticCurveTo(256, 252, 362, 188); cx.quadraticCurveTo(256, 214, 150, 188); cx.closePath(); cx.clip();
    cx.fillStyle = '#1a1a1f'; cx.fillRect(150, 188, 212, 64);
    bars.forEach((c, i) => { cx.fillStyle = c; cx.fillRect(152 + i * 35, 190, 33, 52); });
    cx.restore();
    cx.strokeStyle = '#1a1a1f'; cx.lineWidth = 4;
    cx.beginPath(); cx.moveTo(150, 188); cx.quadraticCurveTo(256, 252, 362, 188); cx.stroke();
    cx.fillStyle = 'rgba(26,26,31,.75)'; cx.font = '600 20px system-ui, sans-serif';
    cx.fillText('tap to open', 256, 252);
    cx.fillStyle = 'rgba(255,255,255,.55)'; cx.font = '700 13px system-ui, sans-serif';
    cx.fillText('P U Z Z L E V I S I O N', 256, 278);
    const tvTex = new THREE.CanvasTexture(cv); tvTex.colorSpace = THREE.SRGBColorSpace;
    const tv = new THREE.Group();
    const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.0, 0.18), new THREE.MeshStandardMaterial({ color: 0x0d0d14, roughness: 0.4, metalness: 0.6 }));
    tv.add(tvFrame);
    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.6), new THREE.MeshBasicMaterial({ map: tvTex, fog: false }));
    tvScreen.position.z = 0.1; tv.add(tvScreen);
    tv.position.set(0, 7.0, -7);
    scene.add(tv);
    const tvRay = new THREE.Raycaster(); const tvPtr = new THREE.Vector2();
    const tvHit = e => { const r = el.getBoundingClientRect(); tvPtr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); tvRay.setFromCamera(tvPtr, camera); return tvRay.intersectObject(tvScreen, false).length > 0; };
    let tvDownX = 0, tvDownY = 0;
    el.addEventListener('pointerdown', e => { tvDownX = e.clientX; tvDownY = e.clientY; });
    el.addEventListener('pointerup', e => { if (Math.hypot(e.clientX - tvDownX, e.clientY - tvDownY) < 6 && tvHit(e)) location.hash = '#/owner'; });
    el.addEventListener('pointermove', e => { if (!dragging) el.style.cursor = tvHit(e) ? 'pointer' : ''; });
  }
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
    let rm = false; try { rm = localStorage.getItem('ff_reduce_motion') === '1'; } catch {}
    if (!dragging && !rm) targetSpin += dt * 0.12;
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
