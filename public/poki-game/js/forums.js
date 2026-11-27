import { icons } from './icons.js?v=1aa0a4d3';
// 💬 FunTopia Forums page (#/forums) + thread page (#/forums/:id) +
// Safety Q&A page (#/safety-qa).
//
// Forums are PUBLIC on purpose: every post and reply is visible to
// everyone, so moderators can see bad stuff fast and stop it. The server
// strips links and addresses before storing anything, and filters
// swearing per reader — the client never filters text itself, it just
// escapes it with D.esc and renders what the server sent.

// ---------- Safety Q&A ----------
// Plain-language answers a kid can understand. This HTML is kept as one
// readable block on purpose so anyone can edit the words without digging
// through code. It uses the exact phrases 'safe Roblox alternative',
// 'safe platform' and 'safety in games' — those are the words parents
// search for, and they are the promise FunTopia makes.
export const SAFETY_QA_HTML = `
<div class="qa-intro">
<p>FunTopia is a <b>safe Roblox alternative</b> — a free place to play games, build your own games, and hang out with friends, built from the start around <b>safety in games</b>. If you are a kid, a parent, or a teacher, this page answers the safety questions people ask us most, in plain words.</p>
</div>

<section class="qa-item">
<h2>What is FunTopia?</h2>
<p>FunTopia is a free game platform made by BoldPStudios. You can play games other players made, build your own games, dress up your blocky avatar, collect items, and chat with friends. It works a lot like Roblox, but it was built to be a <b>safe platform</b> first — safety in games is not something added later, it is the whole point.</p>
</section>

<section class="qa-item">
<h2>Why is FunTopia a safe Roblox alternative?</h2>
<p>Because we learned from what went wrong on other platforms. On FunTopia, chat has no pictures and no links, addresses turn into hashtags automatically, adults cannot talk to children unless they are a trusted family friend, and real people check for predators. A <b>safe Roblox alternative</b> has to do more than say it is safe — it has to show it, every day. That is what being a <b>safe platform</b> means to us.</p>
</section>

<section class="qa-item">
<h2>How does chat keep me safe?</h2>
<p>Three simple rules protect every chat on FunTopia. <b>No pictures in chat</b> — nobody can send you a photo you did not ask for. <b>No links in chat</b> — links turn into hashtags, so nobody can trick you into clicking to a bad website. <b>Addresses turn into hashtags</b> — if anyone types a home address or a phone number, it shows up as ##### instead, so your private information stays private. Swearing is hidden from kids too: if you are under 18, you see hashtags instead of swear words, even in messages from adults.</p>
</section>

<section class="qa-item">
<h2>What happens if someone is mean or scary to me?</h2>
<p>Tell us right away — it is never your fault for speaking up. Tap <b>Report</b> on the player, the message, or the game. Your report goes straight to the FunTopia safety team, real people whose job is to look for bad behavior and act fast. If someone breaks the rules, their account is removed. Predators get removed and can be taken to court — the person who did the bad thing is the one who is responsible, not you and not other players. If you ever feel in danger right now, tell a parent, a trusted adult, or the police right away. Do not wait for FunTopia.</p>
</section>

<section class="qa-item">
<h2>What can parent accounts see?</h2>
<p>A parent can have a parent account linked to their child's account. A parent account can see what the child's account is doing on FunTopia — the games they play, who they talk to, and the reports linked to their account. Parents can use what they see to talk with their child and to report anything that worries them. That is part of what makes FunTopia a <b>safe platform</b> families can trust.</p>
</section>

<section class="qa-item">
<h2>How are games checked before people can play them?</h2>
<p>Games need to be checked before they can be published. A real person looks at a game first, so no game with mean, scary, or grown-up-only stuff gets onto the platform. If a game slips through or changes later, anyone can report it and the safety team takes it down. Good <b>safety in games</b> means checking before things go live, not just cleaning up after.</p>
</section>

<section class="qa-item">
<h2>How do the forums stay safe?</h2>
<p>The FunTopia forums are public — every post and every reply is visible to everyone. That is on purpose. When everything is out in the open, moderators can see bad posts fast and delete them, and other players can report them too. Nothing bad can hide in a secret chat. Forum posts follow the same chat rules: no links, no addresses, and swearing is hidden from kids. Public forums are one more way a <b>safe Roblox alternative</b> keeps players safe.</p>
</section>

<section class="qa-item">
<h2>What should I do if a stranger talks to me?</h2>
<p>First: do not share anything about yourself. Never tell a stranger your real name, where you live, your school, your phone number, or your password — and never send photos. Second: if they ask for any of that, or try to get you to talk on another app, or say anything that scares you, tap <b>Report</b> and tell a parent or trusted adult. On FunTopia, adults cannot talk to children at all unless they are a trusted family friend, like a mom talking to her own child — so a stranger who tries is already breaking the rules. Real <b>safety in games</b> starts with you telling someone.</p>
</section>

<section class="qa-item">
<h2>Is FunTopia free?</h2>
<p>Yes. FunTopia is free to play. You start with free FunTix, and you can earn more by playing games. Being a <b>safe platform</b> for kids should never cost money — safety is for everyone, not just people who pay.</p>
</section>

<section class="qa-item">
<h2>Where can I read the full Safety Contract?</h2>
<p>Every player agrees to the <a href="#/safety-contract">FunTopia Safety Contract</a> when they create an account. It says the same things as this page, in more detail: the rules, what happens if you break them, and what FunTopia promises to do to keep you safe. If you are looking for a <b>safe Roblox alternative</b> for your family, that contract is the promise in writing.</p>
</section>
`;

