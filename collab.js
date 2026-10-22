// Funtopia × Blockverse collab games seed data (Oct 2026)
import { bvPortal, bvPlaza } from './public/js/worlds.js';

export const BLOCKVERSE_GAMES = [
  { id: 'g_bvportal', name: '🌌 Blockverse Portal Run', desc: 'The Funtopia × Blockverse collab course! Cross the portal, dodge the sweepers, and earn the World Hopper badge! 🟩', build: bvPortal },
  { id: 'g_bvplaza', name: '🟩 Blockverse Plaza', desc: 'Hang out under the great portal — meet Blox from Blockverse, duel with Foam Swords, and grab your free collab gifts! 🎁', build: bvPlaza },
];

export async function seedBlockverseGames(supabase, sanitizeWorld) {
  try {
    const { data: ex } = await supabase.from('games').select('id').eq('event', 'blockverse');
    const haveIds = new Set((ex || []).map(g => g.id));
    const wantIds = BLOCKVERSE_GAMES.map(g => g.id);
    if (!process.env.BLOCKVERSE_RESEED && wantIds.every(id => haveIds.has(id))) return { created: 0 };
    await supabase.from('games').delete().eq('event', 'blockverse');
    let created = 0;
    for (const cfg of BLOCKVERSE_GAMES) {
      const world = cfg.build();
      const { error } = await supabase.from('games').insert({ id: cfg.id, name: cfg.name, creator: 'Funtopia',
        description: cfg.desc, world: sanitizeWorld(world), event: 'blockverse',
        visits: 0, likes: 0, dislikes: 0, max_players: 30, created: Date.now(), updated: Date.now(), thumbnail: '', unpublished: false });
      if (error) console.warn('bv fail', cfg.id, error.message); else created++;
    }
    return { created };
  } catch (e) { console.warn('bv err', e.message); return { created: 0 }; }
}
