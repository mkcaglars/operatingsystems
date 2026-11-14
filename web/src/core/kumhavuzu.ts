// Serbest kum havuzu: tek bir gerçekçi bilgisayar. Güç/reset düğmeleri, 3 USB girişi, 2 flash bellek,
// BIOS, USB'den önyükleme, Windows 11 kurulumu ve kurulu Windows. Puan yok; isteğe bağlı yapılacaklar listesi var.
import type { BiosState, BiosVeri } from '../tasks/PcBios';
import type { Bolum, Disk, WinSetupState, WinSetupVeri } from '../tasks/WinSetup';
import type { Part, UbuntuKurState, UbuntuVeri } from '../tasks/UbuntuKur';
import { defaultShell, type ShellState } from './shell';
import type { Sim } from './sim';
import { defaultPc, derive, KULLANICI, pcWith, type DosyaGirdi, type WinPc } from './winpc';

export type FlashId = 'mavi' | 'turuncu';
export interface Flash {
  id: FlashId;
  ad: string;
  kapasite: string;
  etiket: string;
  icerik: 'veri' | 'win11' | 'ubuntu';
  bolum?: 'GPT' | 'MBR';
  /** Bellekteki dosyalar (göreli yol → girdi) */
  dosyalar: Record<string, DosyaGirdi>;
}
export interface KhState {
  bios: BiosState;
  portlar: (FlashId | null)[];
  flash: Record<FlashId, Flash>;
  diskler: Disk[];
  /** Diskteki Windows: eski (format öncesi), yeni (temiz kurulum) ya da yok */
  windows: 'eski' | 'yeni' | null;
  kurulum: WinSetupState | null;
  /** Ubuntu kurulum sihirbazı (USB'den Ubuntu ile açılınca) */
  ukur: UbuntuKurState | null;
  /** Kurulu Ubuntu (kabuk durumu ve hesap) */
  ubuntu: { hesap: { ad: string; kullanici: string; bilgisayar: string; parola: string }; sh: ShellState; wifi: string } | null;
  /** Diskten açılışta hangi önyükleyici çalışır: son kurulan sistemin önyükleyicisi */
  onyukleyici: 'windows' | 'grub';
  /** Şu an çalışan sistem (GRUB'dan seçilen) */
  calisan: 'windows' | 'ubuntu' | null;
  /** Windows oturum parolası (kurulumda belirlenen; boşsa parola yok) */
  winParola: string;
  /** Kurulumdan sonraki ilk açılış ("Merhaba" ekranları) */
  winIlk: boolean;
  pc: WinPc;
  /** Okul ağındaki PXE sunucusu ve kasanın ağ kablosu (eski kayıtlarda yok → pxeDurum) */
  pxe?: PxeState;
  iz: { usbAcilis: boolean; temiz: boolean; kurulumSayisi: number; turuncuSilindi: boolean; grubAcilan: string[]; yazilan?: string[]; pxeKurulum?: boolean };
}

export type PxeImaj = 'windows' | 'ubuntu';
export interface PxeState {
  /** Kasanın arkasındaki ağ (RJ45) kablosu takılı mı */
  kablo: boolean;
  dhcp: boolean;
  tftp: boolean;
  imajlar: PxeImaj[];
  /** Bu açılışta PXE menüsünden seçilen kurulum (yeniden başlatınca sıfırlanır) */
  kaynak: PxeImaj | null;
  gunluk: string[];
}
export const PXE_SUNUCU = { ad: 'SSEML-SRV01', ip: '192.168.1.10', istemciIp: '192.168.1.57', mac: '3C-7C-3F-1A-22-5E', dosya: 'ipxe.efi' };
export const PXE_IMAJ: Record<PxeImaj, { ad: string; dosyalar: string; boyut: string }> = {
  windows: { ad: 'Windows 11 Pro 24H2 (WDS)', dosyalar: 'boot.wim + install.wim', boyut: '5,4 GB' },
  ubuntu: { ad: 'Ubuntu 24.04.1 LTS Desktop', dosyalar: 'casper/vmlinuz + initrd + ISO (HTTP)', boyut: '5,8 GB' },
};
export function pxeDurum(st: KhState): PxeState {
  return st.pxe ?? { kablo: false, dhcp: true, tftp: false, imajlar: [], kaynak: null, gunluk: [] };
}
const saatDamga = () => new Date().toLocaleTimeString('tr-TR');
export function pxeGunluk(st: KhState, satir: string): KhState {
  const p = pxeDurum(st);
  return { ...st, pxe: { ...p, gunluk: [...p.gunluk, `${saatDamga()}  ${satir}`].slice(-40) } };
}
export function pxeGuncelle(st: KhState, fn: (p: PxeState) => PxeState): KhState {
  return { ...st, pxe: fn(pxeDurum(st)) };
}
/** PXE açılışının sonucu: hata kodu ya da menü */
export function pxeSonuc(st: KhState): { hata: string | null; satirlar: string[] } {
  const p = pxeDurum(st);
  const s = ['>>Checking Media Presence......'];
  if (!p.kablo) return { hata: 'kablo', satirlar: [...s, '>>Media Not Present', 'PXE-E61: Media test failure, check cable.'] };
  s.push('>>Media Present......', '>>Start PXE over IPv4.');
  if (!p.dhcp) return { hata: 'dhcp', satirlar: [...s, '  PXE-E51: No DHCP or proxyDHCP offers were received.'] };
  s.push(`  Station IP address is ${PXE_SUNUCU.istemciIp}`, '', `  Server IP address is ${PXE_SUNUCU.ip}`, `  NBP filename is ${PXE_SUNUCU.dosya}`, '  NBP filesize is 1048576 Bytes');
  if (!p.tftp) return { hata: 'tftp', satirlar: [...s, '>>Checking Media Presence......', '>>Media Present......', '  Downloading NBP file...', '', '  PXE-E32: TFTP open timeout.'] };
  s.push('>>Checking Media Presence......', '>>Media Present......', '  Downloading NBP file...', '', '  Succeed to download NBP file.');
  return { hata: null, satirlar: s };
}

