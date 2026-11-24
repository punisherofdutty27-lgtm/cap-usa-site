<?php
/**
 * Endpoint unique de réception des formulaires CAP USA (POST).
 * Réponses JSON : 200 {ok:true} | 4xx/5xx {ok:false, code:...} ; jamais de détail technique ni de secret.
 */
declare(strict_types=1);

require __DIR__ . '/_core.php';

// ---- définition des formulaires (liste blanche) -------------------------------------------------
// required : champs obligatoires ; consent : case de consentement obligatoire (valeur « oui »)
const CAP_FORMS = [
    'landing_google_ads' => [
        'subject' => 'Landing Google Ads — demande de contact LLC / E-2',
        'required' => ['first_name', 'last_name', 'email', 'phone', 'project_type_label', 'consentement_traitement'],
        'consent' => 'consentement_traitement',
    ],
    'questionnaire_diagnostic' => [
        'subject' => null, // construit à partir du score (voir ci-dessous)
        // description_projet n'est pas exigée : le questionnaire ne l'affiche que pour certaines réponses (branche « Autre »)
        'required' => ['project_type', 'first_name', 'last_name', 'email', 'consentement_traitement'],
        'consent' => 'consentement_traitement',
    ],
    'homepage_lead_magnet' => [
        'subject' => 'Demande de guide (accueil) — CAP USA',
        'required' => ['email'],
        'consent' => null,
    ],
    'guide_page' => [
        'subject' => 'Demande de guide — CAP USA',
        'required' => ['prenom', 'email', 'consentement_mise_en_relation'],
        'consent' => 'consentement_mise_en_relation',
    ],
    'page_compte_bancaire' => [
        'subject' => 'Compte bancaire américain — demande de mise en relation',
        'required' => ['nom', 'email', 'message', 'consentement_mise_en_relation'],
        'consent' => 'consentement_mise_en_relation',
    ],
    'page_ein' => [
        'subject' => 'EIN — demande de mise en relation',
        'required' => ['nom', 'email', 'message', 'consentement_mise_en_relation'],
        'consent' => 'consentement_mise_en_relation',
    ],
    'page_itin' => [
        'subject' => 'ITIN — demande de mise en relation',
        'required' => ['nom', 'email', 'message', 'consentement_mise_en_relation'],
        'consent' => 'consentement_mise_en_relation',
    ],
    'page_registered_agent' => [
        'subject' => 'Registered Agent — demande de mise en relation',
        'required' => ['nom', 'email', 'message', 'consentement_mise_en_relation'],
        'consent' => 'consentement_mise_en_relation',
    ],
    'page_maintien_societe' => [
        'subject' => 'Maintien de société — demande de mise en relation',
        'required' => ['nom', 'email', 'message', 'consentement_mise_en_relation'],
        'consent' => 'consentement_mise_en_relation',
    ],
    'consultation_juridique' => [
        'subject' => 'Consultation juridique — demande de mise en relation (Zouaghi Law PLLC)',
        'required' => ['first_name', 'last_name', 'email', 'country', 'contact_preference', 'domain_label', 'message', 'consentement_transmission_cabinet'],
        'consent' => 'consentement_transmission_cabinet',
    ],
];

const CAP_CONTACT_PREFS = ['email', 'telephone', 'whatsapp'];
const CAP_DOMAIN_CODES = ['societes', 'affaires', 'contrats', 'investissements', 'immobilier', 'immigration', 'autre', 'indetermine'];
const CAP_MAX_FIELD = 4000;
const CAP_MAX_BODY = 65536;

// ---- 1. méthode, taille, origine ------------------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    cap_json(405, ['ok' => false, 'code' => 'method']);
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > CAP_MAX_BODY) {
    cap_json(413, ['ok' => false, 'code' => 'size']);
}
$cfg = cap_config();
if (!cap_origin_ok($cfg)) {
    cap_json(403, ['ok' => false, 'code' => 'origin']);
}

// ---- 2. lecture des champs ---------------------------------------------------------------------------
if (count($_POST) > 150) {
    cap_json(400, ['ok' => false, 'code' => 'invalid']);
}
$raw = [];
foreach ($_POST as $name => $value) {
    if (!is_string($name) || !preg_match('/^[A-Za-z_][A-Za-z0-9_]{0,49}$/', $name) || !is_string($value)) {
        cap_json(400, ['ok' => false, 'code' => 'invalid']);
    }
    $raw[$name] = $value;
}

// ---- 3. champ piège : on répond « ok » sans rien envoyer (même comportement qu'aujourd'hui) ---------
if (trim($raw['_gotcha'] ?? '') !== '') {
    cap_json(200, ['ok' => true]);
}

// ---- 4. formulaire connu ?  ----------------------------------------------------------------------------
$source = (string) ($raw['source'] ?? '');
if (!isset(CAP_FORMS[$source])) {
    cap_json(400, ['ok' => false, 'code' => 'invalid']);
}
$form = CAP_FORMS[$source];

// ---- 5. jeton signé (anti-robot) puis limitation de fréquence -------------------------------------------
if (!cap_token_valid($cfg, (string) ($raw['_t'] ?? ''))) {
    cap_log($source, 'token');
    cap_json(403, ['ok' => false, 'code' => 'token']);
}
cap_housekeeping($cfg);
$ipKey = cap_ip_hash($cfg);
if (!cap_rate_limit($ipKey, [[600, (int) $cfg['rate_per_10min']], [86400, (int) $cfg['rate_per_day']]])
    || !cap_rate_limit(hash('sha256', 'global'), [[3600, (int) $cfg['rate_global_per_hour']]])) {
    cap_log($source, 'rate');
    cap_json(429, ['ok' => false, 'code' => 'rate']);
}

