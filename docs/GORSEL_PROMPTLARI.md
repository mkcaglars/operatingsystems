# Görsel Üretim Listesi ve Promptlar

Bağlam: **Kuzey Kıbrıs** — elektrik prizleri ve fişler **UK tipi (BS 1363)**.

Bu görseller yapay zekâ ile üretilecek ve projeye ait olacak; açık lisans/atıf gerekmez.
Ekran görüntüleri (BIOS, Windows 11, Ubuntu, Office, Chrome, Windows Güvenliği) **kodla çizilir**; burada yalnızca
fiziksel nesneler ve ortamlar var.

## Görseller nereye yüklenir?

**Yol 1 (en kolay): sohbete gönder.** Görselleri Claude'a sohbette gönder ve hangi dosya adı olduğunu yaz
(ya da sıra numarasını). Kontrol eder, gerekirse arka planı temizler, adlandırır ve projeye ekler.

**Yol 2: GitHub'a kendin yükle.**
1. https://github.com/mkcaglars/operatingsystems/tree/main/assets/gorseller adresine git (dal: **main**).
2. Sağ üstte **Add file › Upload files**.
3. Dosyaları sürükle. **Dosya adları aşağıdaki listedekiyle birebir aynı olmalı** (küçük harf, Türkçe karakter yok,
   ör. `kh-flash-mavi.png`). Uzantı `.webp`, `.png` ya da `.jpg` olabilir.
4. Yükleme çubukları bitince sayfanın en altındaki yeşil **Commit changes** düğmesine bas. Basılmazsa dosyalar kaydedilmez!
5. GitHub Actions siteyi birkaç dakikada günceller; görsel otomatik olarak kullanılmaya başlar (kod değişikliği gerekmez).

## Şu an kodda kullanılan görseller (öncelik)

| Durum | Dosya adı | Nerede |
|---|---|---|
| ✅ | `cmos-pil`, `sata-kablo-gevsek`, `guc-kablosu`, `ortam-servis-masasi` | İ2, İ9, İ1, giriş ekranı |
| ⏳ | `kh-kasa-on`, `kh-guc-dugmesi`, `kh-reset-dugmesi`, `kh-usb-giris`, `kh-flash-mavi`, `kh-flash-turuncu`, `kh-not-kagidi`, `lisans-etiketi` | **Kum havuzu sağ paneli** (bölüm 10) |
| ⏳ | `kasa-on`, `monitor`, `modem`, `yazici-lazer` | İ1 donanım masası |
| ⏳ | `ups-offline`, `ups-line-interactive`, `ups-online` | İ1 UPS seçimi |
| ⏳ | `ram-yerinden-cikmis` | İ2 bip kodları |
| ⏳ | `kisi-grafiker`, `kisi-muhasebeci` | İ3 ihtiyaca göre seçim |
| ⏳ | `ortam-lab-masa` | (UK prizleriyle yeniden) |

Logolar (Windows, Ubuntu, Chrome, Office…) kodla çiziliyor; onlar için görsel gerekmez.

## Genel kurallar (her görsel için)

1. **Yazı, logo, marka adı olmasın.** Yapay zekâ yazıları bozar; logolar ve etiketler sonradan kodla eklenir.
2. **Biçim:** `.webp` de kabul (şeffaf arka planlı webp olur). **Dekupe (kesilmiş) görseller:** Mümkünse **şeffaf arka planlı PNG**; araç desteklemiyorsa düz **saf beyaz** arka plan
   (arka planı ben temizlerim).
3. **Çözünürlük:** En az **2048 px** uzun kenar. Oran her satırda belirtildi.
4. **Tutarlılık:** Aynı aracı, aynı stil ekiyle kullanın ki tüm görseller aynı ışıkta ve aynı "fotoğraf çekiminden" çıkmış gibi dursun.
5. Dosyaları aşağıdaki **dosya adlarıyla** `assets/gorseller/` klasörüne koyun (veya bana gönderin).

### Stil ekleri (prompt'un sonuna ekleyin)

