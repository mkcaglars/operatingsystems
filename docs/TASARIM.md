# İşletim Sistemleri Sanal Laboratuvarı — Tasarım Dokümanı

> Durum: **v0.5 — onaylandı.** F1 (iskelet), F2 (İ1–İ2), F3 (İ3–İ5), F4 (İ6 Ayarlar, İ7 Sürücü ve Güvenlik, İ8 Uygulama yazılımları) ve F5 (İ9 Arıza giderme, kampanyalar K1–K4, servis biletleri, deneme ayrıntısı) tamamlandı; sıradaki faz F6 (pilot uygulama).
> Yayın adresi: **https://isistem.mkcaglar.com** (Hostinger). Hedef: **9. sınıf Bilişim Teknolojileri**.
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
- Sunucu işletim sistemleri (Windows Server, Linux sunucu) — kazanımlarda yer almadığı için kapsam dışıdır.

### Görsel ve içerik ilkeleri (kararlaştırıldı)
- **Tamamen gerçekçi görsel stil:** Donanım ve ortam görselleri **projeye özel yapay zekâ ile üretilir**
  (liste ve promptlar: `docs/GORSEL_PROMPTLARI.md`); lisans/atıf sorunu yoktur. Donanım Windows 11, Ubuntu, BIOS/UEFI, Office ve Chrome
  ekranları gerçeğine olabildiğince yakın canlandırılır. **Gerçek ürün adları ve logoları** kullanılır (eğitim amaçlı,
  yalnızca giriş yapan kullanıcılara açık kapalı sistem).
- **Kapalı kaynak sistem: Windows 11.** **Açık kaynak ana dağıtım: Ubuntu** (Pardus, Linux Mint vb. yalnızca İ3'te
  tanıtım ve karşılaştırmada geçer).
- **Yerel bağlam: Kuzey Kıbrıs.** Prizler ve fişler UK tipi (BS 1363, 230 V); UPS çıkışları IEC C13 ve/veya UK tipi;
  senaryolardaki kişi, yer ve kurum adları Kıbrıs bağlamında.
- **Ses kullanılmaz:** Laboratuvarda ses yokmuş gibi tasarlanır; bip kodları dahil tüm sesli bilgiler görsel/metin olarak verilir.
- **Ürün anahtarları:** Windows 11 ve Microsoft Office etkinleştirmesi **ürün anahtarı** ile yapılır. Anahtarlar
  simülasyonun ürettiği **kurgusal** anahtarlardır (gerçek anahtar kullanılmaz); sanal ürün kutusu/lisans etiketi
  üzerinde verilir, yanlış yazılan anahtar reddedilir.
- **Hedef kitle 9. sınıf:** Dil sade, adımlar kısa; Öğren modu ağırlıklı başlar, ipuçları bol; ileri görevler (winget,
  çift önyükleme, kaynak çakışmaları) "ileri düzey" etiketiyle isteğe bağlıdır.

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

**Ekranlar:** Açılış ekranı (logo + "Setup için DEL'e basın"), POST metin ekranı, bip dizisinin **görsel gösterimi**
(▬ uzun, • kısa; ekranda "Hoparlörden duyulan:" kutusu — ses çalınmaz), BIOS Setup (klasik mavi-gri metin arayüzü) ve UEFI (grafik arayüz) — iki tür de bulunur.

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
| İ2-G6 | Bip kodu teşhisi: 3 farklı bip dizisini (görsel) incele, arızalı bileşeni bul | B3, B9, S8 | Doğru bileşen |
| İ2-G7 | Saat her açılışta sıfırlanıyor — sebebini bul (CMOS pili) | B9, S8 | Doğru teşhis + çözüm |

---

### İ3 — İşletim Sistemi Seçimi ve Gereksinimler  (B4, B5, B6, Y1)

**Ekranlar:** İşletim sistemi kartları (masaüstü, sunucu, mobil, gömülü), karşılaştırma tablosu, "sistem bilgisi"
ekranı (verilen bilgisayarın donanımı), gereksinim denetleyicisi.

**Öğrenme içeriği:**
- İşletim sistemi çeşitleri: kullanım alanına göre (masaüstü, sunucu, mobil, gömülü/gerçek zamanlı), lisansa göre
  (kapalı/açık kaynak, ücretli/ücretsiz), kullanıcı ve görev sayısına göre.
- Örnekler: Windows 11, macOS, **Ubuntu**, Pardus ve diğer Linux dağıtımları, Android, iOS.
- Açık kaynak kavramı, GPL, dağıtım (distro) kavramı; Ubuntu (ana dağıtım) ve yerli dağıtım Pardus örnekleri.
- **Karşılaştırma ölçütleri:** maliyet/lisans, donanım gereksinimi, yazılım ve sürücü desteği, güvenlik, özelleştirme,
  destek ve topluluk, kullanım kolaylığı. *(Dersin hedefindeki "avantaj/dezavantaj" kazanımı burada ölçülür.)*
- Kurulum gereksinimleri: işlemci (mimari 32/64 bit, hız, çekirdek), RAM, disk alanı, ekran, TPM 2.0/UEFI/Secure Boot
  (Windows 11 için). Değerler bir **veri dosyasında** tutulur; resmî kaynaklardan doğrulanıp güncellenebilir.

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
DVD yazdırma, **Windows 11 kurulum sihirbazı** (gerçekçi), disk bölümleme ekranı, ilk
açılış (OOBE) ekranları.

