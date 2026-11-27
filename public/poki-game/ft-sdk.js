/* FunTopia store SDK glue (u163). Works with Poki SDK v2 or CrazyGames SDK v3,
   whichever this build loaded. Loading = until the first page renders and
   the server is connected. Gameplay = while a #/play/ game is open. */
(function () {
  var kind = window.PokiSDK ? 'poki' : (window.CrazyGames && window.CrazyGames.SDK) ? 'crazy' : null;
  if (!kind) return;
  var ready = Promise.resolve(), sdkOk = false;
  function call(fn) { try { fn(); } catch (e) {} }
  if (kind === 'poki') {
    ready = window.PokiSDK.init().then(function () { sdkOk = true; }).catch(function () { sdkOk = true; /* adblock: keep going */ });
  } else {
    ready = Promise.resolve(window.CrazyGames.SDK.init()).then(function () { sdkOk = true; call(function () { window.CrazyGames.SDK.game.loadingStart(); }); }).catch(function () {});
  }
  var loaded = false, playing = false;
  function loadingDone() {
    if (loaded) return; loaded = true;
    ready.then(function () {
      if (!sdkOk) return;
      if (kind === 'poki') call(function () { window.PokiSDK.gameLoadingFinished(); });
      else call(function () { window.CrazyGames.SDK.game.loadingStop(); });
      sync();
    });
  }
  function sync() {
    if (!loaded || !sdkOk) return;
    var inGame = /^#\/play\//.test(location.hash);
    if (inGame === playing) return;
    playing = inGame;
    if (kind === 'poki') call(function () { inGame ? window.PokiSDK.gameplayStart() : window.PokiSDK.gameplayStop(); });
    else call(function () { inGame ? window.CrazyGames.SDK.game.gameplayStart() : window.CrazyGames.SDK.game.gameplayStop(); });
  }
  window.addEventListener('hashchange', sync);
  var t = setInterval(function () {
    var app = document.getElementById('app');
    var ov = document.getElementById('ft-connecting');
    if (app && app.children.length && !(ov && ov.style.display === 'flex')) { clearInterval(t); loadingDone(); }
  }, 300);
})();