/** Masaüstündeki kısa kılavuz (Not Defteri'nde açılır) */
export const OKU_BENI = [
  'KUM HAVUZU — KISA KILAVUZ',
  '=========================',
  'Bu bilgisayar yavaşladı ve virüs bulaştı. Görevin: belgeleri yedekle, Windows 11\'i',
  'temiz kur, internete bağlan ve programları yükle. Puan yok, istediğin gibi dene.',
  '',
  '1) YEDEK    Belgeler klasöründeki dosyaları turuncu USB belleğe (E:) sürükle.',
  '2) İNDİR    Tarayıcının arama kutusuna yaz:',
  '              Windows 11 kalıbı (ISO) .... windows 11',
  '              USB hazırlama aracı ........ rufus',
  '              Google Chrome .............. chrome',
  '              Microsoft Office ........... microsoft office',
  '              WinRAR ..................... winrar',
  '              Adobe Acrobat Reader ....... acrobat reader',
  '              Ubuntu ..................... ubuntu',
  '            "Reklam" etiketli ve "crack" sitelerinden indirme yapma!',
  '3) USB      Rufus ile mavi belleğe Windows 11 ISO dosyasını yaz (GPT).',
  '4) KUR      Yeniden başlat; açılışta F8 ile USB\'yi seç (BIOS için Del).',
  '            Disk ekranında eski Windows bölümünü sil ya da biçimlendir.',
  '5) SONRA    Wi-Fi\'ye bağlan, Windows Update, Chrome, WinRAR, Office (etkinleştir),',
  '            belgeleri geri yükle. İstersen Ubuntu\'yu Windows\'un yanına kur.',
  '',
  'Ürün anahtarları kasanın yanındaki etiketlerde, Wi-Fi şifresi sarı notta.',
  'İpucu: Sağ tık menüleri çalışır; dosyaları fareyle seçip sürükleyebilirsin.',
  'Komut İstemi ve PowerShell Başlat menüsündedir (dir, cd, ipconfig, ping…).',
  '',
  '---',
  'Bu simülatör tamamen eğitim amaçlıdır; gerçek bir bilgisayarda değişiklik yapmaz.',
  'Windows, Office, Edge, Chrome, Google, Bing, WinRAR, Adobe, Ubuntu ve diğer ürün',
  'adları ile logoların hakları ilgili sahiplerine aittir.',
  'Simgeler: Iconify (SVG Logos, VS Code Icons, Microsoft Fluent UI). Hazırlayan: mkcaglar.com',
].join('\r\n');

export const URUN_ANAHTARI = 'VK7JG-NPHTM-C97JM-9MPGT-3V66T';
export const WIFI = [
  { ssid: 'OKUL-LAB', sifre: 'Kibris2026', guc: 4 },
  { ssid: 'OKUL-MISAFIR', sifre: '', guc: 2 },
  { ssid: 'Kafe_5G', sifre: 'kahve123', guc: 1 },
];
const BELGE = `${KULLANICI}/Belgeler`;
export const ONEMLI_DOSYA = 'proje-odevi.docx';

