// 🎮 Game upload verification (Phase 2) — games need a moderator review
// before they publish, exactly like the UGC review queue (ugc.js).
//   status: 'pending' (new user games) | 'approved' (seeded/official +
//   reviewed) | 'rejected' (reviewed, stays hidden).
// Discover (GET /api/games) only lists approved games — see the wiring
// snippet for discoverGames in server.js. The creator still sees their
// own pending game in Create (#/create) with an "awaiting review" note.
// Wired into server.js via createGameVerify({ app, auth, modOnly, supabase, key, logMod, notify }).

// ---------- pure helpers (unit-tested in ff_bundle_p2_unit.mjs) ----------
export const GAME_STATUSES = ['pending', 'approved', 'rejected'];
export function isValidGameStatus(s) { return GAME_STATUSES.includes(s); }

// Only a pending game can be reviewed, and only once: approved/rejected
// games can never be re-reviewed (a re-review needs a fresh edit + a new
// pending state, which the integrator's PUT snippet does not create —
// rejected games stay rejected; the creator can delete and remake).
export function canReviewTransition(from, to) {
  return from === 'pending' && (to === 'approved' || to === 'rejected');
}

// May this game appear in Discover / public listings? Rows made before
// the status column existed have status === undefined — they stay public
// (the Phase 2 SQL backfills them to 'approved'; until then the undefined
// case keeps the live site working instead of hiding every game).
export function isPublicGame(g) {
  if (!g || g.unpublished) return false;
  return g.status === undefined || g.status === 'approved';
}

export function createGameVerify(D) {
  const { app, auth, modOnly, supabase, logMod, notify } = D;

  // GET /api/games/pending — the moderator review queue (oldest first).
  // If the status column is missing (SQL not run yet) this returns [] so
  // the Moderation page still renders instead of 500ing.
  app.get('/api/games/pending', auth, modOnly, async (req, res) => {
    try {
      const { data, error } = await supabase.from('games').select('*').eq('status', 'pending').order('created', { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch { res.json([]); }
  });

  const review = (to) => async (req, res) => {
    const id = String(req.params.id || '');
    const { data, error } = await supabase.from('games').update({ status: to }).eq('id', id).eq('status', 'pending').select().single();
    if (error || !data) return res.status(404).json({ error: 'Not found or already reviewed' });
    if (logMod) logMod(req.user.name, 'game_' + to, data.name, data.creator);
    if (notify) {
      try {
        await notify(data.creator, 'game', to === 'approved'
          ? `Your game "${data.name}" was approved and is now public on FunTopia!`
          : `Your game "${data.name}" was not approved by a moderator. You can delete it and make a new one.`, '#/create');
      } catch {}
    }
    res.json({ ok: true, game: { id: data.id, name: data.name, status: data.status } });
  };

  // POST /api/games/:id/approve — publish a pending game.
  app.post('/api/games/:id/approve', auth, modOnly, review('approved'));
  // POST /api/games/:id/reject — keep a pending game hidden forever.
  app.post('/api/games/:id/reject', auth, modOnly, review('rejected'));
}
