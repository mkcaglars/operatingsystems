<?php
// JSON API. Çağrı biçimi: api/index.php?r=<yol>   (ör. api/index.php?r=auth/me)
// POST isteklerinde gövde JSON'dur ve X-CSRF-Token başlığı gerekir (giriş hariç).
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/rules.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

const MAX_JSON_BYTES = 2_000_000;
const DEFAULT_SETTINGS = [
    'degerlendirme_acik' => false,
    'istege_bagli' => ['winrar' => false, 'acrobat' => false, 'photoshop' => false],
    'hizli_kurulum' => false,
    'esik' => ['yeterli' => 50, 'usta' => 85],
];

function out(mixed $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $msg, int $code = 400): never
{
    out(['hata' => $msg], $code);
}

function body(): array
{
    static $b = null;
    if ($b !== null) return $b;
    $raw = file_get_contents('php://input', false, null, 0, MAX_JSON_BYTES + 1);
    if ($raw !== false && strlen($raw) > MAX_JSON_BYTES) fail('İstek çok büyük.', 413);
    $b = $raw ? json_decode($raw, true) : [];
    if (!is_array($b)) fail('Geçersiz istek.');
    return $b;
}

function arg(string $k, mixed $default = null): mixed
{
    $b = body();
    return array_key_exists($k, $b) ? $b[$k] : $default;
}

function int_arg(string $k): int
{
    $v = arg($k);
    if (!is_numeric($v)) fail("'$k' eksik.");
    return (int)$v;
}

function str_arg(string $k, int $max = 150, bool $required = true): string
{
    $v = trim((string)arg($k, ''));
    if ($required && $v === '') fail("'$k' boş olamaz.");
    return mb_substr($v, 0, $max);
}

function require_user(): array
{
    $u = current_user();
    if (!$u) fail('Oturum kapalı. Lütfen giriş yapın.', 401);
    return $u;
}

function require_staff(): array
{
    $u = require_user();
    if (!in_array($u['role'], ['ogretmen', 'admin'], true)) fail('Bu işlem için öğretmen yetkisi gerekir.', 403);
    return $u;
}

function require_admin(): array
{
    $u = require_user();
    if ($u['role'] !== 'admin') fail('Bu işlem için yönetici yetkisi gerekir.', 403);
    return $u;
}

function require_csrf(): void
{
    start_session();
    $h = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if ($h === '' || empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $h)) fail('Güvenlik anahtarı geçersiz. Sayfayı yenileyin.', 419);
}

function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function in_list(array $ids): string
{
    return implode(',', array_map('intval', $ids ?: [0]));
}

// ---------- Yetki yardımcıları ----------

/** Kullanıcının yönettiği sınıfların kimlikleri (yönetici: hepsi). */
function managed_class_ids(array $u): array
{
    if ($u['role'] === 'admin') return array_map('intval', q('SELECT id FROM classes')->fetchAll(PDO::FETCH_COLUMN));
    return array_map('intval', q('SELECT class_id FROM class_teachers WHERE teacher_id = ?', [$u['id']])->fetchAll(PDO::FETCH_COLUMN));
}

function require_class(array $u, int $classId): array
{
    $c = q('SELECT * FROM classes WHERE id = ?', [$classId])->fetch();
    if (!$c) fail('Sınıf bulunamadı.', 404);
    if (!in_array($classId, managed_class_ids($u), true)) fail('Bu sınıf size ait değil.', 403);
    return $c;
}

function require_student(array $u, int $sid): array
{
    $s = q('SELECT id, role, name, username, portal_uid, active, pass_hash IS NOT NULL AS has_password, created_at, last_login FROM users WHERE id = ?', [$sid])->fetch();
    if (!$s || $s['role'] !== 'ogrenci') fail('Öğrenci bulunamadı.', 404);
    if ($u['role'] !== 'admin') {
        $ok = q('SELECT 1 FROM class_students cs JOIN class_teachers ct ON ct.class_id = cs.class_id WHERE cs.student_id = ? AND ct.teacher_id = ?', [$sid, $u['id']])->fetchColumn();
        if (!$ok) fail('Bu öğrenci sizin sınıflarınızda değil.', 403);
    }
    return $s;
}

function class_settings(?string $json): array
{
    $s = $json ? json_decode($json, true) : [];
    if (!is_array($s)) $s = [];
    return array_replace_recursive(DEFAULT_SETTINGS, $s);
}

// ---------- Hesap yardımcıları ----------

function tr_ascii(string $s): string
{
    $s = strtr($s, ['ç' => 'c', 'Ç' => 'c', 'ğ' => 'g', 'Ğ' => 'g', 'ı' => 'i', 'I' => 'i', 'İ' => 'i', 'ö' => 'o', 'Ö' => 'o', 'ş' => 's', 'Ş' => 's', 'ü' => 'u', 'Ü' => 'u']);
    return strtolower((string)preg_replace('/[^A-Za-z0-9]+/', '', $s));
}

function valid_username(string $u): bool
{
    return (bool)preg_match('/^[a-z0-9][a-z0-9._-]{2,31}$/', $u);
}

function username_taken(string $u, int $exceptId = 0): bool
{
    return (bool)q('SELECT 1 FROM users WHERE username = ? AND id <> ?', [$u, $exceptId])->fetchColumn();
}

function suggest_username(string $name): string
{
    $parts = array_values(array_filter(preg_split('/\s+/u', trim($name)) ?: []));
    $first = tr_ascii($parts[0] ?? 'ogrenci');
    $last = count($parts) > 1 ? tr_ascii($parts[count($parts) - 1]) : '';
    $base = substr($first . ($last !== '' ? '.' . $last : ''), 0, 28);
    if (strlen($base) < 3) $base = str_pad($base, 3, '0');
    $u = $base;
    for ($i = 2; username_taken($u); $i++) $u = $base . $i;
    return $u;
}

function random_password(int $len = 6): string
{
    $chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // karışan karakterler (l, 1, o, 0, i) yok
    $p = '';
    for ($i = 0; $i < $len; $i++) $p .= $chars[random_int(0, strlen($chars) - 1)];
    return $p;
}

