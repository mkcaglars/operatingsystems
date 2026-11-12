# İşletim Sistemleri Sanal Laboratuvarı — Tasarım Dokümanı

> Durum: **Taslak v0.1 — onay bekliyor.** Kod yazımına bu doküman onaylandıktan sonra başlanacaktır.
> Son bölümdeki **Açık Sorular** karara bağlanmalıdır.

---

## 1. Amaç ve Kapsam

Mesleki ve teknik eğitimde okutulan **İşletim Sistemleri** dersinin (ortak alan / dal dersi) **tüm kazanımlarını**
uygulamalı olarak kazandırmayı ve ölçmeyi amaçlayan, sunuculu, web tabanlı bir **sanal bilgisayar laboratuvarı**.

Öğrenci gerçek bir bilgisayara dokunmadan: donanımı hazırlar, bilgisayarı açar, POST ekranını yorumlar, BIOS/UEFI'ye
girip ayar yapar, kurulum medyası hazırlar, kapalı ve açık kaynak işletim sistemi kurar, yapılandırır, güvenliğini
sağlar ve arızaları giderir. Öğretmen tüm sınıfı tek panelden izler, görev atar ve kazanım bazlı rapor alır.

### Dersin modülleri
| Kod | Modül |
|---|---|
| M1 | İşletim Sistemleri Kurulumu |
| M2 | İşletim Sistemleri Gelişmiş Özellikler |
| M3 | POST |
| M4 | Açık Kaynak İşletim Sistemi Kurulum ve Yapılandırılması |

**Dersin hedefi:** Farklı işletim sistemlerinin birbirine göre avantaj/dezavantajına, kurulum gereksinimlerine ve kurulum
adımlarına, kullanımına yönelik bilgi, beceri ve yeterlilik kazandırmak.

### Kapsam dışı
- Gerçek bir işletim sistemini emüle etmek (sanal makine değil, **eğitsel simülasyon**).
- Gerçek ürünlerin arayüzlerinin birebir kopyası. Gerçek ürün adları (Windows, Pardus, Ubuntu) metinlerde geçer; ekranlar
  **özgün** tasarlanır, kavramlar ve adımlar gerçekle uyumlu tutulur.

---

## 2. Kazanımlar (kodlu liste)

Kodlar uygulamanın her yerinde (görev tanımları, puanlama, raporlar) bu şekilde kullanılır.

### Bilgi (B)
| Kod | Kazanım |
|---|---|
| B1 | Klavye ve fare özelliklerini bilir. |
| B2 | UPS'in ne işe yaradığını bilir. |
| B3 | BIOS yazılımının görevini bilir. |
| B4 | İşletim sistemi çeşitlerini bilir. |
| B5 | Açık kaynak işletim sistemlerini bilir ve tanır. |
| B6 | İşletim sistemi kurulum gereksinimlerini bilir. |
| B7 | İşletim sistemlerinin ayarlarını bilir. |
| B8 | İşletim sisteminin genel özelliklerini açıklar. |
| B9 | İşletim sisteminin genel sorunlarını açıklar. |
| B10 | İşletim sistemi donanımsal çakışmaları açıklar. |

### Beceri (S)
| Kod | Kazanım |
|---|---|
| S1 | BIOS setup giriş yapabilir. |
| S2 | BIOS ayarlarını ihtiyaca göre yapılandırabilir. |
| S3 | İşletim sistemi kurulumunu yapar. |
| S4 | İşletim sistemi kullanımını ihtiyaca göre özelleştirebilir. |
| S5 | İşletim sisteminin güvenliğini sağlayabilir. |
| S6 | İhtiyaca göre gerekli yardımcı programları yükleyebilir. |
| S7 | İşletim sisteminin genel özelliklerini gösterir. |
| S8 | İşletim sisteminin genel sorunlarını çözer. |
| S9 | İşletim sisteminin donanımsal çakışmalarını giderir. |

### Yeterlilik (Y)
| Kod | Kazanım |
|---|---|
| Y1 | Bilgisayarda kurulum öncesi hazırlıkları yapabilir. |
| Y2 | İhtiyaca göre güncel işletim sistemi veya açık kaynak işletim sistemini uygun medya aracılığı ile bilgisayara yükler. |
| Y3 | Yüklenen işletim sisteminin güvenli kullanımı için gerekli yardımcı programları yükleyerek bilgisayarı ihtiyaca göre kişiselleştirir. |
| Y4 | İşletim sisteminin genel sorunlarını doğru bir şekilde giderebilir. |

> Yeterlilikler (Y) tek bir istasyonda değil, **birden çok beceriyi birleştiren uçtan uca senaryolarla** ölçülür (bkz. §5).

---

## 3. Kazanım – İstasyon Eşleme Matrisi

● = birincil olarak kazandırılır ve ölçülür · ○ = destekler / tekrar edilir

| Kazanım | İ1 Donanım | İ2 POST-BIOS | İ3 Seçim | İ4 Kapalı K. Kurulum | İ5 Açık K. Kurulum | İ6 Ayarlar | İ7 Güvenlik | İ8 Uyg. Yazılımları | İ9 Arıza | Modül |
|---|---|---|---|---|---|---|---|---|---|---|
| B1 | ● | | | | | ○ | | | ○ | M1 |
| B2 | ● | | | | | | | | ○ | M1 |
| B3 | | ● | | | | | | | ○ | M3 |
| B4 | | | ● | | ○ | | | | | M1 |
| B5 | | | ● | | ● | | | ○ | | M4 |
| B6 | ○ | | ● | ○ | ○ | | | ○ | | M1 |
| B7 | | | | | ○ | ● | ○ | | | M2 |
| B8 | | | | | ○ | ● | | ○ | | M2 |
| B9 | | ○ | | | | | | | ● | M2 |
| B10 | | | | | | | | | ● | M2 |
| S1 | | ● | | ○ | ○ | | | | | M3 |
| S2 | | ● | | ○ | ○ | | | | ○ | M3 |
| S3 | | | | ● | ● | | | | | M1/M4 |
| S4 | | | | | ○ | ● | ○ | ○ | | M2 |
| S5 | | ○ | | | ○ | | ● | ○ | | M2 |
| S6 | | | | | ○ | | ● | ● | | M2 |
| S7 | | | | | ○ | ● | | | | M2 |
| S8 | | ○ | | | | | | | ● | M2 |
| S9 | | | | | | | | | ● | M2 |
| Y1 | ● | | ● | ○ | ○ | | | | | M1 |
| Y2 | | ○ | | ● | ● | | | | | M1/M4 |
| Y3 | | | | | ○ | ● | ● | ● | | M2 |
| Y4 | | ○ | | | | | | | ● | M2 |

