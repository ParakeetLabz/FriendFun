/* Poki build only (u163): no buying of any kind. Hides every shop / buy /
   donate / club / trade / token-shop entry point, sends those routes back to
   the lobby, and refuses purchase API calls before they leave the page. */
(function () {
  var BLOCK_ROUTES = /^#\/(donate|club|catalog|funtix|funbux|trades?|tokens|ugc|pets|skinmaker)(\/|\?|$)/;
  var BLOCK_API = /^\/api\/(buy\/|club\/join|tokens\/(buy|pumpkin-buy|spin)|ugc\/[^/]+\/buy|trades|social\/gift|social\/wishlist)/;
  function guard() { if (BLOCK_ROUTES.test(location.hash)) location.replace('#/home'); }
  window.addEventListener('hashchange', guard); guard();
  var css = document.createElement('style');
  css.textContent = [
    'a[href^="#/donate"]', 'a[href^="#/club"]', 'a[href^="#/catalog"]', 'a[href^="#/funtix"]', 'a[href^="#/trade"]',
    'a[href^="#/tokens"]', 'a[href^="#/ugc"]', 'a[href^="#/pets"]', 'a[href^="#/skinmaker"]', 'a[href*="venmo"]',
    '.btn-buy', '.buy-with', '.buy-row', '.pet-buy', '.skin-buy', '.pumpkin-buy', '.btn-club', '[data-buy]'
  ].join(',') + '{display:none!important}';
  (document.head || document.documentElement).appendChild(css);
  // Text-labelled buy buttons that have no class to hide by.
  var BUY_TEXT = /^\s*(buy|purchase|donate|join (friend)?club|get club)\b/i;
  function sweep(root) {
    var els = (root || document).querySelectorAll ? (root || document).querySelectorAll('button,a') : [];
    for (var i = 0; i < els.length; i++) if (BUY_TEXT.test(els[i].textContent || '')) els[i].style.display = 'none';
  }
  new MutationObserver(function () { sweep(document); }).observe(document.documentElement, { childList: true, subtree: true });
  var f = window.fetch;
  window.fetch = function (u, o) {
    if (typeof u === 'string' && BLOCK_API.test(u)) return Promise.resolve(new Response(JSON.stringify({ error: 'Not available in this version' }), { status: 403, headers: { 'content-type': 'application/json' } }));
    return f.apply(this, arguments);
  };
})();
