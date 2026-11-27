/* FunTopia store-build bridge (u163). Loaded first, before the game.
   - The game files come from this zip (the store's CDN); accounts and
     multiplayer still talk to the FunTopia server (FT_API).
   - A cold/asleep server never shows a foreign page or a blank screen:
     API calls retry with backoff behind a FunTopia "Connecting…" screen.
     Non-JSON/HTML replies, 502/503/504 and network/CORS errors all count
     as "server waking up".
   - Guests start automatically (ff_embed), outgoing links are blocked. */
(function () {
  var API = (window.FT_API || 'https://friendfun.onrender.com').replace(/\/$/, '');
  var WSB = API.replace(/^http/, 'ws');
  // Storage blocked (incognito / blocked cookies in a store iframe)? Use an
  // in-memory stand-in so the game still starts instead of a blank screen.
  function memStore() { var d = {}; return { getItem: function (k) { return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null; }, setItem: function (k, v) { d[k] = String(v); }, removeItem: function (k) { delete d[k]; }, clear: function () { d = {}; }, key: function (i) { return Object.keys(d)[i] || null; }, get length() { return Object.keys(d).length; } }; }
  ['localStorage', 'sessionStorage'].forEach(function (n) {
    try { var s = window[n]; s.setItem('__ft', '1'); s.removeItem('__ft'); }
    catch (e) { try { Object.defineProperty(window, n, { value: memStore(), configurable: true }); } catch (e2) {} }
  });
  try { sessionStorage.setItem('ff_embed', '1'); } catch (e) {}

  // ---------- Connecting screen ----------
  var ov = null, busy = 0, showTimer = null, waking = false;
  function ensureOv() {
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'ft-connecting';
    ov.setAttribute('role', 'status');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;flex-direction:column;gap:16px;background:radial-gradient(circle at 50% 35%,#7c3aed,#2a1458 70%);color:#fff;font-family:"Nunito Sans",system-ui,sans-serif;text-align:center;padding:24px';
    ov.innerHTML = '<div style="font-family:Lobster,cursive;font-size:56px;letter-spacing:1px;text-shadow:0 4px 0 rgba(0,0,0,.25)">FunTopia</div>' +
      '<div style="width:46px;height:46px;border-radius:50%;border:5px solid rgba(255,255,255,.25);border-top-color:#ffd54a;animation:ftspin 0.9s linear infinite"></div>' +
      '<div class="ft-msg" style="font-size:18px;font-weight:700">Connecting…</div>' +
      '<div class="ft-sub" style="font-size:14px;opacity:.8;max-width:320px"></div>' +
      '<style>@keyframes ftspin{to{transform:rotate(360deg)}}</style>';
    (document.body || document.documentElement).appendChild(ov);
    return ov;
  }
  function setOv(on) {
    if (on) {
      var o = ensureOv();
      o.querySelector('.ft-msg').textContent = waking ? 'Waking up the FunTopia server…' : 'Connecting…';
      o.querySelector('.ft-sub').textContent = waking ? 'This can take a few seconds the first time. Hang tight!' : '';
      o.style.display = 'flex';
    } else if (ov) ov.style.display = 'none';
  }
  function begin() { busy++; if (!showTimer) showTimer = setTimeout(function () { showTimer = null; if (busy > 0) setOv(true); }, 700); }
  function end() { busy = Math.max(0, busy - 1); if (busy === 0) { waking = false; if (showTimer) { clearTimeout(showTimer); showTimer = null; } setOv(false); } }
  window.__ftConnecting = setOv;

  // ---------- API fetch with retry ----------
  var nativeFetch = window.fetch.bind(window);
  function isApi(u) { return typeof u === 'string' && /^\/(api|health)(\/|\?|$)/.test(u); }
  window.fetch = function (input, opts) {
    if (input && typeof input === 'object' && input.url && isApi(new URL(input.url).pathname) && new URL(input.url).origin === location.origin) input = new URL(input.url).pathname + new URL(input.url).search;
    if (!isApi(input)) return nativeFetch(input, opts);
    var url = API + input, tries = 0;
    begin();
    return new Promise(function (resolve, reject) {
      (function attempt() {
        nativeFetch(url, opts).then(function (r) {
          var ct = (r.headers.get('content-type') || '').toLowerCase();
          if (r.status === 502 || r.status === 503 || r.status === 504 || (ct.indexOf('html') >= 0 && ct.indexOf('json') < 0)) throw new Error('server waking');
          end(); resolve(r);
        }).catch(function (e) {
          tries++; waking = true; if (busy > 0 && !showTimer) setOv(true);
          if (tries > 60) { end(); reject(e); return; }
          setTimeout(attempt, Math.min(6000, Math.round(600 * Math.pow(1.5, tries))));
        });
      })();
    });
  };

  // ---------- WebSocket to the FunTopia server ----------
  var NativeWS = window.WebSocket;
  function FTWebSocket(u, p) {
    var s = String(u);
    var m = s.match(/^wss?:\/\/([^/]+)(\/ws.*)$/);
    if (m && m[1] === location.host) s = WSB + m[2];
    return p === undefined ? new NativeWS(s) : new NativeWS(s, p);
  }
  FTWebSocket.prototype = NativeWS.prototype;
  ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function (k) { FTWebSocket[k] = NativeWS[k]; });
  window.WebSocket = FTWebSocket;

  // ---------- No outgoing links (store rules) ----------
  function external(href) {
    try { var u = new URL(href, location.href); return /^https?:$/.test(u.protocol) && u.origin !== location.origin; } catch (e) { return false; }
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('a[href]');
    if (a && external(a.getAttribute('href'))) { ev.preventDefault(); ev.stopPropagation(); }
  }, true);
  var nativeOpen = window.open;
  window.open = function (u) { if (u && external(u)) return null; return nativeOpen.apply(window, arguments); };
})();
