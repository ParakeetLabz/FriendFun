// Dr. Pepper branding for themed players — original pixel art drawn in code
// (Dr. Pepper colors/style; no official logo file or can photo is used).
// A detailed pixel can, the crack bursts, and the header branding swap.
import { LOGO } from './ui.js?v=a89886d1';
import { icons } from './icons.js?v=1aa0a4d3';

// Detailed pixel Dr. Pepper can, drawn in a 48x72 space: silver top, red body
// with side shading, cream label with "Dr Pepper" text, cherry below.
export const PEPPER_CAN_INNER = `<rect x="8" y="0" width="32" height="5" fill="#d7d7d7"/><rect x="18" y="1" width="12" height="3" fill="#9a9a9a"/><rect x="6" y="5" width="36" height="63" fill="#c8102e"/><rect x="6" y="5" width="4" height="63" fill="#8a0d1f"/><rect x="38" y="5" width="4" height="63" fill="#8a0d1f"/><rect x="12" y="5" width="3" height="63" fill="#e02340" opacity="0.7"/><ellipse cx="24" cy="28" rx="20" ry="13" fill="none" stroke="#ffffff" stroke-width="1.5" transform="rotate(-8 24 28)"/><text x="24" y="26" font-size="10" fill="#ffffff" text-anchor="middle" font-family="Lobster, 'Brush Script MT', cursive">Dr</text><text x="24" y="38" font-size="9" fill="#ffffff" text-anchor="middle" font-family="Lobster, 'Brush Script MT', cursive">Pepper</text><text x="24" y="46" font-size="4.5" fill="#ffffff" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">Est. 1885</text><circle cx="24" cy="55" r="6.5" fill="none" stroke="#ffffff" stroke-width="1"/><text x="24" y="58" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">23</text><text x="24" y="66" font-size="4.5" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">12 OZ</text><rect x="6" y="68" width="36" height="4" fill="#5a0a12"/>`;
export const PEPPER_CAN = `<svg viewBox="0 0 48 72" shape-rendering="crispEdges" style="image-rendering:pixelated;display:block">${PEPPER_CAN_INNER}</svg>`;

// Live-swap the lobby header branding when the theme toggles: the logo becomes
// a Dr. Pepper can + "Dr Pepper" wordmark, and the FunTix coin becomes a can.
export function applyPepperBranding(on) {
  const mark = document.querySelector('.lb-logo-mark');
  const word = document.querySelector('.lb-logo-word');
  const tixIc = document.querySelector('.lb-tix .ic');
  if (mark) mark.innerHTML = on ? PEPPER_CAN : LOGO;
  if (word) { word.textContent = on ? 'Dr Pepper' : 'FUNTOPIA'; word.classList.toggle('lb-logo-pepper', on); }
  if (tixIc) tixIc.innerHTML = on ? PEPPER_CAN : icons.coins;
}

