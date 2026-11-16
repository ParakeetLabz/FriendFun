// Fortnite-style lobby: your avatar on a 3D podium, friends beside you,
// mode select + a giant PLAY button. Funtopia's own art and characters.
import * as THREE from 'three';
import { buildCharacter, animateCharacter, makeNameTag } from './avatar3d.js?v=a9fd952f';
import { icons } from './icons.js?v=1aa0a4d3';
import { LOGO, displayNameOf, PLAY_LOGO, FAMILY_LOGO } from './ui.js?v=a89886d1';
import { PEPPER_CAN } from './pepper.js?v=57beac3a';

const escH = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Calling All Villains logo, drawn as original inline SVG (purple wordmark + V motif).
const CAV_LOGO = `<svg viewBox="0 0 150 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Calling All Villains"><defs><linearGradient id="cavg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8b4fe"/><stop offset=".55" stop-color="#a855f7"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs><polyline points="2,5 8,15 14,5" fill="none" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="136,5 142,15 148,5" fill="none" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="75" y="11" text-anchor="middle" style="font-size:9px;font-weight:900;letter-spacing:2px" fill="#e9d5ff" font-family="system-ui,sans-serif">ZAM!</text><text x="75" y="24" text-anchor="middle" style="font-size:11px;font-weight:900;letter-spacing:1px" fill="url(#cavg)" font-family="system-ui,sans-serif">CALLING ALL</text><text x="75" y="40" text-anchor="middle" style="font-size:16px;font-weight:900;letter-spacing:1px" fill="url(#cavg)" font-family="system-ui,sans-serif">VILLAINS</text></svg>`;