**Kontrol:** 23 kazanımın her biri en az bir istasyonda birincil (●) olarak yer alıyor; açıkta kalan kazanım yok.

---

## 4. Genel Deneyim Tasarımı

### 4.1 Mekân metaforu: Sanal Laboratuvar
Ana ekran bir atölye masasıdır: kasa, monitör, klavye, fare, UPS, priz, USB bellek/DVD, kutular. Her istasyon bu
masadaki bir "iş"tir. Bilgisayarın durumu (hangi donanım takılı, BIOS ayarları, kurulu işletim sistemi, ayarlar, arızalar)
**tek bir sanal makine durumu** olarak saklanır ve istasyonlar arasında taşınır. Örneğin İ2'de önyükleme sırası yanlış
bırakılırsa İ4'te kurulum USB'den başlamaz. Bu, gerçek hayattaki neden–sonuç ilişkisini öğretir.

### 4.2 Üç mod
| Mod | Amaç | İpucu | Puan |
|---|---|---|---|
| **Öğren** | Rehberli anlatım: adım adım vurgulanan öğeler, kısa açıklama kartları, mini sorular | Sınırsız | Puanlanmaz, ilerleme kaydedilir |
| **Uygula** | Görev kartı verilir; öğrenci kendisi yapar | İstenince verilir (puandan düşer) | Puanlanır (alıştırma) |
| **Değerlendir** | Öğretmenin atadığı ölçme görevi; süre sınırı olabilir | Yok | Resmî puan, rapora girer |

### 4.3 İki oynanış biçimi
1. **Serbest istasyon:** Her istasyon bağımsız açılır; hazır bir başlangıç durumu yüklenir.
2. **Kampanya senaryosu (Yeterlilik ölçümü):** *"Okul laboratuvarına yeni gelen bilgisayarı sıfırdan kullanıma hazırla"*.
   Tek bir sanal makine üzerinde İ1 → İ9 sırayla yapılır; Y1–Y4 bu senaryoda ölçülür.

### 4.4 Görev kartı yapısı
Her görev şu alanlara sahiptir (veri dosyasında tanımlanır, kod değişmeden yeni görev eklenebilir):

```
id, istasyon, başlık, senaryo metni, kazanımlar[], başlangıç durumu,
başarı koşulları[] (durum denetleyicileri), hata koşulları[], ipuçları[], puan ağırlıkları, süre sınırı (ops.)
```

