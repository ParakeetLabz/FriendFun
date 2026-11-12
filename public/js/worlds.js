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
  for (let stage = 1; stage <= 10; stage++) {
    const col = colors[stage % colors.length];
    const type = stage % 5;
    if (type === 1) { // jumps
      for (let i = 0; i < 6; i++) { z -= 8 + r() * 3; x += (r() - 0.5) * 8; y += r() < 0.4 ? 2 : 0; w.parts.push(part([x, y, z], [5, 1, 5], col)); }
    } else if (type === 2) { // kill brick walkway
      z -= 22; w.parts.push(part([x, y, z], [8, 1, 36], col, { name: 'Walkway' }));
      for (let i = 0; i < 5; i++) w.parts.push(part([x + (i % 2 ? 2 : -2), y + 0.75, z - 14 + i * 7], [4, 0.5, 1.5], '#ff2020', { name: 'KillBrick', k: 'kill', m: 'neon' }));
      z -= 18;
    } else if (type === 3) { // truss climb / stairs up
      for (let i = 0; i < 7; i++) { z -= 5; y += 2.2; w.parts.push(part([x, y, z], [6, 1, 3], col, { name: 'Step' })); }
    } else if (type === 4) { // bounce pads
      z -= 10; w.parts.push(part([x, y, z], [6, 1, 6], '#22ff88', { name: 'BouncePad', k: 'bounce', m: 'neon' }));
      z -= 14; y += 10; w.parts.push(part([x, y, z], [8, 1, 8], col));
    } else { // thin beams
      for (let i = 0; i < 3; i++) { z -= 12; w.parts.push(part([x, y, z], [1.5, 1, 14], col, { name: 'Beam' })); }
      z -= 10;
    }
    z -= 10;
    w.parts.push(part([x, y, z], [12, 1, 12], '#efefef', { name: 'Stage' + stage }));
    w.parts.push(part([x, y + 0.75, z], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint' + stage, k: 'checkpoint', m: 'neon' }));
    w.parts.push(part([x + 4, y + 2.5, z + 4], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin' }));
  }
  z -= 14;
  w.parts.push(part([x, y, z], [20, 1, 20], '#ffd700', { name: 'WinPlatform', m: 'neon' }));
  w.parts.push(part([x, y + 0.75, z], [8, 0.5, 8], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
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

export function stealablob() {
  const w = startWorld('#8fc8ff');
  w.parts.push(part([0, -0.5, 0], [160, 1, 160], '#3d6b4f', { name: 'Ground', m: 'grass' }));
  // conveyor down the middle, with moving-look chevrons + lamp posts
  w.parts.push(part([0, 0.1, 0], [14, 0.4, 120], '#2a3550', { name: 'Conveyor', m: 'plastic' }));
  w.parts.push(part([-7.5, 0.4, 0], [1, 0.8, 120], '#ffd700', { name: 'ConveyorEdge', m: 'neon' }));
  w.parts.push(part([7.5, 0.4, 0], [1, 0.8, 120], '#ffd700', { name: 'ConveyorEdge', m: 'neon' }));
  for (let z = -55; z <= 55; z += 10) {
    w.parts.push(part([0, 0.32, z], [10, 0.08, 1.2], '#3a4763', { name: 'BeltStripe', m: 'plastic' }));
  }
  for (let z = -50; z <= 50; z += 20) {
    for (const sx of [-9, 9]) {
      w.parts.push(part([sx, 1, z], [0.5, 2, 0.5], '#1f2937', { name: 'LampPost', m: 'plastic' }));
      w.parts.push(part([sx, 2.2, z], [1.2, 0.6, 1.2], '#ffe066', { name: 'LampGlow', m: 'neon' }));
    }
  }
  // 8 bases (must match SAB_BASES in stealablob.js): platform + walls on 3
  // sides + a gated entrance facing the map center (posts, beam, sign) +
  // a display pad under each of the 6 blob slots.
  const bases = [[-22, -22], [22, -22], [-22, 22], [22, 22], [0, -26], [0, 26], [-26, 0], [26, 0]];
  const colors = ['#4a90e2', '#e24a4a', '#2ed573', '#ffd700', '#9b59e6', '#ff9f43', '#3ee6c4', '#ff5e8a'];
  bases.forEach(([x, z], i) => {
    const c = colors[i];
    // gate faces the map center along the dominant axis
    const gx = Math.abs(x) >= Math.abs(z) ? -Math.sign(x) : 0;
    const gz = gx === 0 ? -Math.sign(z) : 0;
    w.parts.push(part([x, 0.3, z], [14, 0.6, 12], c, { name: 'Base' + (i + 1), m: 'plastic' }));
    if (gx !== 0) {
      w.parts.push(part([x + gx * 6.85, 0.68, z], [0.5, 0.15, 12], '#ffffff', { name: 'GateTrim' + (i + 1), m: 'neon' }));
      w.parts.push(part([x - gx * 6.6, 1.8, z], [0.8, 2.4, 12], c, { name: 'BaseWall' + (i + 1), m: 'plastic' }));
      for (const sz of [-1, 1]) w.parts.push(part([x, 1.8, z + sz * 5.6], [12, 2.4, 0.8], c, { name: 'BaseWall' + (i + 1), m: 'plastic' }));
      for (const sz of [-1, 1]) w.parts.push(part([x + gx * 6.6, 2.2, z + sz * 2.5], [0.8, 3.2, 0.8], c, { name: 'GatePost' + (i + 1), m: 'plastic' }));
      w.parts.push(part([x + gx * 6.6, 4.2, z], [0.8, 0.8, 6.6], c, { name: 'GateBeam' + (i + 1), m: 'plastic' }));
      w.parts.push(part([x + gx * 6.6, 5.3, z], [0.8, 1.4, 5.2], c, { name: 'BaseSign' + (i + 1), m: 'plastic' }));
      w.parts.push(part([x + gx * 6.6, 6.05, z], [0.9, 0.18, 5.4], '#ffffff', { name: 'SignTrim' + (i + 1), m: 'neon' }));
    } else {
      w.parts.push(part([x, 0.68, z + gz * 5.85], [14, 0.15, 0.5], '#ffffff', { name: 'GateTrim' + (i + 1), m: 'neon' }));
      w.parts.push(part([x, 1.8, z - gz * 5.6], [14, 2.4, 0.8], c, { name: 'BaseWall' + (i + 1), m: 'plastic' }));
      for (const sx of [-1, 1]) w.parts.push(part([x + sx * 6.6, 1.8, z], [0.8, 2.4, 10], c, { name: 'BaseWall' + (i + 1), m: 'plastic' }));
      for (const sx of [-1, 1]) w.parts.push(part([x + sx * 2.5, 2.2, z + gz * 5.6], [0.8, 3.2, 0.8], c, { name: 'GatePost' + (i + 1), m: 'plastic' }));
      w.parts.push(part([x, 4.2, z + gz * 5.6], [6.6, 0.8, 0.8], c, { name: 'GateBeam' + (i + 1), m: 'plastic' }));
      w.parts.push(part([x, 5.3, z + gz * 5.6], [5.2, 1.4, 0.8], c, { name: 'BaseSign' + (i + 1), m: 'plastic' }));
      w.parts.push(part([x, 6.05, z + gz * 5.6], [5.4, 0.18, 0.9], '#ffffff', { name: 'SignTrim' + (i + 1), m: 'neon' }));
    }
    // slot pads (match sabSlotPos: 2 rows x 3 cols)
    for (let s = 0; s < 6; s++) {
      const row = Math.floor(s / 3), col = s % 3;
      w.parts.push(part([x + (col - 1) * 4, 0.66, z + (row - 0.5) * 4], [2.8, 0.12, 2.8], '#ffffff', { name: 'SlotPad' + (i + 1), m: 'plastic' }));
    }
  });
  // blocky trees + drifting clouds for atmosphere
  for (const [x, z] of [[-16, -40], [16, -38], [-18, 8], [18, 12], [-15, 38], [15, 40], [-34, -12], [34, 14]]) {
    w.parts.push(part([x, 1.2, z], [1, 2.4, 1], '#6b4a2f', { name: 'TreeTrunk', m: 'plastic' }));
    w.parts.push(part([x, 3.2, z], [3.4, 2.4, 3.4], '#2e8b57', { name: 'TreeTop', m: 'plastic' }));
    w.parts.push(part([x, 4.8, z], [2.2, 1.4, 2.2], '#3aa76d', { name: 'TreeTop2', m: 'plastic' }));
  }
  for (const [x, y, z] of [[-20, 14, -30], [22, 16, -10], [0, 15, 30], [-28, 17, 20], [28, 14, 35]]) {
    w.parts.push(part([x, y, z], [7, 1.6, 4], '#ffffff', { name: 'Cloud', m: 'plastic' }));
    w.parts.push(part([x + 2, y + 1, z], [4, 1.4, 3], '#ffffff', { name: 'Cloud', m: 'plastic' }));
  }
  // spawn sits beside the belt, not on it — the conveyor is for blobs only
  w.parts.push(part([14, 0.25, -40], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  w.stealablob = true;
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


export function skyIslands() {
  const w = startWorld('#7ec8ff');
  w.parts.push(part([0, -60, 0], [2000, 1, 2000], '#ff3b1f', { name: 'Cloud Sea', k: 'kill', m: 'neon' }));
  const islands = [[0, 0, 0, 26], [0, 10, -34, 20], [26, 22, -60, 18], [-24, 34, -88, 20], [0, 48, -122, 22], [0, 64, -160, 26]];
  islands.forEach(([x, y, z, s], i) => {
    w.parts.push(part([x, y, z], [s, 2, s], i % 2 ? '#8bc34a' : '#7cb342', { name: 'Island ' + (i + 1), m: 'grass' }));
    w.parts.push(part([x, y + 1.5, z], [s - 4, 1, s - 4], '#a5d6a7', { name: 'Island Top ' + (i + 1) }));
    if (i > 0) w.parts.push(part([x + 3, y + 3, z + 3], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin' }));
  });
  w.parts.push(part([0, 1.25, 0], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  // bridge island 1 -> 2, moving platform 2 -> 3, blink bridge 3 -> 4
  w.parts.push(part([0, 5, -17], [6, 1, 14], '#8d6e63', { name: 'Bridge', m: 'wood' }));
  w.parts.push(part([13, 16, -47], [6, 1, 6], '#26c6da', { name: 'Sky Ferry', mv: { a: 'x', d: 26, s: 1 } }));
  for (let i = 0; i < 4; i++) w.parts.push(part([-24 + i * 0, 28, -74 - i * 4], [5, 1, 5], '#ab47bc', { name: 'Blink Step', blink: { on: 2, off: 1.2, ph: i * 0.7 } }));
  // portal shortcut: island 3 <-> island 5 (same name pairs them)
  w.parts.push(part([26, 23.5, -60], [5, 0.5, 5], '#ff00ff', { name: 'Sky Portal', k: 'tp', m: 'neon' }));
  w.parts.push(part([0, 49.5, -122], [5, 0.5, 5], '#ff00ff', { name: 'Sky Portal', k: 'tp', m: 'neon' }));
  w.parts.push(part([0, 35.5, -88], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint', k: 'checkpoint', m: 'neon' }));
  w.parts.push(part([0, 49.5, -122], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint', k: 'checkpoint', m: 'neon' }));
  w.parts.push(part([0, 65.5, -160], [8, 0.5, 8], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
  w.parts.push(part([0, 67, -160], [2, 5, 2], '#ffd400', { name: 'Sky Guide', k: 'npc', dialog: 'Welcome to the Sky Islands! Mind the gaps!' }));
  return w;
}

export function raceTrack() {
  const w = startWorld('#9fd6ff');
  w.parts.push(part([0, -0.5, 0], [300, 1, 300], '#4caf50', { name: 'Grass', m: 'grass' }));
  const road = (x, z, sx, sz) => w.parts.push(part([x, 0.25, z], [sx, 0.5, sz], '#37474f', { name: 'Road', m: 'concrete' }));
  road(0, -40, 120, 12); road(0, 40, 120, 12); road(-60, 0, 12, 80); road(60, 0, 12, 80);
  w.parts.push(part([-40, 0.75, -40], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  // boost straights
  for (const [x, z] of [[-20, -40], [20, -40], [-20, 40], [20, 40]]) w.parts.push(part([x, 0.75, z], [4, 0.5, 4], '#ff9800', { name: 'Boost', k: 'speed', m: 'neon' }));
  // ice corner (slide!) + checkpoints at corners
  w.parts.push(part([-60, 0.75, -40], [12, 0.5, 12], '#a0e8ff', { name: 'Ice Corner', k: 'ice', m: 'glass' }));
  for (const [x, z, n] of [[-60, -40, 1], [60, -40, 2], [60, 40, 3], [-60, 40, 4]]) w.parts.push(part([x, 0.75, z], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint ' + n, k: 'checkpoint', m: 'neon' }));
  for (let i = 0; i < 10; i++) w.parts.push(part([-50 + i * 11, 1.5, -40], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin' }));
  w.parts.push(part([0, 0.75, -40], [8, 0.5, 8], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
  w.parts.push(part([0, 2, -30], [2, 5, 2], '#ffd400', { name: 'Race Marshal', k: 'npc', dialog: 'Hit the boosts, slide the ice corner, and don\'t cut the grass!' }));
  return w;
}

export function volcanoEscape() {
  const w = startWorld('#ff7043');
  w.parts.push(part([0, -0.5, 0], [400, 1, 400], '#ff4500', { name: 'Lava Sea', k: 'kill', m: 'neon' }));
  w.parts.push(part([0, 1.25, 0], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  let y = 0, z = -10;
  for (let i = 0; i < 8; i++) { z -= 8; y += 3; w.parts.push(part([0, y, z], [8, 1, 8], '#5d4037', { name: 'Rock Step', m: 'concrete' })); }
  // moving platforms over the lava lake
  w.parts.push(part([0, y + 2, z - 14], [6, 1, 6], '#26c6da', { name: 'Lava Ferry', mv: { a: 'x', d: 18, s: 1.1 } }));
  w.parts.push(part([0, y + 2, z - 30], [6, 1, 6], '#26c6da', { name: 'Lava Ferry 2', mv: { a: 'z', d: 12, s: 1 } }));
  // safe rest platform + shield before the final jump
  w.parts.push(part([0, y + 4, z - 46], [10, 1, 10], '#66bb6a', { name: 'Safe Ledge', k: 'safe', m: 'glass' }));
  w.parts.push(part([4, y + 6, z - 46], [1.6, 1.6, 1.6], '#00bcd4', { name: 'Shield', k: 'shield', m: 'neon' }));
  w.parts.push(part([0, y + 6, z - 58], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint', k: 'checkpoint', m: 'neon' }));
  for (let i = 0; i < 3; i++) w.parts.push(part([-6 + i * 6, y + 8, z - 66 - i * 4], [5, 1, 5], '#ab47bc', { name: 'Blink Ember', blink: { on: 2.2, off: 1, ph: i * 0.8 } }));
  w.parts.push(part([0, y + 10, z - 84], [12, 1, 12], '#ffd700', { name: 'Crater', m: 'neon' }));
  w.parts.push(part([0, y + 11, z - 84], [8, 0.5, 8], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
  for (let i = 0; i < 8; i++) w.parts.push(part([-8 + i * 2.5, y + 2.5, z - 20], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin' }));
  return w;
}

export function snowPeak() {
  const w = startWorld('#b3e5fc');
  w.parts.push(part([0, -0.5, 0], [300, 1, 300], '#e1f5fe', { name: 'Snowfield' }));
  w.parts.push(part([0, 1.25, 0], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  let y = 0, z = -10;
  for (let i = 0; i < 6; i++) { z -= 9; y += 3; w.parts.push(part([0, y, z], [9, 1, 9], '#eceff1', { name: 'Snow Step' })); }
  // ice slide down then low-g aurora zone
  w.parts.push(part([10, y + 1, z - 10], [14, 0.5, 8], '#a0e8ff', { name: 'Ice Slide', k: 'ice', m: 'glass' }));
  w.parts.push(part([0, y + 4, z - 30], [12, 8, 12], '#b39ddb', { name: 'Aurora Zone', k: 'lowg', m: 'glass' }));
  w.parts.push(part([0, y + 8, z - 44], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint', k: 'checkpoint', m: 'neon' }));
  for (let i = 0; i < 5; i++) w.parts.push(part([-4 + i * 2, y + 9, z - 52 - i * 3], [4, 1, 4], '#eceff1', { name: 'Summit Step' }));
  w.parts.push(part([0, y + 12, z - 70], [10, 1, 10], '#ffd700', { name: 'Summit', m: 'neon' }));
  w.parts.push(part([0, y + 13, z - 70], [8, 0.5, 8], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
  w.parts.push(part([6, y + 14, z - 70], [2, 5, 2], '#ffd400', { name: 'Yeti', k: 'npc', dialog: 'Brrr! You made it to the top!' }));
  for (let i = 0; i < 8; i++) w.parts.push(part([-10 + i * 3, y + 2.5, z - 16], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin' }));
  return w;
}


// ---- Popular Roblox-style games (original FunTopia versions) ----
// Jailbreak-style cops & robbers: bank, jail, police HQ, houses, streets.
export function heistCity() {
  const w = startWorld('#8fc8ff');
  w.parts.push(part([0, -0.5, 0], [220, 1, 220], '#5b8c5a', { name: 'Ground', m: 'grass' }));
  w.parts.push(part([0, 0.05, 0], [220, 0.1, 14], '#3a3a3a', { name: 'RoadNS' }));
  w.parts.push(part([0, 0.05, 0], [14, 0.1, 220], '#3a3a3a', { name: 'RoadEW' }));
  for (let i = -100; i <= 100; i += 12) {
    w.parts.push(part([i, 0.12, 0], [4, 0.05, 0.6], '#ffd400', { name: 'Dash' }));
    w.parts.push(part([0, 0.12, i], [0.6, 0.05, 4], '#ffd400', { name: 'Dash' }));
  }
  // Bank (NE) with a vault full of gold
  w.parts.push(part([45, -0.25, -45], [26, 0.5, 18], '#b0bec5', { name: 'BankFloor', m: 'concrete' }));
  w.parts.push(part([45, 3, -54], [26, 6, 1], '#37474f', { name: 'BankWallN', m: 'brick' }));
  w.parts.push(part([32, 3, -45], [1, 6, 18], '#37474f', { name: 'BankWallW', m: 'brick' }));
  w.parts.push(part([58, 3, -45], [1, 6, 18], '#37474f', { name: 'BankWallE', m: 'brick' }));
  w.parts.push(part([36, 3, -36], [8, 6, 1], '#37474f', { name: 'BankWallS1', m: 'brick' }));
  w.parts.push(part([54, 3, -36], [8, 6, 1], '#37474f', { name: 'BankWallS2', m: 'brick' }));
  w.parts.push(part([45, 6.5, -45], [28, 1, 20], '#263238', { name: 'BankRoof' }));
  w.parts.push(part([45, 7.5, -35.5], [10, 1.5, 0.5], '#ffd400', { name: 'BankSign', m: 'neon' }));
  w.parts.push(part([45, 1.5, -50], [10, 3, 1], '#78909c', { name: 'VaultWall', m: 'metal' }));
  for (let i = 0; i < 6; i++) w.parts.push(part([41 + (i % 3) * 4, 1, -52 + Math.floor(i / 3) * 3], [1.2, 1.2, 1.2], '#ffd400', { name: 'VaultGold', k: 'coin', m: 'neon' }));
  // Jail (NW) with barred cells
  w.parts.push(part([-45, -0.25, -45], [22, 0.5, 16], '#90a4ae', { name: 'JailFloor', m: 'concrete' }));
  w.parts.push(part([-45, 3, -53], [22, 6, 1], '#546e7a', { name: 'JailWallN', m: 'brick' }));
  w.parts.push(part([-56, 3, -45], [1, 6, 16], '#546e7a', { name: 'JailWallW', m: 'brick' }));
  w.parts.push(part([-34, 3, -45], [1, 6, 16], '#546e7a', { name: 'JailWallE', m: 'brick' }));
  w.parts.push(part([-45, 3, -37], [22, 6, 1], '#546e7a', { name: 'JailWallS', m: 'brick' }));
  w.parts.push(part([-45, 6.5, -45], [24, 1, 18], '#37474f', { name: 'JailRoof' }));
  for (let c = -1; c <= 1; c++) {
    const bx = -45 + c * 7;
    for (let b = 0; b < 4; b++) w.parts.push(part([bx - 2 + b * 1.4, 2, -43], [0.3, 4, 0.3], '#212121', { name: 'CellBars', m: 'metal' }));
    w.parts.push(part([bx, 0.75, -43], [5, 1.5, 2], '#795548', { name: 'CellBed', m: 'wood' }));
  }
  // Police HQ (SW) with helipad
  w.parts.push(part([-45, -0.25, 45], [22, 0.5, 16], '#90caf9', { name: 'HQFloor', m: 'concrete' }));
  w.parts.push(part([-45, 3, 37], [22, 6, 1], '#1565c0', { name: 'HQWallN', m: 'brick' }));
  w.parts.push(part([-56, 3, 45], [1, 6, 16], '#1565c0', { name: 'HQWallW', m: 'brick' }));
  w.parts.push(part([-34, 3, 45], [1, 6, 16], '#1565c0', { name: 'HQWallE', m: 'brick' }));
  w.parts.push(part([-45, 3, 53], [22, 6, 1], '#1565c0', { name: 'HQWallS', m: 'brick' }));
  w.parts.push(part([-45, 6.5, 45], [24, 1, 18], '#0d47a1', { name: 'HQRoof' }));
  w.parts.push(part([-45, 7.2, 45], [8, 0.3, 8], '#ffffff', { name: 'Helipad', m: 'concrete' }));
  // Houses
  for (const [hx, hz, hc] of [[45, 45, '#ef9a9a'], [70, -10, '#a5d6a7'], [-70, 20, '#90caf9'], [-70, -70, '#fff59d']]) {
    w.parts.push(part([hx, 2, hz], [10, 4, 8], hc, { name: 'House', m: 'brick' }));
    w.parts.push(part([hx, 4.5, hz], [11, 1, 9], '#795548', { name: 'HouseRoof', m: 'wood' }));
    w.parts.push(part([hx, 1, hz + 4.2], [2, 2, 0.3], '#4e342e', { name: 'HouseDoor', m: 'wood' }));
    w.parts.push(part([hx - 3, 2.5, hz + 4.1], [2, 2, 0.2], '#b3e5fc', { name: 'HouseWindow', m: 'glass' }));
    w.parts.push(part([hx + 3, 2.5, hz + 4.1], [2, 2, 0.2], '#b3e5fc', { name: 'HouseWindow', m: 'glass' }));
  }
  // Street coins + trees
  const r = rng(11);
  for (let i = 0; i < 10; i++) w.parts.push(part([(r() - 0.5) * 160, 1, (r() - 0.5) * 160], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin', m: 'neon' }));
  for (const [tx, tz] of [[-20, 12], [20, -12], [60, 12], [-60, -12], [12, 60], [-12, -60]]) {
    w.parts.push(part([tx, 1.5, tz], [1, 3, 1], '#5d4037', { name: 'TreeTrunk', m: 'wood' }));
    w.parts.push(part([tx, 4.5, tz], [3.5, 3.5, 3.5], '#2e7d32', { name: 'TreeTop', m: 'grass' }));
  }
  w.parts.push(part([-45, 0.25, 30], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  return w;
}

// Murder Mystery-style: a mansion, five suspects to question, hidden evidence.
export function whodunit() {
  const w = startWorld('#1a1a2e');
  w.light = { tod: 0, ambient: 0.7, fog: 0.4 };
  w.parts.push(part([0, -0.5, 0], [60, 1, 60], '#5d4037', { name: 'Floor', m: 'wood' }));
  w.parts.push(part([0, 3, -30], [60, 6, 1], '#4e342e', { name: 'WallN', m: 'brick' }));
  w.parts.push(part([0, 3, 30], [60, 6, 1], '#4e342e', { name: 'WallS', m: 'brick' }));
  w.parts.push(part([-30, 3, 0], [1, 6, 60], '#4e342e', { name: 'WallW', m: 'brick' }));
  w.parts.push(part([30, 3, 0], [1, 6, 60], '#4e342e', { name: 'WallE', m: 'brick' }));
  w.parts.push(part([-15, 3, -15], [1, 6, 22], '#4e342e', { name: 'Divider1', m: 'brick' }));
  w.parts.push(part([15, 3, 15], [1, 6, 22], '#4e342e', { name: 'Divider2', m: 'brick' }));
  w.parts.push(part([-15, 3, 15], [22, 6, 1], '#4e342e', { name: 'Divider3', m: 'brick' }));
  w.parts.push(part([15, 3, -15], [22, 6, 1], '#4e342e', { name: 'Divider4', m: 'brick' }));
  w.parts.push(part([0, 1, 0], [10, 0.5, 4], '#6d4c41', { name: 'DiningTable', m: 'wood' }));
  for (const [cx, cz] of [[-4, 3], [0, 3], [4, 3], [-4, -3], [0, -3], [4, -3]]) w.parts.push(part([cx, 0.5, cz], [1.5, 1, 1.5], '#4e342e', { name: 'Chair', m: 'wood' }));
  for (const [cx, cz] of [[-8, 0], [8, 0], [-20, -20], [20, 20]]) w.parts.push(part([cx, 2, cz], [0.6, 1.2, 0.6], '#ffca28', { name: 'Candle', m: 'neon' }));
  const suspects = [
    [-20, -20, '#e53935', 'The Butler', 'I was polishing silver all night. Ask anyone.'],
    [20, -20, '#1e88e5', 'The Chef', 'I never left the kitchen. The knives are all here... mostly.'],
    [-20, 20, '#43a047', 'The Gardener', 'I was outside with the roses. In the rain. All night.'],
    [20, 20, '#8e24aa', 'The Heiress', 'I heard a scream from the library. I hid in my room.'],
    [0, -22, '#fb8c00', 'The Detective', 'One of us did it. Find the evidence!'],
  ];
  for (const [x, z, c, name, dlg] of suspects) w.parts.push(part([x, 2, z], [2, 4, 2], c, { name, k: 'npc', dialog: dlg }));
  for (const [x, z] of [[-25, -25], [25, -25], [-25, 25], [25, 25], [0, 22], [-8, -8]]) w.parts.push(part([x, 1, z], [1.2, 1.2, 1.2], '#ffd400', { name: 'Evidence', k: 'coin', m: 'neon' }));
  w.parts.push(part([0, 0.25, 26], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  return w;
}

// Doors-style: a long dark hotel corridor, 20 doors, flickering lights, something down the hall.
export function hauntedHotel() {
  const w = startWorld('#0a0a14');
  w.light = { tod: 0, ambient: 0.45, fog: 0.75 };
  w.parts.push(part([0, -0.5, -60], [12, 1, 130], '#3e2723', { name: 'HallFloor', m: 'wood' }));
  w.parts.push(part([-6.5, 2.5, -60], [1, 5, 130], '#4e342e', { name: 'WallW', m: 'brick' }));
  w.parts.push(part([6.5, 2.5, -60], [1, 5, 130], '#4e342e', { name: 'WallE', m: 'brick' }));
  w.parts.push(part([0, 2.5, 6], [14, 5, 1], '#4e342e', { name: 'WallS', m: 'brick' }));
  w.parts.push(part([0, 5.2, -60], [14, 0.5, 130], '#212121', { name: 'Ceiling' }));
  for (let d = 1; d <= 20; d++) {
    const z = 0 - d * 6;
    w.parts.push(part([-6, 2, z], [0.3, 4, 2.5], '#5d4037', { name: 'Door ' + d, m: 'wood' }));
    w.parts.push(part([6, 2, z], [0.3, 4, 2.5], '#5d4037', { name: 'Door ' + d, m: 'wood' }));
    if (d % 4 === 0) w.parts.push(part([0, 4.8, z], [2, 0.4, 0.6], '#ffca28', { name: 'Lamp', m: 'neon', blink: { on: 1.2, off: 0.6, ph: d } }));
  }
  // Side rooms: one hides coins, one hides the entity, one hides a hazard
  w.parts.push(part([-14, -0.5, -30], [16, 1, 14], '#4e342e', { name: 'RoomFloor', m: 'wood' }));
  w.parts.push(part([-14, 2.5, -37], [16, 5, 1], '#4e342e', { name: 'RoomWall', m: 'brick' }));
  w.parts.push(part([-22, 2.5, -30], [1, 5, 14], '#4e342e', { name: 'RoomWall', m: 'brick' }));
  for (const [x, z] of [[-12, -28], [-16, -32], [-12, -34]]) w.parts.push(part([x, 1, z], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin', m: 'neon' }));
  w.parts.push(part([14, -0.5, -66], [16, 1, 14], '#4e342e', { name: 'RoomFloor', m: 'wood' }));
  w.parts.push(part([14, 2.5, -73], [16, 5, 1], '#4e342e', { name: 'RoomWall', m: 'brick' }));
  w.parts.push(part([22, 2.5, -66], [1, 5, 14], '#4e342e', { name: 'RoomWall', m: 'brick' }));
  w.parts.push(part([14, 1.5, -66], [2, 3, 2], '#000000', { name: 'Entity', mv: { a: 'z', d: 8, s: 1.2 } }));
  w.parts.push(part([14, 1, -60], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin', m: 'neon' }));
  w.parts.push(part([14, -0.5, -102], [16, 1, 14], '#4e342e', { name: 'RoomFloor', m: 'wood' }));
  w.parts.push(part([14, 2.5, -109], [16, 5, 1], '#4e342e', { name: 'RoomWall', m: 'brick' }));
  w.parts.push(part([22, 2.5, -102], [1, 5, 14], '#4e342e', { name: 'RoomWall', m: 'brick' }));
  for (const [x, z] of [[12, -100], [16, -104], [14, -98]]) w.parts.push(part([x, 0.75, z], [3, 0.5, 1.5], '#ff2020', { name: 'Hazard', k: 'kill', m: 'neon' }));
  for (const [x, z] of [[0, -20], [0, -50], [0, -80], [0, -110]]) w.parts.push(part([x, 1, z], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin', m: 'neon' }));
  w.parts.push(part([0, 0.25, -122], [8, 0.5, 8], '#ffffff', { name: 'ExitDoor', k: 'win', m: 'neon' }));
  w.parts.push(part([0, 0.25, 2], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  return w;
}

// BedWars-style: two team islands, bridges, a middle island, blasters for everyone.
export function bedBattle() {
  const w = startWorld('#8fc8ff');
  w.shooter = true;
  w.parts.push(part([0, -20, 0], [2000, 1, 2000], '#ff3b1f', { name: 'Void', k: 'kill', m: 'neon' }));
  for (const sx of [-1, 1]) {
    const ix = sx * 45, c = sx < 0 ? '#1565c0' : '#c62828';
    w.parts.push(part([ix, -0.5, 0], [30, 1, 30], c, { name: sx < 0 ? 'BlueIsland' : 'RedIsland', m: 'concrete' }));
    w.parts.push(part([ix, 0.5, -8], [10, 1, 6], sx < 0 ? '#42a5f5' : '#ef5350', { name: sx < 0 ? 'BlueBed' : 'RedBed' }));
    w.parts.push(part([ix, 0.25, 8], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
    w.parts.push(part([ix - sx * 8, 0.75, 6], [4, 0.5, 4], '#22ff88', { name: 'BouncePad', k: 'bounce', m: 'neon' }));
    w.parts.push(part([ix - sx * 20, 0, 0], [12, 1, 5], '#8d6e63', { name: 'Bridge', m: 'wood' }));
  }
  w.parts.push(part([0, -0.5, 0], [20, 1, 20], '#ffd54f', { name: 'MidIsland', m: 'sand' }));
  for (const [x, z] of [[-5, -5], [5, 5], [0, 0], [-5, 5], [5, -5]]) w.parts.push(part([x, 1, z], [1.2, 1.2, 1.2], '#00e5ff', { name: 'Diamond', k: 'coin', m: 'neon' }));
  w.parts.push(part([-25, 0.75, -6], [4, 0.5, 4], '#22ff88', { name: 'BouncePad', k: 'bounce', m: 'neon' }));
  w.parts.push(part([25, 0.75, -6], [4, 0.5, 4], '#22ff88', { name: 'BouncePad', k: 'bounce', m: 'neon' }));
  return w;
}

// 99 Nights-style: campfire, forest, cabin, things in the dark.
export function forestCamp() {
  const w = startWorld('#0b1026');
  w.light = { tod: 0, ambient: 0.7, fog: 0.5 };
  w.parts.push(part([0, -0.5, 0], [180, 1, 180], '#2e7d32', { name: 'Ground', m: 'grass' }));
  const r = rng(99);
  for (let i = 0; i < 36; i++) {
    const tx = (r() - 0.5) * 160, tz = (r() - 0.5) * 160;
    if (Math.abs(tx) < 15 && Math.abs(tz) < 15) continue;
    w.parts.push(part([tx, 1.5, tz], [1, 3, 1], '#4e342e', { name: 'TreeTrunk', m: 'wood' }));
    w.parts.push(part([tx, 4.5, tz], [3.5, 3.5, 3.5], '#1b5e20', { name: 'TreeTop', m: 'grass' }));
  }
  // Campfire: stone ring + fire + logs
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    w.parts.push(part([Math.cos(a) * 3, 0.25, Math.sin(a) * 3], [1, 0.5, 1], '#9e9e9e', { name: 'FireStone', m: 'concrete' }));
  }
  w.parts.push(part([0, 1.5, 0], [1.5, 3, 1.5], '#ff6d00', { name: 'Campfire', m: 'neon' }));
  w.parts.push(part([-1.5, 0.5, 0], [3, 1, 1], '#5d4037', { name: 'Log', m: 'wood' }));
  w.parts.push(part([1.5, 0.5, 0], [3, 1, 1], '#5d4037', { name: 'Log', m: 'wood' }));
  // Cabin
  w.parts.push(part([30, 2, -20], [12, 4, 10], '#8d6e63', { name: 'Cabin', m: 'wood' }));
  w.parts.push(part([30, 4.5, -20], [13, 1, 11], '#5d4037', { name: 'CabinRoof', m: 'wood' }));
  w.parts.push(part([30, 1, -14.8], [2, 2, 0.3], '#3e2723', { name: 'CabinDoor', m: 'wood' }));
  // Shadows in the trees
  for (const [x, z] of [[-50, 30], [50, -40], [0, 60]]) w.parts.push(part([x, 2, z], [2, 4, 2], '#212121', { name: 'Shadow', k: 'npc', enemy: true, dialog: 'Grrr...' }));
  // Supplies
  for (let i = 0; i < 10; i++) w.parts.push(part([(r() - 0.5) * 140, 1, (r() - 0.5) * 140], [1.2, 1.2, 1.2], '#ffd400', { name: 'Supply', k: 'coin', m: 'neon' }));
  w.parts.push(part([0, 0.25, 6], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  return w;
}

// Pet Simulator-style: egg pedestals, coin trails, a hatch conveyor.
export function petHatchery() {
  const w = startWorld('#aee2ff');
  w.parts.push(part([0, -0.5, 0], [120, 1, 120], '#7cb342', { name: 'Ground', m: 'grass' }));
  w.parts.push(part([0, -0.25, 0], [40, 0.5, 40], '#b0bec5', { name: 'Plaza', m: 'concrete' }));
  // Hatch arch at the south entrance
  w.parts.push(part([-5, 2, 42], [1, 4, 1], '#ffffff', { name: 'ArchPillar' }));
  w.parts.push(part([5, 2, 42], [1, 4, 1], '#ffffff', { name: 'ArchPillar' }));
  w.parts.push(part([0, 4.5, 42], [12, 1, 1], '#ff80ab', { name: 'ArchTop', m: 'neon' }));
  // Conveyor into the plaza
  w.parts.push(part([0, 0.1, 30], [6, 0.2, 20], '#78909c', { name: 'HatchBelt', k: 'conv', conv: [0, -8], m: 'metal' }));
  // Egg pedestals
  const eggs = [[-15, -10, '#f48fb1', 'Pink Egg'], [0, -15, '#90caf9', 'Blue Egg'], [15, -10, '#fff59d', 'Gold Egg']];
  for (const [x, z, c, name] of eggs) {
    w.parts.push(part([x, 1, z], [4, 2, 4], '#ffffff', { name: 'Pedestal', m: 'concrete' }));
    w.parts.push(part([x, 4, z], [3, 4, 3], c, { name, m: 'neon' }));
  }
  // Coin trails from the entrance to each egg
  for (const [x, z] of eggs) {
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      w.parts.push(part([x * t, 1, 42 + (z - 42) * t], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin', m: 'neon' }));
    }
  }
  // Plaza coins + fence + trees
  for (const [x, z] of [[-8, 8], [8, 8], [0, -5], [-12, -2], [12, -2]]) w.parts.push(part([x, 1, z], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin', m: 'neon' }));
  for (let i = -54; i <= 54; i += 12) {
    w.parts.push(part([i, 1, -54], [0.5, 2, 0.5], '#8d6e63', { name: 'Fence' }));
    w.parts.push(part([i, 1, 54], [0.5, 2, 0.5], '#8d6e63', { name: 'Fence' }));
  }
  for (const [tx, tz] of [[-40, -40], [40, -40], [-40, 40], [40, 40]]) {
    w.parts.push(part([tx, 1.5, tz], [1, 3, 1], '#5d4037', { name: 'TreeTrunk', m: 'wood' }));
    w.parts.push(part([tx, 4.5, tz], [3.5, 3.5, 3.5], '#2e7d32', { name: 'TreeTop', m: 'grass' }));
  }
  w.parts.push(part([0, 0.25, 48], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  return w;
}

// Jungle temple adventure: cross the lava river, ride the moving stones,
// climb the temple stairs and claim the Golden Idol.
export function lostTemple() {
  const w = startWorld('#7ec850');
  const r = rng(1234);
  w.parts.push(part([0, -0.5, 0], [170, 1, 170], '#43a047', { name: 'Ground', m: 'grass' }));
  // Jungle trees around the edges (keep the path clear)
  for (let i = 0; i < 14; i++) {
    const tx = (r() - 0.5) * 150, tz = (r() - 0.5) * 150;
    if (Math.abs(tx) < 16 || Math.abs(tz - 0) < 60) continue;
    w.parts.push(part([tx, 1.5, tz], [1, 3, 1], '#4e342e', { name: 'TreeTrunk', m: 'wood', sh: 'cyl' }));
    w.parts.push(part([tx, 4.5, tz], [3.5, 3.5, 3.5], '#1b5e20', { name: 'TreeTop', m: 'grass', sh: 'sph' }));
  }
  w.parts.push(part([0, 0.25, 48], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  w.parts.push(part([5, 2, 44], [2, 4, 2], '#8d6e63', { name: 'Explorer', k: 'npc', dialog: 'The Golden Idol waits in the temple... mind the lava river!' }));
  // Torches along the path
  for (const z of [38, 26, 14, 2, -10]) {
    w.parts.push(part([-10, 1, z], [0.6, 2, 0.6], '#5d4037', { name: 'TorchPost', m: 'wood', sh: 'cyl' }));
    w.parts.push(part([-10, 2.5, z], [1, 1, 1], '#ff6d00', { name: 'TorchFlame', m: 'neon', sh: 'sph' }));
  }
  // Lava river across the path
  for (const x of [-24, -8, 8, 24]) w.parts.push(part([x, 0.25, 20], [16, 0.5, 6], '#ff3b1f', { name: 'LavaRiver', k: 'kill', m: 'neon' }));
  // Jump stones over the lava
  for (const x of [-8, 0, 8]) w.parts.push(part([x, 1, 20], [4, 1, 4], '#bcaaa4', { name: 'JumpStone', m: 'concrete' }));
  w.parts.push(part([0, 0.75, 10], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint1', k: 'checkpoint', m: 'neon' }));
  // Moving stones sliding side to side
  w.parts.push(part([-6, 1, 0], [5, 1, 5], '#bcaaa4', { name: 'MovingStone', m: 'concrete', mv: { a: 'x', d: 10, s: 1 } }));
  w.parts.push(part([6, 1, -6], [5, 1, 5], '#bcaaa4', { name: 'MovingStone', m: 'concrete', mv: { a: 'x', d: 10, s: 1, ph: 1.5 } }));
  // Coins along the trail
  for (const [x, z] of [[-4, 34], [4, 26], [0, 14], [-4, 4], [4, -4], [0, -14], [-6, -24], [6, -30]]) w.parts.push(part([x, 1.5, z], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin', m: 'neon' }));
  // Temple stairs + a ramp up the side
  for (let i = 0; i < 4; i++) w.parts.push(part([0, 1 + i, -20 - i * 3], [16, 1, 3], '#9e9e9e', { name: 'TempleStep', m: 'concrete' }));
  w.parts.push(part([-16, 2, -28], [12, 4, 6], '#9e9e9e', { name: 'TempleRamp', m: 'concrete', sh: 'ramp' }));
  // Temple platform, pillars, idol
  w.parts.push(part([0, 4, -40], [34, 1, 24], '#8d8d8d', { name: 'TempleFloor', m: 'concrete' }));
  for (const [x, z] of [[-13, -30], [13, -30], [-13, -50], [13, -50]]) w.parts.push(part([x, 8, z], [2, 8, 2], '#bdbdbd', { name: 'TemplePillar', m: 'concrete', sh: 'cyl' }));
  w.parts.push(part([0, 12.5, -40], [32, 1, 22], '#bdbdbd', { name: 'TempleRoof', m: 'concrete' }));
  w.parts.push(part([0, 5.5, -46], [4, 2, 4], '#757575', { name: 'IdolPedestal', m: 'concrete', sh: 'cyl' }));
  w.parts.push(part([0, 8, -46], [2, 3, 2], '#ffd700', { name: 'GoldenIdol', m: 'neon', sh: 'sph' }));
  w.parts.push(part([0, 4.75, -36], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint2', k: 'checkpoint', m: 'neon' }));
  w.parts.push(part([0, 5, -42], [8, 0.5, 8], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
  return w;
}

// Sky pirate adventure: hop floating islands, bounce between them,
// and reach the treasure island.
export function skyPirates() {
  const w = startWorld('#87ceeb');
  w.parts.push(part([0, -40, 0], [2000, 1, 2000], '#1565c0', { name: 'Sea', k: 'kill', m: 'neon' }));
  // Start island + airship
  w.parts.push(part([0, -0.5, 0], [26, 1, 26], '#66bb6a', { name: 'StartIsland', m: 'grass' }));
  w.parts.push(part([0, 0.25, 0], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  w.parts.push(part([8, 2, 6], [2, 4, 2], '#5d4037', { name: 'Captain', k: 'npc', dialog: 'Arrr! The treasure island is past the clouds. Bounce, matey!' }));
  w.parts.push(part([14, 3, -6], [14, 3, 4], '#6d4c41', { name: 'AirshipHull', m: 'wood' }));
  w.parts.push(part([14, 7, -6], [10, 4, 4], '#e53935', { name: 'AirshipBalloon', m: 'neon', sh: 'sph' }));
  w.parts.push(part([14, 5, -6], [1, 2, 1], '#5d4037', { name: 'AirshipMast', m: 'wood', sh: 'cyl' }));
  // Bridge planks to island 2
  for (let i = 0; i < 5; i++) w.parts.push(part([-14 - i * 3, 1 + i * 0.8, -12 - i * 2.5], [3, 0.5, 3], '#8d6e63', { name: 'BridgePlank', m: 'wood' }));
  // Island 2
  w.parts.push(part([-32, 3.5, -26], [18, 1, 18], '#66bb6a', { name: 'Island2', m: 'grass' }));
  w.parts.push(part([-32, 4.75, -26], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint1', k: 'checkpoint', m: 'neon' }));
  w.parts.push(part([-26, 4.5, -20], [5, 1, 5], '#22ff88', { name: 'BouncePad', k: 'bounce', m: 'neon' }));
  // Island 3 (high)
  w.parts.push(part([25, 7.5, -42], [16, 1, 16], '#66bb6a', { name: 'Island3', m: 'grass' }));
  w.parts.push(part([25, 8.75, -42], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint2', k: 'checkpoint', m: 'neon' }));
  w.parts.push(part([18, 8.5, -36], [5, 1, 5], '#22ff88', { name: 'BouncePad', k: 'bounce', m: 'neon' }));
  // Treasure island
  w.parts.push(part([0, 11.5, -62], [20, 1, 20], '#ffd54f', { name: 'TreasureIsland', m: 'sand' }));
  for (const [x, z] of [[-4, -58], [4, -58], [0, -66], [-6, -64], [6, -64]]) w.parts.push(part([x, 12.5, z], [1.5, 1.5, 1.5], '#ffd700', { name: 'GoldPile', m: 'neon', sh: 'sph' }));
  w.parts.push(part([0, 12.5, -62], [8, 0.5, 8], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
  // Coins on the route
  for (const [x, y, z] of [[-8, 2, -6], [-20, 4, -18], [-32, 6, -26], [0, 9, -34], [25, 10, -42], [12, 11, -52], [0, 14, -62]]) w.parts.push(part([x, y, z], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin', m: 'neon' }));
  // Clouds
  for (const [x, y, z] of [[-50, 6, 10], [40, 10, -10], [-10, 14, -50], [45, 4, 20]]) w.parts.push(part([x, y, z], [10, 2, 6], '#ffffff', { name: 'Cloud', sh: 'sph' }));
  return w;
}

// Dungeon crawl: torch-lit maze, skeleton guards, traps, and the exit portal.
export function dungeonQuest() {
  const w = startWorld('#0b1026');
  w.light = { tod: 0, ambient: 0.6, fog: 0.6 };
  w.parts.push(part([0, -0.5, 0], [150, 1, 150], '#616161', { name: 'DungeonFloor', m: 'concrete' }));
  // Perimeter walls
  for (const [x, z, sx, sz] of [[0, -72, 150, 2], [0, 72, 150, 2], [-72, 0, 2, 150], [72, 0, 2, 150]]) w.parts.push(part([x, 2, z], [sx, 4, sz], '#4e342e', { name: 'DungeonWall', m: 'brick' }));
  // Maze walls (corridors)
  for (const [x, z, sx, sz] of [[-40, 30, 40, 2], [40, 30, 40, 2], [-40, -10, 2, 40], [40, -10, 2, 40], [-20, -30, 40, 2], [20, -50, 2, 40], [0, 10, 60, 2]]) w.parts.push(part([x, 2, z], [sx, 4, sz], '#5d4037', { name: 'MazeWall', m: 'brick' }));
  // Torches
  for (const [x, z] of [[-20, 60], [20, 60], [-50, 0], [50, 0], [-20, -40], [20, -40], [0, -60]]) {
    w.parts.push(part([x, 1, z], [0.6, 2, 0.6], '#3e2723', { name: 'TorchPost', m: 'wood', sh: 'cyl' }));
    w.parts.push(part([x, 2.5, z], [1, 1, 1], '#ff6d00', { name: 'TorchFlame', m: 'neon', sh: 'sph' }));
  }
  w.parts.push(part([0, 0.25, 60], [6, 0.5, 6], '#3a7bd5', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' }));
  // Skeleton guards
  for (const [x, z] of [[-30, 40], [30, 40], [-30, -20], [30, -20]]) w.parts.push(part([x, 2, z], [2, 4, 2], '#e0e0e0', { name: 'Skeleton', k: 'npc', enemy: true, dialog: 'Rattle rattle... turn back!' }));
  // Spike traps
  for (const [x, z] of [[-10, 20], [10, 20], [0, -20], [-50, -40], [50, -40]]) w.parts.push(part([x, 0.25, z], [6, 0.5, 2], '#ff2020', { name: 'SpikeTrap', k: 'kill', m: 'neon' }));
  w.parts.push(part([0, 0.75, 0], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint1', k: 'checkpoint', m: 'neon' }));
  w.parts.push(part([-30, 0.75, -50], [5, 0.5, 5], '#2ec4ff', { name: 'Checkpoint2', k: 'checkpoint', m: 'neon' }));
  w.parts.push(part([30, 0.75, -50], [6, 0.5, 6], '#69f0ae', { name: 'HealPad', k: 'heal', m: 'neon' }));
  for (const [x, z] of [[-20, 45], [20, 45], [-55, 15], [55, 15], [0, -35], [-15, -55], [15, -55], [0, 30]]) w.parts.push(part([x, 1, z], [1.2, 1.2, 1.2], '#ffd400', { name: 'Coin', k: 'coin', m: 'neon' }));
  // Exit portal
  w.parts.push(part([-3, 3, -68], [1, 6, 1], '#00e5ff', { name: 'PortalFrame', m: 'neon' }));
  w.parts.push(part([3, 3, -68], [1, 6, 1], '#00e5ff', { name: 'PortalFrame', m: 'neon' }));
  w.parts.push(part([0, 6, -68], [7, 1, 1], '#00e5ff', { name: 'PortalTop', m: 'neon' }));
  w.parts.push(part([0, 0.75, -62], [8, 0.5, 8], '#ffffff', { name: 'WinPad', k: 'win', m: 'neon' }));
  return w;
}

export function partyPlaza() {
  const w = startWorld('#1a1033');
  w.light = { tod: 21, ambient: 1, fog: 0.3 };
  const P = (x, y, z, sx, sy, sz, c, extra = {}) => w.parts.push(part([x, y, z], [sx, sy, sz], c, extra));
  P(0, -0.5, 0, 220, 1, 220, '#241a3d', { name: 'PartyGround', m: 'concrete' });
  P(0, 0.25, 0, 6, 0.5, 6, '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' });
  // disco dance floor: 8x8 neon tiles, half of them blinking
  const cols = ['#ff2d95', '#7c4dff', '#00e5ff', '#ffd400'];
  for (let ix = 0; ix < 8; ix++) for (let iz = 0; iz < 8; iz++) {
    const i = ix * 8 + iz;
    const extra = { name: 'Disco' + i, m: 'neon' };
    if ((ix + iz) % 2 === 0) extra.blink = { on: 1.1, off: 1.1, ph: (i % 8) * 0.28 };
    P(-10.5 + ix * 3, 0.3, -10.5 + iz * 3, 2.8, 0.6, 2.8, cols[i % 4], extra);
  }
  // disco ball bobbing over the floor
  P(0, 14, 0, 3, 3, 3, '#e0e0e0', { name: 'DiscoBall', m: 'metal', mv: { a: 'y', d: 2, s: 0.8 } });
  P(0, 16.5, 0, 0.4, 2, 0.4, '#9e9e9e', { name: 'DiscoChain', m: 'metal' });
  // stage (north) with neon backdrop + speakers + DJ
  P(0, 1, -34, 40, 2, 16, '#3d2b63', { name: 'Stage' });
  P(0, 8, -41, 40, 12, 1, '#ff2d95', { name: 'StageBackdrop', m: 'neon' });
  P(0, 8, -40.4, 34, 9, 0.4, '#7c4dff', { name: 'StageGlow', m: 'glass', cc: false, tr: 0.5 });
  for (const sx of [-18, 18]) {
    P(sx, 4, -36, 4, 6, 4, '#111111', { name: 'Speaker' });
    P(sx, 6.5, -36, 4, 1, 4, '#00e5ff', { name: 'SpeakerTrim', m: 'neon' });
  }
  P(-6, 4.5, -36, 2, 5, 2, '#5c6bc0', { name: 'DJ Funtopia', k: 'npc', dialog: 'We did it — 100 players strong! 🎉 Grab your free Neon Party Hat from your inventory and dance!' });
  // cake table (east) + 3-tier cake
  P(24, 1.5, 6, 10, 3, 5, '#5d4037', { name: 'CakeTable', m: 'wood' });
  P(24, 4.5, 6, 5, 2, 4, '#ffffff', { name: 'CakeTier1' });
  P(24, 6.5, 6, 3.5, 2, 3, '#ff8fb3', { name: 'CakeTier2' });
  P(24, 8.5, 6, 2, 2, 2, '#ffd400', { name: 'CakeTier3' });
  P(24, 10, 6, 0.4, 1, 0.4, '#ff2d95', { name: 'Candle', m: 'neon' });
  // balloon clusters in the corners
  for (const [bx, bz, bc] of [[-28, 18, '#ff2d95'], [28, 18, '#00e5ff'], [-28, -18, '#ffd400'], [28, -18, '#7c4dff']]) {
    P(bx, 2, bz, 0.5, 4, 0.5, '#9e9e9e', { name: 'BalloonPole', m: 'metal' });
    P(bx - 1, 5, bz, 1.6, 1.6, 1.6, bc, { name: 'Balloon', m: 'neon' });
    P(bx + 1, 5.4, bz, 1.6, 1.6, 1.6, bc, { name: 'Balloon', m: 'neon' });
    P(bx, 6.4, bz, 1.6, 1.6, 1.6, bc, { name: 'Balloon', m: 'neon' });
  }
  // coin ring around the dance floor
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P(Math.cos(a) * 20, 2.2, Math.sin(a) * 20, 1.2, 1.2, 1.2, '#ffd400', { name: 'PartyCoin', k: 'coin' }); }
  // fun pads
  P(-24, 0.35, -6, 4, 0.5, 4, '#00e5ff', { name: 'BouncePad', k: 'bounce', m: 'neon' });
  P(24, 0.35, -6, 4, 0.5, 4, '#00e5ff', { name: 'BouncePad', k: 'bounce', m: 'neon' });
  P(0, 0.35, 24, 4, 0.5, 4, '#ff9800', { name: 'SpeedPad', k: 'speed', m: 'neon' });
  P(-14, 2, 24, 1.6, 1.6, 1.6, '#ff5b5b', { name: 'PartyHeal', k: 'heal', m: 'neon' });
  // party trees with neon canopies
  for (const [tx, tz, cc] of [[-40, 30, '#ff2d95'], [40, 30, '#7c4dff'], [-40, -30, '#00e5ff'], [40, -30, '#ffd400']]) {
    P(tx, 3, tz, 1.6, 6, 1.6, '#5d4037', { name: 'Trunk', m: 'wood' });
    P(tx, 8, tz, 6, 4, 6, cc, { name: 'Canopy', m: 'neon' });
  }
  // greeter near spawn
  P(5, 3.5, 8, 2, 5, 2, '#5c6bc0', { name: 'Greeter', k: 'npc', dialog: 'Welcome to the 100 Players Party! The Neon Party Hat is FREE while the party lasts — check your inventory! 🎉' });
  return w;
}

export function voiceLounge() {
  const w = startWorld('#2b1a4a');
  w.light = { tod: 20, ambient: 1, fog: 0.2 };
  const P = (x, y, z, sx, sy, sz, c, extra = {}) => w.parts.push(part([x, y, z], [sx, sy, sz], c, extra));
  P(0, -0.5, 0, 120, 1, 120, '#3d2b63', { name: 'LoungeFloor', m: 'concrete' });
  P(0, 0.25, 0, 6, 0.5, 6, '#6b6b6b', { name: 'SpawnLocation', k: 'spawn', m: 'spawn' });
  // stage with mic stand
  P(0, 0.5, -28, 30, 1, 14, '#7c4dff', { name: 'Stage', m: 'neon' });
  P(0, 3, -30, 1, 4, 1, '#555', { name: 'MicStand', m: 'metal' });
  P(0, 5.2, -30, 1.6, 1.6, 1.6, '#e0e0e0', { name: 'MicBall', m: 'metal', sh: 'sph' });
  // round tables + couches in a ring
  const cols = ['#ff6d9d', '#00e5ff', '#ffd400', '#7cff6b'];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, x = Math.cos(a) * 16, z = Math.sin(a) * 16;
    P(x, 1, z, 1, 2, 1, '#8d6e63', { name: 'TableLeg' + i, m: 'wood' });
    P(x, 2.2, z, 7, 0.6, 7, cols[i], { name: 'Table' + i, m: 'plastic', sh: 'cyl' });
    P(x + 6, 1, z, 6, 2, 2.5, cols[i], { name: 'Couch' + i, m: 'plastic' });
    P(x + 6, 2.4, z, 6, 1.4, 0.6, cols[i], { name: 'CouchBack' + i, m: 'plastic' });
    P(x, 6.5, z, 2, 2, 2, '#fff7ae', { name: 'Lamp' + i, m: 'neon', sh: 'sph' });
  }
  // coin ring for fun while you talk
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * 10, z = Math.sin(a) * 10;
    P(x, 1.5, z, 1.5, 1.5, 0.5, '#ffd400', { name: 'Coin' + i, k: 'coin', m: 'metal' });
  }
  return w;
}
export const templates = { baseplate, obby, hangout, tower, coinRush, shooterArena, shooterFort, shooterRooftop, soccerField, mysteryMansion, garden, stealablob, gauntlet, skyIslands, raceTrack, volcanoEscape, snowPeak, heistCity, whodunit, hauntedHotel, bedBattle, forestCamp, petHatchery, lostTemple, skyPirates, dungeonQuest, partyPlaza, voiceLounge };

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

