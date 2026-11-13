// WinRAR işlemleri: dosya/klasörleri arşive ekleme ve arşivden çıkartma.
// Arşivin içindekiler "…/odev.rar/belge.docx" gibi yollarda saklanır (Windows'un .zip klasörleri gibi).
import { adOf, parentOf, type DosyaGirdi, type WinPc } from './winpc';

/** "24 KB", "2,4 MB", "1,2 GB" → KB */
export function boyutKB(b?: string): number {
  const m = /^([\d.,]+)\s*(KB|MB|GB|bayt)?/i.exec(b ?? '');
  if (!m) return 0;
  const n = Number(m[1].replace(/\./g, '').replace(',', '.'));
  const k = (m[2] ?? 'KB').toUpperCase();
  return k === 'GB' ? n * 1024 * 1024 : k === 'MB' ? n * 1024 : k === 'BAYT' ? n / 1024 : n;
}
export function boyutYaz(kb: number): string {
  if (kb >= 1024 * 1024) return (kb / 1024 / 1024).toFixed(1).replace('.', ',') + ' GB';
  if (kb >= 1024) return (kb / 1024).toFixed(1).replace('.', ',') + ' MB';
  return Math.max(1, Math.round(kb)) + ' KB';
}

/** Arşivin (ya da arşiv içindeki bir klasörün) kök arşiv yolu */
export function arsivKoku(pc: WinPc, yol: string): string | null {
  let p = yol;
  while (p) {
    const f = pc.fs[p];
    if (f && (f.arsiv || (f.tur === 'dosya' && /\.(rar|zip)$/i.test(p)))) return p;
    p = parentOf(p);
  }
  return null;
}

export function arsivle(pc: WinPc, kaynaklar: string[], arsiv: string, bicim: 'rar' | 'zip', secenek: { sil?: boolean; parola?: string } = {}): WinPc {
  let toplam = 0;
  for (const k of kaynaklar) {
    const taban = parentOf(k);
    for (const key of Object.keys(pc.fs)) {
      if (key !== k && !key.startsWith(k + '/')) continue;
      const g: DosyaGirdi = { ...pc.fs[key] };
      pc.fs[`${arsiv}/${key.slice(taban.length + 1)}`] = g;
      if (g.tur === 'dosya') toplam += boyutKB(g.boyut);
    }
  }
  // Belgeler iyi sıkışır, resim ve müzik az sıkışır
  const oran = kaynaklar.some((k) => /\.(jpe?g|png|mp3|mp4|zip|rar)$/i.test(k)) ? 0.92 : 0.45;
  pc.fs[arsiv] = { tur: 'dosya', boyut: boyutYaz(toplam * oran), arsiv: bicim, ...(secenek.parola ? { parola: secenek.parola } : {}) };
  if (secenek.sil) for (const k of kaynaklar) for (const key of Object.keys(pc.fs)) if (key === k || key.startsWith(k + '/')) delete pc.fs[key];
  return pc;
}

/** Arşivdeki her şeyi hedef klasöre çıkartır (aynı adlı dosyaların üzerine yazar) */
export function cikart(pc: WinPc, arsiv: string, hedef: string): WinPc {
  const parcalar = hedef.split('/');
  for (let i = 1; i <= parcalar.length; i++) {
    const p = parcalar.slice(0, i).join('/');
    if (!pc.fs[p]) pc.fs[p] = { tur: 'klasor' };
  }
  for (const key of Object.keys(pc.fs)) {
    if (!key.startsWith(arsiv + '/')) continue;
    const g = { ...pc.fs[key] };
    pc.fs[`${hedef}/${key.slice(arsiv.length + 1)}`] = g;
  }
  return pc;
}

export const arsivAdi = (yol: string) => adOf(yol).replace(/\.(rar|zip)$/i, '');
