import { describe, expect, it } from 'vitest';
import { acicilar, kopyala, sil, tasi, varsayilanIslem } from '../web/src/core/dosyaIslem';
import { defaultPc, derive, KULLANICI } from '../web/src/core/winpc';

const B = `${KULLANICI}/Belgeler`;
const pc0 = () => {
  const pc = defaultPc();
  pc.fs['E:'] = { tur: 'klasor' };
  pc.fs[`${B}/a.docx`] = { tur: 'dosya' };
  pc.fs[`${B}/Proje`] = { tur: 'klasor' };
  pc.fs[`${B}/Proje/b.xlsx`] = { tur: 'dosya' };
  return pc;
};

describe('Dosya Gezgini işlemleri', () => {
  it('başka sürücüye sürükleme kopyalar, aynı sürücüde taşır', () => {
    expect(varsayilanIslem([`${B}/a.docx`], 'E:')).toBe('kopyala');
    expect(varsayilanIslem([`${B}/a.docx`], `${KULLANICI}/Masaüstü`)).toBe('tasi');
  });
  it('çoklu kopyalama klasörleri içerikleriyle kopyalar', () => {
    const pc = pc0();
    const r = kopyala(pc, [`${B}/a.docx`, `${B}/Proje`], 'E:');
    expect(r.tamam).toEqual(['E:/a.docx', 'E:/Proje']);
    expect(pc.fs['E:/Proje/b.xlsx']).toBeTruthy();
    expect(pc.fs[`${B}/a.docx`]).toBeTruthy();
  });
  it('aynı klasöre kopya "- Kopya (2)" olur; taşıma kaynağı kaldırır', () => {
    const pc = pc0();
    expect(kopyala(pc, [`${B}/a.docx`], B).tamam).toEqual([`${B}/a - Kopya (2).docx`]);
    tasi(pc, [`${B}/Proje`], `${KULLANICI}/Masaüstü`);
    expect(pc.fs[`${B}/Proje`]).toBeUndefined();
    expect(pc.fs[`${KULLANICI}/Masaüstü/Proje/b.xlsx`]).toBeTruthy();
  });
  it('klasörü kendi içine kopyalamak ve arşivin içine bırakmak engellenir', () => {
    const pc = pc0();
    expect(kopyala(pc, [B], `${B}/Proje`).hata).toMatch(/alt klasörü/);
    pc.fs['E:/x.zip'] = { tur: 'dosya', arsiv: 'zip' };
    expect(kopyala(pc, [`${B}/a.docx`], 'E:/x.zip').hata).toBeTruthy();
    sil(pc, [`${B}/Proje`]);
    expect(Object.keys(pc.fs).some((k) => k.startsWith(`${B}/Proje`))).toBe(false);
  });
  it('dosya ilişkilendirmeleri: Office yoksa .xlsx için uygulama yok, varsa Excel', () => {
    const pc = derive(pc0());
    expect(acicilar(pc, `${B}/b.xlsx`)).toEqual([]);
    expect(acicilar(pc, `${B}/not.txt`)[0].id).toBe('notdefteri');
    expect(acicilar(pc, `${B}/x.zip`)[0].id).toBe('dosya');
    pc.uygulamalar.push({ id: 'office', ad: 'Office', yayinci: 'Microsoft', surum: '16', boyutMB: 1 });
    expect(acicilar(derive(pc), `${B}/b.xlsx`)[0].id).toBe('excel');
  });
});
