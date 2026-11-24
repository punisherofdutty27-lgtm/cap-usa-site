<?php
/**
 * CAP USA : noyau de réception des formulaires (remplace Formspree).
 * Fichier interne : l'accès direct par URL est refusé (voir .htaccess du dossier).
 * Les secrets (SMTP, clé de signature) ne sont JAMAIS ici : ils sont lus dans
 * <dossier parent de www>/cap-usa-private/config.php, hors de l'espace public.
 */
declare(strict_types=1);

// ---------------------------------------------------------------- réponses

function cap_json(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// ---------------------------------------------------------------- configuration

function cap_private_dir(): string
{
    $env = getenv('CAP_PRIVATE_DIR');
    if (is_string($env) && $env !== '') {
        return rtrim($env, '/\\');
    }
    $root = (string) ($_SERVER['DOCUMENT_ROOT'] ?? '');
    return dirname($root) . '/cap-usa-private';
}

function cap_config(): array
{
    static $cfg = null;
    if ($cfg !== null) {
        return $cfg;
    }
    $file = cap_private_dir() . '/config.php';
    if (!is_file($file)) {
        error_log('[cap-forms] config absente');
        cap_json(500, ['ok' => false, 'code' => 'server']);
    }
    $loaded = require $file;
    $need = ['smtp_host', 'smtp_user', 'smtp_pass', 'mail_from', 'mail_to', 'secret'];
    foreach ($need as $k) {
        if (!is_array($loaded) || !isset($loaded[$k]) || $loaded[$k] === '' || $loaded[$k] === []) {
            error_log('[cap-forms] config incomplète : ' . $k);
            cap_json(500, ['ok' => false, 'code' => 'server']);
        }
    }
    if (strlen((string) $loaded['secret']) < 32) {
        error_log('[cap-forms] secret trop court');
        cap_json(500, ['ok' => false, 'code' => 'server']);
    }
    $cfg = $loaded + [
        'smtp_port' => 465,
        'smtp_secure' => 'ssl',          // 'ssl' (465), 'tls' (587, STARTTLS) ou 'none' (local uniquement)
        'smtp_verify_peer' => true,
        'ehlo_name' => 'hellocapusa.com',
        'mail_from_name' => 'CAP USA formulaires',
        'allowed_hosts' => ['hellocapusa.com', 'www.hellocapusa.com'],
        'queue_on_failure' => true,
        'queue_retention_days' => 14,
        'trust_forwarded_for' => false,
        'rate_per_10min' => 5,
        'rate_per_day' => 20,
        'rate_global_per_hour' => 60,
        'token_min_age' => 1,
        'token_max_age' => 14400,
        'webhook_url' => '',             // point d'extension (CRM) : désactivé par défaut
    ];
    return $cfg;
}

// ---------------------------------------------------------------- stockage privé minimal

function cap_dir(string $name): string
{
    $dir = cap_private_dir() . '/' . $name;
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir;
}

/** Journal technique : jamais de contenu de demande, seulement source + code d'erreur. */
function cap_log(string $source, string $code): void
{
    $file = cap_dir('logs') . '/forms.log';
    if (is_file($file) && filesize($file) > 200000) {
        @rename($file, $file . '.1');
    }
    $line = gmdate('c') . '|' . preg_replace('/[^a-z0-9_\-]/i', '', $source) . '|' . preg_replace('/[^a-z0-9_\-]/i', '', $code) . "\n";
    @file_put_contents($file, $line, FILE_APPEND | LOCK_EX);
}

function cap_ip_hash(array $cfg): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    if (!empty($cfg['trust_forwarded_for']) && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = trim(explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }
    // IPv6 : un visiteur contrôle tout son bloc /64 ; on compte donc par bloc (les 64 premiers bits)
    $bin = @inet_pton($ip);
    if ($bin !== false && strlen($bin) === 16) {
        $ip = bin2hex(substr($bin, 0, 8)) . '/64';
    }
    return substr(hash_hmac('sha256', $ip, (string) $cfg['secret']), 0, 32);
}

/**
 * Limitation par fenêtres glissantes ($rules = [[secondes, max], ...]) ; fichier par clé,
 * clé = empreinte HMAC de l'IP (l'IP elle-même n'est jamais stockée).
 */
function cap_rate_limit(string $key, array $rules): bool
{
    $file = cap_dir('rl') . '/' . preg_replace('/[^a-f0-9]/', '', $key) . '.json';
    $fp = @fopen($file, 'c+');
    if ($fp === false) {
        return true; // en cas d'échec de stockage, on ne bloque pas un visiteur légitime
    }
    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $times = json_decode($raw === false || $raw === '' ? '[]' : $raw, true);
    $times = is_array($times) ? $times : [];
    $now = time();
    $longest = max(array_column($rules, 0));
    $times = array_values(array_filter($times, static fn ($t) => is_int($t) && $t > $now - $longest));
    $allowed = true;
    foreach ($rules as [$window, $max]) {
        $count = count(array_filter($times, static fn ($t) => $t > $now - $window));
        if ($count >= $max) {
            $allowed = false;
            break;
        }
    }
    if ($allowed) {
        $times[] = $now;
    }
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($times));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $allowed;
}

