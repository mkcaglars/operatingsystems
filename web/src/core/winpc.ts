// Sanal Windows 11 bilgisayarının durumu (İ6–İ8). Saf veri + yardımcı fonksiyonlar; arayüz win/ altında.
// Kurallar bu durumun yolları üzerinden denetlenir (ör. "pc.guc.uyku", "pc.kurulu", "pc.dosyalar").

export type Profil = 'etki' | 'ozel' | 'ortak';

export interface Surec {
  id: string;
  ad: string;
  cpu: number;
  ram: number; // MB
  sistem?: boolean;
}
export interface Baslangic {
  id: string;
  ad: string;
  yayinci: string;
  etki: 'Yüksek' | 'Orta' | 'Düşük';
  acik: boolean;
}
export interface Aygit {
  id: string;
  kategori: string;
  ad: string;
  durum: 'ok' | 'surucu-yok' | 'devre-disi' | 'cakisma';
  /** Kod 12: kaynak çakışması yaşadığı aygıt (o devre dışı kalınca bu çalışır) */
  cakisan?: string;
  /** Yeni yüklenen hatalı sürücü: normal açılışta mavi ekran verir */
  sorunluSurucu?: boolean;
  /** "Sürücüyü Geri Al" ile dönülebilecek önceki sürüm */
  oncekiSurucu?: string;
  surucuSurum?: string;
  /** sürücü yokken görünen ad (ör. "Ethernet Denetleyicisi") */
  bilinmeyenAd?: string;
  /** doğru sürücü klasörünün kimliği */
  surucu?: string;
}
export interface Uygulama {
  id: string;
  ad: string;
  yayinci: string;
  surum: string;
  boyutMB: number;
  bilesenler?: string[];
  etkin?: boolean;
  bozuk?: boolean;
  kaynak?: 'resmi' | 'sahte';
  dil?: string;
}
export interface DosyaGirdi {
  tur: 'klasor' | 'dosya';
  gizli?: boolean;
  boyut?: string;
  /** zararlı içerik adı (Defender bulur) */
  tehdit?: string;
  /** çalıştırılınca açılacak kurulum (katalog kimliği) */
  kurulum?: string;
  kaynak?: 'resmi' | 'sahte';
  /** indirme sayfasında işaretli bırakılan ek teklifler (ör. McAfee) */
  ekTeklifler?: string[];
  /** kurulum gerektirmeyen (taşınabilir) program: çift tıklayınca açılan uygulama (ör. rufus) */
  uygulama?: string;
  /** Sıkıştırılmış arşiv (içindekiler "arsiv.rar/dosya" yollarında durur) */
  arsiv?: 'rar' | 'zip';
  /** Parolalı arşiv */
  parola?: string;
  /** Excel çalışma kitabı hücreleri (A1 → ham değer/formül) */
  tablo?: Record<string, string>;
  /** Metin dosyası içeriği (Not Defteri) */
  icerik?: string;
}

export interface WinPc {
  cihaz: { ad: string; islemci: string; ram: string; depolama: string; ekranKarti: string; sistemTuru: string; surum: string; yapi: string; kullanici: string };
  ekran: { cozunurluk: string; olcek: number; metin: number; imlec: number; kontrast: boolean; tema: 'acik' | 'koyu'; arkaPlan: string };
  fare: { birincil: 'sol' | 'sag'; ciftTik: number; hiz: number };
  guc: { ekranKapat: number; uyku: number };
  baslangic: Baslangic[];
  surecler: Surec[];
  explorer: { uzanti: boolean; gizli: boolean };
  fs: Record<string, DosyaGirdi>;
  aygitlar: Aygit[];
  guvenlik: {
    gercekZaman: boolean;
    bulut: boolean;
    kurcalama: boolean;
    tanimlarGuncel: boolean;
    smartScreen: boolean;
    denetimliKlasor: boolean;
    korunan: string[];
    duvar: Record<Profil, boolean>;
    karantina: string[];
    izinVerilen: string[];
    sonTarama: '' | 'hizli' | 'tam' | 'ozel' | 'cevrimdisi';
  };
  hesaplar: { ad: string; tur: 'yonetici' | 'standart'; parola: boolean }[];
  geriYukleme: string[];
  uygulamalar: Uygulama[];
  varsayilan: { tarayici: string; pdf: string };
  zararli: string[];
  belirti: { reklam: boolean };
  /** Açılış durumu: normal masaüstü, mavi ekran, Windows Kurtarma Ortamı, Güvenli Mod */
  acilis: 'normal' | 'bsod' | 'kurtarma' | 'guvenli';
  /** "Bu bilgisayarı sıfırla" yapıldı mı ve nasıl */
  sifirlama: '' | 'koru' | 'hepsi';
  /** Ağ bağlantısı: Ethernet kablosu takılı mı, bağlı kablosuz ağ (SSID) */
  ag: { kablo: boolean; wifi: string };
  // ---- Kurallar için türetilmiş alanlar ----
  dosyalar: string[];
  kurulu: string[];
  etkinUygulamalar: string[];
  bozukUygulamalar: string[];
  sorunluAygitlar: string[];
  acikBaslangic: string[];
  surecAdlari: string[];
  yoneticiler: string[];
  standartlar: string[];
  duvarKapali: Profil[];
  uyariSayisi: number;
  sahteKaynakli: string[];
  bilesenler: Record<string, string[]>;
  devreDisi: string[];
  internet: boolean;
}

