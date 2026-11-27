// 🏆 Objectives — shared by Studio, the game runtime, FunAI and the server.
// Pure data + functions: no DOM, no THREE, no imports, so it loads in the
// browser AND in Node (root funai.js + server.js seed path import it too).
// An objective is { kind, winCondition, timerSec, score } stored on the
// world as world.objective (same flag style as w.shooter / w.tag), plus
// world.difficulty ('easy' | 'normal' | 'hard').
//
// WHY a scripts entry too: server.js sanitizeWorld() only keeps a small
// allowlist of world fields (sky, parts, shooter, gears, light, folders,
// scripts, htmlScripts, twoUi) and DROPS world.objective / world.difficulty
// when a player game is saved or published. The scripts array DOES survive
// (id/name/folder/code), so syncObjectiveEntry() mirrors the objective into
// a hidden script entry { id: '__objective__', code: '<json>' } — the
// Studio hides it from the Explorer and the runtime skips running it, so
// published games keep their objective through the server round-trip.
// Seeded/official games bypass sanitizeWorld, so world.objective alone
// is enough for them. getObjective() reads both, then falls back to
// inferring a sensible goal from the world's parts (old worlds keep
// working with a real goal instead of a bare win pad).

export const OBJECTIVE_KINDS = {
  capture: { label: 'Capture', icon: '🎯', desc: 'Hold the point — stand on the glowing pad to capture it' },
  collect: { label: 'Collect', icon: '🪙', desc: 'Grab coins — collect the target number to win' },
  race: { label: 'Race', icon: '🏁', desc: 'Reach the finish pad before the timer runs out' },
  survive: { label: 'Survive', icon: '🛡️', desc: 'Stay alive — outlast the timer while hazards hunt you' },
};

export const DIFFICULTIES = {
  easy: { label: 'Easy', enemy: 0.7, timer: 1.4, hazard: 0.7 },
  normal: { label: 'Normal', enemy: 1, timer: 1, hazard: 1 },
  hard: { label: 'Hard', enemy: 1.5, timer: 0.75, hazard: 1.5 },
};

export const OBJECTIVE_ENTRY_ID = '__objective__';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

// The goal text for each kind. score = coins to collect (collect) or
// seconds to hold the point (capture); race/survive use the timer only.
export function buildWinCondition(kind, score, timerSec) {
  if (kind === 'capture') return `Hold the point for ${Math.max(1, score || 8)}s`;
  if (kind === 'collect') return `Collect ${Math.max(1, score || 20)} coins`;
  if (kind === 'race') return `Reach the finish in ${Math.max(30, timerSec || 180)}s`;
  if (kind === 'survive') return `Survive for ${Math.max(30, timerSec || 120)}s`;
  return 'Reach the finish';
}

export function defaultObjective(kind, overrides = {}) {
  if (!OBJECTIVE_KINDS[kind]) return null;
  const base = {
    capture: { timerSec: 180, score: 8 },
    collect: { timerSec: 240, score: 20 },
    race: { timerSec: 180, score: 0 },
    survive: { timerSec: 120, score: 0 },
  }[kind];
  const timerSec = clamp(Math.round(num(overrides.timerSec, base.timerSec)), 30, 900);
  const score = clamp(Math.round(num(overrides.score, base.score)), 0, 999);
  return { kind, winCondition: buildWinCondition(kind, score, timerSec), timerSec, score };
}

export function normalizeObjective(raw, world) {
  if (!raw || typeof raw !== 'object') return null;
  const kind = String(raw.kind || '').toLowerCase();
  if (!OBJECTIVE_KINDS[kind]) return null;
  const timerSec = clamp(Math.round(num(raw.timerSec, 180)), 30, 900);
  let score = clamp(Math.round(num(raw.score, 0)), 0, 999);
  // A collect goal must be reachable: never ask for more coins than exist.
  if (kind === 'collect' && world) {
    const coins = (world.parts || []).filter(p => p.k === 'coin').length;
    if (coins >= 5) score = clamp(score || 20, 5, Math.min(30, coins));
    else if (coins > 0) score = coins;
  }
  if (kind === 'capture') score = clamp(score || 8, 3, 60);
  return { kind, winCondition: buildWinCondition(kind, score, timerSec), timerSec, score };
}

export function difficultyConfig(level) {
  return DIFFICULTIES[level] || DIFFICULTIES.normal;
}

// The countdown a run actually gets. Longer timers are easier for race /
// capture / collect — but for survive the timer IS the goal, so easy means
// a SHORTER survival time and hard means a longer one.
export function effectiveTimer(objective, difficulty) {
  if (!objective || !objective.timerSec) return 0;
  const mul = difficultyConfig(difficulty).timer;
  const t = objective.kind === 'survive'
    ? Math.round(objective.timerSec / mul)
    : Math.round(objective.timerSec * mul);
  return clamp(t, 30, 900);
}