export const BILGI = { anakart: 'ASUS PRIME B560M-A', bios: '1601 x64', islemci: 'Intel(R) Core(TM) i5-10400 CPU @ 2.90GHz', bellek: '16384 MB (DDR4)' };
const CMOS = { tarih: '2026-03-02', saat: '09:40:00', bootOrder: ['ssd', 'usb', 'pxe'], sata: 'AHCI' as const, vt: false, ses: true, lan: true, fastBoot: false, usbBoot: true, csm: false, adminSifre: false, secureBoot: true, tpm: true };

export const OFFICE_ANAHTARI = 'NKJ7P-W3QXV-8TRMB-H9D4C-2YF6G';

const UBUNTU_USB: Record<string, DosyaGirdi> = {
  boot: { tur: 'klasor' },
  casper: { tur: 'klasor' },
  'casper/filesystem.squashfs': { tur: 'dosya', boyut: '5,3 GB' },
  EFI: { tur: 'klasor' },
  pool: { tur: 'klasor' },
  'md5sum.txt': { tur: 'dosya', boyut: '28 KB' },
};

const WIN11_USB: Record<string, DosyaGirdi> = {
  boot: { tur: 'klasor' },
  efi: { tur: 'klasor' },
  sources: { tur: 'klasor' },
  'sources/install.wim': { tur: 'dosya', boyut: '5,2 GB' },
  'setup.exe': { tur: 'dosya', boyut: '98 KB' },
  'autorun.inf': { tur: 'dosya', boyut: '1 KB' },
  'bootmgr.efi': { tur: 'dosya', boyut: '1,9 MB' },
};

const AYGIT_WIFI = { id: 'wifi', kategori: 'Ağ bağdaştırıcıları', ad: 'Intel(R) Wi-Fi 6 AX201 160MHz', durum: 'ok' as const };

/** Format öncesi: yavaş, reklamlı, truva atlı eski Windows; kullanıcının önemli belgeleri C: sürücüsünde */
function eskiPc(): WinPc {
  return pcWith({
    cihaz: { ad: 'OFIS-PC', surum: 'Windows 11 Home', yapi: '22H2 (İşletim sistemi derlemesi 22621.525)' },
    ag: { kablo: false, wifi: 'OKUL-LAB' },
    zararli: ['trojan'],
    belirti: { reklam: true },
    aygitlar: [...defaultPc().aygitlar, AYGIT_WIFI],
    fs: {
      'C:/Windows': { tur: 'klasor' },
      'C:/Windows/System32': { tur: 'klasor' },
      'C:/Windows/System32/svchost32.exe': { tur: 'dosya', boyut: '1,2 MB', tehdit: 'Trojan:Win32/CoinMiner.AB!MTB' },
      [`${BELGE}/${ONEMLI_DOSYA}`]: { tur: 'dosya', boyut: '2,4 MB' },
      [`${BELGE}/butce-2026.xlsx`]: {
        tur: 'dosya',
        boyut: '58 KB',
        tablo: { A1: 'Gider', B1: 'Ocak', C1: 'Şubat', A2: 'Kira', B2: '12000', C2: '12000', A3: 'Elektrik', B3: '1850', C3: '2140', A4: 'İnternet', B4: '650', C4: '650', A5: 'Kırtasiye', B5: '420', C5: '980', A6: 'Toplam' },
      },
      [`${BELGE}/sunum-isletim-sistemleri.pptx`]: { tur: 'dosya', boyut: '6,1 MB' },
      [`${KULLANICI}/Resimler/girne-gezisi.jpg`]: { tur: 'dosya', boyut: '3,2 MB' },
      [`${KULLANICI}/Masaüstü/OKU-BENİ.txt`]: { tur: 'dosya', boyut: '2 KB', icerik: OKU_BENI },
    },
    surecler: [
      { id: 'explorer', ad: 'Windows Gezgini', cpu: 0.6, ram: 92, sistem: true },
      { id: 'svchost32', ad: 'svchost32.exe', cpu: 61.0, ram: 1380 },
      { id: 'booster', ad: 'PC Speed Booster', cpu: 9.4, ram: 330 },
      { id: 'msedge', ad: 'Microsoft Edge (9)', cpu: 4.2, ram: 1210 },
      { id: 'antimalware', ad: 'Antimalware Service Executable', cpu: 0.4, ram: 180, sistem: true },
    ],
    baslangic: [
      { id: 'svchost32', ad: 'svchost32', yayinci: '', etki: 'Yüksek', acik: true },
      { id: 'booster', ad: 'PC Speed Booster', yayinci: 'Speedy Soft Ltd', etki: 'Yüksek', acik: true },
      { id: 'onedrive', ad: 'Microsoft OneDrive', yayinci: 'Microsoft Corporation', etki: 'Yüksek', acik: true },
      { id: 'security', ad: 'Windows Security notification icon', yayinci: 'Microsoft Corporation', etki: 'Düşük', acik: true },
    ],
    uygulamalar: [
      { id: 'edge', ad: 'Microsoft Edge', yayinci: 'Microsoft Corporation', surum: '122.0.2365.66', boyutMB: 520 },
      { id: 'booster', ad: 'PC Speed Booster', yayinci: 'Speedy Soft Ltd', surum: '3.1.0', boyutMB: 96, kaynak: 'sahte' },
    ],
  });
}

