# İşletim Sistemleri Sanal Laboratuvarı

9. sınıf Bilişim Teknolojileri **İşletim Sistemleri** dersinin 23 kazanımını uygulamalı olarak kazandıran ve ölçen,
web tabanlı sanal bilgisayar laboratuvarı. Yayın adresi: **https://isistem.mkcaglar.com**

- Tasarım: [docs/TASARIM.md](docs/TASARIM.md)
- Hostinger'a kurulum (Git ile otomatik yayın): [docs/KURULUM.md](docs/KURULUM.md)
- Okul portalı (portal.mkcaglar.com) entegrasyonu: [docs/PORTAL.md](docs/PORTAL.md)
- Görsel üretim listesi: [docs/GORSEL_PROMPTLARI.md](docs/GORSEL_PROMPTLARI.md)

## Neler var? (F1–F5)

**Öğrenci**
- Okul portalından otomatik giriş ya da kullanıcı adı + şifre ile giriş
- 9 istasyonlu laboratuvar ana sayfası; görevler **Öğren / Uygula / Değerlendir** modlarında
- **İ1 Donanım masası** (B1, B2, Y1): klavye/fare seçimi, kasa arka paneline kablo takma (harici ekran kartı,
  PS/2 renkleri, ses jakları), UPS güç/VA hesabı ve model seçimi, elektrik kesintisinde güvenli kapatma,
  kurulum öncesi hazırlık
- **İ2 POST ve BIOS/UEFI** (B3, S1, S2, B9, S8): açılış zinciri, zamanlı tuşla Setup'a giriş, Aptio benzeri BIOS Setup
  (önyükleme sırası, sanallaştırma, SATA modu, Secure Boot, TPM, yönetici parolası, USB önyükleme, tarih/saat),
  görsel bip kodu teşhisi, CMOS pili arızası. Yanlış ayarların gerçekçi sonuçları vardır (ör. SATA modu değişince mavi ekran).
- **İ3 İşletim sistemi seçimi** (B4, B5, B6, Y1): sınıflandırma (masaüstü/sunucu/mobil/gömülü, açık/kapalı kaynak),
  açık kaynak ve dağıtımlar, gereksinim karşılaştırması (Windows 11 / Ubuntu), ihtiyaca göre seçim ve avantaj/dezavantaj
- **İ4 Windows 11 kurulumu** (S3, Y2, Y1): Rufus ile kurulum USB'si (UEFI→GPT, BIOS→MBR; yedek diski tuzağı),
  tam kurulum sihirbazı (dil, ürün anahtarı, lisans, disk bölümleme, ilk açılış: bölge, cihaz adı, yerel hesap, gizlilik),
  kişisel verileri koruyarak yeniden kurulum
- **İ5 Ubuntu** (B5, S3, Y2, S5, B8, S7): canlı oturumda donanım tanıma, elle bölümlemeyle kurulum (EFI, /, /home),
  Windows ile çift önyükleme ve GRUB, eğitsel terminal (`apt update/upgrade`, `adduser`, `usermod`, `mkdir/cp/mv/rm`…)
- **Sanal Windows 11 masaüstü** (İ6–İ8): başlat menüsü, görev çubuğu, UAC; Ayarlar, Görev Yöneticisi, Dosya Gezgini,
  Aygıt Yöneticisi, Windows Güvenliği, tarayıcı (resmî ve sahte siteler, SmartScreen), kurulum sihirbazları, Word
- **İ6 Ayarlar ve kişiselleştirme** (B7, B8, S4, S7): Görev Yöneticisi, sistem bilgisi, kişiselleştirme, erişilebilirlik
  ve solak fare, güç ve başlangıç, Dosya Gezgini (uzantılar, gizli öğeler)
- **İ7 Sürücüler ve Windows Güvenliği** (S5, S6, Y3, S8): sürücüleri doğru sırayla yükleme, Defender uyarıları, tam
  tarama ve karantina, fidye yazılımı koruması, standart hesap ve geri yükleme noktası
- **İ8 Uygulama yazılımları** (S6, Y3, S5, B6): Chrome (resmî site, varsayılan tarayıcı), Microsoft Office (özel kurulum,
  ürün anahtarıyla etkinleştirme; KMS tuzağı), Office onarma ve istenmeyen program kaldırma, Ubuntu'da .deb ile Chrome;
  öğretmenin açtığı isteğe bağlı WinRAR, Acrobat Reader (McAfee teklifleri) ve Photoshop (gereksinimler, hesap)
- **İ9 Arıza giderme** (B9, B10, S8, S9, Y4): gevşek SATA kablosu, Kod 12 donanım çakışması, hatalı sürücü → mavi ekran →
  Windows Kurtarma Ortamı → Güvenli Mod → Sürücüyü Geri Al, yavaşlayan bilgisayar (truva atı + reklam yazılımı), internet yok,
  çift önyüklemede GRUB'da Windows yok, kurtarılamayan bilgisayarı yedekleyip "Bu bilgisayarı sıfırla"