export const KULLANICI = 'C:/Kullanıcılar/Ogrenci';

const K = (): DosyaGirdi => ({ tur: 'klasor' });
const D = (boyut: string, gizli = false): DosyaGirdi => ({ tur: 'dosya', boyut, ...(gizli ? { gizli } : {}) });

/** Temiz bir Windows 11 kurulumunda C: sürücüsünde bulunan sistem klasörleri ve dosyaları */
export const SISTEM_FS: Record<string, DosyaGirdi> = {
  'C:/PerfLogs': K(),
  'C:/Program Files': K(),
  'C:/Program Files/Common Files': K(),
  'C:/Program Files/Internet Explorer': K(),
  'C:/Program Files/Windows Defender': K(),
  'C:/Program Files/Windows Defender/MsMpEng.exe': D('133 KB'),
  'C:/Program Files/Windows NT': K(),
  'C:/Program Files/WindowsApps': { tur: 'klasor', gizli: true },
  'C:/Program Files (x86)': K(),
  'C:/Program Files (x86)/Common Files': K(),
  'C:/Program Files (x86)/Microsoft': K(),
  'C:/Program Files (x86)/Microsoft/Edge': K(),
  'C:/Program Files (x86)/Microsoft/Edge/Application': K(),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe': D('4,1 MB'),
  'C:/ProgramData': { tur: 'klasor', gizli: true },
  'C:/Windows': K(),
  'C:/Windows/Boot': K(),
  'C:/Windows/Fonts': K(),
  'C:/Windows/Fonts/arial.ttf': D('1,0 MB'),
  'C:/Windows/Fonts/segoeui.ttf': D('972 KB'),
  'C:/Windows/System32': K(),
  'C:/Windows/System32/drivers': K(),
  'C:/Windows/System32/cmd.exe': D('323 KB'),
  'C:/Windows/System32/notepad.exe': D('201 KB'),
  'C:/Windows/System32/svchost.exe': D('79 KB'),
  'C:/Windows/System32/taskmgr.exe': D('1,5 MB'),
  'C:/Windows/System32/calc.exe': D('45 KB'),
  'C:/Windows/Temp': K(),
  'C:/Windows/explorer.exe': D('5,4 MB'),
  'C:/Windows/regedit.exe': D('358 KB'),
  'C:/Kullanıcılar': K(),
  'C:/Kullanıcılar/Ortak': K(),
  'C:/Kullanıcılar/Ortak/Ortak Belgeler': K(),
  'C:/pagefile.sys': D('2,4 GB', true),
  'C:/swapfile.sys': D('16 MB', true),
};

