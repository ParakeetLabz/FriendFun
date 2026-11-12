// 📞 Calling: invite a friend to the Voice Lounge, where the in-game
// proximity voice chat already works. The invite is a notification with
// a link that opens the lounge with voice auto-on.
// Wired into server.js via createCalling({ app, auth, supabase, notify }).
const LOUNGE_ID = 'g_voicelounge';
const LOUNGE_LINK = '#/play/g_voicelounge?voice=1';
const recent = new Map(); // "from>to" -> timestamp (60s invite spam guard)

export function createCalling(D) {
  const { app, auth, supabase, notify } = D;
  app.post('/api/call/invite', auth, async (req, res) => {
    const to = String(req.body?.to || '').trim();
    if (!to) return res.status(400).json({ error: 'Who are you calling?' });
    if (to.toLowerCase() === req.user.name.toLowerCase()) return res.status(400).json({ error: 'You cannot call yourself' });
    const k = req.user.name.toLowerCase() + '>' + to.toLowerCase();
    if (Date.now() - (recent.get(k) || 0) < 60000) return res.status(429).json({ error: 'Invite already sent — give them a minute to answer' });
    try {
      const { data: target } = await supabase.from('users').select('name').eq('name', to).single();
      if (!target) return res.status(404).json({ error: 'No player named ' + to });
      recent.set(k, Date.now());
      await notify(to, 'call', `📞 ${req.user.name} is calling you — join the Voice Lounge to talk!`, LOUNGE_LINK);
      res.json({ game: LOUNGE_ID, link: LOUNGE_LINK });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
