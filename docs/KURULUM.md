# Hostinger'a Kurulum (isletimsistemi.mkcaglar.com)

Hostinger **Web / Premium / Business** (paylaşımlı) paketi yeterlidir. Simülasyon öğrencinin tarayıcısında çalışır;
sunucuda yalnızca **PHP 8.1+** ve **MySQL** gerekir. Kurulum, C# Form Stüdyosu ile aynı adımlardan oluşur.

## 1. Alt alan adı

hPanel > **Alan Adları > Alt Alan Adları** bölümünden `isletimsistemi.mkcaglar.com` oluşturun. Klasörü genellikle
`domains/isletimsistemi.mkcaglar.com/public_html` olur.

- **SSL:** hPanel > Güvenlik > SSL bölümünden alt alan adı için sertifikanın açık olduğundan emin olun.
- **PHP sürümü:** hPanel > Gelişmiş > PHP Yapılandırması bölümünden **8.2 veya üstünü** seçin.

## 2. Veritabanı

hPanel > **Veritabanları > MySQL Veritabanları** bölümünden yeni bir veritabanı ve kullanıcı oluşturun (ör. `u123456789_islab`).
Veritabanı adını, kullanıcı adını ve şifreyi not edin. Tablolar ilk istekte **otomatik** oluşturulur.

## 3. Ayar dosyası

`server/api/config.example.php` dosyasını kopyalayıp düzenleyin. En güvenli yer, web'den erişilemeyen bir üst klasördür:

```
/home/u123456789/domains/isletimsistemi.mkcaglar.com/isletimsistemi-config.php      ← önerilen
/home/u123456789/domains/isletimsistemi.mkcaglar.com/public_html/api/config.php     ← alternatif
```

Uygulama önce `public_html`'in bir üstündeki `isletimsistemi-config.php` dosyasını arar, bulamazsa `api/config.php` dosyasına bakar.

| Ayar | Açıklama |
|---|---|
| `db.dsn`, `db.user`, `db.pass` | 2. adımdaki MySQL bilgileri |
| `kurulum_kodu` | İlk kurulumda yönetici hesabını açarken sorulan kod (en az 8 karakter) |
| `jwt_secret` | Okul portalı ile paylaşılan gizli anahtar. **C# Form Stüdyosu'ndakinden farklı olsun.** Üretmek için: `php -r "echo bin2hex(random_bytes(32));"` |
| `portal_url` | `https://portal.mkcaglar.com/` — giriş sayfasındaki "Okul portalı ile giriş" düğmesi |
| `test_portal` | Yalnızca deneme için `true`. Canlıda **mutlaka `false`** |

## 4. Dosyaları yükleme

### A) GitHub Actions ile otomatik (önerilir)

`main` dalına her gönderimde testler çalışır, site derlenir ve FTP ile yüklenir (`.github/workflows/yayinla.yml`).

1. hPanel > **Dosyalar > FTP Hesapları** bölümünden FTP bilgilerini alın.
2. GitHub deposunda **Settings > Secrets and variables > Actions** bölümüne ekleyin:
   - **Secrets:** `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`
   - **Variables:** `FTP_DIR` = FTP hesabının kök klasörüne göre site klasörü, sonunda `/` ile
     (ör. `domains/isletimsistemi.mkcaglar.com/public_html/`)
3. `main` dalına bir değişiklik gönderin ya da Actions sekmesinden **Derle ve Yayınla** iş akışını elle çalıştırın.

`api/config.php` hiçbir zaman üzerine yazılmaz.

### B) Elle

Bilgisayarınızda Node.js 22 kurulu olmalı:

```bash
npm ci
npm run build
```

Oluşan `dist/` klasörünün **içindekileri** hPanel Dosya Yöneticisi ya da FTP ile `public_html` klasörüne yükleyin.
Gizli `.htaccess` dosyaları da yüklenmelidir. GitHub Actions'taki her derlemenin çıktısı "site" adlı artifact olarak da indirilebilir.

## 5. İlk kurulum: yönetici hesabı

1. `https://isletimsistemi.mkcaglar.com/kurulum.php` adresini açın.
2. Ayar dosyasındaki **kurulum kodunu**, adınızı, kullanıcı adınızı ve şifrenizi girin.
3. Yönetici hesabı açılır ve öğretmen paneline yönlendirilirsiniz. Bu sayfa bundan sonra kapanır.

Yönetici, **Öğretmenler** sayfasından öğretmen hesaplarını açar. Her öğretmen kendi sınıflarını açar ya da portaldan gelen
öğrencilerin sınıfına katılır.

## 6. Deneme

1. Ayarlarda geçici olarak `'test_portal' => true` yapın.
2. `https://isletimsistemi.mkcaglar.com/test-portal.php` adresinden öğrenci olarak girin; öğrenci, portalın bildirdiği
   sınıfa otomatik eklenir.
3. Öğretmen olarak girip öğrencinin sınıfına katılın; **Canlı izleme** ve **Kazanım raporu** sekmelerini kontrol edin.
4. Deneme bitince `'test_portal' => false` yapın.

## 7. Okul portalı

Portal tarafında yapılacaklar için [PORTAL.md](PORTAL.md) belgesine bakın.

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| "Ayar dosyası bulunamadı" | 3. adım: dosya adı ve konumu |
| "Veritabanı hatası" | `db` bilgileri; hPanel'de kullanıcının veritabanına yetkisi |
| "Kurulum kodu ayarlanmamış" | Ayar dosyasına en az 8 karakterlik `kurulum_kodu` yazın |
| Portal bağlantısı "imzası geçersiz" | Portal ile laboratuvardaki `jwt_secret` aynı değil |
| Portal bağlantısı "süresi dolmuş" | Sunucu saatleri farklı ya da bağlantı sayfa yüklenirken üretilmiş; tıklanınca üretin |
| "Güvenlik anahtarı geçersiz" | Oturum süresi dolmuş; sayfayı yenileyin |
