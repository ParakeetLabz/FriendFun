// 🏷️ Site version: the "Beta <version>" tag next to the FunTopia logo.
// The owner sets the version in the Owner Panel; everyone sees it in the
// lobby header. Stored in a `settings` table (key 'version') so it survives
// restarts; defaults to "1.0" while the table is missing.
// Wired into server.js via createVersion({ app, auth, supabase, isOwner }).
const DEFAULT_VERSION = '1.0';
const VERSION_RE = /^[A-Za-z0-9._-]{1,16}$/;

export function createVersion(D) {
  const { app, auth, supabase, isOwner } = D;

  const readVersion = async () => {
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'version').maybeSingle();
    if (error || !data?.value) return DEFAULT_VERSION;
    return String(data.value).slice(0, 16);
  };

  // Public: the current version (the client shows "Beta <version>").
  app.get('/api/version', async (req, res) => {
    res.json({ version: await readVersion() });
  });

  // Owner only: set the version (e.g. "1.0", "2.5", "1.0-beta").
  app.post('/api/admin/version', auth, async (req, res) => {
    if (!isOwner(req.user)) return res.status(403).json({ error: 'Only the owner can set the version' });
    const version = String(req.body?.version || '').trim();
    if (!VERSION_RE.test(version)) return res.status(400).json({ error: 'Version needs 1–16 characters (letters, numbers, . _ -)' });
    const { error } = await supabase.from('settings').upsert({ key: 'version', value: version, updated: new Date().toISOString() }, { onConflict: 'key' });
    if (error) return res.status(500).json({ error: 'Could not save the version — run supabase_settings.sql in Supabase' });
    res.json({ version });
  });
}
