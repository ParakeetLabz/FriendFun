// 🎉 Party transition FX — default → party mode (Nov 2026)
// Plays once per browser session when the 100 Players Party goes live:
// 1) the whole site glitches and breaks, 2) fades to black,
// 3) DJ Funtopia pops up and starts the music, 4) the partyfied site reveals.
// Skippable, reduced-motion aware. Music reuses the jam system (Blocky Bounce, 128 BPM).
import { startJam, stopJam, currentJam } from './jam.js?v=da88bb4b';

const SHOWN_KEY = 'ff-party-transition-shown';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let interacted = false;
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => { interacted = true; }, { once: true, passive: true }));
let partyJam = false; // true only when the party itself started the jam
let timers = [];

const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

// String-lights strip across the top of the site while the party is live.
let lightsEl = null, djFab = null;
function ensureLights(on) {
  if (on && !lightsEl) {
    lightsEl = document.createElement('div');
    lightsEl.className = 'party-lights';
    lightsEl.setAttribute('aria-hidden', 'true');
    lightsEl.innerHTML = '<span></span>'.repeat(14);
    document.body.appendChild(lightsEl);
  } else if (!on && lightsEl) { lightsEl.remove(); lightsEl = null; }
  if (on && !djFab) {
    djFab = document.createElement('button');
    djFab.className = 'party-dj-fab';
    djFab.title = 'Party music on/off';
    djFab.textContent = '🎧 DJ';
    djFab.onclick = () => {
      if (currentJam() === 'bounce' && partyJam) { stopJam(); partyJam = false; djFab.classList.remove('on'); }
      else { startJam('bounce'); partyJam = true; djFab.classList.add('on'); }
    };
    document.body.appendChild(djFab);
  } else if (!on && djFab) { djFab.remove(); djFab = null; }
}

export function setPartyLive(on) {
  document.body.classList.toggle('party-live', !!on);
  ensureLights(!!on);
  if (!on) stopPartyJam();
}

export function stopPartyJam() {
  if (partyJam) { stopJam(); partyJam = false; djFab?.classList.remove('on'); }
}

function confettiBurst() {
  const c = document.createElement('div');
  c.className = 'party-confetti party-burst';
  c.setAttribute('aria-hidden', 'true');
  const emojis = ['🎉', '✨', '🎊', '🎈', '🥳', '🪩'];
  c.innerHTML = Array.from({ length: 24 }, (_, i) => `<span style="left:${(i * 4.2) % 100}%;animation-delay:${(i % 8) * 0.25}s">${emojis[i % emojis.length]}</span>`).join('');
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 4500);
}

export function playPartyTransition() {
  if (document.querySelector('.party-transition')) return;
  sessionStorage.setItem(SHOWN_KEY, '1');
  const reduced = reduceMotion();
  const T = { glitch: reduced ? 500 : 2000, black: reduced ? 300 : 1000, dj: reduced ? 1200 : 3000, reveal: reduced ? 300 : 700 };
  const overlay = document.createElement('div');
  overlay.className = 'party-transition pt-glitch';
  overlay.innerHTML = `
    <div class="pt-glitch-text"><div class="pt-glitch-big">⚠️ SIGNAL LOST</div><div class="pt-glitch-sub">FUNTOPIA.EXE HAS STOPPED WORKING</div><div class="pt-glitch-err">ERR_PARTY_OVERLOAD // 0x000100</div></div>
    <div class="pt-cracks"><i></i><i></i><i></i><i></i></div>
    <div class="pt-dj-card">
      <div class="pt-spot"></div>
      <div class="pt-dj-emoji">🎧</div>
      <div class="pt-dj-name">DJ FUNTOPIA</div>
      <div class="pt-eq"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="pt-dj-track">▶ Blocky Bounce · 128 BPM</div>
      <button class="btn-primary pt-music-btn" ${interacted ? 'hidden' : ''}>🔊 Tap for music</button>
    </div>
    <button class="btn-secondary pt-skip">Skip ⏭</button>`;
  document.body.appendChild(overlay);
  document.body.classList.add('party-glitching');
  const musicBtn = overlay.querySelector('.pt-music-btn');
  if (musicBtn) musicBtn.onclick = () => { startJam('bounce'); partyJam = true; musicBtn.hidden = true; djFab?.classList.add('on'); };

  let done = false;
  function finish() {
    if (done) return; done = true;
    clearTimers();
    overlay.classList.add('pt-reveal');
    setTimeout(() => overlay.remove(), T.reveal);
    document.body.classList.remove('party-glitching');
    setPartyLive(true);
    confettiBurst();
  }
  overlay.querySelector('.pt-skip').onclick = finish;
  overlay.addEventListener('click', e => { if (e.target === overlay) finish(); });

  later(() => { // phase 2: fade to black
    overlay.classList.remove('pt-glitch');
    overlay.classList.add('pt-black');
    document.body.classList.remove('party-glitching');
  }, T.glitch);
  later(() => { // phase 3: the DJ pops up and the music starts
    overlay.classList.remove('pt-black');
    overlay.classList.add('pt-dj');
    startJam('bounce'); partyJam = true;
    if (interacted && musicBtn) musicBtn.hidden = true;
  }, T.glitch + T.black);
  later(finish, T.glitch + T.black + T.dj); // phase 4: the partyfied site shows up
}

export function partyTransitionShown() { return !!sessionStorage.getItem(SHOWN_KEY); }
