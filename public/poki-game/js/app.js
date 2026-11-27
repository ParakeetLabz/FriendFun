import { nameColor, tix, LOGO, CLUB, badgeIcon, displayNameOf } from './ui.js?v=a89886d1';
import { icons } from './icons.js?v=1aa0a4d3';
import { THEME_IDS, themesPage } from './themes.js?v=3780b96a';
import { showLaunch } from './launch.js?v=3b7c806b';

// Badge definitions
let BADGE_DEFS = {};
async function loadBadgeDefs() {
  try {
    BADGE_DEFS = await api('GET', '/api/badges') || {};
  } catch (e) { BADGE_DEFS = {}; }
}
const badgeDef = id => BADGE_DEFS[id] || (BADGES[id] ? { id, ...BADGES[id], custom: false } : null);
const badgeIcon2 = (id, size = 18) => {
  const b = badgeDef(id);
  if (!b) return '';
  if (b.image) return `<img src="${b.image}" width="${size}" height="${size}" style="border-radius:6px;vertical-align:-4px" title="${esc(b.name)}" alt="${esc(b.name)}">`;
  if (b.custom || b.icon) return `<span style="font-size:${size}px" title="${esc(b.name)}">${b.icon || '🏅'}</span>`;
  return badgeIcon(id, size);
};
import { worldThumbnail } from './three-util.js?v=88ba247e';
import * as THREE from 'three';
// avatar3d loads lazily after login
let _avatar3d = null;
let _avatar3dLoading = null;
async function ensureAvatar3d() {
  if (_avatar3d) return _avatar3d;
  if (!_avatar3dLoading) {
    _avatar3dLoading = import('./avatar3d.js?v=f67e1a92').then(m => {
      _avatar3d = m;
      refreshAvatars(); // swap placeholders for real avatars
      return m;
    });
  }
  return _avatar3dLoading;
}
function refreshAvatars() {
  if (!_avatar3d) return;
  document.querySelectorAll('img[data-av]').forEach(img => {
    try {
      const av = JSON.parse(img.dataset.av);
      img.src = _avatar3d.avatarImage(av, img.dataset.mode || 'headshot');
      img.removeAttribute('data-av');
    } catch {}
  });
}
function avatarImage(avatar, mode = 'headshot') {
  if (_avatar3d) return _avatar3d.avatarImage(avatar, mode);
  // Placeholder; real avatar swaps in after load
  ensureAvatar3d().catch(() => {});
  const placeholder = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="20" fill="#888"/><rect x="25" y="60" width="50" height="35" rx="10" fill="#888"/></svg>');
  // Placeholder; refreshAvatars swaps when 3D loads
  // Embed avatar data for refreshAvatars queue
  _pendingAvatars.push({ avatar, mode });
  return placeholder;
}
const _pendingAvatars = [];
// Patch: intercept img creation
function avatarImgTag(avatar, mode = 'headshot', cls = '', style = '') {
  if (_avatar3d) return `<img class="${cls}"${style ? ` style="${style}"` : ''} src="${_avatar3d.avatarImage(avatar, mode)}">`;
  ensureAvatar3d().catch(() => {});
  const avJson = JSON.stringify(avatar || {}).replace(/"/g, '&quot;');
  const placeholder = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="20" fill="#888"/><rect x="25" y="60" width="50" height="35" rx="10" fill="#888"/></svg>');
  return `<img class="${cls}"${style ? ` style="${style}"` : ''} src="${placeholder}" data-av="${avJson}" data-mode="${mode}">`;
}
function buildCharacter(avatar) {
  if (!_avatar3d) throw new Error('avatar3d not loaded yet');
  return _avatar3d.buildCharacter(avatar);
}
import { CATALOG, ITEM, ECON, BADGES, PET_MODELS, GEAR_MODELS, UGC_TEMPLATES, UGC_CREATOR_CUT } from './catalog.js?v=03de3e72';
import { templates, GEN_GAMES } from './worlds.js?v=3266e928';
import { isVerified } from './verified.js?v=4e9b72be';
const vtag = (name) => isVerified(name) ? ` <span class="ic" style="color:#1d9bf0" title="Verified account">${icons.check}</span>` : '';
import { sfx } from './sound.js?v=music27';
try { sfx.enabled = localStorage.getItem('ff_sfx') !== '0'; } catch {}

let app = document.getElementById('app');
let overlayMode = false;
let lobbyCleanup = null;
window.__setOverlayApp = (el) => { lobbyCleanup = cleanup; cleanup = null; app = el; overlayMode = true; };
window.__clearOverlayApp = () => {
  if (!overlayMode) return;
  if (cleanup) { const c = cleanup; cleanup = null; c(); }
  app = document.getElementById('app');
  overlayMode = false;
  cleanup = lobbyCleanup; lobbyCleanup = null;
};
window.__route = route;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let token = localStorage.getItem('ff_token');
let me = null;
let cleanup = null;

async function api(method, url, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && url !== '/api/login') { logout(true); throw new Error('Please log in'); }
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
}
// App themes (FriendClub exclusive).
// A saved public theme only applies while the user is a Club member;
// an explicit 'funtopia' pick means plain violet.
function applyTheme() {
  let saved = '';
  try { saved = localStorage.getItem('ff_theme') || ''; } catch {}
  const clubTheme = saved && me?.club && THEME_IDS.has(saved) ? saved : '';
  THEME_IDS.forEach(id => document.body.classList.remove('theme-' + id));
  if (clubTheme) {
    document.body.classList.add('theme-' + clubTheme);
  }
  window.__setLobbyStage?.(); // recolor the live 3D stage if the lobby is up
}

// Relative time for DM timestamps ("just now", "5m ago", "2h ago", "3d ago").
// dmPage/dmListPage call this on every message row; it was referenced but
// never defined, so any non-empty DM thread threw and rendered blank.
function timeAgo(ts) {
  const s = Math.max(0, Math.floor((Date.now() - Number(ts || 0)) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 86400 * 7) return Math.floor(s / 86400) + 'd ago';
  return new Date(Number(ts)).toLocaleDateString();
}
export function toast(msg, err = false) {
  const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg;
  document.getElementById('toasts').appendChild(t); setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3000);
}
function logout(silent) { if (!silent && token) api('POST', '/api/logout').catch(() => {}); clearInterval(onlineTimer); clearInterval(partyTimer); onlineTimer = null; partyTimer = null; removeAccount(me?.name); token = null; me = null; localStorage.removeItem('ff_token'); location.hash = '#/login'; route(); }
function logoutAll() { const accs = getAccounts(); for (const a of accs) { try { fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.token } }); } catch {} } clearInterval(onlineTimer); clearInterval(partyTimer); onlineTimer = null; partyTimer = null; localStorage.removeItem('ff_accounts'); localStorage.removeItem('ff_token'); token = null; me = null; location.hash = '#/login'; route(); }
function getAccounts() { try { return JSON.parse(localStorage.getItem('ff_accounts') || '[]'); } catch { return []; } }
function saveAccounts(accs) { localStorage.setItem('ff_accounts', JSON.stringify(accs)); }
function addAccount(name, tok) { const accs = getAccounts().filter(a => a.name.toLowerCase() !== name.toLowerCase()); accs.push({ name, token: tok }); saveAccounts(accs); }
function removeAccount(name) { if (!name) return; saveAccounts(getAccounts().filter(a => a.name.toLowerCase() !== String(name).toLowerCase())); }
function switchAccount(name) { const acc = getAccounts().find(a => a.name.toLowerCase() === String(name).toLowerCase()); if (!acc) return; token = acc.token; localStorage.setItem('ff_token', token); me = null; location.hash = '#/home'; route(); }
// Switch the active session to a token WITHOUT saving it as an account
// (used for parent-acting sessions: the acting token must never replace
// the child's own saved sign-in in ff_accounts).
function switchToToken(tok) { token = tok; localStorage.setItem('ff_token', tok); me = null; location.hash = '#/home'; route(); }

// Parent acting as a linked child: a persistent banner on EVERY page while
// the session is a parent-acting session (me.actingParent comes from
// /api/me). It lives in document.body, outside #app, so page mounts and
// the lobby overlay never remove it. It always offers the way back.
// The banner is fixed at the very top — but it must NEVER cover the site
// header. The lobby is itself viewport-fixed (`.lobby { position: fixed;
// inset: 0 }`), so an in-flow banner cannot push it down. Instead, while
// acting, the whole app shifts down by the banner's height (body.acting
// + --acting-h, see style.css): the lobby, the overlay, and in-flow pages
// all start below the banner, so the logo, FunTix, Themes, Settings and
// account menu stay clickable. The X on the side (same look as the overlay
// ✕) switches back, and so do the Switch back button and the ESC / E keys
// (never while typing).
// Guest play (u163): anyone can play without an account. Store/portal
// embeds (server sets ff_embed) start as a guest automatically; the main
// site shows a Play as Guest button. Guests can't buy, publish, friend or DM.
function isEmbed() { try { return sessionStorage.getItem('ff_embed') === '1'; } catch { return false; } }
async function startGuest() {
  const r = await api('POST', '/api/guest');
  token = r.token; try { localStorage.setItem('ff_token', token); } catch {}
  me = null;
}
function renderGuestBadge(seg) {
  let el = document.getElementById('guest-badge');
  if (!me?.guest || seg === 'play') { el?.remove(); return; }
  if (el) return;
  el = document.createElement('div');
  el.id = 'guest-badge';
  el.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:10000;display:flex;align-items:center;gap:8px;padding:6px 8px 6px 14px;border-radius:999px;background:rgba(20,16,40,.88);color:#fff;font-size:13px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,.35);max-width:calc(100vw - 24px);';
  el.innerHTML = `<span>Playing as ${esc(me.name)}</span><button class="btn-primary btn-small" style="padding:4px 12px;border-radius:999px">Sign up to save</button>`;
  el.querySelector('button').onclick = () => { el.remove(); logout(); };
  document.body.appendChild(el);
}
function renderActingBanner() {
  const existing = document.getElementById('acting-banner');
  const parent = me?.actingParent;
  if (!parent || !me) {
    existing?.remove();
    document.body.classList.remove('acting');
    document.documentElement.style.removeProperty('--acting-h');
    return;
  }
  const label = `You are using ${me.name}'s account as their parent`;
  const backLabel = `Switch back to ${parent}`;
  if (existing) {
    existing.querySelector('.acting-banner-text').textContent = label;
    existing.querySelector('.acting-banner-back').textContent = backLabel;
    syncActingOffset();
    return;
  }
  const el = document.createElement('div');
  el.id = 'acting-banner';
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10001;display:flex;align-items:center;justify-content:center;gap:12px;padding:5px 12px;background:#7c3aed;color:#fff;font-size:14px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,.35);';
  el.innerHTML = `<span class="acting-banner-text"></span><button class="acting-banner-back btn-secondary btn-small" style="background:#fff;color:#5b21b6;border:none;"></button><button class="acting-banner-x lb-ov-close" title="Switch back to parent account" aria-label="Switch back to parent account" style="position:static;width:28px;height:28px;font-size:14px;flex-shrink:0;">✕</button>`;
  el.querySelector('.acting-banner-text').textContent = label;
  const back = el.querySelector('.acting-banner-back');
  back.textContent = backLabel;
  back.onclick = () => switchBackFromActing();
  el.querySelector('.acting-banner-x').onclick = () => switchBackFromActing();
  document.body.appendChild(el);
  document.body.classList.add('acting');
  syncActingOffset();
  // The banner can wrap to two lines on narrow screens: keep the offset
  // in sync with its real height.
  try { new ResizeObserver(syncActingOffset).observe(el); } catch {}
}
// While acting, the app shifts down by the banner's height so the banner
// never covers the header (body.acting rules in style.css).
function syncActingOffset() {
  const el = document.getElementById('acting-banner');
  if (!el) return;
  document.documentElement.style.setProperty('--acting-h', el.offsetHeight + 'px');
}
// Keyboard way out of the acting view: ESC or E switches back to the
// parent, same as the banner X. Never while typing in a field, and never
// inside a game (E is a game key there, ESC opens the game menu) — the X
// and Switch back buttons still work in a game.
addEventListener('keydown', e => {
  if (!me?.actingParent) return;
  if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
  const h = location.hash || '';
  if (h.startsWith('#/games/') || h.startsWith('#/play/')) return;
  if (e.key === 'Escape' || e.key === 'e' || e.key === 'E') { e.preventDefault(); switchBackFromActing(); }
});
function switchBackFromActing() {
  const parent = me?.actingParent;
  if (!parent) return;
  const acc = getAccounts().find(a => a.name.toLowerCase() === parent.toLowerCase());
  if (acc) { switchAccount(parent); return; }
  toast('Your own sign-in was not saved on this device — please log in again.');
  logout();
}
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.0', '') + 'K' : String(n);
const rating = g => (g.likes + g.dislikes) ? Math.round(g.likes / (g.likes + g.dislikes) * 100) + '%' : '--';

const ADMIN = '<span class="admin-badge">ADMIN</span>';

// ---------- thumbnails ----------
const thumbCache = new Map();
async function fillThumbs(root = app) {
  for (const img of root.querySelectorAll('img[data-thumb]')) {
    const id = img.dataset.thumb;
    if (thumbCache.has(id)) { img.src = thumbCache.get(id); continue; }
    try {
      const g = await api('GET', '/api/games/' + id);
      const url = worldThumbnail(g.world); thumbCache.set(id, url);
      root.querySelectorAll(`img[data-thumb="${id}"]`).forEach(i => (i.src = url));
      api('POST', `/api/games/${id}/thumbnail`, { thumbnail: url }).catch(() => {});
    } catch {}
  }
}
const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#393b3d"/></svg>');
function gameCard(g) {
  return `<a class="game-card" href="#/games/${g.id}">
    <div class="gc-thumb"><img ${g.thumbnail ? `src="${g.thumbnail}"` : `src="${PLACEHOLDER}" data-thumb="${g.id}"`} alt="">${g.icon ? `<span class="gc-icon">${esc(g.icon)}</span>` : ''}${g.is2ui ? `<span class="gc-2ui">2UI</span>` : ''}</div>
    <div class="gc-name">${esc(g.name || "Untitled Game")}</div>
    <div class="gc-stats"><span>${icons.thumb} ${rating(g)}</span><span>${icons.people} ${fmt(g.playing)}</span></div>
  </a>`;
}
function userTile(u) {
  const st = u.gameId ? 'ingame' : u.online ? 'online' : '';
  return `<a class="user-tile" href="#/users/${encodeURIComponent(u.name)}" title="${u.gameName ? 'Playing ' + esc(u.gameName) : ''}">
    <div class="ut-img ${st}">${avatarImgTag(u.avatar)}</div><div class="ut-name">${esc(displayNameOf(u))}${u.moderator ? ` <span class="ic" title="Moderator">${icons.shield}</span>` : ''}</div>
    ${u.gameName ? `<div class="ut-game">${esc(u.gameName)}</div>` : ''}</a>`;
}

