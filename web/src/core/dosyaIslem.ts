// Dosya Gezgini işlemleri (saf fonksiyonlar): kopyala, taşı, sil ve dosya ilişkilendirmeleri (hangi uygulamayla açılır).
import { adOf, parentOf, type WinPc } from './winpc';

const surucu = (p: string) => p.slice(0, 2);
const altinda = (k: string, p: string) => k === p || k.startsWith(p + '/');

/** Hedef klasörde çakışmayan ad: aynı klasöre kopyada "ad - Kopya (2).uzantı" */
function hedefYol(pc: WinPc, kaynak: string, klasor: string): string {
  let h = `${klasor}/${adOf(kaynak)}`;
  if (parentOf(kaynak) !== klasor) return h;
  for (let i = 2; pc.fs[h]; i++) h = `${klasor}/${adOf(kaynak).replace(/(\.[^.]+)?$/, ` - Kopya (${i})$1`)}`;
  return h;
}

export type IslemSonucu = { tamam: string[]; hata?: string };

/** Windows kuralı: başka sürücüye sürükleme kopyalar, aynı sürücüde taşır */
export const varsayilanIslem = (kaynaklar: string[], klasor: string): 'kopyala' | 'tasi' => (kaynaklar.every((k) => surucu(k) === surucu(klasor)) ? 'tasi' : 'kopyala');

export function islemDenetle(pc: WinPc, kaynaklar: string[], klasor: string): string | undefined {
  if (!pc.fs[klasor] || (pc.fs[klasor].tur !== 'klasor' && !/^[A-Z]:$/.test(klasor))) return 'Hedef bir klasör değil.';
  if (kaynaklar.some((k) => altinda(klasor, k))) return 'Hedef klasör, kaynak klasörün bir alt klasörü.';
  if (/\.(zip|rar)(\/|$)/i.test(klasor)) return 'Arşivin içine dosya eklemek için WinRAR (Ekle) kullanın.';
  return undefined;
}

export function kopyala(pc: WinPc, kaynaklar: string[], klasor: string): IslemSonucu {
  const hata = islemDenetle(pc, kaynaklar, klasor);
  if (hata) return { tamam: [], hata };
  const tamam: string[] = [];
  for (const kaynak of kaynaklar) {
    if (!pc.fs[kaynak]) continue;
    const h = hedefYol(pc, kaynak, klasor);
    for (const k of Object.keys(pc.fs)) if (altinda(k, kaynak)) pc.fs[h + k.slice(kaynak.length)] = { ...pc.fs[k] };
    tamam.push(h);
  }
  return { tamam };
}

export function tasi(pc: WinPc, kaynaklar: string[], klasor: string): IslemSonucu {
  const hata = islemDenetle(pc, kaynaklar, klasor);
  if (hata) return { tamam: [], hata };
  const tamam: string[] = [];
  for (const kaynak of kaynaklar) {
    if (!pc.fs[kaynak]) continue;
    if (parentOf(kaynak) === klasor) {
      tamam.push(kaynak);
      continue;
    }
    const h = `${klasor}/${adOf(kaynak)}`;
    for (const k of Object.keys(pc.fs)) {
      if (!altinda(k, kaynak)) continue;
      pc.fs[h + k.slice(kaynak.length)] = pc.fs[k];
      delete pc.fs[k];
    }
    tamam.push(h);
  }
  return { tamam };
}

export function sil(pc: WinPc, yollar: string[]): void {
  for (const y of yollar) for (const k of Object.keys(pc.fs)) if (altinda(k, y)) delete pc.fs[k];
}

// ---------- Dosya ilişkilendirmeleri ----------
export type Acici = { id: string; ad: string; logo: string };

/** Uzantıya göre bu bilgisayarda dosyayı açabilecek uygulamalar (ilk sıradaki varsayılandır) */
export function acicilar(pc: WinPc, yol: string): Acici[] {
  const uz = (adOf(yol).match(/\.([^.]+)$/)?.[1] ?? '').toLowerCase();
  const k = (id: string) => pc.kurulu.includes(id);
  const out: Acici[] = [];
  if (['docx', 'doc', 'rtf'].includes(uz) && k('office')) out.push({ id: 'word', ad: 'Word', logo: 'word' });
  if (['xlsx', 'xls', 'csv'].includes(uz) && k('office')) out.push({ id: 'excel', ad: 'Excel', logo: 'excel' });
  if (['pptx', 'ppt'].includes(uz) && k('office')) out.push({ id: 'powerpoint', ad: 'PowerPoint', logo: 'powerpoint' });
  if (['rar', '7z'].includes(uz) && k('winrar')) out.push({ id: 'winrar', ad: 'WinRAR arşivleyicisi', logo: 'winrar' });
  if (uz === 'zip') {
    out.push({ id: 'dosya', ad: 'Dosya Gezgini', logo: 'dosya' });
    if (k('winrar')) out.push({ id: 'winrar', ad: 'WinRAR arşivleyicisi', logo: 'winrar' });
  }
  if (uz === 'pdf') {
    if (k('acrobat')) out.push({ id: 'acrobat', ad: 'Adobe Acrobat', logo: 'acrobat' });
    out.push({ id: 'edge', ad: 'Microsoft Edge', logo: 'edge' });
    if (k('chrome')) out.push({ id: 'chrome', ad: 'Google Chrome', logo: 'chrome' });
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(uz)) {
    out.push({ id: 'fotograflar', ad: 'Fotoğraflar', logo: 'fotograflar' });
    if (k('photoshop')) out.push({ id: 'photoshop', ad: 'Adobe Photoshop 2025', logo: 'photoshop' });
  }
  if (['txt', 'log', 'ini', 'inf', 'csv'].includes(uz)) out.push({ id: 'notdefteri', ad: 'Not Defteri', logo: 'notdefteri' });
  return out;
}

export const uzanti = (yol: string) => (adOf(yol).match(/\.([^.]+)$/)?.[1] ?? '').toLowerCase();
