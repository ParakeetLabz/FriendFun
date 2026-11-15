// 👨‍👩‍👧‍👦 FunTopia Family: connect accounts into one family, family-only chat,
// and a shared family account (name, color, icon, motto) only members see.
// Plus display names for every player (shown instead of the username in the
// lobby, chat and profiles; empty = fall back to the username).
// Wired into server.js via createFamily({ app, auth, supabase, filter, notify, key }).
import crypto from 'crypto';

const MAX_MEMBERS = 10;
const MAX_CHAT_LEN = 500;
const FAMILY_COLORS = ['#7c3aed', '#e2231a', '#0284c7', '#16a34a', '#ec4899', '#f59e0b', '#06b6d4', '#ef4444'];
const FAMILY_ICONS = ['🏠', '👨‍👩‍👧‍👦', '⭐', '❤️', '🔥', '🌈', '👑', '🎮'];

export function createFamily(D) {
  const { app, auth, supabase, filter, notify, key } = D;
  const norm = n => String(n || '').trim().toLowerCase();
  const cleanStr = (s, max) => String(s || '').trim().replace(/\s+/g, ' ').slice(0, max);
  const genCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();
  const genId = () => 'f_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);

  // Re-checked on every request (not sticky) so the feature starts working
  // as soon as the owner runs supabase_family.sql — no restart needed.
  const checkTables = async () => {
    const { error } = await supabase.from('families').select('id').limit(1);
    return !error;
  };
  const checkDisplayCol = async () => {
    const { error } = await supabase.from('users').select('display_name').limit(1);
    return !error;
  };
  const myFamily = async (username) => {
    const { data } = await supabase.from('families').select('*').contains('members', [key(username)]).maybeSingle();
    return data || null;
  };
  const memberDetails = async (members) => {
    if (!members?.length) return [];
    const { data } = await supabase.from('users').select('name, display_name, avatar').in('name', members.map(key));
    const byName = new Map((data || []).map(u => [key(u.name), u]));
    return members.map(n => {
      const u = byName.get(key(n));
      return { name: n, displayName: u?.display_name || '', avatar: u?.avatar || null };
    });
  };
  const pubFamily = async (f, includeCode) => ({
    id: f.id, name: f.name, owner: f.owner, color: f.color, icon: f.icon, motto: f.motto || '',
    created: f.created, members: await memberDetails(f.members),
    ...(includeCode ? { code: f.code } : {}),
  });
  const notifyMembers = async (f, except, text) => {
    for (const m of (f.members || [])) if (key(m) !== key(except)) await notify(m, 'family', text, '#/family');
  };

  // Setup status (the client shows a setup message while the SQL is unrun).
  app.get('/api/family/status', async (req, res) => {
    res.json({ table: await checkTables(), displayNames: await checkDisplayCol() });
  });

  // My family (or null).
  app.get('/api/family', auth, async (req, res) => {
    if (!(await checkTables())) return res.json({ family: null, table: false });
    const f = await myFamily(req.user.name);
    if (!f) return res.json({ family: null, table: true });
    res.json({ family: await pubFamily(f, key(f.owner) === key(req.user.name)), table: true });
  });

  // Create a family — I become the owner + first member.
  app.post('/api/family/create', auth, async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'FunTopia Family is not set up yet — run supabase_family.sql in Supabase' });
    if (await myFamily(req.user.name)) return res.status(400).json({ error: 'You are already in a family' });
    const name = filter(cleanStr(req.body?.name, 32));
    if (name.length < 2) return res.status(400).json({ error: 'Family name needs 2–32 characters' });
    const color = FAMILY_COLORS.includes(req.body?.color) ? req.body.color : FAMILY_COLORS[0];
    const icon = FAMILY_ICONS.includes(req.body?.icon) ? req.body.icon : FAMILY_ICONS[0];
    const motto = filter(cleanStr(req.body?.motto, 80));
    const f = { id: genId(), name, owner: key(req.user.name), members: [key(req.user.name)], color, icon, motto, code: genCode(), created: new Date().toISOString() };
    const { error } = await supabase.from('families').insert(f);
    if (error) return res.status(500).json({ error: 'Could not create the family' });
    res.json({ family: await pubFamily(f, true) });
  });

  // Join a family with its invite code.
  app.post('/api/family/join', auth, async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'FunTopia Family is not set up yet' });
    if (await myFamily(req.user.name)) return res.status(400).json({ error: 'You are already in a family' });
    const code = String(req.body?.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ error: 'Enter the family invite code' });
    const { data: f } = await supabase.from('families').select('*').eq('code', code).maybeSingle();
    if (!f) return res.status(404).json({ error: 'No family uses that invite code' });
    if ((f.members || []).length >= MAX_MEMBERS) return res.status(400).json({ error: 'That family is full (10 members max)' });
    const members = [...(f.members || []), key(req.user.name)];
    const { error } = await supabase.from('families').update({ members }).eq('id', f.id);
    if (error) return res.status(500).json({ error: 'Could not join the family' });
    await notifyMembers({ ...f, members }, req.user.name, `${req.user.name} joined the family ${f.name}`);
    res.json({ family: await pubFamily({ ...f, members }, false) });
  });

  // Leave. The owner passes ownership to the next member; the last member out deletes the family.
  app.post('/api/family/leave', auth, async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'FunTopia Family is not set up yet' });
    const f = await myFamily(req.user.name);
    if (!f) return res.status(400).json({ error: 'You are not in a family' });
    const members = (f.members || []).filter(m => key(m) !== key(req.user.name));
    if (!members.length) {
      await supabase.from('family_messages').delete().eq('family_id', f.id);
      await supabase.from('families').delete().eq('id', f.id);
      return res.json({ family: null });
    }
    const owner = key(f.owner) === key(req.user.name) ? members[0] : f.owner;
    await supabase.from('families').update({ members, owner }).eq('id', f.id);
    await notifyMembers({ ...f, members }, req.user.name, `${req.user.name} left the family ${f.name}`);
    res.json({ family: null });
  });

  // Owner removes a member.
  app.post('/api/family/remove', auth, async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'FunTopia Family is not set up yet' });
    const f = await myFamily(req.user.name);
    if (!f) return res.status(400).json({ error: 'You are not in a family' });
    if (key(f.owner) !== key(req.user.name)) return res.status(403).json({ error: 'Only the family owner can remove members' });
    const target = norm(req.body?.username);
    if (!target || key(target) === key(req.user.name)) return res.status(400).json({ error: 'Pick a member to remove' });
    const members = (f.members || []).filter(m => key(m) !== key(target));
    if (members.length === (f.members || []).length) return res.status(404).json({ error: 'That player is not in your family' });
    await supabase.from('families').update({ members }).eq('id', f.id);
    await notify(target, 'family', `You were removed from the family ${f.name}`, '#/family');
    res.json({ family: await pubFamily({ ...f, members }, true) });
  });

  // Owner updates the family account (name, color, icon, motto).
  app.put('/api/family', auth, async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'FunTopia Family is not set up yet' });
    const f = await myFamily(req.user.name);
    if (!f) return res.status(400).json({ error: 'You are not in a family' });
    if (key(f.owner) !== key(req.user.name)) return res.status(403).json({ error: 'Only the family owner can change the family account' });
    const updates = {};
    if (req.body?.name !== undefined) {
      const name = filter(cleanStr(req.body.name, 32));
      if (name.length < 2) return res.status(400).json({ error: 'Family name needs 2–32 characters' });
      updates.name = name;
    }
    if (req.body?.color !== undefined && FAMILY_COLORS.includes(req.body.color)) updates.color = req.body.color;
    if (req.body?.icon !== undefined && FAMILY_ICONS.includes(req.body.icon)) updates.icon = req.body.icon;
    if (req.body?.motto !== undefined) updates.motto = filter(cleanStr(req.body.motto, 80));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to change' });
    const { data, error } = await supabase.from('families').update(updates).eq('id', f.id).select().single();
    if (error) return res.status(500).json({ error: 'Could not update the family' });
    res.json({ family: await pubFamily(data, true) });
  });

  // Owner makes a new invite code.
  app.post('/api/family/code', auth, async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'FunTopia Family is not set up yet' });
    const f = await myFamily(req.user.name);
    if (!f) return res.status(400).json({ error: 'You are not in a family' });
    if (key(f.owner) !== key(req.user.name)) return res.status(403).json({ error: 'Only the family owner can make a new invite code' });
    const code = genCode();
    await supabase.from('families').update({ code }).eq('id', f.id);
    res.json({ code });
  });

  // Family chat: read the last 100 messages (oldest first).
  app.get('/api/family/chat', auth, async (req, res) => {
    if (!(await checkTables())) return res.json([]);
    const f = await myFamily(req.user.name);
    if (!f) return res.status(400).json({ error: 'You are not in a family' });
    const { data } = await supabase.from('family_messages').select('*').eq('family_id', f.id).order('created', { ascending: true }).limit(100);
    res.json((data || []).map(m => ({ id: m.id, username: m.username, text: m.text, created: m.created })));
  });

  // Family chat: send a message (members only).
  app.post('/api/family/chat', auth, async (req, res) => {
    if (!(await checkTables())) return res.status(500).json({ error: 'FunTopia Family is not set up yet' });
    const f = await myFamily(req.user.name);
    if (!f) return res.status(400).json({ error: 'You are not in a family' });
    const text = filter(String(req.body?.text || '').trim().slice(0, MAX_CHAT_LEN));
    if (!text) return res.status(400).json({ error: 'Write a message first' });
    const { data, error } = await supabase.from('family_messages').insert({ family_id: f.id, username: key(req.user.name), text, created: new Date().toISOString() }).select().single();
    if (error) return res.status(500).json({ error: 'Could not send the message' });
    res.json({ id: data.id, username: data.username, text: data.text, created: data.created });
  });

  // Display name: set my own (2–24 characters, empty clears it back to my username).
  app.post('/api/me/display-name', auth, async (req, res) => {
    if (!(await checkDisplayCol())) return res.status(500).json({ error: 'Display names are not set up yet — run supabase_family.sql in Supabase' });
    const displayName = filter(cleanStr(req.body?.displayName, 24));
    if (displayName && displayName.length < 2) return res.status(400).json({ error: 'Display name needs 2–24 characters' });
    const { error } = await supabase.from('users').update({ display_name: displayName || null }).eq('name', key(req.user.name));
    if (error) return res.status(500).json({ error: 'Could not save the display name' });
    res.json({ displayName });
  });
}
