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
  'Each part is: {"name":"Platform","p":[x,y,z],"s":[sx,sy,sz],"c":"#hexcolor","k":"part","m":"plastic"}',
  '- p = CENTER position, s = size. y is UP. Ground level is y=0: a ground part like {"name":"Ground","p":[0,-0.5,0],"s":[120,1,120],"c":"#4caf50","k":"part","m":"grass"}.',
  '- k (kind) must be one of: part, spawn, kill, checkpoint, win, bounce, coin, speed, npc, heal. Exactly ONE spawn part: {"name":"SpawnLocation","p":[0,0.25,-40],"s":[6,0.5,6],"c":"#3a7bd5","k":"spawn","m":"spawn"} placed ON the ground near the start.',
  '- m (material) must be one of: plastic, neon, grass, wood, brick, glass, concrete, sand, baseplate, spawn, metal.',
  '- Gameplay: an obby/course needs platforms spaced for jumping (gaps of 4-8 blocks, height steps of 1-3), kill parts (lava) below or as hazards, checkpoint parts along the way, coin parts as rewards, and ONE win part at the end. A hangout needs buildings, trees, furniture-ish blocks and an npc with a "dialog" string.',
  '- npc parts may add "dialog":"..." (max 120 chars) and are sized like a person: s:[2,5,2].',
  '- A part may move: add "mv":{"a":"x","d":6,"s":1} (slides along axis a by d blocks at speed s) — great for moving platforms. Or blink: "blink":{"on":2.5,"off":1.3}.',
  '- Use 50 to 160 parts. Keep numbers tidy (whole or .5 steps). z usually runs from the spawn (positive z or 0) toward negative z for courses, but any layout that makes sense is fine. Everything must connect: a player must be able to REACH the win part from the spawn by walking/jumping.',
  '- Keep the JSON compact: short names, no comments, no extra fields.',
].join('\n');

const KINDS = ['part', 'spawn', 'kill', 'checkpoint', 'win', 'bounce', 'coin', 'speed', 'npc', 'heal', 'jump'];
const MATS = ['plastic', 'neon', 'grass', 'wood', 'brick', 'glass', 'concrete', 'sand', 'baseplate', 'spawn', 'metal'];
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Mirror of server.js sanitizeWorld's part rules, tightened for AI output.
function cleanParts(raw) {
  const parts = (Array.isArray(raw) ? raw : []).slice(0, 240).map((p, i) => {
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
  // Guarantee a spawn: keep the first one the AI made, drop extra spawns
  // down to kind 'part', or add one if there is none.
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

function extractWorld(text) {
  try {
    const j = JSON.parse(stripToJson(text));
    if (j && Array.isArray(j.parts) && j.parts.length >= 8) {
      return {
        title: String(j.title || 'FunAI Game').slice(0, 50),
        description: String(j.description || 'Made with ✨ FunAI').slice(0, 300),
        world: { sky: /^#[0-9a-fA-F]{6}$/.test(j.sky || '') ? j.sky : '#8fc8ff', parts: cleanParts(j.parts) },
      };
    }
  } catch {}
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
      messages.push({ role: 'user', content: 'Here is an existing Funtopia world you designed:\n' + JSON.stringify(prev).slice(0, 30000) + '\n\nMake this change and return the FULL updated world in the same JSON format: ' + prompt });
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
