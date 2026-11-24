// 👨‍👩‍👧 Parent view (#/parent): a READ-ONLY activity overview of the
// other accounts in your Family — for parents checking on their child.
// Shows: display name / username / User ID, avatar, friends, family,
// recent games played, badges, FunTix balance, account created date.
// It NEVER shows private messages (no DM contents, ever) and it NEVER
// lets the parent change anything, edit the child's account, or log in
// as the child. Same-family access is enforced server-side (403 otherwise).
import { icons } from './icons.js?v=1aa0a4d3';
import { displayNameOf, badgeIcon, tix } from './ui.js?v=a89886d1';
import { BADGES } from './catalog.js?v=90a4da23';

export async function parentPage(D) {
  const me = D.me;
  let r;
  try { r = await D.api('GET', '/api/parent/children'); } catch (e) { r = null; }
  if (!r) {
    D.mount('parent', `<h1><span class="ic">${icons.shield}</span> Parent View</h1><p class="muted">Could not load your family. Try again in a moment.</p>`);
    return;
  }
  if (r.table === false) {
    D.mount('parent', `<h1><span class="ic">${icons.shield}</span> Parent View</h1>
      <p class="muted">FunTopia Family isn't set up yet — the owner needs to run <code>supabase_family.sql</code> in Supabase once. Parent view works through your Family: join the same family as your child and you can see their activity here.</p>
      <a class="btn-primary" href="#/family">Go to Family</a>`);
    return;
  }
  const kids = r.children || [];
  if (!kids.length) {
    D.mount('parent', `<h1><span class="ic">${icons.shield}</span> Parent View</h1>
      <p class="muted">Parent view shows the other accounts in your Family, so you can see what your child does on FunTopia — their friends, games, badges and FunTix. You are not in a family with anyone yet.</p>
      <p class="muted">To set it up: create or join a Family with your child's account, using the same family invite code. <a href="#/family">Go to Family</a></p>
      <div class="parent-note">Read-only: you can look, but you can't change your child's account, read their private messages, or log in as them.</div>`);
    return;
  }
  D.mount('parent', `<h1><span class="ic">${icons.shield}</span> Parent View</h1>
    <p class="muted">Activity overviews for the other accounts in your families. Pick one to see what they've been doing on FunTopia.</p>
    <div class="parent-note">Read-only: you can look, but you can't change their account, read their private messages, or log in as them.</div>
    <div class="parent-grid">${kids.map(k => `
      <a class="parent-card" href="#/parent/${encodeURIComponent(k.name)}">
        <div class="ut-img">${D.avatarImgTag(k.avatar)}</div>
        <div><b>${D.esc(displayNameOf(k))}</b><div class="muted small">@${D.esc(k.name)}${k.userId ? ` · User ID #${k.userId}` : ''}</div>
        <div class="muted small">${D.esc(k.family.name)}</div></div>
      </a>`).join('')}</div>`);
}

// Detail view is rendered by the router passing the child name through;
// parentPage() above renders the list, and openChild() renders one child.
export async function parentChildPage(D, name) {
  let c;
  try { c = await D.api('GET', '/api/parent/child/' + encodeURIComponent(name)); }
  catch (e) { c = null; }
  if (!c) {
    D.mount('parent', `<h1><span class="ic">${icons.shield}</span> Parent View</h1>
      <p class="muted">Could not load this player — they may not exist, or they may not be in your family.</p>
      <a class="btn-primary" href="#/parent">Back to Parent View</a>`);
    return;
  }
  const joined = c.created ? new Date(c.created).toLocaleDateString() : 'Unknown';
  const badgeRow = (c.badges || []).map(id => {
    const b = BADGES[id];
    return b ? `<span class="parent-badge" title="${D.esc(b.name)}">${badgeIcon(id, 20)} ${D.esc(b.name)}</span>` : '';
  }).join('') || '<span class="muted">No badges yet.</span>';
  D.mount('parent', `<h1><span class="ic">${icons.shield}</span> Parent View</h1>
    <a class="btn-secondary btn-small" href="#/parent">← All family members</a>
    <div class="parent-note">Read-only overview — you can't change this account, read its private messages, or log in as it.</div>
    <section><div class="sec-h"><h2>${D.esc(displayNameOf(c))}</h2><span class="muted small">@${D.esc(c.name)}${c.userId ? ` · User ID #${c.userId}` : ''}</span></div>
      <div class="parent-overview">
        <div class="ut-img">${D.avatarImgTag(c.avatar, 'full')}</div>
        <div class="parent-facts">
          <div><b>FunTix</b> ${tix} ${Number(c.funtix || 0).toLocaleString()}</div>
          <div><b>Joined FunTopia</b> ${D.esc(joined)}</div>
          <div><b>Games made</b> ${(c.gamesCreated || 0)} (${Number(c.totalGameVisits || 0).toLocaleString()} total visits)</div>
          <div><b>Family</b> ${c.family ? D.esc(c.family.name) + ` (${c.family.members} member${c.family.members === 1 ? '' : 's'})` : 'None'}</div>
        </div>
      </div></section>
    <section><div class="sec-h"><h2>Badges (${(c.badges || []).length})</h2></div>
      <div class="parent-badge-row">${badgeRow}</div></section>
    <section><div class="sec-h"><h2>Friends (${(c.friends || []).length})</h2></div>
      <div class="friends-row">${(c.friends || []).map(f => `
        <a class="user-tile" href="#/users/${encodeURIComponent(f.name)}"><div class="ut-img">${D.avatarImgTag(f.avatar)}</div>
        <div class="ut-name">${D.esc(displayNameOf(f))}</div><div class="ut-game">@${D.esc(f.name)}</div></a>`).join('') || '<p class="muted">No friends yet.</p>'}</div></section>
    <section><div class="sec-h"><h2>Recent Games Played (${(c.recentGames || []).length})</h2></div>
      <div class="parent-games">${(c.recentGames || []).map(g => `
        <a class="parent-game" href="#/games/${encodeURIComponent(g.id)}"><b>${D.esc(g.name)}</b>
        <span class="muted small">by ${D.esc(g.creator)} · ${Number(g.visits || 0).toLocaleString()} visits</span></a>`).join('') || '<p class="muted">No games played recently.</p>'}</div></section>`);
}
