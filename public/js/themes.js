import { icons } from './icons.js?v=1aa0a4d3';
import { CLUB } from './ui.js?v=c7d9c2ae';
// App themes — FriendClub exclusive. 'funtopia' is the default (no body class).
// A theme only applies when the user is a FriendClub member (enforced in applyTheme).
export const THEMES = [
  { id: 'funtopia', name: 'FunTopia', desc: 'The classic violet + cyan look.', colors: ['#7c3aed', '#22d3ee', '#17112e', '#f4f1ff'] },
  { id: 'roblox', name: 'Classic Roblox', desc: 'Old-school Roblox — bright red, blue and white.', colors: ['#e2231a', '#0057a8', '#f2f2f2', '#1a1a1a'] },
  { id: 'rock', name: 'Rock', desc: 'Black, blood red and fire orange. Turn it up.', colors: ['#c8102e', '#ff6b00', '#0a0a0a', '#f5f5f5'] },
  { id: 'ocean', name: 'Ocean', desc: 'Deep blues and teal, calm and cool.', colors: ['#0284c7', '#22d3ee', '#062a3a', '#e0f7ff'] },
  { id: 'forest', name: 'Forest', desc: 'Dark greens, fresh and natural.', colors: ['#16a34a', '#4ade80', '#0d1f0d', '#e8f5e8'] },
  { id: 'sunset', name: 'Sunset', desc: 'Warm pinks, orange and purple dusk.', colors: ['#ec4899', '#fb923c', '#2a0f1e', '#fff0f5'] },
  { id: 'midnight', name: 'Midnight', desc: 'Sleek dark navy and steel blue.', colors: ['#3b82f6', '#60a5fa', '#0b0f1a', '#f1f5f9'] },
];
export const THEME_IDS = new Set(THEMES.map(t => t.id).filter(id => id !== 'funtopia'));
export function getSavedTheme() {
  try { return localStorage.getItem('ff_theme') || ''; } catch { return ''; }
}
export function setSavedTheme(id) {
  try { localStorage.setItem('ff_theme', id); } catch {}
}

export function themesPage(D) {
  const me = D.me;
  const isClub = !!(me && me.club);
  const current = getSavedTheme() || 'funtopia';
  const card = t => {
    const on = current === t.id;
    const locked = !isClub;
    return `<button class="th-card${on ? ' on' : ''}${locked ? ' locked' : ''}" data-id="${t.id}">
      <span class="th-sw">${t.colors.map(c => `<span style="background:${c}"></span>`).join('')}</span>
      <b>${D.esc(t.name)}</b><p>${D.esc(t.desc)}</p>
      ${on ? '<span class="th-badge">Current</span>' : locked ? '<span class="th-lock">🔒 Club</span>' : ''}
    </button>`;
  };
  D.mount('themes', `
    <h1><span class="ic">${icons.palette}</span> App Themes</h1>
    <p class="muted">Change the whole site's look. Pick a theme below — it applies instantly and sticks on this device.</p>
    ${isClub ? '' : `
    <div class="th-hero">
      <h2>${CLUB} FriendClub Exclusive</h2>
      <p class="muted">Themes are a FriendClub perk. Join FriendClub to unlock all 7 themes and switch the site's look anytime.</p>
      <a class="btn-primary" href="#/club">${CLUB} Join FriendClub</a>
    </div>`}
    <div class="th-grid">${THEMES.map(card).join('')}</div>`, () => {
    document.querySelectorAll('.th-card').forEach(b => b.onclick = () => {
      if (!isClub) { D.toast('Themes are a FriendClub perk — join to use them', true); return; }
      const id = b.dataset.id;
      setSavedTheme(id);
      D.applyTheme();
      document.querySelectorAll('.th-card').forEach(x => {
        x.classList.toggle('on', x.dataset.id === id);
        const badge = x.querySelector('.th-badge'); if (badge) badge.remove();
        if (x.dataset.id === id) x.insertAdjacentHTML('beforeend', '<span class="th-badge">Current</span>');
      });
      D.toast('Theme applied: ' + (THEMES.find(t => t.id === id)?.name || id));
    });
  });
}