// ---------- layout ----------
const UPDATES = [
  { id: 'u19', date: 'Nov 4, 2026', title: '🎉 57 updates: chat tags, new moves, new worlds + social', items: [
    '💬 Chat tags: OWNER, ADMIN, MOD and CLUB tags now show next to names in chat and the player list',
    '😀 9 new faces (Starstruck, Shades, Vampire, Sly, Nervous, Sparkling, Glitch, Kitty, Pirate) + 4 shirts (Checkerboard, Plaid, Denim, Galaxy)',
    '🫡 2 new emotes: Salute and Shrug — try /e salute and /e shrug',
    '🦘 New moves: double jump, double-tap W to sprint, Q to dash, C to crouch',
    '🌀 New Studio parts: teleporter pads (pair by name), conveyors, low-gravity zones, ice slides, water, coin magnets, shields and safe zones',
    '🏝️ 4 new worlds: Sky Islands, Race Track, Volcano Escape and Snow Peak',
    '👥 Follow players, set a status, gift FunTix, pin a showcase game, and claim streak rewards at 7, 14 and 30 days',
    '♥ Wishlist catalog items, sort the Marketplace by price, and filter free-only',
    '🔥 Trending creators on the dashboard, friend activity feed, and notes on friend requests',
    '🎲 Discover: sort by playing/newest/rated/A–Z, genre filters, and a Surprise Me button',
    '🏆 Win screen now has Play Again and Next Game buttons, plus checkpoint progress (3/8)',
    '🎮 New settings: FPS + ping display, reduce motion, chat timestamps — and /me chat actions',
    '🔨 Studio: staircase builder, mirror selection, and a live part counter in the Explorer',
    '🛠️ Fixed the Marketplace grid — items now lay out in the grid properly instead of stacking',
  ]},
  { id: 'u18', date: 'Oct 31, 2026', title: '✨ FunAI now builds Studio games', items: [
    '🏗️ FunAI now designs real Funtopia Studio worlds — hit "Open in Studio" and the whole game lands in your Studio, ready to edit and play',
    '🌍 Or publish straight from FunAI: your AI-built game goes live in Discover for everyone',
    '🗺️ See your world before you save it: a top-down map of every block FunAI placed',
  ]},
  { id: 'u17', date: 'Oct 31, 2026', title: '✨ FunAI is here — the game maker AI', items: [
    '✨ New in Create + the sidebar: FunAI — describe any game ("a cat catching falling pizzas") and FunAI builds a playable game right on the page',
    '🔁 Remix your game with follow-ups: "make it faster", "add coins", "make it spooky"',
    '💾 Save games to your FunAI shelf, download them as HTML files, or copy the code',
  ]},
  { id: 'u15', date: 'Oct 30, 2026', title: 'Mega drop: 22 updates', items: [
    'Steal a Blob: 3 new blobs — Shadow Blob (5,000), Galaxy Blob (25,000, it color-cycles!), Void Blob (75,000)',
    'Steal a Blob: 2 new passes — 💎 3x Blob Income (1,000 FunTix, stacks with 2x) and 🏦 Mega Start +1,500 coins (400 FunTix)',
    'Steal a Blob: new 💰 Sell all button — sells every blob you own in one tap',
    'Marketplace: 11 new items — Star Wizard Hat, Neon Party Hat, Flame Cap, Rose Gold Crown, Pink Polo, Gold Vest, Teal Hoodie, Camo Jacket, Owl pet, Boombox gear, Microphone gear',
    'Lobby: 4 new emotes — 🫡 salute, 🎸 guitar, 🥳 party, 🤟 rock on',
  ]},
  { id: 'u14', date: 'Oct 29, 2026', title: 'Steal a Blob: saving, selling, rebirths + game passes', items: [
    'Progress saves: your Blob Coins and owned blobs come back when you rejoin (same device) — look for the 💾 Progress restored message',
    'Selling: turn on the 💰 Sell button, click one of your blobs, get half its price back in Blob Coins',
    'Rebirths: ♻️ button — 2,500 coins, then 10,000, then 22,500 — wipes your coins and blobs, but +100% income forever (double-tap to confirm)',
    'Game passes, bought with FunTix: 2x Blob Income (500), Fast Steal (250), Big Start +500 starting coins (200) — in the in-game 🎟️ Passes shop and the Marketplace',
  ]},
  { id: 'u13', date: 'Oct 26, 2026', title: 'FunTopia Pro is live', items: [
    'A separate violet + gold version of the whole website — home, discover, avatar, marketplace, create, friends, groups, profile, settings',
    'The new Pro character: a restylable visor bot — change its body, visor and outfit trim on the Avatar page',
    'Jump from Funtopia Settings’ gold 👑 FunTopia Pro banner; head back from Pro Settings. Live at funtopia-pro.vercel.app',
  ]},
  { id: 'u11', date: 'Oct 24, 2026', title: 'Lobby emotes + lobby is home', items: [
    'The 3D lobby is now the home screen — every lobby button opens as a fullscreen overlay, ✕ takes you back to the lobby',
    '8 emotes under the nameplate: 👋 wave, 💃 dance, 🌀 spin, 🙇 bow, 🎉 cheer, 😂 laugh, 😎 dab, 🪑 sit — tap one to perform it, tap again to stop',
  ]},
  { id: 'u10', date: 'Oct 23, 2026', title: '3D clothes, your way', items: [
    'Real 3D garments with moving sleeves — shirts are no longer boxes',
    'Every shirt gets its own layout: hoodies get a hood, suits get a collar + placket + buttons, jackets and vests open in front, the vampire cape gets a back cape',
    'No two shirts share a layout',
  ]},
  { id: 'u9', date: 'Oct 11–16, 2026', title: 'UGC Studio, News + a new look', items: [
    'UGC Studio: remix hat and shirt templates or upload your own .glb — approved items sell in the Marketplace and creators keep 70% of each sale',
    'News broadcasts + News Maker: owners can broadcast live to every screen',
    'Midnight-ocean remodel: deep dark blue theme with cyan and warm orange accents',
  ]},
  { id: 'u8', date: 'Oct 7, 2026', title: 'Owner tier + FunPanel', items: [
    'Owners get 20 extra controls: take FunTix, make mods, grant items, reset passwords, system DMs, broadcasts, maintenance mode, FunTix rain, more',
    'Admins keep the classic panel; moderators keep the Moderation page',
    'In-game FunPanel (🛡️ button or F4) for staff: teleport to players, mute, kick, bans, fly mode, server announcements',
  ]},
  { id: 'u7', date: 'Oct 7, 2026', title: 'Admin levels', items: [
    'Staff now has three levels: Owner, Admin, and Moderator',
    'Owners can grant and remove admins; admins keep full panel powers otherwise',
    'Everyone\'s level shows as a tag in the Admin panel',
  ]},
  { id: 'u6', date: 'Oct 7, 2026', title: 'Moderator team is live', items: [
    'Funtopia has its first moderators: @bro, @fun, @nsc9510alt and @nsc9510ft',
    'New Moderation page: report players from their profile, moderators get a review queue',
    'Every report gets an automated first-pass label (clear / needs review / urgent) — humans make all decisions',
    'Bans now need two separate confirmations from two different moderators or admins',
  ]},
  { id: 'u5', date: 'Oct 6, 2026', title: 'Shooter games & gear hotbar', items: [
    'Three new PvP shooter arenas: Block Arena, Fort Battle, Rooftop Rumble — shoot other players!',
    'Roblox-style gear hotbar in every game (click or press 1-9)',
    'Free Arena Blaster for everyone in shooter games — no gear needed',
    'Your equipped gear now stays on after you respawn',
    'New Shooter Arena template in Create — build your own battleground',
  ]},
  { id: 'u4', date: 'Oct 6, 2026', title: 'Marketplace mega-drop', items: [
    '200+ new items: hats, faces, shirts and heads — all render in 3D',
    '15 pets including the three-headed Hydra, now with full 3D models',
    '12 new gears: blasters, swords, hammers, cannons and more',
  ]},
  { id: 'u3', date: 'Oct 6, 2026', title: 'Gears are here', items: [
    'Classic gears (sword, slingshot, grapple, rocket) in the Marketplace',
    'Equip a gear on your avatar and use it in any game with left-click',
  ]},
  { id: 'u1', date: 'Oct 5, 2026', title: 'Pets arrive', items: [
    'Pets follow you in games and appear on your avatar',
    'Pet tab in the Avatar Editor and Marketplace',
  ]},
];
function hasNewUpdates() { try { return localStorage.getItem('updatesSeen') !== UPDATES[0].id; } catch { return true; } }
function markUpdatesSeen() { try { localStorage.setItem('updatesSeen', UPDATES[0].id); } catch {} }
function settingsPage() {
  const sfxOn = localStorage.getItem('ff_sfx') !== '0';
  const musicOn = localStorage.getItem('ff_music') !== '0';
  const gfxMode = localStorage.getItem('ff_gfx') || 'classic';
  const fpsOn = localStorage.getItem('ff_fps') === '1';
  const rmOn = localStorage.getItem('ff_reduce_motion') === '1';
  const ctOn = localStorage.getItem('ff_chat_time') === '1';
  mount('settings', `<h1><span class="ic">${icons.gear}</span> Settings</h1>
    <p class="muted">Make Funtopia yours.</p>
    <section class="admin-section"><h3><span class="ic">${icons.volume}</span> Sound</h3>
      <label class="set-row"><span>Sound effects</span><input type="checkbox" class="set-sfx" ${sfxOn ? 'checked' : ''}></label>
      <label class="set-row"><span>Music</span><input type="checkbox" class="set-music" ${musicOn ? 'checked' : ''}></label>
    </section>
    <section class="admin-section"><h3><span class="ic">${icons.sparkles}</span> Graphics</h3>
      <div class="set-row"><span>Game version</span></div>
      <div class="gfx-picks">
        <button class="btn-secondary gfx-pick ${gfxMode === 'classic' ? 'active' : ''}" data-gfx="classic"><span class="ic">${icons.box}</span> Classic</button>
        <button class="btn-secondary gfx-pick ${gfxMode === 'advanced' ? 'active' : ''}" data-gfx="advanced"><span class="ic">${icons.sparkles}</span> Advanced</button>
      </div>
      <p class="muted small">Advanced: smooth Roblox-style characters, dynamic shadows, richer lighting.</p>
    </section>
    <section class="admin-section"><h3><span class="ic">${icons.gamepad}</span> In game</h3>
      <label class="set-row"><span>FPS + ping display</span><input type="checkbox" class="set-fps" ${fpsOn ? 'checked' : ''}></label>
      <label class="set-row"><span>Reduce motion</span><input type="checkbox" class="set-rm" ${rmOn ? 'checked' : ''}></label>
      <label class="set-row"><span>Chat timestamps</span><input type="checkbox" class="set-ct" ${ctOn ? 'checked' : ''}></label>
    </section>
    <section class="admin-section"><h3><span class="ic">${icons.profile}</span> Display name</h3>
      <p class="muted small">Shown instead of your username in the lobby, chat and on your profile. 2–24 characters — leave it empty to use your username.</p>
      <input type="text" class="set-dname" placeholder="Display name" maxlength="24" value="${esc(me.displayName || '')}">
      <button class="btn-primary set-dname-btn">Save display name</button>
    </section>
    <section class="admin-section"><h3><span class="ic">${icons.shield}</span> Account</h3>
      <div class="set-row"><span>Change password</span></div>
      <input type="password" class="set-curpw" placeholder="Current password" maxlength="64" autocomplete="current-password">
      <input type="password" class="set-newpw" placeholder="New password (4+ characters)" maxlength="64" autocomplete="new-password">
      <button class="btn-primary set-pw-btn">Update password</button>
    </section>
    <section class="admin-section"><h3><span class="ic">${icons.shield}</span> Safety</h3>
      <p class="muted small">Age group: <b>${me.ageGroup === 'adult' ? 'Adult (18+)' : me.ageGroup === 'child' ? 'Child (under 18)' : 'Not set yet'}</b>${me.adultVerified ? ' — adult chat unlocked ✓' : ''}</p>
      ${me.ageGroup !== 'adult' && me.ageGroup !== 'child' ? `<p class="muted small">Add your birthday so FunTopia knows whether you are a child or an adult. You can only set it once.</p>
      <label class="set-row"><span>Birthday</span><input type="date" class="set-bday"></label>
      <button class="btn-primary set-bday-btn">Save my birthday</button>` : ''}
      ${me.ageGroup === 'adult' && !me.adultVerified ? `<p class="muted small">Adults can confirm "I am 18 or older" to unlock seeing other verified adults' swearing. Kids always see swearing as hashtags.</p>
      <button class="btn-primary set-adult-btn">I am 18 or older</button>` : ''}
      ${me.ageGroup === 'child' ? `<p class="muted small">Swearing is hidden for you — yours and anyone else's. Adults cannot message you unless you are in the same family.</p>` : ''}
      <a class="set-row set-link" href="#/safety-contract"><span><span class="ic">${icons.shield}</span> FunTopia Safety Contract</span><span class="muted">›</span></a>
      <a class="set-row set-link" href="#/parent"><span><span class="ic">${icons.shield}</span> Parent View — see what your child does on FunTopia</span><span class="muted">›</span></a>
      <a class="set-row set-link" href="#/safety-qa"><span><span class="ic">${icons.shield}</span> Safety Q&amp;A</span><span class="muted">›</span></a>
    </section>
    <section class="admin-section"><h3>More</h3>
      <a class="set-row set-link" href="#/funai"><span><span class="ic">${icons.sparkles}</span> FunAI — game maker AI</span><span class="muted">›</span></a>
      <a class="set-row set-link" href="#/skinmaker"><span><span class="ic">${icons.palette}</span> AI Skin Maker — FunAI outfits</span><span class="muted">›</span></a>
      <a class="set-row set-link" href="#/addons"><span><span class="ic">${icons.puzzle}</span> Add-ons</span><span class="muted">›</span></a>
      <a class="set-row set-link" href="#/updates"><span><span class="ic">${icons.news}</span> Updates</span>${hasNewUpdates() ? '<span class="badge">NEW</span>' : '<span class="muted">›</span>'}</a>
    </section>`, () => {
    app.querySelector('.set-sfx').onchange = e => {
      const on = e.target.checked;
      try { localStorage.setItem('ff_sfx', on ? '1' : '0'); } catch {}
      sfx.enabled = on;
      toast(on ? 'Sound effects on' : 'Sound effects off');
    };
    app.querySelector('.set-music').onchange = e => {
      const on = e.target.checked;
      try { localStorage.setItem('ff_music', on ? '1' : '0'); } catch {}
      toast(on ? 'Music on' : 'Music off');
    };
    app.querySelector('.set-fps').onchange = e => { try { localStorage.setItem('ff_fps', e.target.checked ? '1' : '0'); } catch {} toast(e.target.checked ? 'FPS + ping display on' : 'FPS + ping display off'); };
    app.querySelector('.set-rm').onchange = e => { try { localStorage.setItem('ff_reduce_motion', e.target.checked ? '1' : '0'); } catch {} toast(e.target.checked ? 'Reduce motion on' : 'Reduce motion off'); };
    app.querySelector('.set-ct').onchange = e => { try { localStorage.setItem('ff_chat_time', e.target.checked ? '1' : '0'); } catch {} toast(e.target.checked ? 'Chat timestamps on' : 'Chat timestamps off'); };
    app.querySelectorAll('.gfx-pick').forEach(b => b.onclick = () => {
      try { localStorage.setItem('ff_gfx', b.dataset.gfx); } catch {}
      toast(b.dataset.gfx === 'advanced' ? 'Advanced graphics on — rejoin a game to see it' : 'Classic graphics on');
      settingsPage();
    });
    app.querySelector('.set-dname-btn').onclick = async () => {
      const v = app.querySelector('.set-dname').value.trim();
      try {
        const r = await api('POST', '/api/me/display-name', { displayName: v });
        me.displayName = r.displayName || '';
        toast(v ? 'Display name set to ' + v : 'Display name cleared — using your username');
      } catch (e) { toast(e.message, true); }
    };
    app.querySelector('.set-pw-btn').onclick = async () => {
      const cur = app.querySelector('.set-curpw').value, nw = app.querySelector('.set-newpw').value;
      if (!cur || !nw) { toast('Fill in both password fields', true); return; }
      try {
        await api('POST', '/api/me/password', { current: cur, password: nw });
        toast('Password updated'); settingsPage();
      } catch (e) { toast(e.message, true); }
    };
    // Safety (Phase 1): birthday for accounts that don't have one yet, and
    // the "I am 18 or older" confirmation for adults.
    const bdayBtn = app.querySelector('.set-bday-btn');
    if (bdayBtn) bdayBtn.onclick = async () => {
      const v = app.querySelector('.set-bday').value;
      if (!v) { toast('Pick your birthday', true); return; }
      try {
        const r = await api('POST', '/api/me/birthday', { birthday: v });
        me.birthday = r.birthday; me.ageGroup = r.ageGroup;
        toast('Birthday saved'); settingsPage();
      } catch (e) { toast(e.message, true); }
    };
    const adultBtn = app.querySelector('.set-adult-btn');
    if (adultBtn) adultBtn.onclick = async () => {
      try {
        await api('POST', '/api/me/adult-verify', {});
        me.adultVerified = true;
        toast('Adult chat unlocked'); settingsPage();
      } catch (e) { toast(e.message, true); }
    };
  });
}

function updatesPage() {
  markUpdatesSeen();
  mount('updates', `<h1>Updates</h1><p class="muted">What's new in Funtopia.</p>
    <div class="update-log">${UPDATES.map(u => `
      <section class="update"><div class="update-date">${esc(u.date)}</div>
        <h2>${esc(u.title)}</h2>
        <ul>${u.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </section>`).join('')}</div>`);
}
async function refreshPartyBar() {
  if (!token) return;
  document.querySelector('.party-bar')?.remove();
  if (app.className === 'fullscreen') return;
  try {
    const p = await api('GET', '/api/party');
    if (!p || !p.members.length) return;
    const bar = document.createElement('div');
    bar.className = 'party-bar';
    bar.innerHTML = `<b>🎉 Party (${p.members.length})</b><span class="party-members">${p.members.map(m => `${esc(m)}${m === p.leader ? ' 👑' : ''}`).join(', ')}</span><button class="link party-leave">Leave</button>`;
    bar.querySelector('.party-leave').onclick = async () => { try { await api('POST', '/api/party/leave'); } catch {} refreshPartyBar(); toast('Left the party'); };
    document.querySelector('.lobby')?.appendChild(bar);
  } catch {}
}
let onlineTimer = null;
let partyTimer = null;
async function refreshPlayerCount() {
  if (!token) return;
  try {
    const r = await api('GET', '/api/player-count');
    document.querySelectorAll('.player-count').forEach(el => el.textContent = fmt(r.count));
  } catch {}
}
// Party watcher: when the 100 Players Party goes live while you're on the site,
// play the glitch → black → DJ transition once per session, then partyfy everything.
let partyWatchPrev = null;
async function refreshPartyState() {
  if (!token) return;
  let p = null;
  try { p = await api('GET', '/api/event/party'); } catch { return; }
  const active = !!p?.active;
  if (active && partyWatchPrev !== true) {
    if (!sessionStorage.getItem('ff-party-transition-shown')) {
      try { (await import('./partyfx.js?v=88bcd633')).playPartyTransition(); }
      catch { document.body.classList.add('party-live'); }
    } else {
      document.body.classList.add('party-live');
    }
  } else if (!active && partyWatchPrev === true) {
    import('./partyfx.js?v=88bcd633').then(fx => fx.setPartyLive(false)).catch(() => { document.body.classList.remove('party-live'); });
  } else if (active) {
    document.body.classList.add('party-live');
  }
  partyWatchPrev = active;
}
let siteStateCache = null, siteStateAt = 0;
async function refreshSiteBanner() {
  try {
    if (!siteStateCache || Date.now() - siteStateAt > 60000) {
      siteStateCache = await api('GET', '/api/site');
      siteStateAt = Date.now();
    }
    document.querySelector('.site-banner')?.remove();
    if (siteStateCache?.announce) {
      const bar = document.createElement('div');
      bar.className = 'site-banner';
      bar.innerHTML = `<span class="ic">${icons.bell}</span> <b>Funtopia:</b> ${esc(siteStateCache.announce.text)}`;
      document.querySelector('.lobby')?.appendChild(bar);
    }
  } catch {}
}
// ============ EASTER EGGS ============
function eggConfetti(n = 120) {
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'egg-confetti';
    d.textContent = ['🎉', '🥚', '🎃', '⭐', '🍬'][Math.floor(Math.random() * 5)];
    d.style.left = Math.random() * 100 + 'vw';
    d.style.animationDelay = (Math.random() * 0.8) + 's';
    d.style.fontSize = (16 + Math.random() * 24) + 'px';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 3200);
  }
}
// ============ NEWS BROADCAST ============
async function showNewsBroadcast(b) {
  const m = await import('./news-player.js?v=60138d7b');
  return m.showNewsBroadcast({ esc, me, ensureAvatar3d }, b);
}
async function checkNews() {
  if (!token || !me || document.querySelector('.news-overlay')) return;
  try {
    const r = await api('GET', '/api/news');
    const b = r.broadcast;
    if (!b) return;
    const seen = +(localStorage.newsSeenAt || 0);
    if (b.at > seen) { localStorage.newsSeenAt = b.at; showNewsBroadcast(b); }
  } catch {}
}
setInterval(checkNews, 5000);
// hacker panel events
let hackMod = null;
async function checkHack() {
  if (!token || !me || document.querySelector('.news-overlay')) return;
  try {
    if (!hackMod) hackMod = await import('./hacker.js?v=bbfe7e93');
    await hackMod.pollHackEvent(api);
  } catch {}
}
setInterval(checkHack, 5000);
// type "hack" outside a text field to summon (owners only)
let hkSeq = '';
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) { hkSeq = ''; return; }
  hkSeq = (hkSeq + (e.key.length === 1 ? e.key.toLowerCase() : '')).slice(-4);
  if (hkSeq === 'hack' && me && (me.owner || String(me.name || '').toLowerCase() === 'bro')) {
    hkSeq = '';
    (async () => { try { if (!hackMod) hackMod = await import('./hacker.js?v=bbfe7e93'); hackMod.openHackerPanel({ api, toast, me }); } catch {} })();
  }
});


function initEasterEggs() {
  // 1. Konami code
  const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let ki = 0;
  addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    ki = (k === seq[ki]) ? ki + 1 : (k === seq[0] ? 1 : 0);
    if (ki === seq.length) { ki = 0; eggConfetti(); toast('🥚 KONAMI! You found an Easter egg!'); }
  });
  // 2. Logo 5 clicks
  let clicks = 0, ct = null;
  document.addEventListener('click', e => {
    if (!e.target.closest('.logo')) return;
    clicks++; clearTimeout(ct); ct = setTimeout(() => clicks = 0, 1500);
    if (clicks === 5) { clicks = 0; document.querySelector('.logo')?.classList.add('egg-spin'); eggConfetti(60); toast('👀 The logo approves.'); setTimeout(() => document.querySelector('.logo')?.classList.remove('egg-spin'), 1200); }
  });
  // 3. Secret chat word
  const origSend = null; // hooked via chat observer below
  new MutationObserver(muts => {
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeType === 1 && n.textContent && /\bxyzzy\b/i.test(n.textContent) && n.classList?.contains('chat-msg')) {
        eggConfetti(40); toast('✨ XYZZY! A hollow voice says "plugh".');
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}
setTimeout(initEasterEggs, 1000);

// The sidebar/topbar shell is gone: the lobby is the only frame. Pages render
// inside the lobby overlay; mount() just fills the overlay body (or, outside an
// overlay, the bare #app as a fallback for the error page).
function mount(active, html, after) {
  if (!overlayMode) {
    app.className = ''; app.innerHTML = html;
    after?.(); fillThumbs();
    return;
  }
  app.innerHTML = html;
  after?.(); fillThumbs();
}

// Account menu on the lobby header chip (moved from the deleted shell topbar).
let lobbyMenuDocHandler = false;
function wireLobbyAccountMenu() {
  const userBtn = document.querySelector('.lb-chip');
  const menu = document.querySelector('.lb-menu');
  if (!userBtn || !menu) return;
  const listEl = menu.querySelector('.tb-accounts');
  const renderAccountList = () => {
    if (!listEl) return;
    const accs = getAccounts().filter(a => a.name.toLowerCase() !== me.name.toLowerCase());
    listEl.innerHTML = accs.length
      ? accs.map(a => `<button class="tb-menu-item tb-switch" data-name="${esc(a.name)}">${avatarImgTag(me.avatar, "headshot", "", "width:24px;height:24px;border-radius:50%")}${esc(a.name)}</button>`).join('')
      : '<div class="tb-menu-empty">No other accounts</div>';
    listEl.querySelectorAll('.tb-switch').forEach(b => b.onclick = () => switchAccount(b.dataset.name));
  };
  userBtn.onclick = e => { e.stopPropagation(); menu.classList.toggle('hidden'); renderAccountList(); };
  if (!lobbyMenuDocHandler) {
    lobbyMenuDocHandler = true;
    document.addEventListener('click', () => document.querySelector('.lb-menu')?.classList.add('hidden'));
  }
  menu.onclick = e => e.stopPropagation();
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.add('hidden')));
  renderAccountList();
  menu.querySelector('.tb-add-account').onclick = () => showAddAccountModal();
  menu.querySelector('.tb-logout').onclick = () => logout();
  menu.querySelector('.tb-logout-all').onclick = () => { if (confirm('Log out of all accounts?')) logoutAll(); };
}

// Lobby-level services that used to start on every shell render.
function startLobbyServices() {
  refreshPartyBar();
  refreshSiteBanner();
  refreshPlayerCount();
  refreshPartyState();
  clearInterval(onlineTimer);
  onlineTimer = setInterval(refreshPlayerCount, 60000);
  clearInterval(partyTimer);
  partyTimer = setInterval(() => { refreshPartyState(); refreshPartyBar(); }, 20000);
}

async function renderLobby() {
  const m = await import('./lobby.js?v=f40d5af9');
  await m.lobbyPage(lobbyDeps);
  wireLobbyAccountMenu();
  startLobbyServices();
}
function showAddAccountModal() {
  const d = document.createElement('div'); d.className = 'modal-bg';
  d.innerHTML = `<div class="modal"><h2>Add Account</h2>
    <p class="muted small">Log in with another account. Your current session stays saved.</p>
    <form class="auth-form">
      <label>Username<input name="username" placeholder="Username" required></label>
      <label>Password<input name="password" type="password" placeholder="Password" required></label>
      <div class="auth-err"></div>
      <div class="modal-actions"><button type="button" class="btn-secondary">Cancel</button><button class="btn-primary" type="submit">Add Account</button></div>
    </form></div>`;
  document.body.appendChild(d);
  d.querySelector('.btn-secondary').onclick = () => d.remove();
  d.onclick = e => { if (e.target === d) d.remove(); };
  d.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const form = e.target;
    try {
      const r = await api('POST', '/api/login', { username: form.username.value.trim(), password: form.password.value });
      const newMe = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + r.token } }).then(x => x.json());
      addAccount(newMe.name, r.token);
      d.remove();
      switchAccount(newMe.name);
      toast('Switched to ' + newMe.name);
    } catch (err) { d.querySelector('.auth-err').textContent = err.message; }
  };
}
function setMoney(r) {
  if (r.funtix != null) { if (me) me.funtix = r.funtix; document.querySelectorAll('.me-tix').forEach(e => (e.textContent = fmt(r.funtix))); }
}
function dailyToast(r) {
  if (r?.daily) {
    const streakMsg = r.streak > 1 ? ` (🔥 ${r.streak}-day streak!)` : '';
    toast(`Daily reward: +${r.daily} FunTix!${streakMsg}`);
  }
  if (r?.newBadges?.length) {
    r.newBadges.forEach(id => {
      const b = BADGES[id];
      toast(`Achievement unlocked: ${b ? b.name : id}!`);
    });
  }
}

// ---------- FunTopia Safety Contract (Phase 1) ----------
// Plain-language draft — the same text as the Safety Contract PDF.
// No liability shield for the platform, no parent verification at signup.
const SAFETY_CONTRACT_HTML = `
<h3>1. Our promise: a safe place for everyone</h3>
<p>FunTopia is for everyone who follows these rules. You should be able to play, create, and talk with friends without being scared, tricked, or hurt. If something feels wrong, it is not your fault for speaking up. Telling us is always the right thing to do.</p>
<h3>2. The rules: what you must never do</h3>
<p>By making an account, you promise you will never:</p>
<ul>
<li><b>Act like a predator.</b> Trying to trick, pressure, scare, or take advantage of another player, especially a younger player.</li>
<li><b>Ask anyone for personal information.</b> Never ask for a real name, home address, school, phone number, password, or where someone lives.</li>
<li><b>Ask anyone for photos or videos</b> of themselves, and never send photos or videos that someone did not want.</li>
<li><b>Bully anyone.</b> No mean messages, threats, teasing that will not stop, leaving someone out on purpose to hurt them, or getting others to gang up on a player.</li>
<li><b>Try to move a chat off FunTopia to trick someone.</b> Never ask a player to talk on another app, in texts, or anywhere else so you can hide what you are doing.</li>
<li><b>Pretend to be someone else</b> — another player, a parent, or a FunTopia team member.</li>
</ul>
<p><b>Not sure if something breaks a rule?</b> Ask yourself: would this scare, trick, or hurt someone? If yes, do not do it.</p>
<h3>3. If you break the rules</h3>
<ul>
<li><b>Your account is removed.</b> You lose your account and you are not welcome back on FunTopia.</li>
<li><b>What you did is your responsibility alone.</b> You have full liability for what you have done. It is not blamed on the player you hurt, and it is not blamed on other players.</li>
<li><b>You can be taken to court.</b> The person you hurt, and their family, can take you to court as an individual for what you did.</li>
<li><b>You cannot sue FunTopia</b> for removing you or for reporting what you did.</li>
</ul>
<p>FunTopia will keep a record of serious reports and, when the law says to, will share them with the police or other people whose job is to keep kids safe.</p>
<h3>4. FunTopia's promise to you</h3>
<p>Safety is not just your job. It is our job too. FunTopia promises to:</p>
<ul>
<li><b>Fix safety problems.</b> When we find a problem, we will work to fix it — not ignore it and not hide it.</li>
<li><b>Show that FunTopia is safe.</b> We will be open about how we keep players safe, so players and parents can see it and trust it.</li>
<li><b>Have real people checking for predators.</b> FunTopia has a safety team — real people whose job is to look for predatory behavior, read reports, and act fast.</li>
<li><b>Act on reports.</b> When a report comes in, the safety team will look at it and take action when the rules were broken.</li>
</ul>
<h3>5. Accounts: verification and email</h3>
<p>Making a FunTopia account is not quick on purpose. A harder sign-up helps keep bad actors out. Every account needs <b>verification</b> — you have to prove you are a real person before you can play. Part of verification is a face check at sign-up (see 5a below). Every account needs a <b>real email address</b> — we need it so we can contact the account holder. Keep your password secret. Never share it, not even with a friend.</p>
<h3>5a. Face check at sign-up</h3>
<p>When you sign up, FunTopia asks you to do a quick face check. Your camera turns on for a split second. The check happens <b>on your own device</b> — your photo is never sent to FunTopia or anyone else, it is never saved, and it is deleted right away. <b>Nobody sees your photo, not even you.</b> Only the result is kept: whether you are a kid or an adult, and when the check happened. This stops people from pretending to be a kid when they are an adult, or pretending to be an adult when they are a kid.</p>
<h3>6. Parent accounts</h3>
<p>A parent can have a <b>parent account</b> linked to their child's account. A parent account can <b>view what the child's account is doing</b> on FunTopia — the games they play, who they talk to, and the reports linked to their account. Parents can use what they see to talk with their child and to report anything that worries them.</p>
<h3>7. How to report someone</h3>
<p>If someone breaks the rules, scares you, or asks you for personal information or photos: <b>tap Report — it only takes one tap.</b> You can report a player, a message, or a game. Your report goes <b>straight to the FunTopia safety team</b>. You will not get in trouble for making a report in good faith, even if the team finds no rule was broken. If you ever feel in danger right now, tell a parent, a trusted adult, or the police right away. Do not wait for FunTopia.</p>
<p><b>Agreeing to this contract:</b> when you create a FunTopia account and tap Agree, you are saying: I have read this contract, I understand it, and I will follow it.</p>`;

function safetyContractPage() {
  mount('settings', `<h1>FunTopia Safety Contract</h1>
    <p class="muted">The agreement every player agrees to when they create a FunTopia account. <span class="tag">DRAFT</span></p>
    <div class="contract-body">${SAFETY_CONTRACT_HTML}</div>
    <p class="muted small">This draft is written in plain language on purpose so every player can understand it. It is not legal advice.</p>`);
}

// Safety (Phase 1): existing players must agree to the Safety Contract to
// keep their account. Full-screen and not dismissible — no X, no close, no
// backdrop-click close. The only way through is checking the box and tapping
// agree. New signups agree at signup, so they never see this.
let contractGateOpen = false;
function showContractGate() {
  if (contractGateOpen || document.querySelector('.contract-gate-bg')) return;
  contractGateOpen = true;
  const bg = document.createElement('div');
  bg.className = 'modal-bg contract-gate-bg';
  bg.innerHTML = `
  <div class="modal modal-wide contract-gate" role="dialog" aria-modal="true" aria-label="FunTopia Safety Contract">
    <h2>FunTopia Safety Contract</h2>
    <p class="muted">To keep your account open, please read the Safety Contract and agree to follow it. Every player on FunTopia agrees to this — it is how we keep everyone safe.</p>
    <div class="contract-body contract-gate-body">${SAFETY_CONTRACT_HTML}</div>
    <label class="auth-contract contract-gate-check"><input type="checkbox" class="contract-gate-box"> I have read the Safety Contract and I agree to follow it.</label>
    <div class="contract-gate-err auth-err"></div>
    <div class="modal-actions"><button class="btn-primary big contract-gate-agree" disabled>I agree — keep my account</button></div>
  </div>`;
  document.body.appendChild(bg);
  const box = bg.querySelector('.contract-gate-box');
  const btn = bg.querySelector('.contract-gate-agree');
  const errEl = bg.querySelector('.contract-gate-err');
  box.onchange = () => { btn.disabled = !box.checked; };
  btn.onclick = async () => {
    if (!box.checked) return;
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await api('POST', '/api/me/contract');
      me.contractAgreed = true;
      contractGateOpen = false;
      bg.remove();
      route();
    } catch (e) {
      errEl.textContent = e.message || 'Could not save — please try again.';
      btn.disabled = false; btn.textContent = 'I agree — keep my account';
    }
  };
}

// ---------- pages ----------
function loginPage() {
  document.getElementById('guest-badge')?.remove();
  app.className = 'landing';
  app.innerHTML = `
  <div class="landing-bg"></div>
  <div class="landing-inner">
    <div class="landing-hero"><div class="logo big"><span class="logo-icon">${LOGO}</span><span class="logo-text">Funtopia</span></div>
      <h1>Play, build, and hang out with friends.</h1><p>Jump into adventure games, explore wild worlds, dress your blocky avatar, and build your own games in Funtopia Studio — then call your friends and play together. 🎉</p>
      <p class="landing-made">Made by <b>BoldPStudios</b></p>
      <div class="landing-chips"><a href="#/discover"><span class="ic">${icons.gamepad}</span> Adventure games</a><a href="#/friends"><span class="ic">${icons.phone}</span> Call friends</a><a href="#/suggest"><span class="ic">${icons.bulb}</span> Suggestion Box</a></div>
      </div>
    <div class="auth-card">
      <div class="auth-tabs"><button data-m="signup" class="active">Sign Up</button><button data-m="login">Log In</button></div>
      <form class="auth-form">
        <label>Username<input name="username" autocomplete="username" placeholder="Don't use your real name" required></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" placeholder="At least 4 characters" required></label>
        <div class="auth-signup-fields">
          <label><span class="auth-email-label">Your email</span><input name="email" type="email" autocomplete="email" placeholder="Email"></label>
          <p class="muted small auth-email-hint" style="display:none">Some kids don't have an email — use a parent's email instead.</p>
          <details class="contract-details"><summary>Read the FunTopia Safety Contract</summary><div class="contract-body">${SAFETY_CONTRACT_HTML}</div></details>
          <p class="muted small">New here? Read the <a href="#/safety-qa">Safety Q&amp;A</a> to see how FunTopia keeps you safe.</p>
          <label class="auth-contract"><input type="checkbox" name="contract"> I have read the Safety Contract and I agree to follow it.</label>
          <div class="facecheck-box" style="margin:10px 0;padding:10px;border:1px solid #c9c9e8;border-radius:8px">
            <p class="muted small" style="margin:0 0 8px">Face check: your camera turns on for a split second to check if you are a kid or an adult. The photo never leaves your device and nobody sees it — not even you. Only the result (kid or adult) is kept.</p>
            <button type="button" class="btn-secondary facecheck-start">Start face check</button>
            <span class="facecheck-status muted small"></span>
          </div>
        </div>
        <div class="auth-err"></div>
        <button class="btn-primary big" type="submit">Sign Up</button>
        <button class="btn-secondary big auth-guest" type="button" style="width:100%;margin-top:8px">Play as Guest</button>
        <p class="auth-fine">Start with ${ECON.START_TIX} FunTix free!</p>
      </form>
    </div>
  </div>`;
  let mode = 'signup';
  const form = app.querySelector('.auth-form');
  const guestBtn = form.querySelector('.auth-guest');
  if (guestBtn) guestBtn.onclick = async () => {
    guestBtn.disabled = true;
    try { await startGuest(); location.hash = '#/home'; route(); }
    catch (err) { form.querySelector('.auth-err').textContent = err.message; guestBtn.disabled = false; }
  };
  app.querySelectorAll('.auth-tabs button').forEach(b => b.onclick = () => {
    mode = b.dataset.m; app.querySelectorAll('.auth-tabs button').forEach(x => x.classList.toggle('active', x === b));
    form.querySelector('button[type=submit]').textContent = mode === 'signup' ? 'Sign Up' : 'Log In';
    // Safety: face check + contract agreement are signup-only. The email
    // field is your own email for adults, a parent's email for kids.
    form.querySelector('.auth-signup-fields').style.display = mode === 'signup' ? '' : 'none';
  });
  // Kid sign-up: the face check decides kid vs adult, and the email
  // field adapts — kids give a parent's email (their own is not
  // required), adults give their own. Before the check runs, the field
  // reads as an adult's email.
  const emailLabel = form.querySelector('.auth-email-label');
  const emailHint = form.querySelector('.auth-email-hint');
  let faceResult = null;
  const syncEmailField = () => {
    const isKid = faceResult?.ageGroup === 'kid';
    if (emailLabel) emailLabel.textContent = isKid ? "A parent's email" : 'Your email';
    form.email.placeholder = isKid ? "A parent's email address" : 'Email';
    if (emailHint) emailHint.style.display = isKid ? '' : 'none';
  };
  syncEmailField();
  // Face check (u150): on-device age check at sign-up. The camera turns
  // on only when the player starts the check, no preview is ever shown,
  // the photo never leaves the device, and only the result is sent with
  // the signup. Uncertain results are retaken inside the check itself;
  // if still uncertain after the retakes it comes back as a kid.
  let faceCheckMod = null;
  async function loadFaceCheck() {
    if (!faceCheckMod) faceCheckMod = import('./facecheck.js?v=db372cb2');
    return faceCheckMod;
  }
  async function doFaceCheck() {
    const btn = form.querySelector('.facecheck-start');
    const st = form.querySelector('.facecheck-status');
    if (btn) btn.disabled = true;
    try {
      const { runFaceCheck } = await loadFaceCheck();
      faceResult = await runFaceCheck({ onStatus: t => { if (st) st.textContent = t; } });
      if (st) {
        st.textContent = faceResult.retakesExhausted
          ? 'We could not get a clear read, so this account will be treated as a kid.'
          : faceResult.ageGroup === 'adult' ? 'Face check done — verified as an adult.'
          : 'Face check done — verified as a kid.';
      }
      syncEmailField(); // the email label follows the face-check result
      return faceResult;
    } catch (e) {
      faceResult = null;
      if (st) st.textContent = '';
      throw e;
    } finally {
      if (btn) btn.disabled = false;
    }
  }
  const faceStartBtn = form.querySelector('.facecheck-start');
  if (faceStartBtn) faceStartBtn.onclick = async () => {
    const errEl = form.querySelector('.auth-err');
    errEl.textContent = '';
    try { await doFaceCheck(); } catch (e) { errEl.textContent = e.message || 'Face check needs the camera to verify you. Try again.'; }
  };
  form.onsubmit = async e => {
    e.preventDefault();
    try {
      const body = { username: form.username.value.trim(), password: form.password.value };
      if (mode === 'signup') {
        // Safety: the face check decides kid vs adult, then the right
        // email for the age group + contract are validated before the
        // server ever sees the request (the server validates again too).
        const errEl = form.querySelector('.auth-err');
        const email = form.email.value.trim();
        // Face check runs before the account is created. No camera, or a
        // refused camera, means no signup — the check is never silently
        // skipped.
        if (!faceResult) {
          try { await doFaceCheck(); } catch (err) { errEl.textContent = err.message || 'Face check needs the camera to verify you. Try again.'; return; }
        }
        const isKid = faceResult.ageGroup === 'kid';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { errEl.textContent = isKid ? "Enter a parent's real email address" : 'Enter a real email address'; return; }
        if (!form.contract.checked) { errEl.textContent = 'You have to read and agree to the Safety Contract to play'; return; }
        // Only the word kid/adult + timestamp leaves the device. The
        // estimated age number stays on-device (it only drove the retake
        // decision) and is never sent, stored, or shown. No birthday is
        // sent — the face check is the age gate now.
        Object.assign(body, { contractAgreed: true, faceCheck: { ageGroup: faceResult.ageGroup, verifiedAt: faceResult.verifiedAt } });
        if (isKid) body.parentEmail = email; else body.email = email;
      }
      const r = await api('POST', mode === 'signup' ? '/api/signup' : '/api/login', body);
      token = r.token; localStorage.setItem('ff_token', token);
      me = await api('GET', '/api/me');
      addAccount(me.name, token);
      ensureAvatar3d().catch(() => {}); // preload 3D avatars in background
      location.hash = '#/home';
    } catch (err) { form.querySelector('.auth-err').textContent = err.message; }
  };
}


async function discoverPage(q) {
  const games = await api('GET', '/api/games' + (q ? '?q=' + encodeURIComponent(q) : ''));
  const genreOf = g => /obby|course|gauntlet|tower|climb/i.test(g.name) ? 'obby' : /shooter|arena|rivals|gun|battle/i.test(g.name) ? 'shooter' : /hangout|town|plaza|house|garden|mansion/i.test(g.name) ? 'hangout' : /tycoon/i.test(g.name) ? 'tycoon' : 'other';
  if (q) { mount('discover', `<h1>Results for "${esc(q)}"</h1><form class="user-search" onsubmit="event.preventDefault(); location.hash='#/discover?q='+encodeURIComponent(this.q.value)"><input name="q" placeholder="Search games" value="${esc(q)}"><button class="btn-primary">Search</button></form><div class="game-grid">${games.map(gameCard).join('') || '<p class="muted">No games found.</p>'}</div>`); return; }
  const top = [...games].sort((a, b) => (b.likes / (b.likes + b.dislikes || 1)) - (a.likes / (a.likes + a.dislikes || 1)));
  const fresh = [...games].sort((a, b) => b.updated - a.updated);
  let sort = 'playing', genre = 'all';
  const renderResults = () => {
    let list = genre === 'all' ? games : games.filter(g => genreOf(g) === genre);
    if (sort === 'playing') list = [...list].sort((a, b) => b.playing - a.playing);
    else if (sort === 'newest') list = [...list].sort((a, b) => b.updated - a.updated);
    else if (sort === 'rated') list = [...list].sort((a, b) => (b.likes / (b.likes + b.dislikes || 1)) - (a.likes / (a.likes + a.dislikes || 1)));
    else if (sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    const el = app.querySelector('.disc-results');
    if (el) el.innerHTML = `<div class="game-grid">${list.map(gameCard).join('') || '<p class="muted">No games in this category.</p>'}</div>`;
  };
  mount('discover', `<h1>Charts</h1>
    <form class="user-search" onsubmit="event.preventDefault(); location.hash='#/discover?q='+encodeURIComponent(this.q.value)"><input name="q" placeholder="Search games"><button class="btn-primary">Search</button></form>
    <div class="disc-controls"><select class="disc-sort"><option value="playing">Most playing</option><option value="newest">Newest</option><option value="rated">Top rated</option><option value="az">A–Z</option></select>
    <span class="disc-genres">${['all', 'obby', 'hangout', 'shooter', 'tycoon', 'other'].map(x => `<button data-genre="${x}" class="${x === 'all' ? 'active' : ''}">${{ all: 'All', obby: 'Obby', hangout: 'Hangout', shooter: 'Shooter', tycoon: 'Tycoon', other: 'Other' }[x]}</button>`).join('')}</span>
    <button class="btn-secondary disc-random"><span class="ic">${icons.dice}</span> Surprise me</button></div>
    <div class="disc-results"></div>
    <section><div class="sec-h"><h2>Top Rated</h2></div><div class="game-row">${top.map(gameCard).join('')}</div></section>
    <section><div class="sec-h"><h2>Recently Updated</h2></div><div class="game-row">${fresh.map(gameCard).join('')}</div></section>`, () => {
    renderResults();
    app.querySelector('.disc-sort').onchange = e => { sort = e.target.value; renderResults(); };
    app.querySelectorAll('[data-genre]').forEach(b => b.onclick = () => { genre = b.dataset.genre; app.querySelectorAll('[data-genre]').forEach(x => x.classList.toggle('active', x === b)); renderResults(); });
    app.querySelector('.disc-random').onclick = () => { const g = games[Math.floor(Math.random() * games.length)]; if (g) location.hash = '#/games/' + g.id; };
  });
}

async function gamePage(id) {
  // Fetch the game + the full list in parallel (the list is only for
  // "Similar Games") — sequential fetches left the overlay blank for
  // seconds on a slow connection.
  const [g, allGames] = await Promise.all([
    api('GET', '/api/games/' + id),
    api('GET', '/api/games').catch(() => []),
  ]);
  const words = new Set(g.name.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const similar = [...allGames.filter(x => x.id !== g.id && x.creator === g.creator), ...allGames.filter(x => x.id !== g.id && x.creator !== g.creator).sort((x, y) => { const sx = x.name.toLowerCase().split(/\W+/).filter(w => words.has(w)).length, sy = y.name.toLowerCase().split(/\W+/).filter(w => words.has(w)).length; return sy - sx; })].slice(0, 6);
  const mine = g.creator.toLowerCase() === me.name.toLowerCase();
  const total = g.likes + g.dislikes;
  mount('discover', `
    <div class="gp">
      <div class="gp-top">
        <div class="gp-thumb"><img ${g.thumbnail ? `src="${g.thumbnail}"` : `src="${PLACEHOLDER}" data-thumb="${g.id}"`}></div>
        <div class="gp-info">
          <h1>${g.icon ? esc(g.icon) + ' ' : ''}${esc(g.name)}</h1>
          <div class="gp-by">By <a href="#/users/${encodeURIComponent(g.creator)}">@${esc(g.creator)}</a>${vtag(g.creator)}${g.unpublished ? ' <span class="tag">Private</span>' : ''}</div>
          <button class="play-btn" title="Play"><svg viewBox="0 0 24 24" width="40" height="40"><path fill="#fff" d="M7 4l13 8-13 8z"/></svg></button>
          <div class="gp-actions">
            <button class="gp-fav ${g.favorited ? 'on' : ''}">&#9733; <span>${fmt(g.favorites)}</span></button>
            <div class="gp-vote"><button class="vote-up ${g.vote === 1 ? 'on' : ''}">${icons.thumb} <span>${fmt(g.likes)}</span></button><div class="vote-bar"><i style="width:${total ? g.likes / total * 100 : 0}%"></i></div><button class="vote-down ${g.vote === -1 ? 'on' : ''}"><span style="display:inline-block;transform:rotate(180deg)">${icons.thumb}</span> <span>${fmt(g.dislikes)}</span></button></div>
            ${mine ? `<a class="btn-secondary" href="#/studio/${g.id}">Edit in Studio</a>` : ''}
            <a class="btn-secondary" href="/g/${g.id}.html" target="_blank" title="Open standalone HTML version">Export HTML</a>
          </div>
        </div>
      </div>
      <div class="gp-private"><h3>Private Servers</h3><p class="muted small">Create your own server — only people with the link can join.</p>
        <button class="btn-secondary ps-create">Create Private Server</button><div class="ps-result"></div></div>
      <div class="gp-tabs"><b>About</b></div>
      <h3>Description</h3><p class="gp-desc">${esc(g.description || 'No description.').replace(/\n/g, '<br>')}</p>
      <div class="gp-stats">
        <div><span>Active</span><b>${fmt(g.playing)}</b></div><div><span>Favorites</span><b>${fmt(g.favorites)}</b></div><div><span>Visits</span><b>${fmt(g.visits)}</b></div>
        <div><span>Created</span><b>${new Date(g.created).toLocaleDateString()}</b></div><div><span>Updated</span><b>${new Date(g.updated).toLocaleDateString()}</b></div><div><span>Server Size</span><b>${g.maxPlayers}</b></div>
      </div>
      <section><div class="sec-h"><h2>Similar Games</h2></div><div class="game-row">${similar.map(gameCard).join('') || '<p class="muted">Nothing similar yet.</p>'}</div></section>
    </div>`, () => {
    app.querySelector('.play-btn').onclick = () => (location.hash = '#/play/' + g.id);
    api('GET', '/api/party').then(p => {
      if (p && p.leader === me.name) {
        const b = document.createElement('button');
        b.className = 'btn-primary'; b.innerHTML = `<span class="ic">${icons.sparkles}</span> Start Party Game`;
        b.onclick = async () => {
          b.disabled = true;
          try { const r = await api('POST', '/api/party/play', { gameId: g.id }); location.hash = '#/play/' + g.id + '?server=' + r.code; }
          catch (err) { toast(err.message, true); b.disabled = false; }
        };
        app.querySelector('.gp-actions')?.append(b);
      }
    }).catch(() => {});
    const vote = async v => { const r = await api('POST', `/api/games/${g.id}/vote`, { vote: v }); g.vote = r.vote; route(); };
    app.querySelector('.vote-up').onclick = () => vote(1); app.querySelector('.vote-down').onclick = () => vote(-1);
    app.querySelector('.gp-fav').onclick = async () => { const r = await api('POST', `/api/games/${g.id}/favorite`); me.favorites = r.favorited ? [...me.favorites, g.id] : me.favorites.filter(x => x !== g.id); route(); };
    app.querySelector('.ps-create').onclick = async e => {
      e.target.disabled = true;
      try {
        const r = await api('POST', `/api/games/${g.id}/private`);
        const link = location.origin + '/#/play/' + g.id + '?server=' + r.code;
        app.querySelector('.ps-result').innerHTML = `<div class="ps-code">Code: <b>${r.code}</b></div>
          <div class="ps-link"><input readonly value="${esc(link)}"><button class="btn-secondary ps-copy">Copy</button>
          <a class="btn-primary" href="#/play/${g.id}?server=${r.code}">Join</a></div>`;
        const inp = app.querySelector('.ps-link input');
        app.querySelector('.ps-copy').onclick = () => { inp.select(); document.execCommand('copy'); navigator.clipboard?.writeText(link); toast('Link copied!'); };
      } catch (err) { toast(err.message, true); e.target.disabled = false; }
    };
  });
}

async function playPage(id, server, autoVoice) {
  const g = await api('GET', '/api/games/' + id);
  me = await api('GET', '/api/me');
  const wasOverlay = overlayMode;
  if (wasOverlay) app.classList.add('fullscreen'); else app.className = 'fullscreen';
  // 2UI game: GUI-only, no 3D world — play it in the interface itself.
  if (g.world?.twoUi) {
    api('POST', `/api/games/${id}/visit`).catch(() => {});
    app.innerHTML = '<div class="play-container two-ui-play-wrap"></div>';
    const { renderTwoUi } = await import('./two-ui.js?v=c35306d5');
    const player = renderTwoUi(app.querySelector('.play-container'), g.world.twoUi, {
      onExit: () => { player.destroy(); cleanup = null; if (wasOverlay && window.__closeLobbyOverlay) window.__closeLobbyOverlay(); else history.length > 1 ? history.back() : (location.hash = '#/games/' + g.id); },
      onWin: async (score, won) => {
        if (!won) return;
        try {
          const r = await api('POST', '/api/games/' + id + '/2ui-win', { score });
          if (r.reward) { me.funtix = (me.funtix || 0) + r.reward; setMoney(me); toast('🏆 You won! +' + r.reward + ' FunTix (daily reward)'); }
          const s = await api('GET', '/api/games/' + id + '/2ui-scores');
          const el = player.scoresEl();
          if (el && s.scores?.length) {
            el.innerHTML = '<div class="sec-h"><h2>🏆 Top scores</h2></div>' + s.scores.map((x, i) => `<div class="row" style="justify-content:space-between"><span>${i + 1}. ${esc(x.username)}</span><b>${x.score}</b></div>`).join('');
          }
        } catch (e) { /* leaderboard not set up yet — the win still counts */ }
      },
    });
    cleanup = () => player.destroy();
    return;
  }
  app.innerHTML = '<div class="play-container"></div>';
  const { Game } = await import('./game.js?v=8a7d3c0d');
  const game = new Game(app.querySelector('.play-container'), {
    world: g.world, gameId: g.id, gameName: g.name, server, autoVoice, shooter: g.event === 'shooter' || g.world?.shooter === true, gameGears: g.world?.gears || [], me, token, funtix: me.funtix,
    onMoney: r => setMoney(r), onExit: () => { cleanup = null; if (wasOverlay && window.__closeLobbyOverlay) window.__closeLobbyOverlay(); else history.length > 1 ? history.back() : (location.hash = '#/games/' + g.id); },
  });
  cleanup = () => game.destroy();
}

// ---------- avatar editor ----------
const SKIN = ['#f5cd30', '#ffcc99', '#e8b98a', '#c68e5b', '#8d5524', '#5c3a1e', '#ffffff', '#a3a2a5', '#1b2a35', '#0d69ac', '#6e99ca', '#2f8cff', '#a4bd47', '#4b974b', '#287f47', '#c4281c', '#ff66cc', '#8a4bd8', '#da8541', '#ffd400', '#000000', '#7c5c46'];
async function avatarPage(tab = 'body') {
  try { await ensureAvatar3d(); } catch {}
  const av = structuredClone(me.avatar); av.head ??= 'head_classic'; av.rig ??= 'r6'; av.pants ??= 'pants_none';
  let part = 'all';
  mount('avatar', `
    <h1>Avatar Editor</h1><button class="btn-secondary av-random"><span class="ic">${icons.dice}</span> Randomize outfit</button> <a class="btn-secondary" href="#/skinmaker"><span class="ic">${icons.palette}</span> AI Skin Maker</a>
    <div class="av-wrap">
      <div class="av-preview"><canvas class="av-canvas"></canvas><div class="muted small">Drag to rotate</div></div>
      <div class="av-panel">
        <div class="av-tabs">${['body', 'head', 'hat', 'face', 'shirt', 'pants', 'gear', 'rig'].map(t => `<button data-tab="${t}" class="${t === tab ? 'active' : ''}">${{ body: 'Body Colors', head: 'Heads', hat: 'Hats', face: 'Faces', shirt: 'Shirts', pants: 'Pants', gear: 'Gears', rig: 'Rig' }[t]}</button>`).join('')}</div>
        <div class="av-body"></div>
      </div>
    </div>`, () => {
    const canvas = app.querySelector('.av-canvas');
    app.querySelector('.av-random').onclick = () => {
      const pick = t => { const pool = CATALOG.filter(i => i.type === t && (me.inventory.includes(i.id) || i.free)); return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : av[t]; };
      av.hat = pick('hat'); av.face = pick('face'); av.shirt = pick('shirt'); av.pants = pick('pants'); av.pet = pick('pet');
      rebuild(); render(); save(); toast('Randomized!');
    };
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); r.outputColorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff', '#888', 1.5)); const dl = new THREE.DirectionalLight('#fff', 1.6); dl.position.set(3, 6, 8); sc.add(dl);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 3.6, 14); cam.lookAt(0, 3, 0);
    let ch = null, rotY = -0.4, alive = true, dragging = false, lx = 0;
    const rebuild = () => { if (ch) sc.remove(ch); ch = buildCharacter(av); ch.rotation.y = rotY; sc.add(ch); };
    const size = () => { const w = canvas.parentElement.clientWidth; r.setSize(w, w, false); r.setPixelRatio(devicePixelRatio); };
    size(); rebuild();
    canvas.onpointerdown = e => { dragging = true; lx = e.clientX; canvas.setPointerCapture(e.pointerId); };
    canvas.onpointermove = e => { if (dragging) { rotY += (e.clientX - lx) * 0.01; lx = e.clientX; } };
    canvas.onpointerup = () => (dragging = false);
    const tick = () => { if (!alive) return; requestAnimationFrame(tick); if (ch) { ch.rotation.y = rotY; } r.render(sc, cam); };
    tick();
    cleanup = () => { alive = false; r.dispose(); };
    let saveT = null;
    const save = () => { clearTimeout(saveT); saveT = setTimeout(async () => { me.avatar = await api('PUT', '/api/me/avatar', av); { const ci = document.querySelector('.lb-chip img'); if (ci) ci.src = avatarImage(me.avatar); } }, 300); };
    const body = app.querySelector('.av-body');
    const render = () => {
      if (tab === 'body') {
        const parts = [['all', 'All'], ['head', 'Head'], ['torso', 'Torso'], ['larm', 'Left Arm'], ['rarm', 'Right Arm'], ['lleg', 'Left Leg'], ['rleg', 'Right Leg']];
        body.innerHTML = `<div class="part-pick">${parts.map(([k, l]) => `<button data-part="${k}" class="${k === part ? 'active' : ''}">${k !== 'all' ? `<i class="sw" style="background:${av.colors[k]}"></i>` : ''}${l}</button>`).join('')}</div>
          <div class="swatches">${SKIN.map(c => `<button class="swatch" data-c="${c}" style="background:${c}"></button>`).join('')}<label class="swatch custom" title="Custom color"><input type="color"></label></div>`;
        body.querySelectorAll('[data-part]').forEach(b => b.onclick = () => { part = b.dataset.part; render(); });
        const apply = c => { (part === 'all' ? Object.keys(av.colors) : [part]).forEach(k => (av.colors[k] = c)); rebuild(); render(); save(); };
        body.querySelectorAll('[data-c]').forEach(b => b.onclick = () => apply(b.dataset.c));
        body.querySelector('input[type=color]').onchange = e => apply(e.target.value);
      } else if (tab === 'rig') {
        // R6 = classic look with bendy limbs, R15 = modern Roblox-style articulated limbs
        const rigs = [['r6', 'R6 Classic', 'The classic look — one-piece arms and legs.'], ['r15', 'R15 Modern', 'Modern Roblox style — arms and legs bend at the elbow and knee, no hands or feet.']];
        body.innerHTML = `<div class="item-grid">${rigs.map(([k, n, d]) => `<button class="item ${av.rig === k ? 'worn' : ''}" data-rig="${k}"><img src="${avatarImage({ ...av, rig: k }, 'full')}"><span>${n}</span><span class="muted small">${d}</span></button>`).join('')}</div>`;
        body.querySelectorAll('[data-rig]').forEach(b => b.onclick = () => { av.rig = b.dataset.rig; rebuild(); render(); save(); });
      } else {
        const owned = CATALOG.filter(i => i.type === tab && (me.inventory.includes(i.id) || i.id === tab + '_none'))
          .concat(UGC_LIST.filter(u => u.type === tab && me.inventory.includes(u.id)));
        body.innerHTML = `<div class="item-grid">${owned.map(i => `<button class="item ${av[tab] === i.id ? 'worn' : ''}" data-id="${i.id}">${i.model_url ? glbCardImg() : i.type === 'pet' ? (PET_MODELS[i.id] ? `<canvas class="pet-voxel" width="120" height="120" data-pet="${i.id}"></canvas>` : `<span class="pet-emoji">${i.emoji || ''}</span>`) : i.type === 'gear' ? (GEAR_MODELS[i.id] ? `<canvas class="gear-voxel" width="120" height="120" data-gear="${i.id}"></canvas>` : `<span class="pet-emoji">${i.emoji || ''}</span>`) : `<img src="${itemImage(i)}">`}<span>${esc(i.name)}</span></button>`).join('')}
          <a class="item more" href="#/catalog/${tab}"><span class="plus">+</span><span>Get More</span></a></div>`;
        body.querySelectorAll('[data-id]').forEach(b => b.onclick = () => {
          // Only ONE ability item at a time: picking an ability item unequips
          // ability items in the other slots.
          const it = ITEM[b.dataset.id];
          if (it?.ability) for (const sl of ['gear', 'shirt', 'hat', 'head', 'face']) if (sl !== tab) { const cur = ITEM[av[sl]]; if (cur?.ability) av[sl] = sl + '_none'; }
          av[tab] = b.dataset.id; rebuild(); render(); save();
        });
        paintPetVoxels(body);
      }
    };
    app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; app.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x === b)); render(); });
    render();
  });
}
const PREVIEW_BASE = { colors: { head: '#a3a2a5', torso: '#a3a2a5', larm: '#a3a2a5', rarm: '#a3a2a5', lleg: '#a3a2a5', rleg: '#a3a2a5' }, hat: 'hat_none', face: 'face_smile', shirt: 'shirt_none' };
function itemImage(item) {
  if (item.type === 'shirt' && _avatar3d && _avatar3d.shirtDesignImage) {
    const flat = _avatar3d.shirtDesignImage(item.id);
    if (flat) return flat;
  }
  const a = structuredClone(me?.avatar || PREVIEW_BASE);
  a[item.type] = item.id;
  return avatarImage(a, (item.type === 'shirt' || item.type === 'pants') ? 'full' : 'headshot');
}

// ---------- UGC (player-created avatar items) ----------
let UGC_LIST = [];
async function loadUgc() {
  try {
    const items = await api('GET', '/api/ugc');
    // Mark the list items themselves as UGC: the render guards check i.ugc,
    // and the raw API rows don't carry that flag (only the ITEM[] copy did),
    // so UGC items used to fall through to the emoji branch and print
    // "undefined" (UGC items have no emoji field).
    UGC_LIST = (Array.isArray(items) ? items : []).map(u => ({ ...u, ugc: true }));
    for (const u of UGC_LIST) ITEM[u.id] = { id: u.id, type: u.type, name: u.name, price: u.price, color: u.color, template: u.template, model_url: u.model_url || null, model_transform: u.model_transform || null, creator: u.creator, ugc: true };
  } catch { UGC_LIST = []; }
}

async function catalogPage(filter = 'all') {
  const filters = ['all', 'head', 'hat', 'face', 'shirt', 'pants', 'pet', 'gear', 'ugc'];
  const labels = { all: 'All', head: 'Heads', hat: 'Hats', face: 'Faces', shirt: 'Shirts', pants: 'Pants', pet: 'Pets', gear: 'Gears', ugc: `${icons.palette} UGC` };
  const list = filter === 'ugc' ? UGC_LIST : CATALOG.filter(i => !i.limited && (filter === 'all' || i.type === filter));
  const soc = await api('GET', '/api/social/me').catch(() => ({ wishlist: [] }));
  const wish = new Set(soc.wishlist || []);
  const itemHtml = i => `
      <div class="cat-item">${i.model_url ? `<div class="cat-img">${glbCardImg()}</div>` : i.type === 'pet' ? (PET_MODELS[i.id] ? `<div class="cat-img pet-img"><canvas class="pet-voxel" width="120" height="120" data-pet="${i.id}"></canvas></div>` : `<div class="cat-img pet-img">${i.emoji || ''}</div>`) : i.type === 'gear' ? (GEAR_MODELS[i.id] ? `<div class="cat-img pet-img"><canvas class="gear-voxel" width="120" height="120" data-gear="${i.id}"></canvas></div>` : `<div class="cat-img pet-img">${i.emoji || ''}</div>`) : `<div class="cat-img"><img src="${itemImage(i)}"></div>`}<div class="cat-name">${esc(i.name)}</div>
        ${i.ugc ? `<div class="muted small">by ${esc(i.creator)} · ${i.sales} sold</div>` : ''}
        <div class="cat-price">${priceHtml(i)}</div>
        <button class="btn-wish ${wish.has(i.id) ? 'on' : ''}" data-wish="${i.id}" title="Wishlist"><span class="ic">${icons.heart}</span></button>
        ${me.inventory.includes(i.id) ? '<button class="btn-owned" disabled>Owned</button>' : i.club && !me.club ? '<a class="btn-club" href="#/club">Members Only</a>' : `<button class="btn-buy" data-id="${i.id}"${i.ugc ? ' data-ugc="1"' : ''}>Buy</button>`}</div>`;
  mount('catalog', `
    <h1>Marketplace</h1>
    <div class="cat-filters">${filters.map(f => `<a href="#/catalog/${f}" class="${f === filter ? 'active' : ''}">${labels[f]}</a>`).join('')}</div>
    ${filter === 'ugc' ? '<p class="muted small">Player-created items. Creators earn 70% of every sale. <a href="#/ugc">Make your own →</a></p>' : ''}
    <div class="cat-controls"><select class="cat-sort"><option value="default">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name A–Z</option></select><label><input type="checkbox" class="cat-free"> Free only</label><label><input type="checkbox" class="cat-wishonly"> ♥ Wishlist</label></div>
    <div class="cat-grid">${list.map(itemHtml).join('') || '<p class="muted">Nothing here yet.</p>'}</div>`, () => {
    paintPetVoxels(app);
    const bindAll = () => {
      app.querySelectorAll('.btn-buy').forEach(b => b.onclick = () => {
        const it = ITEM[b.dataset.id];
        if (b.dataset.ugc) ugcBuyModal(it, () => catalogPage(filter));
        else buyModal(it, () => catalogPage(filter));
      });
      app.querySelectorAll('[data-wish]').forEach(b => b.onclick = async () => {
        const r = await api('POST', '/api/social/wishlist/' + b.dataset.wish);
        if (r.wishlisted) wish.add(b.dataset.wish); else wish.delete(b.dataset.wish);
        b.innerHTML = '<span class="ic">' + icons.heart + '</span>'; b.classList.toggle('on', r.wishlisted);
        toast(r.wishlisted ? 'Added to wishlist' : 'Removed from wishlist');
      });
    };
    bindAll();
    const renderCat = () => {
      let l = [...list];
      if (app.querySelector('.cat-free').checked) l = l.filter(i => i.free || i.price === 0);
      if (app.querySelector('.cat-wishonly').checked) l = l.filter(i => wish.has(i.id));
      const s = app.querySelector('.cat-sort').value;
      if (s === 'price-asc') l.sort((x, y) => (x.price || 0) - (y.price || 0));
      else if (s === 'price-desc') l.sort((x, y) => (y.price || 0) - (x.price || 0));
      else if (s === 'name') l.sort((x, y) => x.name.localeCompare(y.name));
      app.querySelector('.cat-grid').innerHTML = l.map(itemHtml).join('') || '<p class="muted">Nothing here yet.</p>';
      paintPetVoxels(app); bindAll();
    };
    app.querySelector('.cat-sort').onchange = renderCat;
    app.querySelector('.cat-free').onchange = renderCat;
    app.querySelector('.cat-wishonly').onchange = renderCat;
  });
}
function ugcBuyModal(it, onDone) {
  const cut = Math.floor(it.price * UGC_CREATOR_CUT);
  const d = document.createElement('div'); d.className = 'modal-bg';
  d.innerHTML = `<div class="modal"><h2>Buy UGC Item</h2>
    <div class="buy-row">${it.model_url ? glbCardImg() : `<img src="${itemImage(it)}">`}<div><p>Buy <b>${esc(it.name)}</b> by <b>${esc(it.creator)}</b>?</p>
    <p class="muted small">${tix} ${fmt(cut)} goes to the creator</p>
    <p class="muted small">You have ${tix} ${fmt(me.funtix ?? 0)}</p></div></div>
    <div class="modal-actions"><button class="btn-secondary">Cancel</button><button class="btn-primary" ${(me.funtix ?? 0) < it.price ? 'disabled title="Not enough"' : ''}>Buy for ${tix} ${it.price}</button></div></div>`;
  document.body.appendChild(d);
  d.querySelector('.btn-secondary').onclick = () => d.remove();
  d.onclick = e => { if (e.target === d) d.remove(); };
  d.querySelector('.btn-primary').onclick = async () => {
    d.remove();
    try { const r = await api('POST', '/api/ugc/' + it.id + '/buy'); me.inventory = r.inventory; setMoney(r); toast(`You bought ${it.name}!`); onDone(); }
    catch (e) { toast(e.message, true); }
  };
}

// ---------- UGC Studio (player item creator) ----------
// GLB card placeholder (3D loads async)
const glbCardImg = () => `<div class="glb-ph"><span class="ic">${icons.box}</span><span>3D</span></div>`;
const ugcCardImg = u => u.model_url ? glbCardImg() : `<img src="${itemImage(u)}">`;
function priceHtml(i) {
  if (i.club) return `<span class="club-price">${CLUB} FriendClub</span>`;
  return i.free ? '<span class="free">Free</span>' : `<span class="pc">${tix} ${i.price}</span>`;
}
function buyModal(it, onDone) {
  const opts = [['tix', tix, it.price, me.funtix ?? 0]];
  const d = document.createElement('div'); d.className = 'modal-bg';
  d.innerHTML = `<div class="modal"><h2>Buy Item</h2>
    <div class="buy-row">${it.type === 'pet' ? (PET_MODELS[it.id] ? `<div class="pet-img-lg"><canvas class="pet-voxel" width="160" height="160" data-pet="${it.id}"></canvas></div>` : `<div class="pet-img-lg">${it.emoji || ''}</div>`) : it.type === 'gear' ? (GEAR_MODELS[it.id] ? `<div class="pet-img-lg"><canvas class="gear-voxel" width="160" height="160" data-gear="${it.id}"></canvas></div>` : `<div class="pet-img-lg">${it.emoji || ''}</div>`) : `<img src="${itemImage(it)}">`}<div><p>Would you like to buy <b>${esc(it.name)}</b>?</p>
    <p class="muted small">You have ${tix} ${fmt(me.funtix ?? 0)}</p></div></div>
    <div class="modal-actions"><button class="btn-secondary">Cancel</button>${opts.map(([c, ic, p, bal]) => `<button class="btn-primary buy-with" data-c="${c}" ${bal < p ? 'disabled title="Not enough"' : ''}>Buy for ${ic} ${p}</button>`).join('')}</div></div>`;
  document.body.appendChild(d);
  paintPetVoxels(d);
  d.querySelector('.btn-secondary').onclick = () => d.remove();
  d.onclick = e => { if (e.target === d) d.remove(); };
  d.querySelectorAll('[data-c]').forEach(b => b.onclick = async () => {
    d.remove();
    try { const r = await api('POST', '/api/buy/' + it.id); me.inventory = r.inventory; setMoney(r); toast(`You bought ${it.name}!`); onDone(); }
    catch (e) { toast(e.message, true); }
  });
}
function confirmModal(title, html, ok, onOk) {
  const d = document.createElement('div'); d.className = 'modal-bg';
  d.innerHTML = `<div class="modal"><h2>${title}</h2><p>${html}</p><div class="modal-actions"><button class="btn-secondary">Cancel</button><button class="btn-primary">${ok}</button></div></div>`;
  document.body.appendChild(d);
  d.querySelector('.btn-secondary').onclick = () => d.remove();
  d.querySelector('.btn-primary').onclick = () => { d.remove(); onOk(); };
  d.onclick = e => { if (e.target === d) d.remove(); };
}

async function messagesPage() {
  const convos = await api('GET', '/api/dms');
  mount('messages', `<h1>Messages</h1>
    <div class="dm-list">${convos.map(c => `
      <a class="dm-convo" href="#/messages/${encodeURIComponent(c.name)}">
        <b>${esc(c.name)}</b>
        <span class="muted small dm-snip">${esc(c.lastText.slice(0, 60))}</span>
        <span class="muted small">${timeAgo(c.lastCreated)}</span>
        ${c.unread ? `<span class="badge">${c.unread}</span>` : ''}
      </a>`).join('') || '<p class="muted">No messages yet. Visit a friend\'s profile to say hi!</p>'}</div>`);
}
async function dmPage(name) {
  let msgs = await api('GET', '/api/dm/' + encodeURIComponent(name));
  mount('messages', `<h1 class="dm-head"><a href="#/messages">&larr; Messages</a> &middot; ${esc(name)}</h1>
    <div class="dm-thread"></div>
    <form class="dm-form"><input maxlength="500" placeholder="Message ${esc(name)}..." autocomplete="off"><button class="btn-primary">Send</button></form>`, () => {
    const thread = app.querySelector('.dm-thread');
    const render = () => {
      thread.innerHTML = msgs.map(m => `<div class="dm-msg ${m.sender === me.name ? 'me' : ''}"><span>${esc(m.text)}</span><i>${timeAgo(m.created)}</i>${m.sender === me.name ? `<button class="dm-del" data-id="${m.id}" title="Delete message">&times;</button>` : ''}</div>`).join('');
      thread.scrollTop = thread.scrollHeight;
      thread.querySelectorAll('.dm-del').forEach(b => b.onclick = async e => {
        e.stopPropagation();
        if (!confirm('Delete this message?')) return;
        try { await api('DELETE', '/api/dm/' + b.dataset.id); msgs = msgs.filter(m => String(m.id) !== b.dataset.id); render(); }
        catch (err) { toast(err.message, true); }
      });
    };
    render();
    const t = setInterval(async () => {
      try { const nm = await api('GET', '/api/dm/' + encodeURIComponent(name)); if (nm.length !== msgs.length || (nm[nm.length - 1]?.id !== msgs[msgs.length - 1]?.id)) { msgs = nm; render(); } } catch {}
    }, 5000);
    cleanup = () => clearInterval(t);
    app.querySelector('.dm-form').onsubmit = async e => {
      e.preventDefault();
      const inp = e.target.querySelector('input');
      const text = inp.value.trim(); if (!text) return;
      inp.value = '';
      try { const m = await api('POST', '/api/dm/' + encodeURIComponent(name), { text }); msgs.push(m); render(); }
      catch (err) { toast(err.message, true); }
    };
  });
  refreshNotif();
}
function shadeHex(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const cl = v => Math.max(0, Math.min(255, v));
  const r = cl((n >> 16) + amt), g = cl(((n >> 8) & 255) + amt), b = cl((n & 255) + amt);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
function drawVoxel(canvas, boxes) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const corners = b => {
    const out = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1])
      out.push([b[0] + sx * b[3] / 2, b[1] + sy * b[4] / 2, b[2] + sz * b[5] / 2]);
    return out;
  };
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const b of boxes) for (const c of corners(b)) {
    const px = c[0] - c[2], py = (c[0] + c[2]) * 0.5 - c[1];
    if (px < minX) minX = px; if (px > maxX) maxX = px;
    if (py < minY) minY = py; if (py > maxY) maxY = py;
  }
  const pad = 6;
  const s = Math.min((W - pad * 2) / Math.max(1, maxX - minX), (H - pad * 2) / Math.max(1, maxY - minY));
  const ox = W / 2 - (minX + maxX) / 2 * s, oy = H / 2 - (minY + maxY) / 2 * s;
  const P2 = (x, y, z) => [ox + (x - z) * s, oy + ((x + z) * 0.5 - y) * s];
  const poly = pts => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); };
  const sorted = [...boxes].sort((a, b) => ((a[0] + a[2]) - (b[0] + b[2])) || (a[1] - b[1]));
  for (const b of sorted) {
    const x0 = b[0] - b[3] / 2, x1 = b[0] + b[3] / 2;
    const y0 = b[1] - b[4] / 2, y1 = b[1] + b[4] / 2;
    const z0 = b[2] - b[5] / 2, z1 = b[2] + b[5] / 2;
    const col = b[6];
    ctx.fillStyle = shadeHex(col, -30);
    poly([P2(x1, y0, z0), P2(x1, y1, z0), P2(x1, y1, z1), P2(x1, y0, z1)]);
    ctx.fillStyle = shadeHex(col, -12);
    poly([P2(x0, y0, z1), P2(x1, y0, z1), P2(x1, y1, z1), P2(x0, y1, z1)]);
    ctx.fillStyle = shadeHex(col, 26);
    poly([P2(x0, y1, z0), P2(x1, y1, z0), P2(x1, y1, z1), P2(x0, y1, z1)]);
  }
}
function paintPetVoxels(root) {
  (root || document).querySelectorAll('canvas.pet-voxel').forEach(cv => {
    const m = PET_MODELS[cv.dataset.pet];
    if (m) drawVoxel(cv, m.boxes);
  });
  (root || document).querySelectorAll('canvas.gear-voxel').forEach(cv => {
    const m = GEAR_MODELS[cv.dataset.gear];
    if (m) drawVoxel(cv, m.boxes);
  });
}
async function friendsPage() {
  const fr = await api('GET', '/api/friends');
  const feed = await api('GET', '/api/social/feed').catch(() => ({ games: [], playing: [] }));
  mount('friends', `
    <h1>Friends</h1>
    <p><a class="btn-secondary" href="#/groups"><span class="ic">${icons.groups}</span> My Groups</a></p>
    <form class="user-search"><input name="q" placeholder="Search for people by username"><button class="btn-primary">Search</button></form>
    <div class="search-results"></div>
    ${fr.requests.length ? `<section><div class="sec-h"><h2>Friend Requests (${fr.requests.length})</h2></div><div class="req-list">${fr.requests.map(u => `
      <div class="req">${avatarImgTag(u.avatar)}<a href="#/users/${encodeURIComponent(u.name)}">${esc(u.name)}</a>${(fr.reqNotes || {})[u.name] ? `<span class="req-note">💬 ${esc(fr.reqNotes[u.name])}</span>` : ''}<button class="btn-primary" data-accept="${esc(u.name)}">Accept</button><button class="btn-secondary" data-decline="${esc(u.name)}">Ignore</button></div>`).join('')}</div></section>` : ''}
    <section><div class="sec-h"><h2><span class="ic">${icons.news}</span> Friend Activity</h2></div>
      ${feed.playing.length ? `<p>${feed.playing.map(p => `<a href="#/play/${p.gameId}">${esc(p.name)} is playing ${esc(p.gameName)}</a>`).join(' · ')}</p>` : ''}
      <div class="game-row">${feed.games.map(gameCard).join('') || '<p class="muted">Nothing new from friends yet.</p>'}</div></section>
    <section><div class="sec-h"><h2>My Friends (${fr.friends.length})</h2></div>
      <div class="friend-grid">${fr.friends.map(u => `<div class="friend-card">${userTile(u)}<div class="friend-card-actions"><a class="btn-secondary btn-small" href="#/messages/${encodeURIComponent(u.name)}">Message</a><button class="btn-secondary btn-small" data-call="${esc(u.name)}"><span class="ic">${icons.phone}</span> Call</button><a class="btn-secondary btn-small" href="#/trade/${encodeURIComponent(u.name)}">🔄 Trade</a><button class="btn-secondary btn-small" data-party="${esc(u.name)}" title="Start a party"><span class="ic">${icons.sparkles}</span></button>${u.gameId ? `<a class="btn-join" href="#/play/${u.gameId}">Join</a>` : `<span class="muted small">${u.online ? 'Online' : 'Offline'}</span>`}</div></div>`).join('') || '<p class="muted">No friends yet. Search for people above!</p>'}</div></section>`, () => {
    app.querySelectorAll('[data-accept]').forEach(b => b.onclick = async () => { await api('POST', '/api/friends/' + encodeURIComponent(b.dataset.accept)); toast('You are now friends with ' + b.dataset.accept); me = await api('GET', '/api/me'); friendsPage(); });
    app.querySelectorAll('[data-decline]').forEach(b => b.onclick = async () => { await api('DELETE', '/api/friends/' + encodeURIComponent(b.dataset.decline)); me = await api('GET', '/api/me'); friendsPage(); });
    app.querySelectorAll('[data-party]').forEach(b => b.onclick = async () => {
      try {
        let p = await api('GET', '/api/party');
        if (!p) p = await api('POST', '/api/party');
        await api('POST', `/api/party/${p.id}/invite`, { user: b.dataset.party });
        toast('Party invite sent to ' + b.dataset.party + '!');
      } catch (err) { toast(err.message, true); }
    });
    app.querySelectorAll('[data-call]').forEach(b => b.onclick = async () => {
      b.disabled = true; b.innerHTML = '<span class="ic">' + icons.phone + '</span> Calling…';
      try {
        await api('POST', '/api/call/invite', { to: b.dataset.call });
        toast('Calling ' + b.dataset.call + ' — they got an invite!');
        b.outerHTML = `<a class="btn-join" href="#/play/g_voicelounge?voice=1">Join the call</a>`;
      } catch (err) { toast(err.message, true); b.disabled = false; b.innerHTML = '<span class="ic">' + icons.phone + '</span> Call'; }
    });
    app.querySelector('.user-search').onsubmit = async e => {
      e.preventDefault();
      const r = await api('GET', '/api/search/users?q=' + encodeURIComponent(e.target.q.value));
      app.querySelector('.search-results').innerHTML = `<div class="friends-row">${r.map(userTile).join('') || '<p class="muted">No users found.</p>'}</div>`;
    };
  });
}

async function showGroupDetail(id, reload) {
  try {
    const g = await api('GET', '/api/groups/' + encodeURIComponent(id));
    const isOwner = g.isCreator || me.admin;
    const d = document.createElement('div'); d.className = 'modal-bg';
    const fmtDate = ts => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    d.innerHTML = `<div class="modal modal-wide"><h2>${g.icon ? esc(g.icon) + ' ' : ''}${esc(g.name)}</h2>
      <p class="muted">${esc(g.description || 'No description yet.')}</p>
      <div class="group-meta"><span>${g.members} member${g.members === 1 ? '' : 's'}</span><span>by ${esc(g.creator)}</span></div>
      ${isOwner ? `<div class="group-edit"><label>Icon (emoji)<input class="group-icon-input" maxlength="4" value="${esc(g.icon || '')}" placeholder="🎮"></label>
      <label>Description<textarea class="group-desc-input" maxlength="240" rows="2">${esc(g.description || '')}</textarea></label>
      <button class="btn-primary btn-sm group-save">Save</button></div>` : ''}
      <div class="group-tabs">
        <button class="group-tab active" data-tab="ann"><span class="ic">${icons.bell}</span> Announcements (${(g.announcements || []).length})</button>
        <button class="group-tab" data-tab="games"><span class="ic">${icons.gamepad}</span> Games (${(g.games || []).length})</button>
        <button class="group-tab" data-tab="members"><span class="ic">${icons.people}</span> Members (${g.memberList.length})</button>
      </div>
      <div class="group-tabpane" data-pane="ann">
        ${isOwner ? `<button class="btn-primary btn-sm group-ann-new">+ New Announcement</button>` : ''}
        <div class="group-anns">${(g.announcements || []).length ? g.announcements.map(a => `
          <div class="group-ann"><div class="group-ann-head"><b>${esc(a.title)}</b>${isOwner ? `<button class="btn-danger btn-sm ann-del" data-aid="${esc(a.id)}">Delete</button>` : ''}</div>
          <p>${esc(a.content)}</p><div class="muted small">by ${esc(a.author)} · ${fmtDate(a.created)}</div></div>`).join('') : '<p class="muted">No announcements yet.</p>'}</div>
      </div>
      <div class="group-tabpane hidden" data-pane="games">
        ${isOwner ? `<button class="btn-primary btn-sm group-game-add">+ Add Game</button>` : ''}
        <div class="group-games">${(g.games || []).length ? g.games.map(gm => `
          <a class="group-game" href="#/games/${esc(gm.id)}"><b>${esc(gm.name)}</b><span class="muted small">by ${esc(gm.creator)} · ${gm.visits} plays</span>${isOwner ? `<button class="btn-danger btn-sm game-rm" data-gid="${esc(gm.id)}">Remove</button>` : ''}</a>`).join('') : '<p class="muted">No games yet.</p>'}</div>
      </div>
      <div class="group-tabpane hidden" data-pane="members">
        <div class="group-members">${g.memberList.map(m => `<div class="group-member"><span>${esc(m)}</span>${isOwner && m !== g.creator ? `<button class="btn-danger btn-sm group-kick" data-name="${esc(m)}">Kick</button>` : ''}${m === g.creator ? '<span class="owner-badge">Owner</span>' : ''}</div>`).join('')}</div>
      </div>
      <div class="modal-actions"><button class="btn-secondary group-close">Close</button></div></div>`;
    document.body.appendChild(d);
    const refresh = () => { d.remove(); showGroupDetail(id, reload); reload(); };
    d.querySelector('.group-close').onclick = () => d.remove();
    d.onclick = e => { if (e.target === d) d.remove(); };
    // Tabs
    d.querySelectorAll('.group-tab').forEach(t => t.onclick = () => {
      d.querySelectorAll('.group-tab').forEach(x => x.classList.toggle('active', x === t));
      d.querySelectorAll('.group-tabpane').forEach(p => p.classList.toggle('hidden', p.dataset.pane !== t.dataset.tab));
    });
    // Kick
    d.querySelectorAll('.group-kick').forEach(b => b.onclick = async () => {
      if (!confirm(`Kick ${b.dataset.name}?`)) return;
      try { await api('POST', `/api/groups/${encodeURIComponent(id)}/kick`, { name: b.dataset.name }); toast('Kicked.'); refresh(); }
      catch (e) { toast(e.message, true); }
    });
    // Save edits
    const saveBtn = d.querySelector('.group-save');
    if (saveBtn) saveBtn.onclick = async () => {
      try {
        await api('PUT', `/api/groups/${encodeURIComponent(id)}`, { icon: d.querySelector('.group-icon-input').value, description: d.querySelector('.group-desc-input').value });
        toast('Group updated.'); refresh();
      } catch (e) { toast(e.message, true); }
    };
    // New announcement
    const annBtn = d.querySelector('.group-ann-new');
    if (annBtn) annBtn.onclick = () => {
      const title = prompt('Announcement title:');
      if (!title) return;
      const content = prompt('Announcement content:');
      if (!content) return;
      api('POST', `/api/groups/${encodeURIComponent(id)}/announcements`, { title, content })
        .then(() => { toast('Posted!'); refresh(); })
        .catch(e => toast(e.message, true));
    };
    // Delete announcement
    d.querySelectorAll('.ann-del').forEach(b => b.onclick = async () => {
      if (!confirm('Delete this announcement?')) return;
      try { await api('DELETE', `/api/groups/${encodeURIComponent(id)}/announcements/${encodeURIComponent(b.dataset.aid)}`); toast('Deleted.'); refresh(); }
      catch (e) { toast(e.message, true); }
    });
    // Add game
    const addGameBtn = d.querySelector('.group-game-add');
    if (addGameBtn) addGameBtn.onclick = async () => {
      try {
        const myGames = await api('GET', '/api/mygames');
        if (!myGames.length) { toast('You have no games to add. Create one first!', true); return; }
        const pick = prompt('Enter the number of the game to add:\n' + myGames.map((gm, i) => `${i + 1}. ${gm.name}`).join('\n'));
        const idx = parseInt(pick) - 1;
        if (isNaN(idx) || idx < 0 || idx >= myGames.length) return;
        await api('POST', `/api/groups/${encodeURIComponent(id)}/games`, { gameId: myGames[idx].id });
        toast('Game added!'); refresh();
      } catch (e) { toast(e.message, true); }
    };
    // Remove game
    d.querySelectorAll('.game-rm').forEach(b => b.onclick = async e => {
      e.preventDefault(); e.stopPropagation();
      if (!confirm('Remove this game from the group?')) return;
      try { await api('DELETE', `/api/groups/${encodeURIComponent(id)}/games/${encodeURIComponent(b.dataset.gid)}`); toast('Removed.'); refresh(); }
      catch (e2) { toast(e2.message, true); }
    });
  } catch (e) { toast(e.message, true); }
}
function groupsPage() {
  const load = async () => {
    const groups = await api('GET', '/api/groups');
    const q = String(app.querySelector('.groups-search')?.value || '').trim().toLowerCase();
    const filtered = q ? groups.filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)) : groups;
    const list = app.querySelector('.group-grid');
    if (!list) return;
    list.innerHTML = filtered.length ? filtered.map(g => `
      <article class="group-card">
        <div class="group-icon">${g.icon ? esc(g.icon) : esc(g.name.slice(0, 1).toUpperCase())}</div>
        <div class="group-card-body">
          <h3>${esc(g.name)}</h3>
          <p>${esc(g.description || 'No description yet.')}</p>
          <div class="group-meta"><span>${g.members} member${g.members === 1 ? '' : 's'}</span><span>by ${esc(g.creator || 'Unknown')}</span></div>
          <div class="group-btns">
            <button class="${g.joined ? 'btn-secondary' : 'btn-primary'} group-action" data-id="${esc(g.id)}" data-action="${g.joined ? 'leave' : 'join'}" ${g.isCreator ? 'disabled title="The creator cannot leave their group"' : ''}>
              ${g.joined ? 'Leave' : 'Join'}
            </button>
            <button class="btn-secondary group-view" data-id="${esc(g.id)}">View</button>
            ${(g.isCreator || me.admin) ? `<button class="btn-danger group-delete" data-id="${esc(g.id)}" data-name="${esc(g.name)}">Delete</button>` : ''}
          </div>
        </div>
      </article>`).join('') : '<p class="muted">No groups found. Create the first one!</p>';
    list.querySelectorAll('.group-action').forEach(btn => btn.onclick = async () => {
      try {
        await api('POST', `/api/groups/${encodeURIComponent(btn.dataset.id)}/${btn.dataset.action}`);
        toast(btn.dataset.action === 'join' ? 'Joined group!' : 'Left group.');
        await load();
      } catch (e) { toast(e.message, true); }
    });
    list.querySelectorAll('.group-view').forEach(btn => btn.onclick = () => showGroupDetail(btn.dataset.id, load));
    list.querySelectorAll('.group-delete').forEach(btn => btn.onclick = async () => {
      if (!confirm(`Delete "${btn.dataset.name}"? This cannot be undone.`)) return;
      try {
        await api('DELETE', `/api/groups/${encodeURIComponent(btn.dataset.id)}`);
        toast('Group deleted.');
        await load();
      } catch (e) { toast(e.message, true); }
    });
  };

  mount('groups', `
    <div class="groups-head">
      <div><h1>Groups</h1><p class="muted">Find people who like the same games and create communities on Funtopia.</p></div>
      <button class="btn-primary" id="create-group">Create Group</button>
    </div>
    <form class="groups-search-row">
      <input class="groups-search" placeholder="Search groups..." autocomplete="off">
      <button class="btn-secondary" type="submit">Search</button>
    </form>
    <div class="group-grid"></div>
  `, () => {
    app.querySelector('#create-group').onclick = () => {
      const d = document.createElement('div');
      d.className = 'modal-bg';
      d.innerHTML = `<div class="modal">
        <h2>Create a Group</h2>
        <form class="group-create-form">
          <label>Group name<input name="name" maxlength="40" minlength="3" placeholder="e.g. Obby Masters" required></label>
          <label>Icon (emoji, optional)<input name="icon" maxlength="4" placeholder="🎮"></label>
          <label>Description<textarea name="description" maxlength="240" rows="4" placeholder="What is your group about?"></textarea></label>
          <div class="modal-actions"><button type="button" class="btn-secondary cancel">Cancel</button><button class="btn-primary">Create</button></div>
        </form>
      </div>`;
      document.body.appendChild(d);
      d.querySelector('.cancel').onclick = () => d.remove();
      d.querySelector('.group-create-form').onsubmit = async e => {
        e.preventDefault();
        const form = e.currentTarget;
        try {
          await api('POST', '/api/groups', { name: form.name.value.trim(), icon: form.icon.value.trim(), description: form.description.value.trim() });
          d.remove();
          toast('Group created!');
          await load();
        } catch (err) { toast(err.message, true); }
      };
    };
    app.querySelector('.groups-search-row').onsubmit = e => { e.preventDefault(); load(); };
    app.querySelector('.groups-search').oninput = () => load();
    load();
  });
}

async function profilePage(name) {
  const u = await api('GET', '/api/users/' + encodeURIComponent(name));
  const soc = await api('GET', '/api/social/' + encodeURIComponent(name)).catch(() => null);
  const isMe = u.name.toLowerCase() === me.name.toLowerCase();
  mount('users', `
    <div class="profile-head">
      <div class="ph-img ${u.gameId ? 'ingame' : u.online ? 'online' : ''}">${avatarImgTag(u.avatar)}</div>
      <div class="ph-info"><h1>${esc(displayNameOf(u))}${vtag(u.name)}${badgeIcon2(u.badge)}</h1><div class="muted">@${esc(u.name)}${u.userId ? ` · User ID #${u.userId}` : ''}</div>
        ${soc?.status ? `<div class="ph-status"><span class="ic">${icons.chat}</span> ${esc(soc.status)}</div>` : ''}
        <div class="ph-stats"><div><b>${u.friends}</b> Friends</div><div><b>${soc?.followers ?? 0}</b> Followers</div><div><b>${soc?.following ?? 0}</b> Following</div><div><b>${u.games.length}</b> Creations</div><div>${u.gameName ? `Playing <a href="#/games/${u.gameId}">${esc(u.gameName)}</a>` : u.online ? 'Online' : 'Offline'}</div></div>
      </div>
      <div class="ph-actions">${isMe ? `<a class="btn-secondary" href="#/avatar">Edit Avatar</a><button class="btn-secondary edit-status"><span class="ic">${icons.chat}</span> Set status</button>` : u.isFriend ? `<a class="btn-secondary" href="#/messages/${encodeURIComponent(u.name)}">Message</a>${u.gameId ? `<a class="btn-primary" href="#/play/${u.gameId}">Join Game</a>` : ''}<button class="btn-secondary gift-btn">🎁 Gift</button><a class="btn-secondary" href="#/trade/${encodeURIComponent(u.name)}">🔄 Trade</a><button class="btn-secondary unfriend">Unfriend</button><button class="btn-secondary report-btn">Report</button>` : u.requested ? '<button class="btn-secondary" disabled>Request Sent</button>' : `<button class="btn-secondary follow-btn">${soc?.isFollowing ? 'Following ✓' : 'Follow'}</button><button class="btn-primary add-friend">Add Friend</button><input class="friend-note" placeholder="Note (optional)" maxlength="120"><button class="btn-secondary report-btn">Report</button>`}</div>
    </div>
    <section><div class="sec-h"><h2>About</h2>${isMe ? '<button class="link edit-bio">Edit</button>' : ''}</div><p class="bio">${esc(u.bio || (isMe ? 'Tell people about yourself!' : 'This user has no bio.'))}</p></section>
    <section><div class="sec-h"><h2>Badges (${u.badges.length})</h2></div>
      ${isMe && u.badges.length ? '<p class="muted small">Click a badge to show it next to your name.</p>' : ''}
      <div class="badge-grid">${u.badges.map(id => { const bd = badgeDef(id); if (!bd) return ''; return `<${isMe ? 'button' : 'div'} class="badge-card ${u.badge === id ? 'on' : ''}" data-badge="${id}">${badgeIcon2(id, 44)}<b>${esc(bd.name)}</b><span class="muted small">${esc(bd.desc || '')}</span>${u.badge === id ? '<span class="badge-feat">Shown</span>' : ''}</${isMe ? 'button' : 'div'}>`; }).join('')}
        ${isMe && u.badges.length ? `<button class="badge-card none ${u.badge ? '' : 'on'}" data-badge="none"><b>None</b><span class="muted small">Don't show a badge</span>${u.badge ? '' : '<span class="badge-feat">Shown</span>'}</button>` : ''}</div>
      ${u.badges.length ? '' : '<p class="muted">No badges yet.</p>'}</section>
    <section class="profile-grid">
      <div class="profile-avatar"><h2>Currently Wearing</h2>${avatarImgTag(u.avatar, "full")}</div>
      <div><h2>Friends (${u.friendsList.length})</h2><div class="friends-row wrap">${u.friendsList.map(userTile).join('') || '<p class="muted">No friends yet.</p>'}</div></div>
    </section>
    ${soc?.showcase ? `<section><div class="sec-h"><h2><span class="ic">${icons.star}</span> Showcase</h2></div><div class="game-row">${gameCard(soc.showcase)}</div></section>` : ''}
    <section><div class="sec-h"><h2>Creations</h2>${isMe ? `<select class="showcase-pick"><option value="">No showcase</option>${u.games.map(gm => `<option value="${gm.id}" ${soc?.showcase?.id === gm.id ? 'selected' : ''}>${esc(gm.name)}</option>`).join('')}</select>` : ''}</div><div class="game-row">${u.games.map(gameCard).join('') || '<p class="muted">No creations yet.</p>'}</div></section>`, () => {
    app.querySelector('.follow-btn')?.addEventListener('click', async () => { const r = await api('POST', '/api/social/follow/' + encodeURIComponent(u.name)); toast(r.following ? 'Following ' + u.name : 'Unfollowed ' + u.name); profilePage(name); });
    app.querySelector('.gift-btn')?.addEventListener('click', async () => { const amt = prompt(`Gift how many FunTix to ${u.name}? (1–1000)`, '100'); if (amt == null) return; try { const r = await api('POST', '/api/social/gift', { to: u.name, amount: +amt }); toast(`Sent ${r.sent} FunTix to ${u.name}!`); } catch (e) { toast(e.message, true); } });
    app.querySelector('.edit-status')?.addEventListener('click', async () => { const v = prompt('Your status (80 chars):', soc?.status || ''); if (v === null) return; await api('POST', '/api/social/status', { status: v }); profilePage(name); });
    app.querySelector('.showcase-pick')?.addEventListener('change', async e => { await api('POST', '/api/social/showcase', { gameId: e.target.value || null }); toast('Showcase updated'); profilePage(name); });
    app.querySelector('.add-friend')?.addEventListener('click', async () => { const note = app.querySelector('.friend-note')?.value || ''; const r = await api('POST', '/api/friends/' + encodeURIComponent(u.name), { note }); toast(r.status === 'friends' ? 'You are now friends!' : 'Friend request sent'); profilePage(name); });
    app.querySelector('.report-btn')?.addEventListener('click', () => reportModal(u.name, 'user'));
    app.querySelector('.unfriend')?.addEventListener('click', () => confirmModal('Unfriend', `Unfriend ${esc(u.name)}?`, 'Unfriend', async () => { await api('DELETE', '/api/friends/' + encodeURIComponent(u.name)); profilePage(name); }));
    app.querySelectorAll('button[data-badge]').forEach(b => b.onclick = async () => {
      try { await api('PUT', '/api/me/badge', { badge: b.dataset.badge }); toast('Badge updated'); profilePage(name); }
      catch (e) { toast(e.message, true); }
    });
    app.querySelector('.edit-bio')?.addEventListener('click', () => {
      const p = app.querySelector('.bio'); p.outerHTML = `<div class="bio-edit"><textarea maxlength="300" rows="3">${esc(u.bio)}</textarea><button class="btn-primary">Save</button></div>`;
      app.querySelector('.bio-edit button').onclick = async () => { await api('PUT', '/api/me/bio', { bio: app.querySelector('.bio-edit textarea').value }); profilePage(name); };
    });
  });
}

// Load a game from a .fun file: JSON with the game's Name, description and
// world (parts + scripts). Creates it as a new private experience and opens
// it in Studio. The server sanitizes the world on POST /api/games.
async function importFunFile(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('That .fun file is too big (max 5 MB)', true); return; }
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast('That file is not a valid .fun file', true); return; }
  const base = file.name.replace(/\.(fun|json)$/i, '');
  const name = String(data?.name || base || 'Untitled Game').slice(0, 50);
  const world = data?.world;
  if (!world || typeof world !== 'object' || !Array.isArray(world.parts)) { toast('This .fun file has no game world in it', true); return; }
  toast('Loading ' + name + '…');
  const g = await api('POST', '/api/games', { name, description: String(data.description || '').slice(0, 1000), world, publish: false });
  if (g?.id) { toast('Loaded ' + name + ' — opened in Studio'); location.hash = '#/studio/' + g.id; }
  else toast('Could not load that .fun file', true);
}

async function createPage() {
  const mine = await api('GET', '/api/mygames');
  const tpls = [['baseplate', 'Baseplate', 'An empty grey baseplate. A blank canvas.'], ['heistCity', '🚔 Heist City', 'Cops and robbers! Rob the bank, break out of jail, rule the streets.'], ['whodunit', '🔍 Whodunit Mansion', 'A murder mystery mansion. Question the suspects, find the evidence.'], ['hauntedHotel', '🚪 Haunted Hotel', '20 doors. Something is down the hall. Find the exit.'], ['bedBattle', '🛏️ Bed Battle', 'Team islands, bridges and blasters. Protect your bed!'], ['forestCamp', '🔥 Forest Camp', 'Survive the nights. Keep the campfire burning.'], ['petHatchery', '🥚 Pet Hatchery', 'Hatch eggs, collect coins, grow your pet crew.'], ['lostTemple', '🗿 Temple of the Lost Idol', 'Jungle adventure! Cross the lava river, ride the moving stones, claim the Golden Idol.'], ['skyPirates', '🏴‍☠️ Sky Pirate Isles', 'Sail the skies! Hop floating islands, bounce between them, find the treasure.'], ['dungeonQuest', '⚔️ Deep Dungeon Quest', 'A torch-lit dungeon crawl. Dodge the skeletons and spike traps, reach the exit portal.']];
  mount('create', `
    <h1>Create</h1>
    <div class="av-tabs"><button class="active"><span class="ic">${icons.gamepad}</span> Experiences</button><button data-goto="#/ugc"><span class="ic">${icons.palette}</span> UGC Studio</button><button data-goto="#/funai"><span class="ic">${icons.sparkles}</span> FunAI</button></div>
    <a href="#/funai" style="display:block;text-decoration:none;background:var(--grad);color:#fff;border-radius:14px;padding:14px 18px;margin-bottom:16px;box-shadow:var(--glow)"><span style="font-weight:900;font-size:18px"><span class="ic">${icons.sparkles}</span> Make a game with FunAI</span><span style="display:block;font-size:13px;font-weight:600;opacity:.9">Describe any game — FunAI builds it as a Studio world you can edit + publish →</span></a>
    <a href="#/2ui/new" style="display:block;text-decoration:none;background:linear-gradient(135deg,#ec4899,#7c3aed);color:#fff;border-radius:14px;padding:14px 18px;margin-bottom:16px"><span style="font-weight:900;font-size:18px">🖥️ Make a 2UI Game</span><span style="display:block;font-size:13px;font-weight:600;opacity:.9">A GUI-only game — buttons, coins and labels, no 3D world. Players build their own and everyone can play them →</span></a>
    <section><div class="sec-h"><h2>Start a New Experience</h2></div><div class="tpl-grid">${tpls.map(([k, n, d]) => `
      <a class="tpl" href="#/studio/new/${k}"><div class="gc-thumb"><img data-tpl="${k}" src="${PLACEHOLDER}"></div><b>${n}</b><span class="muted small">${d}</span></a>`).join('')}</div></section>
    <section><div class="sec-h"><h2>Generated Worlds (${GEN_GAMES.length})</h2></div>
      <p class="muted">216 ready-made worlds — obbies, coin rushes, towers, mazes, races and arenas across 12 themes. Tap one to open it in Studio and make it yours.</p>
      <div class="gen-grid">${GEN_GAMES.map(g => `<a class="gen-tile" href="#/studio/new/${g.key}"><b>${esc(g.name)}</b><span class="muted small">${esc(g.desc)}</span></a>`).join('')}</div></section>
    <section><div class="sec-h"><h2>Load a .fun file</h2></div>
      <p class="muted">Got a <b>.fun</b> game file? It holds the game's scripts and a JSON with its name — load it and it opens as a new experience you can edit in Studio.</p>
      <div class="row"><button class="btn-secondary" id="funImportBtn"><span class="ic">${icons.upload}</span> Choose a .fun file…</button><input type="file" id="funImport" accept=".fun,application/json" hidden></div></section>
    <section><div class="sec-h"><h2>My Experiences (${mine.length})</h2></div>
      <div class="my-games">${mine.map(g => `<div class="my-game"><img ${g.thumbnail ? `src="${g.thumbnail}"` : `src="${PLACEHOLDER}" data-thumb="${g.id}"`}><div class="mg-info"><b>${g.icon ? esc(g.icon) + ' ' : ''}${esc(g.name)}</b><span class="muted small">${g.unpublished ? 'Private (not published)' : 'Public'}${g.status === 'pending' ? ' · ⏳ Awaiting review — moderators check new games before they go public' : g.status === 'rejected' ? ' · Rejected by moderators — it stays hidden' : ''} &middot; ${fmt(g.visits)} visits &middot; ${fmt(g.playing)} playing</span></div>
        <a class="btn-secondary" href="#/${g.is2ui ? '2ui' : 'studio'}/${g.id}">Edit</a><a class="btn-secondary" href="#/games/${g.id}">View</a><button class="btn-danger" data-del="${g.id}">Delete</button></div>`).join('') || '<p class="muted">You haven\'t made anything yet. Pick a template above to open Funtopia Studio!</p>'}</div></section>`, () => {
    app.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => location.hash = b.dataset.goto);
    setTimeout(() => app.querySelectorAll('img[data-tpl]').forEach(img => { img.src = tplThumb(img.dataset.tpl); }), 30);
    app.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirmModal('Delete Experience', 'This cannot be undone. Delete it?', 'Delete', async () => { await api('DELETE', '/api/games/' + b.dataset.del); createPage(); }));
    app.querySelector('#funImportBtn').onclick = () => app.querySelector('#funImport').click();
    app.querySelector('#funImport').onchange = e => importFunFile(e.target.files[0]);
  });
}
const tplCache = {};
function tplThumb(k) { return tplCache[k] ||= worldThumbnail(templates[k]()); }

async function studioPage(id, tpl) {
  let g;
  if (id === 'new') g = { id: null, name: 'My ' + ({ baseplate: 'Baseplate', heistCity: 'Heist City', whodunit: 'Whodunit Mansion', hauntedHotel: 'Haunted Hotel', bedBattle: 'Bed Battle', forestCamp: 'Forest Camp', petHatchery: 'Pet Hatchery', lostTemple: 'Temple of the Lost Idol', skyPirates: 'Sky Pirate Isles', dungeonQuest: 'Deep Dungeon Quest' }[tpl] || 'Game'), description: '', world: (templates[tpl] || templates.baseplate)() };
  else { g = await api('GET', '/api/games/' + id); if (g.creator.toLowerCase() !== me.name.toLowerCase()) { toast('You can only edit your own games', true); location.hash = '#/games/' + id; return; } }
  if (overlayMode) app.classList.add('fullscreen'); else app.className = 'fullscreen';
  app.innerHTML = '<div class="studio-container"></div>';
  let game = null;
  const { Studio } = await import('./studio.js?v=5cc84738');
  const studio = new Studio(app.querySelector('.studio-container'), {
    gameId: g.id, name: g.name, description: g.description, icon: g.icon, world: g.world, api, toast, aiAccess: me.aiAccess,
    onCreated: newId => history.replaceState(null, '', '#/studio/' + newId),
    onExit: gid => { cleanup = null; location.hash = gid ? '#/create' : '#/create'; },
    playTest: async (box, world, name, done) => {
      const { Game: GameClass } = await import('./game.js?v=8a7d3c0d');
      game = new GameClass(box, { world, gameName: name + ' (Test)', me, token, test: true, onExit: () => { game = null; done(); } });
    },
  });
  cleanup = () => { game?.destroy(); studio.destroy(); };
}

async function leaderboardPage() {
  const lb = await api('GET', '/api/leaderboard');
  setMoney(lb);
  mount('leaderboard', `<h1>FunTix Leaderboard</h1>
    <div class="lb-me">${tix}<span>You have <b>${fmt(lb.funtix)}</b> FunTix</span><span class="lb-rank">Your rank <b>#${lb.rank}</b> of ${lb.total}</span></div>
    <div class="lbp">${lb.top.map((u, i) => `
      <a class="lbp-row${u.name === me.name ? ' me' : ''}${i < 3 ? ' top' + (i + 1) : ''}" href="#/users/${encodeURIComponent(u.name)}">
        <span class="lbp-rank">${i + 1}</span>${avatarImgTag(u.avatar)}
        <span class="lbp-name">${badgeIcon(u.badge)}${esc(u.name)}${u.online ? '<i class="dot" title="Online"></i>' : ''}</span>
        <span class="lbp-tix">${tix}${u.funtix.toLocaleString()}</span></a>`).join('')}</div>`);
}
// ---------- Moderation ----------
const MOD_POLICY = `
<h3>Admin levels</h3>
<p><b>Owner</b> — full control, including granting and removing admins. <b>Admin</b> — everything except managing other admins. <b>Moderator</b> — mute, kick, review the report queue, and start bans (which still need a second person to confirm). @fun is the site owner — the highest level; no one can outrank or demote the owner. No level can take action against someone at the same level or higher.</p>
<h3>What moderators do</h3>
<p>Review content players report, mute disruptive players (up to 24 hours), remove players from game sessions, and escalate serious cases. Moderators never get extra FunTix, items, or admin powers — just safety tools.</p>
<h3>Automated first pass</h3>
<p>Every report is scanned automatically and labeled <b>clear</b>, <b>needs review</b>, or <b>urgent</b>. Threats and shared personal info (phone numbers, emails) are always urgent. The automated pass never mutes, kicks, or bans anyone — it only decides what humans look at first.</p>
<h3>Bans need two people</h3>
<p>No ban takes effect until two different moderators or admins confirm it separately. One person can never ban alone.</p>
<h3>What moderators see</h3>
<p>Only content players reported. Moderators do not get a feed of everyone's activity — no surveillance, just the report queue.</p>
<h3>Safety basics</h3>
<p>Never share personal info (phone, email, address, school) in chat, messages, or game names. Threats and targeted harassment are treated as urgent. If someone is bothering you, report them from their profile.</p>`;

function reportModal(target, type = 'user') {
  const d = document.createElement('div'); d.className = 'modal-bg';
  d.innerHTML = `<div class="modal"><h2>Report ${esc(target)}</h2>
    <p class="muted small">Reports go to the moderator review queue. An automated first pass labels it, then a human reviews it.</p>
    <label>Reason<select class="rp-reason">${['Harassment', 'Spam', 'Cheating', 'Inappropriate content', 'Sharing personal info', 'Threats', 'Other'].map(r => `<option>${r}</option>`).join('')}</select></label>
    <label>Details<textarea class="rp-details" maxlength="500" rows="3" placeholder="What happened? (optional)"></textarea></label>
    <div class="modal-actions"><button class="btn-secondary rp-cancel">Cancel</button><button class="btn-primary rp-send">Send Report</button></div></div>`;
  document.body.appendChild(d);
  d.querySelector('.rp-cancel').onclick = () => d.remove();
  d.onclick = e => { if (e.target === d) d.remove(); };
  d.querySelector('.rp-send').onclick = async () => {
    const reason = d.querySelector('.rp-reason').value;
    const details = d.querySelector('.rp-details').value.trim();
    try {
      const r = await api('POST', '/api/report', { type, target, reason, details });
      d.remove(); toast(r.message || 'Report sent');
    } catch (e) { toast(e.message, true); }
  };
}

async function moderationPage() {
  const mods = await api('GET', '/api/moderators').catch(() => []);
  const isMod = !!(me?.moderator || me?.admin);
  let queue = [], pending = [], log = [], ugcPending = [], gamesPending = [];
  if (isMod) {
    queue = await api('GET', '/api/mod/queue').catch(() => []);
    pending = await api('GET', '/api/mod/ban/pending').catch(() => []);
    log = await api('GET', '/api/mod/log').catch(() => []);
    ugcPending = await api('GET', '/api/ugc/pending').catch(() => []);
    gamesPending = await api('GET', '/api/games/pending').catch(() => []);
    for (const u of ugcPending) if (!ITEM[u.id]) ITEM[u.id] = { id: u.id, type: u.type, name: u.name, price: u.price, color: u.color, template: u.template, model_url: u.model_url || null, model_transform: u.model_transform || null, creator: u.creator, ugc: true };
  }
  const badge = l => l === 'urgent' ? '<span class="mod-urgent">URGENT</span>' : l === 'review' ? '<span class="mod-review">REVIEW</span>' : '<span class="mod-clear">CLEAR</span>';
  const reload = () => moderationPage();
  mount('moderation', `<h1><span class="ic">${icons.shield}</span> Moderation</h1>
    <section><div class="sec-h"><h2>Policy</h2></div><div class="mod-policy">${MOD_POLICY}</div></section>
    <section><div class="sec-h"><h2>Staff (${mods.length})</h2></div>
      <div class="friends-row">${mods.map(m => `<a class="user-tile" href="#/users/${encodeURIComponent(m.name)}"><div class="ut-name"><span class="ic">${icons.shield}</span> ${esc(m.name)}</div><div class="ut-game">${esc((m.role || 'moderator').toUpperCase())}</div></a>`).join('')}</div></section>
    ${isMod ? `
    <section><div class="sec-h"><h2>Review Queue (${queue.length})</h2></div>
      ${queue.map(r => `<div class="mod-report">${badge(r.label)}
        <div class="mod-report-body"><b>${esc(r.type)}: ${r.type === 'user' ? `<a href="#/users/${encodeURIComponent(r.target)}">${esc(r.target)}</a>` : esc(r.target)}</b><div>${esc(r.reason)}</div>
        ${r.details ? `<div class="muted small">${esc(r.details)}</div>` : ''}
        <div class="muted small">Reported by ${esc(r.by)} · ${new Date(r.t).toLocaleString()}${r.flags.length ? ' · ' + r.flags.map(esc).join(', ') : ''}</div></div>
        <div class="mod-report-actions">
          <button class="btn-secondary btn-small" data-dismiss="${r.id}">Dismiss</button>
          ${r.type === 'user' ? `<button class="btn-secondary btn-small" data-mute="${esc(r.target)}">Mute</button>
          <button class="btn-secondary btn-small" data-kick="${esc(r.target)}">Kick</button>
          <button class="btn-danger btn-small" data-ban="${esc(r.target)}">Ban…</button>` : ''}
        </div></div>`).join('') || '<p class="muted">Queue is clear. 🎉</p>'}</section>
    <section><div class="sec-h"><h2>Bans awaiting second confirmation (${pending.length})</h2></div>
      ${pending.map(p => `<div class="mod-report"><div class="mod-report-body"><b>${esc(p.name)}</b>
        <div>${esc(p.reason)}${p.days ? ` (${p.days}d)` : ' (permanent)'}</div>
        <div class="muted small">Started by ${esc(p.by)} · expires ${new Date(p.expires).toLocaleTimeString()}</div></div>
        <div class="mod-report-actions">${p.by.toLowerCase() === me.name.toLowerCase()
          ? '<span class="muted small">Waiting for someone else to confirm</span>'
          : `<button class="btn-danger btn-small" data-confirm-ban="${p.token}" data-name="${esc(p.name)}">Confirm ban (2/2)</button>`}</div></div>`).join('') || '<p class="muted">None pending.</p>'}</section>
    <section><div class="sec-h"><h2>UGC Review (${ugcPending.length})</h2></div>
      ${ugcPending.map(u => `<div class="mod-report"><div class="cat-img">${u.model_url ? glbCardImg() : `<img src="${itemImage(u)}">`}</div>
        <div class="mod-report-body"><b>${esc(u.name)}</b><div>${u.type} · ${tix} ${u.price}</div>
        <div class="muted small">by ${esc(u.creator)}</div></div>
        <div class="mod-report-actions">
          ${u.model_url ? `<button class="btn-secondary btn-small" data-ugc-view="${u.id}">View 3D</button>` : ''}
          <button class="btn-primary btn-small" data-ugc-ok="${u.id}">Approve</button>
          <button class="btn-danger btn-small" data-ugc-no="${u.id}">Reject</button>
        </div></div>`).join('') || '<p class="muted">No UGC awaiting review.</p>'}</section>
    <section><div class="sec-h"><h2>Game Review (${gamesPending.length})</h2></div>
      ${gamesPending.map(g => `<div class="mod-report">
        <div class="mod-report-body"><b>${esc(g.name)}</b><div>by ${esc(g.creator)} · ${g.visits || 0} visits</div>
        <div class="muted small">${esc((g.description || '').slice(0, 200))}</div>
        <div class="muted small">Created ${g.created ? new Date(g.created).toLocaleString() : ''}</div></div>
        <div class="mod-report-actions">
          <a class="btn-secondary btn-small" href="#/games/${encodeURIComponent(g.id)}">View</a>
          <button class="btn-primary btn-small" data-game-ok="${g.id}">Approve</button>
          <button class="btn-danger btn-small" data-game-no="${g.id}">Reject</button>
        </div></div>`).join('') || '<p class="muted">No games awaiting review.</p>'}</section>
    <section><div class="sec-h"><h2>Action Log</h2></div>
      <div>${log.map(e => `<div class="mod-log-row"><span class="muted small">${new Date(e.t).toLocaleString()}</span><b>${esc(e.by)}</b><span class="mod-act">${esc(e.action)}</span><span>${esc(e.target)}</span><span class="muted small">${esc(e.reason || '')}</span></div>`).join('') || '<p class="muted">No actions yet.</p>'}</div></section>` : ''}`,
  () => {
    app.querySelectorAll('[data-dismiss]').forEach(b => b.onclick = async () => {
      try { await api('POST', '/api/mod/reports/' + b.dataset.dismiss, { action: 'dismiss' }); toast('Report dismissed'); reload(); }
      catch (e) { toast(e.message, true); }
    });
    app.querySelectorAll('[data-mute]').forEach(b => b.onclick = async () => {
      const minutes = parseInt(prompt(`Mute ${b.dataset.mute} for how many minutes? (max 1440)`, '30') || '0', 10);
      if (!minutes) return;
      const reason = prompt('Mute reason:', 'Disruptive behavior') || '';
      if (reason === null) return;
      try { await api('POST', '/api/mod/mute', { name: b.dataset.mute, minutes, reason }); toast(`Muted ${b.dataset.mute}`); reload(); }
      catch (e) { toast(e.message, true); }
    });
    app.querySelectorAll('[data-kick]').forEach(b => b.onclick = () => confirmModal('Kick player', `Kick ${esc(b.dataset.kick)} from their game session?`, 'Kick', async () => {
      try { await api('POST', '/api/mod/kick', { name: b.dataset.kick, reason: 'Kicked by a moderator' }); toast('Kicked'); reload(); }
      catch (e) { toast(e.message, true); }
    }));
    app.querySelectorAll('[data-ban]').forEach(b => b.onclick = async () => {
      const reason = prompt(`Ban ${b.dataset.ban}? Enter reason:`) || '';
      if (reason === null) return;
      const days = Math.max(0, parseInt(prompt('Ban duration in days (0 = permanent):', '0') || '0', 10));
      if (!confirm(`STEP 1 of 2: start a ban of ${b.dataset.ban}${days ? ` for ${days} days` : ' permanently'}? A DIFFERENT moderator or admin must confirm before it takes effect.`)) return;
      try { await api('POST', '/api/mod/ban/initiate', { name: b.dataset.ban, reason, days }); toast('First confirmation recorded — waiting for a second person.'); reload(); }
      catch (e) { toast(e.message, true); }
    });
    app.querySelectorAll('[data-confirm-ban]').forEach(b => b.onclick = () => confirmModal('Confirm ban (2/2)', `You are the SECOND confirmation. Ban ${esc(b.dataset.name)}? This takes effect immediately.`, 'Ban', async () => {
      try { const r = await api('POST', '/api/mod/ban/confirm', { token: b.dataset.confirmBan }); toast(r.message || 'Banned'); reload(); }
      catch (e) { toast(e.message, true); }
    }));
    app.querySelectorAll('[data-ugc-ok]').forEach(b => b.onclick = async () => {
      try { await api('POST', '/api/ugc/' + b.dataset.ugcOk + '/approve'); me = await api('GET', '/api/me'); await loadUgc(); toast('UGC item approved'); reload(); }
      catch (e) { toast(e.message, true); }
    });
    app.querySelectorAll('[data-ugc-no]').forEach(b => b.onclick = async () => {
      try { await api('POST', '/api/ugc/' + b.dataset.ugcNo + '/reject'); toast('UGC item rejected'); reload(); }
      catch (e) { toast(e.message, true); }
    });
    app.querySelectorAll('[data-game-ok]').forEach(b => b.onclick = async () => {
      try { await api('POST', '/api/games/' + b.dataset.gameOk + '/approve'); toast('Game approved — it is now public'); reload(); }
      catch (e) { toast(e.message, true); }
    });
    app.querySelectorAll('[data-game-no]').forEach(b => b.onclick = async () => {
      try { await api('POST', '/api/games/' + b.dataset.gameNo + '/reject'); toast('Game rejected — it stays hidden'); reload(); }
      catch (e) { toast(e.message, true); }
    });
    app.querySelectorAll('[data-ugc-view]').forEach(b => b.onclick = () => {
      const u = ugcPending.find(x => x.id === b.dataset.ugcView);
      if (u) ugcGlbModal(u);
    });
  });
}

// Moderator 3D preview for GLB UGC items
async function ugcGlbModal(u) {
  const A3 = await ensureAvatar3d().catch(() => null);
  const d = document.createElement('div'); d.className = 'modal-bg';
  d.innerHTML = `<div class="modal"><h2>${esc(u.name)}</h2>
    <canvas class="glb-canvas" width="360" height="360"></canvas>
    <p class="muted small">by ${esc(u.creator)} · ${u.type} · ${tix} ${u.price}</p>
    <div class="modal-actions"><button class="btn-secondary">Close</button><button class="btn-primary" data-ok>Approve</button><button class="btn-danger" data-no>Reject</button></div></div>`;
  document.body.appendChild(d);
  let alive = true;
  const close = () => { alive = false; d.remove(); };
  const decide = async (kind) => {
    try { await api('POST', '/api/ugc/' + u.id + '/' + kind); if (kind === 'approve') me = await api('GET', '/api/me'); await loadUgc(); toast(kind === 'approve' ? 'Approved' : 'Rejected'); }
    catch (e) { toast(e.message, true); }
    close(); route();
  };
  d.querySelector('.btn-secondary').onclick = close;
  d.onclick = e => { if (e.target === d) close(); };
  d.querySelector('[data-ok]').onclick = () => decide('approve');
  d.querySelector('[data-no]').onclick = () => decide('reject');
  if (A3) {
    const canvas = d.querySelector('.glb-canvas');
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); r.outputColorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff', '#888', 1.5));
    const dl = new THREE.DirectionalLight('#fff', 1.6); dl.position.set(3, 6, 8); sc.add(dl);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 0.5, 7); cam.lookAt(0, 0, 0);
    const holder = new THREE.Group(); sc.add(holder);
    A3.loadUgcGlb(u.model_url, 2.4, u.model_transform).then(g => { if (alive) holder.add(g); }).catch(() => toast('Could not load model', true));
    const tick = () => { if (!alive) { r.dispose(); return; } requestAnimationFrame(tick); holder.rotation.y += 0.012; r.render(sc, cam); };
    tick();
  }
}

const adminDeps = { api, mount, esc, avatarImgTag, toast, loadBadgeDefs, tix, CLUB, ADMIN, ensureAvatar3d, get me() { return me; }, get BADGE_DEFS() { return BADGE_DEFS; } };
const ugcDeps = { api, mount, esc, tix, fmt, toast, itemImage, loadUgc, ensureAvatar3d, ugcCardImg, setCleanup: fn => { cleanup = fn; }, get me() { return me; } };
const funaiDeps = { api, mount, esc, toast, get me() { return me; } };
const suggestDeps = { api, mount, esc, toast, get me() { return me; } };
const forumsDeps = { api, mount, esc, toast, get me() { return me; } };
const donateDeps = { api, mount, esc, toast, get me() { return me; } };
const familyDeps = { api, mount, esc, toast, avatarImgTag, setCleanup: fn => { cleanup = fn; }, get me() { return me; } };
const parentDeps = { api, mount, esc, toast, avatarImgTag, switchAccount, addAccount, switchToToken, get token() { return token; }, setCleanup: fn => { cleanup = fn; }, get me() { return me; } };
const themesDeps = { api, mount, esc, toast, applyTheme, get me() { return me; } };
const twoUiDeps = { api, mount, esc, toast, setCleanup: fn => { cleanup = fn; }, get me() { return me; } };
const tradeDeps = { api, mount, esc, toast, setCleanup: fn => { cleanup = fn; }, get me() { return me; } };
const petsDeps = { api, mount, esc, toast, setCleanup: fn => { cleanup = fn; }, get me() { return me; } };
const tokensDeps = { api, mount, esc, toast, setCleanup: fn => { cleanup = fn; }, get me() { return me; } };
const skinmakerDeps = { api, mount, esc, toast, avatarImgTag, avatarImage, setMoney, get me() { return me; } };
const horrorDeps = { avatarImgTag, esc, route, get me() { return me; }, getCleanup: () => cleanup, setCleanup: fn => { cleanup = fn; } };
const lobbyDeps = { api, esc, fmt, toast, avatarImgTag, setCleanup: fn => { cleanup = fn; }, get me() { return me; } };
async function adminPage(q = '') {
  const m = await import('./admin.js?v=8ed74524');
  return m.adminPage(adminDeps, q);
}
async function ownerPage(q = '') {
  const m = await import('./admin.js?v=8ed74524');
  return m.ownerPage(adminDeps, q);
}

function clubPage() {
  const bal = me.funtix ?? 0, active = me.club, short = ECON.CLUB_PRICE - bal;
  const days = Math.ceil(((me.clubUntil || 0) - Date.now()) / 86400000);
  mount('club', `
    <div class="club-hero">
      <div class="club-logo">${LOGO}${CLUB}</div>
      <div class="club-info"><h1>FriendClub</h1><p class="muted">The membership for true Funtopia fans.</p>
        <div class="club-status ${active ? 'on' : ''}">${me.clubForever ? `${CLUB} You have free FriendClub forever${me.admin ? ' (admin)' : ''}!` : active ? `${CLUB} You're a member! ${days} day${days === 1 ? '' : 's'} left` : 'You are not a member yet.'}</div>
        ${me.clubForever ? '' : `<button class="btn-primary club-join" ${short > 0 ? 'disabled' : ''}>${active ? 'Renew' : 'Join'} for ${tix} ${ECON.CLUB_PRICE} &middot; ${ECON.CLUB_DAYS} days</button>`}
        ${!me.clubForever && short > 0 ? `<div class="muted small">You need ${short} more FunTix. <a href="#/funtix">How to earn</a></div>` : ''}
      </div>
    </div>
    <h2>Member Benefits</h2>
    <div class="bux-ways">
      <div class="bux-way"><h3>${tix} +${ECON.CLUB_DAILY} Daily FunTix</h3><p>Get ${ECON.DAILY_TIX + ECON.CLUB_DAILY} FunTix every day instead of ${ECON.DAILY_TIX}.</p></div>
      <div class="bux-way"><h3>${tix} Double Playtime FunTix</h3><p>Earn ${ECON.PLAY_TIX * ECON.CLUB_PLAY_MULT} FunTix per minute of play instead of ${ECON.PLAY_TIX}.</p></div>
      <div class="bux-way"><h3>${CLUB} Member Badge</h3><p>A gold hard hat next to your name on your profile, the leaderboard, in chat and above your head in games.</p></div>
      <div class="bux-way"><h3>🎨 App Themes</h3><p>Switch the whole site between themes — Classic Roblox, Rock, Ocean and more. <a href="#/themes">Pick a theme</a></p></div>
      <div class="bux-way"><h3>Exclusive Hard Hat</h3><p>The FriendClub Hard Hat goes straight into your inventory. Only members can get it.</p></div>
    </div>`, () => {
    const jb = app.querySelector('.club-join');
    if (jb) jb.onclick = () => confirmModal(active ? 'Renew FriendClub' : 'Join FriendClub',
      `Spend ${tix} ${ECON.CLUB_PRICE} FunTix for ${ECON.CLUB_DAYS} days of FriendClub?`, active ? 'Renew' : 'Join', async () => {
        try {
          const r = await api('POST', '/api/club/join');
          Object.assign(me, { club: true, clubUntil: r.clubUntil, inventory: r.inventory }); setMoney(r);
          toast(active ? 'FriendClub renewed!' : 'Welcome to FriendClub!'); clubPage();
        } catch (e) { toast(e.message, true); }
      });
  });
}
function funtixPage() {
  mount('funtix', `<h1>FunTix</h1>
    <div class="bux-hero">${tix}<div><div class="bux-big me-tix">${fmt(me.funtix ?? 0)}</div><div class="muted">Your balance</div></div></div>
    <h2>How to Earn FunTix</h2>
    <div class="bux-ways">
      <div class="bux-way"><h3>${tix} Daily Reward</h3><p>Log in every day to get ${ECON.DAILY_TIX} free FunTix.</p></div>
      <div class="bux-way"><h3>${tix} Play Games</h3><p>Earn ${ECON.PLAY_TIX} FunTix for every minute you spend playing.</p></div>
      <div class="bux-way"><h3>${tix} Collect Coins</h3><p>Every gold coin you pick up in a game gives you ${ECON.COIN_TIX} FunTix.</p></div>
      <div class="bux-way"><h3>${tix} Beat Obbies</h3><p>Touch a Win Pad at the end of an obby for ${ECON.WIN_TIX} FunTix (once per visit).</p></div>
      <div class="bux-way"><h3>${CLUB} FriendClub</h3><p>Members get ${ECON.CLUB_DAILY} extra FunTix every day and double playtime FunTix. <a href="#/club">Learn more</a></p></div>
      <div class="bux-way"><h3>Spend Them</h3><p>Visit the <a href="#/catalog">Marketplace</a> to buy hats, faces and shirts for your avatar.</p></div>
    </div>`);
}

async function addonsPage() {
  const { addons } = await api('GET', '/api/addons');
  mount('addons', `<h1>Add-ons</h1><p class="muted">Connect Funtopia to other apps. You control exactly what each add-on can see.</p>
    <div class="addon-list">${addons.map(a => `
      <div class="addon-card" data-addon="${esc(a.id)}">
        <div class="addon-head">
          <div><h2>${esc(a.name)}</h2><p class="muted">${esc(a.description)}</p></div>
          <label class="switch"><input type="checkbox" class="addon-enabled" ${a.settings.enabled ? 'checked' : ''}><span></span></label>
        </div>
        <div class="addon-perms ${a.settings.enabled ? '' : 'disabled'}">
          ${a.permissions.map(p => `
            <label class="addon-perm"><input type="checkbox" data-perm="${esc(p.id)}" ${a.settings[p.id] !== false ? 'checked' : ''} ${a.settings.enabled ? '' : 'disabled'}>
              <div><strong>${esc(p.label)}</strong><div class="muted small">${esc(p.description)}</div></div>
            </label>`).join('')}
        </div>
      </div>`).join('') || '<p class="muted">No add-ons available yet.</p>'}
    </div>`, () => {
      document.querySelectorAll('.addon-card').forEach(card => {
        const id = card.dataset.addon;
        const enabledEl = card.querySelector('.addon-enabled');
        const save = async () => {
          const settings = { enabled: enabledEl.checked };
          card.querySelectorAll('[data-perm]').forEach(cb => { settings[cb.dataset.perm] = cb.checked; });
          const r = await api('POST', '/api/addons/' + encodeURIComponent(id), settings);
          if (r.ok) { toast(esc(id) + (settings.enabled ? ' enabled' : ' disabled')); addonsPage(); }
          else toast('Could not save');
        };
        enabledEl.addEventListener('change', save);
        card.querySelectorAll('[data-perm]').forEach(cb => cb.addEventListener('change', save));
      });
    });
}


// ---------- router ----------
let routing = 0;
// ---------- splash intro ----------
// Full-screen FunTopia intro on first load each session: the logo pops in,
// the wordmark + "Made by BoldPStudios" slide up, then it fades out to reveal
// the site. Tap anywhere to skip. Plays once per tab session (sessionStorage).
// One-time launch cinematic (u155): the first time a logged-in player opens
// the lobby, the launch animation plays INSTEAD of this intro — the character
// cuts the ribbon and the Beta tag comes off. Never on the login page
// (token && me are only both set after the contract gate).
let introShown = false;
function showIntro() {
  if (introShown) return;
  introShown = true;
  try { if (sessionStorage.getItem('ff_intro_seen')) return; sessionStorage.setItem('ff_intro_seen', '1'); } catch {}
  if (token && me) {
    try { if (showLaunch(me)) return; } catch {}
  }
  const el = document.createElement('div');
  el.id = 'ff-intro';
  el.innerHTML = `<div class="ff-intro-inner">
    <div class="ff-intro-logo">${LOGO}</div>
    <div class="ff-intro-word">FUNTOPIA</div>
    <div class="ff-intro-credit">Made by <b>BoldPStudios</b></div>
    <div class="ff-intro-skip">Tap to skip</div>
  </div>`;
  document.body.appendChild(el);
  let done = false;
  const close = () => {
    if (done) return;
    done = true;
    el.classList.add('ff-intro-out');
    setTimeout(() => el.remove(), 550);
  };
  el.addEventListener('click', close);
  setTimeout(close, 2600);
}

async function route() {
  const my = ++routing;
  if (cleanup) { const c = cleanup; cleanup = null; c(); }
  const [path, query] = location.hash.slice(1).split('?');
  const seg = (path || '/home').split('/').filter(Boolean);
  if (!token && isEmbed() && seg[0] !== 'login') { try { await startGuest(); } catch {} if (my !== routing) return; }
  if (!token && seg[0] !== 'horror' && seg[0] !== 'safety-qa') { if (seg[0] !== 'login') history.replaceState(null, '', '#/login'); renderActingBanner(); showIntro(); return loginPage(); }
  try {
    if (!me) { me = await api('GET', '/api/me'); if (!me.guest) dailyToast(me); await loadUgc(); }
    renderActingBanner();
    renderGuestBadge(seg[0]);
    // Safety (Phase 1): existing players must agree to the Safety Contract
    // before the lobby (or any page) mounts. Agreeing re-runs route().
    if (!me.contractAgreed) { showContractGate(); return; }
    applyTheme();
    showIntro();
    if (my !== routing) return;
    const qp = new URLSearchParams(query || '');
    // No shell anymore: page routes render the lobby first, then open the page
    // in the lobby overlay (direct loads included).
    const LOBBY_PAGE_ROUTES = new Set(['discover', 'games', 'play', 'create', 'users', 'friends', 'messages', 'groups', 'updates', 'avatar', 'catalog', 'ugc', 'suggest', 'studio', 'scripts', 'leaderboard', 'club', 'admin', 'settings', 'owner', 'moderation', 'funtix', 'addons', 'funai', 'skinmaker', 'themes', 'family', 'parent', '2ui', 'trades', 'trade', 'pets', 'tokens', 'safety-contract', 'forums', 'safety-qa', 'donate']);
    if (LOBBY_PAGE_ROUTES.has(seg[0]) && !overlayMode) {
      await renderLobby();
      window.__openLobbyOverlay?.(location.hash);
      return;
    }
    if (overlayMode) {
      // Direct hash changes (back/forward, pasted links) bypass openOverlay,
      // so paint the loading state here too — otherwise the previous page
      // sits stale (or blank) until the new page's API calls resolve.
      app.innerHTML = '<div class="ov-loading"><div class="ov-spinner"></div><p>Loading…</p></div>';
    }
    switch (seg[0]) {
      case 'login': location.hash = '#/home'; return;
      case 'home': case 'lobby': {
        if (overlayMode) {
          // Slide the overlay away at once (closeOverlay also clears the
          // overlay app state) so the live lobby underneath shows while
          // renderLobby fetches fresh data — otherwise the dead game
          // canvas stays on screen (black) until the APIs resolve.
          if (window.__closeLobbyOverlay) window.__closeLobbyOverlay();
          else window.__clearOverlayApp();
        }
        return renderLobby();
      }
      case 'discover': return await discoverPage(qp.get('q'));
      case 'games': return await gamePage(seg[1]);
      case 'play': return await playPage(seg[1], qp.get('server'), qp.get('voice') === '1');
      case 'create': return await createPage();
      case 'users': return await profilePage(decodeURIComponent(seg[1] || ''));
      case 'friends': return await friendsPage();
      case 'messages': return seg[1] ? await dmPage(decodeURIComponent(seg[1])) : await messagesPage();
      case 'groups': return groupsPage();
      case 'updates': return updatesPage();
      case 'avatar': return avatarPage();
      case 'catalog': return await catalogPage(seg[1]);
      case 'ugc': { const m = await import('./ugc-studio.js?v=655e7564'); return m.ugcPage(ugcDeps); }
      case 'suggest': { const m = await import('./suggest.js?v=8c9eb7b4'); return m.suggestPage(suggestDeps); }
      case 'donate': { const m = await import('./donate.js?v=4aa6fdd7'); return m.donatePage(donateDeps); }
      case 'family': { const m = await import('./family.js?v=ac1cc607'); return m.familyPage(familyDeps); }
      case 'parent': { const m = await import('./parent.js?v=parentp2'); if (seg[1]) return m.parentChildPage(parentDeps, decodeURIComponent(seg[1])); return m.parentPage(parentDeps); }
      case 'forums': {
        const m = await import('./forums.js?v=p3forums1');
        if (seg[1]) return m.forumThreadPage(forumsDeps, decodeURIComponent(seg[1]));
        return m.forumsPage(forumsDeps);
      }
      case 'safety-qa': { const m = await import('./forums.js?v=p3forums1'); return m.safetyQaPage(forumsDeps); }
      case '2ui': { const m = await import('./two-ui.js?v=c35306d5'); if (seg[1] === 'new') return m.twoUiStudioPage(twoUiDeps, null); if (seg[1]) return m.twoUiStudioPage(twoUiDeps, seg[1]); return m.twoUiBrowsePage(twoUiDeps); }
      case 'trades': { const m = await import('./trade.js?v=e8b79a46'); return m.tradePage(tradeDeps); }
      case 'trade': { const m = await import('./trade.js?v=e8b79a46'); return m.tradeWithPage(tradeDeps, decodeURIComponent(seg[1] || '')); }
      case 'pets': { const m = await import('./pets.js?v=64f4d79c'); return m.petsPage(petsDeps); }
      case 'tokens': { const m = await import('./tokens.js?v=a42cbc9b'); return m.tokensPage(tokensDeps); }
      case 'studio': return await studioPage(seg[1], seg[2]);
      case 'scripts': { const m = await import('./scripts-page.js?v=e6be93e9'); return m.scriptsPage(D); }
      case 'leaderboard': return await leaderboardPage();
      case 'club': return clubPage();
      case 'admin': if (me && me.owner) { location.hash = '#/owner'; return; } return await adminPage();
      case 'settings': return settingsPage();
      case 'safety-contract': return safetyContractPage();
      case 'owner': return await ownerPage();
      case 'hacker': if (me && me.owner) { try { if (!hackMod) hackMod = await import('./hacker.js?v=bbfe7e93'); hackMod.openHackerPanel({ api, toast, me }); } catch {} } history.replaceState(null, '', '#/home'); if (overlayMode) window.__clearOverlayApp(); return renderLobby(); // phone alt to typing "hack" (unlinked; non-owners land on home)

      case 'moderation': return await moderationPage();
      case 'funtix': case 'funbux': return funtixPage();
      case 'horror': { const m = await import('./horror.js?v=HORROR_SHA'); return m.horrorPage(horrorDeps); }
      case 'addons': return await addonsPage();
      case 'funai': { const m = await import('./funai.js?v=2518b14a'); return m.funaiPage(funaiDeps); }
      case 'skinmaker': { const m = await import('./skinmaker.js?v=9c614b88'); return m.skinmakerPage(skinmakerDeps); }
      case 'themes': return themesPage(themesDeps);
      default: location.hash = '#/home'; return;
    }
  } catch (e) {
    if (!token) return;
    mount('', `<div class="error-page"><h1>Oops!</h1><p>${esc(e.message)}</p><a class="btn-primary" href="#/home">Go Home</a></div>`);
  }
}
addEventListener('hashchange', () => { route(); });


loadBadgeDefs();
async function refreshNotif() {
  if (!token || !me) return;
  try {
    const n = await api('GET', '/api/notifications');
    const b = document.querySelector('.tb-bell-n');
    if (b) { b.textContent = n.unread > 99 ? '99+' : n.unread; b.classList.toggle('hidden', !n.unread); }
  } catch {}
}
setInterval(async () => {
  if (!token || !me) return;
  try { const r = await api('POST', '/api/ping'); setMoney(r); dailyToast(r); if (r.requests !== me.requests.length) { me = await api('GET', '/api/me'); } } catch {}
  refreshNotif();
}, 20000);
refreshNotif();

// ---------- IKNOW GLITCH MODE ----------
if (location.pathname.startsWith('/iknow')) {
  window.__iknowTimers = [];
  const gs = document.createElement('style');
  gs.textContent = `
  @keyframes gshake { 0%{transform:translate(0)} 20%{transform:translate(-4px,3px) skewX(2deg)} 40%{transform:translate(5px,-2px)} 60%{transform:translate(-3px,-4px) skewX(-3deg)} 80%{transform:translate(4px,2px)} 100%{transform:translate(0)} }
  @keyframes grgb { 0%,100%{text-shadow:2px 0 #f0f,-2px 0 #0ff} 25%{text-shadow:-3px 0 #f0f,3px 0 #0ff} 50%{text-shadow:1px 2px #f0f,-1px -2px #0ff} 75%{text-shadow:-2px -1px #f0f,2px 1px #0ff} }
  @keyframes ghue { 0%,100%{filter:hue-rotate(0)} 50%{filter:hue-rotate(180deg)} }
  @keyframes gflick { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:.3} 94%{opacity:1} 97%{opacity:.6} 98%{opacity:1} }
  @keyframes gslice { 0%,100%{clip-path:inset(0 0 0 0)} 10%{clip-path:inset(20% 0 60% 0)} 20%{clip-path:inset(0 0 0 0)} 35%{clip-path:inset(60% 0 10% 0)} 50%{clip-path:inset(0 0 0 0)} 70%{clip-path:inset(10% 0 70% 0)} 85%{clip-path:inset(0 0 0 0)} }
  body.glitching #app { animation: gshake .25s infinite, gflick 3s infinite; }
  body.glitching h1, body.glitching h2, body.glitching h3, body.glitching p, body.glitching a, body.glitching button, body.glitching span { animation: grgb .4s infinite !important; }
  body.glitching img, body.glitching canvas { animation: ghue 2s infinite, gslice 1.5s infinite !important; }
  body.glitching::after { content:''; position:fixed; inset:0; pointer-events:none; z-index:99999;
    background:repeating-linear-gradient(0deg, rgba(0,0,0,.15) 0 1px, transparent 1px 3px); mix-blend-mode:overlay; }
  body.glitching::before { content:'I KNOW'; position:fixed; top:40%; left:50%; transform:translate(-50%,-50%) rotate(-8deg);
    font-size:15vw; font-weight:900; color:#f0f; z-index:100000; pointer-events:none; opacity:.12;
    text-shadow:4px 0 #0ff, -4px 0 #ff0; animation:gflick .8s infinite; }`;
  document.head.appendChild(gs);
  document.body.classList.add('glitching');
  // Flashing TV static overlay
  const sc = document.createElement('canvas');
  sc.id = 'iknow-static';
  sc.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:99998;pointer-events:none;opacity:0;mix-blend-mode:screen';
  document.body.appendChild(sc);
  const sctx = sc.getContext('2d');
  sc.width = 160; sc.height = 90;
  const sdata = sctx.createImageData(160, 90);
  function drawStatic() {
    const d = sdata.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255 | 0;
      d[i] = v; d[i+1] = v; d[i+2] = v; d[i+3] = 255;
    }
    sctx.putImageData(sdata, 0, 0);
  }
  drawStatic();
  (function staticLoop() {
    if (window.__iknowDead) return;
    drawStatic();
    const r = Math.random();
    sc.style.opacity = r < .12 ? (.5 + Math.random() * .5) : r < .4 ? (Math.random() * .25) : 0;
    window.__iknowTimers.push(setTimeout(staticLoop, 60 + Math.random() * 120));
  })();
  const glyphs = '█▓▒░<>/\\|#@$%&?!01';
  window.__iknowTimers.push(setInterval(() => {
    const els = document.querySelectorAll('#app p, #app span, #app a, #app h1, #app h2, #app h3, #app button');
    for (let i = 0; i < 6 && els.length; i++) {
      const el = els[Math.floor(Math.random() * els.length)];
      if (el.children.length || !el.textContent.trim()) continue;
      const t = el.textContent;
      const idx = Math.floor(Math.random() * t.length);
      el.textContent = t.slice(0, idx) + glyphs[Math.floor(Math.random() * glyphs.length)] + t.slice(idx + 1);
    }
    if (Math.random() < .3 && els.length) {
      const el = els[Math.floor(Math.random() * els.length)];
      el.style.transform = `translate(${(Math.random() - .5) * 30}px, ${(Math.random() - .5) * 30}px)`;
      setTimeout(() => el.style.transform = '', 180);
    }
  }, 400));
  console.log('%cI KNOW', 'font-size:60px;color:#f0f;text-shadow:3px 0 #0ff');
  // After 5 seconds... it takes you somewhere else
  window.__iknowTimers.push(setTimeout(() => {
    if (location.pathname.startsWith('/iknow')) location.hash = '#/horror';
  }, 5000));
}

route();