function hash_pw(string $p): string
{
    return password_hash($p, PASSWORD_DEFAULT);
}

function public_user(array $u): array
{
    return [
        'id' => (int)$u['id'],
        'role' => $u['role'],
        'name' => $u['name'],
        'username' => $u['username'],
        'portal' => $u['portal_uid'] !== null,
        'has_password' => (bool)$u['has_password'],
    ];
}

/** Kullanıcının durum kaydını (sürüm denetimi olmadan) yazar */
function sim_state_yaz(int $uid, string $scope, array $data): void
{
    $json = json_encode($data, JSON_UNESCAPED_UNICODE);
    if (q('SELECT 1 FROM sim_state WHERE user_id = ? AND scope = ?', [$uid, $scope])->fetchColumn()) {
        q('UPDATE sim_state SET data = ?, version = version + 1, updated_at = ? WHERE user_id = ? AND scope = ?', [$json, now_str(), $uid, $scope]);
    } else {
        q('INSERT INTO sim_state (user_id, scope, data, version, updated_at) VALUES (?, ?, ?, 1, ?)', [$uid, $scope, $json, now_str()]);
    }
}

function create_student(string $name, int $classId, ?string $username, ?string $password): array
{
    $username = $username !== null && $username !== '' ? strtolower($username) : suggest_username($name);
    if (!valid_username($username)) fail("Kullanıcı adı geçersiz: $username (en az 3 karakter; harf, rakam, nokta, tire).");
    if (username_taken($username)) fail("Bu kullanıcı adı kullanılıyor: $username");
    $password = $password !== null && $password !== '' ? $password : random_password();
    if (mb_strlen($password) < 4) fail('Öğrenci şifresi en az 4 karakter olmalı.');
    q('INSERT INTO users (role, name, username, pass_hash, created_at) VALUES (?, ?, ?, ?, ?)', ['ogrenci', $name, $username, hash_pw($password), now_str()]);
    $id = (int)db()->lastInsertId();
    q('INSERT INTO class_students (class_id, student_id) VALUES (?, ?)', [$classId, $id]);
    return ['id' => $id, 'name' => $name, 'username' => $username, 'password' => $password];
}

// ---------- Rapor yardımcıları ----------

