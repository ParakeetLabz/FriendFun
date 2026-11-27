// 🎀 FunTopia launch cinematic (u155) — plays ONCE per browser, the first
// time a logged-in player opens the lobby after launch:
//   1) the player's blocky R6 character walks in holding scissors,
//   2) the scissors snip the ribbon stretched across the screen,
//   3) the "Beta" tag peels off the FUNTOPIA wordmark and falls away,
//   4) only FUNTOPIA is left, with a confetti burst.
// Tap anywhere (or press Escape) to skip. No sound. The scissors, ribbon
// and bow are all drawn in code — no images, no external assets.
// The character is the player's own avatar (avatarImage from avatar3d.js);
// if that cannot load, the Fun Cube logo stands in instead.
import { LOGO } from './ui.js?v=a89886d1';

const SEEN_KEY = 'ff_launch_seen';
const CONFETTI_COLORS = ['#7c3aed', '#a855f7', '#3b82f6', '#facc15', '#ec4899', '#22c55e'];

// Scissors, drawn in code: purple finger loops, silver blades, pivot dot.
const SCISSORS_SVG = `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Scissors">
  <g fill="none" stroke="#7c3aed" stroke-width="7" stroke-linecap="round">
    <circle cx="26" cy="30" r="12"/><circle cx="26" cy="70" r="12"/>
    <path d="M38 38 L56 48"/><path d="M38 62 L56 52"/>
  </g>
  <path d="M58 50 L112 30 L115 37 L60 56 Z" fill="#d7dee8"/>
  <path d="M58 50 L112 70 L115 63 L60 44 Z" fill="#b9c4d4"/>
  <circle cx="58" cy="50" r="5" fill="#94a3b8"/>
</svg>`;

// Ribbon bow knot, drawn in code.
const BOW_SVG = `<svg viewBox="0 0 60 44" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ribbon bow">
  <path d="M30 22 L8 6 Q2 22 8 38 Z" fill="#e11d48"/>
  <path d="M30 22 L52 6 Q58 22 52 38 Z" fill="#e11d48"/>
  <path d="M26 24 L20 42 L28 42 Z" fill="#be123c"/>
  <path d="M34 24 L40 42 L32 42 Z" fill="#be123c"/>
  <circle cx="30" cy="22" r="7" fill="#be123c"/>
</svg>`;

export function showLaunch(me) {
  try { if (localStorage.getItem(SEEN_KEY)) return false; localStorage.setItem(SEEN_KEY, '1'); } catch {}
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('div');
  el.id = 'ff-launch';
  el.dataset.step = 'arrive';
  el.innerHTML = `<div class="ff-launch-inner">
    <div class="ff-launch-word">FUNTOPIA</div>
    <div class="ff-launch-beta">Beta</div>
    <div class="ff-launch-sub">Officially launched — no more Beta!</div>
    <div class="ff-launch-stage">
      <div class="ff-launch-ribbon"><div class="ff-ribbon-half ff-ribbon-left"></div><div class="ff-ribbon-half ff-ribbon-right"></div><div class="ff-ribbon-knot">${BOW_SVG}</div></div>
      <div class="ff-launch-char"><span class="ff-launch-char-img">${LOGO}</span></div>
      <div class="ff-launch-scissors">${SCISSORS_SVG}</div>
      <div class="ff-launch-confetti" aria-hidden="true"></div>
    </div>
    <div class="ff-launch-skip">Tap to skip</div>
  </div>`;
  document.body.appendChild(el);

  // Swap the Fun Cube placeholder for the player's own blocky character.
  // avatar3d loads lazily; if it cannot load, the logo simply stays.
  import('./avatar3d.js?v=2bf09633').then(m => {
    try {
      const url = m.avatarImage(me?.avatar, 'full');
      const slot = el.querySelector('.ff-launch-char-img');
      if (slot && url) slot.innerHTML = `<img src="${url}" alt="Your FunTopia character">`;
    } catch {}
  }).catch(() => {});

  let done = false;
  const timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  const close = () => {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', onKey);
    el.classList.add('ff-launch-out');
    setTimeout(() => el.remove(), 550);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  window.addEventListener('keydown', onKey);
  el.addEventListener('click', close);

  // Confetti pieces (CSS squares, no emoji font needed).
  const confetti = el.querySelector('.ff-launch-confetti');
  confetti.innerHTML = Array.from({ length: 28 }, (_, i) => {
    const c = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const left = (i * 37) % 100;
    const delay = ((i * 7) % 10) * 0.12;
    const size = 8 + (i % 3) * 3;
    const round = i % 4 === 0 ? '50%' : '2px';
    return `<span style="left:${left}%;background:${c};width:${size}px;height:${size}px;border-radius:${round};animation-delay:${delay}s"></span>`;
  }).join('');

  if (reduceMotion) {
    // No animation: show the finished state (ribbon cut, Beta gone) briefly.
    el.dataset.step = 'final';
    el.classList.add('ff-launch-cut', 'ff-launch-peeled', 'ff-launch-final');
    later(close, 1400);
    return true;
  }
  later(() => { el.dataset.step = 'snip'; el.classList.add('ff-launch-snip'); }, 900);
  later(() => { el.dataset.step = 'cut'; el.classList.add('ff-launch-cut'); }, 1700);
  later(() => { el.dataset.step = 'peel'; el.classList.add('ff-launch-peeled'); }, 2400);
  later(() => { el.dataset.step = 'final'; el.classList.add('ff-launch-final'); }, 3100);
  later(close, 4800);
  return true;
}
