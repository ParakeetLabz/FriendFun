// 🏆 Ultimate 2UI — leaderboard + FunTix reward.
// Win a 2UI game and your best score is saved; the first win on a game each
// day also pays 25 FunTix (once per game per day, so it can't be farmed).
// Wired into server.js via createTwoUi({ app, auth, supabase, key }).
// Needs supabase_twoui.sql (two_ui_scores + two_ui_rewards tables) run once;
// until then every route answers with a clear "run the SQL" message.
const WIN_REWARD = 25;

export function createTwoUi(D) {
  const { app, auth, supabase, key } = D;

  // Re-checked on every request (not sticky) so it turns on the moment the
  // SQL runs — no restart needed.
  const tableOk = async () => {
    const { error } = await supabase.from('two_ui_scores').select('game_id').limit(1);
    return !error;
  };
  const needTable = async res => {
    if (await tableOk()) return true;
    res.status(500).json({ error: '2UI leaderboard is not set up yet — run supabase_twoui.sql in Supabase.' });
    return false;
  };
  const dayKey = () => new Date().toISOString().slice(0, 10);

  // Top 10 scores for a 2UI game (best score per player).
  app.get('/api/games/:id/2ui-scores', auth, async (req, res) => {
    if (!await needTable(res)) return;
    const { data, error } = await supabase.from('two_ui_scores')
      .select('username, score').eq('game_id', req.params.id)
      .order('score', { ascending: false }).limit(50);
    if (error) return res.status(500).json({ error: error.message });
    const best = new Map();
    for (const r of data || []) {
      if (!best.has(r.username) || best.get(r.username) < r.score) best.set(r.username, r.score);
    }
    res.json({ scores: [...best.entries()].map(([username, score]) => ({ username, score })).sort((a, b) => b.score - a.score).slice(0, 10) });
  });

  // Report a 2UI win. Records the best score and pays the daily reward.
  app.post('/api/games/:id/2ui-win', auth, async (req, res) => {
    if (!await needTable(res)) return;
    const score = Math.max(0, Math.min(100000, Math.round(Number(req.body?.score) || 0)));
    const me = key(req.user.name);
    const gameId = req.params.id;
    const { data: game } = await supabase.from('games').select('id, world').eq('id', gameId).single();
    if (!game || !game.world?.twoUi) return res.status(400).json({ error: 'Not a 2UI game' });
    const goal = Number(game.world.twoUi.goal) || 0;
    if (score < goal) return res.status(400).json({ error: 'You have to reach the goal to win' });
    // Best score (keep the highest per player per game).
    const { data: mine } = await supabase.from('two_ui_scores').select('score').eq('game_id', gameId).eq('username', me).order('score', { ascending: false }).limit(1);
    const prevBest = mine?.[0]?.score || 0;
    if (score > prevBest) {
      await supabase.from('two_ui_scores').insert({ game_id: gameId, username: me, score, created: Date.now() });
    }
    // Daily reward: once per game per day.
    const day = dayKey();
    const { data: rewarded } = await supabase.from('two_ui_rewards').select('id').eq('game_id', gameId).eq('username', me).eq('day', day).limit(1);
    let reward = 0;
    if (!rewarded?.length) {
      await supabase.from('two_ui_rewards').insert({ game_id: gameId, username: me, day, created: Date.now() });
      const newTix = (Number(req.user.funtix) || 0) + WIN_REWARD;
      await supabase.from('users').update({ funtix: newTix }).eq('name', me);
      reward = WIN_REWARD;
    }
    res.json({ ok: true, best: Math.max(prevBest, score), reward, rewardDay: day });
  });
}
