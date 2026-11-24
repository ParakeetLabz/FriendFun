// 👨‍👩‍👧 Parent accounts (Phase 2) — READ-ONLY activity overview.
// A parent can VIEW what their child's account is doing, but only when
// parent and child are in the same Family (the existing Family system —
// no new invite/approval flow, no parent verification at signup).
// The overview shows: display name / username / User ID, avatar summary,
// friends list, family, recent games played, badges, FunTix balance,
// account created date.
// It NEVER shows: DM / message contents, email, birthday, password — and
// it NEVER lets the parent control, edit, or log into the child's account.
// Wired into server.js via createParent({ app, auth, supabase, key, list, notify, logMod }).

// ---------- pure helpers (unit-tested in ff_bundle_p2_unit.mjs) ----------

// Do two players share at least one family? `aIds` / `bIds` are arrays of
// family ids (from the families table). Empty on either side = no.
export function shareFamily(aIds, bIds) {
  const a = new Set((aIds || []).filter(Boolean));
  if (!a.size) return false;
  return (bIds || []).some(id => a.has(id));
}

// Badges for the overview, computed from the child's own user row plus
// how many games they created and their total game visits. Mirrors the
// rules in server.js badgesOf() for the fields a parent may see — it
// deliberately never looks at email, birthday, or messages.
export function badgesForUser(u, createdGames = 0, totalVisits = 0) {
  const arr = v => Array.isArray(v) ? v : [];
  const funtix = Number(u?.funtix) || 0;
  const friends = arr(u?.friends).length;
  const items = arr(u?.inventory).length;
  const earned = arr(u?.earnedBadges);
  const out = new Set(['newcomer']);
  if (funtix >= 100) out.add('tix_100');
  if (funtix >= 500) out.add('tix_500');
  if (funtix >= 1000) out.add('tix_1000');
  if (funtix >= 5000) out.add('tix_5000');
  if (friends >= 1) out.add('friend_1');
  if (friends >= 5) out.add('friend_5');
  if (friends >= 10) out.add('friend_10');
  if (items >= 5) out.add('collector_5');
  if (items >= 15) out.add('collector_15');
  if (createdGames >= 1) out.add('creator');
  if (createdGames >= 5) out.add('builder_5');
  if (createdGames >= 10) out.add('builder_10');
  if (totalVisits >= 100) out.add('popular_100');
  if (totalVisits >= 1000) out.add('popular_1000');
  for (const b of earned) out.add(b);
  return [...out];
}

// Build the exact overview JSON from already-fetched pieces. Pure, so the
// privacy rule is testable: even if a caller passes a full user row (with
// email, birthday, salt, pw, dms…), NONE of those fields can leak out.
export function buildChildOverview({ user, friends, family, recentGames, badges, gamesCreated, totalVisits }) {
  return {
    name: user.name,
    displayName: user.display_name || '',
    userId: user.user_id || null,
    avatar: user.avatar || null,
    created: user.created || null,
    funtix: Number(user.funtix) || 0,
    badges: badges || [],
    gamesCreated: gamesCreated || 0,
    totalGameVisits: totalVisits || 0,
    family: family ? { id: family.id, name: family.name, icon: family.icon || '', color: family.color || '', members: (family.members || []).length } : null,
    friends: (friends || []).map(f => ({ name: f.name, displayName: f.display_name || '', avatar: f.avatar || null })),
    // Recent games: id + name + creator + visits only. Never chat, never DMs.
    recentGames: (recentGames || []).map(g => ({ id: g.id, name: g.name, creator: g.creator, visits: g.visits || 0 })),
  };
}

