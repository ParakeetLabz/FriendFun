// ✨ FunAI — game maker AI for Funtopia (server).
// Wired into server.js via createFunAI({ app, auth }).
// POST /api/funai/generate turns a player's idea into a FUNTOPIA STUDIO
// WORLD: { title, description, world: { sky, parts } } in exactly the
// shape POST /api/games + sanitizeWorld expect, so the client can save
// it as a real Funtopia experience and open it in Studio.
// The AI call goes to Zayd's ZStudio API (studio.zaydshub.com/api/chat)
// with the ZStudio key kept SERVER-SIDE in the FUNAI_API_KEY env var on
// Render — the key never ships to browsers or into this repo.
const ZSTUDIO_URL = 'https://studio.zaydshub.com/api/chat';

const SYSTEM = [
  'You are FunAI, a game maker AI inside Funtopia. You design a 3D block world for Funtopia Studio.',
  'Reply with ONLY a JSON object, no markdown, no commentary:',
  '{"title":"short game title","description":"one fun sentence","sky":"#8fc8ff","parts":[ ... ]}',
  'Each part is a compact ARRAY: [name, x,y,z, sx,sy,sz, "#hexcolor", kind, material]',
  'Example part: ["Platform",0,2,-10, 6,1,6, "#ff595e","part","plastic"]',
  '- (x,y,z) is the part CENTER, (sx,sy,sz) its size. y is UP. Ground level is y=0: include a ground like ["Ground",0,-0.5,0, 120,1,120, "#4caf50","part","grass"].',
  '- kind must be one of: part, spawn, kill, checkpoint, win, bounce, coin, speed, npc, heal. Exactly ONE spawn: ["SpawnLocation",0,0.25,-40, 6,0.5,6, "#3a7bd5","spawn","spawn"] placed ON the ground near the start.',
  '- material must be one of: plastic, neon, grass, wood, brick, glass, concrete, sand, baseplate, spawn, metal.',
  '- Gameplay: an obby/course needs platforms spaced for jumping (gaps of 4-8 blocks, height steps of 1-3), kill parts (lava) below or as hazards, checkpoint parts along the way, coin parts as rewards, and ONE win part at the end. A hangout needs buildings, trees, furniture-ish blocks and one npc.',
  '- An npc part may add a 10th element: an object like {"dialog":"Welcome!"} — npc size is [2,5,2]. Any part may add that object with "mv":{"a":"x","d":6,"s":1} (slides along an axis) or "blink":{"on":2.5,"off":1.3}.',
  '- Use 40 to 90 parts. Keep numbers tidy (whole or .5 steps). Everything must connect: a player must be able to REACH the win part from the spawn by walking/jumping.',
  '- Keep the JSON compact: short names, no spaces you do not need, no comments, no extra fields.',
].join('\n');

const KINDS = ['part', 'spawn', 'kill', 'checkpoint', 'win', 'bounce', 'coin', 'speed', 'npc', 'heal', 'jump'];
const MATS = ['plastic', 'neon', 'grass', 'wood', 'brick', 'glass', 'concrete', 'sand', 'baseplate', 'spawn', 'metal'];
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// The AI may answer with array rows (the requested format) or, if it
// ignores instructions, plain part objects. Accept both.
function normalizePart(p) {
  if (Array.isArray(p)) {
    const ex = (p[10] && typeof p[10] === 'object') ? p[10] : {};
    return { name: p[0], p: [p[1], p[2], p[3]], s: [p[4], p[5], p[6]], c: p[7], k: p[8], m: p[9], ...ex };
  }
  return p || {};
}

// Mirror of server.js sanitizeWorld's part rules, tightened for AI output.
function cleanParts(raw) {
  const parts = (Array.isArray(raw) ? raw : []).slice(0, 240).map((rawP, i) => {
    const p = normalizePart(rawP);
    const k = KINDS.includes(p?.k) ? p.k : 'part';
    const out = {
      id: 'p' + (i + 1),
      name: String(p?.name || 'Part').slice(0, 40),
      p: [0, 1, 2].map(j => clamp(num(p?.p?.[j]), -1000, 1000)),
      s: [0, 1, 2].map(j => clamp(num(p?.s?.[j], 1), 0.05, 300)),
      c: /^#[0-9a-fA-F]{6}$/.test(p?.c || '') ? p.c : '#a3a2a5',
      k, m: MATS.includes(p?.m) ? p.m : 'plastic',
    };
    if (k === 'npc') { out.dialog = String(p?.dialog || '').slice(0, 200); out.wander = p?.wander !== false; out.enemy = p?.enemy === true; }
    if (p?.cc === false) out.cc = false;
    if (p?.tr) out.tr = clamp(num(p.tr), 0, 1);
    if (p?.mv && ['x', 'y', 'z'].includes(p.mv.a) && Math.abs(num(p.mv.d)) >= 1) out.mv = { a: p.mv.a, d: clamp(num(p.mv.d), -120, 120), s: clamp(num(p.mv.s, 1), 0.2, 4) };
    if (p?.blink) out.blink = { on: clamp(num(p.blink.on, 2), 0.3, 30), off: clamp(num(p.blink.off, 1.5), 0.3, 30) };
    return out;
  });
  // Guarantee a spawn: keep the first one the AI made, demote extras,
  // or add one if there is none.
  let seenSpawn = false;
  for (const p of parts) {
    if (p.k === 'spawn') { if (seenSpawn) p.k = 'part'; seenSpawn = true; }
  }
  if (!seenSpawn) parts.push({ id: 'p' + (parts.length + 1), name: 'SpawnLocation', p: [0, 0.75, 0], s: [6, 0.5, 6], c: '#3a7bd5', k: 'spawn', m: 'spawn' });
  // Guarantee walkable ground somewhere under the action.
  const hasGround = parts.some(p => p.s[0] >= 20 && p.s[2] >= 20 && p.p[1] <= 1.5);
  if (!hasGround) parts.unshift({ id: 'p0', name: 'Ground', p: [0, -0.5, 0], s: [80, 1, 80], c: '#4caf50', k: 'part', m: 'grass' });
  return parts;
}