**Kurulum akışı (simülasyon):**
1. Medya hazırlama: ISO → USB (GPT + UEFI veya MBR + BIOS seçimi; yanlış eşleşme açılışta sorun doğurur).
2. Önyükleme menüsünden veya BIOS'tan medya ile açılış.
3. Dil, saat ve klavye (Türkçe Q).
4. **Ürün anahtarı** girişi (sanal lisans etiketinden), sürüm seçimi (Home/Pro), lisans sözleşmesi.
   Windows 11 donanım denetimi: TPM 2.0 veya Secure Boot kapalıysa "Bu bilgisayar Windows 11'i çalıştıramaz" uyarısı (İ2'ye bağlanır).
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

**Ekranlar:** Canlı (live) masaüstü, **Ubuntu kurulum sihirbazı** (gerçekçi), gelişmiş
bölümleme, **sanal terminal**, paket yöneticisi (App Center + komut satırı), ayarlar.

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

### İ7 — Sürücüler ve Güvenlik (Windows Güvenliği / Microsoft Defender)  (S5, S6, Y3, B7○)

**Ekranlar:** **Windows Güvenliği** uygulaması (gerçekçi), Windows Update, kullanıcı hesapları, Aygıt Yöneticisi'nden
sürücü yükleme, yedekleme ve geri yükleme noktası; Ubuntu'da güncellemeler ve `ufw` güvenlik duvarı.

**Windows Güvenliği (Microsoft Defender) ayarları — simülasyonda yapılandırılabilir:**
| Bölüm | Ayarlar |
|---|---|
| Virüs ve tehdit koruması | Gerçek zamanlı koruma, bulut tabanlı koruma, otomatik örnek gönderimi, kurcalama koruması; **Hızlı / Tam / Özel / Çevrimdışı tarama**; koruma güncellemeleri; karantina ve **koruma geçmişi**; dışlamalar (ne zaman eklenmemeli) |
| Fidye yazılımı koruması | Denetimli klasör erişimi, korunan klasörler, izin verilen uygulamalar |
| Güvenlik duvarı ve ağ koruması | Etki alanı / Özel / Ortak ağ profilleri, uygulamaya güvenlik duvarından izin verme |
| Uygulama ve tarayıcı denetimi | SmartScreen (itibar tabanlı koruma), istenmeyebilecek uygulamaları engelleme |
| Cihaz güvenliği | TPM (güvenlik işlemcisi), Güvenli Önyükleme durumu (İ2 ile bağ) |
| Hesap koruması | Windows Hello / PIN, dinamik kilit |

**Öğrenme içeriği:**
- *Güvenlik (S5):* güncellemeler, antivirüs/kötü amaçlı yazılım koruması, güvenlik duvarı, standart/yönetici hesap ayrımı,
  güçlü parola ve kilit ekranı, kullanıcı hesabı denetimi (UAC), disk şifreleme kavramı, yedekleme ve geri yükleme
  noktası, güvenilir kaynaktan yazılım indirme.
- *Sürücüler (S6):* yonga seti, ekran, ses, ağ sürücüleri; doğru sıra; üreticinin resmî sitesi / Windows Update.
  (Uygulama yazılımlarının kurulumu İ8'dedir.)

**Görevler (örnek):**
| ID | Görev | Kazanım | Başarı koşulu |
|---|---|---|---|
| İ7-G1 | Yeni kurulan sistemde eksik sürücüleri doğru sırayla yükle (önce yonga seti) | S6 | Tüm aygıtlar çalışıyor |
| İ7-G2 | Windows Güvenliği'ndeki tüm uyarıları gider (gerçek zamanlı koruma kapalı, güncellemeler eski, güvenlik duvarı kapalı) | S5 | Tüm bölümler yeşil |
| İ7-G2b | Şüpheli dosya bulunan bilgisayarda tam tarama yap, tehdidi karantinaya al, koruma geçmişini yorumla | S5, S8 | Tehdit karantinada |
| İ7-G2c | Belgeler klasörünü fidye yazılımına karşı denetimli klasör erişimiyle koru | S5 | Ayar açık, klasör korunuyor |
| İ7-G3 | Öğrenci hesabını standart hesap yap, yazılım kurma yetkisini kaldır | S5 | Doğru |
| İ7-G4 | Okul laboratuvarı için güvenlik duvarını ortak ağ profilinde açık tut, yalnızca gerekli uygulamaya izin ver | S5, Y3 | Profil ve izinler doğru |
| İ7-G5 | Büyük değişiklikten önce geri yükleme noktası oluştur | S5 | Nokta oluşturuldu |

---

### İ8 — Uygulama Yazılımlarının Kurulumu  (S6, Y3, S4○, S5○, B5○, B6○, B8○)

İşletim sistemi kurulduktan sonra bilgisayarın kullanıma hazır olması için gereken programların (Microsoft Office,
Google Chrome vb.) **doğru kaynaktan, doğru sürümle, lisansa uygun şekilde** kurulması, yapılandırılması, onarılması ve
kaldırılması.

**Ekranlar:** Sanal web tarayıcı (arama sonuçları, resmî siteler, **sahte indirme siteleri ve reklam bağlantıları**),
İndirilenler klasörü, kurulum sihirbazları (.exe/.msi), Office kurulum ve etkinleştirme ekranları, Ayarlar → Uygulamalar
(kaldır/değiştir/onar), varsayılan uygulamalar, Ubuntu App Center ve terminal (`apt`).

**Yazılım kataloğu.** Temel yazılımlar her zaman açıktır; **isteğe bağlı** yazılımları öğretmen sınıf bazında açar/kapatır.
| Kategori | Windows 11 | Ubuntu | Öğretilen nokta |
|---|---|---|---|
| Ofis | **Microsoft Office** (Microsoft 365 / Office) | LibreOffice (hazır gelir); MS Office Linux'a doğrudan kurulamaz → web sürümü veya LibreOffice | Lisans ve etkinleştirme, bileşen seçimi, platform uyumu, dosya biçimi uyumu (.docx/.odt) |
| Web tarayıcı | **Google Chrome** (Edge hazır gelir) | Chrome (.deb paketi); Firefox hazır gelir | Resmî kaynaktan indirme, varsayılan tarayıcı yapma |
| *İsteğe bağlı:* Sıkıştırma | **WinRAR** | Arşiv yöneticisi (hazır) | Deneme sürümü ve lisans kavramı |
| *İsteğe bağlı:* PDF | **Adobe Acrobat Reader** | Belge görüntüleyici (hazır) | Kurulumdaki ek yazılım teklifleri (ör. tarayıcı uzantısı, ek araç) |
| *İsteğe bağlı:* Grafik | **Adobe Photoshop** | Linux sürümü yok (bilgi kartı: alternatifler) | Yüksek sistem gereksinimi (RAM, ekran kartı — B6), hesapla giriş ve abonelik lisansı, platform uyumu |

Katalogda başka yazılım yoktur (karar). Ubuntu tarafında Office ve Photoshop'un kurulamaması, platform uyumu kazanımı
için bilinçli olarak gösterilir.

**Kurulum akışı — Windows:**
1. **İndirme:** Sanal tarayıcıda resmî siteyi bulmak; reklam ve sahte "İndir" düğmelerini, benzer alan adlarını ayırt etmek
   (adres çubuğu, https, resmî alan adı).
2. **Doğru sürüm:** 32/64 bit, işletim sistemi uyumu, Türkçe dil seçimi (B6 ile bağ).
3. **Çalıştırma:** .exe/.msi dosyası, yayımcı bilgisi, kullanıcı hesabı denetimi (UAC) ve yönetici izni (İ7'deki standart
   hesap ayarı burada sonuç doğurur).
4. **Sihirbaz:** lisans sözleşmesi, kurulum türü (Hızlı/Özel), hedef klasör, bileşen seçimi, masaüstü kısayolu,
   **istenmeyen ek yazılım/araç çubuğu tuzakları**, varsayılan uygulama yapma.
5. **Microsoft Office'e özel:** **ürün anahtarı ile etkinleştirme**; bileşen seçimi (ör. yalnızca Word,
   Excel, PowerPoint); dil; etkinleştirme durumunun kontrolü (Dosya → Hesap).
   **Lisanssız (kırılmış) yazılım** seçeneği simülasyonda kötü amaçlı yazılım bulaştırır ve İ9'da arıza olarak geri döner;
   hukuki ve güvenlik riskleri açıklanır.
6. **Doğrulama:** Başlat menüsünde görünme, çalıştırma, sürüm bilgisi, otomatik güncellemenin açık olması.
7. **Bakım:** Ayarlar → Uygulamalar'dan kaldırma; Office **onarma** (hızlı/çevrimiçi onarım).
8. **İleri düzey (opsiyonel):** Laboratuvar için komut satırından toplu kurulum (`winget install Google.Chrome` vb.).

**Kurulum akışı — Ubuntu:** App Center ve `sudo apt update && sudo apt upgrade` ile güncelleme;
Chrome için `.deb` dosyasını indirip paket kurucu ile veya `sudo apt install ./google-chrome-stable_current_amd64.deb`
ile kurma; Office yerine LibreOffice ile .docx açıp düzenleme ve kaydetme.

**Görevler (örnek):**
| ID | Görev | Kazanım | Başarı koşulu |
|---|---|---|---|
| İ8-G1 | Google Chrome'u resmî sitesinden indir, kur ve varsayılan tarayıcı yap | S6, S5, S4 | Resmî kaynak, sahte bağlantıya tıklanmadı, varsayılan Chrome |
| İ8-G2 | Microsoft Office'i Türkçe kur; yalnızca Word, Excel, PowerPoint olsun; ürün anahtarıyla etkinleştir | S6, Y3 | Bileşenler doğru, ürün etkin |
| İ8-G3 | Senaryoya göre yazılım paketini seç ve kur (okul laboratuvarı / muhasebe ofisi / grafik atölyesi) | S6, Y3 | Gerekli küme eksiksiz, gereksiz/zararlı yazılım yok |
| İ8-G4 *(isteğe bağlı)* | Ek yazılım tekliflerini reddederek Adobe Acrobat Reader ve WinRAR kur | S6, S5 | Ek yazılım kurulmadı |
| İ8-G4b *(isteğe bağlı)* | Photoshop kurulacak bilgisayarın gereksinimleri karşılayıp karşılamadığını kontrol et; uygunsa kur ve hesapla etkinleştir | B6, S6 | Doğru karar, kurulum tamam |
| İ8-G5 | 32 bit sisteme 64 bit yazılım kurma girişiminde çıkan hatayı yorumla, doğru sürümü kur | B6, S6 | Doğru sürüm kurulu |
| İ8-G6 | Çalışmayan Office'i onar; kullanılmayan bir programı kaldır | S6, B8 | Onarım + kaldırma yapıldı |
| İ8-G7 | Ubuntu'yu `apt` ile güncelle, Chrome'u `.deb` ile kur; LibreOffice ile .docx dosyasını düzenle | S6, B5 | Güncel, Chrome kurulu, dosya kaydedildi |
| İ8-G8 (ileri) | Chrome ve açık olan isteğe bağlı programları `winget` ile tek seferde kur | S6 | Tümü kurulu |

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
| A2 | Açılışta bip kodu (görsel), görüntü yok | RAM yerinden çıkmış | RAM'i tak | B9, S8 |
| A3 | Ekran kartı takıldıktan sonra görüntü bozuk | Tümleşik ve harici ekran kartı çakışması | Tümleşik kartı BIOS'ta kapat, sürücüyü kur | B10, S9 |
| A4 | Ses kartı çalışmıyor, sarı ünlem (Kod 12) | Kaynak çakışması | Çakışan aygıtı devre dışı bırak / kaynakları yeniden ata | B10, S9 |
| A5 | Sürücü güncellemesinden sonra mavi ekran | Uyumsuz sürücü | Güvenli mod → sürücüyü geri al | S8, S9 |
| A6 | Bilgisayar çok yavaş | Başlangıç uygulamaları / disk dolu / kötü amaçlı yazılım | Görev Yöneticisi + temizlik + tarama | B9, S8 |
| A7 | İnternet yok | Ağ sürücüsü yok / kablo / IP ayarı | Teşhis + çözüm | S8 |
| A8 | Linux kurulumundan sonra Windows açılmıyor | GRUB/önyükleyici | GRUB yapılandırması / UEFI sıralaması | S8, Y4 |
| A9 | Saat sürekli geri gidiyor | CMOS pili | Pili değiştir | B9 |
| A10 | Elektrik kesintisinde veri kaybı | UPS yok / yanlış bağlantı | UPS + güvenli kapatma | B2, Y4 |
| A11 | Tarayıcıda sürekli reklam açılıyor, ana sayfa değişmiş | İstenmeyen ek yazılım / sahte siteden indirilen program (İ8) | Programı kaldır, tarayıcıyı sıfırla, tarama yap | S8, Y4 |
| A12 | Office "Etkinleştirilmemiş ürün" uyarısı veriyor, belgeler düzenlenemiyor | Lisans/etkinleştirme sorunu | Geçerli ürün anahtarını gir | S8 |
| A13 | Word açılırken çöküyor | Bozuk kurulum | Office onarımı | S8 |

| A14 | Kötü amaçlı yazılım tarama sonrası da geri geliyor (kırılmış program kaynaklı) | Sistem dosyalarına yerleşmiş zararlı | **Verileri yedekle → biçimlendir → temiz kurulum** | S8, Y4 |
| A15 | Sistem açılmıyor, başlangıç onarımı ve geri yükleme başarısız | Bozuk sistem dosyaları | **Bu bilgisayarı sıfırla** veya biçimlendirip yeniden kur | S8, Y4 |

**Format atma ve yeniden kurulum (her zaman erişilebilir):** Öğrenci sorunlu bilgisayara istediği an format atabilir:
- **Windows: "Bu bilgisayarı sıfırla"** — *Dosyalarımı koru* / *Her şeyi kaldır*; yerel yeniden yükleme / bulut indirme.
- **Medya ile temiz kurulum** — İ4 (Windows 11) veya İ5 (Ubuntu) akışı: USB'den açılış, bölümleri silme/biçimlendirme, kurulum.
- **Önce yedek:** Format öncesi kullanıcı dosyaları yedeklenmezse **veri kaybı** gerçekleşir, rapora "veri kaybı" olarak
  işlenir (Y1 ile bağ).
- **Sonrası:** Format atılan bilgisayarda sürücüler, Windows Güvenliği ayarları, programlar (Office, Chrome…) ve
  kişiselleştirme yeniden gerekir; görevin başarı koşulları bunları da denetler.
- **Gerçekçi sonuç:** Kök neden donanımsa (A1 kablo, A2 RAM, A3 çakışma, A9 CMOS pili) format sorunu **çözmez**.
- Öğretmen, kurulumu daha önce tamamlamış öğrenciler için **hızlandırılmış kurulum** seçeneğini açabilir (adımlar aynı,
  bekleme süreleri kısalır).

**Puanlama (İ9'a özel):** doğru teşhis + doğru çözüm + **orantılı müdahale** + süre. Format; A14/A15 gibi durumlarda
tam puanlı doğru çözümdür. Daha hafif bir çözümün yeterli olduğu arızalarda (ör. A13 Word çöküyor → onarım) format
sorunu çözer ama süreç puanı düşer. Yedeksiz format her durumda puan kaybettirir.

---

**F5'te uygulanan İ9 görevleri:** g1 SATA kablosu gevşek (BIOS'ta "Not Present" → kasayı kapatıp kabloyu tak),
g2 Kod 12 kaynak çakışması (yeni PCIe ses kartı ↔ tümleşik Realtek; tümleşik aygıt devre dışı), g3 hatalı ekran kartı
sürücüsü → mavi ekran → Otomatik Onarım → Başlangıç Ayarları → Güvenli Mod → Sürücüyü Geri Al (ya da Sistem Geri Yükleme),
g4 yavaşlık (sahte svchost32.exe madenci truva atı + reklam yazılımı + başlangıç öğesi), g5 internet yok (ağ bağdaştırıcısı
devre dışı; çevrimdışı tarayıcı sayfası), g6 Ubuntu güncellemesinden sonra GRUB'da Windows yok (os-prober + update-grub),
g7 kurtarılamayan bilgisayar: Belgeler → USB (E:) yedek → "Her şeyi kaldır" ile sıfırla → geri yükle ("Dosyalarımı koru"
profildeki zararlıyı bırakır; yedeksiz sıfırlama veri kaybı cezası). Her görevde orantısız müdahale (gereksiz sıfırlama,
ilgisiz aygıtı kapatma) cezalandırılır.

### Yeterlilik Senaryoları (Y1–Y4) — Kampanya

> **F5 uygulaması:** Kampanyalar `content/kampanyalar.json` dosyasında sıralı görev dizileridir. Bir adımda ≥ 50 puan alınca
> sonraki adım açılır; kampanya puanı adımların en iyi puanlarının ortalamasıdır. Öğretmen raporunda "Kampanyalar" görünümü vardır.
> K1: i1-g5, i1-g2, i2-g3, i4-g1, i4-g3, i7-g1, i7-g2, i8-g1, i8-g2, i6-g4 · K2: i3-g3, i5-g1, i5-g3, i5-g4, i8-g7 ·
> K3: i9-g1, i9-g5, i9-g2, i9-g4, i9-g3, i9-g6 · K4: i9-g7, i4-g4, i7-g1, i7-g2, i8-g2.
| Senaryo | Kapsadığı istasyonlar | Ölçülen |
|---|---|---|
| **K1 "Laboratuvara yeni bilgisayar"**: kutudan çıkar, bağla, BIOS'u ayarla, uygun işletim sistemini seç, medyayı hazırla, kur, sürücüleri ve güvenliği tamamla, Office ve Chrome gibi gerekli programları kur, kişiselleştir | İ1→İ8 | Y1, Y2, Y3 |
| **K2 "Ubuntu'ya geçiş"**: verileri koruyarak çift önyüklemeli açık kaynak kurulum ve yapılandırma | İ1, İ2, İ3, İ5, İ7, İ8 | Y1, Y2, Y3 |
| **K3 "Servis masası"**: art arda 3 rastgele arıza bileti | İ9 (+ İ2, İ6) | Y4 |
| **K4 "Format ve yeniden kurulum"**: kurtarılamayan bilgisayarda yedek al → format at → Windows 11 kur → sürücüler, Windows Güvenliği, Office ve Chrome → verileri geri yükle | İ4, İ7, İ8, İ9 | Y1, Y2, Y3, Y4 |

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
- **Hile/güvenilirlik:** Başarı koşulları **bildirimsel kurallar** (JSON) olarak yazılır; aynı kurallar tarayıcıda (anlık
  geri bildirim) ve sunucuda (PHP, resmî puan) değerlendirilir. Sunucu, istemcinin gönderdiği son durum ve olay günlüğü
  üzerinde kuralları yeniden çalıştırır; istemcinin hesapladığı puana tek başına güvenilmez. Değerlendirme modunda
  görev varyantları (ürün anahtarı, arıza, donanım) rastgele seçilir.

---

## 7. Öğretmen Paneli

| Özellik | Açıklama |
|---|---|
| Sınıf yönetimi | Sınıf/şube oluşturma, düzenleme, silme |
| **Giriş yolları** | (1) **Okul portalından otomatik giriş** (imzalı bağlantı, şifresiz — bkz. §8.4); (2) **portal dışından kullanıcı adı + şifre** ile giriş (`/giris` sayfası). İkisi aynı hesaba çıkabilir. |
| **Öğrenci hesapları** | Portal dışı giriş için öğrenciler **kullanıcı adı + şifre** kullanır. Hesapları **yalnızca öğretmen** panelden ekler, düzenler, şifresini sıfırlar, pasifleştirir/siler; tek tek veya CSV/Excel listesinden toplu ekleme (otomatik kullanıcı adı ve şifre üretimi, yazdırılabilir giriş kartları). Öğrenci kendi kendine kayıt olamaz. Portaldan ilk kez gelen öğrencinin hesabı otomatik açılır; öğretmen bu hesaba sonradan şifre tanımlayarak portal dışından da girmesini sağlayabilir. |
| **Çoklu öğretmen** | Birden fazla öğretmen kullanır. Her öğretmen **yalnızca kendi sınıflarını** görür ve yönetir; bir sınıf birden çok öğretmenle paylaşılabilir. Yönetici tüm öğretmen ve sınıfları görür. |
| Görev atama | İstasyon/görev/kampanya seçimi, mod (Uygula/Değerlendir), başlangıç–bitiş tarihi, süre sınırı |
| **Canlı izleme** | (Birkaç saniyede bir yenilenir) Sınıf ızgarası: her öğrencinin o anki istasyonu, ilerlemesi, takıldığı adım, ipucu kullanımı |
| Arıza gönderme | Ders sırasında seçili öğrencilere İ9 arıza senaryosu gönderme (F5: "servis bileti"; öğrencinin ana sayfasında bant olarak çıkar, görev değerlendirilince canlı izlemede ✔ olur) |
| Deneme ayrıntısı | Raporda öğrenci adına tıklayınca tüm denemeler, kriterler, hatalar ve zaman damgalı olay geçmişi |
| Raporlar | Kazanım × öğrenci ısı haritası; öğrenci karnesi; görev bazlı başarı; sık yapılan hatalar |
| Dışa aktarma | PDF (karne), CSV/Excel (not listesi) |
| Tekrar izleme | Öğrencinin bir görevdeki eylem günlüğünü adım adım izleme |
| İçerik | Görevleri etkinleştirme/gizleme; eşikleri ayarlama; **isteğe bağlı yazılımları (WinRAR, Adobe Acrobat Reader, Adobe Photoshop) sınıf bazında açma/kapatma**; hızlandırılmış kurulumu açma/kapatma |

Roller: **Yönetici** (öğretmen hesaplarını yönetir), **Öğretmen**, **Öğrenci**. Şifreler sunucuda güvenli özet (bcrypt/argon2) olarak saklanır; çok sayıda hatalı girişte geçici kilit.

---

## 8. Teknik Mimari

**Barındırma:** Hostinger paylaşımlı hosting (Web/Premium/Business), alan adı **isistem.mkcaglar.com**
(alt alan adı; hPanel'den SSL). Paylaşımlı hostingte Node.js süreci ve WebSocket çalıştırılamadığı için mimari buna göre
seçildi: **simülasyon tamamen tarayıcıda**, sunucu yalnızca **ince bir PHP API + MySQL**.

```
┌──────────────────── Tarayıcı (öğrenci / öğretmen) ────────────────────┐
│ React + TypeScript (Vite ile derlenmiş statik dosyalar)                │
│  ├─ Simülasyon çekirdeği: saf TS durum makinesi (sanal makine durumu)  │
│  ├─ Kural değerlendirici (TS)  ← content/*.json görev kuralları        │
│  ├─ İstasyon arayüzleri İ1–İ9: gerçekçi donanım, BIOS/UEFI,           │
│  │   Windows 11, Ubuntu, Office, Chrome ekranları; sanal terminal      │
│  └─ Öğretmen paneli                                                    │
└───────────────▲───────────────────────────────────────────────────────┘
       HTTPS    │ REST/JSON  (canlı izleme ve arıza gönderme: 3–5 sn'de bir yoklama)
┌───────────────┴───────────────────────────────────────────────────────┐
│ Hostinger: public_html/ (isistem.mkcaglar.com)                  │
│  ├─ index.html + assets/  (derlenmiş arayüz)                           │
│  └─ api/  PHP 8.x (çerçevesiz, küçük yönlendirici; PDO)                │
│       ├─ Kimlik doğrulama (PHP oturumu, HttpOnly çerez, CSRF koruması) │
│       ├─ Kullanıcı/sınıf/görev yönetimi                                │
│       ├─ Kural değerlendirici (PHP) → resmî puan, kazanım düzeyi       │
│       └─ Rapor: CSV/Excel; PDF karne (tarayıcıda yazdır → PDF)         │
│ MySQL / MariaDB (hPanel'den oluşturulan veritabanı)                    │
└───────────────────────────────────────────────────────────────────────┘
```

- **Neden bu yapı:** Her Hostinger paketinde çalışır, ek sunucu maliyeti yoktur; ileride VPS'e taşınırsa aynı arayüz korunur.
- **Paylaşılan kurallar:** Görevlerin başarı koşulları kod değil, JSON kurallardır (ör. `{"yol":"bios.bootOrder[0]","eşit":"usb"}`,
  `{"olay":"office.activate","sayı":">=1"}`). Aynı kurallar TS'de ve PHP'de küçük birer değerlendiriciyle çalışır; iki
  değerlendiricinin aynı sonucu verdiği ortak test dosyalarıyla doğrulanır.
- **İçerik veri dosyalarıyla (JSON):** görevler, sorular, arıza senaryoları, yazılım kataloğu, işletim sistemi gereksinim
  tabloları, bip kodu tabloları, kurgusal ürün anahtarı kalıpları. Yeni görev eklemek kod gerektirmez.
- **Kaldığı yerden devam:** Sanal makine durumu düzenli aralıklarla sunucuya kaydedilir; öğrenci başka bilgisayardan
  girince kaldığı yerden devam eder.
- **Gerçekçi görseller:** Donanım için projeye özel üretilmiş gerçekçi görseller (WebP/şeffaf PNG, tembel yükleme); işletim sistemi
  ve uygulama ekranları HTML/CSS ile canlandırılır (gerçek logolar, Windows 11 için Segoe UI/Fluent görünümü,
  Ubuntu için Ubuntu yazı tipi). Toplam sayfa ağırlığı istasyon bazında bölünür (her istasyon ayrı yüklenir).
- **Dağıtım:** GitHub'a gönderilen her sürüm, GitHub Actions ile derlenip Hostinger'a (FTP/SFTP veya hPanel Git) yüklenir.
  Veritabanı şeması sürümlü SQL betikleriyle kurulur; ilk kurulumda bir **kurulum sihirbazı** yönetici hesabını oluşturur.
- **Depo yapısı:** `web/` (React+TS), `api/` (PHP), `content/` (JSON içerik), `assets/` (görseller), `db/` (SQL), `docs/`.
- **Test:** TS çekirdek ve kurallar için Vitest; PHP API için PHPUnit; kritik akışlar (giriş, görev tamamlama, rapor)
  için Playwright uçtan uca testleri.

### 8.1 Veri modeli (özet)
| Tablo | Alanlar |
|---|---|
| users | id, rol, ad-soyad, **portal_uid** (portaldan gelenler; boş olabilir), **kullanıcı adı + şifre özeti** (portal dışı giriş; boş olabilir), aktif, son giriş |
| classes | id, ad (ör. 9-A), öğretim yılı |
| class_teachers | class_id, teacher_id (bir sınıfın birden çok öğretmeni olabilir) |
| used_tokens | jti, son geçerlilik (portal bağlantısı tek kullanımlık) |
| enrollments | class_id, student_id |
| assignments | id, class_id, görev/kampanya, mod, başlangıç, bitiş, süre |
| attempts | id, assignment_id, student_id, başlangıç, bitiş, durum, puan |
| events | attempt_id, sıra, zaman, tür, veri (JSON) |
| attempt_state | attempt_id, sanal makine durumu (JSON, ara kayıt — öğrenci kaldığı yerden devam eder) |
| live_status | student_id, istasyon, adım, ilerleme, son görülme (canlı izleme için) |
| commands | id, hedef öğrenci/sınıf, tür (arıza gönder vb.), veri, teslim edildi mi |
| outcome_scores | student_id, kazanım_kodu, puan, düzey, güncelleme |

### 8.2 Gizlilik (KVKK)
- Asgari kişisel veri: ad-soyad, kullanıcı adı ve portaldan gelen kalıcı kod (okul no). **T.C. kimlik no tutulmaz.**
- Veri yalnızca Hostinger'daki veritabanında tutulur; üçüncü taraf analiz/izleme aracı kullanılmaz.
- Tüm trafik HTTPS üzerinden; arama motorlarına kapalı (`noindex`); giriş yapmadan hiçbir simülasyon ekranı görülmez.
- Öğretmen, sınıf/öğrenci verisini silebilir; dönem sonu toplu silme/arşivleme.

### 8.3 Arayüz ilkeleri
- Tamamen **Türkçe**; terimlerin ilk geçtiği yerde İngilizce karşılığı (POST, Boot, Secure Boot).
- Akıllı tahta ve dokunmatik uyumu (büyük hedefler, sürükle-bırak dokunmatikte de çalışır); en az 1366×768.
- 9. sınıf düzeyine uygun sade dil; kısa yönergeler; teknik terimler için tıklanınca açılan sözlük.
- Klavye ile kullanılabilirlik ve yeterli renk kontrastı; ses kullanılmaz; bip kodları görsel olarak gösterilir.
- Laboratuvar bilgisayarları için hafif: modern tarayıcıda çalışır, eklenti gerektirmez.

---

### 8.4 Okul Portalı ile Otomatik Giriş (C# Form Stüdyosu ile aynı sistem)

Portal adresi: **https://portal.mkcaglar.com**. C# Form Stüdyosu'ndaki (`mkcaglars/c-lesson`) token sistemi aynen uygulanır; portal tarafında aynı örnek kod
(yalnızca adres ve anahtar değişerek) kullanılabilir.

```
Kullanıcı portalda "İşletim Sistemleri" bağlantısına tıklar
  → Portal imzalı bağlantı üretir: https://isistem.mkcaglar.com/giris.php?token=eyJ...
  → giris.php: imza (HS256), süre (en çok 5 dk) ve tek kullanımlık (jti) denetimi
  → Kullanıcı ilk girişte otomatik oluşturulur / ad, rol, sınıf her girişte güncellenir
  → Oturum açılır (varsayılan 10 saat) → öğrenci kendi görevlerine, öğretmen paneline yönlenir
```

| Token alanı | Zorunlu | Açıklama |
|---|---|---|
| `uid` | evet | Kalıcı benzersiz kod (okul no; T.C. kimlik no **değil**) |
| `name` | evet | Ad soyad |
| `role` | hayır | `ogrenci` (varsayılan) / `ogretmen` |
| `sinif` | hayır | Ör. `9-A`; öğrenci bu ada sahip sınıfa otomatik eklenir (sınıf yoksa oluşturulur) |
| `exp`, `jti` | evet | Son geçerlilik (≤5 dk) ve tek kullanımlık rastgele kod |

- **Gizli anahtar** (`jwt_secret`) yalnızca sunucudaki ayar dosyasında durur (public_html dışına konabilir). Güvenlik için
  C# Form Stüdyosu'ndan **farklı** bir anahtar kullanılması önerilir (biri sızarsa diğeri etkilenmez).
- Portaldan gelen öğretmen, `sinif` alanındaki sınıfa otomatik bağlanmaz; öğretmen panelinden sınıflarını seçer
  (yanlışlıkla başka öğretmenin sınıfını görmemek için). Yönetici atama yapabilir.
- **Hesap eşleştirme:** Portal kullanıcısı (`portal_uid`) ile öğretmenin elle açtığı hesap aynı kişiyse öğretmen panelinden
  birleştirilir; ilerleme tek hesapta toplanır.
- **Portal dışı giriş:** `/giris` sayfasında kullanıcı adı + şifre formu her zaman açıktır; oturum süresi ve güvenlik
  kuralları (hatalı giriş kilidi, CSRF, HttpOnly çerez) iki yolda da aynıdır.
- **Deneme sayfası** (`test-portal.php`) yalnızca ayarda açıkken çalışır; canlıda kapalıdır.

---

## 9. Yol Haritası

| Faz | İçerik | Çıktı |
|---|---|---|
| F0 | Bu dokümanın onayı; görsellerin üretilmesi | Onaylı tasarım |
| F1 ✅ | Proje iskeleti, PHP API + MySQL, kurulum sihirbazı, giriş (portal token + kullanıcı adı/şifre), çoklu öğretmen, öğretmen panelinde öğrenci/sınıf yönetimi, simülasyon çekirdeği, kural motoru (TS+PHP), Hostinger'a otomatik dağıtım | isistem.mkcaglar.com'da çalışan iskelet |
| F2 ✅ | İ1 Donanım + İ2 POST/BIOS + temel öğretmen raporu | İlk deneme sürümü (pilot) |
| F3 ✅ | İ3 Seçim + İ4 Windows 11 kurulumu + İ5 Ubuntu kurulumu (terminal) | Kurulum modülleri |
| F4 ✅ | İ6 Ayarlar + İ7 Sürücü & Windows Güvenliği + İ8 Uygulama Yazılımları (Office, Chrome, isteğe bağlı WinRAR/Acrobat/Photoshop) + Windows 11/Ubuntu masaüstü | Gelişmiş özellikler |
| F5 ✅ | İ9 Arıza + format/yeniden kurulum + kampanyalar K1–K4 (Y1–Y4) + canlı izleme + arıza gönderme + CSV/PDF raporlar | Tam kapsam |
| F6 | Pilot uygulama geri bildirimi, içerik zenginleştirme, performans | Sürüm 1.0 |

Her faz sonunda öğretmen değerlendirmesi yapılır; içerik ve görevler bu geri bildirime göre düzeltilir.

### 9.1 Ders planına uyum (9. sınıf, haftada 2 ders saati)
Her hafta tek oturum (2 × 40 dk) olarak düşünülür: ~10 dk Öğren modu, ~55 dk Uygula modu, ~15 dk değerlendirme/özet.
| İstasyon | Önerilen süre |
|---|---|
| İ1 Donanım ve hazırlık | 2 hafta |
| İ2 POST ve BIOS/UEFI | 3 hafta |
| İ3 İşletim sistemi seçimi | 2 hafta |
| İ4 Windows 11 kurulumu | 3 hafta |
| İ5 Ubuntu kurulumu ve yapılandırma | 4 hafta |
| İ6 Ayarlar ve kişiselleştirme | 3 hafta |
| İ7 Sürücü ve güvenlik | 2 hafta |
| İ8 Uygulama yazılımları | 3 hafta |
| İ9 Arıza giderme | 4 hafta |
| Kampanyalar K1–K4 (yeterlilik) | 3 hafta |
| **Toplam** | **29 hafta** (kalan haftalar tekrar, telafi ve sınavlar için) |

Görevler 20–30 dakikalık parçalara bölünür; öğrenci oturum sonunda kaldığı yerden devam eder. Süreler öğretmen
tarafından değiştirilebilir.

---

## 10. Kararlar

| # | Konu | Karar |
|---|---|---|
| 1 | Barındırma | Hostinger paylaşımlı hosting, **isistem.mkcaglar.com**; PHP 8 + MySQL API, simülasyon tarayıcıda |
| 2 | Giriş | İki yol: **okul portalından otomatik giriş** (C# Form Stüdyosu ile aynı token sistemi) **ve** portal dışından **kullanıcı adı + şifre**; hesapları öğretmen panelden ekler/düzenler/sıfırlar |
| 3 | Hedef kitle | **9. sınıf Bilişim Teknolojileri**, haftada **2 ders saati** |
| 4 | Kapalı kaynak işletim sistemi | **Windows 11** |
| 5 | Açık kaynak ana dağıtım | **Ubuntu** |
| 6 | Sunucu işletim sistemleri | Kapsam dışı |
| 7 | Ses | **Kullanılmaz**; tüm sesli bilgiler görsel |
| 8 | Görsel stil | **Tamamen gerçekçi** |
| 9 | Lisans/etkinleştirme | Windows ve Office **ürün anahtarı** ile (kurgusal anahtarlar) |
| 10 | Logolar | **Gerçek logolar** (eğitim amaçlı kapalı sistem) |
| 11 | Değerlendirme | Merkezi öğretmen paneli |
| 12 | Öğretmenler | **Birden fazla öğretmen**; her biri kendi sınıflarını görür, yönetici hepsini |
| 13 | Portal | **portal.mkcaglar.com** (portal dışı giriş de açık) |
| 14 | Yazılımlar | Temel: Microsoft Office, Google Chrome; ayrıca **Windows Güvenliği (Defender) ayarları**. İsteğe bağlı (öğretmen açar/kapatır): WinRAR, Adobe Acrobat Reader, Adobe Photoshop. Başka yazılım yok |
| 15 | Format | Öğrenci sorunlu bilgisayara her zaman format atıp yeniden kurabilir (yedek almazsa veri kaybı) |
| 16 | Fotoğraflar | Yapay zekâ ile projeye özel üretilen gerçekçi görseller (`docs/GORSEL_PROMPTLARI.md`) |

## 11. Kalan Açık Konular

Yok. Doküman onaylandığında **F1** (iskelet) ile kodlamaya başlanır.