/** Nettoyage occasionnel (compteurs et empreintes d'envoi de plus de 2 jours, file d'attente expirée). */
function cap_housekeeping(array $cfg): void
{
    if (random_int(1, 50) !== 1) {
        return;
    }
    foreach (['rl', 'sent'] as $d) {
        foreach (glob(cap_dir($d) . '/*') ?: [] as $f) {
            if (is_file($f) && filemtime($f) < time() - 2 * 86400) {
                @unlink($f);
            }
        }
    }
    $max = (int) $cfg['queue_retention_days'] * 86400;
    foreach (glob(cap_dir('queue') . '/*.eml') ?: [] as $f) {
        if (is_file($f) && filemtime($f) < time() - $max) {
            @unlink($f);
        }
    }
}

// ---------------------------------------------------------------- jeton anti-robot (signé, durée limitée)

function cap_token_issue(array $cfg): string
{
    $payload = time() . '.' . bin2hex(random_bytes(6));
    return $payload . '.' . hash_hmac('sha256', $payload, (string) $cfg['secret']);
}

function cap_token_valid(array $cfg, string $token): bool
{
    $parts = explode('.', $token);
    if (count($parts) !== 3 || !ctype_digit($parts[0])) {
        return false;
    }
    $expected = hash_hmac('sha256', $parts[0] . '.' . $parts[1], (string) $cfg['secret']);
    if (!hash_equals($expected, $parts[2])) {
        return false;
    }
    $age = time() - (int) $parts[0];
    return $age >= (int) $cfg['token_min_age'] && $age <= (int) $cfg['token_max_age'];
}

// ---------------------------------------------------------------- origine

function cap_origin_ok(array $cfg): bool
{
    $candidates = [];
    foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $h) {
        if (!empty($_SERVER[$h])) {
            $candidates[] = (string) $_SERVER[$h];
        }
    }
    if ($candidates === []) {
        return false;
    }
    foreach ($candidates as $url) {
        $host = parse_url($url, PHP_URL_HOST);
        if (!is_string($host) || !in_array(strtolower($host), array_map('strtolower', $cfg['allowed_hosts']), true)) {
            return false;
        }
    }
    return true;
}

// ---------------------------------------------------------------- nettoyage des champs

function cap_clean(string $v, int $max, bool $multiline = false): ?string
{
    if (!mb_check_encoding($v, 'UTF-8')) {
        return null;
    }
    $v = str_replace(["\r\n", "\r"], "\n", $v);
    $v = preg_replace($multiline ? '/[^\P{C}\n\t]/u' : '/\p{C}/u', '', $v) ?? '';
    $v = trim($v);
    return mb_substr($v, 0, $max, 'UTF-8');
}

function cap_header_text(string $v, int $max = 120): string
{
    $v = preg_replace('/[\r\n\p{C}<>"\\\\]/u', ' ', $v) ?? '';
    return trim(mb_substr($v, 0, $max, 'UTF-8'));
}

// ---------------------------------------------------------------- e-mail (MIME) et SMTP authentifié

function cap_encode_header(string $text): string
{
    if (preg_match('/^[\x20-\x7E]*$/', $text)) {
        return $text;
    }
    return mb_encode_mimeheader($text, 'UTF-8', 'B', "\r\n");
}

/** @param string[] $to */
function cap_build_message(array $cfg, string $subject, string $body, array $to, ?array $replyTo): string
{
    $fromDomain = substr(strrchr((string) $cfg['mail_from'], '@'), 1);
    $h = [];
    $h[] = 'Date: ' . date('r');
    $h[] = 'From: ' . cap_encode_header(cap_header_text((string) $cfg['mail_from_name'], 60)) . ' <' . $cfg['mail_from'] . '>';
    $h[] = 'To: ' . implode(', ', array_map(static fn ($a) => '<' . $a . '>', $to));
    if ($replyTo !== null) {
        $name = cap_header_text($replyTo['name'], 80);
        $h[] = 'Reply-To: ' . ($name !== '' ? cap_encode_header($name) . ' ' : '') . '<' . $replyTo['email'] . '>';
    }
    $h[] = 'Subject: ' . cap_encode_header(cap_header_text($subject, 160));
    $h[] = 'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $fromDomain . '>';
    $h[] = 'MIME-Version: 1.0';
    $h[] = 'Content-Type: text/plain; charset=UTF-8';
    $h[] = 'Content-Transfer-Encoding: base64';
    $h[] = 'Auto-Submitted: auto-generated';
    return implode("\r\n", $h) . "\r\n\r\n" . chunk_split(base64_encode($body), 76, "\r\n");
}

