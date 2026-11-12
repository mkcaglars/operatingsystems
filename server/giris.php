<?php
// Okul portalından gelen bağlantı: giris.php?token=...
// Anahtar (JWT, HS256) doğrulanır; kullanıcı ilk girişte oluşturulur, sonraki girişlerde güncellenir.
// Portal tarafı için: portal-ornek/isletimsistemi-baglanti.php ve docs/PORTAL.md
declare(strict_types=1);
require __DIR__ . '/api/lib/bootstrap.php';
require __DIR__ . '/api/lib/jwt.php';

$config = app_config();
$token = (string)($_GET['token'] ?? '');
$portal = htmlspecialchars((string)($config['portal_url'] ?? ''), ENT_QUOTES);
$back = ($portal ? "<a class=\"btn\" href=\"$portal\">Okul portalına dön</a> " : '') . '<a class="btn" href="./#/giris">Kullanıcı adı ile giriş</a>';

if ($token === '') {
    html_page('Giriş bağlantısı eksik', '<p>Bu sayfaya okul portalındaki bağlantı ile gelinmelidir.</p>' . $back, 400);
}

$secret = (string)($config['jwt_secret'] ?? '');
if (strlen($secret) < 32 || str_contains($secret, 'BURAYA')) {
    html_page('Sunucu ayarı eksik', '<p>Giriş anahtarı (jwt_secret) ayarlanmamış ya da çok kısa. Yönetici ayar dosyasına en az 32 karakterlik rastgele bir anahtar yazmalıdır.</p>' . $back, 500);
}

try {
    $p = jwt_verify($token, $secret, (int)($config['token_max_age'] ?? 300));
} catch (RuntimeException $e) {
    html_page('Giriş yapılamadı', '<p>' . htmlspecialchars($e->getMessage()) . '</p><p>Lütfen okul portalından tekrar giriş yapın.</p>' . $back, 403);
}

$pdo = db();

// Tek kullanımlık: aynı bağlantı ikinci kez kullanılamaz.
$pdo->prepare('DELETE FROM used_tokens WHERE expires_at < ?')->execute([time() - 3600]);
try {
    $pdo->prepare('INSERT INTO used_tokens (jti, expires_at) VALUES (?, ?)')->execute([$p['jti'], (int)$p['exp']]);
} catch (PDOException $e) {
    html_page('Bu bağlantı daha önce kullanılmış', '<p>Güvenlik nedeniyle her giriş bağlantısı yalnızca bir kez kullanılabilir. Portaldan yeniden giriş yapın.</p>' . $back, 403);
}

$roleIn = mb_strtolower((string)($p['role'] ?? 'ogrenci'));
$role = in_array($roleIn, ['ogretmen', 'öğretmen', 'teacher', 'admin'], true) ? 'ogretmen' : 'ogrenci';
$uid = mb_substr(trim((string)$p['uid']), 0, 64);
$name = mb_substr(trim((string)$p['name']), 0, 150);
$sinif = mb_substr(trim((string)($p['sinif'] ?? $p['class'] ?? '')), 0, 50);
$now = now_str();

$st = $pdo->prepare('SELECT id, role, active FROM users WHERE portal_uid = ?');
$st->execute([$uid]);
$user = $st->fetch();
if ($user) {
    if (!(int)$user['active']) html_page('Hesap pasif', '<p>Hesabınız öğretmeniniz tarafından pasifleştirilmiş.</p>' . $back, 403);
    $id = (int)$user['id'];
    // Yönetici rolü portaldan değiştirilmez.
    $newRole = $user['role'] === 'admin' ? 'admin' : $role;
    $pdo->prepare('UPDATE users SET name = ?, role = ? WHERE id = ?')->execute([$name, $newRole, $id]);
} else {
    try {
        $pdo->prepare('INSERT INTO users (role, name, portal_uid, created_at) VALUES (?, ?, ?, ?)')->execute([$role, $name, $uid, $now]);
        $id = (int)$pdo->lastInsertId();
    } catch (PDOException $e) {
        // Aynı anda iki giriş (ör. çift tıklama): kullanıcıyı diğer istek oluşturdu.
        $st->execute([$uid]);
        $id = (int)$st->fetchColumn();
        if (!$id) throw $e;
    }
}

// Öğrenci, portalın bildirdiği sınıfa otomatik eklenir (sınıf yoksa oluşturulur).
// Öğretmen sınıflara otomatik bağlanmaz; panelden kendi sınıflarını seçer.
if ($role === 'ogrenci' && $sinif !== '') {
    $c = $pdo->prepare('SELECT id FROM classes WHERE name = ?');
    $c->execute([$sinif]);
    $classId = $c->fetchColumn();
    if (!$classId) {
        try {
            $pdo->prepare('INSERT INTO classes (name, settings, created_at) VALUES (?, NULL, ?)')->execute([$sinif, $now]);
            $classId = $pdo->lastInsertId();
        } catch (PDOException $e) {
            $c->execute([$sinif]);
            $classId = $c->fetchColumn();
        }
    }
    $m = $pdo->prepare('SELECT 1 FROM class_students WHERE class_id = ? AND student_id = ?');
    $m->execute([$classId, $id]);
    if (!$m->fetchColumn()) {
        try {
            $pdo->prepare('INSERT INTO class_students (class_id, student_id) VALUES (?, ?)')->execute([$classId, $id]);
        } catch (PDOException $e) {
            // eşzamanlı ekleme
        }
    }
}

login_session($id);
header('Location: ' . base_path(), true, 302);
