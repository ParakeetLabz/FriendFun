// 🎵 Jam tracks — original procedural chiptune loops (Web Audio, no audio files, no samples).
// Each track is an original 2-bar composition: 32 sixteenth-steps of lead + bass + hats.
import { sfx } from './sound.js?v=89850e26';

let ctx = null;
function ac() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
const NOTE = m => 440 * Math.pow(2, (m - 69) / 12);

export const JAM_TRACKS = [
  { id: 'bounce', name: 'Blocky Bounce', icon: '🟧', bpm: 128, lead: 'square', leadVol: 0.032, bass: 'triangle', bassVol: 0.055,
    mel: [72,0,76,0,79,0,76,0, 81,0,79,0,76,0,72,0, 74,0,77,0,81,0,77,0, 79,0,77,0,74,0,72,0],
    bas: [48,0,0,0,48,0,0,48, 45,0,0,0,45,0,0,45, 41,0,0,0,41,0,0,41, 43,0,0,43,43,0,43,0] },
  { id: 'parade', name: 'Pixel Parade', icon: '🎺', bpm: 120, lead: 'square', leadVol: 0.03, bass: 'triangle', bassVol: 0.055,
    mel: [79,0,0,79,0,0,81,0, 0,0,83,0,0,0,81,0, 79,0,0,0,76,0,0,0, 74,0,76,0,79,0,0,0],
    bas: [55,0,55,0,55,0,55,0, 53,0,53,0,53,0,53,0, 48,0,48,0,48,0,48,0, 50,0,50,0,50,0,50,0] },
  { id: 'lounge', name: 'Lobby Lounge', icon: '🛋️', bpm: 92, lead: 'triangle', leadVol: 0.045, bass: 'sine', bassVol: 0.06,
    mel: [69,0,0,0,72,0,0,0, 76,0,0,0,74,0,72,0, 69,0,0,0,67,0,0,0, 65,0,0,0,64,0,0,0],
    bas: [45,0,0,0,0,0,0,0, 41,0,0,0,0,0,0,0, 43,0,0,0,0,0,0,0, 40,0,0,0,0,0,43,0] },
  { id: 'boss', name: 'Final Boss', icon: '👾', bpm: 140, lead: 'sawtooth', leadVol: 0.028, bass: 'square', bassVol: 0.04,
    mel: [76,0,76,0,79,0,76,0, 74,0,74,0,77,0,74,0, 72,0,72,0,76,0,79,0, 81,0,79,0,76,0,74,0],
    bas: [40,0,40,40,0,40,0,0, 38,0,38,38,0,38,0,0, 36,0,36,36,0,36,0,0, 38,0,38,0,41,0,43,0] },
  { id: 'sunset', name: 'Sunset Cruise', icon: '🌅', bpm: 100, lead: 'sine', leadVol: 0.05, bass: 'triangle', bassVol: 0.055,
    mel: [67,0,0,0,71,0,74,0, 0,0,76,0,74,0,71,0, 72,0,0,0,74,0,71,0, 67,0,0,0,0,0,0,0],
    bas: [43,0,0,0,0,0,0,0, 45,0,0,0,0,0,0,0, 41,0,0,0,0,0,0,0, 43,0,0,0,0,0,0,0] },
];

let jamTimer = null, jamNodes = [], jamId = null, jamStep = 0, jamNextT = 0, noiseBuf = null;

function jamNote(midi, t, dur, type, vol) {
  const a = ac();
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = NOTE(midi);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination);
  o.start(t); o.stop(t + dur + 0.05);
  jamNodes.push(o);
}
function jamHat(t, vol) {
  const a = ac();
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, Math.floor(a.sampleRate * 0.1), a.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }
  const s = a.createBufferSource(); s.buffer = noiseBuf;
  const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  s.connect(f); f.connect(g); g.connect(a.destination);
  s.start(t); s.stop(t + 0.1);
  jamNodes.push(s);
}

export function startJam(id) {
  const def = JAM_TRACKS.find(x => x.id === id);
  if (!def) return false;
  stopJam();
  const a = ac();
  const stepDur = 60 / def.bpm / 4;
  jamStep = 0; jamNextT = a.currentTime + 0.1; jamId = id;
  jamTimer = setInterval(() => {
    if (!sfx.enabled) { jamNextT = Math.max(jamNextT, a.currentTime + 0.1); return; }
    while (jamNextT < a.currentTime + 0.6) {
      const i = jamStep % 32;
      const m = def.mel[i]; if (m) jamNote(m, jamNextT, stepDur * 1.8, def.lead, def.leadVol);
      const b = def.bas[i]; if (b) jamNote(b, jamNextT, stepDur * 2.5, def.bass, def.bassVol);
      if (i % 4 === 2) jamHat(jamNextT, 0.012);
      jamNextT += stepDur; jamStep++;
    }
  }, 150);
  return true;
}
export function stopJam() {
  jamId = null;
  if (jamTimer) { clearInterval(jamTimer); jamTimer = null; }
  for (const n of jamNodes) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} }
  jamNodes = [];
}
export function currentJam() { return jamId; }