function silTanimsiz(pc: WinPc): WinPc {
  delete pc.fs[`${BELGE}/ders-notlari.docx`];
  delete pc.fs[`${KULLANICI}/Resimler/girne.jpg`];
  return derive(pc);
}

/** Temiz kurulumdan sonraki ilk Windows: sürücüler eksik, Wi-Fi'ye yeniden bağlanılmalı */
export function yeniPc(k: WinSetupState, eski: WinPc | null): WinPc {
  const pc = defaultPc();
  const ad = k.oobe.kullanici || 'Ogrenci';
  pc.cihaz = { ...pc.cihaz, ad: k.oobe.cihazAdi || 'DESKTOP-7Q2K9LM', kullanici: ad, surum: k.surum ?? 'Windows 11 Pro' };
  pc.hesaplar = [{ ad, tur: 'yonetici', parola: k.oobe.parola }];
  pc.uygulamalar = pc.uygulamalar.filter((u) => u.id === 'edge');
  pc.baslangic = pc.baslangic.filter((b) => b.id === 'security' || b.id === 'onedrive');
  pc.surecler = pc.surecler.filter((s) => s.sistem);
  pc.guvenlik.tanimlarGuncel = false;
  pc.ag = { kablo: false, wifi: k.oobe.ag.startsWith('wifi:') ? k.oobe.ag.slice(5) : '' };
  pc.aygitlar = [
    { id: 'cpu', kategori: 'İşlemciler', ad: BILGI.islemci, durum: 'ok' },
    { id: 'disk', kategori: 'Disk sürücüleri', ad: 'Samsung SSD 870 EVO 500GB', durum: 'ok' },
    { id: 'chipset', kategori: 'Sistem aygıtları', ad: 'Intel(R) 400 Series Chipset Family SMBus', bilinmeyenAd: 'SM Veri Yolu Denetleyicisi', durum: 'surucu-yok', surucu: 'chipset' },
    { id: 'gpu', kategori: 'Görüntü bağdaştırıcıları', ad: 'NVIDIA GeForce GTX 1650', bilinmeyenAd: 'Microsoft Temel Görüntü Bağdaştırıcısı', durum: 'surucu-yok', surucu: 'vga' },
    { id: 'ses', kategori: 'Ses, video ve oyun denetleyicileri', ad: 'Realtek High Definition Audio', bilinmeyenAd: 'Yüksek Tanımlı Ses Veri Yolundaki Ses Aygıtı', durum: 'surucu-yok', surucu: 'ses' },
    { id: 'lan', kategori: 'Ağ bağdaştırıcıları', ad: 'Realtek PCIe GbE Family Controller', durum: 'ok' },
    { ...AYGIT_WIFI },
    { id: 'klavye', kategori: 'Klavyeler', ad: 'HID Klavye Aygıtı', durum: 'ok' },
    { id: 'fare', kategori: 'Fareler ve diğer işaret aygıtları', ad: 'HID uyumlu fare', durum: 'ok' },
  ];
  // Temiz kurulumda kişisel klasörler boştur
  for (const key of Object.keys(pc.fs)) if (key.startsWith(KULLANICI + '/') && pc.fs[key].tur === 'dosya') delete pc.fs[key];
  pc.fs[`${KULLANICI}/Masaüstü/OKU-BENİ.txt`] = { tur: 'dosya', boyut: '2 KB', icerik: OKU_BENI };
  // Bölüm biçimlendirilmeden kurulduysa eski Windows dosyaları Windows.old klasörüne taşınır
  if (eski && !k.ozet.temiz) {
    pc.fs['C:/Windows.old'] = { tur: 'klasor' };
    for (const [p, f] of Object.entries(eski.fs)) if (p.startsWith(KULLANICI)) pc.fs['C:/Windows.old/' + p.slice(3)] = { ...f };
    pc.fs['C:/Windows.old/Kullanıcılar'] = { tur: 'klasor' };
  }
  return derive(pc);
}

