// gen-games.js — 200+ procedurally generated games.
// 6 archetypes x 12 themes x 3 variations = 216 games, all seeded so every
// build is identical. Each build() returns a plain world { sky, parts } that
// fits the same sanitizeWorld rules as the hand-made templates.
// No DOM, no imports — safe to load in Node (server seed) and the browser.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const P = (id, x, y, z, sx, sy, sz, c, k = 'part', m = 'plastic') =>
  ({ id, name: id, p: [x, y, z], s: [sx, sy, sz], c, k, m });

const THEMES = [
  { name: 'Candy', sky: '#ffc7e3', ground: '#ff9ecd', a: '#ff5fa2', b: '#7c3aed', mat: 'plastic' },
  { name: 'Lava', sky: '#2b0a0a', ground: '#3d0c0c', a: '#ff5722', b: '#ffc107', mat: 'neon' },
  { name: 'Ice', sky: '#bfe9ff', ground: '#dff4ff', a: '#29b6f6', b: '#ffffff', mat: 'glass' },
  { name: 'Jungle', sky: '#9be15d', ground: '#2e7d32', a: '#8d6e63', b: '#ffeb3b', mat: 'grass' },
  { name: 'Space', sky: '#0b0b26', ground: '#1a1a40', a: '#7c4dff', b: '#22d3ee', mat: 'neon' },
  { name: 'Desert', sky: '#ffe0a3', ground: '#e8c07a', a: '#d84315', b: '#ffd54f', mat: 'sand' },
  { name: 'Ocean', sky: '#7fd4ff', ground: '#1565c0', a: '#00e5ff', b: '#ffffff', mat: 'glass' },
  { name: 'Forest', sky: '#a8e6a1', ground: '#1b5e20', a: '#795548', b: '#cddc39', mat: 'grass' },
  { name: 'Sunset', sky: '#ff9e7d', ground: '#6d28a8', a: '#ff6d00', b: '#ffca28', mat: 'plastic' },
  { name: 'Midnight', sky: '#050510', ground: '#14142b', a: '#5c6bc0', b: '#b388ff', mat: 'metal' },
  { name: 'Rainbow', sky: '#e1bee7', ground: '#f8bbd0', a: '#ff4081', b: '#40c4ff', mat: 'neon' },
  { name: 'Crystal', sky: '#d1c4e9', ground: '#b39ddb', a: '#00bcd4', b: '#e1bee7', mat: 'glass' },
];

