// Halloween games seed data (extracted from server.js Oct 2026 - file size limit)
import { hwMansion, hwPumpkin, hwWitch, hwGhost, hwBase, hwForest, hwCandy, hwCrypt, stealablob } from './public/js/worlds.js';

export const HALLOWEEN_GAMES = [
  { id: 'g_hwmansion', name: 'Haunted Mansion Escape', desc: 'Escape the haunted mansion room by room... if you dare! 👻', build: hwMansion },
  { id: 'g_hwpumpkin', name: 'Pumpkin Patch Hunt', desc: 'Hunt candy corn among giant pumpkins and the corn maze! 🎃', build: hwPumpkin },
  { id: 'g_hwwitch', name: 'Witch\u2019s Crooked Tower', desc: 'Climb the crooked tower: potions, broomsticks and spellbooks! 🧙', build: hwWitch },
  { id: 'g_hwghost', name: 'Ghost Town Hangout', desc: 'Hang out in the spooky old west town. Mind the graveyard... 💀', build: hwGhost },
  { id: 'g_hwbase', name: 'Spooky Baseplate', desc: 'Build on a haunted baseplate with its own mini castle. 🦇', build: hwBase },
  { id: 'g_hwforest', name: 'Haunted Forest Obby', desc: 'Hop stumps, ride glowing mushrooms, cross the twisted branches! 🌲', build: hwForest },
  { id: 'g_hwcandy', name: 'Candy Corn Climb', desc: 'Scale three giant candy corn towers to the sweet peak! 🍬', build: hwCandy },
  { id: 'g_hwcrypt', name: 'Crypt Crawler', desc: 'Dodge spike pits, climb sarcophagi, claim the gold chest! ⚰️', build: hwCrypt },
];

export async function seedHalloweenGames(supabase, sanitizeWorld) {
  try {
    // Steal a Blob — official Funtopia game, seeded once (runs on every boot).
    // Seeded here because server.js is at the push size cap and can't take a new endpoint.
    const { data: sab } = await supabase.from('games').select('id,world').eq('id', 'g_stealablob').maybeSingle();
    if (!sab) {
      const { error } = await supabase.from('games').insert({ id: 'g_stealablob', name: 'Steal a Blob', creator: 'Funtopia',
        description: 'Blobs walk the conveyor. Buy them, and they print coins in your base. Steal your rivals\' blobs — and slap thieves before they get away! 🫧',
        world: sanitizeWorld(stealablob()), visits: 0, likes: 0, dislikes: 0, max_players: 30, created: Date.now(), updated: Date.now(), thumbnail: '', unpublished: false });
      if (error) console.warn('sab fail', error.message); else console.log('sab: Steal a Blob seeded');
    } else {
      // Migrate the saved world when the template improves: the row is frozen
      // from its first seed, so new base designs never appear otherwise. The
      // first seed used the flat Oct 26 template (no pillars at all), so the
      // check is: a blob world (Conveyor + Base1) that lacks the new slot pads
      // OR still spawns players on the belt.
      const parts = sab.world?.parts || [];
      const isBlobWorld = parts.some(p => p.name === 'Conveyor') && parts.some(p => p.name === 'Base1');
      const hasNewBases = parts.some(p => p.name === 'SlotPad1');
      const spawnOnBelt = parts.some(p => p.name === 'SpawnLocation' && Math.abs(p.p?.[0] || 0) <= 7.5);
      if (isBlobWorld && (!hasNewBases || spawnOnBelt)) {
        const { error } = await supabase.from('games').update({ world: sanitizeWorld(stealablob()), updated: Date.now() }).eq('id', 'g_stealablob');
        if (error) console.warn('sab migrate fail', error.message); else console.log('sab: Steal a Blob world refreshed');
      } else if (hasNewBases && !spawnOnBelt) {
        console.log('sab: world already current');
      } else {
        console.log('sab: world unrecognized, skipping migrate');
      }
    }
    const { data: ex } = await supabase.from('games').select('id').eq('event', 'halloween');
    const haveIds = new Set((ex || []).map(g => g.id));
    const wantIds = HALLOWEEN_GAMES.map(g => g.id);
    if (!process.env.HALLOWEEN_RESEED && wantIds.every(id => haveIds.has(id))) return { created: 0 };
    await supabase.from('games').delete().eq('event', 'halloween');
    let created = 0;
    for (const cfg of HALLOWEEN_GAMES) {
      const world = cfg.build();
      const { error } = await supabase.from('games').insert({ id: cfg.id, name: cfg.name, creator: 'Funtopia',
        description: cfg.desc, world: sanitizeWorld(world), event: 'halloween',
        visits: 0, likes: 0, dislikes: 0, max_players: 30, created: Date.now(), updated: Date.now(), thumbnail: '', unpublished: false });
      if (error) console.warn('hw fail', cfg.id, error.message); else created++;
    }
    return { created };
  } catch (e) { console.warn('hw err', e.message); return { created: 0 }; }
}
