// ✨ FunAI — game maker AI for Funtopia (server).
// Wired into server.js via createFunAI({ app, auth }).
// POST /api/funai/generate turns a player's idea into ONE complete,
// self-contained HTML game. The AI call goes to Zayd's ZStudio API
// (studio.zaydshub.com/api/chat) with the ZStudio key kept SERVER-SIDE
// in the FUNAI_API_KEY env var on Render — the key never ships to
// browsers or into this repo.
const ZSTUDIO_URL = 'https://studio.zaydshub.com/api/chat';

const SYSTEM = [
  'You are FunAI, a game maker AI inside Funtopia. You turn a game idea into ONE complete, playable, self-contained HTML file.',
  'Reply with ONLY a JSON object, no markdown, no commentary: {"title":"short game title","html":"the complete HTML file as a string"}',
  'Rules for the html:',
  '- One single HTML file: inline <style> and <script> only. NO external images, fonts, scripts or URLs of any kind.',
  '- Playable immediately: a start screen with the title + how to play + a Play button, the game itself, a score, and a game-over screen with a Restart button.',
  '- Controls: keyboard AND touch/click, so it works on phones.',
  '- Keep it COMPACT: aim for under 6000 characters total. Short variable names, minimal whitespace, no comments. A small game that is COMPLETE beats a big game that is cut off.',
  '- Bright, fun colors. Use a <canvas> or DOM, your choice. Make sure the code actually runs: define everything before use, no syntax errors.',
].join('\n');

function stripToJson(text) {
  let t = String(text || '').trim();
  t = t.replace(/^```(?:json|html)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return t;
}

function extractGame(text) {
  // Preferred path: the model returned {"title","html"} JSON.
  try {
    const j = JSON.parse(stripToJson(text));
    if (j && typeof j.html === 'string' && j.html.includes('<')) {
      return { title: String(j.title || 'FunAI Game').slice(0, 60), html: j.html };
    }
  } catch {}
  // Fallback: it returned raw HTML instead of JSON.
  const raw = String(text || '').replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '').trim();
  if (/<!doctype html|<html[\s>]/i.test(raw) && raw.includes('<script')) {
    const m = raw.match(/<title>([^<]{1,60})<\/title>/i);
    return { title: (m ? m[1] : 'FunAI Game').slice(0, 60), html: raw };
  }
  return null;
}

async function callAI(key, messages) {
  // gpt-oss-120b writes the best games; if it errors or returns junk,
  // fall back to the faster 20b.
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
      const text = data?.choices?.[0]?.message?.content || '';
      const game = extractGame(text);
      if (game) return game;
      lastErr = new Error('The AI did not return a playable game. Try again!');
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
    const prev = typeof req.body?.code === 'string' ? req.body.code.slice(0, 20000) : '';
    const messages = [{ role: 'system', content: SYSTEM }];
    if (prev) {
      messages.push({ role: 'user', content: 'Here is an existing game you made:\n' + prev + '\n\nMake this change and return the FULL updated game in the same JSON format: ' + prompt });
    } else {
      messages.push({ role: 'user', content: 'Make this game: ' + prompt + (style ? '\nStyle: ' + style : '') });
    }
    try {
      const game = await callAI(key, messages);
      if (game.html.length > 60000) game.html = game.html.slice(0, 60000);
      res.json(game);
    } catch (e) {
      res.status(502).json({ error: 'FunAI failed: ' + (e.name === 'AbortError' ? 'the AI took too long — try a simpler idea!' : e.message) });
    }
  });
}
