<?php
// Test de cap_ip_hash : regroupement des adresses IPv6 par bloc /64 ; les IPv4 restent distinctes.
declare(strict_types=1);
$_SERVER['DOCUMENT_ROOT'] = sys_get_temp_dir();
require __DIR__ . '/../../site/api/_core.php';
$cfg = ['secret' => str_repeat('a', 64), 'trust_forwarded_for' => false];
$h = static function (string $ip) use ($cfg): string {
    $_SERVER['REMOTE_ADDR'] = $ip;
    unset($_SERVER['HTTP_X_FORWARDED_FOR']);
    return cap_ip_hash($cfg);
};
$fail = 0;
$check = static function (string $name, bool $ok) use (&$fail): void {
    echo ($ok ? '  ok   ' : '  ECHEC ') . $name . "\n";
    if (!$ok) { $fail++; }
};
$check('même bloc /64 IPv6 -> même empreinte', $h('2a0d:3341:cae3:f408:2c6a:e37d:5698:1bc9') === $h('2a0d:3341:cae3:f408:1111:2222:3333:4444'));
$check('blocs /64 différents -> empreintes différentes', $h('2a0d:3341:cae3:f408::1') !== $h('2a0d:3341:cae3:f409::1'));
$check('IPv4 différentes -> empreintes différentes', $h('203.0.113.5') !== $h('203.0.113.6'));
$check('IPv4 identiques -> même empreinte', $h('203.0.113.5') === $h('203.0.113.5'));
$check('empreinte de 32 caractères hexadécimaux', (bool) preg_match('/^[a-f0-9]{32}$/', $h('203.0.113.5')));
$check('l\'IP elle-même n\'apparaît pas dans l\'empreinte', !str_contains($h('203.0.113.5'), '203'));
exit($fail ? 1 : 0);