/** Kurulan programların Program Files klasörleri */
export const PROGRAM_DOSYALARI: Record<string, Record<string, string>> = {
  chrome: { 'C:/Program Files/Google': '', 'C:/Program Files/Google/Chrome': '', 'C:/Program Files/Google/Chrome/Application': '', 'C:/Program Files/Google/Chrome/Application/chrome.exe': '2,9 MB' },
  office: {
    'C:/Program Files/Microsoft Office': '',
    'C:/Program Files/Microsoft Office/root': '',
    'C:/Program Files/Microsoft Office/root/Office16': '',
    'C:/Program Files/Microsoft Office/root/Office16/WINWORD.EXE': '1,6 MB',
    'C:/Program Files/Microsoft Office/root/Office16/EXCEL.EXE': '63,4 MB',
    'C:/Program Files/Microsoft Office/root/Office16/POWERPNT.EXE': '1,9 MB',
  },
  winrar: { 'C:/Program Files/WinRAR': '', 'C:/Program Files/WinRAR/WinRAR.exe': '3,4 MB', 'C:/Program Files/WinRAR/Rar.exe': '1,0 MB', 'C:/Program Files/WinRAR/UnRAR.exe': '512 KB' },
  acrobat: { 'C:/Program Files/Adobe': '', 'C:/Program Files/Adobe/Acrobat DC': '', 'C:/Program Files/Adobe/Acrobat DC/Acrobat': '', 'C:/Program Files/Adobe/Acrobat DC/Acrobat/Acrobat.exe': '6,8 MB' },
  photoshop: { 'C:/Program Files/Adobe': '', 'C:/Program Files/Adobe/Adobe Photoshop 2025': '', 'C:/Program Files/Adobe/Adobe Photoshop 2025/Photoshop.exe': '198 MB' },
  booster: { 'C:/Program Files (x86)/SpeedySoft': '', 'C:/Program Files (x86)/SpeedySoft/PCBooster': '', 'C:/Program Files (x86)/SpeedySoft/PCBooster/booster.exe': '7,7 MB' },
};

/** Eski sürümde kaydedilmiş bilgisayarı tamamlar: eksik sistem klasörleri ve kurulu programların klasörleri eklenir */
export function sistemiTamamla(pc: WinPc): WinPc {
  if (!pc?.fs?.['C:']) return pc;
  const out: WinPc = JSON.parse(JSON.stringify(pc));
  for (const [k, v] of Object.entries(SISTEM_FS)) if (!out.fs[k]) out.fs[k] = { ...v };
  for (const u of out.uygulamalar ?? []) programDosyalari(out, u.id, true);
  if (!out.ag) out.ag = { kablo: true, wifi: '' };
  return derive(out);
}

/** Program kurulunca/kaldırılınca Program Files klasörünü ekler/siler */
export function programDosyalari(pc: WinPc, id: string, ekle: boolean): void {
  const d = PROGRAM_DOSYALARI[id];
  if (!d) return;
  if (ekle) {
    for (const [p, boyut] of Object.entries(d)) if (!pc.fs[p]) pc.fs[p] = boyut ? { tur: 'dosya', boyut } : { tur: 'klasor' };
  } else {
    // Programın kendi klasörü silinir; üst klasör (ör. Adobe) başka program kullanmıyorsa o da silinir
    const kok = Object.keys(d).filter((k) => !d[k]).sort((a, b) => a.length - b.length);
    const sil = kok.length > 1 ? kok[1] : kok[0];
    for (const k of Object.keys(pc.fs)) if (k === sil || k.startsWith(sil + '/')) delete pc.fs[k];
    if (kok.length > 1 && !Object.keys(pc.fs).some((k) => k.startsWith(kok[0] + '/'))) delete pc.fs[kok[0]];
  }
}

