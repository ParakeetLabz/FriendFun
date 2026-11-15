import { icons } from './icons.js?v=1aa0a4d3';
import { displayNameOf, FAMILY_LOGO } from './ui.js?v=c7d9c2ae';
// 👨‍👩‍👧‍👦 FunTopia Family page (#/family): create or join a family, family-only
// chat, and the shared family account (name, color, icon, motto).
const FAMILY_COLORS = ['#7c3aed', '#e2231a', '#0284c7', '#16a34a', '#ec4899', '#f59e0b', '#06b6d4', '#ef4444'];
const FAMILY_ICONS = ['🏠', '👨‍👩‍👧‍👦', '⭐', '❤️', '🔥', '🌈', '👑', '🎮'];

export async function familyPage(D) {
  const me = D.me;
  let status = { table: true, displayNames: true };
  try { status = await D.api('GET', '/api/family/status'); } catch {}
  if (!status.table) {
    D.mount('family', `<h1>👨‍👩‍👧‍👦 FunTopia Family</h1>
      <p class="muted">FunTopia Family isn't set up yet — the owner needs to run <code>supabase_family.sql</code> in Supabase once.</p>`);
    return;
  }
  let fam = null;
  try { const r = await D.api('GET', '/api/family'); fam = r.family; } catch {}
  if (!fam) return noFamilyView(D);
  return familyView(D, fam);
}

