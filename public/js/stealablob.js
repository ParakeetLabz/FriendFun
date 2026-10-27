// Steal a Blob — Funtopia game mode (original blob characters, no copied assets).
// Deterministic blob spawning (seeded by gameId) + relayed buy/steal/slap events,
// so every client in the room agrees on blobs without server-side game state.
import * as THREE from 'three';

export const SAB_BASES = [
  { x: -22, z: -22 }, { x: 22, z: -22 }, { x: -22, z: 22 }, { x: 22, z: 22 },
  { x: 0, z: -26 }, { x: 0, z: 26 }, { x: -26, z: 0 }, { x: 26, z: 0 },
];
export const SAB_SLOTS = 6;
export function sabSlotPos(baseIdx, slotIdx) {
  const b = SAB_BASES[baseIdx];
  const row = Math.floor(slotIdx / 3), col = slotIdx % 3;
  return { x: b.x + (col - 1) * 4, z: b.z + (row - 0.5) * 4 };
}

const RARITY_W = { common: 60, rare: 25, epic: 10, legendary: 4, mythic: 1 };
export const SAB_BLOBS = [
  { name: 'Bloop', rarity: 'common', price: 50, income: 2, color: '#5ec8f2', hat: null },
  { name: 'Gooey', rarity: 'common', price: 75, income: 3, color: '#7ed957', hat: null },
  { name: 'Pudding', rarity: 'common', price: 100, income: 4, color: '#ff9ecb', hat: null },
  { name: 'Jiggly', rarity: 'rare', price: 250, income: 8, color: '#b07fe8', hat: 'bow' },
  { name: 'Splat', rarity: 'rare', price: 400, income: 12, color: '#ff9f43', hat: null },
  { name: 'Glimmer', rarity: 'epic', price: 800, income: 25, color: '#3ee6c4', hat: 'sparkle' },
  { name: 'Mochi', rarity: 'epic', price: 1200, income: 35, color: '#f5f5f5', hat: 'ears' },
  { name: 'King Blob', rarity: 'legendary', price: 3000, income: 90, color: '#ffd700', hat: 'crown' },
  { name: 'Rainbow Blob', rarity: 'mythic', price: 10000, income: 300, color: '#ff5e8a', hat: 'halo' },
];
const RARITY_COLOR = { common: 0x9aa5b1, rare: 0x4a90e2, epic: 0x9b59e6, legendary: 0xf5b301, mythic: 0xff5e8a };

function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0; return h; }
function mulberry(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pickBlob(rnd) {
  const total = 100;
  let roll = rnd() * total, rarity = 'common';
  for (const [k, w] of Object.entries(RARITY_W)) { roll -= w; if (roll <= 0) { rarity = k; break; } }
  const pool = SAB_BLOBS.filter(b => b.rarity === rarity);
  return pool[Math.floor(rnd() * pool.length)];
}

// --- graphics helpers (canvas textures, shared) ---
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function makeGlowTexture(hex) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const ctx = cv.getContext('2d');
  const gr = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, hex); gr.addColorStop(0.4, hex + 'aa'); gr.addColorStop(1, hex + '00');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128);
  const tx = new THREE.CanvasTexture(cv); return tx;
}
function makeStarTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.beginPath();
  ctx.moveTo(32, 2); ctx.quadraticCurveTo(38, 26, 62, 32); ctx.quadraticCurveTo(38, 38, 32, 62);
  ctx.quadraticCurveTo(26, 38, 2, 32); ctx.quadraticCurveTo(26, 26, 32, 2); ctx.fill();
  return new THREE.CanvasTexture(cv);
}
const STAR_TEX = () => (makeStarTexture._t || (makeStarTexture._t = makeStarTexture()));

function shade(hex, f) {
  const c = new THREE.Color(hex); c.multiplyScalar(f); return c;
}

