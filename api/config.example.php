<?php
// İşletim Sistemleri Sanal Laboratuvarı — sunucu ayarları
//
// Bu dosyayı "config.php" adıyla kopyalayıp düzenleyin.
// Daha güvenli seçenek: dosyayı public_html'in BİR ÜST klasörüne "isletimsistemi-config.php" adıyla koyun;
// uygulama önce orayı arar. Böylece ayarlar web üzerinden hiçbir şekilde erişilemez.

return [
    // Hostinger > Veritabanları > MySQL bölümünden oluşturduğunuz veritabanı bilgileri.
    'db' => [
        'dsn'  => 'mysql:host=localhost;dbname=u123456789_islab;charset=utf8mb4',
        'user' => 'u123456789_islab',
        'pass' => 'VERITABANI_SIFRESI',
    ],
    // Yerel deneme için SQLite da kullanılabilir:
    // 'db' => ['dsn' => 'sqlite:' . __DIR__ . '/../../data/islab.sqlite', 'user' => null, 'pass' => null],

    // İlk kurulumda (kurulum.php) yönetici hesabı açmak için sorulan kod. En az 8 karakter.
    'kurulum_kodu' => 'BURAYA-BIR-KURULUM-KODU-YAZIN',

    // Okul portalı (portal.mkcaglar.com) ile paylaşılan gizli anahtar (en az 32 karakter, rastgele).
    // C# Form Stüdyosu'ndakinden FARKLI bir anahtar kullanın.
    // Üretmek için: php -r "echo bin2hex(random_bytes(32));"
    'jwt_secret' => 'BURAYA-EN-AZ-32-KARAKTERLIK-RASTGELE-BIR-ANAHTAR-YAZIN',

    // Portalın ürettiği bağlantı en fazla kaç saniye geçerli olsun.
    'token_max_age' => 300,

    // Giriş yaptıktan sonra oturum kaç saat açık kalsın.
    'session_hours' => 10,

    // Giriş sayfasındaki "Okul portalından giriş" düğmesinin adresi.
    'portal_url' => 'https://portal.mkcaglar.com/',

    // Deneme için token üreten sayfa (test-portal.php). Canlı kullanımda MUTLAKA false olmalı.
    'test_portal' => false,
];
