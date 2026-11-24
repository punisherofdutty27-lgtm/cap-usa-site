/* CAP USA : protection côté navigateur des formulaires envoyés à /api/forms.php.
   - ajoute un champ piège (_gotcha) aux formulaires qui n'en ont pas ;
   - récupère un jeton signé à durée limitée (_t) dès que le formulaire est visible ou utilisé ;
   - ajoute un identifiant d'envoi unique (_sid), identique en cas de nouvelle tentative automatique.
   Ne modifie ni les champs saisis, ni les messages, ni le suivi (GA4 / Google Ads) des pages. */
(function () {
  'use strict';
  var ENDPOINT = '/api/forms.php';
  var TOKEN_URL = '/api/token.php';
  var TOKEN_REFRESH_MS = 3 * 60 * 60 * 1000; // le jeton expire côté serveur au bout de 4 h

  function uid() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    var a = new Uint8Array(16), s = '';
    try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256); }
    for (var j = 0; j < a.length; j++) s += ('0' + a[j].toString(16)).slice(-2);
    return s;
  }
  function setHidden(form, name, value) {
    var el = form.querySelector('input[type="hidden"][name="' + name + '"]');
    if (!el) {
      el = document.createElement('input');
      el.type = 'hidden';
      el.name = name;
      form.appendChild(el);
    }
    el.value = value;
  }

  function guard(form) {
    if (form.__capGuard) return;
    form.__capGuard = true;

    if (!form.querySelector('[name="_gotcha"]')) {
      var d = document.createElement('div');
      d.setAttribute('aria-hidden', 'true');
      d.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
      d.innerHTML = '<input type="text" name="_gotcha" tabindex="-1" autocomplete="off">';
      form.appendChild(d);
    }
    setHidden(form, '_sid', uid());

    var fetchedAt = 0, inflight = null, waiting = false, relaunched = false;
    function fresh() { return fetchedAt && Date.now() - fetchedAt < TOKEN_REFRESH_MS; }
    function getToken() {
      if (fresh()) return Promise.resolve();
      if (inflight) return inflight;
      inflight = fetch(TOKEN_URL, { cache: 'no-store', credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j && j.t) { setHidden(form, '_t', j.t); fetchedAt = Date.now(); } })
        .catch(function () { /* silencieux : le serveur refusera l'envoi, l'utilisateur pourra réessayer */ })
        .then(function () { inflight = null; });
      return inflight;
    }

    form.addEventListener('focusin', getToken);
    form.addEventListener('pointerdown', getToken);
    // le jeton est demandé dès que le formulaire approche de l'écran (il aura plus d'une seconde d'âge à l'envoi)
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { getToken(); io.disconnect(); } });
      }, { rootMargin: '400px 0px' });
      io.observe(form);
    }
    // À l'envoi : si le jeton manque ou est trop ancien, on le récupère, on attend qu'il ait 1,1 s d'âge (règle du
    // serveur) puis on relance l'envoi automatiquement. Les gestionnaires de la page ne s'exécutent qu'ensuite.
    form.addEventListener('submit', function (e) {
      if (relaunched) { relaunched = false; return; }        // relance automatique : l'envoi suit son cours (même sans jeton, le serveur répondra)
      if (fresh() && Date.now() - fetchedAt > 1100) return; // jeton prêt : l'envoi suit son cours normal
      if (waiting) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      waiting = true;
      e.preventDefault();
      e.stopImmediatePropagation();
      getToken().then(function () {
        var wait = fetchedAt ? Math.max(0, 1150 - (Date.now() - fetchedAt)) : 0;
        setTimeout(function () {
          waiting = false;
          relaunched = true;
          if (typeof form.requestSubmit === 'function') form.requestSubmit(); else form.submit();
        }, wait);
      });
    }, true);
  }

  function init() {
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) {
      var action = forms[i].getAttribute('action') || '';
      if (action.indexOf(ENDPOINT) !== -1) guard(forms[i]);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
