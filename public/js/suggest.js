import { icons } from './icons.js?v=1aa0a4d3';
// 💡 Suggestion Box page (#/suggest): submit ideas + code snippets,
// browse what others suggested, and (mods/owner) review the queue.
const CAT_LABEL = { game: 'Game idea', character: 'Character', feature: 'Feature', fix: 'Fix', other: 'Other' };
const STATUS_PILL = { pending: `<span class="ic">${icons.clock}</span> Pending review`, approved: `<span class="ic">${icons.check}</span> Liked — on the list to add!`, rejected: `<span class="ic">${icons.x}</span> Not this time` };

export async function suggestPage(D) {
  const me = D.me;
  let list = [], mine = [], queue = [], status = { table: true };
  try { list = await D.api('GET', '/api/suggestions'); } catch {}
  try { status = await D.api('GET', '/api/suggestions/status'); } catch {}
  if (me) { try { mine = await D.api('GET', '/api/suggestions/mine'); } catch {} }
  const isMod = me && (me.owner || me.admin || me.moderator);
  if (isMod) { try { queue = await D.api('GET', '/api/suggestions/pending'); } catch {} }

  const card = s => `
    <div class="sg-card">
      <div class="sg-head"><b>${D.esc(s.title)}</b><span class="sg-pill sg-${s.status}">${STATUS_PILL[s.status] || s.status}</span></div>
      <div class="muted small">by <a href="#/users/${encodeURIComponent(s.username)}">${D.esc(s.username)}</a> · ${CAT_LABEL[s.category] || s.category} · ${new Date(s.created).toLocaleDateString()}</div>
      <pre class="sg-code">${D.esc(s.code)}</pre>
      ${s.note ? `<div class="sg-note"><span class="ic">${icons.chat}</span> ${D.esc(s.note)}</div>` : ''}
    </div>`;

  D.mount('suggest', `
    <h1><span class="ic">${icons.bulb}</span> Suggestion Box</h1>
    <p class="muted">Got an idea for FunTopia — or a code snippet for it? Submit it here. The team reviews every suggestion, and the ones we like get added to the game. (Snippets are read by a human first — nothing runs automatically.)</p>
    ${!status.table ? '<p class="sg-warn"><span class="ic">${icons.alert}</span> The Suggestion Box table is not set up yet — the owner needs to run <code>supabase_suggestions.sql</code> in Supabase once.</p>' : ''}
    ${me ? `
    <section><div class="sec-h"><h2>Submit a suggestion</h2></div>
      <div class="sg-form">
        <input id="sgTitle" maxlength="80" placeholder="Title — e.g. Add a volcano obby">
        <select id="sgCat">${Object.entries(CAT_LABEL).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
        <textarea id="sgCode" rows="7" placeholder="Describe your idea, or paste a code snippet here…&#10;&#10;Example:&#10;-- A lava floor that rises every 10 seconds&#10;local lava = part([0, 0, 0], [100, 1, 100], '#ff3b1f', { k: 'kill' })"></textarea>
        <button class="btn-primary" id="sgSubmit">Submit suggestion</button>
      </div>
    </section>` : '<p class="muted">Log in to submit a suggestion.</p>'}
    ${isMod && queue.length ? `
    <section><div class="sec-h"><h2><span class="ic">${icons.shield}</span> Review queue (${queue.length})</h2></div>
      ${queue.map(s => `
      <div class="sg-card sg-review" data-id="${s.id}">
        <div class="sg-head"><b>${D.esc(s.title)}</b><span class="muted small">by ${D.esc(s.username)} · ${CAT_LABEL[s.category] || s.category}</span></div>
        <pre class="sg-code">${D.esc(s.code)}</pre>
        <div class="row"><input class="sg-note-in" placeholder="Note to the player (optional)">
        <button class="btn-primary" data-act="approve"><span class="ic">${icons.check}</span> Like it</button>
        <button class="btn-danger" data-act="reject"><span class="ic">${icons.x}</span> Pass</button></div>
      </div>`).join('')}
    </section>` : ''}
    ${me && mine.length ? `
    <section><div class="sec-h"><h2>My suggestions (${mine.length})</h2></div>
      ${mine.map(card).join('')}
    </section>` : ''}
    <section><div class="sec-h"><h2>All suggestions (${list.length})</h2></div>
      ${list.length ? list.map(card).join('') : '<p class="muted">No suggestions yet — be the first!</p>'}
    </section>`, () => {
    const submit = document.getElementById('sgSubmit');
    if (submit) submit.onclick = async () => {
      const title = document.getElementById('sgTitle').value.trim();
      const code = document.getElementById('sgCode').value;
      const category = document.getElementById('sgCat').value;
      if (!title || !code.trim()) { D.toast('Add a title and your idea first', true); return; }
      submit.disabled = true;
      const r = await D.api('POST', '/api/suggestions', { title, code, category });
      submit.disabled = false;
      if (r && r.id) { D.toast('Suggestion submitted — thanks!'); suggestPage(D); }
      else D.toast((r && r.error) || 'Could not submit', true);
    };
    document.querySelectorAll('.sg-review').forEach(el => {
      el.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
        const note = el.querySelector('.sg-note-in').value.trim();
        b.disabled = true;
        const r = await D.api('POST', `/api/suggestions/${el.dataset.id}/${b.dataset.act}`, { note });
        if (r && r.id) { D.toast(b.dataset.act === 'approve' ? 'Liked! The player has been told' : 'Passed — the player has been told'); suggestPage(D); }
        else { D.toast((r && r.error) || 'Could not review', true); b.disabled = false; }
      });
    });
  });
}
