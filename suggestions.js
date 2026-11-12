// 💡 Suggestion Box: players submit ideas + code snippets, moderators
// review them, liked ones get marked approved for the team to add.
// Submitted code is NEVER executed — approval is a to-do flag, not a deploy.
// Wired into server.js via createSuggestions({ app, auth, modOnly, supabase, filter, logMod }).
import crypto from 'crypto';

export const suggestionsState = { tableOk: true };
const CATEGORIES = ['game', 'character', 'feature', 'fix', 'other'];
const CAT_LABEL = { game: '🎮 Game idea', character: '🧍 Character', feature: '✨ Feature', fix: '🐛 Fix', other: '💭 Other' };

export function createSuggestions(D) {
  const { app, auth, modOnly, isMod, supabase, filter, logMod } = D;
  const pub = s => ({ id: s.id, username: s.username, title: s.title, code: s.code, category: s.category, status: s.status, note: s.note || '', created: s.created });
  const checkTable = async () => {
    if (!suggestionsState.tableOk) return false;
    const { error } = await supabase.from('suggestions').select('id').limit(1);
    if (error) { suggestionsState.tableOk = false; return false; }
    return true;
  };
  const notifyAuthor = async (username, text, link) => {
    try { await supabase.from('notifications').insert({ username, type: 'suggestion', text, link: link || '#/suggest', created: Date.now() }); } catch {}
  };

  // Public list: approved + pending (newest first). Rejected stays hidden.
  app.get('/api/suggestions', async (req, res) => {
    if (!(await checkTable())) return res.json([]);
    const { data } = await supabase.from('suggestions').select('*').neq('status', 'rejected').order('created', { ascending: false }).limit(100);
    res.json((data || []).map(pub));
  });
  app.get('/api/suggestions/mine', auth, async (req, res) => {
    if (!(await checkTable())) return res.json([]);
    const { data } = await supabase.from('suggestions').select('*').eq('username', req.user.name).order('created', { ascending: false }).limit(50);
    res.json((data || []).map(pub));
  });
  app.get('/api/suggestions/status', async (req, res) => {
    const ok = await checkTable();
    res.json({ table: ok });
  });
  app.post('/api/suggestions', auth, async (req, res) => {
    if (!(await checkTable())) return res.status(500).json({ error: 'Suggestion Box is not set up yet — run supabase_suggestions.sql in Supabase' });
    const b = req.body || {};
    const title = filter(String(b.title || '').trim()).slice(0, 80);
    if (title.length < 3) return res.status(400).json({ error: 'Title must be at least 3 characters' });
    const code = String(b.code || '').slice(0, 20000);
    if (code.trim().length < 10) return res.status(400).json({ error: 'Tell us a bit more — at least a few words or a code snippet' });
    const category = CATEGORIES.includes(b.category) ? b.category : 'feature';
    try {
      const { data: mine } = await supabase.from('suggestions').select('id,status').eq('username', req.user.name);
      if ((mine || []).filter(r => r.status === 'pending').length >= 10) return res.status(400).json({ error: 'You have 10 suggestions awaiting review already' });
      if ((mine || []).length >= 100) return res.status(400).json({ error: 'Suggestion limit reached (100)' });
      const id = crypto.randomBytes(4).toString('hex');
      const row = { id, username: req.user.name, title, code, category, status: 'pending', note: '', created: Date.now() };
      const { data, error } = await supabase.from('suggestions').insert(row).select().single();
      if (error) throw error;
      res.json(pub(data));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  // Review queue (mods + owner).
  app.get('/api/suggestions/pending', auth, modOnly, async (req, res) => {
    if (!(await checkTable())) return res.json([]);
    const { data } = await supabase.from('suggestions').select('*').eq('status', 'pending').order('created', { ascending: true }).limit(100);
    res.json((data || []).map(pub));
  });
  const review = status => async (req, res) => {
    if (!(await checkTable())) return res.status(500).json({ error: 'Suggestion Box is not set up yet' });
    const note = filter(String(req.body?.note || '').trim()).slice(0, 200);
    const { data, error } = await supabase.from('suggestions').update({ status, note }).eq('id', req.params.id).eq('status', 'pending').select().single();
    if (error || !data) return res.status(404).json({ error: 'Suggestion not found or already reviewed' });
    logMod(req.user.name, 'suggestion_' + status, data.username, data.title);
    await notifyAuthor(data.username, status === 'approved' ? `✅ Your suggestion "${data.title}" was liked — it's on the list to add!` : `Thanks for "${data.title}" — not this time, but keep the ideas coming!`);
    res.json(pub(data));
  };
  app.post('/api/suggestions/:id/approve', auth, modOnly, review('approved'));
  app.post('/api/suggestions/:id/reject', auth, modOnly, review('rejected'));
  // Delete your own pending suggestion (mods can delete any pending one).
  app.delete('/api/suggestions/:id', auth, async (req, res) => {
    if (!(await checkTable())) return res.status(500).json({ error: 'Suggestion Box is not set up yet' });
    const { data } = await supabase.from('suggestions').select('*').eq('id', req.params.id).single();
    if (!data) return res.status(404).json({ error: 'Not found' });
    if (data.status !== 'pending') return res.status(400).json({ error: 'Only pending suggestions can be deleted' });
    if (data.username !== req.user.name && !isMod(req.user)) return res.status(403).json({ error: 'Not yours' });
    await supabase.from('suggestions').delete().eq('id', req.params.id);
    res.json({ ok: true });
  });
}
