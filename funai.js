// ✨ FunAI — game maker AI for Funtopia (server).
import { ITEM, CATALOG, DEFAULT_AVATAR } from './public/js/catalog.js';
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
// ignores instructions, plain part objects. Accept both — including
// objects that use position/size keys or {x,y,z} vectors.
const vec3 = v => Array.isArray(v) ? v : (v && typeof v === 'object' ? [v.x, v.y, v.z] : v);
function normalizePart(p) {
  if (Array.isArray(p)) {
    const ex = (p[10] && typeof p[10] === 'object') ? p[10] : {};
    return { name: p[0], p: [p[1], p[2], p[3]], s: [p[4], p[5], p[6]], c: p[7], k: p[8], m: p[9], ...ex };
  }
  if (p && typeof p === 'object') {
    return {
      ...p,
      p: vec3(p.p ?? p.position ?? p.pos),
      s: vec3(p.s ?? p.size ?? p.scale),
      c: p.c ?? p.color ?? p.colour,
      k: String(p.k ?? p.kind ?? p.type ?? 'part').toLowerCase(),
      m: String(p.m ?? p.material ?? 'plastic').toLowerCase(),
    };
  }
  return {};
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
  // Guarantee a finish for course-like worlds (they have checkpoints but
  // the AI sometimes forgets the win pad): put a WinPad on top of the
  // platform farthest from the spawn — by construction it is on the course.
  if (!parts.some(p => p.k === 'win') && parts.some(p => p.k === 'checkpoint')) {
    const spawn = parts.find(p => p.k === 'spawn');
    const cands = parts.filter(p => ['part', 'checkpoint', 'bounce'].includes(p.k) && p.s[0] >= 3 && p.s[2] >= 3);
    if (spawn && cands.length) {
      const far = cands.reduce((a, b) => {
        const da = (a.p[0] - spawn.p[0]) ** 2 + (a.p[2] - spawn.p[2]) ** 2;
        const db = (b.p[0] - spawn.p[0]) ** 2 + (b.p[2] - spawn.p[2]) ** 2;
        return db > da ? b : a;
      });
      parts.push({ id: 'p' + (parts.length + 1), name: 'WinPad', p: [far.p[0], far.p[1] + far.s[1] / 2 + 0.26, far.p[2]], s: [5, 0.5, 5], c: '#ffd700', k: 'win', m: 'neon' });
    }
  }
  return parts;
}

