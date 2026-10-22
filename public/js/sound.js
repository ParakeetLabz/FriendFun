let ctx = null;
function ac() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
function tone(freq, dur, type = 'sine', vol = 0.15, slideTo = null, delay = 0) {
  const a = ac(), t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
export const sfx = {
  enabled: true,
  oof() { if (this.enabled) { tone(420, 0.28, 'square', 0.12, 140); tone(300, 0.25, 'sawtooth', 0.05, 110); } },
  coin() { if (this.enabled) { tone(988, 0.08, 'square', 0.07); tone(1319, 0.25, 'square', 0.07, null, 0.08); } },
  jump() { if (this.enabled) tone(300, 0.12, 'sine', 0.05, 600); },
  checkpoint() { if (this.enabled) [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, null, i * 0.09)); },
  win() { if (this.enabled) [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, null, i * 0.12)); },
  bounce() { if (this.enabled) tone(200, 0.3, 'sine', 0.12, 900); },
  click() { if (this.enabled) tone(700, 0.05, 'square', 0.04); },
  chat() { if (this.enabled) tone(880, 0.06, 'sine', 0.04); },
};

// ---- Spooky Halloween menu music (procedural Web Audio, no files needed) ----

// ---- Haunted menu music (procedural Web Audio, no files needed) ----
// A broken music box over a breathing sub drone: faltering waltz timing,
// sour detuned notes, bell tolls, a heartbeat, whispers and distant echoes.
// Everything routes through one master bus so stopSpooky() can fade it all.
let spookyTimer = null;
let spookyNodes = [];
let spookyBus = null;
let spookyDelayIn = null;
let spookyNoiseBuf = null;
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
// Broken music-box line built on D / Eb / F# / Ab — tritone + minor-2nd
// clashes against the D drone. [midi note, beats]; note 0 = a rest.
const SPOOKY_MELODY = [
  [74, 2], [75, 1], [74, 1], [68, 2], [66, 2], [67, 1], [66, 3], [0, 1],
  [74, 2], [80, 1], [75, 1], [74, 2], [69, 2], [68, 1], [63, 2], [62, 3], [0, 1],
  [78, 2], [74, 1], [75, 1], [80, 2], [81, 1], [80, 1], [75, 2], [74, 1], [68, 2], [66, 2], [62, 4],
];
function track(node) {
  spookyNodes.push(node);
  if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
    node.onended = () => { const i = spookyNodes.indexOf(node); if (i >= 0) spookyNodes.splice(i, 1); };
  }
}
function spookyNote(midi, t, dur, vol) {
  const a = ac();
  // every note is a few cents off; ~1 in 14 is a full semitone sour
  const sour = Math.random() < 0.07;
  const cents = sour ? (95 + Math.random() * 40) * (Math.random() < 0.5 ? -1 : 1) : Math.random() * 36 - 18;
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'triangle'; o.frequency.value = midiHz(midi); o.detune.value = cents;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(spookyBus);
  o.start(t); o.stop(t + dur + 0.05);
  track(o);
  // detuned shimmer an octave up, sourer than the note itself
  const o2 = a.createOscillator(), g2 = a.createGain();
  o2.type = 'sine'; o2.frequency.value = midiHz(midi) * 2; o2.detune.value = cents + 25 + Math.random() * 35;
  g2.gain.setValueAtTime(vol * 0.2, t);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.7);
  o2.connect(g2); g2.connect(spookyBus);
  o2.start(t); o2.stop(t + dur + 0.05);
  track(o2);
}
function spookyBell(t) {
  const a = ac();
  const f0 = midiHz([38, 39, 42, 44][Math.floor(Math.random() * 4)]); // D2 Eb2 F#2 Ab2
  // inharmonic partials, fundamental rings longest — a distant, wrong bell
  for (const [ratio, gv] of [[1, 0.05], [2.01, 0.026], [2.74, 0.019], [3.76, 0.011], [5.43, 0.005]]) {
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.value = f0 * ratio;
    const dur = 9 / Math.sqrt(ratio);
    g.gain.setValueAtTime(gv, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(spookyBus);
    o.start(t); o.stop(t + dur + 0.05);
    track(o);
  }
}
function spookyThump(t, vol) {
  const a = ac();
  for (const [dt, v] of [[0, 1], [0.24, 0.6]]) { // lub-dub
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(64, t + dt);
    o.frequency.exponentialRampToValueAtTime(38, t + dt + 0.13);
    g.gain.setValueAtTime(0, t + dt);
    g.gain.linearRampToValueAtTime(vol * v, t + dt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.17);
    o.connect(g); g.connect(spookyBus);
    o.start(t + dt); o.stop(t + dt + 0.22);
    track(o);
  }
}
function spookyNoiseEvent(t, kind) {
  const a = ac();
  const src = a.createBufferSource(); src.buffer = spookyNoiseBuf; src.loop = true;
  const bp = a.createBiquadFilter(); bp.type = 'bandpass';
  const g = a.createGain();
  if (kind === 'whisper') {
    src.playbackRate.value = 0.6;
    bp.Q.value = 9;
    bp.frequency.setValueAtTime(500 + Math.random() * 400, t);
    bp.frequency.exponentialRampToValueAtTime(2200 + Math.random() * 600, t + 0.9);
    bp.frequency.exponentialRampToValueAtTime(320, t + 1.9);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.016, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
    src.start(t); src.stop(t + 2);
  } else { // reversed-cymbal swell: long slow attack, then gone
    bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(3400, t + 2.2);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.02, t + 2.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.9);
    src.start(t); src.stop(t + 3);
  }
  src.connect(bp); bp.connect(g); g.connect(spookyBus);
  track(src);
}
function spookyEchoNote(t) {
  const a = ac();
  const midi = [86, 87, 90, 92, 93][Math.floor(Math.random() * 5)]; // far-off high notes
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'triangle'; o.frequency.value = midiHz(midi);
  o.detune.value = (25 + Math.random() * 30) * (Math.random() < 0.5 ? -1 : 1);
  g.gain.setValueAtTime(0.018, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  o.connect(g); g.connect(spookyBus);
  if (spookyDelayIn) g.connect(spookyDelayIn); // echo tail
  o.start(t); o.stop(t + 1.7);
  track(o);
}
export function startSpooky() {
  if (spookyTimer) return;
  const a = ac();
  const t0 = a.currentTime;
  // master bus: stopSpooky fades this one node to silence everything
  spookyBus = a.createGain(); spookyBus.gain.value = 0.9;
  spookyBus.connect(a.destination);
  // echo network for the distant high notes
  const delay = a.createDelay(1); delay.delayTime.value = 0.42;
  const fb = a.createGain(); fb.gain.value = 0.38;
  const wet = a.createGain(); wet.gain.value = 0.5;
  delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(spookyBus);
  spookyDelayIn = delay;
  spookyNodes.push(delay, fb, wet);
  // shared noise buffer (wind + whispers + swells)
  const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  spookyNoiseBuf = buf;
  // drone: two D subs a few cents apart (slow beating) + a tritone Ab sub,
  // breathing under a very slow amplitude LFO
  const droneG = a.createGain(); droneG.gain.value = 0.045; droneG.connect(spookyBus);
  spookyNodes.push(droneG);
  for (const [m, cents] of [[38, 0], [38, 7], [44, -5]]) {
    const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = midiHz(m); o.detune.value = cents;
    o.connect(droneG); o.start(); spookyNodes.push(o);
  }
  const brLfo = a.createOscillator(); brLfo.frequency.value = 0.045;
  const brG = a.createGain(); brG.gain.value = 0.018;
  brLfo.connect(brG); brG.connect(droneG.gain); brLfo.start();
  spookyNodes.push(brLfo, brG);
  // wind noise with a slow swell
  const noise = a.createBufferSource(); noise.buffer = buf; noise.loop = true;
  const filt = a.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 380;
  const ng = a.createGain(); ng.gain.value = 0.01;
  const lfo = a.createOscillator(); lfo.frequency.value = 0.07;
  const lfoG = a.createGain(); lfoG.gain.value = 0.007;
  lfo.connect(lfoG); lfoG.connect(ng.gain); lfo.start();
  noise.connect(filt); filt.connect(ng); ng.connect(spookyBus); noise.start();
  spookyNodes.push(noise, filt, ng, lfo, lfoG);
  // scheduler state
  const beat = 0.72; // slower than a healthy music box — and it only gets worse
  let step = 0, nextT = t0 + 0.15;
  let nextBell = t0 + 6 + Math.random() * 8;
  let nextHeart = t0 + 1.2;
  let nextEvent = t0 + 5 + Math.random() * 6;
  spookyTimer = setInterval(() => {
    if (!sfx.enabled) return;
    const now = a.currentTime;
    if (now >= nextBell) { spookyBell(now + 0.05); nextBell = now + 15 + Math.random() * 18; }
    if (now >= nextHeart) {
      // heartbeat presence breathes in and out over ~26s
      const pres = 0.5 + 0.5 * Math.sin((now - t0) * (2 * Math.PI / 26) + 1.3);
      if (pres > 0.3) spookyThump(now + 0.03, 0.015 + 0.045 * pres);
      nextHeart = now + 60 / 52; // ~52bpm
    }
    if (now >= nextEvent) {
      const r = Math.random();
      if (r < 0.4) spookyNoiseEvent(now + 0.05, 'whisper');
      else if (r < 0.7) spookyNoiseEvent(now + 0.05, 'swell');
      else spookyEchoNote(now + 0.05);
      nextEvent = now + 7 + Math.random() * 11;
    }
    while (nextT < now + 1.1) {
      const [midi, beats] = SPOOKY_MELODY[step % SPOOKY_MELODY.length];
      let dur = beat * beats * (1 + (Math.random() * 0.16 - 0.03)); // tempo drag
      const r = Math.random();
      if (r < 0.10) dur *= 1.9;       // faltering hold
      else if (r < 0.16) dur *= 0.45; // swallowed beat
      if (midi > 0 && Math.random() > 0.13) { // 13% of notes never sound — the box is broken
        spookyNote(midi, nextT + (Math.random() * 0.05 - 0.025), beat * 2.6, 0.05);
        if (step % 9 === 4) spookyNote(midi - 18, nextT, beat * 3.2, 0.026); // tritone shadow below
      }
      nextT += dur;
      step++;
    }
  }, 250);
}
export function stopSpooky() {
  if (spookyTimer) { clearInterval(spookyTimer); spookyTimer = null; }
  // capture this session's graph; a restarted session builds fresh nodes and
  // must not be torn down by this stop's delayed cleanup
  const nodes = spookyNodes, bus = spookyBus;
  spookyNodes = []; spookyBus = null; spookyDelayIn = null; spookyNoiseBuf = null;
  if (!bus) { for (const n of nodes) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} } return; }
  try {
    const t = ctx.currentTime;
    bus.gain.cancelScheduledValues(t);
    bus.gain.setValueAtTime(bus.gain.value, t);
    bus.gain.linearRampToValueAtTime(0, t + 0.35); // fade the whole haunting out
  } catch (e) {}
  setTimeout(() => {
    for (const n of nodes) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} }
    try { bus.disconnect(); } catch (e) {}
  }, 420);
}
