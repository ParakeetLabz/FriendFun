// 100 Players Party seed data (Nov 2026) — owner-triggered via the Owner Panel
import { partyPlaza } from './public/js/worlds.js';

export const PARTY_GOAL = 100;
export const PARTY_PRIZE = ['hat_party_neon']; // Neon Party Hat 🎉 — free for everyone while the party lasts

export const PARTY_GAMES = [
  { id: 'g_party100', name: '🎉 100 Players Party', desc: 'Funtopia hit 100 players! Dance on the disco floor, meet DJ Funtopia, eat cake and grab your free Neon Party Hat! 🎉', build: partyPlaza },
];

export async function seedPartyGames(supabase, sanitizeWorld) {
  try {
    const { data: ex } = await supabase.from('games').select('id').eq('event', 'party100');
    const haveIds = new Set((ex || []).map(g => g.id));
    const wantIds = PARTY_GAMES.map(g => g.id);
    if (!process.env.PARTY_RESEED && wantIds.every(id => haveIds.has(id))) return { created: 0 };
    await supabase.from('games').delete().eq('event', 'party100');
    let created = 0;
    for (const cfg of PARTY_GAMES) {
      const world = cfg.build();
      const { error } = await supabase.from('games').insert({ id: cfg.id, name: cfg.name, creator: 'Funtopia',
        description: cfg.desc, world: sanitizeWorld(world), event: 'party100',
        visits: 0, likes: 0, dislikes: 0, max_players: 30, created: Date.now(), updated: Date.now(), thumbnail: '', unpublished: false });
      if (error) console.warn('party fail', cfg.id, error.message); else created++;
    }
    return { created };
  } catch (e) { console.warn('party err', e.message); return { created: 0 }; }
}

export async function endPartyGames(supabase) {
  try {
    const { data: ex } = await supabase.from('games').select('id').eq('event', 'party100');
    const n = (ex || []).length;
    if (!n) return { removed: 0 };
    await supabase.from('games').delete().eq('event', 'party100');
    return { removed: n };
  } catch (e) { console.warn('party end err', e.message); return { removed: 0 }; }
}
