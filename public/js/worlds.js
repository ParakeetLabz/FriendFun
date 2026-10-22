// World generators shared by server (seeding) and client (studio templates).
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

let nextId = 1;
function part(p, s, c, extra = {}) {
  return { id: 'p' + (nextId++), name: extra.name || 'Part', p, s, c, k: 'part', m: 'plastic', ...extra };
}
function startWorld(sky = '#8fc8ff') { nextId = 1; return { sky, parts: [] }; }

export function baseplate() {
  const w = startWorld();
  w.parts.push(part([0, -0.5, 0], [256, 1, 256], '#a3a2a5', { name: 'Baseplate', m: 'baseplate' }));
  w.parts.push(part([0, 0.25, 0], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  return w;
}

export function obby() {
  const w = startWorld('#9fd6ff');
  const r = rng(42);
  const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c'];
  w.parts.push(part([0, -40, 0], [2000, 1, 2000], '#ff3b1f', { name: 'Lava', k: 'kill', m: 'neon' }));
  w.parts.push(part([0, 0, 0], [24, 2, 24], '#d9d9d9', { name: 'StartPlatform' }));
  w.parts.push(part([0, 1.25, 0], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  let z = -12, y = 0, x = 0;
  for (let stage = 1; stage <= 16; stage++) {
    const col = colors[stage % colors.length];
    const type = stage % 7;
    if (type === 1) { // jumps + coin arc
      for (let i = 0; i < 6; i++) { z -= 8 + r() * 3; x += (r() - 0.5) * 8; y += r() < 0.4 ? 2 : 0; w.parts.push(part([x, y, z], [5, 1, 5], col)); if (i % 2 === 0) w.parts.push(part([x, y + 3, z], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin' })); }
    } else if (type === 2) { // kill brick walkway + moving sweeper
      z -= 22; w.parts.push(part([x, y, z], [8, 1, 36], col, { name: 'Walkway' }));
      for (let i = 0; i < 5; i++) w.parts.push(part([x + (i % 2 ? 2 : -2), y + 0.75, z - 14 + i * 7], [4, 0.5, 1.5], '#ff2020', { name: 'KillBrick', k: 'kill', m: 'neon' }));
      w.parts.push(part([x, y + 1.5, z + 6], [2.5, 2, 3], '#ff2020', { name: 'Sweeper', k: 'kill', m: 'neon', mv: { a: 'x', d: 3, s: 1.3 } }));
      z -= 18;
    } else if (type === 3) { // truss climb / stairs up
      for (let i = 0; i < 7; i++) { z -= 5; y += 2.2; w.parts.push(part([x, y, z], [6, 1, 3], col, { name: 'Step' })); }
    } else if (type === 4) { // bounce pads
      z -= 10; w.parts.push(part([x, y, z], [6, 1, 6], '#22ff88', { name: 'BouncePad', k: 'bounce', m: 'neon' }));
      z -= 14; y += 10; w.parts.push(part([x, y, z], [8, 1, 8], col));
    } else if (type === 5) { // moving platforms over the lava — ride them!
      for (let i = 0; i < 3; i++) {
        z -= 12;
        w.parts.push(part([x, y, z], [6, 1, 6], col, { name: 'Mover' + i, mv: { a: 'x', d: 6, s: 0.8 + i * 0.15, ph: i * 1.3 } }));
        w.parts.push(part([x, y + 3, z], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin' }));
      }
      z -= 4;
    } else if (type === 6) { // blink bridge — platforms that vanish, time your steps!
      for (let i = 0; i < 5; i++) {
        z -= 9;
        w.parts.push(part([x, y, z], [5, 1, 5], col, { name: 'Blink' + i, blink: { on: 2.4, off: 1.2, ph: i * 0.9 } }));
      }
      z -= 4;
    } else { // thin beams
      for (let i = 0; i < 3; i++) { z -= 12; w.parts.push(part([x, y, z], [1.5, 1, 14], col, { name: 'Beam' })); }
      z -= 10;
    }
    z -= 10;
    w.parts.push(part([x, y, z], [12, 1, 12], '#efefef', { name: 'Stage' + stage }));
    w.parts.push(part([x, y + 0.75, z], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint' + stage, k: 'checkpoint', m: 'neon' }));
    w.parts.push(part([x + 4, y + 2.5, z + 4], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin' }));
    w.parts.push(part([x - 5, y + 2, z - 5], [0.6, 4, 0.6], '#546e7a', { name: 'LampPost', m: 'metal' }));
    w.parts.push(part([x - 5, y + 4.4, z - 5], [1.4, 0.8, 1.4], '#ffecb3', { name: 'Lamp', m: 'neon' }));
    if (stage % 4 === 0) w.parts.push(part([x + 3, y + 3, z - 3], [2, 5, 2], '#7c4dff', { name: 'Stage Guard', k: 'npc', enemy: true, dialog: '👹 No passing! This is MY stage!' }));
  }
  z -= 14;
  w.parts.push(part([x, y, z], [20, 1, 20], '#ffd700', { name: 'WinPlatform', m: 'neon' }));
  w.parts.push(part([x, y + 0.75, z], [8, 0.5, 8], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
  return w;
}

export function gauntlet() {
  const w = startWorld('#0b0512');
  w.light = { tod: 0.5, ambient: 0.8, fog: 0.6 };
  const stone = '#3a3a4a', stone2 = '#2a2a35', blood = '#8f0f16', pumpkin = '#ff7518';
  const P = (x, y, z, sx, sy, sz, c, extra = {}) => w.parts.push(part([x, y, z], [sx, sy, sz], c, extra));
  const coin = (x, y, z) => P(x, y, z, 1.2, 1.2, 1.2, '#ffd400', { name: 'Coin', k: 'coin' });
  const tomb = (x, top, z) => { P(x, top + 1.5, z, 2, 3, 0.6, '#6b6f7a', { name: 'Tombstone', m: 'concrete' }); P(x, top + 3.4, z, 2.6, 0.8, 0.7, '#7d818c', { name: 'TombTop', m: 'concrete' }); };
  const tree = (x, top, z) => { P(x, top + 3.5, z, 1.2, 7, 1.2, '#3a2a1e', { name: 'DeadTrunk', m: 'wood' }); P(x, top + 8, z, 6, 2.5, 6, '#10130c', { name: 'DeadCanopy' }); };
  const zoneEnd = (x, z, n) => { P(x, 4, z, 14, 1, 14, stone2, { name: 'ZoneEnd' + n, m: 'concrete' }); P(x, 4.75, z, 5, 0.5, 5, '#2ec4ff', { name: 'Checkpoint' + n, k: 'checkpoint', m: 'neon' }); };

  // ---- the blood lake (fall in = doom) ----
  P(0, -30, -330, 700, 1, 900, blood, { name: 'BloodLake', k: 'kill', m: 'neon' });

  // ---- start: the gate ----
  P(0, 0, 12, 26, 2, 26, stone2, { name: 'StartPlatform', m: 'concrete' });
  P(0, 1.25, 14, 6, 0.5, 6, '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' });
  P(-8, 6.5, 2, 2, 11, 2, stone, { name: 'GatePillar', m: 'concrete' });
  P(8, 6.5, 2, 2, 11, 2, stone, { name: 'GatePillar', m: 'concrete' });
  P(-8, 12.4, 2, 1.6, 0.8, 1.6, pumpkin, { name: 'PumpkinLamp', m: 'neon' });
  P(8, 12.4, 2, 1.6, 0.8, 1.6, pumpkin, { name: 'PumpkinLamp', m: 'neon' });
  P(0, 12, 2, 18, 1.5, 2, stone, { name: 'GateBeam', m: 'concrete' });
  P(-11, 3, 20, 0.5, 4, 0.5, '#4a3226', { name: 'SignPost', m: 'wood' });
  P(-11, 5.5, 20, 5, 2, 0.4, '#4a3226', { name: 'Sign', m: 'wood' });
  P(5, 3.5, 18, 2, 5, 2, '#5c6bc0', { name: 'Gatekeeper', k: 'npc', dialog: '🎃 Welcome to the Horror Gauntlet, mortal. Five zones of terror await — few return!', wander: false });
  for (let fx = -12; fx <= 12; fx += 4) P(fx, 2, 25, 0.5, 2, 0.5, '#23202c', { name: 'FencePost', m: 'wood' });
  tree(-10, 1, 6); tree(11, 1, 20);

  // ---- Zone 1: Graveyard Steps ----
  const steps = [[0, 0, -10], [-3, 1, -20], [3, 1, -30], [0, 2, -40], [-4, 2, -50], [4, 3, -60], [0, 3, -70], [0, 4, -80]];
  steps.forEach(([sx, sy, sz], i) => {
    P(sx, sy, sz, 7, 1, 7, i % 2 ? stone : stone2, { name: 'GraveStep' + i, m: 'concrete' });
    tomb(sx + (i % 2 ? 2.4 : -2.4), sy + 0.5, sz + 2.4);
    if (i === 2 || i === 5) tree(sx - 2.4, sy + 0.5, sz - 2.4);
    if (i % 2 === 1) coin(sx, sy + 3.5, sz);
  });
  // side graveyard island (optional loot detour)
  P(24, -0.5, -45, 34, 1, 44, '#23202c', { name: 'Graveyard', m: 'concrete' });
  for (let gx = 0; gx < 3; gx++) for (let gz = 0; gz < 3; gz++) tomb(14 + gx * 9, 0, -30 - gz * 10);
  P(24, 3, -64, 14, 6, 1, stone, { name: 'CryptWall', m: 'concrete' });
  P(17.5, 3, -58, 1, 6, 12, stone, { name: 'CryptWall', m: 'concrete' });
  P(30.5, 3, -58, 1, 6, 12, stone, { name: 'CryptWall', m: 'concrete' });
  P(19, 3, -52, 4, 6, 1, stone, { name: 'CryptWall', m: 'concrete' });
  P(29, 3, -52, 4, 6, 1, stone, { name: 'CryptWall', m: 'concrete' });
  P(24, 5.25, -52, 14, 1.5, 1, stone, { name: 'CryptLintel', m: 'concrete' });
  P(24, 6.5, -58, 15, 1, 13, '#1c1a24', { name: 'CryptRoof', m: 'concrete' });
  P(24, 1, -60, 4, 2, 3, '#ffd400', { name: 'GoldChest', m: 'neon' });
  coin(21, 2.5, -58); coin(27, 2.5, -58); coin(24, 2.5, -55);
  tree(38, 0, -28); tree(10, 0, -62);
  for (let fx = 9; fx <= 39; fx += 6) P(fx, 1, -24, 0.5, 2, 0.5, '#23202c', { name: 'FencePost', m: 'wood' });
  zoneEnd(0, -92, 1);
  tomb(-5, 4.5, -95); tree(5, 4.5, -89);

  // ---- Zone 2: Blood Lake Crossing (moving platforms) ----
  const movers = [
    { a: 'x', d: 6, s: 0.9, ph: 0 }, { a: 'x', d: 6, s: 1.1, ph: 2 }, { a: 'y', d: 2, s: 0.8, ph: 0 },
    { a: 'x', d: 7, s: 1.25, ph: 4 }, { a: 'x', d: 5, s: 1.0, ph: 1 },
  ];
  movers.forEach((mv, i) => {
    const mz = -108 - i * 11;
    P(0, 4, mz, 7, 1, 7, i % 2 ? '#4a4a5e' : stone, { name: 'LakeMover' + i, m: 'concrete', mv });
    coin(0, 7.5, mz);
  });
  zoneEnd(0, -166, 2);
  tree(-4, 4.5, -169); tomb(4, 4.5, -163); coin(-4, 7.5, -160); coin(4, 7.5, -172);

  // ---- Zone 3: Blink Bridge ----
  const blinks = [[-181, 0], [-192, 0.85], [-203, 1.7], [-230, 2.55], [-241, 3.4], [-252, 4.25]];
  blinks.forEach(([bz, ph], i) => P(0, 4, bz, 6, 1, 6, i % 2 ? '#5e4a6e' : '#4a3a5e', { name: 'Blink' + i, blink: { on: 2.6, off: 1.3, ph } }));
  coin(0, 7.5, -192); coin(0, 7.5, -241);
  P(0, 4, -216, 12, 1, 12, stone, { name: 'MidPlatform', m: 'concrete' });
  P(0, 5.25, -216, 3, 1.5, 4, '#ff2020', { name: 'MidSweeper', k: 'kill', m: 'neon', mv: { a: 'x', d: 3.2, s: 1.5 } });
  coin(0, 8, -216);
  for (const fx of [-5, 5]) for (const fz of [-221, -211]) P(fx, 5.5, fz, 0.5, 2, 0.5, '#23202c', { name: 'FencePost', m: 'wood' });
  zoneEnd(0, -266, 3);
  tree(-5, 4.5, -269); tomb(5, 4.5, -263);

  // ---- Zone 4: Sweeper Corridor ----
  P(0, 4, -306, 10, 1, 56, stone2, { name: 'Corridor', m: 'concrete' });
  [-292, -308, -324].forEach((sz, i) => P(0, 5.25, sz, 3, 1.5, 4, '#ff2020', { name: 'Sweeper' + i, k: 'kill', m: 'neon', mv: { a: 'x', d: 3.2, s: 1.4 + i * 0.2, ph: i * 1.1 } }));
  P(-2.5, 4.75, -300, 3, 0.5, 2, '#ff2020', { name: 'KillStrip', k: 'kill', m: 'neon' });
  P(2.5, 4.75, -316, 3, 0.5, 2, '#ff2020', { name: 'KillStrip', k: 'kill', m: 'neon' });
  for (let rz = -282; rz >= -330; rz -= 8) { P(-4.6, 5.75, rz, 0.5, 2.5, 0.5, '#23202c', { name: 'RailPost', m: 'wood' }); P(4.6, 5.75, rz, 0.5, 2.5, 0.5, '#23202c', { name: 'RailPost', m: 'wood' }); }
  P(-4.6, 7, -306, 0.4, 0.4, 54, '#4a3226', { name: 'Rail', m: 'wood' });
  P(4.6, 7, -306, 0.4, 0.4, 54, '#4a3226', { name: 'Rail', m: 'wood' });
  for (const az of [-288, -306, -324]) {
    P(-5.4, 8, az, 0.6, 7, 0.6, stone, { name: 'ArchPost', m: 'concrete' });
    P(5.4, 8, az, 0.6, 7, 0.6, stone, { name: 'ArchPost', m: 'concrete' });
    P(0, 11.6, az, 11.4, 0.8, 0.8, stone, { name: 'ArchBeam', m: 'concrete' });
  }
  P(9, 4, -308, 6, 1, 6, stone, { name: 'HealAlcove', m: 'concrete' });
  P(9, 5.6, -308, 1.6, 1.6, 1.6, '#ff5b5b', { name: 'HealPack', k: 'heal', m: 'neon' });
  tomb(10.5, 4.5, -311);
  coin(0, 7.5, -296); coin(0, 7.5, -312); coin(0, 7.5, -328);
  zoneEnd(0, -346, 4);
  tomb(-5, 4.5, -349); tree(5, 4.5, -343);

  // ---- Zone 5: The Haunted Tower ----
  P(0, 4, -368, 20, 1, 20, stone2, { name: 'TowerBase', m: 'concrete' });
  P(0, 4.75, -368, 5, 0.5, 5, '#2ec4ff', { name: 'Checkpoint5', k: 'checkpoint', m: 'neon' });
  tomb(-7, 4.5, -374); tree(7, 4.5, -362);
  P(0, 4, -380, 16, 1, 10, stone, { name: 'TowerBridge', m: 'concrete' });
  for (const fx of [-7, 7]) for (const fz of [-376, -384]) P(fx, 5.5, fz, 0.5, 2, 0.5, '#23202c', { name: 'FencePost', m: 'wood' });
  P(0, 30, -388, 9, 56, 9, '#26222e', { name: 'TowerCore', m: 'concrete' });
  for (const cx of [-4.5, 4.5]) for (const cz of [-392.5, -383.5]) P(cx, 30, cz, 1.2, 56, 1.2, stone, { name: 'TowerTrim', m: 'concrete' });
  P(4.65, 20, -388, 0.3, 2, 1.2, '#b366ff', { name: 'Window', m: 'neon' });
  P(4.65, 40, -388, 0.3, 2, 1.2, '#b366ff', { name: 'Window', m: 'neon' });
  P(-4.65, 30, -388, 0.3, 2, 1.2, pumpkin, { name: 'Window', m: 'neon' });
  P(-4.65, 48, -388, 0.3, 2, 1.2, pumpkin, { name: 'Window', m: 'neon' });
  // elevator (bonus coin ride up the front side — hop on from the bridge)
  P(13, 4, -380, 6, 1, 6, stone, { name: 'ElevatorLedge', m: 'concrete' });
  P(13, 20, -380, 6, 1, 6, '#4a4a5e', { name: 'Elevator', m: 'metal', mv: { a: 'y', d: 13, s: 0.5 } });
  coin(13, 22, -380); coin(13, 30, -380);
  // spiral climb
  const landings = {};
  for (let i = 0; i <= 16; i++) {
    const a = i * 0.62, sx = Math.cos(a) * 9, sz = -388 + Math.sin(a) * 9, sy = 7.5 + i * 3.3;
    const big = i === 5 || i === 11;
    P(sx, sy, sz, big ? 8 : 5, 1, big ? 8 : 5, i % 2 ? stone : '#4a4a5e', { name: 'TowerStep' + i, m: 'concrete' });
    if (big) landings[i] = [sx, sy, sz];
    if (i % 3 === 0) coin(sx, sy + 3, sz);
  }
  P(landings[5][0] + 1.5, landings[5][1] + 3, landings[5][2] + 1.5, 2, 5, 2, '#7c4dff', { name: 'Tower Guard', k: 'npc', enemy: true, dialog: '👹 The tower is MINE!' });
  P(landings[11][0] - 1.5, landings[11][1] + 3, landings[11][2] - 1.5, 2, 5, 2, '#c4281c', { name: 'Tower Warden', k: 'npc', enemy: true, dialog: '👹 Almost there... too bad you will NOT make it!' });
  P(landings[11][0], landings[11][1] + 0.75, landings[11][2], 4, 0.5, 4, '#2ec4ff', { name: 'CheckpointMid', k: 'checkpoint', m: 'neon' });
  // summit
  P(0, 60, -388, 6, 4, 6, '#26222e', { name: 'Pedestal', m: 'concrete' });
  P(0, 62, -388, 18, 1, 18, '#1c1a24', { name: 'WinPlatform', m: 'concrete' });
  P(0, 62.75, -388, 8, 0.5, 8, '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' });
  for (let k = 0; k < 8; k++) coin(Math.cos(k * Math.PI / 4) * 6.5, 65, -388 + Math.sin(k * Math.PI / 4) * 6.5);
  for (const bx of [-8, 8]) for (const bz of [-396, -380]) P(bx, 64, bz, 1, 3, 1, stone, { name: 'Battlement', m: 'concrete' });
  P(0, 62.6, -379.5, 18, 0.3, 0.6, pumpkin, { name: 'Trim', m: 'neon' });
  P(0, 62.6, -396.5, 18, 0.3, 0.6, pumpkin, { name: 'Trim', m: 'neon' });
  return w;
}

export function hangout() {
  const w = startWorld('#a8dcff');
  const r = rng(7);
  w.parts.push(part([0, -0.5, 0], [300, 1, 300], '#4caf50', { name: 'Grass', m: 'grass' }));
  w.parts.push(part([0, 0.05, 0], [12, 0.1, 300], '#555a60', { name: 'Road', m: 'concrete' }));
  w.parts.push(part([0, 0.06, 0], [300, 0.1, 12], '#555a60', { name: 'Road', m: 'concrete' }));
  w.parts.push(part([16, 0.25, 16], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  // fountain
  w.parts.push(part([30, 1, 30], [14, 2, 14], '#cfcfcf', { name: 'Fountain', m: 'concrete' }));
  w.parts.push(part([30, 2.05, 30], [12, 0.1, 12], '#3fa9f5', { name: 'Water', m: 'glass', cc: false, tr: 0.3 }));
  w.parts.push(part([30, 4, 30], [2, 6, 2], '#cfcfcf', { name: 'FountainTop', m: 'concrete' }));
  // houses
  const houseColors = ['#e07a5f', '#f2cc8f', '#81b29a', '#9a8c98', '#e9c46a', '#a8dadc'];
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1, along = -120 + (i >> 1) * 55;
    const hx = side * 28, hz = along, col = houseColors[i % houseColors.length];
    const W = 16, D = 14, H = 10;
    w.parts.push(part([hx, 0.25, hz], [W + 2, 0.5, D + 2], '#8d6e63', { name: 'Floor', m: 'wood' }));
    w.parts.push(part([hx, H / 2, hz - D / 2], [W, H, 1], col, { name: 'Wall', m: 'brick' }));
    w.parts.push(part([hx - W / 2, H / 2, hz], [1, H, D], col, { name: 'Wall', m: 'brick' }));
    w.parts.push(part([hx + W / 2, H / 2, hz], [1, H, D], col, { name: 'Wall', m: 'brick' }));
    w.parts.push(part([hx - 5, H / 2, hz + D / 2], [6, H, 1], col, { name: 'Wall', m: 'brick' }));
    w.parts.push(part([hx + 5, H / 2, hz + D / 2], [6, H, 1], col, { name: 'Wall', m: 'brick' }));
    w.parts.push(part([hx, H - 1.5, hz + D / 2], [4, 3, 1], col, { name: 'Wall', m: 'brick' }));
    w.parts.push(part([hx, H + 0.5, hz], [W + 3, 1, D + 3], '#5d4037', { name: 'Roof', m: 'wood' }));
    w.parts.push(part([hx, H + 2, hz], [W - 2, 2, D - 2], '#6d4c41', { name: 'Roof', m: 'wood' }));
    w.parts.push(part([hx + 4, 1, hz - 4], [4, 1.5, 2], '#3949ab', { name: 'Couch' }));
  }
  // trees
  for (let i = 0; i < 40; i++) {
    const tx = (r() - 0.5) * 260, tz = (r() - 0.5) * 260;
    if (Math.abs(tx) < 45 && Math.abs(tz) < 140) continue;
    const h = 6 + r() * 6;
    w.parts.push(part([tx, h / 2, tz], [1.6, h, 1.6], '#6d4c41', { name: 'Trunk', m: 'wood' }));
    w.parts.push(part([tx, h + 2, tz], [7, 5, 7], '#2e7d32', { name: 'Leaves', m: 'grass' }));
  }
  // benches & coins
  for (let i = 0; i < 6; i++) w.parts.push(part([-10, 1, -60 + i * 25], [2, 1, 6], '#795548', { name: 'Bench', m: 'wood' }));
  for (let i = 0; i < 20; i++) w.parts.push(part([(r() - 0.5) * 200, 2, (r() - 0.5) * 200], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin' }));
  // stage
  w.parts.push(part([-50, 1.5, 50], [30, 3, 18], '#37474f', { name: 'Stage', m: 'wood' }));
  w.parts.push(part([-50, 10, 41], [30, 1, 1], '#ff00aa', { name: 'Lights', m: 'neon' }));
  return w;
}

export function tower() {
  const w = startWorld('#ffb4a2');
  const r = rng(99);
  w.parts.push(part([0, -0.5, 0], [200, 1, 200], '#455a64', { name: 'Ground', m: 'concrete' }));
  w.parts.push(part([0, 0.25, 22], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  w.parts.push(part([0, 60, 0], [10, 120, 10], '#263238', { name: 'TowerCore', m: 'concrete' }));
  const cols = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#9b5de5'];
  let a = 0, y = 2;
  for (let i = 0; i < 60; i++) {
    a += 0.5 + r() * 0.2; y += 2;
    const rad = 10;
    const kind = i % 15 === 14 ? 'checkpoint' : (i % 7 === 3 ? 'kill' : 'part');
    w.parts.push(part([Math.cos(a) * rad, y, Math.sin(a) * rad], [4, 1, 4], kind === 'kill' ? '#ff1f1f' : kind === 'checkpoint' ? '#2ec4ff' : cols[(i / 12) | 0],
      { name: kind === 'kill' ? 'KillBrick' : kind === 'checkpoint' ? 'Checkpoint' : 'Step', k: kind, m: kind === 'part' ? 'plastic' : 'neon' }));
    if (kind === 'kill') { a += 0.55; y += 0; w.parts.push(part([Math.cos(a) * rad, y, Math.sin(a) * rad], [4, 1, 4], cols[(i / 12) | 0], { name: 'Step' })); }
    if (i % 5 === 0) w.parts.push(part([Math.cos(a) * rad, y + 2.5, Math.sin(a) * rad], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin' }));
  }
  w.parts.push(part([0, 121, 0], [16, 1, 16], '#ffd700', { name: 'Top', m: 'neon' }));
  w.parts.push(part([0, 121.75, 0], [6, 0.5, 6], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
  return w;
}

export function coinRush() {
  const w = startWorld('#c3f0ff');
  const r = rng(1234);
  w.parts.push(part([0, -30, 0], [2000, 1, 2000], '#1e88e5', { name: 'Water', k: 'kill', m: 'glass', tr: 0.2 }));
  w.parts.push(part([0, 0, 0], [20, 2, 20], '#fdd835', { name: 'Island', m: 'sand' }));
  w.parts.push(part([0, 1.25, 0], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  for (let branch = 0; branch < 4; branch++) {
    let ang = branch * Math.PI / 2, d = 10, y = 0;
    for (let i = 0; i < 12; i++) {
      ang += (r() - 0.5) * 0.6; d += 9 + r() * 3; y = Math.max(-4, y + ((r() * 5) | 0) - 1);
      const px = Math.cos(ang) * d, pz = Math.sin(ang) * d, sz = 5 + r() * 4;
      w.parts.push(part([px, y, pz], [sz, 1, sz], `hsl(${(r() * 360) | 0},70%,60%)`, { name: 'Platform' }));
      w.parts.push(part([px, y + 2.5, pz], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin' }));
      if (i % 5 === 4) w.parts.push(part([px + sz / 2 - 1.3, y + 0.75, pz], [2.2, 0.5, 2.2], '#ff9800', { name: 'SpeedPad', k: 'speed', m: 'neon' }));
    }
  }
  return w;
}

export function soccerField() {
  const w = startWorld('#87ceeb');
  // Field
  w.parts.push(part([0, -0.5, 0], [60, 1, 40], '#3a9e3a', { name: 'Field', m: 'grass' }));
  // Center line
  w.parts.push(part([0, 0.05, 0], [0.5, 0.1, 40], '#ffffff', { name: 'CenterLine' }));
  w.parts.push(part([0, 0.05, 0], [8, 0.1, 8], '#ffffff', { name: 'CenterCircle', k: 'part' }));
  // Goals (two ends)
  for (const sx of [-1, 1]) {
    const gx = sx * 28;
    w.parts.push(part([gx, 1.5, -4], [0.5, 3, 0.5], '#ffffff', { name: 'GoalPostL' }));
    w.parts.push(part([gx, 1.5, 4], [0.5, 3, 0.5], '#ffffff', { name: 'GoalPostR' }));
    w.parts.push(part([gx, 3, 0], [0.5, 0.5, 8.5], '#ffffff', { name: 'GoalBar' }));
    // Goal detection zone
    w.parts.push(part([gx + sx * 1, 1, 0], [2, 2, 8], '#ffeb3b', { name: sx < 0 ? 'GoalBlue' : 'GoalRed', k: 'score', team: sx < 0 ? 'blue' : 'red', m: 'neon', tr: 0.5 }));
  }
  // Ball (spawns at center)
  w.parts.push(part([0, 1, 0], [1.5, 1.5, 1.5], '#ffffff', { name: 'Ball', k: 'ball', m: 'smooth' }));
  // Spawn areas
  w.parts.push(part([-20, 0.25, 0], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  w.soccer = true;
  return w;
}

export function mysteryMansion() {
  const w = startWorld('#1a1a2e');
  // Mansion floor
  w.parts.push(part([0, -0.5, 0], [40, 1, 40], '#5d4037', { name: 'Floor', m: 'wood' }));
  // Walls (four rooms)
  const wallC = '#4e342e';
  w.parts.push(part([0, 3, -20], [40, 6, 1], wallC, { name: 'WallN' }));
  w.parts.push(part([0, 3, 20], [40, 6, 1], wallC, { name: 'WallS' }));
  w.parts.push(part([-20, 3, 0], [1, 6, 40], wallC, { name: 'WallW' }));
  w.parts.push(part([20, 3, 0], [1, 6, 40], wallC, { name: 'WallE' }));
  // Interior dividers (rooms)
  w.parts.push(part([-10, 3, 0], [1, 6, 20], wallC, { name: 'Divider1' }));
  w.parts.push(part([10, 3, 0], [1, 6, 20], wallC, { name: 'Divider2' }));
  // Clues (5 hidden items)
  const clues = ['Fingerprint', 'Footprint', 'Note', 'Key', 'Photo'];
  const positions = [[-15, 1, -15], [15, 1, -15], [-15, 1, 15], [15, 1, 15], [0, 1, 0]];
  clues.forEach((name, i) => {
    w.parts.push(part(positions[i], [1, 1, 1], '#ffd400', { name: 'Clue_' + name, k: 'clue', m: 'neon' }));
  });
  w.parts.push(part([0, 0.25, 18], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  w.mystery = { clues: 5 };
  return w;
}

export function garden() {
  const w = startWorld('#aee2ff');
  // Grass base
  w.parts.push(part([0, -0.5, 0], [50, 1, 50], '#7cb342', { name: 'Grass', m: 'grass' }));
  // Soil plots (3x3 grid)
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      w.parts.push(part([x * 8, 0.1, z * 8], [6, 0.2, 6], '#5d4037', { name: `Plot_${x}_${z}`, k: 'plot', m: 'soil' }));
    }
  }
  // Water pond
  w.parts.push(part([18, 0.1, 18], [8, 0.2, 8], '#4fc3f7', { name: 'Pond', m: 'water', tr: 0.3 }));
  // Fence
  for (let i = -24; i <= 24; i += 6) {
    w.parts.push(part([i, 1, -24], [0.5, 2, 0.5], '#8d6e63', { name: 'Fence' }));
    w.parts.push(part([i, 1, 24], [0.5, 2, 0.5], '#8d6e63', { name: 'Fence' }));
  }
  w.parts.push(part([0, 0.25, -20], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  w.garden = true;
  return w;
}

export const templates = { baseplate, obby, hangout, tower, coinRush, shooterArena, shooterFort, shooterRooftop, soccerField, mysteryMansion, garden, gauntlet, blockverse: bvPortal, bvPlaza };

export function shooterArena() {
  const w = startWorld('#ff9e57');
  w.shooter = true;
  w.parts.push(part([0, -0.5, 0], [70, 1, 70], '#8d8d94', { name: 'ArenaFloor' }));
  const wh = 8;
  w.parts.push(part([0, wh / 2, -35], [70, wh, 2], '#5c5c66', { name: 'WallN' }));
  w.parts.push(part([0, wh / 2, 35], [70, wh, 2], '#5c5c66', { name: 'WallS' }));
  w.parts.push(part([-35, wh / 2, 0], [2, wh, 70], '#5c5c66', { name: 'WallW' }));
  w.parts.push(part([35, wh / 2, 0], [2, wh, 70], '#5c5c66', { name: 'WallE' }));
  for (const [x, z] of [[-12, -12], [12, -12], [-12, 12], [12, 12], [0, -18], [0, 18], [-18, 0], [18, 0], [-6, 6], [6, -6]])
    w.parts.push(part([x, 2, z], [4, 4, 4], '#a1887f', { name: 'Crate', m: 'wood' }));
  w.parts.push(part([0, 1, 0], [10, 2, 10], '#78909c', { name: 'Platform' }));
  w.parts.push(part([0, 3.5, 0], [4, 1, 4], '#ffd400', { name: 'TopPad', m: 'neon' }));
  for (const [x, z] of [[-28, -28], [28, -28], [-28, 28], [28, 28]])
    w.parts.push(part([x, 0.25, z], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  return w;
}

export function shooterFort() {
  const w = startWorld('#87ceeb');
  w.parts.push(part([0, -0.5, 0], [90, 1, 90], '#7da87b', { name: 'Field' }));
  for (const s of [-1, 1]) {
    const z = s * 30;
    w.parts.push(part([0, 3, z], [24, 6, 2], '#8d6e63', { name: 'FortWall', m: 'brick' }));
    w.parts.push(part([-12, 3, z - s * 6], [2, 6, 14], '#8d6e63', { name: 'FortSide', m: 'brick' }));
    w.parts.push(part([12, 3, z - s * 6], [2, 6, 14], '#8d6e63', { name: 'FortSide', m: 'brick' }));
    w.parts.push(part([0, 5, z + s * 4], [6, 10, 6], '#6d4c41', { name: 'Tower', m: 'wood' }));
    w.parts.push(part([0, 10.5, z + s * 4], [8, 1, 8], '#5d4037', { name: 'TowerTop', m: 'wood' }));
    w.parts.push(part([-8, 0.25, z + s * 8], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
    w.parts.push(part([8, 0.25, z + s * 8], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  }
  for (const [x, z] of [[-10, 0], [10, 0], [0, -8], [0, 8]])
    w.parts.push(part([x, 1.5, z], [6, 3, 2], '#a1887f', { name: 'Barrier', m: 'wood' }));
  return w;
}

export function shooterRooftop() {
  const w = startWorld('#1a1a2e');
  const roofs = [[0, 0, 0, 26], [-22, 2, -14, 18], [22, 2, 14, 18], [-20, 4, 16, 14], [20, 4, -16, 14], [0, 6, -28, 12]];
  for (const [x, y, z, s] of roofs) {
    w.parts.push(part([x, y - 0.5, z], [s, 1, s], '#4a4a5a', { name: 'Roof' }));
    w.parts.push(part([x, y + 0.25, z], [4, 0.5, 4], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
    w.parts.push(part([x + s / 4, y + 1, z - s / 4], [3, 2, 3], '#5c5c66', { name: 'ACUnit' }));
  }
  w.parts.push(part([-11, 2.2, -7], [16, 0.6, 3], '#6a6a7a', { name: 'Bridge' }));
  w.parts.push(part([11, 2.2, 7], [16, 0.6, 3], '#6a6a7a', { name: 'Bridge' }));
  w.parts.push(part([0, 6.2, -14], [4, 0.6, 16], '#6a6a7a', { name: 'Bridge' }));
  w.parts.push(part([0, -30, 0], [300, 1, 300], '#ff3b1f', { name: 'Void', k: 'kill', m: 'neon' }));
  return w;
}


// ============ SPOOKY RIVALS ARENA (1v1 tournament, Oct 2026) ============
export function spookyRivals() {
  const w = startWorld('#160a2e');
  w.shooter = true;
  w.tourney = true;
  // floor + walls
  w.parts.push(part([0, -0.5, 0], [54, 1, 54], '#23232e', { name: 'ArenaFloor' }));
  const wh = 8;
  w.parts.push(part([0, wh / 2, -27], [54, wh, 2], '#3a2a5a', { name: 'WallN' }));
  w.parts.push(part([0, wh / 2, 27], [54, wh, 2], '#3a2a5a', { name: 'WallS' }));
  w.parts.push(part([-27, wh / 2, 0], [2, wh, 54], '#3a2a5a', { name: 'WallW' }));
  w.parts.push(part([27, wh / 2, 0], [2, wh, 54], '#3a2a5a', { name: 'WallE' }));
  // purple neon trim on walls
  for (const [x, z, sx, sz] of [[0, -26, 54, 0.4], [0, 26, 54, 0.4], [-26, 0, 0.4, 54], [26, 0, 0.4, 54]])
    w.parts.push(part([x, wh + 0.2, z], [sx, 0.4, sz], '#b388ff', { name: 'NeonTrim', m: 'neon', cc: false }));
  // giant moon (decor)
  w.parts.push(part([0, 38, -60], [16, 16, 2], '#fff8e1', { name: 'Moon', m: 'neon', cc: false }));
  // center: giant glowing jack-o-lantern on a platform
  w.parts.push(part([0, 1, 0], [10, 2, 10], '#4a4a5a', { name: 'CenterPlatform' }));
  w.parts.push(part([0, 4.5, 0], [5, 5, 5], '#e67e22', { name: 'BigPumpkin', m: 'plastic' }));
  w.parts.push(part([0, 7.4, 0], [1, 1.2, 1], '#2e7d32', { name: 'Stem', m: 'plastic' }));
  w.parts.push(part([-1.2, 5.2, 2.6], [1, 1, 0.3], '#ffca28', { name: 'EyeL', m: 'neon', cc: false }));
  w.parts.push(part([1.2, 5.2, 2.6], [1, 1, 0.3], '#ffca28', { name: 'EyeR', m: 'neon', cc: false }));
  w.parts.push(part([0, 3.6, 2.6], [2.4, 0.8, 0.3], '#ffca28', { name: 'Mouth', m: 'neon', cc: false }));
  // cover crates
  for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10], [-16, 0], [16, 0]])
    w.parts.push(part([x, 2, z], [4, 4, 4], '#6d4c41', { name: 'Crate', m: 'wood' }));
  // gravestones
  for (const [x, z, ry] of [[-6, -16, 0.3], [6, -16, -0.2], [-6, 16, -0.3], [6, 16, 0.2]]) {
    w.parts.push(part([x, 1.5, z], [2.4, 3, 0.8], '#9e9e9e', { name: 'Gravestone', m: 'plastic' }));
    void ry;
  }
  // dead trees
  for (const [tx, tz] of [[-20, -20], [20, 20], [-20, 20], [20, -20]]) {
    w.parts.push(part([tx, 3, tz], [1.2, 6, 1.2], '#4e342e', { name: 'DeadTree', m: 'wood' }));
    w.parts.push(part([tx + 1.2, 5.5, tz], [2.8, 0.8, 0.8], '#4e342e', { name: 'Branch', m: 'wood' }));
    w.parts.push(part([tx - 1.2, 6.5, tz], [2.4, 0.8, 0.8], '#4e342e', { name: 'Branch', m: 'wood' }));
  }
  // small pumpkins with glow
  for (const [px, pz] of [[-14, 6], [14, -6], [-8, 20], [8, -20]]) {
    w.parts.push(part([px, 1, pz], [2, 2, 2], '#e67e22', { name: 'Pumpkin', m: 'plastic' }));
    w.parts.push(part([px, 2.4, pz], [0.5, 0.6, 0.5], '#2e7d32', { name: 'Stem', m: 'plastic' }));
  }
  // ghost lights on posts
  for (const [lx, lz] of [[-22, 0], [22, 0], [0, -22], [0, 22]]) {
    w.parts.push(part([lx, 3, lz], [0.8, 6, 0.8], '#222', { name: 'LampPost', m: 'plastic' }));
    w.parts.push(part([lx, 6.5, lz], [1.6, 1.6, 1.6], '#b388ff', { name: 'GhostLight', m: 'neon', cc: false }));
  }
  // spawns: opposite ends
  w.parts.push(part([0, 0.25, -22], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  w.parts.push(part([0, 0.25, 22], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  return w;
}

// ============ ORIGINAL HALLOWEEN WORLDS (hand-designed, Oct 2026) ============
// Helper: floating candy coin
function candy(w, x, y, z) {
  w.parts.push(part([x, y, z], [1.2, 1.2, 1.2], '#ffd400', { name: 'Candy', k: 'coin' }));
}

// 1. HAUNTED MANSION ESCAPE - room-by-room obby through a spooky mansion
export function hwMansion() {
  const w = startWorld('#14141f');
  w.parts.push(part([0, -20, -130], [400, 1, 400], '#05050c', { name: 'Abyss', k: 'kill', m: 'neon' }));
  // FOYER
  w.parts.push(part([0, -1, 0], [28, 2, 28], '#5a5a6e', { name: 'FoyerFloor', m: 'concrete' }));
  w.parts.push(part([0, 0.25, 10], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    w.parts.push(part([sx * 11, 4, sz * 11], [2.5, 10, 2.5], '#3d3d52', { name: 'Pillar', m: 'brick' }));
  w.parts.push(part([0, 9.5, 13], [28, 2, 2], '#3d3d52', { name: 'EntryArch', m: 'brick' }));
  candy(w, -6, 2, 0); candy(w, 6, 2, 0); candy(w, 0, 2, -8);
  // STAGE 1: hallway of floating rugs over the abyss
  const rugs = [[0, -22], [3, -30], [-3, -38], [2, -46], [-2, -54], [0, -62]];
  for (const [x, z] of rugs) {
    w.parts.push(part([x, -0.5, z], [7, 1, 7], '#7d2e3e', { name: 'Rug' }));
    candy(w, x, 1, z);
  }
  w.parts.push(part([0, 0, -70], [10, 1, 10], '#4a4a5e', { name: 'Landing1', m: 'concrete' }));
  w.parts.push(part([0, 0.75, -70], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint1', k: 'checkpoint', m: 'neon' }));
  // STAGE 2: library bookshelf climb
  const shelfC = ['#8b4513', '#a0522d', '#7a3b1f'], bookC = ['#c0392b', '#2980b9', '#27ae60'];
  let sy = 0;
  for (let i = 0; i < 6; i++) {
    const z = -80 - i * 6, left = i % 2 === 0;
    sy += 2.5;
    w.parts.push(part([left ? -3 : 3, sy - 0.5, z], [10, 1, 5], shelfC[i % 3], { name: 'Shelf' + i, m: 'wood' }));
    w.parts.push(part([left ? 5 : -5, sy + 1, z], [1.2, 2.5, 4], bookC[i % 3], { name: 'Books' + i, m: 'plastic' }));
    candy(w, left ? -3 : 3, sy + 1, z);
  }
  w.parts.push(part([0, sy, -116], [12, 1, 8], '#4a4a5e', { name: 'Landing2', m: 'concrete' }));
  w.parts.push(part([0, sy + 0.75, -116], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint2', k: 'checkpoint', m: 'neon' }));
  // STAGE 3: dining hall - long table with floating plates
  const dy = sy + 0.5;
  w.parts.push(part([0, dy - 0.5, -140], [8, 1, 36], '#6d4c41', { name: 'DiningTable', m: 'wood' }));
  for (let i = 0; i < 6; i++) {
    const pz = -126 - i * 6, px = i % 2 ? 2.5 : -2.5;
    w.parts.push(part([px, dy + 2.5, pz], [3, 0.6, 3], '#ecf0f1', { name: 'Plate' + i, m: 'glass' }));
    candy(w, px, dy + 4, pz);
  }
  w.parts.push(part([0, dy + 12, -140], [1, 5, 1], '#444', { name: 'Chain' }));
  w.parts.push(part([0, dy + 9, -140], [6, 1, 6], '#f1c40f', { name: 'Chandelier', m: 'neon' }));
  w.parts.push(part([0, dy, -162], [12, 1, 8], '#4a4a5e', { name: 'Landing3', m: 'concrete' }));
  w.parts.push(part([0, dy + 0.75, -162], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint3', k: 'checkpoint', m: 'neon' }));
  // STAGE 4: attic beams with cursed portraits to dodge
  const by = dy + 1;
  for (let i = 0; i < 5; i++) {
    const bz = -172 - i * 7;
    w.parts.push(part([i % 2 ? 1.5 : -1.5, by, bz], [2, 1, 10], '#5d4037', { name: 'Beam' + i, m: 'wood' }));
    if (i < 4) w.parts.push(part([i % 2 ? -2.5 : 2.5, by + 1.5, bz - 3.5], [2, 2, 0.5], '#ff2020', { name: 'CursedPortrait' + i, k: 'kill', m: 'neon' }));
  }
  w.parts.push(part([0, by, -206], [12, 1, 10], '#4a4a5e', { name: 'Landing4', m: 'concrete' }));
  w.parts.push(part([0, by + 0.75, -206], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint4', k: 'checkpoint', m: 'neon' }));
  // ROOFTOP FINALE
  w.parts.push(part([0, by + 2.5, -214], [8, 1, 6], '#3d3d52', { name: 'RoofStep1', m: 'brick' }));
  w.parts.push(part([0, by + 5, -221], [10, 1, 8], '#3d3d52', { name: 'RoofStep2', m: 'brick' }));
  w.parts.push(part([0, by + 6.5, -232], [20, 1, 20], '#ffd700', { name: 'RoofWin', m: 'neon' }));
  w.parts.push(part([0, by + 7.25, -232], [8, 0.5, 8], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
  w.parts.push(part([60, 60, -260], [12, 12, 2], '#f4f1de', { name: 'Moon', m: 'neon', cc: false }));
  return w;
}

// 2. PUMPKIN PATCH HUNT - candy hunt among giant pumpkins + corn maze
export function hwPumpkin() {
  const w = startWorld('#1b1030');
  const r = rng(20261031);
  w.parts.push(part([0, -0.5, 0], [220, 1, 220], '#1e3d1e', { name: 'Field', m: 'grass' }));
  w.parts.push(part([0, 0.25, 95], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  // fence around the patch
  for (let i = -5; i <= 5; i++) {
    w.parts.push(part([i * 20, 1.5, 105], [1, 3, 1], '#5d4037', { name: 'Fence', m: 'wood' }));
    w.parts.push(part([i * 20, 1.5, -105], [1, 3, 1], '#5d4037', { name: 'Fence', m: 'wood' }));
    w.parts.push(part([105, 1.5, i * 20], [1, 3, 1], '#5d4037', { name: 'Fence', m: 'wood' }));
    w.parts.push(part([-105, 1.5, i * 20], [1, 3, 1], '#5d4037', { name: 'Fence', m: 'wood' }));
  }
  // giant pumpkins (hand-placed ring + scattered)
  const pumpkins = [[-40, -40], [40, -40], [-40, 40], [40, 40], [0, -60], [-60, 0], [60, 0], [0, 60], [-25, -75], [25, 75]];
  for (const [px, pz] of pumpkins) {
    const s = 5 + r() * 2;
    w.parts.push(part([px, s / 2, pz], [s, s, s], '#e67e22', { name: 'Pumpkin', m: 'plastic' }));
    w.parts.push(part([px, s + 0.6, pz], [1, 1.2, 1], '#2e7d32', { name: 'Stem', m: 'plastic' }));
    // glowing face on two of them
    if ((px + pz) % 3 === 0) {
      w.parts.push(part([px, s * 0.65, pz + s / 2 + 0.1], [1, 1, 0.2], '#ffca28', { name: 'GlowEye', m: 'neon', cc: false }));
    }
    candy(w, px, s + 1.8, pz); // candy on top
    candy(w, px + s, 1.2, pz + s);
  }
  // corn maze (hand-designed simple maze, walls 6 tall)
  const mazeC = '#c9a227';
  const walls = [
    [0, -10, 40, 2], [0, 10, 40, 2], [-20, 0, 2, 22], [20, 0, 2, 22],
    [-10, -20, 22, 2], [10, 20, 22, 2], [-30, -10, 2, 22], [30, 10, 2, 22],
  ];
  for (const [x, z, sx, sz] of walls) {
    w.parts.push(part([x, 3, z - 40], [sx, 6, sz], mazeC, { name: 'CornWall', m: 'grass' }));
    candy(w, x, 7, z - 40);
  }
  // scarecrows
  for (const [sx, sz] of [[-70, -70], [70, 70], [-70, 70]]) {
    w.parts.push(part([sx, 2.5, sz], [1, 5, 1], '#5d4037', { name: 'ScarePole', m: 'wood' }));
    w.parts.push(part([sx, 4, sz], [5, 1, 1], '#5d4037', { name: 'ScareArms', m: 'wood' }));
    w.parts.push(part([sx, 5.5, sz], [2, 2, 2], '#f2cc8f', { name: 'ScareHead' }));
    w.parts.push(part([sx, 6.8, sz], [2.6, 0.8, 2.6], '#7a3b1f', { name: 'ScareHat', m: 'plastic' }));
    candy(w, sx, 8, sz);
  }
  // dead trees
  for (let i = 0; i < 8; i++) {
    const tx = (r() - 0.5) * 180, tz = (r() - 0.5) * 180;
    if (Math.abs(tx) < 50 && Math.abs(tz + 40) < 50) continue;
    w.parts.push(part([tx, 4, tz], [1.5, 8, 1.5], '#4a3728', { name: 'DeadTrunk', m: 'wood' }));
    w.parts.push(part([tx + 2, 7, tz], [4, 1, 1], '#4a3728', { name: 'Branch', m: 'wood' }));
    w.parts.push(part([tx - 2, 6, tz], [4, 1, 1], '#4a3728', { name: 'Branch', m: 'wood' }));
  }
  // scattered candy
  for (let i = 0; i < 15; i++) candy(w, (r() - 0.5) * 170, 1.2, (r() - 0.5) * 170);
  // haunted barn (decorative shell you can walk into)
  w.parts.push(part([-80, 0.25, -80], [24, 0.5, 20], '#6d4c41', { name: 'BarnFloor', m: 'wood' }));
  w.parts.push(part([-80, 5, -90], [24, 10, 1], '#7a3b1f', { name: 'BarnWall', m: 'wood' }));
  w.parts.push(part([-92, 5, -80], [1, 10, 20], '#7a3b1f', { name: 'BarnWall', m: 'wood' }));
  w.parts.push(part([-68, 5, -80], [1, 10, 20], '#7a3b1f', { name: 'BarnWall', m: 'wood' }));
  w.parts.push(part([-80, 10.5, -80], [26, 1, 22], '#5d4037', { name: 'BarnRoof', m: 'wood' }));
  for (let i = 0; i < 4; i++) candy(w, -88 + i * 5, 1.5, -80);
  return w;
}

// 3. WITCH'S TOWER CLIMB - crooked tower, themed floors
export function hwWitch() {
  const w = startWorld('#101826');
  const r = rng(777);
  w.parts.push(part([0, -0.5, 0], [160, 1, 160], '#1c2b1c', { name: 'Ground', m: 'grass' }));
  w.parts.push(part([0, 0.25, 30], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  // crooked tower core (stacked offset rings)
  let cx = 0, cz = 0, y = 0;
  const towerCols = ['#3a3a4a', '#43435a', '#33333f'];
  for (let f = 0; f < 8; f++) {
    cx += (r() - 0.5) * 4; cz += (r() - 0.5) * 4; // crooked lean
    const hh = 12;
    // ring walls (4 sides with a door gap on alternating sides)
    const s = 16 - f; // tower narrows as it rises
    const gapSide = f % 4;
    if (gapSide !== 0) w.parts.push(part([cx, y + hh / 2, cz - s / 2], [s, hh, 1.5], towerCols[f % 3], { name: 'TowerWall', m: 'brick' }));
    if (gapSide !== 1) w.parts.push(part([cx, y + hh / 2, cz + s / 2], [s, hh, 1.5], towerCols[f % 3], { name: 'TowerWall', m: 'brick' }));
    if (gapSide !== 2) w.parts.push(part([cx - s / 2, y + hh / 2, cz], [1.5, hh, s], towerCols[f % 3], { name: 'TowerWall', m: 'brick' }));
    if (gapSide !== 3) w.parts.push(part([cx + s / 2, y + hh / 2, cz], [1.5, hh, s], towerCols[f % 3], { name: 'TowerWall', m: 'brick' }));
    y += hh;
  }
  // FLOOR 1: potion cellar - big potion bottle platforms spiraling up
  const potionC = ['#9b59b6', '#2ecc71', '#e74c3c', '#3498db'];
  let a = 0, py = 2;
  for (let i = 0; i < 10; i++) {
    a += 0.65; py += 2.2;
    const px = Math.cos(a) * 9, pz = Math.sin(a) * 9;
    w.parts.push(part([px, py, pz], [4, 1, 4], potionC[i % 4], { name: 'Potion' + i, m: 'glass' }));
    w.parts.push(part([px, py + 1.2, pz], [1.5, 1.5, 1.5], potionC[i % 4], { name: 'PotionTop' + i, m: 'neon', cc: false }));
    if (i % 3 === 0) candy(w, px, py + 2, pz);
  }
  w.parts.push(part([Math.cos(a) * 9, py + 0.75, Math.sin(a) * 9], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint1', k: 'checkpoint', m: 'neon' }));
  // FLOOR 2: broomstick beams (thin, with cursed gaps)
  const by = py + 3;
  for (let i = 0; i < 8; i++) {
    a += 0.55; const rad = 8;
    const bx = Math.cos(a) * rad, bz = Math.sin(a) * rad;
    w.parts.push(part([bx, by + i * 1.8, bz], [1.2, 1, 7], '#8b5a2b', { name: 'Broom' + i, m: 'wood' }));
    if (i % 4 === 3) w.parts.push(part([bx, by + i * 1.8 + 0.75, bz], [1.2, 0.5, 2], '#ff2020', { name: 'Curse' + i, k: 'kill', m: 'neon' }));
    candy(w, bx, by + i * 1.8 + 1.5, bz);
  }
  const cy = by + 8 * 1.8;
  w.parts.push(part([Math.cos(a) * 8, cy + 0.75, Math.sin(a) * 8], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint2', k: 'checkpoint', m: 'neon' }));
  // FLOOR 3: giant spellbook steps
  const bookC = ['#8e44ad', '#16a085', '#d35400'];
  for (let i = 0; i < 7; i++) {
    a += 0.6; const rad = 7;
    const bx = Math.cos(a) * rad, bz = Math.sin(a) * rad, bz2 = cy + 3 + i * 2.4;
    w.parts.push(part([bx, bz2, bz], [6, 1, 4], bookC[i % 3], { name: 'Spellbook' + i, m: 'plastic' }));
    w.parts.push(part([bx, bz2 + 0.8, bz], [4.5, 0.6, 3], '#f4f1de', { name: 'Pages' + i, cc: false }));
    candy(w, bx, bz2 + 1.6, bz);
  }
  const ty = cy + 3 + 7 * 2.4;
  w.parts.push(part([Math.cos(a) * 7, ty + 0.75, Math.sin(a) * 7], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint3', k: 'checkpoint', m: 'neon' }));
  // FLOOR 4: crystal platforms to the cauldron
  for (let i = 0; i < 6; i++) {
    a += 0.7; const rad = 6 - i * 0.5;
    const px = Math.cos(a) * rad, pz = Math.sin(a) * rad, pz2 = ty + 2 + i * 2.2;
    w.parts.push(part([px, pz2, pz], [3.5, 1, 3.5], '#af7ac5', { name: 'Crystal' + i, m: 'neon' }));
    candy(w, px, pz2 + 1.5, pz);
  }
  // CAULDRON TOP with win pad
  const wy = ty + 2 + 6 * 2.2 + 2;
  w.parts.push(part([0, wy, 0], [14, 1, 14], '#2c2c3a', { name: 'TopPlatform', m: 'concrete' }));
  w.parts.push(part([0, wy + 1.5, 0], [8, 3, 8], '#1a1a1a', { name: 'Cauldron', m: 'plastic' }));
  w.parts.push(part([0, wy + 3.2, 0], [6.5, 0.5, 6.5], '#2ecc71', { name: 'Brew', m: 'neon', cc: false }));
  w.parts.push(part([5, wy + 0.75, 5], [4, 0.5, 4], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
  // witch hat decor on the tower
  w.parts.push(part([cx, y + 3, cz], [6, 1.5, 6], '#1a1a2e', { name: 'HatBrim', m: 'plastic', cc: false }));
  w.parts.push(part([cx, y + 6, cz], [3.5, 6, 3.5], '#1a1a2e', { name: 'HatTop', m: 'plastic', cc: false }));
  return w;
}

// 4. GHOST TOWN HANGOUT - spooky western town + graveyard
export function hwGhost() {
  const w = startWorld('#16121e');
  const r = rng(1313);
  w.parts.push(part([0, -0.5, 0], [240, 1, 240], '#3d3229', { name: 'Dirt', m: 'sand' }));
  // main street
  w.parts.push(part([0, 0.05, 0], [14, 0.1, 200], '#2e2620', { name: 'Street', m: 'concrete' }));
  w.parts.push(part([0, 0.25, 80], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  // buildings: saloon, bank, hotel, jail (facades you can enter)
  const buildings = [
    { x: -22, z: 40, n: 'Saloon', c: '#7a4a2b' }, { x: 22, z: 40, n: 'Bank', c: '#6e6e6e' },
    { x: -22, z: -10, n: 'Hotel', c: '#8b5e34' }, { x: 22, z: -10, n: 'Jail', c: '#5a5a5a' },
    { x: -22, z: -60, n: 'GeneralStore', c: '#75563a' }, { x: 22, z: -60, n: 'Church', c: '#d5cdbf' },
  ];
  for (const b of buildings) {
    const Wd = 18, Dp = 14, Ht = 9;
    w.parts.push(part([b.x, 0.25, b.z], [Wd + 2, 0.5, Dp + 2], '#4a3b2c', { name: b.n + 'Floor', m: 'wood' }));
    w.parts.push(part([b.x, Ht / 2, b.z - Dp / 2], [Wd, Ht, 1], b.c, { name: b.n + 'Back', m: 'wood' }));
    w.parts.push(part([b.x - Wd / 2, Ht / 2, b.z], [1, Ht, Dp], b.c, { name: b.n + 'Side', m: 'wood' }));
    w.parts.push(part([b.x + Wd / 2, Ht / 2, b.z], [1, Ht, Dp], b.c, { name: b.n + 'Side', m: 'wood' }));
    // front with door gap
    w.parts.push(part([b.x - 6, Ht / 2, b.z + Dp / 2], [6, Ht, 1], b.c, { name: b.n + 'Front', m: 'wood' }));
    w.parts.push(part([b.x + 6, Ht / 2, b.z + Dp / 2], [6, Ht, 1], b.c, { name: b.n + 'Front', m: 'wood' }));
    w.parts.push(part([b.x, Ht - 1.5, b.z + Dp / 2], [6, 3, 1], b.c, { name: b.n + 'Lintel', m: 'wood' }));
    w.parts.push(part([b.x, Ht + 0.5, b.z], [Wd + 2, 1, Dp + 2], '#3a2e22', { name: b.n + 'Roof', m: 'wood' }));
    // sign
    w.parts.push(part([b.x, Ht + 2, b.z + Dp / 2 + 0.5], [10, 2, 0.5], '#f1c40f', { name: b.n + 'Sign', m: 'neon', cc: false }));
    // interior table
    w.parts.push(part([b.x, 1, b.z - 2], [4, 1.5, 4], '#5d4037', { name: b.n + 'Table', m: 'wood' }));
    candy(w, b.x, 2.5, b.z - 2);
  }
  // graveyard (east side)
  w.parts.push(part([70, 0.1, -40], [60, 0.2, 60], '#2b3a2b', { name: 'GraveyardGrass', m: 'grass' }));
  for (let i = 0; i < 12; i++) {
    const gx = 50 + (i % 4) * 14, gz = -60 + ((i / 4) | 0) * 14;
    w.parts.push(part([gx, 1, gz], [2, 2, 0.8], '#9e9e9e', { name: 'Tombstone' + i, m: 'concrete' }));
    w.parts.push(part([gx, 0.3, gz + 2], [3, 0.6, 5], '#5d4037', { name: 'Grave' + i, m: 'wood' }));
    if (i % 3 === 0) candy(w, gx, 2.5, gz);
  }
  // creepy fence around graveyard
  for (let i = 0; i <= 6; i++) {
    w.parts.push(part([40 + i * 10, 1.5, -72], [1, 3, 1], '#333', { name: 'IronFence', m: 'plastic' }));
    w.parts.push(part([40 + i * 10, 1.5, -8], [1, 3, 1], '#333', { name: 'IronFence', m: 'plastic' }));
  }
  // old well in town square
  w.parts.push(part([-40, 1.5, 30], [8, 3, 8], '#6e6e6e', { name: 'WellBase', m: 'brick' }));
  w.parts.push(part([-40, 3.2, 30], [6, 0.5, 6], '#0a0a0a', { name: 'WellHole', cc: false }));
  w.parts.push(part([-43, 5, 30], [1, 5, 1], '#5d4037', { name: 'WellPost', m: 'wood' }));
  w.parts.push(part([-37, 5, 30], [1, 5, 1], '#5d4037', { name: 'WellPost', m: 'wood' }));
  w.parts.push(part([-40, 7.5, 30], [8, 1, 4], '#4a3728', { name: 'WellRoof', m: 'wood' }));
  candy(w, -40, 9, 30);
  // lamp posts with ghostly lights
  for (const [lx, lz] of [[-10, 60], [10, 20], [-10, -20], [10, -60]]) {
    w.parts.push(part([lx, 3, lz], [0.8, 6, 0.8], '#222', { name: 'LampPost', m: 'plastic' }));
    w.parts.push(part([lx, 6.5, lz], [1.5, 1.5, 1.5], '#b39ddb', { name: 'GhostLight', m: 'neon', cc: false }));
  }
  // floating ghost decor (non-collidable)
  for (let i = 0; i < 5; i++) {
    const gx = (r() - 0.5) * 120, gz = (r() - 0.5) * 120;
    w.parts.push(part([gx, 12 + r() * 6, gz], [3, 4, 2], '#ffffff', { name: 'Ghost', m: 'glass', cc: false, tr: 0.5 }));
  }
  // scattered candy
  for (let i = 0; i < 12; i++) candy(w, (r() - 0.5) * 180, 1.5, (r() - 0.5) * 180);
  return w;
}

// 5. SPOOKY BASEPLATE - haunted building base with mini castle
export function hwBase() {
  const w = startWorld('#0f0f18');
  const r = rng(666);
  w.parts.push(part([0, -0.5, 0], [256, 1, 256], '#2a2a35', { name: 'Baseplate', m: 'baseplate' }));
  w.parts.push(part([0, 0.25, 40], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  // mini haunted castle centerpiece (climbable)
  const cc = '#4a4a5e';
  w.parts.push(part([0, 2, -20], [30, 4, 30], cc, { name: 'CastleBase', m: 'brick' }));
  for (const [tx, tz] of [[-12, -32], [12, -32], [-12, -8], [12, -8]]) {
    w.parts.push(part([tx, 9, tz], [6, 14, 6], cc, { name: 'CastleTower', m: 'brick' }));
    w.parts.push(part([tx, 17, tz], [8, 2, 8], '#3d3d52', { name: 'TowerTop', m: 'brick' }));
    candy(w, tx, 19, tz);
  }
  w.parts.push(part([0, 8, -20], [32, 8, 32], cc, { name: 'CastleMid', m: 'brick' }));
  w.parts.push(part([0, 13, -20], [20, 2, 20], '#3d3d52', { name: 'CastleRoof', m: 'brick' }));
  // gate arch
  w.parts.push(part([-4, 6, -4], [2, 8, 2], '#3d3d52', { name: 'GatePillar', m: 'brick' }));
  w.parts.push(part([4, 6, -4], [2, 8, 2], '#3d3d52', { name: 'GatePillar', m: 'brick' }));
  w.parts.push(part([0, 10.5, -4], [10, 1.5, 2], '#3d3d52', { name: 'GateArch', m: 'brick' }));
  // dead trees around
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, rad = 60 + r() * 40;
    const tx = Math.cos(a) * rad, tz = Math.sin(a) * rad - 10;
    w.parts.push(part([tx, 4, tz], [1.5, 8, 1.5], '#3a2e22', { name: 'DeadTree', m: 'wood' }));
    w.parts.push(part([tx + 2, 7, tz], [4, 1, 1], '#3a2e22', { name: 'Branch', m: 'wood' }));
  }
  // jack-o-lantern ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, rad = 35;
    const px = Math.cos(a) * rad, pz = Math.sin(a) * rad - 10;
    w.parts.push(part([px, 1, pz], [2, 2, 2], '#e67e22', { name: 'Jackolantern' }));
    w.parts.push(part([px, 1.2, pz + 1.05], [0.5, 0.5, 0.2], '#ffca28', { name: 'GlowFace', m: 'neon', cc: false }));
  }
  // crooked fence bits
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, rad = 90;
    w.parts.push(part([Math.cos(a) * rad, 1.5, Math.sin(a) * rad - 10], [1, 3, 1], '#4a3728', { name: 'FencePost', m: 'wood' }));
  }
  // floating island with candy (parkour teaser)
  w.parts.push(part([-50, 14, 50], [10, 2, 10], '#5d4037', { name: 'FloatIsland', m: 'wood' }));
  w.parts.push(part([-50, 16, 50], [2, 2, 2], '#e67e22', { name: 'IslandPumpkin' }));
  for (let i = 0; i < 3; i++) candy(w, -50 + (i - 1) * 3, 17.5, 50);
  return w;
}

// 6. HAUNTED FOREST OBBY - jump between twisted trees and glowing mushrooms
export function hwForest() {
  const w = startWorld('#0d1420');
  w.parts.push(part([0, -20, -150], [400, 1, 400], '#050a05', { name: 'Abyss', k: 'kill', m: 'neon' }));
  w.parts.push(part([0, 0.25, 10], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  w.parts.push(part([0, -1, 0], [20, 2, 20], '#1b2a1b', { name: 'Clearing', m: 'grass' }));
  // Stage 1: stump hops
  const stumps = [[0, -15, 0], [4, -25, 1], [-3, -35, 2], [2, -45, 3], [0, -55, 4]];
  for (const [x, z, i] of stumps) {
    const y = i * 1.5;
    w.parts.push(part([x, y - 0.5, z], [5, 1, 5], '#4a3728', { name: 'Stump' + i, m: 'wood' }));
    w.parts.push(part([x, y + 1.5, z], [1, 3, 1], '#2e1f14', { name: 'DeadTrunk' + i, m: 'wood' }));
    candy(w, x, y + 1, z);
  }
  w.parts.push(part([0, 6.75, -65], [8, 1, 8], '#1b2a1b', { name: 'Landing1', m: 'grass' }));
  w.parts.push(part([0, 7.5, -65], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint1', k: 'checkpoint', m: 'neon' }));
  // Stage 2: glowing mushroom platforms
  const shrooms = [[-4, -80], [3, -90], [-2, -100], [4, -110], [0, -120]];
  let my = 8;
  for (const [x, z] of shrooms) {
    my += 2;
    w.parts.push(part([x, my - 0.5, z], [1, my, 1], '#e8e0d0', { name: 'ShroomStem', m: 'plastic' }));
    w.parts.push(part([x, my, z], [7, 1.5, 7], '#e53935', { name: 'ShroomCap', m: 'neon' }));
    w.parts.push(part([x + 1, my + 1, z], [1, 0.5, 1], '#fff', { name: 'ShroomSpot', m: 'neon', cc: false }));
    candy(w, x, my + 1.5, z);
  }
  w.parts.push(part([0, my + 0.75, -132], [10, 1, 10], '#1b2a1b', { name: 'Landing2', m: 'grass' }));
  w.parts.push(part([0, my + 1.5, -132], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint2', k: 'checkpoint', m: 'neon' }));
  // Stage 3: twisted branch bridge
  const by = my + 1;
  for (let i = 0; i < 8; i++) {
    const z = -142 - i * 5, x = Math.sin(i * 0.8) * 4;
    w.parts.push(part([x, by + Math.sin(i) * 0.5, z], [4, 0.8, 4], '#3a2e22', { name: 'Branch' + i, m: 'wood' }));
    if (i % 2 === 0) candy(w, x, by + 1.5, z);
  }
  // Finish: ancient treehouse
  const fy = by + 1;
  w.parts.push(part([0, fy, -190], [16, 2, 16], '#4a3728', { name: 'Treehouse', m: 'wood' }));
  w.parts.push(part([0, fy + 6, -190], [3, 12, 3], '#2e1f14', { name: 'BigTrunk', m: 'wood' }));
  w.parts.push(part([0, fy + 13, -190], [10, 2, 10], '#1b2a1b', { name: 'Canopy', m: 'grass' }));
  w.parts.push(part([0, fy + 1.5, -190], [6, 1, 6], '#ffd400', { name: 'Finish', k: 'checkpoint', m: 'neon' }));
  for (let i = 0; i < 5; i++) candy(w, -6 + i * 3, fy + 2, -190);
  return w;
}

// 7. CANDY CORN CLIMB - vertical climb up giant candy corn towers
export function hwCandy() {
  const w = startWorld('#1a0f2e');
  w.parts.push(part([0, -20, 0], [200, 1, 200], '#0a0515', { name: 'Abyss', k: 'kill', m: 'neon' }));
  w.parts.push(part([0, 0.25, 10], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  w.parts.push(part([0, -1, 0], [24, 2, 24], '#2d1b4e', { name: 'Base', m: 'concrete' }));
  // Three candy corn towers (orange/white/yellow stripes)
  const towers = [[-20, -30], [20, -30], [0, -60]];
  const stripeColors = ['#ff9800', '#fff3e0', '#ffeb3b'];
  for (const [tx, tz] of towers) {
    for (let s = 0; s < 10; s++) {
      const y = s * 3;
      w.parts.push(part([tx, y, tz], [8 - s * 0.5, 3, 8 - s * 0.5], stripeColors[s % 3], { name: 'CandyStripe' + s, m: 'plastic' }));
    }
    // spiral platforms around each tower
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, rad = 8;
      const px = tx + Math.cos(a) * rad, pz = tz + Math.sin(a) * rad, py = 4 + i * 3.5;
      w.parts.push(part([px, py, pz], [4, 0.8, 4], '#e1bee7', { name: 'Spiral' + i, m: 'plastic' }));
      candy(w, px, py + 1.5, pz);
    }
    w.parts.push(part([tx, 33, tz], [6, 1, 6], '#2ec4ff', { name: 'TowerTop', k: 'checkpoint', m: 'neon' }));
  }
  // Bridge between towers
  w.parts.push(part([-10, 32, -30], [12, 1, 4], '#ce93d8', { name: 'Bridge1', m: 'plastic' }));
  w.parts.push(part([10, 32, -45], [4, 1, 16], '#ce93d8', { name: 'Bridge2', m: 'plastic' }));
  // Final: giant candy corn peak
  w.parts.push(part([0, 36, -60], [12, 2, 12], '#ff9800', { name: 'Peak', m: 'plastic' }));
  w.parts.push(part([0, 38.5, -60], [8, 3, 8], '#fff3e0', { name: 'PeakMid', m: 'plastic' }));
  w.parts.push(part([0, 41, -60], [4, 3, 4], '#ffeb3b', { name: 'PeakTip', m: 'neon' }));
  w.parts.push(part([0, 43, -60], [6, 1, 6], '#ffd400', { name: 'Finish', k: 'checkpoint', m: 'neon' }));
  for (let i = 0; i < 5; i++) candy(w, -4 + i * 2, 44, -60);
  return w;
}

// 8. CRYPT CRAWLER - underground tomb with traps and treasure
export function hwCrypt() {
  const w = startWorld('#0a0a12');
  w.parts.push(part([0, 0.25, 10], [6, 0.5, 6], '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  // Entrance hall
  w.parts.push(part([0, -1, 0], [30, 2, 40], '#2a2a35', { name: 'CryptFloor', m: 'concrete' }));
  for (const sx of [-1, 1])
    w.parts.push(part([sx * 13, 5, 0], [3, 12, 30], '#1a1a24', { name: 'CryptWall', m: 'brick' }));
  w.parts.push(part([0, 11, 0], [30, 2, 40], '#1a1a24', { name: 'CryptCeiling', m: 'brick' }));
  // Coffins (decorative + platforms)
  for (let i = 0; i < 4; i++) {
    const z = -10 - i * 8;
    w.parts.push(part([-8, 1, z], [4, 2, 7], '#4a3728', { name: 'Coffin' + i, m: 'wood' }));
    w.parts.push(part([8, 1, z], [4, 2, 7], '#4a3728', { name: 'CoffinR' + i, m: 'wood' }));
    candy(w, 0, 2, z);
  }
  // Stage 1: spike pit jumps (kill bricks between platforms)
  for (let i = 0; i < 5; i++) {
    const z = -50 - i * 10;
    w.parts.push(part([0, 0, z], [8, 1, 6], '#3a3a4a', { name: 'SafePlat' + i, m: 'concrete' }));
    if (i < 4) {
      w.parts.push(part([0, 0.2, z - 5], [8, 0.5, 3], '#ff1744', { name: 'Spikes' + i, k: 'kill', m: 'neon' }));
    }
    candy(w, 0, 2, z);
  }
  w.parts.push(part([0, 0.75, -100], [8, 1, 8], '#3a3a4a', { name: 'Landing1', m: 'concrete' }));
  w.parts.push(part([0, 1.5, -100], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint1', k: 'checkpoint', m: 'neon' }));
  // Stage 2: sarcophagus climb
  let cy = 1;
  for (let i = 0; i < 6; i++) {
    const z = -112 - i * 6, x = (i % 2 === 0 ? -1 : 1) * 4;
    cy += 2;
    w.parts.push(part([x, cy - 0.5, z], [6, 1, 5], '#5d4037', { name: 'Sarcoph' + i, m: 'stone' }));
    w.parts.push(part([x, cy + 0.8, z], [4, 0.6, 3], '#8d6e63', { name: 'SarcophLid' + i, m: 'stone' }));
    candy(w, x, cy + 1.5, z);
  }
  // Treasure chamber
  w.parts.push(part([0, cy, -152], [24, 2, 20], '#2a2a35', { name: 'TreasureFloor', m: 'concrete' }));
  w.parts.push(part([0, cy + 1.5, -158], [6, 3, 4], '#ffd400', { name: 'GoldChest', m: 'neon' }));
  w.parts.push(part([0, cy + 1.5, -158], [6, 0.5, 4], '#8d6e63', { name: 'ChestLid', m: 'wood' }));
  for (let i = 0; i < 8; i++) candy(w, -9 + (i % 4) * 6, cy + 2, -152 - Math.floor(i / 4) * 4);
  w.parts.push(part([0, cy + 1, -146], [6, 1, 6], '#ffd400', { name: 'Finish', k: 'checkpoint', m: 'neon' }));
  return w;
}

// ---------- Funtopia × Blockverse collab worlds (Oct 2026) ----------
export function bvPortal() {
  const w = startWorld('#0d0d26');
  w.light = { tod: 20, ambient: 0.95, fog: 0.3 };
  const P = (x, y, z, sx, sy, sz, c, extra = {}) => w.parts.push(part([x, y, z], [sx, sy, sz], c, extra));
  const coin = (x, y, z) => P(x, y, z, 1.2, 1.2, 1.2, '#2ee06f', { name: 'Cubit', k: 'coin' });
  P(0, -25, -120, 520, 1, 460, '#160404', { name: 'The Void', k: 'kill', m: 'neon' });
  // --- Zone A: Funtopia side ---
  P(0, 0, 0, 28, 2, 28, '#3a2a2e', { name: 'StartPlatform', m: 'concrete' });
  P(0, 1.25, 0, 6, 0.5, 6, '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' });
  P(6, 3.5, 6, 2, 5, 2, '#5c6bc0', { name: 'Greeter', k: 'npc', dialog: 'Welcome to the Funtopia × Blockverse collab! Cross the portal, beat the run, and earn the World Hopper badge! 🟩' });
  P(-8, 2, -6, 1, 4, 1, '#8d6e63', { name: 'SignPost', m: 'wood' });
  P(-8, 4.4, -6, 8, 2.4, 0.4, '#2ee06f', { name: 'CollabSign', m: 'neon' });
  for (let i = 0; i < 5; i++) { // stepping stones with cubit trail
    const z = -16 - i * 11, x = (i % 2 ? 3 : -3), y = 1 + (i % 3);
    P(x, y, z, 6, 1, 6, i % 2 ? '#17b657' : '#e53935', { name: 'Step' + i });
    coin(x, y + 2.4, z);
  }
  P(0, 2, -70, 7, 1, 7, '#26c6da', { name: 'PortalFerry', mv: { a: 'z', d: 6, s: 0.9 } });
  coin(0, 4.4, -70);
  P(0, 2, -92, 12, 1, 12, '#3a2a2e', { name: 'PortalLanding', m: 'concrete' });
  P(0, 2.75, -92, 5, 0.5, 5, '#2ec4ff', { name: 'Checkpoint1', k: 'checkpoint', m: 'neon' });
  // --- The Portal ---
  P(-7, 8, -104, 2, 16, 2, '#2ee06f', { name: 'PortalPillarL', m: 'neon' });
  P(7, 8, -104, 2, 16, 2, '#2ee06f', { name: 'PortalPillarR', m: 'neon' });
  P(0, 16.5, -104, 16, 2, 2, '#2ee06f', { name: 'PortalBeam', m: 'neon' });
  P(0, 8, -104, 12, 14, 0.4, '#2ee06f', { name: 'PortalGlow', m: 'glass', cc: false, tr: 0.55 });
  P(0, 2, -104, 10, 1, 8, '#17b657', { name: 'PortalDeck', m: 'neon' });
  P(-5, 3.5, -98, 2, 5, 2, '#5c6bc0', { name: 'Blox', k: 'npc', dialog: 'You made it through! I am Blox, from Blockverse (blockverse-one.vercel.app). Our worlds are connected now! 🟩' });
  // --- Zone B: Blockverse side ---
  P(0, 2, -118, 14, 1, 14, '#1c2140', { name: 'BV Landing', m: 'concrete' });
  P(0, 2.75, -118, 5, 0.5, 5, '#2ec4ff', { name: 'Checkpoint2', k: 'checkpoint', m: 'neon' });
  let cy = 2;
  for (let i = 0; i < 6; i++) { // cubit climb
    cy += 2; const z = -132 - i * 7, x = (i % 2 ? 4 : -4);
    P(x, cy, z, 6, 1, 5, '#232950', { name: 'BV Step' + i });
    if (i % 2 === 0) coin(x, cy + 2.4, z);
  }
  P(0, cy + 1, -178, 12, 1, 12, '#1c2140', { name: 'BlinkLanding', m: 'concrete' });
  P(0, cy + 1.75, -178, 5, 0.5, 5, '#2ec4ff', { name: 'Checkpoint3', k: 'checkpoint', m: 'neon' });
  for (let i = 0; i < 4; i++) { // blink bridge over the void
    P((i % 2 ? 2 : -2), cy + 1, -190 - i * 9, 5, 1, 5, '#ab47bc', { name: 'Blink' + i, blink: { on: 2.2, off: 1.4, ph: i * 0.9 } });
  }
  P(0, cy + 1, -232, 10, 1, 44, '#232950', { name: 'SweeperWalkway' }); // sweeper corridor
  for (const sz of [-220, -240]) P(0, cy + 2, sz, 4, 1, 2, '#ff2020', { name: 'Sweeper', k: 'kill', m: 'neon', mv: { a: 'x', d: 3.5, s: 1.6 } });
  P(4, cy + 2.2, -232, 1.6, 1.6, 1.6, '#ff5b5b', { name: 'HealPack', k: 'heal', m: 'neon' });
  P(0, cy + 1, -262, 16, 1, 16, '#1c2140', { name: 'GuardPlatform', m: 'concrete' });
  P(0, cy + 1.75, -262, 5, 0.5, 5, '#2ec4ff', { name: 'Checkpoint4', k: 'checkpoint', m: 'neon' });
  P(5, cy + 3.5, -266, 2, 5, 2, '#c4281c', { name: 'BlockGuard', k: 'npc', enemy: true, dialog: 'None shall pass... without style! ⚔️' });
  P(0, cy + 1, -276, 6, 1, 6, '#22ff88', { name: 'BouncePad', k: 'bounce', m: 'neon' });
  const topY = cy + 24;
  P(0, topY, -292, 20, 1, 20, '#14532d', { name: 'Summit', m: 'grass' });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; coin(Math.cos(a) * 7, topY + 2.4, -292 + Math.sin(a) * 7); }
  P(0, topY + 0.75, -292, 8, 0.5, 8, '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' });
  P(0, topY + 4, -300, 3, 6, 3, '#2ee06f', { name: 'CubitCrystal', m: 'neon' });
  return w;
}

export function bvPlaza() {
  const w = startWorld('#0d0d26');
  w.light = { tod: 20.5, ambient: 1, fog: 0.25 };
  const P = (x, y, z, sx, sy, sz, c, extra = {}) => w.parts.push(part([x, y, z], [sx, sy, sz], c, extra));
  P(0, -0.5, 0, 220, 1, 220, '#171b36', { name: 'PlazaGround', m: 'concrete' });
  P(0, 0.25, 0, 6, 0.5, 6, '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' });
  P(0, 0.3, 0, 34, 0.6, 34, '#14532d', { name: 'PlazaPad', m: 'grass' });
  // portal arch centerpiece (north)
  P(-8, 9, -40, 2.5, 18, 2.5, '#2ee06f', { name: 'ArchL', m: 'neon' });
  P(8, 9, -40, 2.5, 18, 2.5, '#2ee06f', { name: 'ArchR', m: 'neon' });
  P(0, 19, -40, 19, 2.5, 2.5, '#2ee06f', { name: 'ArchTop', m: 'neon' });
  P(0, 9, -40, 13, 16, 0.4, '#2ee06f', { name: 'ArchGlow', m: 'glass', cc: false, tr: 0.55 });
  P(0, 1, -40, 12, 1, 10, '#17b657', { name: 'ArchDeck', m: 'neon' });
  // cubit fountain (south)
  P(0, 0.5, 34, 12, 1, 12, '#232950', { name: 'FountainBase' });
  P(0, 3, 34, 2, 4, 2, '#2ee06f', { name: 'FountainCubit', m: 'neon' });
  P(0, 1.6, 34, 9, 0.4, 9, '#22d3ee', { name: 'FountainWater', m: 'glass', tr: 0.4 });
  // stalls: Funtopia (west, red) & Blockverse (east, green)
  for (const [sx, col, nm] of [[-30, '#e53935', 'FT Stall'], [30, '#17b657', 'BV Stall']]) {
    P(sx, 1.5, -8, 10, 3, 6, '#5d4037', { name: nm + ' Counter', m: 'wood' });
    P(sx - 4.5, 4, -8, 1, 8, 1, '#4e342e', { name: nm + ' PostL', m: 'wood' });
    P(sx + 4.5, 4, -8, 1, 8, 1, '#4e342e', { name: nm + ' PostR', m: 'wood' });
    P(sx, 8.4, -8, 12, 0.6, 8, col, { name: nm + ' Roof' });
  }
  // foam-sword duel ring (east court)
  P(38, 0.3, 30, 24, 0.6, 24, '#3a2a2e', { name: 'DuelRing', m: 'concrete' });
  for (const [px, pz] of [[27, 19], [49, 19], [27, 41], [49, 41]]) P(px, 2.5, pz, 1, 5, 1, '#ffd400', { name: 'RingPost', m: 'neon' });
  P(38, 2, 30, 1.6, 1.6, 1.6, '#ff5b5b', { name: 'RingHeal', k: 'heal', m: 'neon' });
  // parkour blocks to a lookout
  let py = 0;
  for (let i = 0; i < 6; i++) { py += 2.2; P(-38 + i * 3, py, 30 - i * 5, 4, 1, 4, i % 2 ? '#2ee06f' : '#e53935', { name: 'Parkour' + i }); }
  P(-20, py + 1, -2, 10, 1, 10, '#232950', { name: 'Lookout' });
  P(-20, py + 3.4, -2, 1.2, 1.2, 1.2, '#2ee06f', { name: 'LookoutCoin', k: 'coin' });
  // blocky trees, alternating worlds' colors
  for (const [tx, tz, cc] of [[-52, -30, '#1b5e20'], [52, -30, '#2ee06f'], [-52, 44, '#2ee06f'], [52, 52, '#1b5e20'], [-14, -58, '#1b5e20'], [16, 58, '#2ee06f']]) {
    P(tx, 3, tz, 1.6, 6, 1.6, '#5d4037', { name: 'Trunk', m: 'wood' });
    P(tx, 8, tz, 6, 4, 6, cc, { name: 'Canopy' });
  }
  // paths + speed pads
  P(0, 0.1, -20, 4, 0.2, 26, '#232950', { name: 'PathN' });
  P(0, 0.1, 20, 4, 0.2, 22, '#232950', { name: 'PathS' });
  P(0, 0.35, -14, 4, 0.5, 4, '#ff9800', { name: 'SpeedPad', k: 'speed', m: 'neon' });
  // NPCs
  P(4, 3.5, -34, 2, 5, 2, '#5c6bc0', { name: 'Blox', k: 'npc', dialog: 'I came from Blockverse (blockverse-one.vercel.app) — your horror update is terrifying. Love it. 🟩' });
  P(-5, 3.5, 8, 2, 5, 2, '#5c6bc0', { name: 'Greeter', k: 'npc', dialog: 'Collab gifts are FREE while the event lasts: Blockverse Cap, Tee, Foam Sword and Cubit Bot — check your inventory & the Marketplace! 🎁' });
  P(34, 3.5, 24, 2, 5, 2, '#c4281c', { name: 'Foam Knight', k: 'npc', dialog: 'The Foam Sword is a Blockverse legend — soft, safe, and 100% bonk-certified. ⚔️' });
  P(-30, 3.5, -2, 2, 5, 2, '#287f47', { name: 'Builder', k: 'npc', dialog: 'Want your own crossover? Grab the Blockverse templates in Create and remix them! 🔨' });
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; P(Math.cos(a) * 16, 2.2, Math.sin(a) * 16, 1.2, 1.2, 1.2, '#2ee06f', { name: 'Cubit', k: 'coin' }); }
  return w;
}
