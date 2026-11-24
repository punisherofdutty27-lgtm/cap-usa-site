<?php
/**
 * MODÈLE de configuration : ne contient AUCUN secret réel et n'est jamais déployé sur le site.
 *
 * À installer À LA MAIN sous /home/hellocx/cap-usa-private/config.php (dossier au-dessus de www/, donc hors de
 * l'espace public), avec les droits 0600. Remplacer les valeurs « À_REMPLIR ».
 * Ne jamais commiter le vrai fichier (config.php est ignoré par .gitignore).
 */
return [
    // Serveur SMTP OVH (MX Plan) : smtp.mail.ovh.net, port 465 (SSL/TLS) ou 587 (STARTTLS, secure = 'tls')
    'smtp_host'   => 'smtp.mail.ovh.net',
    'smtp_port'   => 465,
    'smtp_secure' => 'ssl',

    // Compte qui authentifie l'envoi : la boîte leads@hellocapusa.net
    'smtp_user'   => 'leads@hellocapusa.net',
    'smtp_pass'   => 'À_REMPLIR',            // mot de passe de la boîte (à saisir vous-même, jamais dans le dépôt)

    // L'expéditeur DOIT être l'adresse du compte authentifié ; les notifications arrivent dans la même boîte
    'mail_from'      => 'leads@hellocapusa.net',
    'mail_from_name' => 'CAP USA formulaires',
    'mail_to'        => ['leads@hellocapusa.net'],

    // Clé de signature des jetons et des empreintes (32 caractères minimum, aléatoire) :
    //   php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
    'secret'      => 'À_REMPLIR_AVEC_64_CARACTERES_ALÉATOIRES',

    // Facultatif (valeurs par défaut entre parenthèses)
    // 'allowed_hosts'        => ['hellocapusa.com', 'www.hellocapusa.com'],
    // 'queue_on_failure'     => true,    // garde la demande si l'envoi SMTP échoue, puis la renvoie
    // 'queue_retention_days' => 14,
    // 'rate_per_10min'       => 5,       // envois par IP (empreinte) et par 10 minutes
    // 'rate_per_day'         => 20,
    // 'rate_global_per_hour' => 60,      // plafond global (quota SMTP OVH ≈ 200/heure)
    // 'trust_forwarded_for'  => false,   // à n'activer qu'après vérification de l'adresse IP réelle
    // 'webhook_url'          => '',      // réservé à une future intégration CRM
];