export function defaultPc(): WinPc {
  return derive({
    cihaz: {
      ad: 'LAB-PC-07',
      islemci: 'Intel(R) Core(TM) i5-10400 CPU @ 2.90GHz',
      ram: '16,0 GB (15,8 GB kullanılabilir)',
      depolama: '476 GB SSD (Samsung SSD 870 EVO)',
      ekranKarti: 'NVIDIA GeForce GTX 1650 (4 GB)',
      sistemTuru: '64 bit işletim sistemi, x64 tabanlı işlemci',
      surum: 'Windows 11 Pro',
      yapi: '24H2 (İşletim sistemi derlemesi 26100.2314)',
      kullanici: 'Ogrenci',
    },
    ekran: { cozunurluk: '1920 × 1080 (Önerilen)', olcek: 100, metin: 100, imlec: 1, kontrast: false, tema: 'acik', arkaPlan: 'bloom' },
    fare: { birincil: 'sol', ciftTik: 5, hiz: 10 },
    guc: { ekranKapat: 5, uyku: 15 },
    baslangic: [
      { id: 'onedrive', ad: 'Microsoft OneDrive', yayinci: 'Microsoft Corporation', etki: 'Yüksek', acik: true },
      { id: 'teams', ad: 'Microsoft Teams', yayinci: 'Microsoft', etki: 'Yüksek', acik: true },
      { id: 'security', ad: 'Windows Security notification icon', yayinci: 'Microsoft Corporation', etki: 'Düşük', acik: true },
      { id: 'realtek', ad: 'Realtek HD Audio Universal Service', yayinci: 'Realtek Semiconductor', etki: 'Düşük', acik: true },
    ],
    surecler: [
      { id: 'explorer', ad: 'Windows Gezgini', cpu: 0.6, ram: 92, sistem: true },
      { id: 'msedge', ad: 'Microsoft Edge (6)', cpu: 1.2, ram: 610 },
      { id: 'antimalware', ad: 'Antimalware Service Executable', cpu: 0.4, ram: 180, sistem: true },
      { id: 'teams', ad: 'Microsoft Teams', cpu: 0.8, ram: 420 },
      { id: 'onedrive', ad: 'Microsoft OneDrive', cpu: 0.1, ram: 64 },
      { id: 'host', ad: 'Hizmet Ana Bilgisayarı: Yerel Sistem (14)', cpu: 0.3, ram: 120, sistem: true },
    ],
    explorer: { uzanti: false, gizli: false },
    fs: {
      'C:': { tur: 'klasor' },
      ...SISTEM_FS,
      [KULLANICI]: { tur: 'klasor' },
      [`${KULLANICI}/Masaüstü`]: { tur: 'klasor' },
      [`${KULLANICI}/Belgeler`]: { tur: 'klasor' },
      [`${KULLANICI}/Belgeler/ders-notlari.docx`]: { tur: 'dosya', boyut: '24 KB' },
      [`${KULLANICI}/İndirilenler`]: { tur: 'klasor' },
      [`${KULLANICI}/Resimler`]: { tur: 'klasor' },
      [`${KULLANICI}/Resimler/girne.jpg`]: { tur: 'dosya', boyut: '2,1 MB' },
      [`${KULLANICI}/AppData`]: { tur: 'klasor', gizli: true },
    },
    aygitlar: [
      { id: 'cpu', kategori: 'İşlemciler', ad: 'Intel(R) Core(TM) i5-10400 CPU @ 2.90GHz', durum: 'ok' },
      { id: 'disk', kategori: 'Disk sürücüleri', ad: 'Samsung SSD 870 EVO 500GB', durum: 'ok' },
      { id: 'gpu', kategori: 'Görüntü bağdaştırıcıları', ad: 'NVIDIA GeForce GTX 1650', durum: 'ok' },
      { id: 'lan', kategori: 'Ağ bağdaştırıcıları', ad: 'Realtek PCIe GbE Family Controller', durum: 'ok' },
      { id: 'ses', kategori: 'Ses, video ve oyun denetleyicileri', ad: 'Realtek High Definition Audio', durum: 'ok' },
      { id: 'klavye', kategori: 'Klavyeler', ad: 'HID Klavye Aygıtı', durum: 'ok' },
      { id: 'fare', kategori: 'Fareler ve diğer işaret aygıtları', ad: 'HID uyumlu fare', durum: 'ok' },
    ],
    guvenlik: {
      gercekZaman: true,
      bulut: true,
      kurcalama: true,
      tanimlarGuncel: true,
      smartScreen: true,
      denetimliKlasor: false,
      korunan: [],
      duvar: { etki: true, ozel: true, ortak: true },
      karantina: [],
      izinVerilen: [],
      sonTarama: '',
    },
    hesaplar: [
      { ad: 'Ogretmen', tur: 'yonetici', parola: true },
      { ad: 'Ogrenci', tur: 'yonetici', parola: true },
    ],
    geriYukleme: [],
    uygulamalar: [
      { id: 'edge', ad: 'Microsoft Edge', yayinci: 'Microsoft Corporation', surum: '130.0.2849.80', boyutMB: 520 },
      { id: 'teams', ad: 'Microsoft Teams', yayinci: 'Microsoft Corporation', surum: '24295.605', boyutMB: 410 },
    ],
    varsayilan: { tarayici: 'edge', pdf: 'edge' },
    zararli: [],
    belirti: { reklam: false },
    acilis: 'normal',
    sifirlama: '',
    ag: { kablo: true, wifi: '' },
    dosyalar: [],
    kurulu: [],
    etkinUygulamalar: [],
    bozukUygulamalar: [],
    sorunluAygitlar: [],
    acikBaslangic: [],
    surecAdlari: [],
    yoneticiler: [],
    standartlar: [],
    duvarKapali: [],
    uyariSayisi: 0,
    sahteKaynakli: [],
    bilesenler: {},
    devreDisi: [],
    internet: true,
  });
}