export function objectiveLabel(objective, difficulty) {
  if (!objective) return '';
  const o = OBJECTIVE_KINDS[objective.kind];
  const t = effectiveTimer(objective, difficulty);
  const mm = Math.floor(t / 60), ss = String(t % 60).padStart(2, '0');
  return `${o.icon} ${o.label} — ${objective.winCondition} · ${mm}:${ss}`;
}

export function shortObjectiveLabel(objective, difficulty) {
  if (!objective) return '';
  const o = OBJECTIVE_KINDS[objective.kind];
  return `${o.icon} ${o.label} · ${Math.floor(effectiveTimer(objective, difficulty) / 60)}:${String(effectiveTimer(objective, difficulty) % 60).padStart(2, '0')}`;
}

export function getDifficulty(world) {
  if (world && DIFFICULTIES[world.difficulty]) return world.difficulty;
  const entry = readObjectiveEntry(world);
  if (entry && DIFFICULTIES[entry.difficulty]) return entry.difficulty;
  return 'normal';
}

// --- persistence through the server round-trip (see header) ---
export function readObjectiveEntry(world) {
  const s = (world?.scripts || []).find(x => x && x.id === OBJECTIVE_ENTRY_ID);
  if (!s || typeof s.code !== 'string') return null;
  try {
    const j = JSON.parse(s.code);
    if (j && typeof j === 'object' && OBJECTIVE_KINDS[j.kind]) return j;
  } catch {}
  return null;
}

export function syncObjectiveEntry(world) {
  if (!world || typeof world !== 'object') return;
  if (!Array.isArray(world.scripts)) world.scripts = [];
  const i = world.scripts.findIndex(x => x && x.id === OBJECTIVE_ENTRY_ID);
  if (!world.objective) {
    if (i >= 0) world.scripts.splice(i, 1);
    return;
  }
  const code = JSON.stringify({ ...world.objective, difficulty: world.difficulty || 'normal' });
  if (i >= 0) world.scripts[i].code = code;
  else world.scripts.push({ id: OBJECTIVE_ENTRY_ID, name: 'Objective', code });
}

// Best goal for a world: explicit objective first, then the hidden entry
// (published games), then a sensible guess from the parts. Never throws.
export function getObjective(world) {
  if (!world) return null;
  const direct = normalizeObjective(world.objective, world);
  if (direct) return direct;
  const entry = normalizeObjective(readObjectiveEntry(world), world);
  if (entry) return entry;
  return inferObjective(world);
}

export function inferObjective(world) {
  const parts = world?.parts || [];
  if (!parts.length) return null;
  const coins = parts.filter(p => p.k === 'coin').length;
  const wins = parts.filter(p => p.k === 'win').length;
  const enemies = parts.filter(p => p.k === 'npc' && p.enemy).length;
  const hazards = parts.filter(p => p.k === 'kill' || p.mv || p.blink).length;
  if (coins >= 10) return normalizeObjective({ kind: 'collect', timerSec: 240, score: Math.min(20, coins) }, world);
  if (wins >= 1) return normalizeObjective({ kind: 'race', timerSec: 180, score: 0 }, world);
  if (enemies >= 1 || hazards >= 4) return normalizeObjective({ kind: 'survive', timerSec: 120, score: 0 }, world);
  return null;
}

// --- hard section ---
// A genuinely tricky stretch appended past the far end of the course:
// narrow stepping stones over a kill pit, moving kill sweepers, blink
// platforms, an enemy guard on Normal/Hard, and a checkpoint at the end
// so clearing it feels like progress. Counts scale with difficulty's
// hazard multiplier. Anchored to the platform farthest from the spawn so
// it is reachable from the existing course.
function farthestAnchor(world) {
  const parts = world?.parts || [];
  const spawn = parts.find(p => p.k === 'spawn');
  const sx = spawn ? spawn.p[0] : 0, sz = spawn ? spawn.p[2] : 0, sy = spawn ? spawn.p[1] : 0;
  let best = null, bestD = -1;
  for (const p of parts) {
    if (!['part', 'checkpoint', 'bounce'].includes(p.k)) continue;
    if (p.s[0] < 3 || p.s[2] < 3) continue;
    const d = (p.p[0] - sx) ** 2 + (p.p[2] - sz) ** 2;
    if (d > bestD) { bestD = d; best = p; }
  }
  if (!best) return { x: 0, y: 0, z: -10, dirX: 0, dirZ: -1 };
  const dx = best.p[0] - sx, dz = best.p[2] - sz;
  const len = Math.hypot(dx, dz) || 1;
  return { x: best.p[0], y: best.p[1] + best.s[1] / 2, z: best.p[2], dirX: dx / len, dirZ: dz / len, half: Math.max(best.s[0], best.s[2]) / 2 };
}