function noFamilyView(D) {
  let color = FAMILY_COLORS[0], icon = FAMILY_ICONS[0];
  D.mount('family', `
    <h1><span class="ic">${FAMILY_LOGO}</span> FunTopia Family</h1>
    <p class="muted">Connect your accounts into one family. Share a family-only chat and a family account that only your family sees — change its name, color, icon and motto.</p>
    <section><div class="sec-h"><h2>Create a family</h2></div>
      <div class="sg-form">
        <input id="famName" maxlength="32" placeholder="Family name — e.g. The Zayds">
        <input id="famMotto" maxlength="80" placeholder="Family motto (optional)">
        <div class="fam-picks" id="famColors">${FAMILY_COLORS.map(c => `<button class="fam-swatch${c === color ? ' on' : ''}" data-c="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>
        <div class="fam-picks" id="famIcons">${FAMILY_ICONS.map(i => `<button class="fam-ico${i === icon ? ' on' : ''}" data-i="${i}">${i}</button>`).join('')}</div>
        <button class="btn-primary" id="famCreate">Create family</button>
      </div>
    </section>
    <section><div class="sec-h"><h2>Join a family</h2></div>
      <div class="sg-form">
        <input id="famCode" maxlength="6" placeholder="Invite code — ask your family owner for it" style="text-transform:uppercase">
        <button class="btn-primary" id="famJoin">Join family</button>
      </div>
    </section>`, () => {
    document.querySelectorAll('#famColors .fam-swatch').forEach(b => b.onclick = () => {
      color = b.dataset.c;
      document.querySelectorAll('#famColors .fam-swatch').forEach(x => x.classList.toggle('on', x === b));
    });
    document.querySelectorAll('#famIcons .fam-ico').forEach(b => b.onclick = () => {
      icon = b.dataset.i;
      document.querySelectorAll('#famIcons .fam-ico').forEach(x => x.classList.toggle('on', x === b));
    });
    document.querySelector('#famCreate').onclick = async () => {
      const name = document.querySelector('#famName').value.trim();
      const motto = document.querySelector('#famMotto').value.trim();
      if (name.length < 2) return D.toast('Family name needs 2–32 characters', true);
      try {
        await D.api('POST', '/api/family/create', { name, motto, color, icon });
        D.toast('Family created — welcome!');
        familyPage(D);
      } catch (e) { D.toast(e.message, true); }
    };
    document.querySelector('#famJoin').onclick = async () => {
      const code = document.querySelector('#famCode').value.trim().toUpperCase();
      if (!code) return D.toast('Enter the invite code', true);
      try {
        await D.api('POST', '/api/family/join', { code });
        D.toast('Welcome to the family!');
        familyPage(D);
      } catch (e) { D.toast(e.message, true); }
    };
  });
}

async function familyView(D, fam) {
  const me = D.me;
  const isOwner = fam.owner.toLowerCase() === me.name.toLowerCase();
  let chat = [];
  try { chat = await D.api('GET', '/api/family/chat'); } catch {}
  const memberCard = m => {
    const isMe = m.name.toLowerCase() === me.name.toLowerCase();
    const isFamOwner = m.name.toLowerCase() === fam.owner.toLowerCase();
    return `<div class="fam-member">
      <div class="ut-img">${D.avatarImgTag(m.avatar)}</div>
      <div><b>${D.esc(displayNameOf(m))}</b>${isFamOwner ? ' 👑' : ''}${isMe ? ' (you)' : ''}
      <div class="muted small">@${D.esc(m.name)}</div></div>
      ${isOwner && !isMe ? `<button class="btn-danger btn-small fam-remove" data-name="${D.esc(m.name)}">Remove</button>` : ''}
    </div>`;
  };
  const chatHtml = () => chat.length ? chat.map(m => {
    const sender = fam.members.find(x => x.name.toLowerCase() === m.username.toLowerCase());
    const who = sender ? displayNameOf(sender) : m.username;
    const isMe = m.username.toLowerCase() === me.name.toLowerCase();
    return `<div class="fam-msg${isMe ? ' mine' : ''}"><b>${D.esc(who)}</b> <span class="muted small">${new Date(m.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><div>${D.esc(m.text)}</div></div>`;
  }).join('') : '<p class="muted">No messages yet — say hi to your family!</p>';

  D.mount('family', `
    <div class="fam-hero" style="--fam-color:${fam.color}">
      <div class="fam-hero-icon">${D.esc(fam.icon)}</div>
      <div><h1>${D.esc(fam.name)}</h1>
      <p class="muted">${fam.motto ? D.esc(fam.motto) + ' · ' : ''}${fam.members.length} member${fam.members.length === 1 ? '' : 's'} · Owner: ${D.esc(fam.owner)}</p></div>
    </div>
    ${isOwner ? `
    <section><div class="sec-h"><h2><span class="ic">${icons.gear}</span> Family account</h2><span class="muted small">Only the owner can change this</span></div>
      <div class="sg-form">
        <input id="famSetName" maxlength="32" value="${D.esc(fam.name)}" placeholder="Family name">
        <input id="famSetMotto" maxlength="80" value="${D.esc(fam.motto)}" placeholder="Family motto">
        <div class="fam-picks" id="famSetColors">${FAMILY_COLORS.map(c => `<button class="fam-swatch${c === fam.color ? ' on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}</div>
        <div class="fam-picks" id="famSetIcons">${FAMILY_ICONS.map(i => `<button class="fam-ico${i === fam.icon ? ' on' : ''}" data-i="${i}">${i}</button>`).join('')}</div>
        <button class="btn-primary" id="famSave">Save family account</button>
      </div>
      <div class="sg-form" style="margin-top:12px">
        <div class="set-row"><span>Invite code</span><b id="famCodeVal">${D.esc(fam.code || '••••••')}</b></div>
        <p class="muted small">Share this code with accounts you want in the family. Anyone with it can join.</p>
        <div><button class="btn-secondary" id="famCopyCode">Copy code</button> <button class="btn-secondary" id="famNewCode">New code</button></div>
      </div>
    </section>` : `
    <section><div class="sec-h"><h2>Family account</h2></div>
      <p class="muted">Only the owner (${D.esc(fam.owner)}) can change the family name, color, icon and motto.</p>
    </section>`}
    <section><div class="sec-h"><h2>Members (${fam.members.length})</h2></div>
      <div class="fam-members">${fam.members.map(memberCard).join('')}</div>
    </section>
    <section><div class="sec-h"><h2><span class="ic">${icons.chat}</span> Family chat</h2><span class="muted small">Only your family can see this</span></div>
      <div class="fam-chat" id="famChat">${chatHtml()}</div>
      <div class="fam-chat-send">
        <input id="famChatInput" maxlength="500" placeholder="Message your family…" autocomplete="off">
        <button class="btn-primary" id="famChatSend">Send</button>
      </div>
    </section>
    <button class="btn-danger" id="famLeave">${isOwner && fam.members.length === 1 ? 'Delete family' : 'Leave family'}</button>`, () => {
    // owner: family account settings
    let color = fam.color, icon = fam.icon;
    document.querySelectorAll('#famSetColors .fam-swatch').forEach(b => b.onclick = () => {
      color = b.dataset.c;
      document.querySelectorAll('#famSetColors .fam-swatch').forEach(x => x.classList.toggle('on', x === b));
    });
    document.querySelectorAll('#famSetIcons .fam-ico').forEach(b => b.onclick = () => {
      icon = b.dataset.i;
      document.querySelectorAll('#famSetIcons .fam-ico').forEach(x => x.classList.toggle('on', x === b));
    });
    const saveBtn = document.querySelector('#famSave');
    if (saveBtn) saveBtn.onclick = async () => {
      const name = document.querySelector('#famSetName').value.trim();
      const motto = document.querySelector('#famSetMotto').value.trim();
      try {
        await D.api('PUT', '/api/family', { name, motto, color, icon });
        D.toast('Family account updated');
        familyPage(D);
      } catch (e) { D.toast(e.message, true); }
    };
    const copyBtn = document.querySelector('#famCopyCode');
    if (copyBtn) copyBtn.onclick = async () => {
      try { await navigator.clipboard.writeText(fam.code || ''); D.toast('Invite code copied'); }
      catch { D.toast('Code: ' + (fam.code || '')); }
    };
    const newCodeBtn = document.querySelector('#famNewCode');
    if (newCodeBtn) newCodeBtn.onclick = async () => {
      try {
        const r = await D.api('POST', '/api/family/code');
        fam.code = r.code;
        document.querySelector('#famCodeVal').textContent = r.code;
        D.toast('New invite code made');
      } catch (e) { D.toast(e.message, true); }
    };
    // owner: remove a member
    document.querySelectorAll('.fam-remove').forEach(b => b.onclick = async () => {
      try {
        await D.api('POST', '/api/family/remove', { username: b.dataset.name });
        D.toast(b.dataset.name + ' removed from the family');
        familyPage(D);
      } catch (e) { D.toast(e.message, true); }
    });
    // leave / delete
    document.querySelector('#famLeave').onclick = async () => {
      try {
        await D.api('POST', '/api/family/leave');
        D.toast(isOwner && fam.members.length === 1 ? 'Family deleted' : 'You left the family');
        familyPage(D);
      } catch (e) { D.toast(e.message, true); }
    };
    // chat: send + poll for new messages
    const chatBox = document.querySelector('#famChat');
    const input = document.querySelector('#famChatInput');
    const send = async () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      try {
        const m = await D.api('POST', '/api/family/chat', { text });
        chat.push(m);
        chatBox.innerHTML = chatHtml();
        chatBox.scrollTop = chatBox.scrollHeight;
      } catch (e) { D.toast(e.message, true); }
    };
    document.querySelector('#famChatSend').onclick = send;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    const poll = setInterval(async () => {
      try {
        const fresh = await D.api('GET', '/api/family/chat');
        if (fresh.length !== chat.length || (fresh.length && chat.length && fresh[fresh.length - 1].id !== chat[chat.length - 1].id)) {
          chat = fresh;
          chatBox.innerHTML = chatHtml();
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      } catch {}
    }, 5000);
    D.setCleanup(() => clearInterval(poll));
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}