export function ilkDurum(): KhState {
  return {
    bios: { ekran: 'kapali', cmos: { ...CMOS, bootOrder: [...CMOS.bootOrder] }, setup: null, sifreDeger: null, sonAcilis: null, donanim: {}, cevaplar: {} },
    portlar: [null, null, null],
    flash: {
      mavi: { id: 'mavi', ad: 'SanDisk Cruzer Blade', kapasite: '32 GB', etiket: 'SANDISK', icerik: 'veri', dosyalar: {} },
      turuncu: {
        id: 'turuncu',
        ad: 'Kingston DataTraveler',
        kapasite: '64 GB',
        etiket: 'KINGSTON',
        icerik: 'veri',
        dosyalar: { Müzik: { tur: 'klasor' }, 'Müzik/kibris-turkusu.mp3': { tur: 'dosya', boyut: '4,8 MB' }, 'tarih-odevi.docx': { tur: 'dosya', boyut: '310 KB' } },
      },
    },
    diskler: [
      {
        id: 'd0',
        bolumler: [
          { id: 'k', tur: 'kurtarma', boyutGB: 0.75 },
          { id: 's', tur: 'sistem', boyutGB: 0.1 },
          { id: 'm', tur: 'msr', boyutGB: 0.016 },
          { id: 'c', tur: 'birincil', boyutGB: 464.9, etiket: 'Windows', windows: true, veri: true, kisisel: true, aciklama: 'eski Windows ve kullanıcının belgeleri' },
        ],
      },
    ],
    windows: 'eski',
    kurulum: null,
    ukur: null,
    ubuntu: null,
    onyukleyici: 'windows',
    calisan: null,
    winParola: '',
    winIlk: false,
    pc: silTanimsiz(eskiPc()),
    iz: { usbAcilis: false, temiz: false, kurulumSayisi: 0, turuncuSilindi: false, grubAcilan: [] },
  };
}

/** Takılı belleklere sürücü harfi: takıldıkları giriş sırasıyla E:, F:, G: */
export function harfler(st: KhState): Partial<Record<FlashId, string>> {
  const out: Partial<Record<FlashId, string>> = {};
  let i = 0;
  for (const id of st.portlar) if (id) out[id] = 'EFG'[i++] + ':';
  return out;
}

/** Windows'un gördüğü bilgisayar: kurulu sistem + takılı USB bellekler */
export function bagla(pc: WinPc, st: KhState): WinPc {
  const out: WinPc = JSON.parse(JSON.stringify(pc));
  for (const [id, h] of Object.entries(harfler(st)) as [FlashId, string][]) {
    const f = st.flash[id];
    out.fs[h] = { tur: 'klasor', boyut: f.etiket };
    for (const [rel, g] of Object.entries(f.dosyalar)) out.fs[`${h}/${rel}`] = { ...g };
  }
  return derive(out);
}

/** Windows'ta yapılan değişikliği geri ayırır: USB belleklerdeki dosyalar belleğe, gerisi diske */
export function ayir(st: KhState, pcBagli: WinPc): KhState {
  const h = harfler(st);
  const pc: WinPc = JSON.parse(JSON.stringify(pcBagli));
  const flash = { ...st.flash };
  for (const [id, harf] of Object.entries(h) as [FlashId, string][]) {
    const dosyalar: Record<string, DosyaGirdi> = {};
    for (const k of Object.keys(pc.fs)) {
      if (k === harf) delete pc.fs[k];
      else if (k.startsWith(harf + '/')) {
        dosyalar[k.slice(harf.length + 1)] = pc.fs[k];
        delete pc.fs[k];
      }
    }
    flash[id] = { ...flash[id], dosyalar };
  }
  return { ...st, pc: derive(pc), flash };
}

/** Rufus yazdı: bellek biçimlendirilir ve Windows 11 kurulum belleği olur */
export function rufusYaz(st: KhState, id: FlashId, bolum: string, iso = 'Win11'): KhState {
  const f = st.flash[id];
  const turuncuSilindi = st.iz.turuncuSilindi || (id === 'turuncu' && Object.keys(f.dosyalar).length > 0 && f.icerik === 'veri');
  const ubuntu = /ubuntu/i.test(iso);
  return {
    ...st,
    flash: {
      ...st.flash,
      [id]: { ...f, icerik: ubuntu ? 'ubuntu' : 'win11', bolum: bolum === 'GPT' ? 'GPT' : 'MBR', etiket: ubuntu ? 'Ubuntu 24.04.1 LTS amd64' : 'CCCOMA_X64FRE', dosyalar: { ...(ubuntu ? UBUNTU_USB : WIN11_USB) } },
    },
    iz: { ...st.iz, turuncuSilindi, yazilan: [...new Set([...(st.iz.yazilan ?? []), ubuntu ? 'ubuntu' : 'win11'])] },
  };
}

