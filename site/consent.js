/* Consentement cookies CAP USA — chargé sur toutes les pages du site.
   Centralise : Google Consent Mode (GA4 + Ads), chargement conditionnel du Meta Pixel,
   et la bannière (Tout accepter / Tout refuser / Personnaliser), pour un comportement
   strictement identique quelle que soit la page d'entrée du visiteur.
   Remplacer G-XXXXXXXXXX / AW-XXXXXXXXXX / META_PIXEL_ID par les identifiants réels. */
(function(){
  "use strict";
  var GA_ID='G-3D029HFJMS', ADS_ID='AW-XXXXXXXXXX';
  var GA_ACTIVE=GA_ID!=='G-XXXXXXXXXX', ADS_ACTIVE=ADS_ID!=='AW-XXXXXXXXXX';

  /* Exposé en lecture seule pour lead-tracking.js : source unique de vérité sur
     l'état d'activation GA/Ads/Meta, pour éviter de dupliquer la détection de
     placeholder ailleurs. Ne change rien au comportement de Consent Mode. */
  window.CapUsaConsent={
    GA_ID:GA_ID, ADS_ID:ADS_ID, GA_ACTIVE:GA_ACTIVE, ADS_ACTIVE:ADS_ACTIVE,
    metaPixelActive:function(){return typeof window.__metaPixelId==='string'&&window.__metaPixelId!=='META_PIXEL_ID';},
    metaPixelLoaded:function(){return !!window.__metaPixelLoaded;}
  };

  /* --- Google Consent Mode : doit être défini avant le chargement de gtag.js --- */
  window.dataLayer=window.dataLayer||[];
  /* Mesure Analytics = consentement explicite. Tant qu'il n'est pas accordé :
     - gtag.js n'est PAS chargé (voir syncGoogle) : aucune requête vers Google ;
     - les appels gtag('event', ...) du site sont ignorés (non mis en file), pour ne jamais être envoyés
       rétroactivement au chargement de gtag.js. Les appels 'consent', 'js' et 'config' passent toujours. */
  var analyticsGranted=false;
  function gtag(){
    if(arguments[0]==='event'&&!analyticsGranted)return;
    dataLayer.push(arguments);
  }
  window.gtag=gtag;
  /* Consent Mode : état par défaut refusé ; mis à jour par apply() avant le chargement de gtag.js. */
  gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','wait_for_update':500});
  /* Interrupteur officiel de désactivation GA : actif tant que l'Analytics n'est pas consenti. */
  if(GA_ACTIVE)window['ga-disable-'+GA_ID]=true;

  var gtagLoaded=false, gaConfigured=false, adsConfigured=false;
  /* Supprime les cookies Google Analytics (_ga, _ga_<ID>, _gid, _gat*) sur le domaine courant et ses parents.
     Les cookies publicitaires (_gcl_*) relèvent du consentement Publicité et ne sont pas touchés ici. */
  function purgeGaCookies(){
    try{
      var host=location.hostname,parts=host.split('.'),domains=[''];
      domains.push(host);
      for(var i=0;i<parts.length-1;i++)domains.push('.'+parts.slice(i).join('.'));
      document.cookie.split(';').forEach(function(c){
        var n=c.split('=')[0].trim();
        if(!/^(_ga(_[A-Za-z0-9]+)?|_gid|_gat(_.*)?)$/.test(n))return;
        domains.forEach(function(d){
          document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'+(d?';domain='+d:'');
        });
      });
    }catch(err){}
  }
  /* Charge / configure / désactive Google selon les préférences. Appelée par apply(), APRÈS le consent 'update'. */
  function syncGoogle(prefs){
    var wantGA=GA_ACTIVE&&!!prefs.analytics, wantAds=ADS_ACTIVE&&!!prefs.ads;
    analyticsGranted=!!prefs.analytics;
    if(GA_ACTIVE)window['ga-disable-'+GA_ID]=!wantGA;   // retrait : plus aucune nouvelle mesure
    if(!analyticsGranted)purgeGaCookies();               // retrait / refus : cookies Analytics existants supprimés
    if(!wantGA&&!wantAds)return;
    if(!gtagLoaded){
      gtagLoaded=true;
      var gtagScript=document.createElement('script');
      gtagScript.async=true;
      gtagScript.src='https://www.googletagmanager.com/gtag/js?id='+(wantGA?GA_ID:ADS_ID);
      document.head.appendChild(gtagScript);
      gtag('js',new Date());
    }
    if(wantGA&&!gaConfigured){gaConfigured=true;gtag('config',GA_ID);}
    if(wantAds&&!adsConfigured){adsConfigured=true;gtag('config',ADS_ID);}
  }

  /* --- Meta Pixel : pas de "consent mode" natif chez Meta — le script n'est donc
     jamais injecté avant un consentement publicité explicite. --- */
  window.__metaPixelId='META_PIXEL_ID';
  window.loadMetaPixel=function(){
    if(window.__metaPixelLoaded||window.__metaPixelId==='META_PIXEL_ID')return;
    window.__metaPixelLoaded=true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init',window.__metaPixelId);
    fbq('track','PageView');
  };

  /* --- Attribution marketing (UTM / gclid / fbclid) -------------------------
     Capturée UNIQUEMENT si le consentement "Publicité" est accordé ; effacée au refus / au retrait du consentement,
     et non lue par get() sans consentement en vigueur (même
     logique que le chargement du Meta Pixel juste au-dessus) : ces
     identifiants ne servent qu'à la mesure de campagnes, donc relèvent de la
     même catégorie de consentement — jamais des cookies "nécessaires".
     Conservée en localStorage pour tout le parcours, même si le visiteur
     atterrit sur une autre page (blog, guide…) avant de revenir convertir.
     Une nouvelle visite avec paramètres écrase l'ancienne valeur (dernier
     clic publicitaire avant conversion, cohérent avec l'attribution native
     de Google Ads). Jamais affichée à l'utilisateur : lue uniquement par le
     JS des formulaires (index.html), voir CapUsaAttribution.get(). */
  var ATTRIBUTION_KEYS=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'];
  var ATTRIBUTION_STORAGE_KEY='capusa_attribution';
  function clearAttribution(){
    try{localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);}catch(e){/* localStorage indisponible : rien à effacer */}
  }
  function captureAttribution(prefs){
    // Refus initial ou retrait du consentement « Publicité » : on efface les données d'attribution déjà conservées.
    if(!prefs||!prefs.ads){clearAttribution();return;}
    try{
      var params=new URLSearchParams(window.location.search);
      var found={}, hasAny=false;
      ATTRIBUTION_KEYS.forEach(function(k){
        var v=params.get(k);
        if(v){found[k]=v;hasAny=true;}
      });
      if(hasAny){
        found.landing_page=window.location.pathname;
        found.captured_at=new Date().toISOString();
        localStorage.setItem(ATTRIBUTION_STORAGE_KEY,JSON.stringify(found));
      }
    }catch(e){/* localStorage indisponible : l'attribution sera simplement absente, jamais bloquant */}
  }
  window.CapUsaAttribution={
    get:function(){
      try{
        // Jamais de réutilisation sans consentement « Publicité » en vigueur (garde-fou en plus de la purge).
        var p=loadPrefs();
        if(!p||!p.ads)return {};
        var raw=localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
        return raw?JSON.parse(raw):{};
      }catch(e){return {};}
    }
  };

  /* --- État du consentement --- */
  function loadPrefs(){
    try{
      var v2=localStorage.getItem('cookie_consent_v2');
      if(v2)return JSON.parse(v2);
      var v1=localStorage.getItem('cookie_consent');
      if(v1==='granted')return {analytics:true,ads:true};
      if(v1==='denied')return {analytics:false,ads:false};
    }catch(e){}
    return null;
  }
  function apply(prefs){
    captureAttribution(prefs);
    if(typeof gtag==='function'){gtag('consent','update',{
      'ad_storage':prefs.ads?'granted':'denied','ad_user_data':prefs.ads?'granted':'denied','ad_personalization':prefs.ads?'granted':'denied',
      'analytics_storage':prefs.analytics?'granted':'denied'});}
    syncGoogle(prefs);
    if(prefs.ads&&typeof loadMetaPixel==='function')loadMetaPixel();
  }
  function savePrefs(prefs){
    try{localStorage.setItem('cookie_consent_v2',JSON.stringify(prefs));localStorage.removeItem('cookie_consent');}catch(e){}
    apply(prefs);
  }

  var saved=loadPrefs();
  if(saved)apply(saved);
  else clearAttribution(); // aucun choix enregistré : pas de consentement, donc aucune donnée d'attribution conservée

  /* --- Bannière : injectée dans le DOM au chargement, identique sur toutes les pages --- */
  var BANNER_HTML=''+
  '<div class="ck-wrap">'+
    '<div id="ckMain">'+
      '<h2 class="ck-title">Nous respectons votre vie privée</h2>'+
      '<p class="ck-text">CAP USA LLC utilise des cookies et technologies similaires pour assurer le fonctionnement du site, mesurer son audience et, avec votre accord, mesurer l\'efficacité de nos campagnes publicitaires.</p>'+
      '<p class="ck-text"><span class="ck-long">Certains de ces outils sont fournis par Google (Google Analytics et Google Ads) et Meta.</span><span class="ck-short" style="display:none">Outils fournis par Google (Analytics, Ads) et Meta.</span></p>'+
      '<p class="ck-text"><span class="ck-long">Vous pouvez accepter, refuser ou personnaliser les cookies non essentiels, et modifier votre choix à tout moment depuis le lien « Gérer mes cookies » disponible en bas du site. </span><span class="ck-short" style="display:none">Modifiable à tout moment via « Gérer mes cookies », en bas du site. </span><a href="politique-cookies.html">En savoir plus</a>.</p>'+
      '<div class="ck-btns">'+
        '<button id="ckAccept" type="button" class="ck-btn ck-btn-solid">Tout accepter</button>'+
        '<button id="ckRefuse" type="button" class="ck-btn ck-btn-outline">Tout refuser</button>'+
        '<button id="ckCustomize" type="button" class="ck-btn ck-btn-ghost">Personnaliser</button>'+
      '</div>'+
    '</div>'+
    '<div id="ckDetail" class="ck-detail" hidden>'+
      '<h2 class="ck-title" style="font-size:17px">Personnaliser mes préférences</h2>'+
      '<div class="ck-cat">'+
        '<div class="ck-cat-head"><span>Cookies nécessaires</span><span class="ck-always">Toujours actifs</span></div>'+
        '<p class="ck-cat-desc">Indispensables au fonctionnement du site (navigation, formulaire de contact, sécurité). Ne peuvent pas être désactivés.</p>'+
      '</div>'+
      '<div class="ck-cat">'+
        '<div class="ck-cat-head"><span>Mesure d\'audience</span><label class="ck-switch"><input type="checkbox" id="ckAnalytics"><span></span></label></div>'+
        '<p class="ck-cat-desc">Google Analytics — nous aide à comprendre comment le site est utilisé, pour l\'améliorer.</p>'+
      '</div>'+
      '<div class="ck-cat">'+
        '<div class="ck-cat-head"><span>Publicité</span><label class="ck-switch"><input type="checkbox" id="ckAds"><span></span></label></div>'+
        '<p class="ck-cat-desc">Google Ads et Meta — mesurent l\'efficacité de nos campagnes publicitaires.</p>'+
      '</div>'+
      '<div class="ck-btns">'+
        '<button id="ckSave" type="button" class="ck-btn ck-btn-solid">Enregistrer mes choix</button>'+
        '<button id="ckBack" type="button" class="ck-btn ck-btn-ghost">← Retour</button>'+
      '</div>'+
    '</div>'+
  '</div>';

  function init(){
    if(document.getElementById('cookieBanner'))return; // déjà présente (protection double-inclusion)
    var banner=document.createElement('div');
    banner.className='ck-banner';
    banner.id='cookieBanner';
    banner.setAttribute('role','dialog');
    banner.setAttribute('aria-modal','false');
    banner.setAttribute('aria-label','Préférences de cookies');
    banner.innerHTML=BANNER_HTML;
    document.body.appendChild(banner);

    var main=document.getElementById('ckMain'), detail=document.getElementById('ckDetail');
    var chkAnalytics=document.getElementById('ckAnalytics'), chkAds=document.getElementById('ckAds');

    var trigger=null; // élément à l'origine de l'ouverture du panneau (pour restaurer le focus)
    function focusEl(el){
      if(el&&el.isConnected&&el.getClientRects().length){try{el.focus({preventScroll:true});}catch(e){el.focus();}}
    }
    function showMain(){main.hidden=false;detail.hidden=true;}
    function showDetail(prefs){
      // Catégories facultatives désactivées par défaut ; si un choix existe, on l'affiche tel quel (jamais coché par défaut).
      chkAnalytics.checked=!!(prefs&&prefs.analytics===true);
      chkAds.checked=!!(prefs&&prefs.ads===true);
      main.hidden=true;detail.hidden=false;
    }
    function openBanner(view,prefs){
      banner.style.display='block';document.body.classList.add('has-cookie');
      if(view==='detail')showDetail(prefs);else showMain();
    }
    function closeBanner(){
      banner.style.display='none';document.body.classList.remove('has-cookie');
      // Restaure le focus sur le déclencheur d'origine s'il existe encore et est visible.
      focusEl(trigger);trigger=null;
    }
    // Titre du panneau : cible de focus programmatique (annonce le panneau, puis Tab -> premier interrupteur).
    var detailTitle=detail.querySelector('.ck-title');
    if(detailTitle)detailTitle.setAttribute('tabindex','-1');
    function focusDetail(){focusEl(detailTitle||chkAnalytics);}

    if(!saved)openBanner('main');

    document.getElementById('ckAccept').addEventListener('click',function(){savePrefs({analytics:true,ads:true});saved={analytics:true,ads:true};closeBanner();});
    document.getElementById('ckRefuse').addEventListener('click',function(){savePrefs({analytics:false,ads:false});saved={analytics:false,ads:false};closeBanner();});
    document.getElementById('ckCustomize').addEventListener('click',function(){trigger=this;showDetail(saved);focusDetail();});
    document.getElementById('ckBack').addEventListener('click',function(){showMain();focusEl(document.getElementById('ckCustomize'));});
    document.getElementById('ckSave').addEventListener('click',function(){
      var prefs={analytics:chkAnalytics.checked,ads:chkAds.checked};savePrefs(prefs);saved=prefs;closeBanner();
    });

    window.CookieConsent={
      open:function(view){openBanner(view||'detail',saved);},
      getPrefs:loadPrefs
    };

    /* Ouverture depuis n'importe quel lien/bouton "Gérer mes cookies", sur n'importe quelle page. */
    document.addEventListener('click',function(ev){
      var t=ev.target.closest('#ckManage, a[href*="#gerer-cookies"]');
      if(!t)return;
      ev.preventDefault();
      trigger=t;
      window.CookieConsent.open('detail');
      focusDetail();
    });

    if(location.hash==='#gerer-cookies')openBanner('detail',saved);
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}
})();