// Pixelated Dr. Pepper can cracks: the detailed can + jagged cracks pop up at
// random spots for themed players only. pointer-events none, so they never block clicks.
let pepperCrackTimer = null;
export function pepperCrackSVG() {
  const cx = 70, cy = 70, arms = [];
  const n = 6 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    let ang = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    let x = cx, y = cy;
    const pts = [[x, y]];
    const steps = 4 + Math.floor(Math.random() * 2);
    for (let s = 0; s < steps; s++) {
      ang += (Math.random() - 0.5) * 0.9;
      x += Math.cos(ang) * (9 + Math.random() * 10);
      y += Math.sin(ang) * (9 + Math.random() * 10);
      pts.push([Math.round(x / 4) * 4, Math.round(y / 4) * 4]);
    }
    arms.push(pts);
    // a short side branch off the middle of some arms, for a richer shatter
    if (Math.random() < 0.6 && pts.length > 3) {
      const bi = 2 + Math.floor(Math.random() * (pts.length - 3));
      let bx = pts[bi][0], by = pts[bi][1], bang = ang + (Math.random() < 0.5 ? 1 : -1) * (0.7 + Math.random() * 0.5);
      const bpts = [[bx, by]];
      for (let s = 0; s < 2; s++) {
        bang += (Math.random() - 0.5) * 0.5;
        bx += Math.cos(bang) * (7 + Math.random() * 7);
        by += Math.sin(bang) * (7 + Math.random() * 7);
        bpts.push([Math.round(bx / 4) * 4, Math.round(by / 4) * 4]);
      }
      arms.push(bpts);
    }
  }
  const armPolys = arms.map(pts => {
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const a = pts.map(p => p.join(',')).join(' ');
    const dash = `class="crack-arm" style="stroke-dasharray:${Math.ceil(len)};stroke-dashoffset:${Math.ceil(len)}"`;
    return `<polyline points="${a}" fill="none" stroke="#5a0a12" stroke-width="6" stroke-linejoin="miter" stroke-linecap="square" ${dash}/><polyline points="${a}" fill="none" stroke="#ff2e2e" stroke-width="2.5" stroke-linejoin="miter" stroke-linecap="square" ${dash}/>`;
  }).join('');
  return `<svg viewBox="0 0 140 140" shape-rendering="crispEdges" style="image-rendering:pixelated;display:block;width:100%;height:100%">${armPolys}<g transform="translate(58,52) scale(0.5)">${PEPPER_CAN_INNER}</g></svg>`;
}
export function spawnPepperCrack() {
  if (!document.body.classList.contains('theme-drpepper')) return;
  if (document.querySelectorAll('.pepper-crack').length >= 3) return;
  const el = document.createElement('div');
  el.className = 'pepper-crack';
  el.innerHTML = pepperCrackSVG();
  const size = 120 + Math.random() * 80;
  const deg = Math.floor(Math.random() * 360);
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  el.style.left = (4 + Math.random() * 82) + 'vw';
  el.style.top = (8 + Math.random() * 72) + 'vh';
  el.style.setProperty('--r', deg + 'deg');
  el.style.transform = 'rotate(' + deg + 'deg)';
  // impact flash at the can
  const flash = document.createElement('div');
  flash.className = 'pepper-flash';
  el.appendChild(flash);
  // soda fizz bubbles rising off the can
  for (let i = 0; i < 6; i++) {
    const b = document.createElement('div');
    b.className = 'pepper-bubble';
    const s = 3 + Math.random() * 5;
    b.style.width = s + 'px';
    b.style.height = s + 'px';
    b.style.left = (42 + Math.random() * 16) + '%';
    b.style.top = (42 + Math.random() * 16) + '%';
    b.style.animationDelay = (Math.random() * 0.25) + 's';
    el.appendChild(b);
  }
  document.body.appendChild(el);
  playPepperCrackSound();
  setTimeout(() => el.remove(), 5200);
}
// Crack sound: a sharp snap + low thunk + crackle ticks + a soda "pssh" fizz.
// Synthesized with Web Audio (no audio file). Respects the Sound effects setting.
let pepperAC = null, pepperNoiseBuf = null;
function pepperAudio() {
  if (!pepperAC) {
    try { pepperAC = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (pepperAC.state === 'suspended') pepperAC.resume();
  return pepperAC;
}
function pepperNoise(a) {
  if (!pepperNoiseBuf) {
    pepperNoiseBuf = a.createBuffer(1, a.sampleRate * 0.3, a.sampleRate);
    const d = pepperNoiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return pepperNoiseBuf;
}
function pepperBurst(a, t, freq, q, vol, dur, delay = 0) {
  const src = a.createBufferSource();
  src.buffer = pepperNoise(a);
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
  const g = a.createGain();
  const st = t + delay;
  g.gain.setValueAtTime(vol, st);
  g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
  src.connect(bp).connect(g).connect(a.destination);
  src.start(st); src.stop(st + dur + 0.02);
}
export function playPepperCrackSound() {
  let on = true;
  try { on = localStorage.getItem('ff_sfx') !== '0'; } catch {}
  if (!on) return;
  const a = pepperAudio();
  if (!a) return;
  const t = a.currentTime;
  pepperBurst(a, t, 2800, 1, 0.5, 0.13);           // the snap
  pepperBurst(a, t, 4200, 1.2, 0.16, 0.07, 0.06); // crackle tick
  pepperBurst(a, t, 3600, 1.2, 0.12, 0.06, 0.13); // crackle tick
  pepperBurst(a, t, 6500, 0.8, 0.07, 0.45, 0.02); // soda "pssh" fizz
  const o = a.createOscillator(), g = a.createGain(); // low thunk
  o.type = 'sine'; o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(65, t + 0.12);
  g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.15);
}
export function startPepperCracks() {
  if (pepperCrackTimer) return;
  const tick = () => {
    spawnPepperCrack();
    pepperCrackTimer = setTimeout(tick, 6000 + Math.random() * 8000);
  };
  pepperCrackTimer = setTimeout(tick, 2500 + Math.random() * 4000);
}
export function stopPepperCracks() {
  if (pepperCrackTimer) { clearTimeout(pepperCrackTimer); pepperCrackTimer = null; }
  document.querySelectorAll('.pepper-crack').forEach(el => el.remove());
}