function buildBlobMesh(b) {
  const g = new THREE.Group();
  const refs = {};
  // glossy jelly body
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: b.color, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.12 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.3, 28, 20), bodyMat);
  body.scale.y = 0.85; body.position.y = 1.3; body.castShadow = true;
  g.add(body); refs.body = body; refs.bodyMat = bodyMat;
  // cartoon gloss shine (upper-left of the face)
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
  shine.scale.set(1, 1.5, 0.3); shine.position.set(-0.55, 1.95, 1.05); g.add(shine);
  // expressive eyes: white + pupil + highlight, grouped for blinking
  refs.eyes = [];
  for (const sx of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(sx * 0.52, 1.68, 1.02);
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    white.scale.z = 0.55; eg.add(white);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 }));
    pupil.position.set(0, 0, 0.2); eg.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.set(0.07, 0.08, 0.34); eg.add(glint);
    g.add(eg); refs.eyes.push(eg);
  }
  // blush cheeks
  for (const sx of [-1, 1]) {
    const ch = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16),
      new THREE.MeshBasicMaterial({ color: 0xff8fab, transparent: true, opacity: 0.55, depthWrite: false }));
    ch.position.set(sx * 0.98, 1.28, 1.02); g.add(ch);
  }
  // mouth: open smile for the soft blobs, classic smile otherwise
  if (b.name === 'Gooey' || b.name === 'Pudding') {
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x5b2233, roughness: 0.6 }));
    mouth.rotation.z = Math.PI; mouth.position.set(0, 1.28, 1.16); g.add(mouth);
  } else {
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.055, 6, 14, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    smile.rotation.z = Math.PI; smile.position.set(0, 1.3, 1.15); g.add(smile);
  }
  // waddly feet + little arms (darker shade of the body)
  const dark = shade(b.color, 0.75);
  refs.feet = []; refs.arms = [];
  for (const sx of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshStandardMaterial({ color: dark, roughness: 0.3 }));
    f.scale.set(1, 0.55, 1.25); f.position.set(sx * 0.55, 0.24, 0.35); f.castShadow = true; g.add(f); refs.feet.push(f);
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), new THREE.MeshStandardMaterial({ color: dark, roughness: 0.3 }));
    a.scale.set(0.7, 1.2, 0.7); a.position.set(sx * 1.28, 1.1, 0.15); g.add(a); refs.arms.push(a);
  }
  // hats, upgraded
  if (b.hat === 'crown') {
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.25 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.68, 0.55, 8), gold);
    c.position.y = 2.55; g.add(c);
    for (let i = 0; i < 3; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 4), gold);
      const ang = (i / 3) * Math.PI * 2;
      spike.position.set(Math.cos(ang) * 0.5, 2.95, Math.sin(ang) * 0.5); g.add(spike);
    }
    for (const sx of [-1, 1]) {
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), new THREE.MeshStandardMaterial({ color: 0xff2d55, emissive: 0xff2d55, emissiveIntensity: 0.7 }));
      gem.position.set(sx * 0.45, 2.55, 0.55); g.add(gem);
    }
  } else if (b.hat === 'bow') {
    const pink = new THREE.MeshStandardMaterial({ color: 0xff5e8a, roughness: 0.4 });
    for (const sx of [-1, 1]) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.13, 8, 16), pink);
      loop.position.set(sx * 0.35, 2.45, 0.55); loop.rotation.z = sx * 0.5; g.add(loop);
    }
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), pink);
    knot.position.set(0, 2.45, 0.6); g.add(knot);
  } else if (b.hat === 'ears') {
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.0, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
      e.position.set(sx * 0.7, 2.45, 0); e.rotation.z = sx * -0.15; g.add(e);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 8), new THREE.MeshStandardMaterial({ color: 0xffb3c8, roughness: 0.5 }));
      inner.position.set(sx * 0.7, 2.4, 0.2); inner.rotation.z = sx * -0.15; g.add(inner);
    }
  } else if (b.hat === 'halo') {
    const hg = new THREE.Group(); hg.position.y = 2.75;
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 8, 28), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.2 }));
    h.rotation.x = Math.PI / 2; hg.add(h);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture('#ffd700'), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.setScalar(2.2); hg.add(glow);
    g.add(hg); refs.halo = hg;
  } else if (b.hat === 'sparkle') {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.38), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x3ee6c4, emissiveIntensity: 1.4 }));
    s.position.y = 2.65; g.add(s); refs.spinHat = s;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture('#3ee6c4'), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.setScalar(2.0); glow.position.y = 2.65; g.add(glow);
  }
  // rarity ring + soft ground glow (pulses in tick)
  const rc = RARITY_COLOR[b.rarity];
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.07, 8, 40), new THREE.MeshStandardMaterial({ color: rc, emissive: rc, emissiveIntensity: 0.8 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; g.add(ring); refs.ring = ring;
  const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(2.3, 24),
    new THREE.MeshBasicMaterial({ map: makeGlowTexture('#' + rc.toString(16).padStart(6, '0')), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  glowDisc.rotation.x = -Math.PI / 2; glowDisc.position.y = 0.06; g.add(glowDisc); refs.glowDisc = glowDisc;
  // orbiting sparkles for epic and up
  if (b.rarity === 'epic' || b.rarity === 'legendary' || b.rarity === 'mythic') {
    const sg = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: STAR_TEX(), color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      const ang = (i / 4) * Math.PI * 2;
      sp.position.set(Math.cos(ang) * 1.9, 1.2 + (i % 2) * 0.9, Math.sin(ang) * 1.9);
      sp.scale.setScalar(0.35); sg.add(sp);
    }
    g.add(sg); refs.sparkles = sg;
  }
  // floating name + price/income label
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160;
  const tex = new THREE.CanvasTexture(cv);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  label.scale.set(4.6, 1.44, 1); label.position.y = 3.9; g.add(label);
  refs.labelCv = cv; refs.labelTex = tex;
  g.userData.refs = refs;
  drawLabel(b, refs);
  return g;
}

function drawLabel(b, refs) {
  refs = refs || b.mesh.userData.refs;
  const cv = refs.labelCv, ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 512, 160);
  const rc = '#' + RARITY_COLOR[b.rarity].toString(16).padStart(6, '0');
  ctx.fillStyle = 'rgba(0,0,0,0.62)'; roundRect(ctx, 8, 8, 496, 144, 28); ctx.fill();
  ctx.strokeStyle = rc; ctx.lineWidth = 6; roundRect(ctx, 8, 8, 496, 144, 28); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 52px sans-serif';
  ctx.fillText(b.name, 256, 66);
  if (b.state === 'walking') {
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 44px sans-serif';
    ctx.fillText('🪙 ' + b.price.toLocaleString(), 256, 128);
  } else {
    ctx.fillStyle = '#7dff8a'; ctx.font = 'bold 44px sans-serif';
    ctx.fillText('💰 ' + b.income + '/s', 256, 128);
  }
  refs.labelTex.needsUpdate = true;
}

export function startStealABlob(game) {
  const seed = hashStr(String(game.o.gameId || 'stealablob'));
  const blobs = new Map(); // spawnIdx -> blob
  const baseByPlayer = new Map(); // playerId -> baseIdx
  const steals = new Map(); // playerId -> { blobId, endsAt }
  let coins = 150, spawnIdx = 0, lastSpawn = 0, lastSlap = 0;
  let mySteal = null; // { blobId, endsAt }

  // HUD
  const hud = document.createElement('div');
  hud.className = 'sab-hud';
  hud.innerHTML = `<span class="sab-pill">🪙 <b class="sab-coins">150</b></span><span class="sab-pill">💰 <b class="sab-inc">0</b>/s</span><span class="sab-pill">🫧 <b class="sab-owned">0</b></span><span class="sab-hint">Click a walking blob to buy · enemy blob to steal · player to slap</span>`;
  const style = document.createElement('style');
  style.textContent = `.sab-hud{position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:5;flex-wrap:wrap;justify-content:center}.sab-pill{background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.2);padding:6px 12px;border-radius:999px;font-size:14px;font-weight:700}.sab-hint{font-size:12px;color:#cfd8e3;align-self:center}`;
  game.c.appendChild(style); game.c.appendChild(hud);
  const coinsEl = hud.querySelector('.sab-coins'), incEl = hud.querySelector('.sab-inc'), ownedEl = hud.querySelector('.sab-owned');

  // one-shot particle bursts (buy / steal celebrations)
  const bursts = [];
  function burst(x, y, z, color) {
    const grp = new THREE.Group();
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: STAR_TEX(), color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.scale.setScalar(0.35 + Math.random() * 0.35);
      s.position.set(x, y, z);
      s.userData.v = new THREE.Vector3((Math.random() - 0.5) * 9, 4 + Math.random() * 5, (Math.random() - 0.5) * 9);
      grp.add(s);
    }
    game.scene.add(grp);
    bursts.push({ grp, t0: Date.now() });
  }
  function tickBursts(dt) {
    const t = Date.now();
    for (const br of [...bursts]) {
      const age = (t - br.t0) / 1000;
      if (age > 0.8) { game.scene.remove(br.grp); bursts.splice(bursts.indexOf(br), 1); continue; }
      for (const s of br.grp.children) {
        s.position.x += s.userData.v.x * dt; s.position.y += s.userData.v.y * dt; s.position.z += s.userData.v.z * dt;
        s.userData.v.y -= 14 * dt;
        s.material.opacity = 1 - age / 0.8;
      }
    }
  }

  function myBase() {
    if (game.myId == null) return 0;
    if (!baseByPlayer.has(game.myId)) {
      const used = new Set(baseByPlayer.values());
      for (let i = 0; i < SAB_BASES.length; i++) if (!used.has(i)) { baseByPlayer.set(game.myId, i); break; }
    }
    return baseByPlayer.get(game.myId) ?? 0;
  }
  function baseFor(pid) {
    if (pid == null) return 0;
    if (!baseByPlayer.has(pid)) {
      const used = new Set(baseByPlayer.values());
      for (let i = 0; i < SAB_BASES.length; i++) if (!used.has(i)) { baseByPlayer.set(pid, i); break; }
    }
    return baseByPlayer.get(pid) ?? 0;
  }
  function freeSlot(baseIdx) {
    for (let s = 0; s < SAB_SLOTS; s++) {
      const taken = [...blobs.values()].some(b => b.base === baseIdx && b.slot === s && (b.state === 'owned' || b.state === 'returning'));
      if (!taken) return s;
    }
    return -1;
  }
  function spawnBlob(idx) {
    const rnd = mulberry(seed + idx * 7919);
    const t = pickBlob(rnd);
    const b = { id: idx, ...t, x: (rnd() - 0.5) * 8, z: -55, state: 'walking', owner: null, base: -1, slot: -1, mesh: null };
    b.mesh = buildBlobMesh(b);
    b.mesh.traverse(o => o.userData.sabBlob = idx);
    game.scene.add(b.mesh);
    blobs.set(idx, b);
  }
  function removeBlob(idx) {
    const b = blobs.get(idx);
    if (b?.mesh) game.scene.remove(b.mesh);
    blobs.delete(idx);
  }
  function refreshHud() {
    const mine = [...blobs.values()].filter(b => b.owner === game.myId && b.state === 'owned');
    coinsEl.textContent = Math.floor(coins).toLocaleString();
    incEl.textContent = mine.reduce((s, b) => s + b.income, 0);
    ownedEl.textContent = mine.length;
  }
  function playerPos(pid) {
    if (pid === game.myId) return game.pos;
    return game.players.get(pid)?.char?.position || null;
  }
  function playerName(pid) {
    if (pid === game.myId) return game.me?.name || 'You';
    return game.players.get(pid)?.name || 'Someone';
  }
  // Wire transport: server.js is at the push size cap, so blob events ride the
  // existing jam relay (server broadcasts any jam track < 20 chars). Format:
  // 'blob:<action>:<id>' — game.js intercepts these before the jam handler.
  function sendBlob(a, b) { game.send({ t: 'jam', track: 'blob:' + a + ':' + b }); }
  function onBlobWire(fromId, track) {
    const parts = track.split(':');
    if (parts.length !== 3) return;
    onBlob({ id: fromId, a: parts[1], b: Number(parts[2]) });
  }

  // --- remote events (from the blob relay) ---
  function onBlob(m) {
    const from = m.id, a = m.a, bid = m.b;
    if (a === 'buy') {
      const b = blobs.get(bid);
      if (!b || b.state !== 'walking') return;
      const base = baseFor(from);
      const slot = freeSlot(base);
      if (slot < 0) return;
      b.state = 'returning'; b.owner = from; b.base = base; b.slot = slot;
      burst(b.x, 1.5, b.z, 0xffd700); drawLabel(b);
      game.sys(`🫧 ${playerName(from)} bought ${b.name}!`);
    } else if (a === 'steal') {
      const b = blobs.get(bid);
      if (!b || b.state !== 'owned') return;
      steals.set(from, { blobId: bid, endsAt: Date.now() + 3000 });
    } else if (a === 'grab') {
      const b = blobs.get(bid);
      if (!b || b.state !== 'owned') return;
      b.state = 'following'; b.thief = from; b.owner = null;
      steals.delete(from);
      burst(b.x, 1.5, b.z, 0xff5e8a); drawLabel(b);
      game.sys(`🫧 ${playerName(from)} grabbed ${b.name}!`);
    } else if (a === 'deliver') {
      const b = blobs.get(bid);
      if (!b || b.state !== 'following') return;
      const base = baseFor(from);
      const slot = freeSlot(base);
      if (slot < 0) { b.state = 'owned'; b.owner = from; b.base = base; b.slot = -1; return; }
      b.state = 'returning'; b.owner = from; b.base = base; b.slot = slot; b.thief = null;
      burst(b.x, 1.5, b.z, 0xffd700); drawLabel(b);
      game.sys(`🫧 ${playerName(from)} stole ${b.name}!`);
    } else if (a === 'slap') {
      const target = bid;
      steals.delete(target);
      if (target === game.myId) {
        // knockback away from the slapper
        const sp = playerPos(from);
        if (sp) {
          const dx = game.pos.x - sp.x, dz = game.pos.z - sp.z;
          const d = Math.max(0.1, Math.hypot(dx, dz));
          game.pos.x += dx / d * 6; game.pos.z += dz / d * 6;
        }
        if (mySteal) { mySteal = null; game.sys('👋 Slapped! Your steal was stopped!'); }
      } else {
        game.sys(`👋 ${playerName(from)} slapped ${playerName(target)}!`);
      }
    }
    refreshHud();
  }

  // --- local actions ---
  function doBuy(b) {
    if (b.state !== 'walking') return;
    if (game.pos.distanceTo(new THREE.Vector3(b.x, game.pos.y, b.z)) > 8) { game.sys('Too far from that blob!'); return; }
    if (coins < b.price) { game.sys('Not enough Blob Coins!'); return; }
    const slot = freeSlot(myBase());
    if (slot < 0) { game.sys('Your base is full!'); return; }
    coins -= b.price;
    b.state = 'returning'; b.owner = game.myId; b.base = myBase(); b.slot = slot;
    burst(b.x, 1.5, b.z, 0xffd700); drawLabel(b);
    sendBlob('buy', b.id);
    game.sys(`🫧 You bought ${b.name}!`);
    refreshHud();
  }
  function doSteal(b) {
    if (b.state !== 'owned' || b.owner === game.myId) return;
    if (game.pos.distanceTo(new THREE.Vector3(b.x, game.pos.y, b.z)) > 8) { game.sys('Too far from that blob!'); return; }
    mySteal = { blobId: b.id, endsAt: Date.now() + 3000 };
    steals.set(game.myId, mySteal);
    sendBlob('steal', b.id);
    game.sys(`🫧 Stealing ${b.name}… stay close!`);
  }
  function doSlap(pid) {
    const now = Date.now();
    if (now - lastSlap < 2000) return;
    lastSlap = now;
    const pp = playerPos(pid);
    if (!pp) return;
    if (game.pos.distanceTo(new THREE.Vector3(pp.x, game.pos.y, pp.z)) > 6) { game.sys('Too far to slap!'); return; }
    sendBlob('slap', pid);
    const stopped = steals.has(pid);
    steals.delete(pid);
    if (stopped) game.sys(`👋 You slapped ${playerName(pid)} and stopped the steal!`);
    else game.sys(`👋 You slapped ${playerName(pid)}!`);
  }

  // --- clicks ---
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let downPos = null;
  function onDown(e) { downPos = [e.clientX, e.clientY]; }
  function onUp(e) {
    if (!downPos) return;
    const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
    downPos = null;
    if (moved > 6) return; // was a camera drag
    if (e.target !== game.canvas) return;
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / innerHeight) * 2 + 1;
    ray.setFromCamera(mouse, game.camera);
    const hits = ray.intersectObjects([...blobs.values()].map(b => b.mesh).filter(Boolean), true);
    if (hits.length) {
      let o = hits[0].object;
      while (o && o.userData.sabBlob === undefined) o = o.parent;
      if (o) {
        const b = blobs.get(o.userData.sabBlob);
        if (b) {
          if (b.state === 'walking') doBuy(b);
          else if (b.state === 'owned' && b.owner !== game.myId) doSteal(b);
          return;
        }
      }
    }
    const phits = ray.intersectObjects([...game.players.values()].map(p => p.char).filter(Boolean), true);
    if (phits.length) {
      // find nearest player to the hit point
      let best = null, bd = 1e9;
      for (const [pid, p] of game.players) {
        const d = p.char.position.distanceTo(phits[0].point);
        if (d < bd) { bd = d; best = pid; }
      }
      if (best != null && bd < 4) doSlap(best);
    }
  }
  game.canvas.addEventListener('pointerdown', onDown);
  game.canvas.addEventListener('pointerup', onUp);

  // --- tick ---
  let lastIncome = 0;
  function tick(dt, now) {
    const t = Date.now();
    // deterministic spawning
    if (t - lastSpawn > 2500) {
      lastSpawn = t;
      const walking = [...blobs.values()].filter(b => b.state === 'walking').length;
      if (walking < 12) spawnBlob(spawnIdx++);
    }
    // my steal timer
    if (mySteal) {
      const sb = blobs.get(mySteal.blobId);
      if (!sb || sb.state !== 'owned' || game.pos.distanceTo(new THREE.Vector3(sb.x, game.pos.y, sb.z)) > 8) {
        mySteal = null; steals.delete(game.myId); // moved away or blob gone: cancel
      } else if (t >= mySteal.endsAt) {
        mySteal = null;
        sb.state = 'following'; sb.thief = game.myId; sb.owner = null;
        burst(sb.x, 1.5, sb.z, 0xff5e8a); drawLabel(sb);
        sendBlob('grab', sb.id);
        game.sys(`🫧 You grabbed ${sb.name}! Run to your base!`);
      }
    }
    // expire stale remote steals
    for (const [pid, s] of steals) if (t > s.endsAt + 1000) steals.delete(pid);
    // blob movement
    for (const b of [...blobs.values()]) {
      if (b.state === 'walking') {
        b.z += 5 * dt;
        if (b.z > 55) removeBlob(b.id);
      } else if (b.state === 'returning') {
        const p = sabSlotPos(b.base, b.slot);
        const dx = p.x - b.x, dz = p.z - b.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.5) { b.x = p.x; b.z = p.z; b.state = 'owned'; }
        else { b.x += dx / d * 8 * dt; b.z += dz / d * 8 * dt; }
      } else if (b.state === 'following') {
        const tp = playerPos(b.thief);
        if (!tp) { b.state = 'owned'; continue; }
        const dx = tp.x - b.x, dz = tp.z - b.z;
        const d = Math.hypot(dx, dz);
        if (d > 2) { b.x += dx / d * 7 * dt; b.z += dz / d * 7 * dt; }
        if (b.thief === game.myId) {
          const bp = SAB_BASES[myBase()];
          if (Math.hypot(game.pos.x - bp.x, game.pos.z - bp.z) < 8) {
            const slot = freeSlot(myBase());
            if (slot >= 0) {
              b.state = 'returning'; b.owner = game.myId; b.base = myBase(); b.slot = slot; b.thief = null;
              burst(b.x, 1.5, b.z, 0xffd700); drawLabel(b);
              sendBlob('deliver', b.id);
              game.sys(`🫧 You stole ${b.name}!`);
            }
          }
        }
      }
      if (b.mesh) {
        const refs = b.mesh.userData.refs;
        const moving = b.state !== 'owned';
        // face movement direction (smooth turn)
        const dx = b.x - (b.px ?? b.x), dz = b.z - (b.pz ?? b.z);
        if (Math.abs(dx) + Math.abs(dz) > 0.001) {
          const target = Math.atan2(dx, dz);
          let d = target - b.mesh.rotation.y;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          b.mesh.rotation.y += d * Math.min(1, dt * 10);
        }
        b.px = b.x; b.pz = b.z;
        // squash & stretch + bob + waddle
        const ph = t / 1000 * (moving ? 7 : 2.2) + b.id * 1.3;
        const sq = Math.sin(ph);
        const sy = 0.85 + sq * (moving ? 0.1 : 0.04);
        refs.body.scale.set(1 - sq * 0.05, sy, 1 - sq * 0.05);
        b.mesh.position.set(b.x, Math.abs(Math.sin(ph)) * 0.18, b.z);
        refs.feet[0].position.y = 0.24 + (moving ? Math.max(0, Math.sin(ph)) * 0.22 : 0);
        refs.feet[1].position.y = 0.24 + (moving ? Math.max(0, Math.sin(ph + Math.PI)) * 0.22 : 0);
        refs.arms[0].rotation.z = Math.sin(ph) * 0.35;
        refs.arms[1].rotation.z = -Math.sin(ph) * 0.35;
        // blink every few seconds
        const blink = ((t / 1000 + b.id * 1.7) % 3.7) < 0.12 ? 0.12 : 1;
        for (const e of refs.eyes) e.scale.y = blink;
        // rarity ring pulse + glow
        refs.ring.material.emissiveIntensity = 0.7 + Math.sin(t / 500 + b.id) * 0.35;
        const gs = 1 + Math.sin(t / 500 + b.id) * 0.08;
        refs.glowDisc.scale.set(gs, gs, 1);
        if (refs.sparkles) refs.sparkles.rotation.y = t / 1000;
        if (refs.halo) { refs.halo.rotation.y = t / 1000 * 0.8; refs.halo.position.y = 2.75 + Math.sin(t / 800) * 0.08; }
        if (refs.spinHat) { refs.spinHat.rotation.y = t / 1000 * 2; refs.spinHat.position.y = 2.65 + Math.sin(t / 700) * 0.1; }
        // rainbow blob cycles hue
        if (b.name === 'Rainbow Blob') refs.bodyMat.color.setHSL(((t / 3000) + b.id * 0.13) % 1, 0.85, 0.6);
      }
    }
    tickBursts(dt);
    // income
    if (t - lastIncome > 1000) {
      lastIncome = t;
      let inc = 0;
      for (const b of blobs.values()) if (b.owner === game.myId && b.state === 'owned') inc += b.income;
      coins += inc;
      refreshHud();
    }
  }
  // seed a few blobs immediately
  for (let i = 0; i < 6; i++) spawnBlob(spawnIdx++);
  refreshHud();
  game.sys('🫧 Steal a Blob! Buy blobs on the conveyor, steal from rivals, slap thieves!');

  return {
    tick,
    onBlob,
    onBlobWire,
    destroy() {
      game.canvas.removeEventListener('pointerdown', onDown);
      game.canvas.removeEventListener('pointerup', onUp);
      for (const b of blobs.values()) if (b.mesh) game.scene.remove(b.mesh);
      for (const br of bursts) game.scene.remove(br.grp);
      bursts.length = 0;
      blobs.clear();
      hud.remove(); style.remove();
    },
  };
}