- **[DEKUPE]**: `photorealistic studio product photography, isolated object, transparent background (or pure white #FFFFFF background), soft even studio lighting, subtle natural shadow, sharp focus, high detail, no text, no logos, no brand names, no watermark`
- **[ÖNDEN]**: `perfectly straight-on orthographic front view, camera centered and level, no perspective distortion` — tıklanabilir bölge (port, yuva) içeren görsellerde şart.
- **[ORTAM]**: `photorealistic photograph, natural daylight from windows, realistic school environment in Northern Cyprus, **UK-type BS 1363 wall sockets (three rectangular holes) wherever sockets are visible**, clean and tidy, 35mm lens, no people's faces visible, no text, no logos, no watermark`

---

## 1. Ortam (arka planlar)

| # | Dosya adı | Oran | Prompt |
|---|---|---|---|
| 1 | `ortam-lab-masa.webp` | 16:9 | 🔁 **Yeniden üretilecek** (ilk sürümde Schuko priz vardı).  An empty wooden computer workbench in a school IT workshop, front view at desk height, a **UK-type BS 1363** power strip with switch on the desk, a **UK-type BS 1363 wall socket** (three rectangular holes, with switch) behind, plenty of empty space on the desk for placing a computer, monitor and peripherals, blurred workshop shelves in background. **[ORTAM]** |
| 2 | `ortam-bilgisayar-sinifi.webp` | 16:9 | A modern secondary school computer lab classroom with rows of desktop computers and monitors, an interactive whiteboard at the front, bright and organized, wide angle. **[ORTAM]** |
| 3 | `ortam-servis-masasi.webp` | 16:9 | ✅ **Alındı.**  A computer repair technician workbench with an anti-static mat, a desktop computer case with side panel removed, small screwdrivers, labeled parts boxes, a desk lamp, front view. **[ORTAM]** |

## 2. Bilgisayar kasası ve iç donanım

