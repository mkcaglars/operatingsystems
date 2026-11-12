// İ8 kurulabilir yazılımlar: kurulum dosyaları, sihirbaz adımları ve kurulumun bilgisayara etkisi.
import { clonePc, derive, KULLANICI, type Uygulama, type WinPc } from './winpc';

export type KurulumAdim = 'hosgeldin' | 'lisans' | 'tur' | 'bilesen' | 'teklif' | 'klasor' | 'gereksinim' | 'hesap' | 'kur' | 'bitti';

export interface KurulumTanim {
  id: string;
  baslik: string;
  renk: string;
  adimlar: KurulumAdim[];
  uygulama: Omit<Uygulama, 'bilesenler'>;
  bilesenler?: { id: string; ad: string }[];
  teklifler?: { id: string; ad: string; aciklama: string }[];
  klasor?: string;
  lisansMetni?: string;
  bittiNot?: string;
  /** Kurulum bilgisayara zarar verir (crack, sahte yükleyici) */
  zararli?: string;
}

export const KATALOG: Record<string, KurulumTanim> = {
  chrome: {
    id: 'chrome',
    baslik: 'Google Chrome',
    renk: '#1a73e8',
    adimlar: ['kur', 'bitti'],
    uygulama: { id: 'chrome', ad: 'Google Chrome', yayinci: 'Google LLC', surum: '131.0.6778.86', boyutMB: 340, kaynak: 'resmi' },
    bittiNot: 'Chrome kuruldu. Varsayılan tarayıcı yapmak için: Ayarlar › Uygulamalar › Varsayılan uygulamalar › Google Chrome.',
  },
  'chrome-sahte': {
    id: 'chrome-sahte',
    baslik: 'Chrome Download Manager',
    renk: '#16a34a',
    adimlar: ['hosgeldin', 'teklif', 'kur', 'bitti'],
    uygulama: { id: 'chrome', ad: 'Google Chrome', yayinci: 'Google LLC', surum: '119.0.6045.105', boyutMB: 330, kaynak: 'sahte' },
    teklifler: [
      { id: 'arama', ad: 'Arama Asistanı Pro', aciklama: 'Tarayıcınızın ana sayfasını ve arama motorunu değiştirir (önerilen)' },
      { id: 'booster', ad: 'PC Speed Booster', aciklama: 'Bilgisayarınızı %300 hızlandırır! (önerilen)' },
    ],
    zararli: 'adware',
  },
  office: {
    id: 'office',
    baslik: 'Microsoft Office Professional Plus 2024',
    renk: '#d83b01',
    adimlar: ['lisans', 'tur', 'bilesen', 'kur', 'bitti'],
    uygulama: { id: 'office', ad: 'Microsoft Office Professional Plus 2024 - tr-tr', yayinci: 'Microsoft Corporation', surum: '16.0.17932.20162', boyutMB: 3100, kaynak: 'resmi', dil: 'tr-tr' },
    bilesenler: [
      { id: 'word', ad: 'Word' },
      { id: 'excel', ad: 'Excel' },
      { id: 'powerpoint', ad: 'PowerPoint' },
      { id: 'outlook', ad: 'Outlook' },
      { id: 'access', ad: 'Access' },
      { id: 'publisher', ad: 'Publisher' },
      { id: 'onenote', ad: 'OneNote' },
    ],
    lisansMetni: 'MICROSOFT YAZILIMI LİSANS KOŞULLARI — MICROSOFT OFFICE. Bu lisans koşulları, Microsoft ile sizin aranızda yapılmış bir sözleşmedir… Yazılımı kullanmak için ürünün etkinleştirilmesi gerekir.',
    bittiNot: 'Office kuruldu. Bir Office uygulamasını açıp ürün anahtarıyla etkinleştirin.',
  },
  winrar: {
    id: 'winrar',
    baslik: 'WinRAR 7.01 (64 bit) Türkçe',
    renk: '#7c3aed',
    adimlar: ['klasor', 'kur', 'bilesen', 'bitti'],
    uygulama: { id: 'winrar', ad: 'WinRAR 7.01 (64 bit)', yayinci: 'win.rar GmbH', surum: '7.01.0', boyutMB: 9, kaynak: 'resmi' },
    klasor: 'C:\\Program Files\\WinRAR',
    bilesenler: [
      { id: 'rar', ad: 'RAR' },
      { id: 'zip', ad: 'ZIP' },
      { id: '7z', ad: '7Z' },
    ],
    bittiNot: 'WinRAR bir paylaşımlı yazılımdır (shareware): 40 günlük deneme süresinden sonra lisans satın alınması gerekir.',
  },
  acrobat: {
    id: 'acrobat',
    baslik: 'Adobe Acrobat Reader',
    renk: '#b30b00',
    adimlar: ['kur', 'bitti'],
    uygulama: { id: 'acrobat', ad: 'Adobe Acrobat (64-bit)', yayinci: 'Adobe', surum: '24.004.20219', boyutMB: 720, kaynak: 'resmi' },
    bittiNot: 'Acrobat Reader kuruldu.',
  },
  photoshop: {
    id: 'photoshop',
    baslik: 'Adobe Creative Cloud — Photoshop',
    renk: '#31a8ff',
    adimlar: ['gereksinim', 'hesap', 'kur', 'bitti'],
    uygulama: { id: 'photoshop', ad: 'Adobe Photoshop 2025', yayinci: 'Adobe Inc.', surum: '26.1.0', boyutMB: 4300, kaynak: 'resmi' },
    bittiNot: 'Photoshop kuruldu ve okul hesabıyla etkinleştirildi.',
  },
  kms: {
    id: 'kms',
    baslik: 'KMS Office Aktivatör',
    renk: '#991b1b',
    adimlar: ['hosgeldin', 'kur', 'bitti'],
    uygulama: { id: 'kms', ad: 'KMS Aktivatör', yayinci: 'Bilinmiyor', surum: '11.2', boyutMB: 3 },
    zararli: 'trojan',
    bittiNot: 'Aktivasyon başarılı! (!)',
  },
};

