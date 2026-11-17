// tokens.js — Tokens + prize wheel + pumpkin shop.
// Spend a token to spin the wheel and win a random ability item of that
// rarity. Ability items equip in Gear and grant a real in-game ability.
// The Pumpkin Shop Token is a 1-in-100,000,000 wheel jackpot — it unlocks
// the pumpkin shop for exactly one purchase.
import { CATALOG, ITEM } from './catalog.js?v=44f5fe93';
import { avatarImage } from './avatar3d.js?v=bbc65898';
import { PEPPER_CAN } from './pepper.js?v=57beac3a';

const RARITY_LABEL = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', superrare: 'Super Rare', king: 'King', galactic: 'Galactic', universal: 'Universal', scout: 'Scout', drpepper: 'Dr. Pepper', skull: 'Skull', pumpkin: 'Pumpkin' };
let lastResult = '';
// Original soda-ad jingle, synthesized live (a bouncy original melody —
// the real Dr. Pepper jingle is copyrighted, so this one is made in code).
function playPepperJingle() {
  try {
    if (localStorage.getItem('ff_sfx') === '0') return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [[523.25, 0, .16], [659.25, .16, .16], [783.99, .32, .16], [659.25, .48, .16], [880, .64, .22], [783.99, .88, .16], [659.25, 1.04, .16], [523.25, 1.2, .16], [587.33, 1.36, .16], [659.25, 1.52, .16], [783.99, 1.68, .3], [1046.5, 2.0, .5]];
    for (const [f, t, d] of notes) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(.22, ctx.currentTime + t + .02);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + t + d);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d + .05);
    }
  } catch (e) { /* audio unavailable — the ad still plays silently */ }
}
const PUMPY_SVG = `<svg viewBox="0 0 200 200" width="150" height="150" aria-label="Pumpy the pumpkin shopkeeper"><ellipse cx="100" cy="118" rx="76" ry="64" fill="#ff6d00"/><path d="M100 54 Q64 118 100 182 M100 54 Q136 118 100 182 M100 54 Q82 118 100 182 M100 54 Q118 118 100 182" stroke="#e65100" stroke-width="4" fill="none" opacity=".7"/><rect x="91" y="34" width="18" height="26" rx="6" fill="#558b2f"/><path d="M109 44 Q132 30 138 52 Q120 58 109 44" fill="#66bb6a"/><circle cx="74" cy="104" r="12" fill="#fff"/><circle cx="74" cy="104" r="6" fill="#212121"/><circle cx="126" cy="104" r="12" fill="#fff"/><circle cx="126" cy="104" r="6" fill="#212121"/><path d="M68 132 Q100 156 132 132" stroke="#212121" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M100 160 L88 176 L100 170 L112 176 Z" fill="#c8102e"/><circle cx="100" cy="163" r="4" fill="#ffd700"/></svg>`;
const ABILITY_LABEL = { speed: '⚡ +50% run speed', doublejump: '☁️ Double jump', magnet: '🧲 Coins fly to you', shield: '🛡️ Block kill parts', fly: '🪽 Hold Space to glide', star: '🌟 Speed + coin magnet', universal: '🌠 Speed + double jump + magnet', tornado: '🌪️ Tornado dash (Q) + speed' };