export function safetyQaPage(D) {
  D.mount('forums', `<h1><span class="ic">${icons.shield}</span> Safety Q&amp;A</h1>
    <p class="muted">Simple answers about how FunTopia keeps you safe. FunTopia is a safe Roblox alternative and a safe platform for kids — safety in games is our promise.</p>
    <p><a class="btn-secondary" href="#/forums">Back to the Forums</a> <a class="btn-secondary" href="#/safety-contract">Read the Safety Contract</a></p>
    <div class="qa-list">${SAFETY_QA_HTML}</div>`);
}

// ---------- Forums ----------

export async function forumsPage(D) {
  const me = D.me;
  let list = [], status = { table: true };
  try { list = await D.api('GET', '/api/forums'); } catch {}
  try { status = await D.api('GET', '/api/forums/status'); } catch {}
  const isMod = me && (me.owner || me.admin || me.moderator);

  const card = p => `
    <div class="fm-card">
      <div class="fm-head"><a href="#/forums/${encodeURIComponent(p.id)}"><b>${D.esc(p.title)}</b></a></div>
      <div class="muted small">by <a href="#/users/${encodeURIComponent(p.author)}">${D.esc(p.author)}</a> · ${p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</div>
      <p class="fm-body">${D.esc(p.body).replace(/\n/g, '<br>')}</p>
      <div class="row"><a class="btn-secondary btn-small" href="#/forums/${encodeURIComponent(p.id)}"><span class="ic">${icons.chat}</span> Read &amp; reply</a>
      ${isMod ? `<button class="btn-danger btn-small" data-del="${p.id}">Delete post</button>` : ''}</div>
    </div>`;

  D.mount('forums', `
    <h1><span class="ic">${icons.chat}</span> Forums</h1>
    <p class="muted">Talk about games, building, and FunTopia — in public, where everyone (including moderators) can see. No links, no addresses, no pictures. Be kind, and if someone breaks the rules, report them.</p>
    <p><a class="btn-secondary" href="#/safety-qa"><span class="ic">${icons.shield}</span> Safety Q&amp;A — how FunTopia keeps you safe</a></p>
    ${!status.table ? `<p class="fm-warn"><span class="ic">${icons.alert}</span> The Forums table is not set up yet — the owner needs to run the Phase 3 SQL in Supabase once.</p>` : ''}
    ${me ? `
    <section><div class="sec-h"><h2>Start a new post</h2></div>
      <div class="fm-form">
        <input id="fmTitle" maxlength="120" placeholder="Title — e.g. What is your favorite game?">
        <textarea id="fmBody" rows="5" maxlength="2000" placeholder="Write your post here… (no links, no addresses — they turn into hashtags)"></textarea>
        <button class="btn-primary" id="fmSubmit">Post it</button>
      </div>
    </section>` : '<p class="muted">Log in to start a post or reply.</p>'}
    <section><div class="sec-h"><h2>All posts (${list.length})</h2></div>
      ${list.length ? list.map(card).join('') : '<p class="muted">No posts yet — be the first!</p>'}
    </section>`, () => {
    const submit = document.getElementById('fmSubmit');
    if (submit) submit.onclick = async () => {
      const title = document.getElementById('fmTitle').value.trim();
      const body = document.getElementById('fmBody').value.trim();
      if (!title || !body) { D.toast('Add a title and some words first', true); return; }
      submit.disabled = true;
      try {
        const r = await D.api('POST', '/api/forums', { title, body });
        if (r && r.id) { D.toast('Posted!'); forumsPage(D); }
        else D.toast('Could not post', true);
      } catch (e) { D.toast(e.message || 'Could not post', true); }
      submit.disabled = false;
    };
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      if (!confirm('Delete this post and all its replies?')) return;
      b.disabled = true;
      try {
        await D.api('DELETE', '/api/forums/' + encodeURIComponent(b.dataset.del));
        D.toast('Post deleted'); forumsPage(D);
      } catch (e) { D.toast(e.message || 'Could not delete', true); b.disabled = false; }
    });
  });
}

