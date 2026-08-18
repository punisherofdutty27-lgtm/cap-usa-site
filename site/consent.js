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
  function gtag(){dataLayer.push(arguments);}
  window.gtag=gtag;
  gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','wait_for_update':500});

  /* Tant que GA_ID/ADS_ID restent des placeholders, gtag.js n'est jamais chargé :
     aucune requête vers googletagmanager.com n'est effectuée. Remplacer l'un des
     deux identifiants ci-dessus par une vraie valeur suffit à réactiver le chargement. */
  if(GA_ACTIVE||ADS_ACTIVE){
    var gtagScript=document.createElement('script');
    gtagScript.async=true;
    gtagScript.src='https://www.googletagmanager.com/gtag/js?id='+(GA_ACTIVE?GA_ID:ADS_ID);
    document.head.appendChild(gtagScript);
    gtag('js',new Date());
    if(GA_ACTIVE)gtag('config',GA_ID);
    if(ADS_ACTIVE)gtag('config',ADS_ID);
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
     Capturée UNIQUEMENT si le consentement "Publicité" est accordé (même
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
  function captureAttribution(prefs){
    if(!prefs||!prefs.ads)return;
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
    if(prefs.ads&&typeof loadMetaPixel==='function')loadMetaPixel();
  }
  function savePrefs(prefs){
    try{localStorage.setItem('cookie_consent_v2',JSON.stringify(prefs));localStorage.removeItem('cookie_consent');}catch(e){}
    apply(prefs);
  }

  var saved=loadPrefs();
  if(saved)apply(saved);

  /* --- Bannière : injectée dans le DOM au chargement, identique sur toutes les pages --- */
  var BANNER_HTML=''+
  '<div class="ck-wrap">'+
    '<div id="ckMain">'+
      '<h2 class="ck-title">Nous respectons votre vie privée</h2>'+
      '<p class="ck-text">CAP USA LLC utilise des cookies et technologies similaires pour assurer le fonctionnement du site, mesurer son audience et, avec votre accord, mesurer l\'efficacité de nos campagnes publicitaires.</p>'+
      '<p class="ck-text">Certains de ces outils sont fournis par Google (Google Analytics et Google Ads) et Meta.</p>'+
      '<p class="ck-text">Vous pouvez accepter, refuser ou personnaliser les cookies non essentiels, et modifier votre choix à tout moment depuis le lien « Gérer mes cookies » disponible en bas du site. <a href="politique-cookies.html">En savoir plus</a>.</p>'+
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
        '<div class="ck-cat-head"><span>Mesure d\'audience</span><label class="ck-switch"><input type="checkbox" id="ckAnalytics" checked><span></span></label></div>'+
        '<p class="ck-cat-desc">Google Analytics — nous aide à comprendre comment le site est utilisé, pour l\'améliorer.</p>'+
      '</div>'+
      '<div class="ck-cat">'+
        '<div class="ck-cat-head"><span>Publicité</span><label class="ck-switch"><input type="checkbox" id="ckAds" checked><span></span></label></div>'+
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

    function showMain(){main.hidden=false;detail.hidden=true;}
    function showDetail(prefs){
      chkAnalytics.checked=prefs?prefs.analytics!==false:true;
      chkAds.checked=prefs?prefs.ads!==false:true;
      main.hidden=true;detail.hidden=false;
    }
    function openBanner(view,prefs){
      banner.style.display='block';document.body.classList.add('has-cookie');
      if(view==='detail')showDetail(prefs);else showMain();
    }
    function closeBanner(){banner.style.display='none';document.body.classList.remove('has-cookie');}

    if(!saved)openBanner('main');

    document.getElementById('ckAccept').addEventListener('click',function(){savePrefs({analytics:true,ads:true});saved={analytics:true,ads:true};closeBanner();});
    document.getElementById('ckRefuse').addEventListener('click',function(){savePrefs({analytics:false,ads:false});saved={analytics:false,ads:false};closeBanner();});
    document.getElementById('ckCustomize').addEventListener('click',function(){showDetail(saved);});
    document.getElementById('ckBack').addEventListener('click',showMain);
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
      window.CookieConsent.open('detail');
    });

    if(location.hash==='#gerer-cookies')openBanner('detail',saved);
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}
})();