// --- AI Skin Maker ---
// The AI designs a character outfit ("skin"): head + face + hat + shirt +
// body colors, picked ONLY from the buyable catalog below (no event-only
// limited items, no FriendClub-only items — the maker can buy the rest).
const SKIN_SLOTS = ['head', 'face', 'hat', 'shirt'];
const SKIN_DEFAULTS = { head: 'head_classic', face: 'face_smile', hat: 'hat_none', shirt: 'shirt_none' };
const SKIN_COLOR_KEYS = ['head', 'torso', 'larm', 'rarm', 'lleg', 'rleg'];
const hex6 = v => (/^#[0-9a-fA-F]{6}$/.test(v || '') ? v : null);
function skinCatalog() {
  const out = {};
  for (const t of SKIN_SLOTS) out[t] = CATALOG.filter(i => i.type === t && !i.limited && !i.club).map(i => ({ id: i.id, name: i.name, price: i.free ? 0 : (i.price || 0) }));
  return out;
}
// Validate a skin spec (AI output or a remix "prev"): unknown ids fall back
// to the defaults and are reported in `swaps` so the client can say so.
function cleanSkinSpec(j) {
  if (!j || typeof j !== 'object') return null;
  const swaps = [];
  const pick = slot => {
    const id = String(j[slot] || '');
    if (id === slot + '_none') return id;
    const it = ITEM[id];
    if (it && it.type === slot && !it.limited && !it.club) return id;
    if (id) swaps.push(slot);
    return SKIN_DEFAULTS[slot];
  };
  const colors = {};
  for (const k of SKIN_COLOR_KEYS) colors[k] = hex6(j.colors?.[k]) || DEFAULT_AVATAR.colors[k];
  return {
    name: String(j.name || 'AI Look').slice(0, 40) || 'AI Look',
    description: String(j.description || 'Made with ✨ FunAI').slice(0, 200),
    avatar: { head: pick('head'), face: pick('face'), hat: pick('hat'), shirt: pick('shirt'), colors },
    swaps,
  };
}
function extractSkin(text) {
  let j = null;
  try { j = JSON.parse(stripToJson(text)); } catch { return null; }
  return cleanSkinSpec(j);
}
const SKIN_SYSTEM = [
  'You are FunAI, an AI skin designer inside Funtopia. You design a character outfit ("skin") for a player blocky R6 avatar.',
  'Reply with ONLY a JSON object, no markdown, no commentary:',
  '{"name":"short look name","description":"one fun sentence","head":"head_classic","face":"face_smile","hat":"hat_none","shirt":"shirt_none","colors":{"head":"#f5cd30","torso":"#0d69ac","larm":"#f5cd30","rarm":"#f5cd30","lleg":"#a4bd47","rleg":"#a4bd47"}}',
  '- head/face/hat/shirt MUST be ids from the catalog lists in the request — never invent an id. "hat_none" means no hat, "shirt_none" means no shirt.',
  '- colors: six #rrggbb hex colors for the body parts (head skin, torso, left arm, right arm, left leg, right leg). Match them to the theme.',
  '- Match the player description: be bold and specific, pick the most thematic pieces — not the defaults. A vampire gets fangs and a dark cape, a robot gets metal and glowing eyes.',
  '- name is a short punchy look name (max 5 words). description is one fun sentence about the look.',
].join('\n');

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
  if (!Array.isArray(rawParts) || rawParts.length < 6) return null;
  return {
    title: String(title || 'FunAI Game').slice(0, 50),
    description: String(description || 'Made with ✨ FunAI').slice(0, 300),
    world: { sky: /^#[0-9a-fA-F]{6}$/.test(sky || '') ? sky : '#8fc8ff', parts: cleanParts(rawParts) },
  };
}

const worldNudge = attempt => 'IMPORTANT: your previous reply could not be used. Reply with ONLY the JSON object — no reasoning, no markdown, no commentary. Parts MUST be compact arrays like ["Platform",0,2,-10,6,1,6,"#ff595e","part","plastic"]. ' + (attempt >= 2 ? 'Use at most 30 parts and the simplest layout that works. ' : 'Use 30 to 60 parts. ') + 'Make sure the JSON is complete and closes with ]}.';

function extractWorld(text) {
  const raw = String(text || '');
  try {
    const j = JSON.parse(stripToJson(raw));
    const g = j && buildWorld(j.title, j.description, j.sky, j.parts);
    if (g) return g;
  } catch {}
  // Truncated or slightly broken JSON: salvage complete parts.
  const parts = salvageParts(raw);
  if (parts.length >= 6) {
    return buildWorld(strField(raw, 'title'), strField(raw, 'description'), strField(raw, 'sky'), parts);
  }
  return null;
}

async function callAI(key, messages, extract, failMsg, nudgeForAttempt) {
  // gpt-oss-120b designs the best worlds; fall back to the faster 20b.
  // Each model gets a second attempt with a corrective nudge — the
  // reasoning models sometimes return empty or non-JSON content, and
  // one retry with "ONLY the JSON, keep it short" fixes most of those.
  let lastErr = null;
  // NOTE: llama-3.3-70b-versatile is NOT usable here — Groq moved it to
  // Enterprise and Zayd's key gets "does not exist or you do not have
  // access" (tried Nov 1, 2026). Only the gpt-oss models work, and they
  // intermittently return EMPTY content; empty replies come back fast,
  // so each model gets 3 attempts and later attempts demand a smaller,
  // simpler world (less reasoning = less likely to come back empty).
  for (const model of ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const msgs = attempt === 0 ? messages : [...messages, { role: 'user', content: nudgeForAttempt(attempt) }];
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 90000);
        const r = await fetch(ZSTUDIO_URL, {
          method: 'POST', signal: ctl.signal,
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
          body: JSON.stringify({ model, messages: msgs }),
        });
        clearTimeout(timer);
        const data = await r.json().catch(() => null);
        if (!r.ok) { lastErr = new Error(data?.error?.message || ('AI request failed (' + r.status + ')')); continue; }
        const content = data?.choices?.[0]?.message?.content || '';
        const result = extract(content);
        if (result) return result;
        lastErr = new Error(failMsg);
        lastErr.raw = String(content).slice(0, 1500);
      } catch (e) { lastErr = e; }
    }
  }
  throw lastErr || new Error('FunAI request failed');
}