export function windowsVar(st: KhState) {
  return st.windows !== null;
}

/** BIOS'un gördüğü aygıtlar (USB, takılı belleğe göre) */
export function biosVeri(st: KhState): BiosVeri {
  const takili = st.portlar.filter((x): x is FlashId => !!x).map((id) => st.flash[id]);
  const kurulumBellegi = takili.find((f) => f.icerik !== 'veri');
  const c = st.bios.cmos;
  // GPT (UEFI) bellek CSM kapalıyken, MBR bellek CSM açıkken önyüklenir
  const uyumlu = !!kurulumBellegi && (kurulumBellegi.bolum === 'GPT' ? !c.csm : c.csm);
  const usbAd = takili.length ? (kurulumBellegi ? `${kurulumBellegi.bolum === 'GPT' ? 'UEFI: ' : ''}${kurulumBellegi.ad} ${kurulumBellegi.kapasite}, Partition 1` : `${takili[0].ad} ${takili[0].kapasite}`) : 'USB (takılı aygıt yok)';
  return {
    cmos: c,
    aygitlar: [
      { id: 'ssd', ad: st.onyukleyici === 'grub' && st.ubuntu ? 'ubuntu (Samsung SSD 870 EVO 500GB)' : windowsVar(st) ? 'Windows Boot Manager (Samsung SSD 870 EVO 500GB)' : 'Samsung SSD 870 EVO 500GB' },
      { id: 'usb', ad: usbAd },
      ...(c.lan ? [{ id: 'pxe', ad: 'UEFI: PXE IPv4 Realtek PCIe GbE Family Controller' }] : []),
    ],
    usbTakili: uyumlu,
    pxe: true,
    bilgi: BILGI,
  };
}

export function kurulumVeri(st: KhState): WinSetupVeri {
  return { anahtar: URUN_ANAHTARI, surum: 'Windows 11 Pro', diskler: st.diskler, wifi: WIFI };
}

/** Kurulum ekranından çıkılınca (kapatma, reset, kurulum bitişi) disk değişiklikleri kalıcı olur */
export function kurulumuIsle(st: KhState): KhState {
  const k = st.kurulum;
  if (!k) return st;
  if (k.kurulum === 'tamam' && k.adim === 'bitti') {
    const eski = st.windows === 'eski' ? st.pc : null;
    // Windows'un kurulduğu bölüm artık sistem dosyaları içerir
    const diskler = k.diskler.map((d) => ({ ...d, bolumler: d.bolumler.map((b) => (b.id === k.hedef?.bolum ? { ...b, veri: true } : b)) }));
    return {
      ...st,
      diskler,
      windows: 'yeni',
      kurulum: null,
      // Windows kurulumu önyükleyiciyi kendine çevirir: GRUB menüsü artık görünmez
      onyukleyici: 'windows',
      winParola: k.oobe.parolaDeger ?? '',
      winIlk: true,
      ubuntu: ubuntuBolumuVar(diskler) ? st.ubuntu : null,
      pc: yeniPc(k, eski),
      iz: { ...st.iz, temiz: k.ozet.temiz, kurulumSayisi: st.iz.kurulumSayisi + 1 },
    };
  }
  // Yarım kalan kurulum: bölüm silindi/biçimlendirildiyse ya da kopyalama başladıysa Windows artık açılmaz
  const bozuldu = k.adim === 'yukleniyor' || k.kurulum === 'tamam' || !k.diskler.some((d) => d.bolumler.some((b) => b.windows && b.veri));
  return { ...st, diskler: k.diskler, kurulum: null, windows: bozuldu ? null : st.windows, ubuntu: ubuntuBolumuVar(k.diskler) ? st.ubuntu : null };
}

export function ubuntuBolumuVar(d: Disk[]) {
  return d.some((x) => x.bolumler.some((b) => b.tur === 'linux' && b.baglama === '/'));
}

/** Açılış belleği: takılı ilk kurulum belleği */
export function bootBellegi(st: KhState): Flash | undefined {
  return st.portlar.filter((x): x is FlashId => !!x).map((id) => st.flash[id]).find((f) => f.icerik !== 'veri');
}

