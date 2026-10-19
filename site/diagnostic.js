/* CAP USA — Diagnostic en 5 étapes (HTML/CSS/JS natifs, sans dépendance).
   - Envoi : Formspree via window.CapUsaLead (timeout, relance) défini dans index.html.
   - Scoring : INDICATIF, calculé côté client (donc modifiable par le visiteur) — ne sert qu'à prioriser
     le suivi commercial. Jamais affiché au visiteur, ne refuse aucun profil.
   - Aucune donnée sensible collectée (pas de passeport, de statut migratoire détaillé, ni de montants). */
(function () {
  'use strict';
  var form = document.getElementById('qualForm');
  if (!form) return;

  var card = document.getElementById('diagCard');
  var steps = [].slice.call(form.querySelectorAll('.dstep'));
  var TOTAL = steps.length;
  var STEP_NAMES = ['project_type', 'details', 'maturity', 'support', 'contact'];
  var stepLabelEl = document.getElementById('diagStepLabel');
  var progressEl = document.getElementById('diagProgress');
  var errorsEl = document.getElementById('diagErrors');
  var alertEl = document.getElementById('qualFormAlert');
  var successEl = document.getElementById('qualFormSuccess');
  var panels = [].slice.call(form.querySelectorAll('.dpanel'));
  var idx = 0, started = false, submitted = false, sending = false, contactFired = false;
  var firstInteractionAt = 0;
  var MIN_FILL_MS = 8000; // antispam : un humain ne remplit pas 5 étapes en moins de 8 s
  var ENTRY_KEY = 'capusa_entry_source';

  /* ---------- Utilitaires ---------- */
  function $(sel, root) { return (root || form).querySelector(sel); }
  function radio(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function text(name) { var el = form.querySelector('[name="' + name + '"]'); return el && !el.disabled ? (el.value || '').trim() : ''; }
  function track(name, params) {
    if (window.CapUsaTrack) CapUsaTrack.fire(name, params || {});
    else if (typeof gtag === 'function') gtag('event', name, params || {});
  }
  function labelOf(input) { var l = input.closest('label'); return l ? l.textContent.trim().replace(/\s+/g, ' ') : input.value; }
  function storeGet(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function storeSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* stockage indisponible : sans impact */ } }

  // Mémorise le CTA d'entrée (data-diag-source) pour l'attribuer à la demande.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-diag-source]');
    if (a) storeSet(ENTRY_KEY, a.getAttribute('data-diag-source'));
  });

  /* ---------- Panneaux conditionnels (étape 2) ---------- */
  // Les champs des panneaux masqués sont désactivés : ni validés, ni transmis.
  function syncPanels() {
    var type = radio('project_type');
    panels.forEach(function (p) {
      var on = p.getAttribute('data-panel') === type;
      p.hidden = !on;
      [].slice.call(p.querySelectorAll('input,textarea,select')).forEach(function (c) { c.disabled = !on; });
    });
  }

  /* ---------- Affichage des étapes ---------- */
  function render() {
    steps.forEach(function (s, i) { s.hidden = i !== idx; });
    var label = 'Étape ' + (idx + 1) + ' sur ' + TOTAL;
    if (stepLabelEl) stepLabelEl.textContent = label;
    if (progressEl) {
      progressEl.setAttribute('aria-valuenow', String(idx + 1));
      progressEl.setAttribute('aria-valuetext', label);
      [].slice.call(progressEl.children).forEach(function (seg, i) { seg.classList.toggle('done', i <= idx); });
    }
  }
  function focusStep() {
    var h = steps[idx].querySelector('.dstep-title');
    if (h) { try { h.focus({ preventScroll: false }); } catch (e) { h.focus(); } }
  }
  /* questionnaire_step_viewed : une seule fois par étape, et seulement quand le diagnostic est réellement visible
     (pas au chargement de la page, formulaire hors écran). */
  var formVisible = false, viewedSteps = {};
  function trackStepViewed() {
    if (!formVisible || viewedSteps[idx]) return;
    viewedSteps[idx] = true;
    track('questionnaire_step_viewed', { step_name: STEP_NAMES[idx], project_type: radio('project_type') });
  }
  function show(i, userAction) {
    idx = Math.max(0, Math.min(TOTAL - 1, i));
    clearErrors();
    render();
    if (userAction) formVisible = true; // une action de l'utilisateur implique que le formulaire est à l'écran
    trackStepViewed();
    if (idx === TOTAL - 1 && !contactFired) { contactFired = true; track('questionnaire_contact_reached', { project_type: radio('project_type') }); }
    if (userAction) focusStep();
  }

  /* ---------- Validation accessible ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[+0-9 ().\-]{6,22}$/;
  function clearErrors() {
    errorsEl.hidden = true; errorsEl.innerHTML = '';
    [].slice.call(form.querySelectorAll('.field-err')).forEach(function (e) { e.textContent = ''; });
    [].slice.call(form.querySelectorAll('[aria-invalid]')).forEach(function (e) { e.removeAttribute('aria-invalid'); });
  }
  function validateStep() {
    var problems = [];
    function fail(el, msg) {
      var wrap = el.closest('.fld') || el.parentNode;
      var err = wrap.querySelector('.field-err');
      if (err) {
        if (!err.id) err.id = 'err-' + (el.name || el.id || Math.random().toString(36).slice(2, 7));
        err.textContent = msg;
        el.setAttribute('aria-describedby', err.id);
      }
      el.setAttribute('aria-invalid', 'true');
      var lg = wrap.querySelector('legend');
      var name = lg ? lg.textContent.trim() : (wrap.querySelector('label') ? wrap.querySelector('label').textContent.trim().replace(/\s*\(.*\)$/, '') : '');
      if (!el.id) el.id = 'f-' + (el.name || 'x') + '-' + problems.length;
      problems.push({ id: el.id, msg: (name ? name + ' : ' : '') + msg, el: el });
    }
    var step = steps[idx];
    [].slice.call(step.querySelectorAll('fieldset[data-required]')).forEach(function (fs) {
      if (fs.closest('.dpanel') && fs.closest('.dpanel').hidden) return;
      var name = fs.getAttribute('data-required');
      if (!form.querySelector('input[name="' + name + '"]:checked')) {
        if (!fs.id) fs.id = 'fs-' + name;
        var first = fs.querySelector('input'); fs.setAttribute('aria-invalid', 'true');
        var err = fs.querySelector('.field-err'); if (err) { if (!err.id) err.id = 'err-' + name; err.textContent = 'Choisissez une réponse.'; fs.setAttribute('aria-describedby', err.id); }
        problems.push({ id: first.id || (first.id = 'f-' + name), msg: fs.querySelector('legend').textContent.trim() + ' : choisissez une réponse.', el: first });
      }
    });
    [].slice.call(step.querySelectorAll('input[data-required],textarea[data-required],select[data-required]')).forEach(function (el) {
      if (el.disabled || (el.closest('.dpanel') && el.closest('.dpanel').hidden)) return;
      var v = (el.value || '').trim();
      if (el.type === 'checkbox') { if (!el.checked) fail(el, 'cette case est nécessaire pour traiter votre demande.'); return; }
      if (!v) return fail(el, 'ce champ est requis.');
      if (el.type === 'email' && !EMAIL_RE.test(v)) return fail(el, 'adresse e-mail invalide (ex. nom@exemple.com).');
      var min = parseInt(el.getAttribute('data-minlen') || '0', 10);
      if (min && v.length < min) return fail(el, 'quelques mots de plus nous aideront (' + min + ' caractères minimum).');
    });
    if (idx === TOTAL - 1) {
      var ph = form.querySelector('[name="phone"]');
      var pv = (ph.value || '').trim();
      var needPhone = /^(telephone|rappel)$/.test(radio('preferred_contact'));
      if (needPhone && !pv) fail(ph, 'indiquez un numéro pour être joint(e) ou rappelé(e).');
      else if (pv && !PHONE_RE.test(pv)) fail(ph, 'numéro de téléphone invalide.');
    }
    if (problems.length) {
      errorsEl.innerHTML = '<p><strong>' + (problems.length > 1 ? 'Merci de corriger ces ' + problems.length + ' points :' : 'Merci de corriger ce point :') + '</strong></p><ul>' +
        problems.map(function (p) { return '<li><a href="#' + p.id + '" data-goto="' + p.id + '">' + p.msg.replace(/</g, '&lt;') + '</a></li>'; }).join('') + '</ul>';
      errorsEl.hidden = false;
      errorsEl.focus();
    }
    return problems.length === 0;
  }
  errorsEl.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-goto]'); if (!a) return;
    e.preventDefault();
    var t = document.getElementById(a.getAttribute('data-goto')); if (t) t.focus();
  });

  /* ---------- Scoring indicatif (100 points) ---------- */
  var MATURITE = { idee: 5, compare: 10, decide: 18, pret: 25 };                          // /25
  var ECHEANCE = { sans_echeance: 0, plus_12: 5, '6_12': 10, '3_6': 15, moins_3: 20 };   // /20
  var AIDE = { info: 5, clarifier: 12, orientation: 20 };                                // /20
  var CABINET = { mise_en_relation: 15, conditions: 10, attendre: 3 };                   // /15
  var CLASSES = { A: { min: 70, label: 'Projet prioritaire' }, B: { min: 40, label: 'Projet à accompagner' }, C: { min: 0, label: 'Projet en découverte' } };
  function precision() { // /20 — précision et exhaustivité des informations sur le projet
    var t = radio('project_type');
    if (t === 'societe') return (/^(llc|corporation)$/.test(radio('structure_type')) ? 10 : 4) + (radio('objectif_societe') !== 'autre' ? 10 : 4);
    if (t === 'immigration') return (radio('visa_category') !== 'indecis' ? 10 : 4) + (radio('objectif_immigration') !== 'autre' ? 10 : 4);
    if (t === 'implantation') return (radio('activite') !== 'autre' ? 10 : 4) + (radio('besoin_prioritaire') !== 'premiers_pas' ? 10 : 4);
    var n = text('description_projet').length;            // « Autre » : plafonné à 12, la précision dépend de la description
    return n >= 100 ? 12 : n >= 40 ? 8 : 4;
  }
  function computeScore() {
    var s = {
      precision: precision(),
      maturite: MATURITE[radio('maturite')] || 0,
      echeance: ECHEANCE[radio('echeance')] || 0,
      aide: AIDE[radio('type_aide')] || 0,
      cabinet: CABINET[radio('intention_cabinet')] || 0
    };
    s.total = s.precision + s.maturite + s.echeance + s.aide + s.cabinet;
    s.label = s.total >= CLASSES.A.min ? 'A' : s.total >= CLASSES.B.min ? 'B' : 'C';
    return s;
  }
  window.CapUsaDiagScore = computeScore; // exposé pour tests / audit (lecture seule)

  /* ---------- Résumé + charge utile ---------- */
  function buildResume() {
    var parts = [];
    steps.forEach(function (st) {
      [].slice.call(st.querySelectorAll('fieldset')).forEach(function (fs) {
        if (fs.closest('.dpanel') && fs.closest('.dpanel').hidden) return;
        var checked = fs.querySelector('input:checked'); var lg = fs.querySelector('legend');
        if (checked && lg) parts.push(lg.textContent.trim() + ' ' + labelOf(checked));
      });
    });
    var d = text('description_projet'); if (d) parts.push('Description : ' + d);
    return 'Résumé du diagnostic — ' + parts.join(' · ');
  }
  function buildPayload(s) {
    var fd = new FormData(form); // exclut automatiquement les champs désactivés (panneaux masqués)
    var type = radio('project_type');
    fd.set('source', 'questionnaire_diagnostic');
    fd.set('submitted_at', new Date().toISOString());
    fd.set('page_url', location.pathname);
    fd.set('entry_source', storeGet(ENTRY_KEY) || 'direct');
    fd.set('lead_score', String(s.total));
    fd.set('lead_label', s.label);
    fd.set('lead_priority', CLASSES[s.label].label);
    fd.set('score_precision', String(s.precision));
    fd.set('score_maturite', String(s.maturite));
    fd.set('score_echeance', String(s.echeance));
    fd.set('score_accompagnement', String(s.aide));
    fd.set('score_consultation', String(s.cabinet));
    fd.set('resume_qualification', buildResume());
    fd.set('_subject', (s.label === 'A' ? '🔥 Projet prioritaire (A) — ' : 'Nouveau projet (' + s.label + ') — ') + 'CAP USA · ' + (type || 'projet'));
    if (window.CapUsaCrm) {
      CapUsaCrm.normalize(fd, {
        lead_status: 'nouveau', lead_score: s.total, project_type: type, timeline: radio('echeance'),
        investment_range: '', country: text('country'), contact_preference: radio('preferred_contact')
      });
      if (CapUsaCrm.attachAttribution) CapUsaCrm.attachAttribution(fd);
    }
    return fd;
  }

  /* ---------- Navigation ---------- */
  function next() {
    if (!firstInteractionAt) firstInteractionAt = Date.now();
    if (!validateStep()) return;
    if (!started) { started = true; track('questionnaire_started', { project_type: radio('project_type') }); }
    if (idx === 0) track('questionnaire_project_selected', { project_type: radio('project_type') });
    track('questionnaire_step_completed', { step_name: STEP_NAMES[idx], project_type: radio('project_type') });
    if (idx < TOTAL - 1) show(idx + 1, true);
  }
  function prev() {
    track('questionnaire_back_clicked', { step_name: STEP_NAMES[idx] });
    show(idx - 1, true);
  }
  [].slice.call(form.querySelectorAll('[data-dnext]')).forEach(function (b) { b.addEventListener('click', next); });
  [].slice.call(form.querySelectorAll('[data-dprev]')).forEach(function (b) { b.addEventListener('click', prev); });
  form.addEventListener('change', function (e) {
    if (!firstInteractionAt) firstInteractionAt = Date.now();
    if (e.target.name === 'project_type') syncPanels();
    if (e.target.closest && e.target.closest('[aria-invalid="true"]')) clearErrors();
  });

  /* ---------- Envoi ---------- */
  function showAlert(reason) {
    alertEl.innerHTML = window.CapUsaLead ? CapUsaLead.errorMessage(reason)
      : 'Une erreur est survenue lors de l\'envoi. Merci de réessayer ou d\'écrire à <a href="mailto:contact@hellocapusa.com">contact@hellocapusa.com</a>.';
    alertEl.hidden = false;
  }
  function showSuccess() {
    var fn = text('first_name');
    var t = document.getElementById('qualSuccessText');
    if (t) t.textContent = (fn ? 'Merci ' + fn + '. ' : 'Merci. ') + 'CAP USA va examiner les informations que vous avez transmises.';
    form.hidden = true; errorsEl.hidden = true;
    if (progressEl) progressEl.parentNode.hidden = true;
    successEl.hidden = false;
    var h = successEl.querySelector('h3'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  }
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (idx < TOTAL - 1) return next();           // Entrée dans un champ = étape suivante
    if (sending) return;
    if (!validateStep()) return;
    alertEl.hidden = true;
    // Antispam silencieux : honeypot rempli ou remplissage anormalement rapide → faux succès, rien n'est envoyé.
    var hp = form.querySelector('[name="_gotcha"]');
    if ((hp && hp.value) || (firstInteractionAt && Date.now() - firstInteractionAt < MIN_FILL_MS)) { submitted = true; return showSuccess(); }
    sending = true;
    var btn = steps[idx].querySelector('button[type="submit"]'); var lbl = btn.textContent;
    btn.disabled = true; btn.textContent = 'Envoi en cours…';
    var s = computeScore();
    var payload = buildPayload(s);
    var send = window.CapUsaLead ? CapUsaLead.submit('qualForm', form.action, payload)
      : fetch(form.action, { method: 'POST', body: payload, headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw { reason: 'server' }; return r; });
    send.then(function () {     // confirmation affichée UNIQUEMENT après réponse OK de Formspree
      submitted = true;
      var type = radio('project_type');
      track('questionnaire_submitted', { project_type: type, step_name: 'contact' });
      track('questionnaire_completed', { project_type: type, lead_label: s.label });
      track('lead_submitted', { source: 'questionnaire_diagnostic', project_type: type, lead_label: s.label });
      track('generate_lead', { lead_type: 'diagnostic' });
      showSuccess();
    }).catch(function (err) {
      sending = false; btn.disabled = false; btn.textContent = lbl;
      showAlert(err && err.reason);
    });
  });

  window.addEventListener('pagehide', function () {
    if (started && !submitted) track('questionnaire_abandoned', { step_name: STEP_NAMES[idx], project_type: radio('project_type') });
  });

  syncPanels();
  show(0, false);
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { formVisible = true; trackStepViewed(); vio.disconnect(); }
    }, { threshold: 0.2 });
    vio.observe(form);
  } else { formVisible = true; trackStepViewed(); }
})();
