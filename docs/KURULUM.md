# Hostinger'a Kurulum (isistem.mkcaglar.com)

Hostinger **Web / Premium / Business** (paylaşımlı) paketi yeterlidir. Simülasyon öğrencinin tarayıcısında çalışır;
sunucuda yalnızca **PHP 8.1+** ve **MySQL** gerekir. Kurulum, C# Form Stüdyosu ile aynı adımlardan oluşur.

## 1. Alt alan adı

hPanel > **Alan Adları > Alt Alan Adları** bölümünden `isistem.mkcaglar.com` oluşturun. Klasörü genellikle
`domains/isistem.mkcaglar.com/public_html` olur.

- **SSL:** hPanel > Güvenlik > SSL bölümünden alt alan adı için sertifikanın açık olduğundan emin olun.
- **PHP sürümü:** hPanel > Gelişmiş > PHP Yapılandırması bölümünden **8.2 veya üstünü** seçin.

## 2. Veritabanı

hPanel > **Veritabanları > MySQL Veritabanları** bölümünden yeni bir veritabanı ve kullanıcı oluşturun (ör. `u123456789_islab`).
Veritabanı adını, kullanıcı adını ve şifreyi not edin. Tablolar ilk istekte **otomatik** oluşturulur.

## 3. Ayar dosyası

`server/api/config.example.php` dosyasını kopyalayıp düzenleyin. En güvenli yer, web'den erişilemeyen bir üst klasördür:

```
/home/u123456789/domains/isistem.mkcaglar.com/isletimsistemi-config.php      ← önerilen
/home/u123456789/domains/isistem.mkcaglar.com/public_html/api/config.php     ← alternatif
```

Uygulama sırasıyla şunlara bakar: `public_html`'in yanındaki `isletimsistemi-config.php`, aynı yerdeki `config.php`, son olarak `public_html/api/config.php`.

| Ayar | Açıklama |
|---|---|
| `db.dsn`, `db.user`, `db.pass` | 2. adımdaki MySQL bilgileri |
| `kurulum_kodu` | İlk kurulumda yönetici hesabını açarken sorulan kod (en az 8 karakter) |
| `jwt_secret` | Okul portalı ile paylaşılan gizli anahtar. **C# Form Stüdyosu'ndakinden farklı olsun.** Üretmek için: `php -r "echo bin2hex(random_bytes(32));"` |
| `portal_url` | `https://portal.mkcaglar.com/` — giriş sayfasındaki "Okul portalı ile giriş" düğmesi |
| `test_portal` | Yalnızca deneme için `true`. Canlıda **mutlaka `false`** |

## 4. Dosyaları yükleme

Site önce derlenmelidir (`npm run build`). Hostinger paylaşımlı hostingte derleme yapılamadığı için derlemeyi
**GitHub Actions** yapar: `main` dalına her gönderimde testler çalışır, site derlenir ve derlenmiş hâli
**`yayin`** dalına konur (`.github/workflows/yayinla.yml`). Hostinger bu dalı çeker.

### A) Hostinger "Git" ile (önerilir)

1. Önce `main` dalına bir gönderim yapın (ya da GitHub > Actions > **Derle ve Yayınla** > *Run workflow*).
   İş bitince depoda **`yayin`** dalı oluşur.
2. hPanel'de `isistem.mkcaglar.com` sitesinin `public_html` klasörünü **boşaltın** (Hostinger'ın koyduğu
   `default.php` gibi dosyaları silin). Git kurulumu yalnızca boş klasöre yapılabilir. Ayar dosyası `public_html`'in
   **üstünde** durduğu için etkilenmez.
3. hPanel > **Gelişmiş > Git** bölümünde *Depo oluştur*:
   - **Depo:** `https://github.com/mkcaglars/operatingsystems.git` (depo herkese açık olduğu için SSH anahtarı gerekmez)
   - **Dal:** `yayin`  ← `main` değil!
   - **Dizin:** boş bırakın (doğrudan `public_html`)
4. *Oluştur* deyin, ardından listede **Dağıt (Deploy)** düğmesine basın. Site yayındadır.
5. **Otomatik dağıtım:** aynı sayfada *Otomatik Dağıtım* bölümündeki **webhook adresini** kopyalayın. GitHub deposunda
   **Settings > Webhooks > Add webhook**:
   - *Payload URL:* kopyaladığınız adres
   - *Content type:* `application/json`
   - *Which events:* **Just the push event**

   Bundan sonra `main` dalına her gönderimde: Actions derler → `yayin` dalı güncellenir → Hostinger kendiliğinden çeker.

> `public_html` içindeki `.git` klasörü `.htaccess` kuralıyla web'den gizlenir.

### B) FTP ile (Git yerine)

GitHub deposunda **Settings > Secrets and variables > Actions** bölümüne `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`
gizli değerlerini ve `FTP_DIR` değişkenini (ör. `domains/isistem.mkcaglar.com/public_html/`) ekleyin. İş akışı
derlenen siteyi FTP ile de yükler. A ve B'den yalnızca birini kullanın.

### C) Elle

Bilgisayarınızda Node.js 22 kurulu olmalı:

```bash
npm ci
npm run build
```

Oluşan `dist/` klasörünün **içindekileri** hPanel Dosya Yöneticisi ile `public_html` klasörüne yükleyin (gizli
`.htaccess` dosyaları dahil). GitHub Actions'taki her derlemenin çıktısı "site" adlı artifact olarak da indirilebilir.

## 5. İlk kurulum: yönetici hesabı

1. `https://isistem.mkcaglar.com/kurulum.php` adresini açın.
2. Ayar dosyasındaki **kurulum kodunu**, adınızı, kullanıcı adınızı ve şifrenizi girin.
3. Yönetici hesabı açılır ve öğretmen paneline yönlendirilirsiniz. Bu sayfa bundan sonra kapanır.

Yönetici, **Öğretmenler** sayfasından öğretmen hesaplarını açar. Her öğretmen kendi sınıflarını açar ya da portaldan gelen
öğrencilerin sınıfına katılır.

## 6. Deneme

1. Ayarlarda geçici olarak `'test_portal' => true` yapın.
2. `https://isistem.mkcaglar.com/test-portal.php` adresinden öğrenci olarak girin; öğrenci, portalın bildirdiği
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
| Hostinger Git: "dizin boş değil" | `public_html` içindeki dosyaları silin (4-A, 2. adım) |
| Site güncellenmiyor | GitHub > Actions'ta iş başarılı mı? `yayin` dalı güncellendi mi? Webhook teslim edildi mi (Settings > Webhooks > Recent Deliveries)? Gerekirse hPanel'de *Dağıt*'a basın |