export async function tokensPage(D) {
  const { api, mount, esc, toast } = D;
  const me = D.me;
  let info;
  try { info = await api('GET', '/api/tokens/info'); } catch (e) { mount('tokens', `<h1>🪙 Tokens</h1><p class="muted">Could not load the wheel. ${esc(e.message || '')}</p>`); return; }
  const owned = new Set(me.inventory || []);
  const isFun = (me.name || '').toLowerCase() === 'fun';
  const countOf = id => isFun ? Infinity : (me.inventory || []).filter(x => x === id).length;
  const tokenOf = r => info.tokens.find(t => t.rarity === r);

  const abilityItems = CATALOG.filter(i => i.ability);
  const ownedAbilities = abilityItems.filter(i => owned.has(i.id));
  const hasPumpkin = owned.has('token_pumpkin') || isFun;

  mount('tokens', `
    <h1>🪙 Tokens</h1>
    <p class="muted">Spend a token to spin the prize wheel. Every spin wins an avatar item — and every one grants a real ability in games when you equip it in Gear. Your FunTix: <b>${esc(String(me.funtix ?? 0))}</b></p>
    <div class="token-wheel-wrap">
      <div class="token-wheel" id="tokenWheel"><div class="token-wheel-pointer">▼</div><div class="token-wheel-face">🎡</div></div>
      <div class="token-orbit" id="tokenOrbit"><img class="token-avatar" src="${avatarImage(me.avatar, 'full')}" alt="Your avatar" /></div>
      <div class="token-burst" id="tokenBurst"></div>
      <div class="token-wheel-result" id="tokenResult">${lastResult || 'Pick a token below, then spin!'}</div>
    </div>
    <div class="token-reveal-overlay" id="tokenReveal" hidden>
      <div class="token-reveal-card">
        <div class="token-reveal-title" id="tokenRevealTitle">🎉 YOU WON! 🎉</div>
        <img class="token-reveal-dancer" id="tokenRevealDancer" src="${avatarImage(me.avatar, 'full')}" alt="Your avatar dancing" />
        <div class="token-reveal-emoji" id="tokenRevealEmoji">✨</div>
        <div class="token-reveal-name" id="tokenRevealName"></div>
        <div class="token-reveal-ability" id="tokenRevealAbility"></div>
        <div class="token-reveal-jackpot" id="tokenRevealJackpot"></div>
        <button class="btn-primary token-reveal-close" id="tokenRevealClose">Awesome!</button>
      </div>
    </div>
    <div class="pepper-ad" id="pepperAd" hidden>
      <div class="pepper-ad-fizz" id="pepperAdFizz"></div>
      <div class="pepper-ad-can pepper-ad-hero" id="pepperAdCan">${PEPPER_CAN}</div>
      <div class="pepper-ad-word">Dr Pepper</div>
      <div class="pepper-ad-tag">Est. 1885 &bull; 23 flavors &bull; It's a pepper thing!</div>
      <div class="pepper-ad-card" id="pepperAdCard" hidden>
        <div class="token-reveal-title" id="pepperAdTitle">🎉 YOU WON! 🎉</div>
        <div class="token-reveal-emoji" id="pepperAdEmoji">🥤</div>
        <div class="token-reveal-name" id="pepperAdName"></div>
        <div class="token-reveal-ability" id="pepperAdAbility"></div>
        <button class="btn-primary token-reveal-close" id="pepperAdClose">Awesome!</button>
      </div>
    </div>
    <div class="cine-cutscene" id="cineCutscene" hidden>
      <div class="cine-bar cine-bar-top"></div>
      <div class="cine-bar cine-bar-bottom"></div>
      <div class="cine-stage" id="cineStage">
        <div class="cine-fx" id="cineFx" hidden></div>
        <div class="cine-spotlight"></div>
        <div class="cine-motif" id="cineMotif">✨</div>
        <img class="cine-avatar" id="cineAvatar" src="${avatarImage(me.avatar, 'full')}" alt="Your avatar" />
        <canvas class="cine-token" id="cineTokenCanvas" width="320" height="320"></canvas>
        <div class="cine-burst" id="cineBurst"></div>
        <div class="cine-caption" id="cineCaption">A gift arrives…</div>
      </div>
      <div class="cine-titlecard" id="cineTitlecard" hidden>
        <div class="cine-title" id="cineTitle">YOU GOT A TOKEN!</div>
        <div class="cine-token-big" id="cineTokenBig">🪙</div>
        <div class="cine-token-name" id="cineTokenName"></div>
        <div class="cine-token-sub" id="cineTokenSub"></div>
        <button class="btn-primary cine-continue" id="cineContinue">Continue</button>
      </div>
      <button class="cine-skip" id="cineSkip">Skip ▸</button>
    </div>
    <div class="pumpkin-ceremony" id="pumpkinCeremony" hidden>
      <div class="pumpkin-ceremony-text" id="pumpkinCeremonyText">SOMETHING IS HAPPENING…</div>
      <div class="pumpkin-glitch-stage">
        <img class="pumpkin-glitch-avatar" id="pumpkinGlitchAvatar" src="${avatarImage(me.avatar, 'full')}" alt="Your avatar glitching" />
        <div class="pumpkin-static-token" id="pumpkinStaticToken">🎃</div>
      </div>
      <div class="pumpkin-boom" id="pumpkinBoom"></div>
    </div>
    <div class="pumpkin-shop-grand" id="pumpkinShopGrand" hidden>
      <div class="pumpkin-shop-grand-card">
        <div class="pumpkin-pumpy">${PUMPY_SVG}</div>
        <div class="pumpkin-shop-title">🎃 PUMPY'S PUMPKIN SHOP 🎃</div>
        <div class="pumpkin-shop-sub">Welcome, lucky one! One token, one treasure. Choose wisely…</div>
        <div class="item-grid pumpkin-shop-grid">${info.pumpkin.map(pp => {
          const has = owned.has(pp.id);
          return `<div class="item pumpkin-shop-item">
            <span class="pet-emoji-big">${pp.emoji || '🎃'}</span>
            <b>${esc(pp.name)}</b>
            <span class="muted small">${has ? 'Owned' : '1 🎃 Pumpkin Shop Token'}</span>
            ${has ? '<button class="btn-owned" disabled>Owned</button>' : `<button class="btn-primary pumpkin-buy" data-id="${pp.id}">Buy with 🎃 token</button>`}
          </div>`;
        }).join('')}</div>
        <button class="btn-secondary pumpkin-shop-close" id="pumpkinShopClose">Close shop</button>
      </div>
    </div>
    <h2>Your tokens</h2>
    <div class="item-grid">${info.tokens.map(t => {
      const it = ITEM[t.id];
      const n = countOf(t.id);
      const prizes = info.prizes[t.rarity] || [];
      const prizeLine = t.rarity === 'skull' ? (info.skullNote || 'Mystery roll — any item!') : prizes.map(p => p.emoji).join(' ');
      return `<div class="item token-card">
        <span class="pet-emoji-big token-anim">${it?.emoji || '🪙'}</span>
        <b>${esc(it?.name || t.id)}</b>
        <span class="muted small">${RARITY_LABEL[t.rarity] || t.rarity} · You have <b>${isFun ? '∞' : n}</b></span>
        <span class="muted small">${prizeLine}</span>
        <button class="btn-primary token-spin" data-token="${t.id}" ${n < 1 && !isFun ? 'disabled' : ''}>🎡 Spin (${isFun ? '∞' : n})</button>
        <span class="muted small">${(info.dropRates || []).find(d => d.id === t.id) ? `🍀 Drops when you win a game — ${(info.dropRates.find(d => d.id === t.id)).label} chance` : t.rarity === 'scout' ? 'Only @scout can spin it' : t.rarity === 'skull' ? 'Granted by admins only' : 'Granted by admins only'}</span>
      </div>`;
    }).join('')}</div>
    <h2>Ability items you own</h2>
    ${ownedAbilities.length ? `<div class="item-grid">${ownedAbilities.map(i => {
      const isEq = me.avatar?.[i.type] === i.id;
      return `<div class="item">
        <span class="pet-emoji-big">${i.emoji || '✨'}</span>
        <b>${esc(i.name)}</b>
        <span class="muted small">${RARITY_LABEL[i.rarity]} · ${ABILITY_LABEL[i.ability] || i.ability}</span>
        ${isEq ? '<button class="btn-owned" disabled>Equipped ✓</button>' : `<button class="btn-secondary token-equip" data-id="${i.id}">Equip</button>`}
      </div>`;
    }).join('')}</div>` : '<p class="muted">No ability items yet — spin the wheel to win one!</p>'}
    <h2>🎃 Pumpkin Shop ${hasPumpkin ? '<span class="muted small">— unlocked! One purchase per token.</span>' : '<span class="muted small">— locked. Needs a Pumpkin Shop Token (1-in-100,000,000 wheel jackpot).</span>'}</h2>
    ${hasPumpkin ? `<div class="item-grid">${info.pumpkin.map(p => {
      const has = owned.has(p.id);
      return `<div class="item">
        <span class="pet-emoji-big">${p.emoji || '🎃'}</span>
        <b>${esc(p.name)}</b>
        <span class="muted small">${has ? 'Owned' : '1 🎃 Pumpkin Shop Token'}</span>
        ${has ? '<button class="btn-owned" disabled>Owned</button>' : `<button class="btn-primary pumpkin-buy" data-id="${p.id}">Buy with 🎃 token</button>`}
      </div>`;
    }).join('')}</div>` : '<p class="muted">The pumpkin shop only opens for the lucky few who hit the jackpot. Every wheel spin has a 0.000001% chance to drop a Pumpkin Shop Token.</p>'}
  `, () => {
    const refresh = () => tokensPage(D);
    const wheel = app.querySelector('#tokenWheel');
    const result = app.querySelector('#tokenResult');
    const orbit = app.querySelector('#tokenOrbit');
    const burst = app.querySelector('#tokenBurst');
    const reveal = app.querySelector('#tokenReveal');
    const explode = (color) => {
      burst.innerHTML = '';
      const colors = [color || '#ffd700', '#ff2d95', '#7b2ff7', '#00e5ff', '#76ff03', '#ff6d00'];
      for (let i = 0; i < 28; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = 90 + Math.random() * 130;
        const p = document.createElement('i');
        p.style.setProperty('--dx', `${Math.cos(a) * d}px`);
        p.style.setProperty('--dy', `${Math.sin(a) * d}px`);
        p.style.background = colors[i % colors.length];
        p.style.width = p.style.height = `${7 + Math.random() * 9}px`;
        burst.appendChild(p);
      }
      const flash = document.createElement('b');
      flash.className = 'token-flash';
      burst.appendChild(flash);
      setTimeout(() => { burst.innerHTML = ''; }, 1000);
    };
    app.querySelector('#tokenRevealClose').onclick = () => { reveal.hidden = true; refresh(); };
    app.querySelector('#pepperAdClose').onclick = () => { app.querySelector('#pepperAd').hidden = true; refresh(); };
    const runPepperAd = (item, title, sub) => {
      const ad = app.querySelector('#pepperAd');
      const card = app.querySelector('#pepperAdCard');
      const fizz = app.querySelector('#pepperAdFizz');
      playPepperJingle();
      app.querySelector('#pepperAdTitle').textContent = title || '🎉 YOU WON! 🎉';
      ad.hidden = false;
      card.hidden = true;
      fizz.innerHTML = '';
      const can = app.querySelector('#pepperAdCan');
      can.classList.remove('pepper-ad-hero');
      void can.offsetWidth;
      can.classList.add('pepper-ad-hero');
      for (let i = 0; i < 48; i++) {
        const b = document.createElement('i');
        b.style.left = `${4 + Math.random() * 92}%`;
        b.style.setProperty('--rise', `${120 + Math.random() * 260}px`);
        b.style.animationDelay = `${Math.random() * 1.6}s`;
        b.style.width = b.style.height = `${6 + Math.random() * 12}px`;
        fizz.appendChild(b);
      }
      setTimeout(() => {
        app.querySelector('#pepperAdEmoji').textContent = item?.emoji || '🥤';
        app.querySelector('#pepperAdName').textContent = item?.name || '';
        app.querySelector('#pepperAdAbility').textContent = sub || (ABILITY_LABEL[item?.ability] || '');
        card.hidden = false;
      }, 2200);
    };
    app.querySelector('#pumpkinShopClose').onclick = () => { app.querySelector('#pumpkinShopGrand').hidden = true; refresh(); };
    // ---- New-token cutscenes: when a token lands in your inventory, the
    // first time you open the Tokens page you get the cutscene for it.
    const seenKey = 'ff_tokens_seen';
    const getSeen = () => { try { return new Set(JSON.parse(localStorage.getItem(seenKey) || '[]')); } catch (e) { return new Set(); } };
    const markSeen = (id) => { const seen = getSeen(); seen.add(id); try { localStorage.setItem(seenKey, JSON.stringify([...seen])); } catch (e) {} };
    // One unique cutscene per token: its own colors, caption, motif + vibe.
    const TOKEN_CUTSCENE = {
      token_common:    { accent: '#ffd700', glow: 'rgba(255, 215, 0, .55)',  bg: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255, 215, 0, .22), transparent 70%)', motif: '☀️', caption: 'A warm little gift…', sub: 'Spin it on the wheel to win a prize!' },
      token_uncommon:  { accent: '#76ff03', glow: 'rgba(118, 255, 3, .5)',   bg: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(118, 255, 3, .2), transparent 70%)', motif: '🍃', caption: 'Something fresh is growing…', sub: 'Spin it on the wheel to win a prize!' },
      token_rare:      { accent: '#00e5ff', glow: 'rgba(0, 229, 255, .55)',  bg: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0, 229, 255, .22), transparent 70%)', motif: '❄️', caption: 'Something cool is coming…', sub: 'Spin it on the wheel to win a prize!' },
      token_superrare: { accent: '#b388ff', glow: 'rgba(179, 136, 255, .55)', bg: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(123, 47, 247, .3), transparent 70%)', motif: '⚡', caption: 'The air is crackling…', sub: 'Spin it on the wheel to win a prize!' },
      token_king:      { fx: 'king', accent: '#ffca28', glow: 'rgba(255, 202, 40, .6)',  bg: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255, 202, 40, .25), rgba(123, 47, 247, .2) 60%, transparent 75%)', motif: '👑', caption: 'All hail… a royal gift!', sub: 'Spin it on the wheel to win a prize!' },
      token_galactic:  { fx: 'galactic', accent: '#7c4dff', glow: 'rgba(124, 77, 255, .6)',  bg: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124, 77, 255, .35), rgba(0, 229, 255, .15) 60%, transparent 75%)', motif: '🌌', caption: 'From the far edge of the galaxy…', sub: 'Spin it on the wheel to win a prize!' },
      token_universal: { fx: 'universal', accent: '#ff2d95', glow: 'rgba(255, 45, 149, .55)', bg: 'linear-gradient(160deg, rgba(255, 45, 149, .22), rgba(0, 229, 255, .2) 45%, rgba(118, 255, 3, .18) 70%, transparent)', motif: '🌈', caption: 'Every color. Every power. One token.', sub: 'Spin it on the wheel to win a prize!' },
      token_scout:     { fx: 'scout', accent: '#00e5ff', glow: 'rgba(0, 229, 255, .6)',   bg: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0, 229, 255, .22), rgba(0, 0, 0, .4) 75%)', motif: '🌀', caption: 'A whirlwind is coming for @scout…', sub: 'Only @scout can spin it — Blob Twirly Hat + Austee inside!' },
      token_skull:     { fx: 'skull', accent: '#aeea00', glow: 'rgba(174, 234, 0, .5)',   bg: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(174, 234, 0, .16), rgba(0, 0, 0, .55) 75%)', motif: '💀', caption: 'Something is watching from the dark…', sub: '💀 Mystery roll — spin it to win ANY item in FunTopia!' },
    };
    let stopCoin = null;
    const playCineCutscene = async (tokenId, prize) => {
      const tok = ITEM[tokenId];
      const cfg = TOKEN_CUTSCENE[tokenId] || TOKEN_CUTSCENE.token_common;
      const cine = app.querySelector('#cineCutscene');
      const stage = app.querySelector('#cineStage');
      const tokenEl = app.querySelector('#cineTokenCanvas');
      // Live 3D coin: a real spinning token in the token's colors.
      try {
        const { startToken3D } = await import('./token3d.js?v=9a0c49bc');
        if (stopCoin) stopCoin();
        stopCoin = startToken3D(tokenEl, { emoji: tok?.emoji || '🪙', color: tok?.color || cfg.accent });
      } catch (e) { tokenEl.style.display = 'none'; }
      const burst = app.querySelector('#cineBurst');
      const cap = app.querySelector('#cineCaption');
      const card = app.querySelector('#cineTitlecard');
      stage.style.setProperty('--cine-bg', cfg.bg);
      stage.style.setProperty('--cine-glow', cfg.glow);
      stage.style.setProperty('--cine-accent', cfg.accent);
      const fx = app.querySelector('#cineFx');
      fx.innerHTML = '';
      fx.className = 'cine-fx';
      if (cfg.fx) {
        fx.classList.add('cine-fx-' + cfg.fx);
        fx.hidden = false;
        if (cfg.fx === 'galactic') {
          for (let i = 0; i < 42; i++) {
            const st = document.createElement('i');
            st.style.left = `${Math.random() * 100}%`;
            st.style.top = `${Math.random() * 100}%`;
            const sz = 2 + Math.random() * 4;
            st.style.width = st.style.height = `${sz}px`;
            st.style.animationDelay = `${Math.random() * 1.6}s`;
            fx.appendChild(st);
          }
        } else if (cfg.fx === 'king') {
          for (let i = 0; i < 26; i++) {
            const cf = document.createElement('i');
            cf.style.left = `${Math.random() * 100}%`;
            cf.style.animationDelay = `${Math.random() * 2.6}s`;
            cf.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
            if (i % 3 === 0) cf.style.background = '#fff3c4';
            if (i % 3 === 1) cf.style.background = '#ff6d00';
            fx.appendChild(cf);
          }
        }
      } else { fx.hidden = true; }
      app.querySelector('#cineMotif').textContent = cfg.motif;
      tokenEl.style.display = '';
      tokenEl.style.opacity = '0';
      tokenEl.classList.remove('drop', 'burst');
      burst.innerHTML = '';
      card.hidden = true;
      cap.style.display = '';
      cap.textContent = cfg.caption;
      cine.hidden = false;
      let done = false;
      const finish = () => { if (done) return; done = true; if (stopCoin) { stopCoin(); stopCoin = null; } cine.hidden = true; if (prize) refresh(); else closeAndAdvance(() => {}); };
      app.querySelector('#cineSkip').onclick = finish;
      app.querySelector('#cineContinue').onclick = finish;
      // Beat 1: token drops in.
      setTimeout(() => { if (done) return; tokenEl.style.opacity = '1'; tokenEl.classList.add('drop'); cap.textContent = `The ${tok?.name || 'Token'}!`; }, 1200);
      // Beat 2: token explodes in the token's colors.
      setTimeout(() => {
        if (done) return;
        tokenEl.classList.remove('drop'); tokenEl.classList.add('burst');
        burst.innerHTML = '';
        const colors = [cfg.accent, '#ffffff', '#ffd700', '#ff2d95', '#7b2ff7', '#00e5ff'];
        for (let i = 0; i < 40; i++) {
          const a = Math.random() * Math.PI * 2;
          const d = 120 + Math.random() * 220;
          const pt = document.createElement('i');
          pt.style.setProperty('--dx', `${Math.cos(a) * d}px`);
          pt.style.setProperty('--dy', `${Math.sin(a) * d}px`);
          pt.style.background = colors[i % colors.length];
          pt.style.width = pt.style.height = `${8 + Math.random() * 10}px`;
          burst.appendChild(pt);
        }
        const flash = document.createElement('b');
        burst.appendChild(flash);
        setTimeout(() => { burst.innerHTML = ''; }, 1000);
      }, 2600);
      // Beat 3: the grand title card.
      setTimeout(() => {
        if (done) return;
        cap.style.display = 'none';
        app.querySelector('#cineTitle').textContent = prize ? '🎉 YOU WON! 🎉' : 'YOU GOT A TOKEN!';
        app.querySelector('#cineTokenBig').textContent = prize?.emoji || tok?.emoji || '🪙';
        app.querySelector('#cineTokenName').textContent = prize?.name || tok?.name || '';
        app.querySelector('#cineTokenSub').textContent = prize ? (ABILITY_LABEL[prize.ability] || '') : cfg.sub;
        card.hidden = false;
      }, 3300);
    };
    const playTokenCutscene = (tokenId) => {
      const tok = ITEM[tokenId];
      if (!tok) return;
      markSeen(tokenId);
      // Pumpkin and Dr. Pepper keep their own big ceremonies.
      if (tokenId === 'token_pumpkin') { runPumpkinCeremony(); return; }
      if (tokenId === 'token_drpepper') { runPepperAd(tok, '🎉 YOU GOT A TOKEN! 🎉', 'Spin it on the wheel to win Dr. Pepper stuff!'); return; }
      // Every other token gets its own cinematic cutscene.
      playCineCutscene(tokenId);
    };
    const checkNewTokens = () => {
      const seen = getSeen();
      const fresh = (me.inventory || []).filter(id => ITEM[id]?.type === 'token' && !seen.has(id));
      if (!fresh.length) return;
      setTimeout(() => playTokenCutscene(fresh[0]), 600);
    };
    // Closing a reveal/ad: if another unseen token is waiting, play its
    // cutscene next; otherwise refresh so counts and items update.
    const closeAndAdvance = (hide) => {
      hide();
      const seen = getSeen();
      const fresh = (me.inventory || []).filter(id => ITEM[id]?.type === 'token' && !seen.has(id));
      if (fresh.length) setTimeout(() => playTokenCutscene(fresh[0]), 400);
      else refresh();
    };
    app.querySelector('#tokenRevealClose').onclick = () => closeAndAdvance(() => { reveal.hidden = true; });
    app.querySelector('#pepperAdClose').onclick = () => closeAndAdvance(() => { app.querySelector('#pepperAd').hidden = true; });
    setTimeout(checkNewTokens, 800);
    const runPumpkinCeremony = () => {
      const ceremony = app.querySelector('#pumpkinCeremony');
      const boom = app.querySelector('#pumpkinBoom');
      const text = app.querySelector('#pumpkinCeremonyText');
      const stage = app.querySelector('.pumpkin-glitch-stage');
      ceremony.hidden = false;
      document.body.classList.add('pumpkin-shake');
      if (stage) { stage.classList.add('pumpkin-tear'); setTimeout(() => stage.classList.remove('pumpkin-tear'), 2600); }
      text.textContent = 'SOMETHING IS HAPPENING…';
      setTimeout(() => { text.textContent = 'THE PUMPKIN TOKEN IS BREAKING REALITY…'; }, 900);
      setTimeout(() => {
        document.body.classList.remove('pumpkin-shake');
        document.body.classList.add('pumpkin-boom-shake');
        boom.innerHTML = '';
        for (let i = 0; i < 70; i++) {
          const a = Math.random() * Math.PI * 2;
          const d = 140 + Math.random() * 420;
          const pt = document.createElement('i');
          pt.style.setProperty('--dx', `${Math.cos(a) * d}px`);
          pt.style.setProperty('--dy', `${Math.sin(a) * d}px`);
          pt.style.background = ['#ff6d00', '#ffd700', '#ff2d95', '#76ff03', '#ff5722'][i % 5];
          pt.style.width = pt.style.height = `${8 + Math.random() * 16}px`;
          boom.appendChild(pt);
        }
        const flash = document.createElement('b');
        flash.className = 'pumpkin-flash';
        boom.appendChild(flash);
        setTimeout(() => {
          ceremony.hidden = true;
          document.body.classList.remove('pumpkin-boom-shake');
          boom.innerHTML = '';
          app.querySelector('#pumpkinShopGrand').hidden = false;
        }, 1100);
      }, 2400);
    };
    app.querySelectorAll('.token-spin').forEach(b => b.onclick = async () => {
      b.disabled = true;
      result.textContent = 'Spinning…';
      wheel.classList.remove('spinning'); void wheel.offsetWidth; wheel.classList.add('spinning');
      orbit.classList.add('on', 'dancing');
      try {
        const r = await api('POST', '/api/tokens/spin', { token: b.dataset.token });
        me.inventory = r.inventory;
        const item = ITEM[r.item];
        setTimeout(() => {
          wheel.classList.remove('spinning');
          orbit.classList.remove('on', 'dancing');
          if (b.dataset.token === 'token_drpepper') { runPepperAd(item); return; }
          if (r.jackpot) { markSeen('token_pumpkin'); runPumpkinCeremony(); return; }
          lastResult = `🎉 You won <b>${esc(item?.name || r.item)}</b> ${item?.emoji || ''} — ${esc(ABILITY_LABEL[item?.ability] || '')}`;
          result.innerHTML = lastResult;
          playCineCutscene(b.dataset.token, item);
        }, 1400);
      } catch (e) { wheel.classList.remove('spinning'); orbit.classList.remove('on', 'dancing'); result.textContent = ''; toast(e.message || 'Spin failed', true); b.disabled = false; }
    });
    app.querySelectorAll('.token-buy').forEach(b => b.onclick = async () => {
      try {
        const r = await api('POST', '/api/tokens/buy', { token: b.dataset.token });
        me.inventory = r.inventory; if (typeof r.funtix === 'number') me.funtix = r.funtix;
        toast('Token bought! Spin the wheel.');
        refresh();
      } catch (e) { toast(e.message || 'Could not buy token', true); }
    });
    app.querySelectorAll('.token-equip').forEach(b => b.onclick = async () => {
      try {
        const it = ITEM[b.dataset.id];
        const slot = it?.type || 'gear';
        me.avatar = await api('PUT', '/api/me/avatar', { ...me.avatar, [slot]: b.dataset.id });
        toast('Ability equipped! It works in games now.');
        refresh();
      } catch (e) { toast(e.message || 'Could not equip', true); }
    });
    app.querySelectorAll('.pumpkin-buy').forEach(b => b.onclick = async () => {
      try {
        const r = await api('POST', '/api/tokens/pumpkin-buy', { item: b.dataset.id });
        me.inventory = r.inventory;
        toast('Pumpkin item bought! Your token is spent — one purchase per token.');
        refresh();
      } catch (e) { toast(e.message || 'Could not buy', true); }
    });
  });
}
