// ✅ Verified accounts: the owner can mark any player verified (blue ✓
// next to their name everywhere the vtag shows). The list lives in
// Supabase so it survives restarts; 'fun' + 'funtopia' are always
// verified as built-in defaults. Wired into server.js via
// createVerify({ app, auth, supabase, isOwner, logMod }).
export const verifiedState = { tableOk: true };
export const VERIFIED_DEFAULTS = ['fun', 'funtopia'];

export function createVerify(D) {
  const { app, auth, supabase, isOwner, logMod } = D;
  const norm = n => String(n || '').trim().toLowerCase().replace(/^@/, '');
  const checkTable = async () => {
    if (!verifiedState.tableOk) return false;
    const { error } = await supabase.from('verified').select('username').limit(1);
    if (error) { verifiedState.tableOk = false; return false; }
    return true;
  };
  const loadNames = async () => {
    if (!(await checkTable())) return [...VERIFIED_DEFAULTS];
    const { data } = await supabase.from('verified').select('username').limit(500);
    const names = new Set(VERIFIED_DEFAULTS);
    (data || []).forEach(r => { const n = norm(r.username); if (n) names.add(n); });
    return [...names];
  };

  // Public list (the client verified.js fetches this on load).
  app.get('/api/verified', async (req, res) => {
    const table = await checkTable();
    res.json({ verified: await loadNames(), table });
  });
  // Owner-only: verify or unverify a player (must be a real account).
  app.post('/api/admin/verify', auth, async (req, res) => {
    if (!isOwner(req.user)) return res.status(403).json({ error: 'Only owners can verify players' });
    const username = norm(req.body?.username);
    if (!username || username.length < 3 || username.length > 24) return res.status(400).json({ error: 'Enter a valid username' });
    if (!(await checkTable())) return res.status(500).json({ error: 'Verified accounts are not set up yet — run supabase_verified.sql in Supabase' });
    const { data: user } = await supabase.from('users').select('name').ilike('name', username).limit(1).single();
    if (!user) return res.status(404).json({ error: 'No player named @' + username });
    const verified = req.body?.verified !== false && req.body?.verified !== 'false';
    try {
      if (verified) {
        const { error } = await supabase.from('verified').upsert({ username: user.name.toLowerCase() });
        if (error) throw error;
      } else {
        if (VERIFIED_DEFAULTS.includes(username)) return res.status(400).json({ error: '@' + username + ' is always verified' });
        const { error } = await supabase.from('verified').delete().eq('username', username);
        if (error) throw error;
      }
      logMod(req.user.name, verified ? 'verify' : 'unverify', user.name, '');
      res.json({ verified: await loadNames(), table: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
