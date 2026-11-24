// 💬 FunTopia Forums (Phase 3) — public forum pages where posts and
// comments are visible to everyone, so moderators can see and stop bad
// stuff fast. Wired into server.js via
//   createForums({ app, auth, modOnly, supabase, chatFilter, safetyFilter, logMod }).
//
// Safety (Phase 1 rules, reused — never re-implemented here):
// - Links + addresses/phones are stripped with safetyFilter() BEFORE
//   storing, so they never sit in the database in readable form.
// - Swearing is filtered PER READER with chatFilter() at read time:
//   children (and unverified adults) see hashtags; verified adults see
//   other verified adults' swearing. Stored text keeps the original
//   words so each reader gets the version that is right for them.
// - Never collect home addresses. Never add a liability shield for the
//   platform (the approved contract says predators are personally liable).
// - Server-side `filter()` from server.js is NOT used here: it slices
//   text to 200 chars and masks swearing for everyone, which would break
//   the 2000-char body limit and the per-reader swearing rule.

export const forumsState = { tableOk: true };

const TITLE_MAX = 120;
const BODY_MAX = 2000;

export function createForums(D) {
  const { app, auth, modOnly, supabase, chatFilter, safetyFilter, logMod } = D;
  const log = (...a) => { if (typeof logMod === 'function') { try { logMod(...a); } catch {} } };

  // Re-checked on every request (not sticky) so the feature starts working
  // as soon as the owner runs the Phase 3 SQL — no restart needed.
  const checkTables = async () => {
    const { error: e1 } = await supabase.from('forum_posts').select('id').limit(1);
    if (e1) return false;
    const { error: e2 } = await supabase.from('forum_replies').select('id').limit(1);
    if (e2) return false;
    return true;
  };

  // What one reader sees: title/body filtered for THEM (per-reader swearing).
  const pubPost = (p, viewer) => ({
    id: p.id,
    author: p.author,
    title: chatFilter(p.title, viewer),
    body: chatFilter(p.body, viewer),
    created_at: p.created_at,
  });
  const pubReply = (r, viewer) => ({
    id: r.id,
    post_id: r.post_id,
    author: r.author,
    body: chatFilter(r.body, viewer),
    created_at: r.created_at,
  });

  // Setup status (the client shows a setup message while the SQL is unrun).
  app.get('/api/forums/status', async (req, res) => {
    res.json({ table: await checkTables() });
  });

  // Public list: newest first. No auth — anyone can read the forums,
  // which is the point: moderators can see everything, fast.
  app.get('/api/forums', async (req, res) => {
    if (!(await checkTables())) return res.json([]);
    const { data } = await supabase.from('forum_posts').select('*').order('created_at', { ascending: false }).limit(100);
    res.json((data || []).map(p => pubPost(p, req.user || {})));
  });

  // New post (logged in only).
  app.post('/api/forums', auth, async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'Forums are not set up yet — run the Phase 3 SQL in Supabase' });
    const b = req.body || {};
    // Links + addresses stripped before storing; swearing stays in the
    // stored text and is filtered per reader at read time.
    const title = safetyFilter(String(b.title || '').trim().replace(/\s+/g, ' ')).slice(0, TITLE_MAX);
    if (title.length < 3) return res.status(400).json({ error: 'Give your post a title (at least 3 characters)' });
    const body = safetyFilter(String(b.body || '').trim()).slice(0, BODY_MAX);
    if (body.length < 3) return res.status(400).json({ error: 'Write something first (at least 3 characters)' });
    try {
      const row = { author: req.user.name, title, body };
      const { data, error } = await supabase.from('forum_posts').insert(row).select().single();
      if (error) throw error;
      res.json(pubPost(data, req.user));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // One post + its replies (oldest reply first).
  app.get('/api/forums/:id', async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'Forums are not set up yet — run the Phase 3 SQL in Supabase' });
    const { data: post } = await supabase.from('forum_posts').select('*').eq('id', req.params.id).maybeSingle();
    if (!post) return res.status(404).json({ error: 'No such post' });
    const { data: replies } = await supabase.from('forum_replies').select('*').eq('post_id', post.id).order('created_at', { ascending: true }).limit(200);
    res.json({ post: pubPost(post, req.user || {}), replies: (replies || []).map(r => pubReply(r, req.user || {})) });
  });

  // Reply to a post (logged in only).
  app.post('/api/forums/:id/reply', auth, async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'Forums are not set up yet — run the Phase 3 SQL in Supabase' });
    const { data: post } = await supabase.from('forum_posts').select('id').eq('id', req.params.id).maybeSingle();
    if (!post) return res.status(404).json({ error: 'No such post' });
    const body = safetyFilter(String(req.body?.body || '').trim()).slice(0, BODY_MAX);
    if (body.length < 3) return res.status(400).json({ error: 'Write a reply first (at least 3 characters)' });
    try {
      const row = { post_id: post.id, author: req.user.name, body };
      const { data, error } = await supabase.from('forum_replies').insert(row).select().single();
      if (error) throw error;
      res.json(pubReply(data, req.user));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Delete a whole post + its replies (moderators only).
  app.delete('/api/forums/:id', auth, modOnly, async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'Forums are not set up yet' });
    const { data: post } = await supabase.from('forum_posts').select('*').eq('id', req.params.id).maybeSingle();
    if (!post) return res.status(404).json({ error: 'No such post' });
    // Replies are deleted explicitly as well as by the ON DELETE CASCADE
    // in the SQL, so removal works even if the cascade was never applied.
    await supabase.from('forum_replies').delete().eq('post_id', post.id);
    const { error } = await supabase.from('forum_posts').delete().eq('id', post.id);
    if (error) return res.status(500).json({ error: error.message });
    log(req.user.name, 'forum_delete_post', post.author, post.title);
    res.json({ ok: true });
  });

  // Delete one reply (moderators only).
  app.delete('/api/forums/reply/:id', auth, modOnly, async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'Forums are not set up yet' });
    const { data: reply } = await supabase.from('forum_replies').select('*').eq('id', req.params.id).maybeSingle();
    if (!reply) return res.status(404).json({ error: 'No such reply' });
    const { error } = await supabase.from('forum_replies').delete().eq('id', reply.id);
    if (error) return res.status(500).json({ error: error.message });
    log(req.user.name, 'forum_delete_reply', reply.author, reply.body.slice(0, 80));
    res.json({ ok: true });
  });

  return { getForumsStatus: () => ({ table: forumsState.tableOk }) };
}