### 4.5 Geri bildirim ilkeleri
- Yanlış eylem anında engellenmez; **gerçekçi sonucu** gösterilir (ör. Secure Boot açıkken imzasız USB'den açılış hatası).
  Sonra açıklama kartı gelir.
- Her görev sonunda "Ne yaptın / Doğrusu neydi / Hangi kazanım" özeti gösterilir.
- Kalıcı riskli işlemler (disk biçimlendirme, BIOS'u kaydetmeden çıkma) gerçekte olduğu gibi onay ister.

---

## 5. İstasyonların Ayrıntılı Tasarımı

### İ1 — Donanım Masası ve Kurulum Öncesi Hazırlık  (B1, B2, B6○, Y1)

**Ekranlar:** Masa görünümü (sürükle-bırak), kasanın arka paneli (portlar), ürün kataloğu, UPS hesap aracı,
kurulum öncesi kontrol listesi.

**Öğrenme içeriği:**
- *Klavye:* Bağlantı türleri (PS/2, USB, kablosuz RF/Bluetooth); mekanik/membran; Q/F klavye düzeni; özel tuşlar
  (Fn, multimedya); ergonomik klavye.
- *Fare:* Optik/lazer, kablolu/kablosuz, DPI, tuş sayısı, ergonomi; PS/2 renk kodları (mor klavye, yeşil fare).
- *UPS:* Amacı (kesinti, dalgalanma, ani yükselme koruması; güvenli kapatma süresi). Türleri:
  Offline/Standby, Line-interactive, Online (çift dönüşüm). Avantaj/dezavantajları. VA–Watt ilişkisi (güç faktörü),
  akü süresi, prize/UPS'e bağlanacak cihaz ayrımı (yazıcı gibi yüksek ani akım çeken cihazların UPS'e bağlanmaması).
- *Kurulum öncesi hazırlık:* Veri yedekleme, donanım bilgisinin çıkarılması (işlemci, RAM, disk, ekran kartı),
  sürücülerin önceden temin edilmesi, lisans/ürün anahtarı, uygun medya, güç güvencesi, dizüstünde şarj.

**Görevler (örnek):**
| ID | Görev | Kazanım | Başarı koşulu |
|---|---|---|---|
| İ1-G1 | Grafik tasarım öğrencisi için uygun fare ve klavyeyi katalogdan seç, gerekçesini işaretle | B1 | DPI ≥ eşik, ergonomi seçimi, gerekçe doğru |
| İ1-G2 | Çevre birimlerini kasanın arka panelinde doğru portlara bağla | B1 | Tüm cihazlar doğru porta takılı |
| İ1-G3 | 450 W bilgisayar + 40 W monitör için uygun UPS gücünü (VA) hesapla ve türünü seç | B2 | Hesap ±%10 doğru, tür senaryoya uygun |
| İ1-G4 | Elektrik kesintisi senaryosu: UPS'siz/UPS'li sonucu gözlemle, güvenli kapatmayı yap | B2 | Akü süresi dolmadan güvenli kapatma |
| İ1-G5 | Kurulum öncesi kontrol listesini doldur (yedek, donanım bilgisi, sürücü, lisans, medya) | Y1, B6 | Zorunlu maddelerin tamamı, yanlış madde yok |

---

### İ2 — POST ve BIOS/UEFI  (B3, S1, S2, B9○, S8○)

**Ekranlar:** Açılış ekranı (logo + "Setup için DEL'e basın"), POST metin ekranı, bip sesi oynatıcı (ses + görsel
gösterim: ▬ uzun, • kısa), BIOS Setup (klasik mavi-gri metin arayüzü) ve UEFI (grafik arayüz) — iki tür de bulunur.

**Öğrenme içeriği:**
- BIOS/UEFI'nin görevi: donanımı tanıma ve sınama (POST), önyükleyiciyi bulma ve başlatma, temel ayarların
  CMOS/NVRAM'de saklanması, CMOS pili.
- POST: aşamaları, başarılı açılış, **bip kodları** (üreticiye göre değişir; simülasyonda AMI ve Award örnek tabloları)
  ve ekrandaki hata mesajları (ör. "CMOS Checksum Error", "Keyboard error", "No bootable device").
- Setup'a giriş tuşları (Del, F2, F10, Esc), önyükleme menüsü (F8/F11/F12). **Zamanlama** gerçekçidir: tuşa logo
  ekranındaki kısa süre içinde basılmalıdır.
- Legacy BIOS – UEFI farkı; MBR – GPT ilişkisi; CSM.

**BIOS ayarları (simülasyonda yapılandırılabilir):**
Tarih/saat · önyükleme sırası · SATA modu (AHCI/IDE/RAID) · Secure Boot · CSM/Legacy · TPM · sanallaştırma (VT-x/AMD-V) ·
yönetici/kullanıcı parolası · tümleşik aygıtlar (ses, ağ, USB) aç/kapa · fan/sıcaklık izleme · varsayılanlara dönme ·
**Kaydet ve Çık / Kaydetmeden Çık**.

**Görevler (örnek):**
| ID | Görev | Kazanım | Başarı koşulu |
|---|---|---|---|
| İ2-G1 | BIOS'un görevleriyle ilgili eşleştirme (açılış zinciri sıralama) | B3 | Doğru sıra |
| İ2-G2 | Bilgisayarı aç ve Setup'a gir | S1 | Doğru tuşa süre içinde basıldı |
| İ2-G3 | USB'den kurulum için önyükleme sırasını ayarla, kaydet ve çık | S2 | 1. sıra USB, ayarlar kaydedildi |
| İ2-G4 | Sanal makine yazılımı kullanılacak: sanallaştırmayı aç | S2 | VT-x açık |
| İ2-G5 | Laboratuvar güvenliği: BIOS yönetici parolası koy, USB'den açılışı kapat | S2, S5 | Parola var, ilgili ayar kapalı |
| İ2-G6 | Bip kodu teşhisi: 3 farklı bip dizisini dinle, arızalı bileşeni bul | B3, B9, S8 | Doğru bileşen |
| İ2-G7 | Saat her açılışta sıfırlanıyor — sebebini bul (CMOS pili) | B9, S8 | Doğru teşhis + çözüm |

---

### İ3 — İşletim Sistemi Seçimi ve Gereksinimler  (B4, B5, B6, Y1)

**Ekranlar:** İşletim sistemi kartları (masaüstü, sunucu, mobil, gömülü), karşılaştırma tablosu, "sistem bilgisi"
ekranı (verilen bilgisayarın donanımı), gereksinim denetleyicisi.

**Öğrenme içeriği:**
- İşletim sistemi çeşitleri: kullanım alanına göre (masaüstü, sunucu, mobil, gömülü/gerçek zamanlı), lisansa göre
  (kapalı/açık kaynak, ücretli/ücretsiz), kullanıcı ve görev sayısına göre.
- Örnekler: Windows, macOS, Pardus, Ubuntu ve diğer Linux dağıtımları, Android, iOS, Windows Server.
- Açık kaynak kavramı, GPL, dağıtım (distro) kavramı, Pardus'un yerli bir dağıtım olması.
- **Karşılaştırma ölçütleri:** maliyet/lisans, donanım gereksinimi, yazılım ve sürücü desteği, güvenlik, özelleştirme,
  destek ve topluluk, kullanım kolaylığı. *(Dersin hedefindeki "avantaj/dezavantaj" kazanımı burada ölçülür.)*
- Kurulum gereksinimleri: işlemci (mimari 32/64 bit, hız, çekirdek), RAM, disk alanı, ekran, TPM/UEFI/Secure Boot
  (güncel Windows için). Değerler bir **veri dosyasında** tutulur; resmî kaynaklardan doğrulanıp güncellenebilir.

**Görevler (örnek):**
| ID | Görev | Kazanım | Başarı koşulu |
|---|---|---|---|
| İ3-G1 | İşletim sistemlerini türlerine göre sınıflandır (sürükle-bırak) | B4 | Tümü doğru |
| İ3-G2 | Açık kaynak olanları seç, açık kaynağın 3 özelliğini işaretle | B5 | Doğru |
| İ3-G3 | 3 farklı bilgisayarın sistem bilgisini incele; hangisine hangi işletim sistemi kurulabilir? | B6, Y1 | Uyumluluk kararları doğru |
| İ3-G4 | Senaryo: düşük bütçeli okul laboratuvarı / tasarım ofisi / sunucu — en uygun işletim sistemini seç ve 2 avantaj, 1 dezavantaj belirt | B4, B5 | Seçim + gerekçeler uygun |

---

### İ4 — Kurulum Medyası ve Kapalı Kaynak Kurulum  (S3, Y2, S1○, S2○, B6○)

**Ekranlar:** Medya hazırlama aracı (ISO seçimi, hedef USB, bölüm şeması MBR/GPT, hedef sistem BIOS/UEFI, dosya sistemi),
DVD yazdırma, kurulum sihirbazı (özgün tasarım, Windows kurulum akışıyla uyumlu adımlar), disk bölümleme ekranı, ilk
açılış (OOBE) ekranları.

**Kurulum akışı (simülasyon):**
1. Medya hazırlama: ISO → USB (GPT + UEFI veya MBR + BIOS seçimi; yanlış eşleşme açılışta sorun doğurur).
2. Önyükleme menüsünden veya BIOS'tan medya ile açılış.
3. Dil, saat ve klavye (Türkçe Q).
4. Ürün anahtarı / lisans sözleşmesi.
5. Kurulum türü: **Yükseltme** veya **Özel (temiz kurulum)**.
6. Disk bölümleme: bölüm oluşturma/silme/biçimlendirme; sistemin otomatik oluşturduğu EFI, MSR, kurtarma bölümleri;
   NTFS; birden fazla disk ve veri bölümünü koruma senaryosu.
7. Kopyalama ve yeniden başlatma (hızlandırılmış ilerleme; ara sorular gösterilebilir).
8. İlk açılış: bölge, klavye, ağ, kullanıcı hesabı (yerel/çevrimiçi), parola ve güvenlik soruları, gizlilik ayarları.
9. Kurulum sonrası: sürücü durumu kontrolü (İ6/İ7'ye bağlanır).

**Görevler (örnek):**
| ID | Görev | Kazanım | Başarı koşulu |
|---|---|---|---|
| İ4-G1 | UEFI destekli bilgisayar için önyüklenebilir USB hazırla | Y2 | GPT + UEFI, doğru ISO |
| İ4-G2 | DVD sürücüsü olmayan, eski BIOS'lu bilgisayar için uygun medyayı hazırla | Y2 | MBR + BIOS USB |
| İ4-G3 | Boş diske temiz kurulum yap | S3 | Kurulum tamamlandı, açılıyor |
| İ4-G4 | D: sürücüsündeki verileri koruyarak yalnızca C:'ye yeniden kurulum yap | S3, Y1 | Veri bölümü silinmedi |
| İ4-G5 | İlk açılışta yerel yönetici hesabı + standart öğrenci hesabı oluştur | S3, S5 | Hesaplar doğru türde |

---

### İ5 — Açık Kaynak İşletim Sistemi Kurulum ve Yapılandırma  (B5, S3, Y2, + M4 bütünü)

**Ekranlar:** Canlı (live) masaüstü, kurulum sihirbazı (Pardus/Ubuntu akışıyla uyumlu, özgün tasarım), gelişmiş
bölümleme, **sanal terminal**, paket yöneticisi (grafik + komut satırı), ayarlar.

**Öğrenme içeriği:**
- Canlı sistemle deneme ve kurulum farkı.
- Bölümleme: `/boot/efi` (FAT32), `/` (ext4), `swap`, `/home`; çift önyükleme (dual boot) ve GRUB.
- Kullanıcı ve `sudo` kavramı; dosya sistemi hiyerarşisi (`/etc`, `/home`, `/usr`, `/var`).
- Paket yönetimi: depo, `apt update`, `apt install`, `apt remove`, grafik uygulama mağazası.
- **Sanal terminal** (gerçek kabuk değildir; komut alt kümesi simüle edilir):
  `ls, cd, pwd, mkdir, cp, mv, rm, cat, nano (basit), sudo, apt, df -h, free -h, uname -a, lsblk, lspci, lsusb,
  ip a, ping, systemctl status, passwd, adduser, chmod, chown, whoami, history, man (özet)`.

**Görevler (örnek):**
| ID | Görev | Kazanım | Başarı koşulu |
|---|---|---|---|
| İ5-G1 | Canlı oturumda donanımın tanındığını kontrol et (`lsblk`, `lspci`) | B5, Y1 | Doğru komutlar |
| İ5-G2 | Ayrı `/home` bölümüyle kurulum yap | S3, Y2 | Bölümler doğru |
| İ5-G3 | Mevcut Windows'u silmeden çift önyüklemeli kurulum yap | S3, Y2 | Windows bölümü korunmuş, GRUB'da iki giriş |
| İ5-G4 | Sistemi güncelle, ofis ve tarayıcı paketlerini kur | S6, Y3 | Paketler kurulu |
| İ5-G5 | Yeni kullanıcı ekle, sudo yetkisi verme/verme kararını uygula | S5, B7 | Yetkiler doğru |

---

### İ6 — Ayarlar, Genel Özellikler ve Kişiselleştirme  (B7, B8, S4, S7, Y3)

**Ekranlar:** Sanal masaüstü (görev çubuğu, başlat menüsü, pencereler), Denetim Masası / Ayarlar, Dosya Gezgini,
Görev Yöneticisi, Aygıt Yöneticisi (yalnızca görüntüleme; arıza kısmı İ9'da), Sistem Bilgisi.

**Öğrenme içeriği:**
- *Genel özellikler (B8, S7):* çok görevlilik, çok kullanıcılılık, dosya ve klasör yönetimi, bellek ve işlem yönetimi
  (Görev Yöneticisi'nde süreçler, CPU/RAM kullanımı), aygıt yönetimi, kullanıcı arayüzü, sürücü kavramı.
- *Ayarlar (B7, S4):* görüntü (çözünürlük, ölçek, çoklu ekran), kişiselleştirme (arka plan, tema, görev çubuğu),
  bölge/dil/klavye, tarih/saat, güç seçenekleri, fare ve klavye ayarları (B1 ile bağ), varsayılan uygulamalar,
  başlangıç uygulamaları, erişilebilirlik, ses, yazıcı ekleme, ağ ayarları, kullanıcı hesapları.

**Görevler (örnek):**
| ID | Görev | Kazanım | Başarı koşulu |
|---|---|---|---|
| İ6-G1 | Görev Yöneticisi'nde en çok bellek kullanan işlemi bul ve sonlandır | S7, B8 | Doğru işlem |
| İ6-G2 | Sistem Bilgisi'nden işlemci, RAM ve işletim sistemi sürümünü raporla | S7 | Değerler doğru |
| İ6-G3 | Az gören bir kullanıcı için ölçeklendirme, imleç ve kontrast ayarlarını yap | S4, B7 | Ayarlar senaryoya uygun |
| İ6-G4 | Solak kullanıcı için fare tuşlarını değiştir, çift tıklama hızını ayarla | S4, B1 | Ayarlar doğru |
| İ6-G5 | Laboratuvar bilgisayarı: ekran 10 dk'da kapansın, uyku kapalı olsun, gereksiz başlangıç uygulamaları kapatılsın | S4, B7 | Tüm koşullar sağlandı |
| İ6-G6 | Klasör yapısı oluştur, dosya uzantılarını göster, gizli dosyaları göster | S7, B8 | Doğru |

---

### İ7 — Sürücüler, Güvenlik ve Yardımcı Programlar  (S5, S6, Y3, B7○)

**Ekranlar:** Güvenlik merkezi (antivirüs, güvenlik duvarı, güncelleme), kullanıcı hesapları, yazılım yükleme sihirbazı
(Next-Next tuzakları dahil), sürücü yükleme, yedekleme ve geri yükleme noktası.

**Öğrenme içeriği:**
- *Güvenlik (S5):* güncellemeler, antivirüs/kötü amaçlı yazılım koruması, güvenlik duvarı, standart/yönetici hesap ayrımı,
  güçlü parola ve kilit ekranı, kullanıcı hesabı denetimi (UAC), disk şifreleme kavramı, yedekleme ve geri yükleme
  noktası, güvenilir kaynaktan yazılım indirme.
- *Yardımcı programlar (S6):* sürücüler (yonga seti, ekran, ses, ağ), sıkıştırma, PDF okuyucu, tarayıcı, ofis yazılımı,
  medya oynatıcı; lisans türleri (ücretsiz, deneme, açık kaynak); kurulum sırasında istenmeyen ek yazılım tuzakları.

**Görevler (örnek):**
| ID | Görev | Kazanım | Başarı koşulu |
|---|---|---|---|
| İ7-G1 | Yeni kurulan sistemde eksik sürücüleri doğru sırayla yükle (önce yonga seti) | S6 | Tüm aygıtlar çalışıyor |
| İ7-G2 | Güvenlik merkezindeki tüm uyarıları gider | S5 | Durum "korunuyor" |
| İ7-G3 | Öğrenci hesabını standart hesap yap, yazılım kurma yetkisini kaldır | S5 | Doğru |
| İ7-G4 | Sıkıştırma ve PDF okuyucu gibi yardımcı programları kur; kurulumdaki istenmeyen ek yazılımları reddet (uygulama yazılımlarının ayrıntısı İ8'de) | S6, Y3 | Doğru küme, tuzak yok |
| İ7-G5 | Büyük değişiklikten önce geri yükleme noktası oluştur | S5 | Nokta oluşturuldu |

---

### İ8 — Uygulama Yazılımlarının Kurulumu  (S6, Y3, S4○, S5○, B5○, B6○, B8○)

İşletim sistemi kurulduktan sonra bilgisayarın kullanıma hazır olması için gereken programların (Microsoft Office,
Google Chrome vb.) **doğru kaynaktan, doğru sürümle, lisansa uygun şekilde** kurulması, yapılandırılması, onarılması ve
kaldırılması.

**Ekranlar:** Sanal web tarayıcı (arama sonuçları, resmî siteler, **sahte indirme siteleri ve reklam bağlantıları**),
İndirilenler klasörü, kurulum sihirbazları (.exe/.msi), Office kurulum ve etkinleştirme ekranları, Ayarlar → Uygulamalar
(kaldır/değiştir/onar), varsayılan uygulamalar, Pardus Yazılım Merkezi ve terminal (`apt`).

**Yazılım kataloğu** (veri dosyasında tutulur; öğretmen yeni yazılım ekleyebilir):
| Kategori | Windows | Pardus / Linux | Öğretilen nokta |
|---|---|---|---|
| Ofis | **Microsoft Office** (Microsoft 365 / Office) | LibreOffice (hazır gelir); MS Office Linux'a doğrudan kurulamaz → web sürümü veya LibreOffice | Lisans ve etkinleştirme, bileşen seçimi, platform uyumu, dosya biçimi uyumu (.docx/.odt) |
| Web tarayıcı | **Google Chrome**, Mozilla Firefox (Edge hazır gelir) | Firefox (hazır), Chrome (.deb paketi) | Resmî kaynaktan indirme, varsayılan tarayıcı yapma |
| Sıkıştırma | 7-Zip, WinRAR | Arşiv yöneticisi (hazır) | Açık kaynak ve deneme sürümü farkı |
| PDF | Adobe Acrobat Reader | Belge görüntüleyici (hazır) | Kurulumdaki ek yazılım teklifleri |
| Medya | VLC | VLC (`apt`) | Codec kavramı |
| Alan yazılımları (opsiyonel) | Visual Studio Code, Python vb. | Aynı | Bilişim alanına özgü ihtiyaçlar |

**Kurulum akışı — Windows:**
1. **İndirme:** Sanal tarayıcıda resmî siteyi bulmak; reklam ve sahte "İndir" düğmelerini, benzer alan adlarını ayırt etmek
   (adres çubuğu, https, resmî alan adı).
2. **Doğru sürüm:** 32/64 bit, işletim sistemi uyumu, Türkçe dil seçimi (B6 ile bağ).
3. **Çalıştırma:** .exe/.msi dosyası, yayımcı bilgisi, kullanıcı hesabı denetimi (UAC) ve yönetici izni (İ7'deki standart
   hesap ayarı burada sonuç doğurur).
4. **Sihirbaz:** lisans sözleşmesi, kurulum türü (Hızlı/Özel), hedef klasör, bileşen seçimi, masaüstü kısayolu,
   **istenmeyen ek yazılım/araç çubuğu tuzakları**, varsayılan uygulama yapma.
5. **Microsoft Office'e özel:** hesapla giriş veya ürün anahtarı ile **etkinleştirme**; bileşen seçimi (ör. yalnızca Word,
   Excel, PowerPoint); dil; etkinleştirme durumunun kontrolü (Dosya → Hesap); kurumsal/okul hesabı senaryosu.
   **Lisanssız (kırılmış) yazılım** seçeneği simülasyonda kötü amaçlı yazılım bulaştırır ve İ9'da arıza olarak geri döner;
   hukuki ve güvenlik riskleri açıklanır.
6. **Doğrulama:** Başlat menüsünde görünme, çalıştırma, sürüm bilgisi, otomatik güncellemenin açık olması.
7. **Bakım:** Ayarlar → Uygulamalar'dan kaldırma; Office **onarma** (hızlı/çevrimiçi onarım).
8. **İleri düzey (opsiyonel):** Laboratuvar için komut satırından toplu kurulum (`winget install Google.Chrome` vb.).

**Kurulum akışı — Pardus/Linux:** Yazılım Merkezi'nden kurulum; `sudo apt update && sudo apt install vlc`;
Chrome için `.deb` dosyasını indirip paket kurucu ile veya `sudo apt install ./google-chrome-stable_current_amd64.deb`
ile kurma; Office yerine LibreOffice ile .docx açıp düzenleme ve kaydetme.

**Görevler (örnek):**
| ID | Görev | Kazanım | Başarı koşulu |
|---|---|---|---|
| İ8-G1 | Google Chrome'u resmî sitesinden indir, kur ve varsayılan tarayıcı yap | S6, S5, S4 | Resmî kaynak, sahte bağlantıya tıklanmadı, varsayılan Chrome |
| İ8-G2 | Microsoft Office'i Türkçe kur; yalnızca Word, Excel, PowerPoint olsun; etkinleştir | S6, Y3 | Bileşenler doğru, ürün etkin |
| İ8-G3 | Senaryoya göre yazılım paketini seç ve kur (okul laboratuvarı / muhasebe ofisi / grafik atölyesi) | S6, Y3 | Gerekli küme eksiksiz, gereksiz/zararlı yazılım yok |
| İ8-G4 | Kurulum sihirbazlarındaki ek yazılım tekliflerini reddederek PDF okuyucu ve sıkıştırma programı kur | S6, S5 | Ek yazılım kurulmadı |
| İ8-G5 | 32 bit sisteme 64 bit yazılım kurma girişiminde çıkan hatayı yorumla, doğru sürümü kur | B6, S6 | Doğru sürüm kurulu |
| İ8-G6 | Çalışmayan Office'i onar; kullanılmayan bir programı kaldır | S6, B8 | Onarım + kaldırma yapıldı |
| İ8-G7 | Pardus'ta VLC'yi `apt` ile, Chrome'u `.deb` ile kur; LibreOffice ile .docx dosyasını düzenle | S6, B5 | Paketler kurulu, dosya kaydedildi |
| İ8-G8 (ileri) | 5 programı `winget` ile tek seferde kur | S6 | Tümü kurulu |

**Puanlama notu:** Güvenilmeyen kaynaktan indirme, lisanssız yazılım veya istenmeyen ek yazılım kurulması süreç
puanından düşer ve sanal makinede kalıcı sonuç doğurur (yavaşlama, reklam pencereleri, kötü amaçlı yazılım).

---

### İ9 — Arıza Giderme ve Donanımsal Çakışmalar  (B9, B10, S8, S9, Y4)

**Ekranlar:** Arıza bildirim formu ("kullanıcı şikâyeti"), sanal makine (tüm araçlar erişilebilir: BIOS, Aygıt Yöneticisi,
Görev Yöneticisi, olay günlüğü, güvenli mod, kurtarma ortamı, terminal), teşhis defteri (öğrenci hipotezlerini yazar).

**Öğrenme içeriği:**
- *Genel sorunlar (B9, S8):* açılmama/önyükleme hataları, yavaşlık, donma, mavi ekran (durdurma hatası), sürücü
  uyumsuzluğu, disk dolması, kötü amaçlı yazılım belirtileri, ağ bağlantısı yok, ses yok, çözünürlük hatası, saat sorunu.
- *Donanımsal çakışmalar (B10, S9):* Tak-Çalıştır, sistem kaynakları (IRQ, G/Ç adresi, bellek aralığı, DMA),
  aygıt yöneticisi durum kodları (ör. Kod 10 "aygıt başlatılamıyor", Kod 12 "yeterli boş kaynak yok", Kod 28 "sürücü
  yüklü değil", Kod 43), aynı işi yapan iki aygıt (tümleşik + harici ekran/ses kartı), uyumsuz sürücü.
- *Arıza giderme yöntemi:* belirtiyi tanımla → son değişikliği sor → hipotez kur → test et → çöz → doğrula → kaydet.
- Araçlar: güvenli mod, sürücüyü geri alma/kaldırma, sistem geri yükleme, başlangıç onarımı, BIOS'tan aygıt kapatma,
  Linux'ta `dmesg`, `lspci`, `journalctl` özeti.

**Arıza senaryo havuzu (rastgele ve öğretmen tarafından atanabilir):**
| ID | Belirti | Kök neden | Beklenen çözüm | Kazanım |
|---|---|---|---|---|
| A1 | "No bootable device" | Önyükleme sırası / disk SATA kablosu | BIOS'ta sıralama veya kablo | S8, S2 |
| A2 | Açılışta bip sesi, görüntü yok | RAM yerinden çıkmış | RAM'i tak | B9, S8 |
| A3 | Ekran kartı takıldıktan sonra görüntü bozuk | Tümleşik ve harici ekran kartı çakışması | Tümleşik kartı BIOS'ta kapat, sürücüyü kur | B10, S9 |
| A4 | Ses kartı çalışmıyor, sarı ünlem (Kod 12) | Kaynak çakışması | Çakışan aygıtı devre dışı bırak / kaynakları yeniden ata | B10, S9 |
| A5 | Sürücü güncellemesinden sonra mavi ekran | Uyumsuz sürücü | Güvenli mod → sürücüyü geri al | S8, S9 |
| A6 | Bilgisayar çok yavaş | Başlangıç uygulamaları / disk dolu / kötü amaçlı yazılım | Görev Yöneticisi + temizlik + tarama | B9, S8 |
| A7 | İnternet yok | Ağ sürücüsü yok / kablo / IP ayarı | Teşhis + çözüm | S8 |
| A8 | Linux kurulumundan sonra Windows açılmıyor | GRUB/önyükleyici | GRUB yapılandırması / UEFI sıralaması | S8, Y4 |
| A9 | Saat sürekli geri gidiyor | CMOS pili | Pili değiştir | B9 |
| A10 | Elektrik kesintisinde veri kaybı | UPS yok / yanlış bağlantı | UPS + güvenli kapatma | B2, Y4 |
| A11 | Tarayıcıda sürekli reklam açılıyor, ana sayfa değişmiş | İstenmeyen ek yazılım / sahte siteden indirilen program (İ8) | Programı kaldır, tarayıcıyı sıfırla, tarama yap | S8, Y4 |
| A12 | Office "Etkinleştirilmemiş ürün" uyarısı veriyor, belgeler düzenlenemiyor | Lisans/etkinleştirme sorunu | Hesapla etkinleştir veya geçerli anahtar gir | S8 |
| A13 | Word açılırken çöküyor | Bozuk kurulum | Office onarımı | S8 |

**Puanlama (İ9'a özel):** doğru teşhis + doğru çözüm + **gereksiz/zararlı işlem yapmama** (ör. sorunu çözmek için
işletim sistemini yeniden kurmak düşük puan) + süre.

---

### Yeterlilik Senaryoları (Y1–Y4) — Kampanya
| Senaryo | Kapsadığı istasyonlar | Ölçülen |
|---|---|---|
| **K1 "Laboratuvara yeni bilgisayar"**: kutudan çıkar, bağla, BIOS'u ayarla, uygun işletim sistemini seç, medyayı hazırla, kur, sürücüleri ve güvenliği tamamla, Office ve Chrome gibi gerekli programları kur, kişiselleştir | İ1→İ8 | Y1, Y2, Y3 |
| **K2 "Pardus'a geçiş"**: verileri koruyarak çift önyüklemeli açık kaynak kurulum ve yapılandırma | İ1, İ2, İ3, İ5, İ7, İ8 | Y1, Y2, Y3 |
| **K3 "Servis masası"**: art arda 3 rastgele arıza bileti | İ9 (+ İ2, İ6) | Y4 |

---

## 6. Ölçme ve Değerlendirme Modeli

- **Kanıt:** Öğrencinin tüm eylemleri zaman damgalı **olay günlüğü** olarak kaydedilir (ör. `bios.set bootOrder=[usb,ssd]`).
  Puan, görevin **başarı koşullarının** son durum ve olay günlüğü üzerinde denetlenmesiyle hesaplanır.
- **Görev puanı (0–100):** başarı koşulları (%70) + süreç kalitesi (%20: gereksiz/zararlı işlem yok, doğru sıra) +
  süre (%10). İpucu başına kesinti (Uygula modunda). Ağırlıklar görev bazında değiştirilebilir.
- **Kazanım düzeyi:** Her kazanım için, o kazanımı içeren görevlerin ağırlıklı ortalaması →
  *Başlamadı / Gelişiyor (<50) / Yeterli (50–84) / Ustalaştı (≥85)*. (Eşikler öğretmen ayarıdır.)
- **Bilgi kazanımları (B):** Görev içine gömülü kısa sorular (eşleştirme, sıralama, sürükle-bırak, çoktan seçmeli) ile de
  ölçülür; soru bankası istasyon bazlıdır.
- **Hile/güvenilirlik:** Puan sunucuda, olay günlüğünün yeniden oynatılmasıyla hesaplanır (istemcinin gönderdiği puana
  güvenilmez). Değerlendirme modunda soru/görev varyantları rastgele seçilir.

---

## 7. Öğretmen Paneli

| Özellik | Açıklama |
|---|---|
| Sınıf yönetimi | Sınıf/şube oluşturma; **sınıf kodu** ile öğrenci katılımı veya liste içe aktarma (CSV) |
| Öğrenci girişi | Sınıf kodu + öğrenci no + öğretmenin belirlediği/ürettiği basit parola (bkz. Açık Sorular) |
| Görev atama | İstasyon/görev/kampanya seçimi, mod (Uygula/Değerlendir), başlangıç–bitiş tarihi, süre sınırı |
| **Canlı izleme** | Sınıf ızgarası: her öğrencinin o anki istasyonu, ilerlemesi, takıldığı adım, ipucu kullanımı |
| Arıza gönderme | Ders sırasında seçili öğrencilere İ9 arıza senaryosu gönderme |
| Raporlar | Kazanım × öğrenci ısı haritası; öğrenci karnesi; görev bazlı başarı; sık yapılan hatalar |
| Dışa aktarma | PDF (karne), CSV/Excel (not listesi) |
| Tekrar izleme | Öğrencinin bir görevdeki eylem günlüğünü adım adım izleme |
| İçerik | Görevleri etkinleştirme/gizleme; eşikleri ayarlama |

Roller: **Yönetici** (okul; öğretmen hesapları), **Öğretmen**, **Öğrenci**.

---

## 8. Teknik Mimari (öneri)

```
┌────────────── Tarayıcı (öğrenci / öğretmen) ───────────────┐
│ React + TypeScript (Vite)                                   │
│  ├─ Simülasyon çekirdeği: saf TS durum makinesi (VM durumu) │
│  ├─ İstasyon arayüzleri (İ1–İ9), sanal masaüstü, terminal   │
│  └─ Öğretmen paneli                                         │
└──────────────▲───────────────────────────────▲──────────────┘
          REST │ (JSON)              WebSocket │ (canlı izleme, arıza gönderme)
┌──────────────┴───────────────────────────────┴──────────────┐
│ Node.js + Fastify (TypeScript)                              │
│  ├─ Kimlik doğrulama (oturum çerezi), roller                │
│  ├─ Değerlendirme motoru (paylaşılan simülasyon çekirdeğiyle│
│  │   olay günlüğünü yeniden oynatır, puanlar)               │
│  └─ Rapor üretimi (PDF/CSV)                                 │
│ Veritabanı: SQLite (varsayılan) / PostgreSQL (seçenek)      │
└─────────────────────────────────────────────────────────────┘
```

- **Paylaşılan çekirdek (`packages/core`)**: Simülasyon durumu ve görev denetleyicileri hem istemcide (anlık geri bildirim)
  hem sunucuda (resmî puan) **aynı kodla** çalışır.
- **İçerik veri dosyalarıyla (JSON/YAML)**: görevler, sorular, arıza senaryoları, işletim sistemi gereksinim tabloları,
  bip kodu tabloları. Yeni görev eklemek kod gerektirmez.
- **Kurulum:** Tek Docker imajı **veya** tek komutla (`npm start`) çalışan Node uygulaması. Okul içi ağda (LAN) öğretmen
  bilgisayarı veya okul sunucusunda **internetsiz** çalışabilir; isteğe bağlı bulut kurulumu.
- **Depo yapısı (monorepo):** `apps/web`, `apps/server`, `packages/core`, `content/`, `docs/`.
- **Test:** Çekirdek ve denetleyiciler için birim testleri (Vitest); kritik akışlar için Playwright uçtan uca testleri.

### 8.1 Veri modeli (özet)
| Tablo | Alanlar |
|---|---|
| users | id, rol, ad, kullanıcı adı/öğrenci no, parola özeti |
| classes | id, ad, öğretmen_id, katılım kodu |
| enrollments | class_id, student_id |
| assignments | id, class_id, görev/kampanya, mod, başlangıç, bitiş, süre |
| attempts | id, assignment_id, student_id, başlangıç, bitiş, durum, puan |
| events | attempt_id, sıra, zaman, tür, veri (JSON) |
| outcome_scores | student_id, kazanım_kodu, puan, düzey, güncelleme |

### 8.2 Gizlilik (KVKK)
- Asgari kişisel veri: ad-soyad ve öğrenci no; T.C. kimlik no **tutulmaz**.
- Veri okulun kendi sunucusunda kalır (yerel kurulumda dışarı veri gönderilmez).
- Öğretmen, sınıf/öğrenci verisini silebilir; dönem sonu toplu silme/arşivleme.

### 8.3 Arayüz ilkeleri
- Tamamen **Türkçe**; terimlerin ilk geçtiği yerde İngilizce karşılığı (POST, Boot, Secure Boot).
- Akıllı tahta ve dokunmatik uyumu (büyük hedefler, sürükle-bırak dokunmatikte de çalışır); en az 1366×768.
- Klavye ile kullanılabilirlik ve yeterli renk kontrastı; sesli öğeler (bip) için görsel karşılık.
- Laboratuvar bilgisayarları için hafif: modern tarayıcıda çalışır, eklenti gerektirmez.

---

## 9. Yol Haritası (önerilen fazlar)

| Faz | İçerik | Çıktı |
|---|---|---|
| F0 | Bu dokümanın onayı, açık soruların kapatılması | Onaylı tasarım |
| F1 | Monorepo, kimlik doğrulama, sınıf/öğrenci yönetimi, simülasyon çekirdeği, görev motoru, olay günlüğü | Çalışan iskelet |
| F2 | İ1 Donanım + İ2 POST/BIOS + temel öğretmen raporu | İlk deneme sürümü (pilot) |
| F3 | İ3 Seçim + İ4 Kapalı kaynak kurulum + İ5 Açık kaynak kurulum (terminal) | Kurulum modülleri |
| F4 | İ6 Ayarlar + İ7 Sürücü & Güvenlik + İ8 Uygulama Yazılımları + sanal masaüstü | Gelişmiş özellikler |
| F5 | İ9 Arıza + kampanyalar (Y1–Y4) + canlı izleme + PDF/CSV raporlar | Tam kapsam |
| F6 | Pilot uygulama geri bildirimi, içerik zenginleştirme, kurulum paketi (Docker) | Sürüm 1.0 |

Her faz sonunda öğretmen değerlendirmesi yapılır; içerik ve görevler bu geri bildirime göre düzeltilir.

---

## 10. Açık Sorular (karar gerekli)

1. **Sunucu nerede çalışacak?** Okul içi (öğretmen PC / okul sunucusu, internetsiz) mi, bulutta tek merkez (birden çok
   okul) mi, yoksa ikisi de mi desteklenmeli?
2. **Öğrenci girişi:** Sınıf kodu + öğrenci no + öğretmenin ürettiği parola mı, yoksa her öğrencinin kendi parolası mı?
   (MEB/e-Okul entegrasyonu kapsam dışı varsayıldı.)
3. **Hedef sınıf düzeyi ve ders saati:** Görev sayısı ve süreleri buna göre ölçeklenecek (ör. 10. sınıf, haftalık X saat).
4. **Windows sürümü:** Kapalı kaynak kurulum güncel Windows (11) akışıyla mı modellensin, yoksa okullarda yaygın olan
   10 da seçenek olarak bulunsun mu?
5. **Açık kaynak:** Birincil dağıtım **Pardus** (yerli, MEB okullarında yaygın) mı olsun? Ubuntu ikincil mi?
6. **Sunucu işletim sistemleri** (Windows Server / Linux sunucu) kapsam dışı mı? (Görsellerdeki kazanımlarda yok.)
7. **Ses:** Bip kodları ve ortam sesleri için hoparlör/kulaklık varsayılabilir mi? (Her durumda görsel karşılık olacak.)
8. **Görsel stil:** Gerçekçi (fotoğrafa yakın çizimler) mi, sade-şematik (vektör, düz renk) mi? Öneri: sade-şematik
   (hafif, akıllı tahtada net, üretimi hızlı).
9. **Kurulacak programlar listesi:** İ8 kataloğunda Microsoft Office, Google Chrome, Firefox, 7-Zip, WinRAR,
   Acrobat Reader, VLC var. Eklenmesini istediğiniz başka program var mı (ör. EBA'ya özgü araçlar, Zoom, Scratch, Python,
   Visual Studio Code, Packet Tracer)?
10. **Office lisans senaryosu:** Etkinleştirme okul/kurumsal Microsoft 365 hesabıyla mı, ürün anahtarıyla mı, yoksa
    ikisi de mi gösterilsin?
11. **Ürün logoları:** Gerçek adlar kullanılacak. Logolar yerine özgün, benzer renkte simgeler kullanılması öneriliyor
    (marka/telif riski olmaması için). Uygun mu?