// ---------- Ubuntu kurulumu ile disk dönüşümü ----------
export function ubuntuParcalari(d: Disk[]): Part[] {
  let n = 0;
  return d[0].bolumler.map((b) => {
    if (b.tur === 'ayrilmamis') return { id: b.id, ad: 'boş alan', boyutGB: b.boyutGB, fs: 'bos' as const, baglama: null, bicimlendir: false };
    n++;
    const ad = `/dev/sda${n}`;
    if (b.tur === 'sistem') return { id: b.id, ad, boyutGB: b.boyutGB, fs: 'fat32' as const, baglama: null, bicimlendir: false, mevcut: true, etiket: 'EFI' };
    if (b.tur === 'linux') return { id: b.id, ad, boyutGB: b.boyutGB, fs: b.fs ?? 'ext4', baglama: null, bicimlendir: false, mevcut: true, etiket: b.etiket };
    const etiket = b.tur === 'msr' ? 'Microsoft reserved' : b.tur === 'kurtarma' ? 'Kurtarma' : b.etiket;
    return { id: b.id, ad, boyutGB: b.boyutGB, fs: 'ntfs' as const, baglama: null, bicimlendir: false, mevcut: true, etiket, windows: !!b.windows && !!b.veri };
  });
}

export function parcalardanDisk(parcalar: Part[], once: Disk[]): Disk[] {
  const eski = new Map(once[0].bolumler.map((b) => [b.id, b] as const));
  const bolumler: Bolum[] = parcalar.map((p) => {
    const o = eski.get(p.id);
    if (p.fs === 'bos') return { id: p.id, tur: 'ayrilmamis', boyutGB: p.boyutGB };
    if (o && !p.bicimlendir) return { ...o, boyutGB: p.boyutGB, ...(o.tur === 'linux' && p.baglama ? { baglama: p.baglama } : {}) };
    if (p.fs === 'fat32') return { id: p.id, tur: 'sistem', boyutGB: p.boyutGB };
    return { id: p.id, tur: 'linux', boyutGB: p.boyutGB, fs: p.fs === 'swap' ? 'swap' : 'ext4', baglama: p.baglama ?? undefined, etiket: p.baglama === '/' ? 'Ubuntu' : (p.baglama ?? undefined) };
  });
  return [{ id: once[0].id, bolumler }];
}

export function ubuntuKurulumVeri(st: KhState): UbuntuVeri {
  const parcalar = ubuntuParcalari(st.diskler);
  return { disk: { ad: '/dev/sda Samsung SSD 870 EVO 500GB', boyutGB: 465.8, bolumler: parcalar }, windowsVar: parcalar.some((p) => p.windows), wifi: WIFI };
}

/** Ubuntu kurulumundan çıkılınca: kurulum bittiyse disk + Ubuntu + GRUB kalıcı olur */
export function ubuntuKurulumuIsle(st: KhState): KhState {
  const u = st.ukur;
  if (!u) return st;
  const basladi = u.kurulum === 'tamam' || u.adim === 'kuruluyor';
  if (!basladi) return { ...st, ukur: null };
  const diskler = parcalardanDisk(u.bolumler, st.diskler);
  const winVar = diskler[0].bolumler.some((b) => b.windows && b.veri);
  if (u.kurulum !== 'tamam') return { ...st, ukur: null, diskler, windows: winVar ? st.windows : null, ubuntu: null };
  const k = u.hesap.kullanici || 'ogrenci';
  const sh = defaultShell(k, u.hesap.bilgisayar || 'ubuntu-pc');
  return {
    ...st,
    ukur: null,
    diskler,
    windows: winVar ? st.windows : null,
    onyukleyici: 'grub',
    ubuntu: {
      hesap: { ad: u.hesap.ad, kullanici: k, bilgisayar: u.hesap.bilgisayar, parola: u.hesap.parolaDeger ?? '' },
      // Kurulum os-prober ile diğer sistemleri bulur ve GRUB menüsüne ekler
      sh: {
        ...sh,
        history: [],
        grub: { windows: winVar, osProber: true },
        sistem: { ...sh.sistem, disk: '465.8G', ag: 'Intel Corporation Wi-Fi 6 AX201', ram: '15.5Gi' },
        bolumler: diskler[0].bolumler
          .filter((b) => b.tur !== 'ayrilmamis')
          .map((b) => ({
            boyut: b.boyutGB < 1 ? `${Math.round(b.boyutGB * 1024)}M` : `${b.boyutGB.toFixed(1)}G`,
            baglama: b.tur === 'sistem' ? '/boot/efi' : b.tur === 'linux' ? (b.fs === 'swap' ? '[SWAP]' : (b.baglama ?? '')) : '',
          })),
      },
      wifi: u.ayar.ag.startsWith('wifi:') ? u.ayar.ag.slice(5) : '',
    },
  };
}

