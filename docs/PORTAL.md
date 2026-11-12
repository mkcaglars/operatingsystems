# Okul Portalı Entegrasyonu (portal.mkcaglar.com)

Öğrenci ve öğretmenler laboratuvara iki yoldan girebilir:

1. **Okul portalından otomatik giriş** (şifresiz): portal, kullanıcının bilgilerini gizli bir anahtarla imzalar;
   laboratuvar imzayı doğrular. URL'deki ad veya rol değiştirilerek başka birinin hesabına girilemez.
2. **Portal dışından kullanıcı adı + şifre**: öğretmenin panelden verdiği bilgilerle `isletimsistemi.mkcaglar.com` adresinden.

Sistem, C# Form Stüdyosu'ndaki token sisteminin aynısıdır.

## Akış

```
Öğrenci portalda "İşletim Sistemleri"ne tıklar
   → Portal imzalı bağlantı üretir:  https://isletimsistemi.mkcaglar.com/giris.php?token=eyJhbGciOi...
   → giris.php imzayı, süreyi ve tek kullanımlığı denetler
   → Kullanıcı ilk girişte otomatik oluşturulur; ad ve rol her girişte güncellenir
   → Öğrenci, "sinif" alanındaki sınıfa otomatik eklenir (sınıf yoksa oluşturulur)
   → Oturum açılır (varsayılan 10 saat)
```

## Token biçimi

Standart **JWT (HS256)**.

| Alan | Zorunlu | Örnek | Açıklama |
|---|---|---|---|
| `uid` | evet | `"1001"` | Kalıcı ve benzersiz kullanıcı kodu (okul no). İlerleme bu koda bağlanır. **T.C. kimlik numarası kullanmayın.** |
| `name` | evet | `"Ayşe Demir"` | Ekranda görünen ad |
| `role` | hayır | `"ogrenci"` / `"ogretmen"` | Varsayılan öğrenci. Yönetici rolü portaldan verilemez. |
| `sinif` | hayır | `"9-A"` | Öğrenci bu sınıfa otomatik eklenir. Öğretmen sınıflara otomatik bağlanmaz; panelden kendisi seçer. |
| `exp` | evet | `1760000000` | Son geçerlilik (Unix zamanı). En fazla **5 dakika** sonrası |
| `iat` | hayır | `1759999700` | Üretilme zamanı |
| `jti` | evet | `"9f86d081884c7d65..."` | Rastgele, tek kullanımlık kod (en fazla 64 karakter) |

İmza anahtarı, laboratuvarın ayar dosyasındaki `jwt_secret` ile **aynı** olmalıdır. Güvenlik için C# Form Stüdyosu'ndan
**farklı** bir anahtar kullanın.

Güvenlik kuralları:
- Süresi geçmiş bağlantı reddedilir (sunucu saatleri arasındaki 30 sn'lik fark tolere edilir).
- Aynı `jti` ikinci kez kullanılamaz; paylaşılan veya tarayıcı geçmişinde kalan bağlantı işe yaramaz.
- Anahtar yalnızca portal sunucusunda durur; tarayıcıya (JavaScript'e) asla gönderilmez.

## PHP ile kullanım

[`portal-ornek/isletimsistemi-baglanti.php`](../portal-ornek/isletimsistemi-baglanti.php) dosyasını portala ekleyin,
içindeki anahtarı düzenleyin. Portalda tıklanınca çalışan bir sayfa (ör. `isletimsistemi-git.php`):

```php
require 'isletimsistemi-baglanti.php';

$url = isletimsistemi_baglanti($kullanici['okul_no'], $kullanici['ad_soyad'],
                               $kullanici['ogretmen'] ? 'ogretmen' : 'ogrenci',
                               $kullanici['sinif']);
header('Location: ' . $url);
exit;
```

Bağlantıyı sayfa yüklenirken önceden üretip HTML'e yazmayın; tıklanınca üretin. Aksi halde 5 dakikalık süre dolabilir.

## Portal hesabı ile şifreli hesap

- Portaldan gelen öğrencinin başlangıçta şifresi yoktur. Öğretmen panelde **Şifre ver** ile kullanıcı adı ve şifre
  üretebilir; öğrenci de **Hesabım** sayfasından kendisi şifre belirleyebilir. Böylece portal dışından da girer.
- Aynı öğrencinin hem portal hesabı hem de elle açılmış bir hesabı oluşmuşsa, öğretmen **Birleştir** ile iki hesabı
  tek hesapta toplar; tüm çalışmalar korunur.