// --- archetypes: each takes (rng, theme) and returns { sky, parts } ---
function archObby(rng, T) {
  const parts = [P('ground', 0, -1, 60, 220, 2, 220, T.ground, 'part', 'baseplate')];
  parts.push(P('spawn', 0, 1.5, 0, 8, 1, 8, '#22c55e', 'spawn', 'spawn'));
  let x = 0, y = 1, z = 8;
  for (let i = 0; i < 14; i++) {
    x += (rng() - 0.5) * 10;
    z += 8 + rng() * 4;
    y += 1 + rng() * 2.2;
    const c = i % 2 ? T.a : T.b;
    parts.push(P('plat' + i, x, y, z, 6, 1, 6, c, 'part', T.mat));
    if (i % 3 === 1) parts.push(P('coin' + i, x, y + 2.5, z, 1.6, 1.6, 1.6, '#f5cd30', 'coin', 'metal'));
    if (i === 4 || i === 9) parts.push(P('chk' + i, x, y + 1, z, 6, 0.6, 6, '#22d3ee', 'checkpoint', 'neon'));
    if (i === 6) parts.push(P('bounce' + i, x + 4, y, z + 2, 4, 1, 4, '#ec4899', 'bounce', 'neon'));
  }
  parts.push(P('win', x, y + 1, z + 6, 8, 1, 8, '#f5cd30', 'win', 'neon'));
  return { sky: T.sky, parts };
}
function archCoinRush(rng, T) {
  const parts = [P('ground', 0, -1, 0, 200, 2, 200, T.ground, 'part', 'baseplate')];
  parts.push(P('spawn', 0, 1.5, 0, 10, 1, 10, '#22c55e', 'spawn', 'spawn'));
  let px = 0, pz = 0;
  for (let i = 0; i < 8; i++) {
    px += (rng() - 0.5) * 34;
    pz += 14 + rng() * 10;
    const py = 1 + rng() * 8;
    parts.push(P('isl' + i, px, py, pz, 10 + rng() * 6, 1.5, 10 + rng() * 6, i % 2 ? T.a : T.b, 'part', T.mat));
    for (let j = 0; j < 3; j++) parts.push(P('coin' + i + '_' + j, px + (rng() - 0.5) * 7, py + 2.5, pz + (rng() - 0.5) * 7, 1.6, 1.6, 1.6, '#f5cd30', 'coin', 'metal'));
    if (i === 3) parts.push(P('chk3', px, py + 1, pz, 8, 0.6, 8, '#22d3ee', 'checkpoint', 'neon'));
  }
  parts.push(P('win', px, 2, pz + 12, 8, 1, 8, '#f5cd30', 'win', 'neon'));
  return { sky: T.sky, parts };
}
function archTower(rng, T) {
  const parts = [P('ground', 0, -1, 0, 160, 2, 160, T.ground, 'part', 'baseplate')];
  parts.push(P('spawn', 0, 1.5, 14, 8, 1, 8, '#22c55e', 'spawn', 'spawn'));
  parts.push(P('core', 0, 20, 0, 6, 40, 6, T.a, 'part', T.mat));
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + rng() * 0.4;
    const r = 11 + rng() * 2;
    const x = Math.sin(ang) * r, z = Math.cos(ang) * r, y = 2 + i * 3.2;
    parts.push(P('step' + i, x, y, z, 6, 1, 6, i % 2 ? T.a : T.b, 'part', T.mat));
    if (i % 2 === 0) parts.push(P('coin' + i, x, y + 2.5, z, 1.6, 1.6, 1.6, '#f5cd30', 'coin', 'metal'));
    if (i === 5) parts.push(P('chk5', x, y + 1, z, 6, 0.6, 6, '#22d3ee', 'checkpoint', 'neon'));
  }
  parts.push(P('win', 0, 40, 0, 8, 1, 8, '#f5cd30', 'win', 'neon'));
  return { sky: T.sky, parts };
}
function archMaze(rng, T) {
  const parts = [P('ground', 0, -1, 0, 120, 2, 120, T.ground, 'part', 'baseplate')];
  parts.push(P('spawn', -45, 1.5, -45, 8, 1, 8, '#22c55e', 'spawn', 'spawn'));
  const W = 100, H = 100, wallH = 6;
  // boundary
  parts.push(P('bwN', 0, wallH / 2, -50, W, wallH, 2, T.a, 'part', T.mat));
  parts.push(P('bwS', 0, wallH / 2, 50, W, wallH, 2, T.a, 'part', T.mat));
  parts.push(P('bwW', -50, wallH / 2, 0, 2, wallH, H, T.a, 'part', T.mat));
  parts.push(P('bwE', 50, wallH / 2, 0, 2, wallH, H, T.a, 'part', T.mat));
  // interior rows, each with one gap so a path always exists
  for (let r = 0; r < 5; r++) {
    const z = -32 + r * 16;
    const gapX = -36 + rng() * 72;
    const leftW = gapX + 50 - 6;
    const rightW = 50 - (gapX + 6);
    if (leftW > 4) parts.push(P('maze' + r + 'a', -50 + leftW / 2, wallH / 2, z, leftW, wallH, 2, T.b, 'part', T.mat));
    if (rightW > 4) parts.push(P('maze' + r + 'b', gapX + 6 + rightW / 2, wallH / 2, z, rightW, wallH, 2, T.b, 'part', T.mat));
    parts.push(P('coin' + r, gapX, 2.5, z + 4, 1.6, 1.6, 1.6, '#f5cd30', 'coin', 'metal'));
  }
  parts.push(P('chk', 0, 1, 0, 8, 0.6, 8, '#22d3ee', 'checkpoint', 'neon'));
  parts.push(P('win', 45, 1, 45, 8, 1, 8, '#f5cd30', 'win', 'neon'));
  return { sky: T.sky, parts };
}
function archRace(rng, T) {
  const parts = [P('ground', 0, -1, 0, 220, 2, 220, T.ground, 'part', 'baseplate')];
  parts.push(P('spawn', -40, 1.5, -25, 8, 1, 8, '#22c55e', 'spawn', 'spawn'));
  // rectangular loop track
  parts.push(P('trackN', 0, 0.5, -30, 100, 1, 10, T.a, 'part', T.mat));
  parts.push(P('trackS', 0, 0.5, 30, 100, 1, 10, T.a, 'part', T.mat));
  parts.push(P('trackW', -50, 0.5, 0, 10, 1, 70, T.b, 'part', T.mat));
  parts.push(P('trackE', 50, 0.5, 0, 10, 1, 70, T.b, 'part', T.mat));
  for (let i = 0; i < 8; i++) {
    const along = i / 8;
    const x = along < 0.25 ? -40 + along * 4 * 80 : along < 0.5 ? 40 : along < 0.75 ? 40 - (along - 0.5) * 4 * 80 : -40;
    const z = along < 0.25 ? -30 : along < 0.5 ? -30 + (along - 0.25) * 4 * 60 : along < 0.75 ? 30 : 30 - (along - 0.75) * 4 * 60;
    parts.push(P('coin' + i, x, 2.5, z, 1.6, 1.6, 1.6, '#f5cd30', 'coin', 'metal'));
  }
  parts.push(P('speed1', 0, 1, -30, 8, 0.6, 8, '#ec4899', 'speed', 'neon'));
  parts.push(P('speed2', 0, 1, 30, 8, 0.6, 8, '#ec4899', 'speed', 'neon'));
  parts.push(P('chk', 50, 1, 0, 8, 0.6, 8, '#22d3ee', 'checkpoint', 'neon'));
  parts.push(P('win', -40, 1, -25, 8, 1, 8, '#f5cd30', 'win', 'neon'));
  return { sky: T.sky, parts };
}
function archArena(rng, T) {
  const parts = [P('ground', 0, -1, 0, 180, 2, 180, T.ground, 'part', 'baseplate')];
  parts.push(P('spawn', 0, 1.5, -30, 8, 1, 8, '#22c55e', 'spawn', 'spawn'));
  for (let i = 0; i < 12; i++) {
    const x = (rng() - 0.5) * 90, z = (rng() - 0.5) * 90;
    if (Math.hypot(x, z + 30) < 10) continue;
    const h = 2 + rng() * 6;
    parts.push(P('block' + i, x, h / 2, z, 4 + rng() * 6, h, 4 + rng() * 6, i % 2 ? T.a : T.b, 'part', T.mat));
  }
  for (let i = 0; i < 10; i++) {
    parts.push(P('coin' + i, (rng() - 0.5) * 80, 2.5, (rng() - 0.5) * 80, 1.6, 1.6, 1.6, '#f5cd30', 'coin', 'metal'));
  }
  parts.push(P('bounce1', -20, 1, 10, 6, 1, 6, '#ec4899', 'bounce', 'neon'));
  parts.push(P('bounce2', 20, 1, -10, 6, 1, 6, '#ec4899', 'bounce', 'neon'));
  parts.push(P('chk', 0, 1, 20, 8, 0.6, 8, '#22d3ee', 'checkpoint', 'neon'));
  parts.push(P('win', 0, 1, 0, 8, 1, 8, '#f5cd30', 'win', 'neon'));
  return { sky: T.sky, parts };
}