export function hasHardSection(world) {
  const parts = world?.parts || [];
  if (parts.filter(p => (p.name || '').startsWith('Hard')).length >= 3) return true;
  const hazards = parts.filter(p => p.k === 'kill' || p.mv || p.blink).length;
  return hazards >= 4;
}

export function buildHardSection(world, difficulty = 'normal') {
  if (!world || !Array.isArray(world.parts)) return 0;
  const hz = difficultyConfig(difficulty).hazard;
  const a = farthestAnchor(world);
  const ids = new Set(world.parts.map(p => p.id));
  let n = world.parts.length + 1;
  const nid = () => { let id; do { id = 'hp' + (n++); } while (ids.has(id)); ids.add(id); return id; };
  const add = (name, p, s, c, extra = {}) => {
    world.parts.push({ id: nid(), name, p, s, c, k: 'part', m: 'plastic', ...extra });
    return world.parts[world.parts.length - 1];
  };
  const startD = a.half + 4; // first stone sits just past the anchor's edge
  const steps = Math.max(3, Math.round(4 * hz));
  const sweepers = Math.max(1, Math.round(2 * hz));
  const blinks = Math.max(1, Math.round(1.5 * hz));
  const guard = hz >= 1;
  const gap = 5.5;
  let added = 0;
  const at = d => [a.x + a.dirX * d, a.y, a.z + a.dirZ * d];
  const heights = []; // stone top height at each step, so hazards sit right
  // The pit: fall in and you are back at your last checkpoint.
  add('HardPit', [a.x + a.dirX * (startD + steps * gap / 2), a.y - 6, a.z + a.dirZ * (startD + steps * gap / 2)], [14, 1, steps * gap + 16], '#ff2020', { k: 'kill', m: 'neon' });
  added++;
  // Narrow stepping stones, zig-zagging so you cannot just run straight.
  let py = a.y;
  const perp = [-a.dirZ, a.dirX];
  for (let i = 0; i < steps; i++) {
    const d = startD + i * gap;
    const side = (i % 2 === 0 ? -1 : 1) * 2.5;
    const [x, , z] = at(d);
    add('HardStep' + (i + 1), [x + perp[0] * side, py, z + perp[1] * side], [3.5, 1, 3.5], i % 2 ? '#ff595e' : '#ff924c', { m: 'plastic' });
    heights.push(py);
    added++;
    if (i < steps - 1 && i % 3 === 2) py += 2; // a climb every third stone
  }
  const heightAt = d => {
    const i = Math.max(0, Math.min(steps - 1, Math.round((d - startD) / gap)));
    return heights[i] ?? a.y;
  };
  // Moving kill sweepers sliding across the path.
  for (let i = 0; i < sweepers; i++) {
    const d = startD + (i + 0.5) * (steps * gap / Math.max(1, sweepers));
    const [x, , z] = at(d);
    add('HardSweeper' + (i + 1), [x, heightAt(d) + 1.2, z], [4, 1, 1.5], '#ff2020', { k: 'kill', m: 'neon', mv: { a: 'x', d: 7, s: 1 + 0.2 * hz, ph: i * 1.3 } });
    added++;
  }
  // Blink platforms that vanish under your feet.
  for (let i = 0; i < blinks; i++) {
    const d = startD + (i + 0.75) * (steps * gap / Math.max(1, blinks));
    const [x, , z] = at(d);
    add('HardBlink' + (i + 1), [x - perp[0] * 3, heightAt(d) + 0.5, z - perp[1] * 3], [4, 1, 4], '#ab47bc', { blink: { on: 2.2, off: 1.2, ph: i * 0.9 } });
    added++;
  }
  // The guard: an enemy NPC on the final stone (Normal/Hard only).
  const [ex, , ez] = at(startD + steps * gap);
  if (guard) {
    add('HardGuard', [ex, py + 2.5, ez], [2, 5, 2], '#c4281c', { k: 'npc', enemy: true, dialog: '👹 You shall not pass!' });
    added++;
  }
  // Checkpoint at the end — clearing the section saves your progress.
  add('HardCheckpoint', [ex, py + 0.75, ez], [5, 0.5, 5], '#2ec4ff', { k: 'checkpoint', m: 'neon' });
  added++;
  // A coin trail over the stones, as a reward for the risk.
  for (let i = 0; i < steps; i++) {
    const d = startD + i * gap;
    const [x, , z] = at(d);
    add('HardCoin' + (i + 1), [x, heights[i] + 2.5, z], [1.2, 1.2, 1.2], '#ffd400', { k: 'coin', m: 'neon' });
    added++;
  }
  return added;
}