/** Görev verisindeki yamayı varsayılan bilgisayara uygular (diziler tamamen değiştirilir, nesneler birleştirilir). */
export function pcWith(patch: Record<string, unknown> | undefined): WinPc {
  const base = defaultPc() as unknown as Record<string, unknown>;
  const merge = (a: unknown, b: unknown): unknown => {
    if (b === undefined) return a;
    if (b === null || typeof b !== 'object' || Array.isArray(b) || a === null || typeof a !== 'object' || Array.isArray(a)) return b;
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const [k, v] of Object.entries(b as Record<string, unknown>)) out[k] = merge((a as Record<string, unknown>)[k], v);
    return out;
  };
  const pc = merge(base, patch ?? {}) as WinPc;
  for (const u of pc.uygulamalar) programDosyalari(pc, u.id, true);
  return derive(pc);
}

/** Kurallar için türetilmiş alanları yeniden hesaplar */
export function derive(pc: WinPc): WinPc {
  const g = pc.guvenlik;
  pc.dosyalar = Object.keys(pc.fs).sort();
  pc.kurulu = pc.uygulamalar.map((u) => u.id);
  pc.etkinUygulamalar = pc.uygulamalar.filter((u) => u.etkin).map((u) => u.id);
  pc.bozukUygulamalar = pc.uygulamalar.filter((u) => u.bozuk).map((u) => u.id);
  // Kod 12: çakıştığı aygıt devre dışı bırakılınca kaynak serbest kalır
  for (const a of pc.aygitlar) if (a.durum === 'cakisma' && a.cakisan && pc.aygitlar.find((b) => b.id === a.cakisan)?.durum === 'devre-disi') a.durum = 'ok';
  pc.sorunluAygitlar = pc.aygitlar.filter((a) => a.durum === 'surucu-yok' || a.durum === 'cakisma' || a.sorunluSurucu).map((a) => a.id);
  pc.devreDisi = pc.aygitlar.filter((a) => a.durum === 'devre-disi').map((a) => a.id);
  const calisir = (id: string) => pc.aygitlar.find((a) => a.id === id)?.durum === 'ok';
  const ag = pc.ag ?? { kablo: true, wifi: '' };
  pc.internet = (ag.kablo && calisir('lan')) || (!!ag.wifi && calisir('wifi'));
  pc.acikBaslangic = pc.baslangic.filter((b) => b.acik).map((b) => b.id);
  pc.surecAdlari = pc.surecler.map((s) => s.id);
  pc.yoneticiler = pc.hesaplar.filter((h) => h.tur === 'yonetici').map((h) => h.ad);
  pc.standartlar = pc.hesaplar.filter((h) => h.tur === 'standart').map((h) => h.ad);
  pc.duvarKapali = (Object.keys(g.duvar) as Profil[]).filter((k) => !g.duvar[k]);
  pc.uyariSayisi = guvenlikUyarilari(pc).length;
  pc.sahteKaynakli = pc.uygulamalar.filter((u) => u.kaynak === 'sahte').map((u) => u.id);
  pc.bilesenler = Object.fromEntries(pc.uygulamalar.filter((u) => u.bilesenler).map((u) => [u.id, [...u.bilesenler!]]));
  return pc;
}

export function guvenlikUyarilari(pc: WinPc): { bolum: string; metin: string }[] {
  const g = pc.guvenlik;
  const out: { bolum: string; metin: string }[] = [];
  if (!g.gercekZaman) out.push({ bolum: 'virus', metin: 'Gerçek zamanlı koruma kapalı. Cihazınız savunmasız olabilir.' });
  if (!g.tanimlarGuncel) out.push({ bolum: 'virus', metin: 'Koruma güncelleştirmeleri eski.' });
  if (!g.bulut) out.push({ bolum: 'virus', metin: 'Bulut tabanlı koruma kapalı.' });
  if (!g.kurcalama) out.push({ bolum: 'virus', metin: 'Kurcalama koruması kapalı.' });
  for (const p of ['etki', 'ozel', 'ortak'] as Profil[]) if (!g.duvar[p]) out.push({ bolum: 'duvar', metin: `${PROFIL_AD[p]} ağ güvenlik duvarı kapalı.` });
  if (!g.smartScreen) out.push({ bolum: 'smart', metin: 'SmartScreen kapalı: istenmeyen uygulamalar engellenmiyor.' });
  if (bulunanTehditler(pc).length) out.push({ bolum: 'virus', metin: 'Tehditler bulundu. Eylem başlatın.' });
  return out;
}