export interface KurulumSecim {
  bilesenler?: string[];
  teklifler?: string[];
  ekTeklifler?: string[]; // indirme sayfasından gelen (ör. McAfee)
}

/** Kurulumu bilgisayara uygular (saf fonksiyon) */
export function kur(pc0: WinPc, tanimId: string, secim: KurulumSecim, kaynak?: 'resmi' | 'sahte'): WinPc {
  const t = KATALOG[tanimId];
  const pc = clonePc(pc0);
  const uyg: Uygulama = { ...t.uygulama, ...(kaynak ? { kaynak } : {}) };
  if (secim.bilesenler && t.bilesenler) uyg.bilesenler = [...secim.bilesenler];
  if (tanimId === 'office' || tanimId === 'photoshop') uyg.etkin = tanimId === 'photoshop';
  pc.uygulamalar = pc.uygulamalar.filter((u) => u.id !== uyg.id);
  if (tanimId !== 'kms') pc.uygulamalar.push(uyg);
  for (const tk of secim.teklifler ?? []) {
    const tt = t.teklifler?.find((x) => x.id === tk);
    if (tt) {
      pc.uygulamalar.push({ id: tk, ad: tt.ad, yayinci: 'Bilinmiyor', surum: '1.0', boyutMB: 45 });
      pc.baslangic.push({ id: tk, ad: tt.ad, yayinci: 'Bilinmiyor', etki: 'Yüksek', acik: true });
      pc.surecler.push({ id: tk, ad: tt.ad, cpu: 6.5, ram: 380 });
    }
  }
  for (const ek of secim.ekTeklifler ?? []) pc.uygulamalar.push({ id: ek, ad: ek === 'mcafee-scan' ? 'McAfee Security Scan Plus' : 'McAfee Safe Connect', yayinci: 'McAfee, LLC', surum: '4.1', boyutMB: 60 });
  if (t.zararli) {
    if (!pc.zararli.includes(t.zararli)) pc.zararli.push(t.zararli);
    if (t.zararli === 'adware' || (secim.teklifler ?? []).length) pc.belirti.reklam = true;
    if (t.zararli === 'trojan') {
      pc.surecler.push({ id: 'svchost32', ad: 'svchost32.exe', cpu: 24.0, ram: 210 });
      pc.fs[`C:/Windows/System32/svchost32.exe`] = { tur: 'dosya', tehdit: 'Trojan:Win32/Wacatac.B!ml', boyut: '1,2 MB' };
    }
  }
  if ((secim.teklifler ?? []).length) pc.belirti.reklam = true;
  return derive(pc);
}

export const INDIRILEN = `${KULLANICI}/İndirilenler`;