| # | Dosya adı | Oran | Prompt |
|---|---|---|---|
| 4 | `kasa-on.png` | 3:4 | A black ATX mid-tower desktop computer case, front panel with power button, reset button, two USB ports and audio jacks on the top front edge. **[ÖNDEN] [DEKUPE]** |
| 5 | `kasa-arka.png` | 3:4 | Rear panel of a black ATX mid-tower desktop computer, showing clearly from top to bottom: power supply unit with IEC C14 power socket and rocker switch, motherboard I/O shield with one purple PS/2 port and one green PS/2 port, six USB-A ports, HDMI, DisplayPort and blue VGA port, RJ45 ethernet port, colored 3.5mm audio jacks (blue, green, pink), and an expansion slot with a graphics card output (HDMI and DisplayPort). All ports sharp and distinct. **[ÖNDEN] [DEKUPE]** |
| 6 | `kasa-ic.png` | 4:3 | Side view of an open ATX desktop computer case with the side panel removed, showing the motherboard, CPU cooler, two RAM sticks, a graphics card, a power supply at the bottom, a 2.5 inch SSD with SATA data and power cables, tidy cables. **[ÖNDEN] [DEKUPE]** |
| 7 | `anakart.png` | 1:1 | Top-down view of a modern ATX motherboard with CPU socket covered by a cooler, four RAM slots, a PCIe x16 slot, an M.2 slot, SATA ports, 24-pin power connector, and a visible CR2032 coin cell CMOS battery. **[ÖNDEN] [DEKUPE]** |
| 8 | `ram-modul.png` | 16:9 | A single desktop DDR4 RAM memory stick with a black heat spreader, showing the gold contact pins and the notch, horizontal. **[DEKUPE]** |
| 9 | `ram-yerinden-cikmis.webp` | 4:3 | Close-up of a motherboard RAM slot where one RAM stick is visibly not fully seated, one side tilted up and the retention clip open, shallow depth of field. photorealistic macro photograph, no text, no logos |
| 10 | `cmos-pil.webp` | 1:1 | ✅ **Alındı.**  Close-up of a CR2032 coin cell battery in its holder on a motherboard, top-down macro. **[DEKUPE]** |
| 11 | `ekran-karti.png` | 16:9 | A dedicated desktop graphics card with dual fans, PCIe connector visible, side view. **[DEKUPE]** |
| 12 | `ssd-sata.png` | 4:3 | A 2.5 inch SATA solid state drive, angled view showing SATA data and power connectors. **[DEKUPE]** |
| 13 | `ssd-nvme.png` | 16:9 | An M.2 NVMe SSD stick, top view. **[DEKUPE]** |
| 14 | `hdd.png` | 4:3 | A 3.5 inch internal hard disk drive, angled view showing SATA connectors. **[DEKUPE]** |
| 15 | `sata-kablo-gevsek.webp` | 4:3 | ✅ **Alındı.**  Macro close-up of a red SATA data cable that is loose and half-unplugged from an SSD connector inside a computer. photorealistic macro photograph, shallow depth of field, no text, no logos |
| 16 | `guc-kaynagi.png` | 4:3 | An ATX computer power supply unit with modular cables, angled view. **[DEKUPE]** |
| 17 | `guc-kablosu.webp` | 4:3 | ✅ **Alındı.** (UK tipi BS 1363 fiş + IEC C13 — Kıbrıs'ta kullanılan tip) |

## 3. Monitör ve dizüstü (ekran içi kodla doldurulacak)

| # | Dosya adı | Oran | Prompt |
|---|---|---|---|
| 18 | `monitor.png` | 16:10 | A modern 24 inch computer monitor with thin bezels on a stand, the screen completely **pure black and switched off**, no reflections on the screen. **[ÖNDEN] [DEKUPE]** |
| 19 | `dizustu.png` | 4:3 | An open modern laptop, screen completely **pure black and switched off**, keyboard visible. **[ÖNDEN] [DEKUPE]** |

## 4. Klavye ve fare (B1)

| # | Dosya adı | Oran | Prompt |
|---|---|---|---|
| 20 | `klavye-membran-usb.png` | 3:1 | A standard full-size black membrane desktop keyboard with a USB cable, top-down view, keycaps without any printed letters. **[DEKUPE]** |
| 21 | `klavye-mekanik.png` | 3:1 | A full-size mechanical gaming keyboard with visible mechanical switches under one removed keycap, top-down view, keycaps without printed letters. **[DEKUPE]** |
| 22 | `klavye-kablosuz.png` | 3:1 | A slim wireless keyboard with a small USB wireless receiver dongle next to it, top-down view, keycaps without printed letters. **[DEKUPE]** |
| 23 | `klavye-ergonomik.png` | 3:1 | An ergonomic split-design keyboard with a palm rest, top-down view, keycaps without printed letters. **[DEKUPE]** |
| 24 | `klavye-ps2.png` | 3:1 | An old beige office keyboard with a cable ending in a purple round PS/2 connector, top-down view, keycaps without printed letters. **[DEKUPE]** |
| 25 | `fare-optik-usb.png` | 1:1 | A simple black wired optical computer mouse with USB cable, top view slightly angled. **[DEKUPE]** |
| 26 | `fare-kablosuz.png` | 1:1 | A wireless computer mouse with a tiny USB receiver beside it. **[DEKUPE]** |
| 27 | `fare-oyuncu.png` | 1:1 | A gaming mouse with extra side buttons and a DPI switch button behind the scroll wheel. **[DEKUPE]** |
| 28 | `fare-dikey-ergonomik.png` | 1:1 | A vertical ergonomic mouse for handshake grip. **[DEKUPE]** |
| 29 | `fare-ps2.png` | 1:1 | An old beige ball mouse with a cable ending in a green round PS/2 connector. **[DEKUPE]** |

## 5. Konnektörler (porta takma etkinliği için)

| # | Dosya adı | Oran | Prompt |
|---|---|---|---|
| 30 | `konnektor-usb-a.png` | 1:1 | Close-up of a single USB Type-A male cable plug, pointing up. **[DEKUPE]** |
| 31 | `konnektor-ps2-mor.png` | 1:1 | Close-up of a purple PS/2 male cable connector, pins facing the camera. **[DEKUPE]** |
| 32 | `konnektor-ps2-yesil.png` | 1:1 | Close-up of a green PS/2 male cable connector, pins facing the camera. **[DEKUPE]** |
| 33 | `konnektor-hdmi.png` | 1:1 | Close-up of an HDMI male cable plug, pointing up. **[DEKUPE]** |
| 34 | `konnektor-vga.png` | 1:1 | Close-up of a blue VGA D-sub male cable connector with thumb screws. **[DEKUPE]** |
| 35 | `konnektor-rj45.png` | 1:1 | Close-up of an RJ45 ethernet cable plug with a blue cable. **[DEKUPE]** |

## 6. UPS ve enerji (B2)

| # | Dosya adı | Oran | Prompt |
|---|---|---|---|
| 36 | `ups-offline.png` | 1:1 | A small compact desktop offline/standby UPS unit with a single power button and two LED indicators. **[DEKUPE]** |
| 37 | `ups-line-interactive.png` | 3:4 | A tower line-interactive UPS with a small blank LCD display and buttons on the front. **[ÖNDEN] [DEKUPE]** |
| 38 | `ups-online.png` | 3:4 | A larger professional online double-conversion tower UPS with a blank LCD panel. **[ÖNDEN] [DEKUPE]** |
| 39 | `ups-arka.png` | 4:3 | Rear panel of a tower UPS showing an input power socket, four IEC C13 output sockets, a USB communication port and a circuit breaker button. **[ÖNDEN] [DEKUPE]** |
| 40 | `grup-priz.png` | 3:1 | A 6-outlet **UK-type BS 1363** power strip (three rectangular holes per socket, as used in the UK and Cyprus) with an illuminated switch and a UK plug, top-down view. **[DEKUPE]** |
| 41 | `yazici-lazer.png` | 1:1 | A desktop office laser printer. **[DEKUPE]** |

## 7. Kurulum medyası ve lisans

| # | Dosya adı | Oran | Prompt |
|---|---|---|---|
| 42 | `usb-bellek.png` | 1:1 | A 32GB USB flash drive with a metal body, no printing. **[DEKUPE]** |
| 43 | `dvd-disk.png` | 1:1 | A blank recordable DVD disc, slightly angled, rainbow reflection on the data side. **[DEKUPE]** |
| 44 | `yazilim-kutusu.png` | 3:4 | A retail software box standing upright, **completely plain white front with no design or text** (the label will be added later). **[ÖNDEN] [DEKUPE]** |
| 45 | `lisans-etiketi.png` | 3:1 | A blank rectangular product key sticker label with a holographic strip on the left, empty white area for text. **[ÖNDEN] [DEKUPE]** |
| 46 | `harici-disk.png` | 1:1 | A portable external hard drive with a USB cable, for backups. **[DEKUPE]** |
| 46b | `modem.png` | 1:1 | A small white home/office Wi-Fi router modem with two antennas and status LEDs, front three-quarter view. **[DEKUPE]** |

## 8. Arıza biletleri için kullanıcı profilleri (İ9, kampanyalar)

| # | Dosya adı | Oran | Prompt |
|---|---|---|---|
| 47 | `kisi-ogretmen.webp` | 1:1 | Friendly portrait of a Turkish Cypriot female school teacher in her 40s in a classroom, head and shoulders, natural light, photorealistic, no text, no logos |
| 48 | `kisi-muhasebeci.webp` | 1:1 | Portrait of a Turkish Cypriot male accountant in his 50s at an office desk, head and shoulders, slightly worried expression, photorealistic, no text, no logos |
| 49 | `kisi-grafiker.webp` | 1:1 | Portrait of a young Turkish Cypriot graphic designer in a creative studio, head and shoulders, photorealistic, no text, no logos |
| 50 | `kisi-ogrenci.webp` | 1:1 | Portrait of a Turkish Cypriot high school student around 15 years old in a school computer lab, head and shoulders, photorealistic, no text, no logos |

## 9. Masaüstü arka planları (İ6 kişiselleştirme görevi)

| # | Dosya adı | Oran | Prompt |
|---|---|---|---|
| 51 | `duvar-kagidi-1.webp` | 16:9 | Wide landscape photograph of Kyrenia (Girne) old harbour with the castle at sunset, desktop wallpaper, no text |
| 52 | `duvar-kagidi-2.webp` | 16:9 | Golden sand beach and turquoise sea of the Karpaz peninsula in Northern Cyprus, desktop wallpaper, no text |
| 53 | `duvar-kagidi-3.webp` | 16:9 | Abstract soft gradient waves in deep blue and purple, minimal desktop wallpaper, no text |

## 10. Kum havuzu — kasa ön paneli (sağdaki tıklanabilir parçalar)

Bu parçalar ayrı ayrı üretilir; kod onları kasa paneline yerleştirir, tıklanabilir yapar ve üstüne yazıları ekler.
**Hepsinde yazı, sembol dışında işaret ve marka olmasın.** Dekupe olanlar **şeffaf arka planlı PNG** olsun.

| # | Dosya adı | Oran | Prompt |
|---|---|---|---|
| 54 | `kh-kasa-on.webp` | 1:3 (dikey) | The plain front panel of a modern matte black PC tower case, straight-on, filling the whole frame, subtle vertical brushed-aluminium texture with a thin fine mesh strip at the edges, **no buttons, no ports, no lights, no logos** (they will be added separately), even soft lighting. **[ÖNDEN]** photorealistic, high detail, no text |
| 55 | `kh-guc-dugmesi.png` | 1:1 | A round brushed-metal PC power button seen exactly from the front, with the standard power symbol engraved in the centre and a thin glowing blue LED ring around it, slightly convex, realistic reflections. **[ÖNDEN] [DEKUPE]** |
| 56 | `kh-reset-dugmesi.png` | 1:1 | A small round recessed black plastic PC reset button seen exactly from the front, with a thin silver bezel, no symbol. **[ÖNDEN] [DEKUPE]** |
| 57 | `kh-usb-giris.png` | 12:5 (yatay) | Close-up of a single empty USB 3.0 Type-A port on the front panel of a black PC case, exactly front view, blue plastic tongue visible inside the black metal port, dark matte surface around it filling the frame. **[ÖNDEN]** photorealistic, high detail, no text |
| 58 | `kh-flash-mavi.png` | 3:1 (yatay) | A blue plastic USB flash drive lying horizontally, side view, **metal USB-A connector pointing to the right**, rounded body with a small keyring hole on the left end, glossy finish, no printing. **[DEKUPE]** |
| 59 | `kh-flash-turuncu.png` | 3:1 (yatay) | The same style USB flash drive in **orange** plastic, lying horizontally, side view, **metal USB-A connector pointing to the right**, small keyring hole on the left end, no printing. **[DEKUPE]** |
| 60 | `kh-not-kagidi.png` | 1:1 | A single blank square yellow sticky note, top-down, one corner slightly curled up, realistic paper texture, **completely empty**. **[DEKUPE]** |
| 45 | `lisans-etiketi.png` | 3:1 | (Bölüm 7'deki ile aynı) Windows ve Office anahtar kartlarının arka planı olarak kullanılır: boş beyaz etiket, solda hologram şerit. |

İpuçları: 58 ve 59 için aynı sohbette "aynı flash belleği bu kez turuncu yap" demek iki görselin birebir aynı biçimde
çıkmasını sağlar. 55 ve 56 aynı ışıkta olsun.

---

**Not:** Görsel eklemek için dosyayı `assets/gorseller/` klasörüne listedeki adla koymak yeterli; sitede görsel olmayan yerlerde yedek çizim görünür, görsel gelince kendiliğinden fotoğraf kullanılır. (İstisna: kasa arka paneli görevindeki portlar tıklanabilir çizim olarak kalır.)

**Öncelik:** İlk deneme sürümü (F2: İ1 Donanım + İ2 POST/BIOS) için önce **1, 3–10, 15, 17, 18, 20–41** gerekir. Diğerleri sonraki
fazlarda kullanılacak.