// ---- 6. nettoyage et validation côté serveur -------------------------------------------------------------
$fields = [];
foreach ($raw as $name => $value) {
    if ($name[0] === '_') {
        continue; // champs techniques (_t, _sid, _subject, _next, _gotcha)
    }
    $multiline = in_array($name, ['message', 'description_projet', 'precisions', 'resume_qualification'], true);
    $clean = cap_clean($value, CAP_MAX_FIELD, $multiline);
    if ($clean === null) {
        cap_json(400, ['ok' => false, 'code' => 'invalid']);
    }
    $fields[$name] = $clean;
}

$errors = [];
foreach ($form['required'] as $name) {
    if (($fields[$name] ?? '') === '') {
        $errors[] = $name;
    }
}
if ($form['consent'] !== null && !in_array(strtolower($fields[$form['consent']] ?? ''), ['oui', 'on', '1', 'true', 'yes'], true)) {
    $errors[] = $form['consent'];
}
$email = $fields['email'] ?? '';
if ($email !== '' && (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL))) {
    $errors[] = 'email';
}
if (($fields['phone'] ?? '') !== '' && !preg_match('/^[+0-9 ().\/-]{6,30}$/', $fields['phone'])) {
    $errors[] = 'phone';
}
if (($fields['telephone'] ?? '') !== '' && !preg_match('/^[+0-9 ().\/-]{6,30}$/', $fields['telephone'])) {
    $errors[] = 'telephone';
}
if ($source === 'consultation_juridique') {
    $pref = $fields['contact_preference'] ?? '';
    if (!in_array($pref, CAP_CONTACT_PREFS, true)) {
        $errors[] = 'contact_preference';
    } elseif ($pref !== 'email' && ($fields['phone'] ?? '') === '') {
        $errors[] = 'phone';
    }
    if (!in_array($fields['domain_code'] ?? '', CAP_DOMAIN_CODES, true)) {
        $errors[] = 'domain_code';
    }
}
if ($errors !== []) {
    cap_json(422, ['ok' => false, 'code' => 'validation', 'fields' => array_values(array_unique($errors))]);
}

// ---- 7. identifiant d'envoi : une même demande n'est jamais envoyée deux fois ----------------------------
$sid = (string) ($raw['_sid'] ?? '');
$sidFile = null;
if (preg_match('/^[A-Za-z0-9-]{16,64}$/', $sid)) {
    $sidFile = cap_dir('sent') . '/' . substr(hash_hmac('sha256', $sid, (string) $cfg['secret']), 0, 40);
    if (is_file($sidFile) && filemtime($sidFile) < time() - 86400) {
        @unlink($sidFile); // réservation expirée
    }
    // réservation atomique : si deux requêtes identiques arrivent en même temps, une seule passe
    $claim = @fopen($sidFile, 'x');
    if ($claim === false) {
        cap_json(200, ['ok' => true]); // déjà reçue ou en cours de traitement (nouvelle tentative du navigateur)
    }
    fclose($claim);
}

// ---- 8. objet et corps de l'e-mail (construits par le serveur, jamais copiés du client) -------------------
if ($form['subject'] === null) {
    $label = preg_match('/^[A-D]$/', $fields['lead_label'] ?? '') ? $fields['lead_label'] : '?';
    $type = cap_header_text(preg_replace('/[^a-z0-9_ \-]/i', '', $fields['project_type'] ?? '') ?? '', 30);
    $subject = ($label === 'A' ? '🔥 Projet prioritaire (A) — ' : 'Nouveau projet (' . $label . ') — ') . 'CAP USA · ' . ($type !== '' ? $type : 'projet');
} else {
    $subject = $form['subject'];
}

$lines = ['Formulaire : ' . $source, 'Reçu le : ' . gmdate('Y-m-d H:i:s') . ' UTC', str_repeat('-', 40)];
foreach ($fields as $name => $value) {
    if ($value === '') {
        continue;
    }
    $lines[] = (str_contains($value, "\n") ? $name . " :\n" . $value : $name . ' : ' . $value);
}
$body = implode("\n", $lines) . "\n";

$replyTo = null;
if ($email !== '') {
    $fullName = trim(($fields['first_name'] ?? $fields['prenom'] ?? '') . ' ' . ($fields['last_name'] ?? $fields['nom'] ?? ''));
    $replyTo = ['email' => $email, 'name' => $fullName];
}
$to = array_values((array) $cfg['mail_to']);
$mime = cap_build_message($cfg, $subject, $body, $to, $replyTo);

// ---- 9. envoi SMTP authentifié ; en cas d'échec, mise en file d'attente de secours -----------------------
try {
    cap_smtp_send($cfg, $mime, $to);
    cap_queue_flush($cfg);
    if (!empty($cfg['webhook_url'])) {
        // point d'extension CRM : volontairement non implémenté tant qu'aucun pipeline n'est décidé
    }
    cap_json(200, ['ok' => true]);
} catch (Throwable $e) {
    cap_log($source, $e->getMessage());
    if (!empty($cfg['queue_on_failure']) && cap_queue_add($mime)) {
        cap_json(200, ['ok' => true]); // la demande est conservée et sera renvoyée automatiquement
    }
    if ($sidFile !== null) {
        @unlink($sidFile); // rien n'a été envoyé ni conservé : l'utilisateur pourra réessayer avec le même identifiant
    }
    cap_json(502, ['ok' => false, 'code' => 'mail']);
}
