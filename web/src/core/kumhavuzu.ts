// Serbest kum havuzu: tek bir gerçekçi bilgisayar. Güç/reset düğmeleri, 3 USB girişi, 2 flash bellek,
// BIOS, USB'den önyükleme, Windows 11 kurulumu ve kurulu Windows. Puan yok; isteğe bağlı yapılacaklar listesi var.
import type { BiosState, BiosVeri } from '../tasks/PcBios';
import type { Disk, WinSetupState, WinSetupVeri } from '../tasks/WinSetup';
import type { Sim } from './sim';
import { defaultPc, derive, KULLANICI, pcWith, type DosyaGirdi, type WinPc } from './winpc';

export type FlashId = 'mavi' | 'turuncu';
export interface Flash {
  id: FlashId;
  ad: string;
  kapasite: string;
  etiket: string;
  icerik: 'veri' | 'win11';
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
  pc: WinPc;
  iz: { usbAcilis: boolean; temiz: boolean; kurulumSayisi: number; turuncuSilindi: boolean };
}

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
      [`${BELGE}/butce-2026.xlsx`]: { tur: 'dosya', boyut: '58 KB' },
      [`${BELGE}/sunum-isletim-sistemleri.pptx`]: { tur: 'dosya', boyut: '6,1 MB' },
      [`${KULLANICI}/Resimler/girne-gezisi.jpg`]: { tur: 'dosya', boyut: '3,2 MB' },
      [`${KULLANICI}/Masaüstü/OKU-BENİ.txt`]: { tur: 'dosya', boyut: '1 KB' },
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
  for (const key of Object.keys(pc.fs)) if (pc.fs[key].tur === 'dosya') delete pc.fs[key];
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
    pc: silTanimsiz(eskiPc()),
    iz: { usbAcilis: false, temiz: false, kurulumSayisi: 0, turuncuSilindi: false },
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
export function rufusYaz(st: KhState, id: FlashId, bolum: string): KhState {
  const f = st.flash[id];
  const turuncuSilindi = st.iz.turuncuSilindi || (id === 'turuncu' && Object.keys(f.dosyalar).length > 0 && f.icerik === 'veri');
  return {
    ...st,
    flash: { ...st.flash, [id]: { ...f, icerik: 'win11', bolum: bolum === 'GPT' ? 'GPT' : 'MBR', etiket: 'CCCOMA_X64FRE', dosyalar: { ...WIN11_USB } } },
    iz: { ...st.iz, turuncuSilindi },
  };
}

export function windowsVar(st: KhState) {
  return st.windows !== null;
}

/** BIOS'un gördüğü aygıtlar (USB, takılı belleğe göre) */
export function biosVeri(st: KhState): BiosVeri {
  const takili = st.portlar.filter((x): x is FlashId => !!x).map((id) => st.flash[id]);
  const kurulumBellegi = takili.find((f) => f.icerik === 'win11');
  const c = st.bios.cmos;
  // GPT (UEFI) bellek CSM kapalıyken, MBR bellek CSM açıkken önyüklenir
  const uyumlu = !!kurulumBellegi && (kurulumBellegi.bolum === 'GPT' ? !c.csm : c.csm);
  const usbAd = takili.length ? (kurulumBellegi ? `${kurulumBellegi.bolum === 'GPT' ? 'UEFI: ' : ''}${kurulumBellegi.ad} ${kurulumBellegi.kapasite}, Partition 1` : `${takili[0].ad} ${takili[0].kapasite}`) : 'USB (takılı aygıt yok)';
  return {
    cmos: c,
    aygitlar: [
      { id: 'ssd', ad: windowsVar(st) ? 'Windows Boot Manager (Samsung SSD 870 EVO 500GB)' : 'Samsung SSD 870 EVO 500GB' },
      { id: 'usb', ad: usbAd },
      { id: 'pxe', ad: 'UEFI: PXE IPv4 Realtek PCIe GbE Family Controller' },
    ],
    usbTakili: uyumlu,
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
    return {
      ...st,
      diskler: k.diskler,
      windows: 'yeni',
      kurulum: null,
      pc: yeniPc(k, eski),
      iz: { ...st.iz, temiz: k.ozet.temiz, kurulumSayisi: st.iz.kurulumSayisi + 1 },
    };
  }
  // Yarım kalan kurulum: bölüm silindi/biçimlendirildiyse ya da kopyalama başladıysa Windows artık açılmaz
  const bozuldu = k.adim === 'yukleniyor' || k.kurulum === 'tamam' || !k.diskler.some((d) => d.bolumler.some((b) => b.windows && b.veri));
  return { ...st, diskler: k.diskler, kurulum: null, windows: bozuldu ? null : st.windows };
}

/** İsteğe bağlı yapılacaklar (puan yok) */
export function yapilacaklar(st: KhState): { id: string; metin: string; tamam: boolean }[] {
  const yeni = st.windows === 'yeni';
  const pc = st.pc;
  const yedek = Object.keys(st.flash.turuncu.dosyalar).some((k) => k.endsWith(ONEMLI_DOSYA)) || Object.keys(st.flash.mavi.dosyalar).some((k) => k.endsWith(ONEMLI_DOSYA));
  return [
    { id: 'yedek', metin: "Kullanıcının belgeleri bir flash belleğe yedeklendi", tamam: yedek },
    { id: 'usb', metin: 'Windows 11 kurulum belleği hazırlandı (Rufus)', tamam: st.flash.mavi.icerik === 'win11' || st.flash.turuncu.icerik === 'win11' },
    { id: 'acilis', metin: 'Bilgisayar USB bellekten açıldı', tamam: st.iz.usbAcilis },
    { id: 'kurulum', metin: 'Windows 11 temiz kuruldu (eski bölüm silindi/biçimlendirildi)', tamam: yeni && st.iz.temiz },
    { id: 'wifi', metin: 'Kablosuz ağa bağlanıldı (OKUL-LAB)', tamam: yeni && pc.internet },
    { id: 'update', metin: 'Windows Update: sürücüler ve güncelleştirmeler yüklendi', tamam: yeni && pc.sorunluAygitlar.length === 0 && pc.guvenlik.tanimlarGuncel },
    { id: 'chrome', metin: 'Google Chrome resmî siteden kuruldu', tamam: yeni && pc.kurulu.includes('chrome') && !pc.sahteKaynakli.includes('chrome') },
    { id: 'winrar', metin: 'WinRAR resmî siteden kuruldu', tamam: yeni && pc.kurulu.includes('winrar') && !pc.sahteKaynakli.includes('winrar') },
    { id: 'varsayilan', metin: 'Chrome varsayılan tarayıcı yapıldı', tamam: yeni && pc.varsayilan.tarayici === 'chrome' },
    { id: 'geri', metin: 'Belgeler yeni Windows\'a geri yüklendi', tamam: yeni && pc.dosyalar.some((k) => k.startsWith(BELGE + '/') && k.endsWith(ONEMLI_DOSYA)) },
    { id: 'guvenlik', metin: "Windows Güvenliği'nde uyarı yok", tamam: yeni && pc.uyariSayisi === 0 && pc.zararli.length === 0 },
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
