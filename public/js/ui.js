import { BADGES } from './catalog.js';
const CLUB_PATH = 'M2 17h20v3H2zM4 16a8 8 0 0 1 16 0zM10.5 7h3v5h-3z';

export function nameColor(name) {
  const cols = ['#fd2943', '#01a2ff', '#02b857', '#a75eb8', '#f58225', '#f5cd30', '#e8bac8', '#d7c59a'];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0; return cols[h % cols.length];
}
function confetti(root) {
  const box = document.createElement('div'); box.className = 'confetti';
  for (let i = 0; i < 120; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = `hsl(${Math.random() * 360},90%,60%)`; s.style.animationDelay = Math.random() * 1.5 + 's'; s.style.animationDuration = 2 + Math.random() * 2 + 's'; box.appendChild(s); }
  root.querySelector('.game-root').appendChild(box); setTimeout(() => box.remove(), 5000);
}
const chatIcon = '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>';

export const LOGO = '<svg class="ff-logo" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fflg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect x="3" y="3" width="42" height="42" rx="12" fill="url(#fflg)"/><rect x="14" y="17" width="7" height="9" rx="2" fill="#fff"/><rect x="27" y="17" width="7" height="9" rx="2" fill="#fff"/><path d="M16 31q8 6 16 0" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M41 2l1.7 4.6L47 8.3l-4.3 1.7L41 14.6 39.3 10 35 8.3l4.3-1.7z" fill="#22d3ee"/></svg>';

export const CLUB = `<svg class="club-badge" viewBox="0 0 24 24" width="18" height="18"><title>FriendClub member</title><path fill="#ffd400" d="${CLUB_PATH}"/></svg>`;

export const tix = '<svg class="tix" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 5h18a1 1 0 0 1 1 1v2.2a2.8 2.8 0 0 0 0 5.6V16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2.2a2.8 2.8 0 0 0 0-5.6V6a1 1 0 0 1 1-1z"/><line x1="8" y1="5" x2="8" y2="17" stroke="#1b1d1f" stroke-width="1.4" stroke-dasharray="2 1.6" opacity=".55"/><circle cx="15" cy="11" r="2.2" fill="#1b1d1f" opacity=".65"/></svg>';

export const badgeIcon = (id, size = 18) => { const b = BADGES[id]; return b ? `<svg class="club-badge" viewBox="0 0 24 24" width="${size}" height="${size}"><title>${b.name}</title><path fill="${b.color}" d="${b.path}"/></svg>` : ''; };