/** Son taramanın bulduğu, henüz eylem uygulanmamış tehditler.
 *  Hızlı tarama yalnızca sık kullanılan konumlara bakar (D: sürücüsü ve arşiv içleri hariç); tam tarama her yere. */
export function bulunanTehditler(pc: WinPc): [string, DosyaGirdi][] {
  const g = pc.guvenlik;
  if (!g.sonTarama) return [];
  return Object.entries(pc.fs)
    .filter(([p, f]) => f.tehdit && !g.karantina.includes(p) && !g.izinVerilen.includes(p))
    .filter(([p]) => g.sonTarama !== 'hizli' || (!p.startsWith('D:') && !p.includes('.zip/')));
}

export const PROFIL_AD: Record<Profil, string> = { etki: 'Etki alanı', ozel: 'Özel', ortak: 'Ortak' };

export function adOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}
export function parentOf(path: string): string {
  const i = path.lastIndexOf('/');
  return i < 0 ? '' : path.slice(0, i);
}
export function children(pc: WinPc, dir: string): string[] {
  return Object.keys(pc.fs)
    .filter((p) => parentOf(p) === dir)
    .sort((a, b) => (pc.fs[a].tur === pc.fs[b].tur ? adOf(a).localeCompare(adOf(b), 'tr') : pc.fs[a].tur === 'klasor' ? -1 : 1));
}
/** Uzantılar gizliyse dosya adı uzantısız gösterilir (Windows varsayılanı) */
export function gorunenAd(pc: WinPc, path: string): string {
  const ad = adOf(path);
  if (pc.fs[path]?.tur === 'dosya' && !pc.explorer.uzanti) return ad.replace(/\.[^.]+$/, '');
  return ad;
}

export function clonePc(pc: WinPc): WinPc {
  return JSON.parse(JSON.stringify(pc));
}

/** Yeniden başlatma: hatalı sürücü varsa normal açılış mavi ekranla biter */
export function yenidenBaslat(pc: WinPc, mod: 'normal' | 'guvenli' = 'normal'): WinPc {
  pc.acilis = mod === 'guvenli' ? 'guvenli' : pc.aygitlar.some((a) => a.sorunluSurucu) ? 'bsod' : 'normal';
  return pc;
}

/** "Bu bilgisayarı sıfırla": Windows yeniden yüklenir. "koru": kişisel dosyalar kalır (profildeki zararlı da kalır);
 *  "hepsi": kişisel dosyalar, programlar ve zararlılar silinir. D:, E: gibi diğer sürücülere dokunulmaz. */
export function sifirla(pc0: WinPc, secenek: 'koru' | 'hepsi'): WinPc {
  const pc = clonePc(pc0);
  const temiz = defaultPc();
  pc.uygulamalar = temiz.uygulamalar;
  pc.baslangic = temiz.baslangic;
  pc.surecler = temiz.surecler;
  pc.guvenlik = temiz.guvenlik;
  pc.varsayilan = temiz.varsayilan;
  pc.ekran = temiz.ekran;
  pc.fare = temiz.fare;
  pc.guc = temiz.guc;
  pc.explorer = temiz.explorer;
  pc.geriYukleme = [];
  for (const a of pc.aygitlar) a.sorunluSurucu = false;
  for (const id of Object.keys(PROGRAM_DOSYALARI)) if (id !== 'edge') programDosyalari(pc, id, false);
  for (const k of Object.keys(pc.fs)) if (k.startsWith('C:/Windows/System32/svchost32')) delete pc.fs[k];
  if (secenek === 'hepsi') {
    for (const k of Object.keys(pc.fs)) if (k.startsWith('C:')) delete pc.fs[k];
    Object.assign(pc.fs, Object.fromEntries(Object.entries(temiz.fs).filter(([k]) => k.startsWith('C:'))));
    pc.zararli = [];
    pc.belirti = { reklam: false };
  } else {
    // profildeki zararlı geri gelir: dosyalarımı koru seçeneği bu tür bulaşmayı temizlemez
    pc.zararli = pc.zararli.filter((z) => z === 'profil');
    pc.belirti = { reklam: pc.zararli.length > 0 };
    if (pc.zararli.length) pc.surecler.push({ id: 'profil', ad: 'WindowsUpdateHelper.exe', cpu: 31.0, ram: 640 });
  }
  pc.sifirlama = secenek;
  pc.acilis = 'normal';
  return derive(pc);
}