/** İsteğe bağlı yapılacaklar (puan yok) */
export function yapilacaklar(st: KhState): { id: string; metin: string; tamam: boolean }[] {
  const yeni = st.windows === 'yeni';
  const pc = st.pc;
  const yedek = Object.keys(st.flash.turuncu.dosyalar).some((k) => k.endsWith(ONEMLI_DOSYA)) || Object.keys(st.flash.mavi.dosyalar).some((k) => k.endsWith(ONEMLI_DOSYA));
  return [
    { id: 'yedek', metin: "Kullanıcının belgeleri bir flash belleğe yedeklendi", tamam: yedek },
    { id: 'usb', metin: 'Windows 11 kurulum belleği hazırlandı (Rufus)', tamam: !!st.iz.yazilan?.includes('win11') || st.flash.mavi.icerik === 'win11' || st.flash.turuncu.icerik === 'win11' },
    { id: 'acilis', metin: 'Bilgisayar USB bellekten açıldı', tamam: st.iz.usbAcilis },
    { id: 'kurulum', metin: 'Windows 11 temiz kuruldu (eski bölüm silindi/biçimlendirildi)', tamam: yeni && st.iz.temiz },
    { id: 'wifi', metin: 'Kablosuz ağa bağlanıldı (OKUL-LAB)', tamam: yeni && pc.internet },
    { id: 'update', metin: 'Windows Update: sürücüler ve güncelleştirmeler yüklendi', tamam: yeni && pc.sorunluAygitlar.length === 0 && pc.guvenlik.tanimlarGuncel },
    { id: 'chrome', metin: 'Google Chrome resmî siteden kuruldu', tamam: yeni && pc.kurulu.includes('chrome') && !pc.sahteKaynakli.includes('chrome') },
    { id: 'winrar', metin: 'WinRAR resmî siteden kuruldu', tamam: yeni && pc.kurulu.includes('winrar') && !pc.sahteKaynakli.includes('winrar') },
    { id: 'varsayilan', metin: 'Chrome varsayılan tarayıcı yapıldı', tamam: yeni && pc.varsayilan.tarayici === 'chrome' },
    { id: 'geri', metin: 'Belgeler yeni Windows\'a geri yüklendi', tamam: yeni && pc.dosyalar.some((k) => k.startsWith(BELGE + '/') && k.endsWith(ONEMLI_DOSYA) && !/\.(rar|zip)\//i.test(k)) },
    { id: 'guvenlik', metin: "Windows Güvenliği'nde uyarı yok", tamam: yeni && pc.uyariSayisi === 0 && pc.zararli.length === 0 },
    { id: 'office', metin: 'Microsoft Office kuruldu ve ürün anahtarıyla etkinleştirildi', tamam: yeni && pc.etkinUygulamalar.includes('office') },
    { id: 'winrar-arsiv', metin: 'WinRAR ile bir arşiv (.rar) oluşturuldu', tamam: yeni && pc.dosyalar.some((k) => /\.rar$/i.test(k) && pc.fs[k]?.arsiv === 'rar') },
    { id: 'excel', metin: "Excel'de formüllü bir tablo kaydedildi", tamam: yeni && Object.values(pc.fs).some((f) => f.tablo && Object.values(f.tablo).some((v) => /^=/.test(v))) },
    { id: 'ubuntu', metin: "Ubuntu, Windows'un yanına kuruldu (çift önyükleme)", tamam: !!st.ubuntu && windowsVar(st) && st.ubuntu.sh.grub.windows },
    { id: 'grub', metin: 'GRUB menüsünden hem Ubuntu hem Windows açıldı', tamam: st.iz.grubAcilan.includes('ubuntu') && st.iz.grubAcilan.includes('windows') },
    { id: 'pxe', metin: 'PXE sunucusu hazırlandı ve bilgisayar ağdan (PXE) kuruluma açıldı', tamam: !!st.iz.pxeKurulum },
  ];
}

/** Üst simülasyonun bir parçasını alt bileşene ayrı bir Sim gibi verir */
export function altSim<P, S>(ust: Sim<P>, al: (p: P) => S, koy: (p: P, s: S) => P): Sim<S> {
  return {
    state: al(ust.state),
    events: ust.events,
    act: (type, data, update) => ust.act(type, data, (p) => koy(p, update(al(p)))),
    restore: () => undefined,
    elapsedMs: ust.elapsedMs,
  };
}