export function createParent(D) {
  const { app, auth, supabase, key, list } = D;
  const norm = n => String(n || '').trim().toLowerCase();
  const arr = (u, field) => (list ? list(u, field) : (Array.isArray(u?.[field]) ? u[field] : []));

  // Families table present? (Same graceful probe as family.js — the page
  // explains the setup instead of 500ing if supabase_family.sql is unrun.)
  const checkFamilies = async () => {
    const { error } = await supabase.from('families').select('id').limit(1);
    return !error;
  };
  // All families a player belongs to (normally at most one).
  const myFamilies = async (username) => {
    const { data } = await supabase.from('families').select('*').contains('members', [key(username)]);
    return data || [];
  };
  const familyIdsOf = async (username) => (await myFamilies(username)).map(f => f.id);

  // GET /api/parent/children — the other members of my families.
  // (The parent is whoever looks: any family member can view the others.
  // A child in the family can also see this list — it only shows the same
  // public-ish facts as a profile page, never messages or private data.)
  app.get('/api/parent/children', auth, async (req, res) => {
    if (!(await checkFamilies())) return res.json({ children: [], table: false });
    const fams = await myFamilies(req.user.name);
    if (!fams.length) return res.json({ children: [], table: true });
    const seen = new Map(); // name -> family
    for (const f of fams) for (const m of (f.members || [])) {
      if (key(m) !== key(req.user.name) && !seen.has(key(m))) seen.set(key(m), f);
    }
    const names = [...seen.keys()];
    if (!names.length) return res.json({ children: [], table: true });
    const { data: users } = await supabase.from('users').select('name, display_name, user_id, avatar').in('name', names);
    const byName = new Map((users || []).map(u => [key(u.name), u]));
    const children = names.map(n => {
      const u = byName.get(n);
      const f = seen.get(n);
      return u ? { name: u.name, displayName: u.display_name || '', userId: u.user_id || null, avatar: u.avatar || null, family: { id: f.id, name: f.name, icon: f.icon || '', color: f.color || '' } } : null;
    }).filter(Boolean);
    res.json({ children, table: true });
  });

  // GET /api/parent/child/:name — the read-only overview. 403 unless the
  // viewer and the child share a family. 404 for an unknown account.
  app.get('/api/parent/child/:name', auth, async (req, res) => {
    const target = norm(req.params.name);
    if (!target) return res.status(400).json({ error: 'Pick a player to view' });
    const { data: user, error } = await supabase.from('users').select('*').eq('name', target).single();
    if (error || !user) return res.status(404).json({ error: 'Player not found' });
    // Same-family gate — the whole privacy rule lives here.
    if (key(target) !== key(req.user.name)) {
      const ok = shareFamily(await familyIdsOf(req.user.name), await familyIdsOf(target));
      if (!ok) return res.status(403).json({ error: 'You can only view players in your own family' });
    }
    const fams = await myFamilies(target);
    const family = fams[0] || null;
    // Friends (names + avatars only — never their messages).
    const friendNames = arr(user, 'friends');
    let friends = [];
    if (friendNames.length) {
      const { data } = await supabase.from('users').select('name, display_name, avatar').in('name', friendNames.map(key));
      const byName = new Map((data || []).map(u => [key(u.name), u]));
      friends = friendNames.map(n => byName.get(key(n))).filter(Boolean);
    }
    // Games they created (for the creator / builder / popular badges).
    let createdGames = 0, totalVisits = 0;
    try {
      const { data: gs } = await supabase.from('games').select('id, visits').ilike('creator', key(user.name));
      createdGames = (gs || []).length;
      totalVisits = (gs || []).reduce((t, g) => t + (Number(g.visits) || 0), 0);
    } catch {}
    // Recent games they played (most recent first, max 12 — same cap as
    // the users.recent list). Rejected games are left out so a bad game
    // name a moderator already removed never shows up here.
    let recentGames = [];
    const recentIds = arr(user, 'recent').slice(0, 12);
    if (recentIds.length) {
      const { data: gs } = await supabase.from('games').select('id, name, creator, visits, status').in('id', recentIds);
      const byId = new Map((gs || []).filter(g => g.status !== 'rejected').map(g => [g.id, g]));
      recentGames = recentIds.map(id => byId.get(id)).filter(Boolean);
    }
    res.json(buildChildOverview({
      user, friends, family, recentGames,
      badges: badgesForUser(user, createdGames, totalVisits),
      gamesCreated: createdGames, totalVisits,
    }));
  });
}