/** Lit une réponse SMTP (multi-lignes) ; renvoie [code, texte]. */
function cap_smtp_read($fp): array
{
    $text = '';
    while (($line = fgets($fp, 1024)) !== false) {
        $text .= $line;
        if (strlen($line) < 4 || $line[3] === ' ') {
            break;
        }
    }
    if ($text === '') {
        throw new RuntimeException('smtp_timeout');
    }
    return [(int) substr($text, 0, 3), $text];
}

function cap_smtp_cmd($fp, string $cmd, array $okCodes): string
{
    if ($cmd !== '') {
        fwrite($fp, $cmd . "\r\n");
    }
    [$code, $text] = cap_smtp_read($fp);
    if (!in_array($code, $okCodes, true)) {
        throw new RuntimeException('smtp_' . $code);
    }
    return $text;
}

/** @param string[] $to */
function cap_smtp_send(array $cfg, string $mime, array $to): void
{
    $host = (string) $cfg['smtp_host'];
    $secure = (string) $cfg['smtp_secure'];
    if ($secure === 'none' && !in_array($host, ['127.0.0.1', 'localhost', '::1'], true)) {
        throw new RuntimeException('smtp_config'); // jamais d'identifiants en clair vers un serveur distant
    }
    $verify = (bool) $cfg['smtp_verify_peer'];
    $ctx = stream_context_create(['ssl' => [
        'verify_peer' => $verify, 'verify_peer_name' => $verify, 'peer_name' => $host, 'SNI_enabled' => true,
    ]]);
    $scheme = $secure === 'ssl' ? 'ssl://' : 'tcp://';
    $fp = @stream_socket_client($scheme . $host . ':' . (int) $cfg['smtp_port'], $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx);
    if ($fp === false) {
        throw new RuntimeException('smtp_connect');
    }
    stream_set_timeout($fp, 12);
    try {
        cap_smtp_cmd($fp, '', [220]);
        cap_smtp_cmd($fp, 'EHLO ' . $cfg['ehlo_name'], [250]);
        if ($secure === 'tls') {
            cap_smtp_cmd($fp, 'STARTTLS', [220]);
            if (!@stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('smtp_tls');
            }
            cap_smtp_cmd($fp, 'EHLO ' . $cfg['ehlo_name'], [250]);
        }
        cap_smtp_cmd($fp, 'AUTH LOGIN', [334]);
        cap_smtp_cmd($fp, base64_encode((string) $cfg['smtp_user']), [334]);
        cap_smtp_cmd($fp, base64_encode((string) $cfg['smtp_pass']), [235]);
        cap_smtp_cmd($fp, 'MAIL FROM:<' . $cfg['mail_from'] . '>', [250]);
        foreach ($to as $rcpt) {
            cap_smtp_cmd($fp, 'RCPT TO:<' . $rcpt . '>', [250, 251]);
        }
        cap_smtp_cmd($fp, 'DATA', [354]);
        $data = preg_replace('/(?m)^\./', '..', str_replace(["\r\n", "\r"], "\n", $mime)) ?? '';
        $data = str_replace("\n", "\r\n", $data);
        fwrite($fp, $data . "\r\n.\r\n");
        cap_smtp_cmd($fp, '', [250]);
        @fwrite($fp, "QUIT\r\n");
    } finally {
        @fclose($fp);
    }
}

// ---------------------------------------------------------------- file d'attente de secours

function cap_queue_add(string $mime): bool
{
    $file = cap_dir('queue') . '/' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.eml';
    return @file_put_contents($file, $mime, LOCK_EX) !== false && @chmod($file, 0600);
}

/** Tente de renvoyer quelques messages en attente (appelée après un envoi réussi). */
function cap_queue_flush(array $cfg, int $limit = 3): void
{
    $files = glob(cap_dir('queue') . '/*.eml') ?: [];
    sort($files);
    foreach (array_slice($files, 0, $limit) as $f) {
        $mime = @file_get_contents($f);
        if ($mime === false) {
            continue;
        }
        try {
            cap_smtp_send($cfg, $mime, (array) $cfg['mail_to']);
            @unlink($f);
        } catch (Throwable $e) {
            cap_log('queue', $e->getMessage());
            return;
        }
    }
}
