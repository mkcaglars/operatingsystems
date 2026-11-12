<?php
// İlk kurulum: yönetici hesabı oluşturur. Yönetici varsa kapanır.
// Güvenlik: ayar dosyasındaki 'kurulum_kodu' bilinmeden kullanılamaz.
declare(strict_types=1);
require __DIR__ . '/api/lib/bootstrap.php';

$config = app_config();
$pdo = db();
if ($pdo->query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1")->fetchColumn()) {
    html_page('Kurulum tamamlanmış', '<p>Yönetici hesabı zaten var. Giriş sayfasından devam edin.</p><a class="btn" href="./#/giris">Giriş</a>', 404);
}
$code = (string)($config['kurulum_kodu'] ?? '');
if (strlen($code) < 8 || str_contains($code, 'BURAYA')) {
    html_page('Kurulum kodu ayarlanmamış', '<p>Ayar dosyasına en az 8 karakterlik bir <code>kurulum_kodu</code> yazın, sonra bu sayfayı yenileyin.</p>', 500);
}

$err = '';
$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim((string)($_POST['name'] ?? ''));
    $username = strtolower(trim((string)($_POST['username'] ?? '')));
    $pw = (string)($_POST['password'] ?? '');
    if (!hash_equals($code, (string)($_POST['kod'] ?? ''))) $err = 'Kurulum kodu hatalı.';
    elseif ($name === '') $err = 'Ad soyad gerekli.';
    elseif (!preg_match('/^[a-z0-9][a-z0-9._-]{2,31}$/', $username)) $err = 'Kullanıcı adı en az 3 karakter olmalı; harf, rakam, nokta ve tire kullanılabilir.';
    elseif (mb_strlen($pw) < 8) $err = 'Şifre en az 8 karakter olmalı.';
    elseif ($pw !== (string)($_POST['password2'] ?? '')) $err = 'Şifreler aynı değil.';
    else {
        $pdo->prepare('INSERT INTO users (role, name, username, pass_hash, created_at) VALUES (?, ?, ?, ?, ?)')
            ->execute(['admin', mb_substr($name, 0, 150), $username, password_hash($pw, PASSWORD_DEFAULT), now_str()]);
        login_session((int)$pdo->lastInsertId());
        header('Location: ' . base_path() . '#/ogretmen', true, 302);
        exit;
    }
}
$e = $err ? '<p class="err">' . $h($err) . '</p>' : '';
$n = $h($_POST['name'] ?? '');
$u = $h($_POST['username'] ?? '');
html_page('İlk kurulum: yönetici hesabı', <<<HTML
<p>İşletim Sistemleri Sanal Laboratuvarı'na hoş geldiniz. Önce yönetici hesabını oluşturun. Yönetici, öğretmen hesaplarını açar.</p>
$e
<form method="post">
  <label>Kurulum kodu (ayar dosyasındaki <code>kurulum_kodu</code>)<input name="kod" type="password" required></label>
  <label>Ad Soyad<input name="name" value="$n" required></label>
  <label>Kullanıcı adı<input name="username" value="$u" required autocomplete="username"></label>
  <label>Şifre (en az 8 karakter)<input name="password" type="password" required autocomplete="new-password"></label>
  <label>Şifre (tekrar)<input name="password2" type="password" required autocomplete="new-password"></label>
  <button>Yönetici hesabını oluştur</button>
</form>
HTML);