/** Öğrenci başına görevlerin en iyi denemesi (değerlendirme modu öncelikli). */
function best_attempts(array $studentIds): array
{
    $rows = q('SELECT user_id, task_id, mode, score, result, finished_at FROM attempts
               WHERE finished_at IS NOT NULL AND mode IN (\'uygula\', \'degerlendir\') AND user_id IN (' . in_list($studentIds) . ')')->fetchAll();
    $best = [];
    foreach ($rows as $r) {
        $key = $r['user_id'] . '|' . $r['task_id'];
        $rank = ($r['mode'] === 'degerlendir' ? 1000 : 0) + (int)$r['score'];
        if (!isset($best[$key]) || $rank > $best[$key]['rank']) {
            $res = json_decode((string)$r['result'], true) ?: [];
            $best[$key] = ['rank' => $rank, 'user_id' => (int)$r['user_id'], 'task_id' => $r['task_id'], 'mode' => $r['mode'], 'score' => (int)$r['score'], 'kazanimlar' => $res['kazanimlar'] ?? [], 'finished_at' => (int)$r['finished_at']];
        }
    }
    return array_values($best);
}

function outcome_scores(array $best): array
{
    $acc = [];
    foreach ($best as $b) {
        foreach ($b['kazanimlar'] as $kod => $p) $acc[$b['user_id']][$kod][] = (int)$p;
    }
    $out = [];
    foreach ($acc as $uid => $k) {
        foreach ($k as $kod => $list) $out[$uid][$kod] = (int)round(array_sum($list) / count($list));
    }
    return $out;
}

// ======================================================================
$route = trim((string)($_GET['r'] ?? ''), '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'POST' && !in_array($route, ['auth/login'], true)) require_csrf();

try {
    switch ("$method $route") {

        // ---------------- Genel ----------------
        case 'GET config': {
            $c = app_config();
            $hasAdmin = (bool)q("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1")->fetchColumn();
            out([
                'portal_url' => (string)($c['portal_url'] ?? ''),
                'test_portal' => !empty($c['test_portal']),
                'kurulum_gerekli' => !$hasAdmin,
            ]);
        }

        case 'GET auth/me': {
            $u = current_user();
            out(['user' => $u ? public_user($u) : null, 'csrf' => $u ? csrf_token() : null]);
        }

        case 'POST auth/login': {
            $ip = client_ip();
            $now = time();
            $t = q('SELECT fails, window_start FROM login_throttle WHERE ip = ?', [$ip])->fetch();
            if ($t && $now - (int)$t['window_start'] < 600 && (int)$t['fails'] >= 30) fail('Çok fazla hatalı deneme. 10 dakika sonra tekrar deneyin.', 429);

            $username = strtolower(str_arg('username', 64));
            $password = (string)arg('password', '');
            $u = q('SELECT * FROM users WHERE username = ?', [$username])->fetch();
            if ($u && (int)$u['locked_until'] > $now) fail('Hesap birkaç dakikalığına kilitlendi. Biraz sonra tekrar deneyin.', 429);

            if (!$u || !$u['pass_hash'] || !(int)$u['active'] || !password_verify($password, $u['pass_hash'])) {
                if ($t && $now - (int)$t['window_start'] < 600) q('UPDATE login_throttle SET fails = fails + 1 WHERE ip = ?', [$ip]);
                elseif ($t) q('UPDATE login_throttle SET fails = 1, window_start = ? WHERE ip = ?', [$now, $ip]);
                else q('INSERT INTO login_throttle (ip, fails, window_start) VALUES (?, 1, ?)', [$ip, $now]);
                if ($u) {
                    $f = (int)$u['failed_logins'] + 1;
                    q('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?', [$f >= 5 ? 0 : $f, $f >= 5 ? $now + 300 : 0, $u['id']]);
                }
                usleep(300000);
                fail('Kullanıcı adı veya şifre hatalı.', 401);
            }
            if (password_needs_rehash($u['pass_hash'], PASSWORD_DEFAULT)) q('UPDATE users SET pass_hash = ? WHERE id = ?', [hash_pw($password), $u['id']]);
            login_session((int)$u['id']);
            $me = current_user();
            out(['user' => public_user($me), 'csrf' => csrf_token()]);
        }

        case 'POST auth/logout': {
            start_session();
            $_SESSION = [];
            session_destroy();
            out(['tamam' => true]);
        }

        case 'POST auth/password': {
            $u = require_user();
            $new = (string)arg('new', '');
            $min = $u['role'] === 'ogrenci' ? 4 : 8;
            if (mb_strlen($new) < $min) fail("Yeni şifre en az $min karakter olmalı.");
            if ($u['has_password']) {
                $hash = q('SELECT pass_hash FROM users WHERE id = ?', [$u['id']])->fetchColumn();
                if (!password_verify((string)arg('current', ''), (string)$hash)) fail('Mevcut şifre hatalı.', 403);
            } elseif (!$u['username']) {
                // Portaldan gelen kullanıcının kullanıcı adı yoksa, şifreyle birlikte bir kullanıcı adı alır.
                q('UPDATE users SET username = ? WHERE id = ?', [suggest_username($u['name']), $u['id']]);
            }
            q('UPDATE users SET pass_hash = ? WHERE id = ?', [hash_pw($new), $u['id']]);
            out(['user' => public_user(current_user())]);
        }

        // ---------------- Öğrenci: görevler, durum, canlı izleme ----------------
        case 'GET tasks/status': {
            $u = require_user();
            $best = best_attempts([$u['id']]);
            $settings = DEFAULT_SETTINGS;
            if ($u['role'] === 'ogrenci') {
                $rows = q('SELECT c.settings FROM classes c JOIN class_students cs ON cs.class_id = c.id WHERE cs.student_id = ?', [$u['id']])->fetchAll(PDO::FETCH_COLUMN);
                foreach ($rows as $json) {
                    $s = class_settings($json);
                    $settings['degerlendirme_acik'] = $settings['degerlendirme_acik'] || $s['degerlendirme_acik'];
                    $settings['hizli_kurulum'] = $settings['hizli_kurulum'] || $s['hizli_kurulum'];
                    foreach ($s['istege_bagli'] as $k => $v) $settings['istege_bagli'][$k] = $settings['istege_bagli'][$k] || $v;
                }
            } else {
                $settings['degerlendirme_acik'] = true; // öğretmen her modu deneyebilir
                $settings['istege_bagli'] = array_map(fn() => true, $settings['istege_bagli']);
            }
            out(['en_iyi' => array_map(fn($b) => ['task_id' => $b['task_id'], 'mode' => $b['mode'], 'score' => $b['score']], $best), 'ayarlar' => $settings]);
        }

        case 'GET state': {
            $u = require_user();
            $scope = (string)($_GET['scope'] ?? '');
            if (!preg_match('/^[a-z0-9-]{1,40}$/', $scope)) fail('Geçersiz kapsam.');
            $r = q('SELECT data, version, updated_at FROM sim_state WHERE user_id = ? AND scope = ?', [$u['id'], $scope])->fetch();
            out($r ? ['data' => json_decode($r['data'], true), 'version' => (int)$r['version'], 'updated_at' => $r['updated_at']] : ['data' => null, 'version' => 0]);
        }

        case 'POST state/save': {
            $u = require_user();
            $scope = str_arg('scope', 40);
            if (!preg_match('/^[a-z0-9-]{1,40}$/', $scope)) fail('Geçersiz kapsam.');
            $data = json_encode(arg('data'), JSON_UNESCAPED_UNICODE);
            $version = (int)arg('version', 0);
            $cur = q('SELECT version FROM sim_state WHERE user_id = ? AND scope = ?', [$u['id'], $scope])->fetchColumn();
            if ($cur === false) {
                q('INSERT INTO sim_state (user_id, scope, data, version, updated_at) VALUES (?, ?, ?, 1, ?)', [$u['id'], $scope, $data, now_str()]);
                out(['version' => 1]);
            }
            if ((int)$cur !== $version) fail('Bu çalışma başka bir pencerede değiştirildi. Sayfayı yenileyin.', 409);
            q('UPDATE sim_state SET data = ?, version = version + 1, updated_at = ? WHERE user_id = ? AND scope = ?', [$data, now_str(), $u['id'], $scope]);
            out(['version' => (int)$cur + 1]);
        }

        case 'POST presence': {
            $u = require_user();
            $station = mb_substr((string)arg('station', ''), 0, 16);
            $task = mb_substr((string)arg('task_id', ''), 0, 40);
            $info = mb_substr((string)arg('info', ''), 0, 255);
            $exists = q('SELECT 1 FROM presence WHERE user_id = ?', [$u['id']])->fetchColumn();
            if ($exists) q('UPDATE presence SET station = ?, task_id = ?, info = ?, updated_at = ? WHERE user_id = ?', [$station, $task, $info, time(), $u['id']]);
            else q('INSERT INTO presence (user_id, station, task_id, info, updated_at) VALUES (?, ?, ?, ?, ?)', [$u['id'], $station, $task, $info, time()]);
            // Öğretmen kum havuzu ekranını izliyorsa öğrenci ekran görüntüsü gönderir
            $izle = q("SELECT data FROM sim_state WHERE user_id = ? AND scope = 'kh-izle'", [$u['id']])->fetchColumn();
            $izleniyor = $izle !== false && (int)(json_decode((string)$izle, true)['until'] ?? 0) > time();
            out(['tamam' => true, 'izle' => $izleniyor]);
        }

        // ---------------- Kum havuzu izleme ----------------
        case 'POST sandbox/screen': {
            $u = require_user();
            $img = (string)arg('img', '');
            if (!preg_match('#^data:image/jpeg;base64,[A-Za-z0-9+/=]+$#', $img) || strlen($img) > 1200000) fail('Geçersiz ekran görüntüsü.');
            sim_state_yaz($u['id'], 'kh-ekran', ['img' => $img, 't' => time()]);
            out(['tamam' => true]);
        }

        case 'GET sandbox/view': {
            $u = require_staff();
            $sid = (int)($_GET['student_id'] ?? 0);
            require_student($u, $sid);
            sim_state_yaz($sid, 'kh-izle', ['until' => time() + 25, 'ogretmen' => $u['id']]);
            $ekran = q("SELECT data FROM sim_state WHERE user_id = ? AND scope = 'kh-ekran'", [$sid])->fetchColumn();
            $durum = q("SELECT data, updated_at FROM sim_state WHERE user_id = ? AND scope = 'kum-havuzu'", [$sid])->fetch();
            $d = $durum ? json_decode($durum['data'], true) : null;
            out([
                'ekran' => $ekran !== false ? json_decode((string)$ekran, true) : null,
                'gunluk' => $d['gunluk'] ?? [],
                'ozet' => $d['ozet'] ?? [],
                'guncelleme' => $durum['updated_at'] ?? null,
                'now' => time(),
            ]);
        }

        case 'POST attempts/start': {
            $u = require_user();
            $taskId = str_arg('task_id', 40);
            $mode = (string)arg('mode', 'uygula');
            if (!in_array($mode, ['ogren', 'uygula', 'degerlendir'], true)) fail('Geçersiz mod.');
            $taskDef = load_task($taskId);
            if (!$taskDef) fail('Görev bulunamadı.', 404);
            // İsteğe bağlı yazılım görevleri yalnızca öğretmen sınıf için açtıysa yapılabilir
            if (!empty($taskDef['istege_bagli']) && $u['role'] === 'ogrenci') {
                $acik = false;
                foreach (q('SELECT c.settings FROM classes c JOIN class_students cs ON cs.class_id = c.id WHERE cs.student_id = ?', [$u['id']])->fetchAll(PDO::FETCH_COLUMN) as $json) {
                    if (!empty(class_settings($json)['istege_bagli'][$taskDef['istege_bagli']])) $acik = true;
                }
                if (!$acik) fail('Bu isteğe bağlı görev öğretmeniniz tarafından açılmadı.', 403);
            }
            if ($mode === 'degerlendir' && $u['role'] === 'ogrenci') {
                $open = false;
                foreach (q('SELECT c.settings FROM classes c JOIN class_students cs ON cs.class_id = c.id WHERE cs.student_id = ?', [$u['id']])->fetchAll(PDO::FETCH_COLUMN) as $json) {
                    if (class_settings($json)['degerlendirme_acik']) $open = true;
                }
                if (!$open) fail('Değerlendirme modu öğretmeniniz tarafından açılmadı.', 403);
            }
            q('INSERT INTO attempts (user_id, task_id, mode, started_at) VALUES (?, ?, ?, ?)', [$u['id'], $taskId, $mode, time()]);
            out(['attempt_id' => (int)db()->lastInsertId(), 'started_at' => time()]);
        }

        case 'POST attempts/hint': {
            $u = require_user();
            $id = int_arg('attempt_id');
            $a = q('SELECT mode, finished_at FROM attempts WHERE id = ? AND user_id = ?', [$id, $u['id']])->fetch();
            if (!$a || $a['finished_at'] !== null) fail('Deneme bulunamadı.', 404);
            if ($a['mode'] === 'degerlendir') fail('Değerlendirme modunda ipucu yok.', 403);
            q('UPDATE attempts SET hints = hints + 1 WHERE id = ?', [$id]);
            out(['hints' => (int)q('SELECT hints FROM attempts WHERE id = ?', [$id])->fetchColumn()]);
        }

        case 'POST attempts/submit': {
            $u = require_user();
            $id = int_arg('attempt_id');
            $a = q('SELECT * FROM attempts WHERE id = ? AND user_id = ?', [$id, $u['id']])->fetch();
            if (!$a) fail('Deneme bulunamadı.', 404);
            if ($a['finished_at'] !== null) fail('Bu deneme zaten teslim edildi.', 409);
            $task = load_task($a['task_id']);
            if (!$task) fail('Görev bulunamadı.', 404);
            $events = arg('events', []);
            $state = arg('final_state');
            if (!is_array($events) || count($events) > 20000) fail('Olay günlüğü geçersiz.');
            $events = array_values(array_filter($events, fn($e) => is_array($e) && isset($e['type']) && is_string($e['type'])));
            $now = time();
            $duration = max(0, $now - (int)$a['started_at']);
            $result = score_task($task, ['state' => $state, 'events' => $events], (float)$duration, (int)$a['hints']);
            $score = $a['mode'] === 'ogren' ? null : $result['puan'];
            q('UPDATE attempts SET finished_at = ?, duration = ?, score = ?, result = ?, events = ?, final_state = ? WHERE id = ?', [
                $now, $duration, $score, json_encode($result, JSON_UNESCAPED_UNICODE),
                json_encode($events, JSON_UNESCAPED_UNICODE), json_encode($state, JSON_UNESCAPED_UNICODE), $id,
            ]);
            if ($a['mode'] !== 'ogren') q('UPDATE commands SET tamam = 1, okundu = 1 WHERE user_id = ? AND task_id = ? AND tamam = 0', [$u['id'], $a['task_id']]);
            out(['sonuc' => $result, 'sure' => $duration, 'mode' => $a['mode']]);
        }

        // ---------------- Öğretmen: sınıflar ----------------
        case 'GET classes': {
            $u = require_staff();
            $ids = managed_class_ids($u);
            $rows = q('SELECT c.id, c.name, c.settings, (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) AS students
                       FROM classes c WHERE c.id IN (' . in_list($ids) . ') ORDER BY c.name')->fetchAll();
            $teachers = q('SELECT ct.class_id, u.id, u.name FROM class_teachers ct JOIN users u ON u.id = ct.teacher_id WHERE ct.class_id IN (' . in_list($ids) . ')')->fetchAll();
            $byClass = [];
            foreach ($teachers as $t) $byClass[(int)$t['class_id']][] = ['id' => (int)$t['id'], 'name' => $t['name']];
            out(array_map(fn($r) => [
                'id' => (int)$r['id'], 'name' => $r['name'], 'students' => (int)$r['students'],
                'settings' => class_settings($r['settings']), 'teachers' => $byClass[(int)$r['id']] ?? [],
            ], $rows));
        }

        case 'GET classes/all': {
            $u = require_staff();
            $mine = managed_class_ids($u);
            $rows = q('SELECT c.id, c.name, (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) AS students FROM classes c ORDER BY c.name')->fetchAll();
            $t = q('SELECT ct.class_id, u.name FROM class_teachers ct JOIN users u ON u.id = ct.teacher_id')->fetchAll();
            $names = [];
            foreach ($t as $r) $names[(int)$r['class_id']][] = $r['name'];
            out(array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name'], 'students' => (int)$r['students'], 'teachers' => $names[(int)$r['id']] ?? [], 'mine' => in_array((int)$r['id'], $mine, true)], $rows));
        }

        case 'POST classes/create': {
            $u = require_staff();
            $name = str_arg('name', 50);
            if (q('SELECT 1 FROM classes WHERE name = ?', [$name])->fetchColumn()) fail('Bu adda bir sınıf zaten var. "Sınıfa katıl" ile ekleyebilirsiniz.', 409);
            q('INSERT INTO classes (name, settings, created_at) VALUES (?, ?, ?)', [$name, json_encode(DEFAULT_SETTINGS), now_str()]);
            $id = (int)db()->lastInsertId();
            q('INSERT INTO class_teachers (class_id, teacher_id) VALUES (?, ?)', [$id, $u['id']]);
            out(['id' => $id]);
        }

        case 'POST classes/update': {
            $u = require_staff();
            $c = require_class($u, int_arg('id'));
            if (arg('name') !== null) {
                $name = str_arg('name', 50);
                if (q('SELECT 1 FROM classes WHERE name = ? AND id <> ?', [$name, $c['id']])->fetchColumn()) fail('Bu adda bir sınıf zaten var.', 409);
                q('UPDATE classes SET name = ? WHERE id = ?', [$name, $c['id']]);
            }
            if (is_array(arg('settings'))) {
                $s = class_settings(json_encode(arg('settings')));
                $s = [
                    'degerlendirme_acik' => (bool)$s['degerlendirme_acik'],
                    'istege_bagli' => ['winrar' => (bool)$s['istege_bagli']['winrar'], 'acrobat' => (bool)$s['istege_bagli']['acrobat'], 'photoshop' => (bool)$s['istege_bagli']['photoshop']],
                    'hizli_kurulum' => (bool)$s['hizli_kurulum'],
                    'esik' => ['yeterli' => max(1, min(99, (int)$s['esik']['yeterli'])), 'usta' => max(2, min(100, (int)$s['esik']['usta']))],
                ];
                if ($s['esik']['usta'] <= $s['esik']['yeterli']) fail('"Ustalaştı" eşiği "Yeterli" eşiğinden büyük olmalı.');
                q('UPDATE classes SET settings = ? WHERE id = ?', [json_encode($s), $c['id']]);
            }
            out(['tamam' => true]);
        }

        case 'POST classes/delete': {
            $u = require_staff();
            $c = require_class($u, int_arg('id'));
            db()->beginTransaction();
            q('DELETE FROM class_students WHERE class_id = ?', [$c['id']]);
            q('DELETE FROM class_teachers WHERE class_id = ?', [$c['id']]);
            q('DELETE FROM classes WHERE id = ?', [$c['id']]);
            db()->commit();
            out(['tamam' => true]);
        }

        case 'POST classes/join': {
            $u = require_staff();
            $id = int_arg('id');
            if (!q('SELECT 1 FROM classes WHERE id = ?', [$id])->fetchColumn()) fail('Sınıf bulunamadı.', 404);
            if (!q('SELECT 1 FROM class_teachers WHERE class_id = ? AND teacher_id = ?', [$id, $u['id']])->fetchColumn()) {
                q('INSERT INTO class_teachers (class_id, teacher_id) VALUES (?, ?)', [$id, $u['id']]);
            }
            out(['tamam' => true]);
        }

        case 'POST classes/leave': {
            $u = require_staff();
            q('DELETE FROM class_teachers WHERE class_id = ? AND teacher_id = ?', [int_arg('id'), $u['id']]);
            out(['tamam' => true]);
        }

        case 'POST classes/teachers': {
            require_admin();
            $id = int_arg('id');
            if (!q('SELECT 1 FROM classes WHERE id = ?', [$id])->fetchColumn()) fail('Sınıf bulunamadı.', 404);
            $tids = array_map('intval', (array)arg('teacher_ids', []));
            db()->beginTransaction();
            q('DELETE FROM class_teachers WHERE class_id = ?', [$id]);
            foreach (q("SELECT id FROM users WHERE role IN ('ogretmen','admin') AND id IN (" . in_list($tids) . ')')->fetchAll(PDO::FETCH_COLUMN) as $tid) {
                q('INSERT INTO class_teachers (class_id, teacher_id) VALUES (?, ?)', [$id, $tid]);
            }
            db()->commit();
            out(['tamam' => true]);
        }

        // ---------------- Öğretmen: öğrenciler ----------------
        case 'GET students': {
            $u = require_staff();
            $classId = isset($_GET['class_id']) && $_GET['class_id'] !== '' ? (int)$_GET['class_id'] : null;
            if ($classId !== null) {
                require_class($u, $classId);
                $where = 'u.id IN (SELECT student_id FROM class_students WHERE class_id = ' . $classId . ')';
            } elseif ($u['role'] === 'admin') {
                $where = "u.role = 'ogrenci'";
            } else {
                $where = 'u.id IN (SELECT student_id FROM class_students WHERE class_id IN (' . in_list(managed_class_ids($u)) . '))';
            }
            $rows = q("SELECT u.id, u.name, u.username, u.portal_uid, u.active, u.last_login, u.pass_hash IS NOT NULL AS has_password
                       FROM users u WHERE u.role = 'ogrenci' AND $where ORDER BY u.name")->fetchAll();
            $ids = array_map(fn($r) => (int)$r['id'], $rows);
            $cls = q('SELECT cs.student_id, c.id, c.name FROM class_students cs JOIN classes c ON c.id = cs.class_id WHERE cs.student_id IN (' . in_list($ids) . ')')->fetchAll();
            $byStudent = [];
            foreach ($cls as $c) $byStudent[(int)$c['student_id']][] = ['id' => (int)$c['id'], 'name' => $c['name']];
            out(array_map(fn($r) => [
                'id' => (int)$r['id'], 'name' => $r['name'], 'username' => $r['username'], 'portal_uid' => $r['portal_uid'],
                'active' => (bool)$r['active'], 'last_login' => $r['last_login'], 'has_password' => (bool)$r['has_password'],
                'classes' => $byStudent[(int)$r['id']] ?? [],
            ], $rows));
        }

        case 'POST students/create': {
            $u = require_staff();
            $c = require_class($u, int_arg('class_id'));
            $pw = (string)arg('password', '');
            $created = create_student(str_arg('name', 150), (int)$c['id'], (string)arg('username', ''), $pw);
            out($created);
        }

        case 'POST students/bulk': {
            $u = require_staff();
            $c = require_class($u, int_arg('class_id'));
            $rows = arg('rows', []);
            if (!is_array($rows) || !$rows) fail('Liste boş.');
            if (count($rows) > 200) fail('Bir seferde en fazla 200 öğrenci eklenebilir.');
            $created = [];
            db()->beginTransaction();
            foreach ($rows as $r) {
                $name = mb_substr(trim((string)($r['name'] ?? '')), 0, 150);
                if ($name === '') continue;
                $created[] = create_student($name, (int)$c['id'], trim((string)($r['username'] ?? '')), trim((string)($r['password'] ?? '')));
            }
            db()->commit();
            out(['created' => $created]);
        }

        case 'POST students/update': {
            $u = require_staff();
            $s = require_student($u, int_arg('id'));
            if (arg('name') !== null) q('UPDATE users SET name = ? WHERE id = ?', [str_arg('name', 150), $s['id']]);
            if (arg('username') !== null) {
                $un = strtolower(str_arg('username', 32));
                if (!valid_username($un)) fail('Kullanıcı adı geçersiz (en az 3 karakter; harf, rakam, nokta, tire).');
                if (username_taken($un, (int)$s['id'])) fail('Bu kullanıcı adı kullanılıyor.', 409);
                q('UPDATE users SET username = ? WHERE id = ?', [$un, $s['id']]);
            }
            if (arg('active') !== null) q('UPDATE users SET active = ? WHERE id = ?', [arg('active') ? 1 : 0, $s['id']]);
            out(['tamam' => true]);
        }

        case 'POST students/move': {
            $u = require_staff();
            $s = require_student($u, int_arg('id'));
            $to = require_class($u, int_arg('class_id'));
            $from = arg('from_class_id');
            if ($from !== null) {
                require_class($u, (int)$from);
                q('DELETE FROM class_students WHERE class_id = ? AND student_id = ?', [(int)$from, $s['id']]);
            }
            if (!q('SELECT 1 FROM class_students WHERE class_id = ? AND student_id = ?', [$to['id'], $s['id']])->fetchColumn()) {
                q('INSERT INTO class_students (class_id, student_id) VALUES (?, ?)', [$to['id'], $s['id']]);
            }
            out(['tamam' => true]);
        }

        case 'POST students/reset-password': {
            $u = require_staff();
            $s = require_student($u, int_arg('id'));
            $pw = trim((string)arg('password', ''));
            if ($pw === '') $pw = random_password();
            if (mb_strlen($pw) < 4) fail('Şifre en az 4 karakter olmalı.');
            $username = $s['username'] ?: suggest_username($s['name']);
            q('UPDATE users SET pass_hash = ?, username = ?, failed_logins = 0, locked_until = 0 WHERE id = ?', [hash_pw($pw), $username, $s['id']]);
            out(['username' => $username, 'password' => $pw]);
        }

        case 'POST students/delete': {
            $u = require_staff();
            $s = require_student($u, int_arg('id'));
            db()->beginTransaction();
            foreach (['class_students' => 'student_id', 'attempts' => 'user_id', 'sim_state' => 'user_id', 'presence' => 'user_id', 'commands' => 'user_id', 'users' => 'id'] as $t => $col) {
                q("DELETE FROM $t WHERE $col = ?", [$s['id']]);
            }
            db()->commit();
            out(['tamam' => true]);
        }

        case 'POST students/merge': {
            // Aynı kişinin iki hesabını (ör. portal hesabı + elle açılan hesap) birleştirir.
            $u = require_staff();
            $keep = require_student($u, int_arg('keep_id'));
            $rem = require_student($u, int_arg('remove_id'));
            if ($keep['id'] === $rem['id']) fail('Aynı hesap seçildi.');
            $remFull = q('SELECT * FROM users WHERE id = ?', [$rem['id']])->fetch();
            $keepFull = q('SELECT * FROM users WHERE id = ?', [$keep['id']])->fetch();
            db()->beginTransaction();
            q('UPDATE attempts SET user_id = ? WHERE user_id = ?', [$keep['id'], $rem['id']]);
            q('DELETE FROM sim_state WHERE user_id = ? AND scope IN (SELECT scope FROM (SELECT scope FROM sim_state WHERE user_id = ?) x)', [$rem['id'], $keep['id']]);
            q('UPDATE sim_state SET user_id = ? WHERE user_id = ?', [$keep['id'], $rem['id']]);
            foreach (q('SELECT class_id FROM class_students WHERE student_id = ?', [$rem['id']])->fetchAll(PDO::FETCH_COLUMN) as $cid) {
                if (!q('SELECT 1 FROM class_students WHERE class_id = ? AND student_id = ?', [$cid, $keep['id']])->fetchColumn()) {
                    q('INSERT INTO class_students (class_id, student_id) VALUES (?, ?)', [$cid, $keep['id']]);
                }
            }
            q('DELETE FROM class_students WHERE student_id = ?', [$rem['id']]);
            q('DELETE FROM presence WHERE user_id = ?', [$rem['id']]);
            q('DELETE FROM users WHERE id = ?', [$rem['id']]);
            // Eksik giriş bilgilerini silinen hesaptan tamamla.
            $set = [];
            $vals = [];
            foreach (['portal_uid', 'username', 'pass_hash'] as $col) {
                if ($keepFull[$col] === null && $remFull[$col] !== null) {
                    $set[] = "$col = ?";
                    $vals[] = $remFull[$col];
                }
            }
            if ($set) q('UPDATE users SET ' . implode(', ', $set) . ' WHERE id = ?', [...$vals, $keep['id']]);
            db()->commit();
            out(['tamam' => true]);
        }

        // ---------------- Öğretmen: canlı izleme ve raporlar ----------------
        case 'GET live': {
            $u = require_staff();
            $c = require_class($u, (int)($_GET['class_id'] ?? 0));
            $rows = q('SELECT u.id, u.name, p.station, p.task_id, p.info, p.updated_at FROM class_students cs
                       JOIN users u ON u.id = cs.student_id LEFT JOIN presence p ON p.user_id = u.id
                       WHERE cs.class_id = ? ORDER BY u.name', [$c['id']])->fetchAll();
            $now = time();
            $bilet = [];
            foreach (q('SELECT user_id, task_id, tamam, okundu FROM commands WHERE class_id = ? ORDER BY id', [$c['id']])->fetchAll() as $b) {
                $bilet[(int)$b['user_id']][] = ['task_id' => $b['task_id'], 'tamam' => (bool)$b['tamam'], 'okundu' => (bool)$b['okundu']];
            }
            out(['now' => $now, 'students' => array_map(fn($r) => [
                'biletler' => $bilet[(int)$r['id']] ?? [],
                'id' => (int)$r['id'], 'name' => $r['name'], 'station' => $r['station'], 'task_id' => $r['task_id'], 'info' => $r['info'],
                'seen' => $r['updated_at'] !== null ? $now - (int)$r['updated_at'] : null,
            ], $rows)]);
        }

        case 'GET report': {
            $u = require_staff();
            $c = require_class($u, (int)($_GET['class_id'] ?? 0));
            $students = q('SELECT u.id, u.name FROM class_students cs JOIN users u ON u.id = cs.student_id WHERE cs.class_id = ? ORDER BY u.name', [$c['id']])->fetchAll();
            $ids = array_map(fn($s) => (int)$s['id'], $students);
            $best = best_attempts($ids);
            out([
                'class' => ['id' => (int)$c['id'], 'name' => $c['name'], 'settings' => class_settings($c['settings'])],
                'students' => array_map(fn($s) => ['id' => (int)$s['id'], 'name' => $s['name']], $students),
                'tasks' => array_map(fn($b) => ['user_id' => $b['user_id'], 'task_id' => $b['task_id'], 'mode' => $b['mode'], 'score' => $b['score']], $best),
                'outcomes' => (object)outcome_scores($best),
            ]);
        }

        case 'GET attempts': {
            $u = require_user();
            $sid = isset($_GET['student_id']) ? (int)$_GET['student_id'] : $u['id'];
            if ($sid !== $u['id']) {
                require_staff();
                require_student($u, $sid);
            }
            $rows = q('SELECT id, task_id, mode, started_at, finished_at, duration, hints, score, result FROM attempts WHERE user_id = ? ORDER BY id DESC LIMIT 200', [$sid])->fetchAll();
            out(array_map(fn($r) => [
                'id' => (int)$r['id'], 'task_id' => $r['task_id'], 'mode' => $r['mode'], 'started_at' => (int)$r['started_at'],
                'finished_at' => $r['finished_at'] !== null ? (int)$r['finished_at'] : null, 'duration' => $r['duration'] !== null ? (int)$r['duration'] : null,
                'hints' => (int)$r['hints'], 'score' => $r['score'] !== null ? (int)$r['score'] : null, 'result' => $r['result'] ? json_decode($r['result'], true) : null,
            ], $rows));
        }

        // ---------------- Servis biletleri ----------------
        case 'POST commands/send': {
            $u = require_staff();
            $c = require_class($u, int_arg('class_id'));
            $taskId = str_arg('task_id', 40);
            if (!load_task($taskId)) fail('Görev bulunamadı.', 404);
            $mesaj = mb_substr(trim((string)arg('mesaj', '')), 0, 255);
            $ids = array_map('intval', (array)arg('student_ids', []));
            $sinif = array_map('intval', q('SELECT student_id FROM class_students WHERE class_id = ?', [$c['id']])->fetchAll(PDO::FETCH_COLUMN));
            $hedef = $ids ? array_values(array_intersect($ids, $sinif)) : $sinif;
            if (!$hedef) fail('Öğrenci seçilmedi.');
            foreach ($hedef as $sid) {
                q('INSERT INTO commands (user_id, class_id, task_id, mesaj, gonderen_id, created_at) VALUES (?, ?, ?, ?, ?, ?)', [$sid, $c['id'], $taskId, $mesaj, $u['id'], now_str()]);
            }
            out(['gonderilen' => count($hedef)]);
        }

        case 'GET commands/mine': {
            $u = require_user();
            $rows = q('SELECT cm.id, cm.task_id, cm.mesaj, cm.created_at, cm.okundu, u.name AS gonderen FROM commands cm JOIN users u ON u.id = cm.gonderen_id WHERE cm.user_id = ? AND cm.tamam = 0 ORDER BY cm.id DESC LIMIT 20', [$u['id']])->fetchAll();
            out(array_map(fn($r) => ['id' => (int)$r['id'], 'task_id' => $r['task_id'], 'mesaj' => $r['mesaj'], 'gonderen' => $r['gonderen'], 'created_at' => $r['created_at'], 'okundu' => (bool)$r['okundu']], $rows));
        }

        case 'POST commands/ack': {
            $u = require_user();
            q('UPDATE commands SET okundu = 1 WHERE id = ? AND user_id = ?', [int_arg('id'), $u['id']]);
            out(['tamam' => true]);
        }

        case 'GET attempt': {
            $u = require_user();
            $a = q('SELECT * FROM attempts WHERE id = ?', [(int)($_GET['id'] ?? 0)])->fetch();
            if (!$a) fail('Deneme bulunamadı.', 404);
            if ((int)$a['user_id'] !== $u['id']) {
                require_staff();
                require_student($u, (int)$a['user_id']);
            }
            out([
                'id' => (int)$a['id'], 'task_id' => $a['task_id'], 'mode' => $a['mode'], 'started_at' => (int)$a['started_at'],
                'finished_at' => $a['finished_at'] !== null ? (int)$a['finished_at'] : null, 'duration' => $a['duration'] !== null ? (int)$a['duration'] : null,
                'hints' => (int)$a['hints'], 'score' => $a['score'] !== null ? (int)$a['score'] : null,
                'result' => $a['result'] ? json_decode($a['result'], true) : null, 'events' => $a['events'] ? json_decode($a['events'], true) : [],
            ]);
        }

        // ---------------- Yönetici: öğretmenler ----------------
        case 'GET teachers': {
            require_staff(); // öğretmenler de listeyi görebilir (sınıf paylaşımı için), düzenleme yalnızca yönetici
            $rows = q("SELECT id, role, name, username, portal_uid, active, last_login FROM users WHERE role IN ('ogretmen','admin') ORDER BY name")->fetchAll();
            out(array_map(fn($r) => ['id' => (int)$r['id'], 'role' => $r['role'], 'name' => $r['name'], 'username' => $r['username'], 'portal' => $r['portal_uid'] !== null, 'active' => (bool)$r['active'], 'last_login' => $r['last_login']], $rows));
        }

        case 'POST teachers/create': {
            require_admin();
            $name = str_arg('name', 150);
            $un = strtolower(str_arg('username', 32));
            $pw = (string)arg('password', '');
            if (!valid_username($un)) fail('Kullanıcı adı geçersiz (en az 3 karakter; harf, rakam, nokta, tire).');
            if (username_taken($un)) fail('Bu kullanıcı adı kullanılıyor.', 409);
            if (mb_strlen($pw) < 8) fail('Öğretmen şifresi en az 8 karakter olmalı.');
            $role = arg('admin') ? 'admin' : 'ogretmen';
            q('INSERT INTO users (role, name, username, pass_hash, created_at) VALUES (?, ?, ?, ?, ?)', [$role, $name, $un, hash_pw($pw), now_str()]);
            out(['id' => (int)db()->lastInsertId()]);
        }

        case 'POST teachers/update': {
            $me = require_admin();
            $id = int_arg('id');
            $t = q("SELECT * FROM users WHERE id = ? AND role IN ('ogretmen','admin')", [$id])->fetch();
            if (!$t) fail('Öğretmen bulunamadı.', 404);
            if (arg('name') !== null) q('UPDATE users SET name = ? WHERE id = ?', [str_arg('name', 150), $id]);
            if (arg('username') !== null) {
                $un = strtolower(str_arg('username', 32));
                if (!valid_username($un)) fail('Kullanıcı adı geçersiz.');
                if (username_taken($un, $id)) fail('Bu kullanıcı adı kullanılıyor.', 409);
                q('UPDATE users SET username = ? WHERE id = ?', [$un, $id]);
            }
            if (arg('admin') !== null) {
                if ($id === $me['id'] && !arg('admin')) fail('Kendi yönetici yetkinizi kaldıramazsınız.');
                q('UPDATE users SET role = ? WHERE id = ?', [arg('admin') ? 'admin' : 'ogretmen', $id]);
            }
            if (arg('active') !== null) {
                if ($id === $me['id'] && !arg('active')) fail('Kendi hesabınızı pasifleştiremezsiniz.');
                q('UPDATE users SET active = ? WHERE id = ?', [arg('active') ? 1 : 0, $id]);
            }
            out(['tamam' => true]);
        }

        case 'POST teachers/reset-password': {
            require_admin();
            $id = int_arg('id');
            $t = q("SELECT id, name, username FROM users WHERE id = ? AND role IN ('ogretmen','admin')", [$id])->fetch();
            if (!$t) fail('Öğretmen bulunamadı.', 404);
            $pw = (string)arg('password', '');
            if ($pw === '') $pw = random_password(10);
            if (mb_strlen($pw) < 8) fail('Öğretmen şifresi en az 8 karakter olmalı.');
            $un = $t['username'] ?: suggest_username($t['name']);
            q('UPDATE users SET pass_hash = ?, username = ?, failed_logins = 0, locked_until = 0 WHERE id = ?', [hash_pw($pw), $un, $id]);
            out(['username' => $un, 'password' => $pw]);
        }

        case 'POST teachers/delete': {
            $me = require_admin();
            $id = int_arg('id');
            if ($id === $me['id']) fail('Kendi hesabınızı silemezsiniz.');
            db()->beginTransaction();
            q('DELETE FROM class_teachers WHERE teacher_id = ?', [$id]);
            q("DELETE FROM users WHERE id = ? AND role IN ('ogretmen','admin')", [$id]);
            db()->commit();
            out(['tamam' => true]);
        }

        default:
            fail('Bilinmeyen istek: ' . $route, 404);
    }
} catch (PDOException $e) {
    if (db()->inTransaction()) db()->rollBack();
    error_log('[islab] ' . $e->getMessage());
    fail('Veritabanı hatası. Lütfen tekrar deneyin.', 500);
}