const ARCHETYPES = [
  { key: 'obby', name: 'Obby', desc: 'Jump the platforms, grab coins, reach the flag!', build: archObby },
  { key: 'coinrush', name: 'Coin Rush', desc: 'Hop the floating islands and grab every coin!', build: archCoinRush },
  { key: 'tower', name: 'Tower Climb', desc: 'Spiral up the tower to the golden win pad!', build: archTower },
  { key: 'maze', name: 'Maze', desc: 'Find your way through the maze to the exit!', build: archMaze },
  { key: 'race', name: 'Race Track', desc: 'Race the loop — hit the speed pads and finish first!', build: archRace },
  { key: 'arena', name: 'Arena', desc: 'Bounce, dodge and collect in a wild arena!', build: archArena },
];

// 6 archetypes x 12 themes x 3 variations = 216 games.
export const GEN_GAMES = [];
{
  let n = 0;
  for (const arch of ARCHETYPES) {
    for (const theme of THEMES) {
      for (let v = 1; v <= 3; v++) {
        n++;
        const seed = n * 7919 + 13;
        const key = `gen_${arch.key}_${theme.name.toLowerCase()}_${v}`;
        const name = theme.name + ' ' + arch.name + (v > 1 ? ' ' + v : '');
        GEN_GAMES.push({
          key, name,
          desc: arch.desc,
          id: 'g_gen_' + String(n).padStart(3, '0'),
          seed,
          build: () => arch.build(mulberry32(seed), theme),
        });
      }
    }
  }
}
export const genTemplates = Object.fromEntries(GEN_GAMES.map(g => [g.key, g.build]));