export async function forumThreadPage(D, id) {
  const me = D.me;
  let thread = null;
  try { thread = await D.api('GET', '/api/forums/' + encodeURIComponent(id)); } catch (e) {
    D.mount('forums', `<h1>Forums</h1><p class="muted">${D.esc(e.message || 'That post does not exist.')}</p><p><a class="btn-secondary" href="#/forums">Back to the Forums</a></p>`);
    return;
  }
  const { post, replies } = thread;
  const isMod = me && (me.owner || me.admin || me.moderator);

  D.mount('forums', `
    <h1><a href="#/forums">&larr; Forums</a></h1>
    <div class="fm-card fm-thread">
      <div class="fm-head"><b>${D.esc(post.title)}</b></div>
      <div class="muted small">by <a href="#/users/${encodeURIComponent(post.author)}">${D.esc(post.author)}</a> · ${post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</div>
      <p class="fm-body">${D.esc(post.body).replace(/\n/g, '<br>')}</p>
      ${isMod ? `<div class="row"><button class="btn-danger btn-small" id="fmDelPost">Delete post</button></div>` : ''}
    </div>
    <section><div class="sec-h"><h2>Replies (${replies.length})</h2></div>
      ${replies.length ? replies.map(r => `
      <div class="fm-card fm-reply">
        <div class="muted small">by <a href="#/users/${encodeURIComponent(r.author)}">${D.esc(r.author)}</a> · ${r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</div>
        <p class="fm-body">${D.esc(r.body).replace(/\n/g, '<br>')}</p>
        ${isMod ? `<button class="btn-danger btn-small" data-del-reply="${r.id}">Delete reply</button>` : ''}
      </div>`).join('') : '<p class="muted">No replies yet — be the first to reply!</p>'}
    </section>
    ${me ? `
    <section><div class="sec-h"><h2>Write a reply</h2></div>
      <div class="fm-form">
        <textarea id="fmReply" rows="4" maxlength="2000" placeholder="Write your reply here… (no links, no addresses — they turn into hashtags)"></textarea>
        <button class="btn-primary" id="fmReplySubmit">Reply</button>
      </div>
    </section>` : '<p class="muted">Log in to reply.</p>'}
    <p><a class="btn-secondary" href="#/safety-qa"><span class="ic">${icons.shield}</span> Safety Q&amp;A</a></p>`, () => {
    const submit = document.getElementById('fmReplySubmit');
    if (submit) submit.onclick = async () => {
      const body = document.getElementById('fmReply').value.trim();
      if (!body) { D.toast('Write a reply first', true); return; }
      submit.disabled = true;
      try {
        const r = await D.api('POST', '/api/forums/' + encodeURIComponent(id) + '/reply', { body });
        if (r && r.id) { D.toast('Reply posted!'); forumThreadPage(D, id); }
        else D.toast('Could not reply', true);
      } catch (e) { D.toast(e.message || 'Could not reply', true); }
      submit.disabled = false;
    };
    const delPost = document.getElementById('fmDelPost');
    if (delPost) delPost.onclick = async () => {
      if (!confirm('Delete this post and all its replies?')) return;
      delPost.disabled = true;
      try {
        await D.api('DELETE', '/api/forums/' + encodeURIComponent(id));
        D.toast('Post deleted'); location.hash = '#/forums';
      } catch (e) { D.toast(e.message || 'Could not delete', true); delPost.disabled = false; }
    };
    document.querySelectorAll('[data-del-reply]').forEach(b => b.onclick = async () => {
      if (!confirm('Delete this reply?')) return;
      b.disabled = true;
      try {
        await D.api('DELETE', '/api/forums/reply/' + encodeURIComponent(b.dataset.delReply));
        D.toast('Reply deleted'); forumThreadPage(D, id);
      } catch (e) { D.toast(e.message || 'Could not delete', true); b.disabled = false; }
    });
  });
}
