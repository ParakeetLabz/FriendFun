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

function buildBlobMesh(b) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, 20, 14),
    new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.25 })
  );
  body.scale.y = 0.85; body.position.y = 1.3;
  g.add(body);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    eye.position.set(sx * 0.5, 1.6, 1.05); g.add(eye);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 6, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  smile.rotation.z = Math.PI; smile.position.set(0, 1.25, 1.15); g.add(smile);
  if (b.hat === 'crown') {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.7, roughness: 0.3 }));
    c.position.y = 2.55; g.add(c);
  } else if (b.hat === 'bow') {
    const bo = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.2), new THREE.MeshStandardMaterial({ color: 0xff5e8a }));
    bo.position.set(0, 2.4, 0.6); bo.rotation.z = 0.3; g.add(bo);
  } else if (b.hat === 'ears') {
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      e.position.set(sx * 0.7, 2.4, 0); g.add(e);
    }
  } else if (b.hat === 'halo') {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 8, 24), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.8 }));
    h.rotation.x = Math.PI / 2; h.position.y = 2.7; g.add(h);
  } else if (b.hat === 'sparkle') {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x3ee6c4, emissiveIntensity: 1 }));
    s.position.y = 2.6; g.add(s);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.06, 8, 32), new THREE.MeshStandardMaterial({ color: RARITY_COLOR[b.rarity], emissive: RARITY_COLOR[b.rarity], emissiveIntensity: 0.6 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.1; g.add(ring);
  return g;
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
      game.sys(`🫧 ${playerName(from)} grabbed ${b.name}!`);
    } else if (a === 'deliver') {
      const b = blobs.get(bid);
      if (!b || b.state !== 'following') return;
      const base = baseFor(from);
      const slot = freeSlot(base);
      if (slot < 0) { b.state = 'owned'; b.owner = from; b.base = base; b.slot = -1; return; }
      b.state = 'returning'; b.owner = from; b.base = base; b.slot = slot; b.thief = null;
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
              sendBlob('deliver', b.id);
              game.sys(`🫧 You stole ${b.name}!`);
            }
          }
        }
      }
      if (b.mesh) {
        b.mesh.position.set(b.x, Math.sin(t / 500 + b.id) * 0.15, b.z);
        b.mesh.rotation.y = t / 1000 * 0.5;
      }
    }
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
      blobs.clear();
      hud.remove(); style.remove();
    },
  };
}
