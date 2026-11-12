<?php
// Ortak başlangıç: ayarlar, veritabanı, oturum ve yardımcı fonksiyonlar.
declare(strict_types=1);

const APP_SESSION_NAME = 'ISLAB';

function app_config(): array
{
    static $config = null;
    if ($config !== null) return $config;
    $candidates = [];
    if (getenv('ISLAB_CONFIG')) $candidates[] = (string)getenv('ISLAB_CONFIG'); // testler için
    $candidates[] = dirname(__DIR__, 3) . '/isletimsistemi-config.php'; // public_html'in bir üstü (önerilen)
    $candidates[] = dirname(__DIR__) . '/config.php';
    foreach ($candidates as $file) {
        if (is_file($file)) {
            $config = require $file;
            return $config;
        }
    }
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Ayar dosyası bulunamadı. api/config.example.php dosyasını api/config.php olarak kopyalayıp düzenleyin.";
    exit;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    $c = app_config()['db'];
    if (str_starts_with($c['dsn'], 'sqlite:')) {
        $dir = dirname(substr($c['dsn'], 7));
        if (!is_dir($dir)) mkdir($dir, 0770, true);
        if (!is_file($dir . '/.htaccess')) @file_put_contents($dir . '/.htaccess', "Require all denied\n");
    }
    $pdo = new PDO($c['dsn'], $c['user'] ?? null, $c['pass'] ?? null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = 5000');
    }
    require_once __DIR__ . '/schema.php';
    schema_migrate($pdo);
    return $pdo;
}

function is_sqlite(): bool
{
    return db()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $hours = (int)(app_config()['session_hours'] ?? 10);
    ini_set('session.gc_maxlifetime', (string)($hours * 3600));
    ini_set('session.use_strict_mode', '1');
    session_name(APP_SESSION_NAME);
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_set_cookie_params([
        'lifetime' => $hours * 3600,
        'path' => base_path(),
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

/** Oturumu kullanıcı için başlatır (her iki giriş yolu da bunu kullanır). */
function login_session(int $userId): void
{
    start_session();
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
    $_SESSION['expires'] = time() + (int)(app_config()['session_hours'] ?? 10) * 3600;
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
    db()->prepare('UPDATE users SET last_login = ?, failed_logins = 0, locked_until = 0 WHERE id = ?')->execute([now_str(), $userId]);
}

/** Uygulamanın bulunduğu klasörün web yolu (ör. "/" veya "/lab/"). */
function base_path(): string
{
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/');
    $dir = dirname($script);
    if (basename($dir) === 'api') $dir = dirname($dir);
    $dir = rtrim($dir, '/');
    return $dir . '/';
}

/** Oturumdaki kullanıcı (yoksa null). */
function current_user(): ?array
{
    start_session();
    $id = $_SESSION['user_id'] ?? null;
    if (!$id) return null;
    if (($_SESSION['expires'] ?? 0) < time()) {
        $_SESSION = [];
        return null;
    }
    $st = db()->prepare('SELECT id, role, name, username, portal_uid, active, pass_hash IS NOT NULL AS has_password FROM users WHERE id = ?');
    $st->execute([$id]);
    $u = $st->fetch();
    if (!$u || !(int)$u['active']) {
        $_SESSION = [];
        return null;
    }
    $u['id'] = (int)$u['id'];
    $u['has_password'] = (bool)$u['has_password'];
    unset($u['active']);
    return $u;
}

function csrf_token(): string
{
    start_session();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
    return $_SESSION['csrf'];
}

function now_str(): string
{
    return gmdate('Y-m-d H:i:s');
}

function client_ip(): string
{
    return substr((string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 64);
}

/** Görev içerikleri: yayında api/content, geliştirmede depo kökündeki content/. */
function content_dir(): string
{
    $a = dirname(__DIR__) . '/content';
    if (is_dir($a)) return $a;
    return dirname(__DIR__, 3) . '/content';
}

function load_task(string $id): ?array
{
    if (!preg_match('/^[a-z0-9-]{1,40}$/', $id)) return null;
    $f = content_dir() . "/tasks/$id.json";
    if (!is_file($f)) return null;
    return json_decode((string)file_get_contents($f), true);
}

function load_all_tasks(): array
{
    $out = [];
    foreach (glob(content_dir() . '/tasks/*.json') ?: [] as $f) {
        $t = json_decode((string)file_get_contents($f), true);
        if (is_array($t) && isset($t['id'])) $out[$t['id']] = $t;
    }
    ksort($out);
    return $out;
}

function html_page(string $title, string $body, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    header('X-Robots-Tag: noindex, nofollow');
    $t = htmlspecialchars($title, ENT_QUOTES);
    echo <<<HTML
<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>$t</title><link rel="icon" href="data:,">
<style>
  body{margin:0;font:15px/1.5 "Segoe UI",system-ui,sans-serif;background:#eef2f7;color:#1d2433;display:flex;min-height:100vh;align-items:center;justify-content:center}
  .box{background:#fff;max-width:520px;margin:16px;padding:28px 32px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  h1{font-size:20px;margin:0 0 12px} a.btn,button{display:inline-block;margin-top:12px;background:#0b5cad;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;border:0;font-size:15px;cursor:pointer}
  input,select{width:100%;padding:7px;border:1px solid #b9c3d1;border-radius:6px;font-size:15px;box-sizing:border-box}
  label{display:block;margin-top:10px} code{background:#eef;padding:1px 4px;border-radius:4px} .err{color:#b42318}
</style></head>
<body><div class="box"><h1>$t</h1>$body</div></body></html>
HTML;
    exit;
}
