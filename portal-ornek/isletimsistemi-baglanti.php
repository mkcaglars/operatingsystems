<?php
/**
 * OKUL PORTALI (portal.mkcaglar.com) İÇİN ÖRNEK KOD
 * ---------------------------------------------------------------------------
 * Giriş yapmış kullanıcı için İşletim Sistemleri Laboratuvarı'na otomatik giriş bağlantısı üretir.
 * C# Form Stüdyosu'ndaki csharp-ders-baglanti.php ile aynı yapıdadır; yalnızca adres ve anahtar farklıdır.
 * Ek kütüphane gerekmez (PHP 7.4+).
 *
 * Örnek kullanım (portalda bir sayfa, ör. isletimsistemi-git.php):
 *
 *     require 'isletimsistemi-baglanti.php';
 *     $url = isletimsistemi_baglanti(
 *         $ogrenci['okul_no'],          // uid   : kalıcı ve benzersiz kullanıcı kodu (T.C. kimlik no DEĞİL)
 *         $ogrenci['ad_soyad'],         // name  : ekranda görünecek ad
 *         $ogrenci['ogretmen_mi'] ? 'ogretmen' : 'ogrenci',
 *         $ogrenci['sinif']             // sinif : ör. "9-A" (öğrenci bu sınıfa otomatik eklenir)
 *     );
 *     header('Location: ' . $url);
 *     exit;
 *
 * Portal menüsüne "İşletim Sistemleri" bağlantısı olarak isletimsistemi-git.php'yi koyun.
 * Bağlantıyı sayfa yüklenirken üretip HTML'e yazmayın; tıklanınca üretin (5 dakika geçerlidir).
 */

// Laboratuvarın adresi (sonunda / olmadan)
const ISLETIMSISTEMI_ADRES = 'https://isletimsistemi.mkcaglar.com';

// Laboratuvarın ayar dosyasındaki 'jwt_secret' ile AYNI olmalı. Kimseyle paylaşmayın.
// C# Form Stüdyosu'nun anahtarından FARKLI olmalı.
const ISLETIMSISTEMI_ANAHTAR = 'BURAYA-EN-AZ-32-KARAKTERLIK-RASTGELE-BIR-ANAHTAR-YAZIN';

function isletimsistemi_b64url(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

/**
 * @param string $uid   Kalıcı kullanıcı kodu (okul numarası). İlerleme bu koda bağlanır.
 * @param string $name  Ad soyad
 * @param string $role  'ogrenci' veya 'ogretmen'
 * @param string $sinif Sınıf/şube (ör. "9-A")
 */
function isletimsistemi_baglanti(string $uid, string $name, string $role = 'ogrenci', string $sinif = ''): string
{
    $simdi = time();
    $payload = [
        'uid'   => $uid,
        'name'  => $name,
        'role'  => $role === 'ogretmen' ? 'ogretmen' : 'ogrenci',
        'sinif' => $sinif,
        'iat'   => $simdi,
        'exp'   => $simdi + 300,                 // 5 dakika geçerli
        'jti'   => bin2hex(random_bytes(16)),    // tek kullanımlık
    ];
    $header = isletimsistemi_b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body   = isletimsistemi_b64url(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $imza   = isletimsistemi_b64url(hash_hmac('sha256', "$header.$body", ISLETIMSISTEMI_ANAHTAR, true));
    return ISLETIMSISTEMI_ADRES . '/giris.php?token=' . urlencode("$header.$body.$imza");
}
