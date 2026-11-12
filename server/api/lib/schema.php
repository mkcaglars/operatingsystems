<?php
// Veritabanı tablolarını ilk kullanımda otomatik oluşturur (SQLite ve MySQL/MariaDB).
declare(strict_types=1);

const SCHEMA_VERSION = 1;

function schema_migrate(PDO $pdo): void
{
    try {
        $v = (int)$pdo->query('SELECT version FROM schema_info')->fetchColumn();
        if ($v >= SCHEMA_VERSION) return;
    } catch (PDOException $e) {
        // tablo yok → oluştur
    }
    $sqlite = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    $pk = $sqlite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT AUTO_INCREMENT PRIMARY KEY';
    $big = $sqlite ? 'TEXT' : 'MEDIUMTEXT';
    $eng = $sqlite ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

    $tables = [
        "CREATE TABLE IF NOT EXISTS schema_info (version INT NOT NULL)$eng",
        // role: admin | ogretmen | ogrenci
        // username + pass_hash: portal dışı giriş (boş olabilir)
        // portal_uid: okul portalından gelen kalıcı kod (boş olabilir)
        "CREATE TABLE IF NOT EXISTS users (
            id $pk,
            role VARCHAR(16) NOT NULL,
            name VARCHAR(150) NOT NULL,
            username VARCHAR(64) NULL UNIQUE,
            pass_hash VARCHAR(255) NULL,
            portal_uid VARCHAR(64) NULL UNIQUE,
            active TINYINT NOT NULL DEFAULT 1,
            failed_logins INT NOT NULL DEFAULT 0,
            locked_until INT NOT NULL DEFAULT 0,
            created_at VARCHAR(19) NOT NULL,
            last_login VARCHAR(19) NULL)$eng",
        "CREATE TABLE IF NOT EXISTS classes (
            id $pk,
            name VARCHAR(50) NOT NULL UNIQUE,
            settings TEXT NULL,
            created_at VARCHAR(19) NOT NULL)$eng",
        "CREATE TABLE IF NOT EXISTS class_teachers (
            class_id INT NOT NULL,
            teacher_id INT NOT NULL,
            PRIMARY KEY (class_id, teacher_id))$eng",
        "CREATE TABLE IF NOT EXISTS class_students (
            class_id INT NOT NULL,
            student_id INT NOT NULL,
            PRIMARY KEY (class_id, student_id))$eng",
        "CREATE TABLE IF NOT EXISTS used_tokens (jti VARCHAR(64) PRIMARY KEY, expires_at INT NOT NULL)$eng",
        "CREATE TABLE IF NOT EXISTS login_throttle (ip VARCHAR(64) PRIMARY KEY, fails INT NOT NULL, window_start INT NOT NULL)$eng",
        // Sanal makine durumu (öğrenci kaldığı yerden devam eder). scope: "vm" ya da görev kimliği.
        "CREATE TABLE IF NOT EXISTS sim_state (
            user_id INT NOT NULL,
            scope VARCHAR(40) NOT NULL,
            data $big NOT NULL,
            version INT NOT NULL DEFAULT 1,
            updated_at VARCHAR(19) NOT NULL,
            PRIMARY KEY (user_id, scope))$eng",
        // Görev denemeleri. Süre sunucu saatiyle ölçülür; puan sunucuda hesaplanır.
        "CREATE TABLE IF NOT EXISTS attempts (
            id $pk,
            user_id INT NOT NULL,
            task_id VARCHAR(40) NOT NULL,
            mode VARCHAR(16) NOT NULL,
            started_at INT NOT NULL,
            finished_at INT NULL,
            duration INT NULL,
            hints INT NOT NULL DEFAULT 0,
            score INT NULL,
            result TEXT NULL,
            events $big NULL,
            final_state $big NULL)$eng",
        "CREATE INDEX " . ($sqlite ? 'IF NOT EXISTS ' : '') . "attempts_user_task ON attempts (user_id, task_id)",
        // Canlı izleme
        "CREATE TABLE IF NOT EXISTS presence (
            user_id INT PRIMARY KEY,
            station VARCHAR(16) NULL,
            task_id VARCHAR(40) NULL,
            info VARCHAR(255) NULL,
            updated_at INT NOT NULL)$eng",
    ];
    foreach ($tables as $sql) {
        try {
            $pdo->exec($sql);
        } catch (PDOException $e) {
            // MySQL'de "CREATE INDEX" ikinci kez çalışırsa hata verir: yoksay.
            if (!str_contains($sql, 'CREATE INDEX')) throw $e;
        }
    }
    $pdo->exec('DELETE FROM schema_info');
    $pdo->prepare('INSERT INTO schema_info (version) VALUES (?)')->execute([SCHEMA_VERSION]);
}