export async function lobbyPage(D) {
  const { api, esc, fmt, toast, avatarImgTag } = D;
  const me = D.me;
  const hasPepper = (me.inventory || []).includes('theme_drpepper');
  const app = document.getElementById('app');
  app.className = 'fullscreen';
  let games = [], friends = [], party = { active: false }, siteVersion = '1.0';
  try { [games, friends] = await Promise.all([api('GET', '/api/games'), api('GET', '/api/friends').then(r => r.friends || [])]); } catch {}
  try { party = await api('GET', '/api/event/party'); } catch {}
  try { const v = await api('GET', '/api/version'); siteVersion = v.version || '1.0'; } catch {}
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
      <a class="lb-logo" href="#/home"><span class="lb-logo-mark">${hasPepper ? PEPPER_CAN : LOGO}</span><span class="lb-logo-word${hasPepper ? ' lb-logo-pepper' : ''}">${hasPepper ? 'Dr Pepper' : 'FUNTOPIA'}</span><span class="lb-beta">Beta ${esc(siteVersion)}</span></a>
      <div class="lb-top-right">
        <a class="lb-tix" href="#/funtix" title="FunTix"><span class="ic">${hasPepper ? PEPPER_CAN : icons.coins}</span> ${fmt(me.funtix ?? 0)}</a>
        <span class="lb-online" title="Total players"><span class="ic">${icons.people}</span> <b class="player-count">–</b></span>
        <div class="tb-user-wrap">
          <button class="lb-chip" title="Account menu">${avatarImgTag(me.avatar, 'headshot')}<b>${esc(displayNameOf(me))}</b><span>&#9662;</span></button>
          <div class="tb-menu lb-menu hidden">
            <a href="#/users/${encodeURIComponent(me.name)}" class="tb-menu-item"><span class="sb-ico">${icons.profile}</span>View Profile</a>
            <div class="tb-menu-sep"></div>
            <div class="tb-menu-head">Switch account</div>
            <div class="tb-accounts"></div>
            <button class="tb-menu-item tb-add-account"><span class="sb-ico">+</span>Add account</button>
            <div class="tb-menu-sep"></div>
            <button class="tb-menu-item tb-logout"><span class="sb-ico">&#9094;</span>Log out</button>
            <button class="tb-menu-item tb-logout-all"><span class="sb-ico">&#10006;</span>Log out all</button>
          </div>
        </div>
        <a class="lb-iconbtn" href="#/themes" title="Themes"><span class="ic">${icons.palette}</span></a>
        <a class="lb-iconbtn" href="#/settings" title="Settings"><span class="ic">${icons.gear}</span></a>
      </div>
    </header>
    ${party.active ? `<a class="lb-party-banner" href="#/play/g_party100"><span>🎉</span><b>100 Players Party is LIVE!</b> Free Neon Party Hat + disco plaza ›</a>` : ''}
    <nav class="lb-rail">
      <a class="lb-item active" href="#/discover"><span class="ic">${PLAY_LOGO}</span>PLAY</a>
      <a class="lb-item" href="#/avatar"><span class="ic">${icons.avatar}</span>LOCKER</a>
      <a class="lb-item" href="#/catalog"><span class="ic">${icons.shop}</span>ITEM SHOP</a>
      <a class="lb-item" href="#/create"><span class="ic">${icons.create}</span>CREATE</a>
      <a class="lb-item" href="#/friends"><span class="ic">${icons.people}</span>FRIENDS${me.requests?.length ? ` <i class="lb-dot">${me.requests.length}</i>` : ''}</a>
      <a class="lb-item" href="#/family"><span class="ic">${FAMILY_LOGO}</span>FAMILY</a>
      <a class="lb-item" href="#/2ui"><span class="ic">${icons.grid}</span>2UI</a>
      <a class="lb-item" href="#/trades"><span class="ic">${icons.refresh}</span>TRADES</a>
      <a class="lb-item" href="#/pets"><span class="ic">${icons.heart}</span>PETS</a>
      <a class="lb-item" href="#/tokens"><span class="ic">${icons.zap}</span>TOKENS</a>
      <a class="lb-item" href="#/suggest"><span class="ic">${icons.bulb}</span>SUGGESTIONS</a>
      <a class="lb-item" href="#/users/${encodeURIComponent(me.name)}"><span class="ic">${icons.award}</span>PROFILE</a>
      ${me.owner ? `<a class="lb-item lb-cav" href="#/owner" title="Owner Panel">${CAV_LOGO}</a>` : ''}
      ${me.admin && !me.owner ? `<a class="lb-item" href="#/admin"><span class="ic">${icons.shield}</span>ADMIN</a>` : ''}
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
      <button class="lb-play" ${feat ? '' : 'disabled'}>${PLAY_LOGO} PLAY</button>
      <div class="lb-party">
        <div class="lb-mode-label">PARTY</div>
        <div class="lb-party-row">
          <span class="lb-pchip me">${avatarImgTag(me.avatar, 'headshot')}<b>You</b></span>
          ${online.slice(0, 3).map(f => `<span class="lb-pchip">${avatarImgTag(f.avatar, 'headshot')}<b>${esc(f.name)}</b>${f.gameId ? `<a href="#/play/${f.gameId}">Join</a>` : '<i>Online</i>'}</span>`).join('')}
          ${online.length ? '' : '<span class="lb-pempty">No friends online — invite some!</span>'}
        </div>
      </div>
    </aside>
    <div class="lb-nameplate"><b>${esc(displayNameOf(me))}</b>${me.displayName && me.displayName !== me.name ? `<span class="muted small">@${esc(me.name)}</span>` : ''}<span><span class="ic">${icons.award}</span> ${(me.badges || []).length} badges · <span class="ic">${icons.zap}</span> ${me.streak || 0} day streak</span></div>
    <div class="lb-emotes">${[['wave', '👋'], ['dance', '💃'], ['floss', '🕺'], ['spin', '🌀'], ['bow', '🙇'], ['cheer', '🎉'], ['laugh', '😂'], ['dab', '😎'], ['sit', '🪑'], ['salute', '🫡'], ['rock', '🎸'], ['shrug', '🤷']].map(([n, e]) => `<button data-e="${n}" title="${n}">${e}</button>`).join('')}</div>
    <footer class="lb-tiles">
      ${recent ? `<a class="lb-tile" href="#/play/${recent.id}"><span>⏩</span><b>Continue</b><i>${esc(recent.name)}</i></a>` : ''}
      <a class="lb-tile" href="#/discover"><span class="ic">${icons.trophy}</span><b>Charts</b><i>Top games right now</i></a>
      ${party.active ? `<a class="lb-tile" href="#/play/g_party100"><span>🎉</span><b>100 Players Party</b><i>Disco floor, DJ & free hat</i></a>` : ''}
      <a class="lb-tile" href="#/create"><span class="ic">${icons.alert}</span><b>Horror Gauntlet</b><i>Remix the 250-part course</i></a>
    </footer>
    <div class="lb-credit">Made by <b>BoldPStudios</b></div>
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
  window.__openLobbyOverlay = openOverlay;
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
  // stage theme: each app theme (Club) + Dr. Pepper restyles the whole 3D stage
  const STAGE_THEMES = {
    default: { fog: 0x0a0a14, rimR: 0xe8112d, rimV: 0x7c4dff, a: 0x7c4dff, b: 0x22d3ee, c: 0xb388ff },
    pepper: { fog: 0x140505, rimR: 0xe8112d, rimV: 0xffb347, a: 0xffb347, b: 0xe8112d, c: 0xff5a5a },
    roblox: { fog: 0xf2f2f2, rimR: 0x0057a8, rimV: 0xe2231a, a: 0xe2231a, b: 0x0057a8, c: 0xff6b00 },
    rock: { fog: 0x0a0a0a, rimR: 0xff6b00, rimV: 0xc8102e, a: 0xc8102e, b: 0xff6b00, c: 0xff2e2e },
    ocean: { fog: 0x062a3a, rimR: 0x2dd4bf, rimV: 0x0284c7, a: 0x0284c7, b: 0x22d3ee, c: 0x2dd4bf },
    forest: { fog: 0x0d1f0d, rimR: 0x86efac, rimV: 0x16a34a, a: 0x16a34a, b: 0x4ade80, c: 0x86efac },
    sunset: { fog: 0x2a0f1e, rimR: 0xfb923c, rimV: 0xec4899, a: 0xec4899, b: 0xfb923c, c: 0xf472b6 },
    midnight: { fog: 0x0b0f1a, rimR: 0xa78bfa, rimV: 0x3b82f6, a: 0x3b82f6, b: 0x60a5fa, c: 0xa78bfa },
  };
  const currentStageTheme = () => {
    let saved = '';
    try { saved = localStorage.getItem('ff_theme') || ''; } catch {}
    if (me?.club && STAGE_THEMES[saved]) return STAGE_THEMES[saved];
    if (hasPepper) return STAGE_THEMES.pepper;
    return STAGE_THEMES.default;
  };
  // accent materials, registered by role so a theme change recolors the stage live
  const stageMats = [];
  const regAccent = (mat, role) => { stageMats.push({ mat, role }); return mat; };
  let STAGE = currentStageTheme();
  scene.fog = new THREE.Fog(STAGE.fog, 14, 30);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 4.1, 13.8);
  camera.lookAt(0, 2.1, 0);
  scene.add(new THREE.HemisphereLight(0x9db4ff, 0x2a0f14, 0.85));
  const key = new THREE.DirectionalLight(0xfff1d6, 1.6); key.position.set(4, 9, 7); scene.add(key);
  const rimR = new THREE.PointLight(STAGE.rimR, 60, 30); rimR.position.set(-7, 3.5, -4); scene.add(rimR);
  const rimV = new THREE.PointLight(STAGE.rimV, 55, 30); rimV.position.set(7, 2.5, -5); scene.add(rimV);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(26, 48), new THREE.MeshStandardMaterial({ color: 0x101017, roughness: 0.35, metalness: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.5; scene.add(floor);
  // glowing rings flat on the floor
  const floorRing = (r, role, op) => {
    const c = STAGE[role];
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 8, 64), regAccent(new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.2, transparent: true, opacity: op }), role));
    m.rotation.x = Math.PI / 2; m.position.y = -0.48; scene.add(m); return m;
  };
  floorRing(8, 'a', 0.8);
  floorRing(12, 'b', 0.4);
  // top spotlight washing the stage
  const spot = new THREE.SpotLight(0xfff1d6, 60, 30, 0.55, 0.6, 1);
  spot.position.set(0, 12, 4); spot.target.position.set(0, 0, 0); scene.add(spot); scene.add(spot.target);
  const stage = new THREE.Group(); scene.add(stage);
  // center stage: two tiers, top tier surface at y=0 so the character stands on it
  const tierMat = new THREE.MeshStandardMaterial({ color: 0x1c1e28, roughness: 0.4, metalness: 0.5 });
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.7, 0.5, 48), tierMat);
  tier1.position.y = -0.75; stage.add(tier1);
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 0.5, 48), tierMat);
  tier2.position.y = -0.25; stage.add(tier2);
  const glowRing = (r, y, role) => {
    const c = STAGE[role];
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 10, 64), regAccent(new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.8 }), role));
    m.rotation.x = Math.PI / 2; m.position.y = y; stage.add(m); return m;
  };
  glowRing(3.4, -0.48, 'a');
  glowRing(2.5, 0.02, 'c');
  const podium = (x, z, r, role) => {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, 0.5, 40), new THREE.MeshStandardMaterial({ color: 0x1c1e28, roughness: 0.4, metalness: 0.5 }));
    disc.position.y = -0.25; g.add(disc);
    const c = STAGE[role];
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, 0.055, 10, 48), regAccent(new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.6 }), role));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; g.add(ring);
    g.position.set(x, 0, z); stage.add(g); return g;
  };
  podium(-5.7, -0.9, 1.7, 'a'); podium(5.7, -0.9, 1.7, 'a');
  // floating halos + crystals (decor, rotates with the stage)
  const floaters = [];
  const halo = (x, y, z, r, role) => {
    const c = STAGE[role];
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 8, 48), regAccent(new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.4, transparent: true, opacity: 0.9 }), role));
    m.position.set(x, y, z); stage.add(m); floaters.push({ m, baseY: y, speed: 0.5 + Math.random() * 0.4, phase: Math.random() * 6.28, spin: 0.3 }); return m;
  };
  halo(-4.2, 3.2, -2.5, 0.9, 'a');
  halo(4.2, 3.8, -2.5, 0.9, 'b');
  halo(0, 5.2, -4, 1.2, 'c');
  const crystal = (x, y, z, s, role) => {
    const c = STAGE[role];
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(s), regAccent(new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.6 }), role));
    m.position.set(x, y, z); stage.add(m); floaters.push({ m, baseY: y, speed: 0.6 + Math.random() * 0.5, phase: Math.random() * 6.28, spin: 0.5 }); return m;
  };
  crystal(-3.4, 2.2, 1.8, 0.35, 'a');
  crystal(3.4, 2.6, 1.8, 0.35, 'b');
  crystal(-6.5, 3.0, -3.5, 0.28, 'c');
  crystal(6.5, 2.4, -3.5, 0.28, 'a');
  // floating dust / stars
  const pGeo = new THREE.BufferGeometry();
  const pCount = 220;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 30;
    pPos[i * 3 + 1] = Math.random() * 9;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const stars = new THREE.Points(pGeo, regAccent(new THREE.PointsMaterial({ color: STAGE.c, size: 0.09, transparent: true, opacity: 0.8 }), 'c'));
  scene.add(stars);
  // light beams from above
  const beam = (x, z, role) => {
    const c = STAGE[role];
    const m = new THREE.Mesh(new THREE.ConeGeometry(1.6, 9, 24, 1, true), regAccent(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }), role));
    m.position.set(x, 4.5, z); scene.add(m); return m;
  };
  beam(0, 0, 'a');
  beam(-5.7, -0.9, 'b');
  beam(5.7, -0.9, 'b');
  // live stage recolor — called when a theme is picked (themes page / applyTheme)
  window.__setLobbyStage = () => {
    STAGE = currentStageTheme();
    scene.fog.color.setHex(STAGE.fog);
    rimR.color.setHex(STAGE.rimR);
    rimV.color.setHex(STAGE.rimV);
    for (const { mat, role } of stageMats) {
      mat.color.setHex(STAGE[role]);
      if (mat.emissive) mat.emissive.setHex(STAGE[role]);
    }
  };
  const chars = [];
  const addChar = (avatar, name, x, z, s) => {
    try {
      const c = buildCharacter(avatar, { gear: false });
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
    let rm = false; try { rm = localStorage.getItem('ff_reduce_motion') === '1'; } catch {}
    if (!dragging && !rm) targetSpin += dt * 0.12;
    spin += (targetSpin - spin) * Math.min(1, dt * 6);
    stage.rotation.y = spin;
    floaters.forEach(f => { f.m.position.y = f.baseY + Math.sin(t * f.speed + f.phase) * 0.35; f.m.rotation.y += dt * f.spin; f.m.rotation.x += dt * f.spin * 0.5; });
    stars.rotation.y = t * 0.02;
    if (myEmote !== 'idle' && t >= emoteEnd) { myEmote = 'idle'; app.querySelectorAll('.lb-emotes button').forEach(x => x.classList.remove('on')); }
    chars.forEach((c, i) => { animateCharacter(c, i === 0 ? myEmote : 'idle', t + i * 1.7, dt); const p = c.userData.pet; if (p) p.position.y = Math.abs(Math.sin(t * 2.5 + i * 1.7)) * 0.18; });
    renderer.render(scene, camera);
  };
  tick();
  D.setCleanup(() => {
    cancelAnimationFrame(raf);
    removeEventListener('resize', resize);
    if (window.__setLobbyStage) delete window.__setLobbyStage;
    renderer.dispose();
    holder.innerHTML = '';
  });
}