export function ensureHardSection(world, difficulty = 'normal') {
  if (hasHardSection(world)) return 0;
  return buildHardSection(world, difficulty);
}

// --- finished look ---
// A bare generated map gets lighting that fits its sky plus a few props
// (trees, torches, an NPC greeter) near the spawn so it feels finished
// instead of empty. Only fills what is missing — hand-made detail is
// never overwritten.
function skyLuminance(sky) {
  const m = /^#([0-9a-fA-F]{6})$/.exec(sky || '');
  if (!m) return 0.7;
  const r = parseInt(m[1].slice(0, 2), 16) / 255, g = parseInt(m[1].slice(2, 4), 16) / 255, b = parseInt(m[1].slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function ensureFinishedLook(world) {
  if (!world || !Array.isArray(world.parts)) return { lightAdded: false, propsAdded: 0 };
  const out = { lightAdded: false, propsAdded: 0 };
  if (!world.light) {
    const lum = skyLuminance(world.sky);
    world.light = lum < 0.3
      ? { tod: 0, ambient: 0.7, fog: 0.45 }
      : lum < 0.55 ? { tod: 17, ambient: 0.9, fog: 0.4 }
      : { tod: 12, ambient: 1, fog: 0.35 };
    out.lightAdded = true;
  }
  const isProp = p => p.k === 'npc' || /tree|torch|sign|lamp|cloud|fountain|house|pillar|bush|flower|flag/i.test(p.name || '');
  if (world.parts.filter(isProp).length < 3) {
    const spawn = world.parts.find(p => p.k === 'spawn');
    const sx = spawn ? spawn.p[0] : 0, sy = spawn ? spawn.p[1] : 0, sz = spawn ? spawn.p[2] : 0;
    const ids = new Set(world.parts.map(p => p.id));
    let n = world.parts.length + 1;
    const nid = () => { let id; do { id = 'pp' + (n++); } while (ids.has(id)); ids.add(id); return id; };
    const add = (name, p, s, c, extra = {}) => { world.parts.push({ id: nid(), name, p, s, c, k: 'part', m: 'plastic', ...extra }); out.propsAdded++; };
    // Trees off to the sides of the spawn, torches lighting the way in,
    // and a greeter NPC who tells you the goal.
    add('Tree', [sx - 12, sy + 1.5, sz + 8], [1, 3, 1], '#5d4037', { m: 'wood' });
    add('TreeTop', [sx - 12, sy + 4.5, sz + 8], [3.5, 3.5, 3.5], '#2e7d32', { m: 'grass' });
    add('Tree', [sx + 12, sy + 1.5, sz + 8], [1, 3, 1], '#5d4037', { m: 'wood' });
    add('TreeTop', [sx + 12, sy + 4.5, sz + 8], [3.5, 3.5, 3.5], '#2e7d32', { m: 'grass' });
    add('TorchPost', [sx - 4, sy + 1, sz - 6], [0.6, 2, 0.6], '#5d4037', { m: 'wood', sh: 'cyl' });
    add('TorchFlame', [sx - 4, sy + 2.5, sz - 6], [1, 1, 1], '#ff6d00', { m: 'neon', sh: 'sph' });
    add('TorchPost', [sx + 4, sy + 1, sz - 6], [0.6, 2, 0.6], '#5d4037', { m: 'wood', sh: 'cyl' });
    add('TorchFlame', [sx + 4, sy + 2.5, sz - 6], [1, 1, 1], '#ff6d00', { m: 'neon', sh: 'sph' });
    const goal = world.objective ? world.objective.winCondition : 'Have fun!';
    add('Greeter', [sx + 7, sy + 2.5, sz + 2], [2, 5, 2], '#ffd400', { k: 'npc', dialog: `Welcome! ${goal}` });
  }
  return out;
}

// One call that finishes a FunAI world: a real objective, a hard section
// and a finished look, then the scripts entry so it survives publishing.
// Idempotent — a world that already has those keeps them.
export function finishFunaiWorld(world) {
  if (!world || !Array.isArray(world.parts)) return { objective: null, hardAdded: 0, look: { lightAdded: false, propsAdded: 0 } };
  if (!world.difficulty) world.difficulty = 'normal';
  let objective = normalizeObjective(world.objective, world) || normalizeObjective(readObjectiveEntry(world), world);
  if (!objective) objective = inferObjective(world);
  if (objective) world.objective = objective;
  const hardAdded = ensureHardSection(world, world.difficulty);
  const look = ensureFinishedLook(world);
  if (world.objective) syncObjectiveEntry(world);
  return { objective: world.objective || null, hardAdded, look };
}