- **Kampanyalar K1–K4** (Y1–Y4): yeni ofis bilgisayarı, laboratuvara Ubuntu, servis masası günü, virüslü bilgisayarı yeniden kur;
  adımlar sırayla açılır
- **Servis biletleri:** öğretmenin gönderdiği arıza ana sayfada bant olarak çıkar
- **Serbest kum havuzu** (`#/kum-havuzu`, puansız): tek bir gerçekçi bilgisayar — On/off ve reset düğmeleri, güç ve disk
  ışıkları, 3 USB girişi, sürükle-tak 2 flash bellek, durum çubuğu. Eski (virüslü) Windows'ta belgeleri belleğe yedekle,
  Microsoft'tan ISO, rufus.ie'den Rufus indirip kurulum belleği hazırla, F8/BIOS ile USB'den aç, diski biçimlendirip Windows 11'i
  kur, Wi-Fi şifresiyle bağlan, Windows Update ile sürücüleri yükle, Chrome ve WinRAR kur, ayarları yap. BIOS'a giriş, BIOS'ta
  gezinme ve yazı yazma **gerçek klavyeden** yapılır. Çalışma sunucuya kaydedilir; isteğe bağlı yapılacaklar listesi vardır
- Yarım kalan çalışma sunucuya kaydedilir; başka bilgisayardan kaldığı yerden devam edilir
- Görev sonunda puan, kriterler, hatalar ve kazanım düzeyleri

**Öğretmen**
- Birden fazla öğretmen; her öğretmen yalnızca kendi sınıflarını görür, bir sınıf paylaşılabilir
- Sınıf açma, portaldan gelen sınıfa katılma
- Öğrenci ekleme (tek tek ya da Excel'den yapıştırarak toplu), kullanıcı adı/şifre üretme, yazdırılabilir giriş kartları,
  şifre sıfırlama, pasifleştirme, sınıf değiştirme, silme, portal ve şifreli hesabı **birleştirme**
- **Canlı izleme** (5 sn'de bir yenilenir) ve **arıza gönderme** (seçili öğrencilere servis bileti)
- **Kazanım raporu** (ısı haritası; kazanım / görev / kampanya görünümleri, Excel/CSV, yazdır/PDF); öğrenci adına
  tıklayınca tüm denemeler, kriterler ve zaman damgalı olay geçmişi
- Sınıf ayarları: değerlendirme modu, isteğe bağlı yazılımlar (WinRAR, Acrobat Reader, Photoshop), hızlandırılmış kurulum, eşikler

**Yönetici**: öğretmen hesapları, yönetici yetkisi, sınıflara öğretmen atama.

## Nasıl çalışır?

```
Tarayıcı (React + TypeScript)                         Hostinger (PHP 8 + MySQL)
┌──────────────────────────────────────────┐          ┌──────────────────────────────────┐
│ Simülasyon ve görev arayüzleri            │  HTTPS   │ giris.php   portal token girişi  │
│ Kural motoru (anlık geri bildirim)        │◄────────►│ api/        hesaplar, sınıflar,  │
│ Öğretmen paneli                           │   JSON   │             durum, puanlama      │
└──────────────────────────────────────────┘          │ Kural motoru (resmî puan)        │
                                                      └──────────────────────────────────┘
```

Görevlerin başarı koşulları kod değil, `content/tasks/*.json` dosyalarındaki **bildirimsel kurallardır**. Aynı kurallar
tarayıcıda (`web/src/core/rules.ts`) ve sunucuda (`server/api/lib/rules.php`) değerlendirilir; iki motorun aynı sonucu
verdiği testlerle denetlenir. Süre ve ipucu sayısı sunucuda tutulur, resmî puanı sunucu hesaplar.

## Klasörler

| Klasör | İçerik |
|---|---|
| `web/` | Arayüz (React + TypeScript, Vite) |
| `web/src/core/` | Kural motoru, puanlama, simülasyon durumu |
| `web/src/tasks/` | Görev arayüzleri |
| `server/` | PHP: API, portal girişi, kurulum sihirbazı |
| `content/` | Kazanımlar, istasyonlar, görevler (JSON) |
| `assets/gorseller/` | Gerçekçi görseller |
| `portal-ornek/` | Okul portalına eklenecek giriş bağlantısı kodu |
| `tests/` | Kural motoru, TS–PHP eşdeğerlik ve API uçtan uca testleri |

## Geliştirme

Node.js 22 ve PHP 8.1+ (pdo_sqlite) gerekir.

```bash
npm ci
cp server/api/config.example.php server/api/config.php   # SQLite satırını açın, test_portal => true
npm run dev:php     # PHP API: http://127.0.0.1:8081
npm run dev         # Arayüz: http://localhost:5173
```

Testler:

```bash
npm run test:all    # kural motoru (TS + PHP eşdeğerlik), içerik dosyaları, API uçtan uca
```

Yeni görev eklemek için `content/tasks/` altına JSON dosyası ekleyin; arayüzü `web/src/tasks/registry.tsx` içinde kayıtlıdır.
