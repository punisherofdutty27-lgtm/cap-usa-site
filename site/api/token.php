<?php
/** Délivre un jeton signé à durée limitée (anti-robot) pour les formulaires. GET uniquement. */
declare(strict_types=1);

require __DIR__ . '/_core.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    cap_json(405, ['ok' => false, 'code' => 'method']);
}
$cfg = cap_config();
cap_json(200, ['ok' => true, 't' => cap_token_issue($cfg)]);