function stripToJson(text) {
  let t = String(text || '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return t;
}

const strField = (t, f) => { const m = t.match(new RegExp('"' + f + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"')); if (!m) return ''; try { return JSON.parse('"' + m[1] + '"'); } catch { return m[1]; } };

// If the reply was cut off mid-JSON (long worlds can hit the model's
// output limit), salvage every COMPLETE part element from the parts
// array instead of failing the whole generation.
function salvageParts(text) {
  const at = text.indexOf('"parts"');
  if (at < 0) return [];
  const open = text.indexOf('[', at);
  if (open < 0) return [];
  const out = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = open + 1; i < text.length; i++) {
    const ch = text[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '[' || ch === '{') { if (depth === 0) start = i; depth++; }
    else if (ch === ']' || ch === '}') {
      if (depth === 0) break; // the parts array itself closed
      depth--;
      if (depth === 0 && start >= 0) {
        try { out.push(JSON.parse(text.slice(start, i + 1))); } catch {}
        start = -1;
      }
    }
  }
  return out;
}

function buildWorld(title, description, sky, rawParts) {
  if (!Array.isArray(rawParts) || rawParts.length < 8) return null;
  return {
    title: String(title || 'FunAI Game').slice(0, 50),
    description: String(description || 'Made with ✨ FunAI').slice(0, 300),
    world: { sky: /^#[0-9a-fA-F]{6}$/.test(sky || '') ? sky : '#8fc8ff', parts: cleanParts(rawParts) },
  };
}

function extractWorld(text) {
  const raw = String(text || '');
  try {
    const j = JSON.parse(stripToJson(raw));
    const g = j && buildWorld(j.title, j.description, j.sky, j.parts);
    if (g) return g;
  } catch {}
  // Truncated or slightly broken JSON: salvage complete parts.
  const parts = salvageParts(raw);
  if (parts.length >= 8) {
    return buildWorld(strField(raw, 'title'), strField(raw, 'description'), strField(raw, 'sky'), parts);
  }
  return null;
}

async function callAI(key, messages) {
  // gpt-oss-120b designs the best worlds; fall back to the faster 20b.
  let lastErr = null;
  for (const model of ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 90000);
      const r = await fetch(ZSTUDIO_URL, {
        method: 'POST', signal: ctl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
        body: JSON.stringify({ model, messages }),
      });
      clearTimeout(timer);
      const data = await r.json().catch(() => null);
      if (!r.ok) { lastErr = new Error(data?.error?.message || ('AI request failed (' + r.status + ')')); continue; }
      const game = extractWorld(data?.choices?.[0]?.message?.content || '');
      if (game) return game;
      lastErr = new Error('The AI did not return a usable world. Try again!');
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('FunAI request failed');
}

export function createFunAI(D) {
  const { app, auth } = D;
  // Simple per-user rate limit so one player can't burn the key:
  // max 12 generations per rolling hour.
  const hits = new Map();
  const limited = name => {
    const now = Date.now();
    const arr = (hits.get(name) || []).filter(t => now - t < 3600000);
    if (arr.length >= 12) { hits.set(name, arr); return true; }
    arr.push(now); hits.set(name, arr); return false;
  };

  app.get('/api/funai/status', auth, (req, res) => {
    res.json({ configured: !!process.env.FUNAI_API_KEY });
  });

  app.post('/api/funai/generate', auth, async (req, res) => {
    const key = process.env.FUNAI_API_KEY || '';
    if (!key) return res.status(503).json({ error: 'FunAI is not switched on yet — Zayd needs to add FUNAI_API_KEY in Render.' });
    if (limited(req.user.name.toLowerCase())) return res.status(429).json({ error: 'FunAI needs a breather — you hit 12 games this hour. Try again later!' });
    const prompt = String(req.body?.prompt || '').trim().slice(0, 600);
    if (prompt.length < 3) return res.status(400).json({ error: 'Tell FunAI what game to make (a few words at least).' });
    const style = String(req.body?.style || '').trim().slice(0, 40);
    const prev = req.body?.world && Array.isArray(req.body.world.parts) ? { sky: req.body.world.sky, parts: cleanParts(req.body.world.parts) } : null;
    const messages = [{ role: 'system', content: SYSTEM }];
    if (prev) {
      messages.push({ role: 'user', content: 'Here is an existing Funtopia world you designed (parts shown as objects):\n' + JSON.stringify(prev).slice(0, 30000) + '\n\nMake this change and return the FULL updated world in the same JSON format (parts as compact arrays): ' + prompt });
    } else {
      messages.push({ role: 'user', content: 'Design this game: ' + prompt + (style ? '\nStyle: ' + style : '') });
    }
    try {
      const game = await callAI(key, messages);
      res.json(game);
    } catch (e) {
      res.status(502).json({ error: 'FunAI failed: ' + (e.name === 'AbortError' ? 'the AI took too long — try a simpler idea!' : e.message) });
    }
  });
}