export function createFunAI(D) {
  const { app, auth } = D;
  // Simple per-user rate limit so one player can't burn the key:
  // max 12 generations per rolling hour.
  const hits = new Map();
  const limited = (key, max) => {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter(t => now - t < 3600000);
    if (arr.length >= max) { hits.set(key, arr); return true; }
    arr.push(now); hits.set(key, arr); return false;
  };

  app.get('/api/funai/status', auth, (req, res) => {
    res.json({ configured: !!process.env.FUNAI_API_KEY });
  });

  app.post('/api/funai/generate', auth, async (req, res) => {
    const key = process.env.FUNAI_API_KEY || '';
    if (!key) return res.status(503).json({ error: 'FunAI is not switched on yet — Zayd needs to add FUNAI_API_KEY in Render.' });
    if (limited(req.user.name.toLowerCase(), 12)) return res.status(429).json({ error: 'FunAI needs a breather — you hit 12 games this hour. Try again later!' });
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
      const game = await callAI(key, messages, extractWorld, 'The AI did not return a usable world. Try again!', worldNudge);
      res.json(game);
    } catch (e) {
      const body = { error: 'FunAI failed: ' + (e.name === 'AbortError' ? 'the AI took too long — try a simpler idea!' : e.message) };
      // Owner/test accounts get the raw AI reply snippet so a bad
      // generation can actually be diagnosed instead of guessed at.
      if (e.raw && ['fun', 'funaitest31'].includes(req.user.name.toLowerCase())) body.debug = e.raw;
      res.status(502).json(body);
    }
  });

  // POST /api/funai/skin — describe a look, FunAI designs the outfit.
  // Returns { name, description, avatar: { head, face, hat, shirt, colors }, swaps }.
  // Picks are validated server-side (unknown ids fall back, see cleanSkinSpec);
  // ownership is enforced later by PUT /api/me/avatar when the look is worn,
  // and the client buys any missing pieces first via POST /api/buy/:item.
  app.post('/api/funai/skin', auth, async (req, res) => {
    const key = process.env.FUNAI_API_KEY || '';
    if (!key) return res.status(503).json({ error: 'FunAI is not switched on yet — Zayd needs to add FUNAI_API_KEY in Render.' });
    if (limited(req.user.name.toLowerCase() + ':skin', 20)) return res.status(429).json({ error: 'FunAI needs a breather — you hit 20 skins this hour. Try again later!' });
    const prompt = String(req.body?.prompt || '').trim().slice(0, 600);
    if (prompt.length < 3) return res.status(400).json({ error: 'Tell FunAI what look to make (a few words at least).' });
    const prev = cleanSkinSpec(req.body?.prev);
    const cat = skinCatalog();
    const listFor = t => cat[t].map(i => `${i.id} (${i.name}${i.price ? ', ' + i.price + ' FunTix' : ', free'})`).join(', ');
    const messages = [{ role: 'system', content: SKIN_SYSTEM }];
    messages.push({ role: 'user', content: (prev ? 'Here is the current look (JSON):\n' + JSON.stringify(prev.avatar) + '\n\nChange it like this and return the FULL updated look in the same JSON format: ' : 'Design this look: ') + prompt + '\n\nCatalog — pick each piece ONLY from these lists:\nHeads: ' + listFor('head') + '\nFaces: ' + listFor('face') + '\nHats: ' + listFor('hat') + '\nShirts: ' + listFor('shirt') });
    try {
      const skin = await callAI(key, messages, extractSkin, 'The AI did not return a usable look. Try again!', () => 'IMPORTANT: your previous reply could not be used. Reply with ONLY the JSON object — no reasoning, no markdown, no commentary. Pick ids ONLY from the catalog lists. Make sure the JSON is complete and closes with }.');
      res.json(skin);
    } catch (e) {
      const body = { error: 'FunAI failed: ' + (e.name === 'AbortError' ? 'the AI took too long — try a simpler idea!' : e.message) };
      if (e.raw && ['fun', 'funaitest31'].includes(req.user.name.toLowerCase())) body.debug = e.raw;
      res.status(502).json(body);
    }
  });
}
