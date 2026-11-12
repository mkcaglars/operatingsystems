# İşletim Sistemleri Sanal Laboratuvarı

9. sınıf Bilişim Teknolojileri **İşletim Sistemleri** dersinin 23 kazanımını uygulamalı olarak kazandıran ve ölçen,
web tabanlı sanal bilgisayar laboratuvarı. Yayın adresi: **https://isistem.mkcaglar.com**

- Tasarım: [docs/TASARIM.md](docs/TASARIM.md)
- Hostinger'a kurulum (Git ile otomatik yayın): [docs/KURULUM.md](docs/KURULUM.md)
- Okul portalı (portal.mkcaglar.com) entegrasyonu: [docs/PORTAL.md](docs/PORTAL.md)
- Görsel üretim listesi: [docs/GORSEL_PROMPTLARI.md](docs/GORSEL_PROMPTLARI.md)

## Neler var? (F1)

**Öğrenci**
- Okul portalından otomatik giriş ya da kullanıcı adı + şifre ile giriş
- 9 istasyonlu laboratuvar ana sayfası; görevler **Öğren / Uygula / Değerlendir** modlarında
- İlk görev: **İ1 · Kurulum öncesi hazırlık** (Y1, B6) — yapılacaklar panosu, Windows 11 "Hakkında" penceresi,
  gereksinim belgesi ve karar
- Yarım kalan çalışma sunucuya kaydedilir; başka bilgisayardan kaldığı yerden devam edilir
- Görev sonunda puan, kriterler, hatalar ve kazanım düzeyleri

**Öğretmen**
- Birden fazla öğretmen; her öğretmen yalnızca kendi sınıflarını görür, bir sınıf paylaşılabilir
- Sınıf açma, portaldan gelen sınıfa katılma
- Öğrenci ekleme (tek tek ya da Excel'den yapıştırarak toplu), kullanıcı adı/şifre üretme, yazdırılabilir giriş kartları,
  şifre sıfırlama, pasifleştirme, sınıf değiştirme, silme, portal ve şifreli hesabı **birleştirme**
- **Canlı izleme** (5 sn'de bir yenilenir), **kazanım raporu** (ısı haritası, Excel/CSV, yazdır/PDF)
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
