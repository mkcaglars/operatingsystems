import { describe, expect, it } from 'vitest';
import { goster, hesapla, sayiOku } from '../web/src/core/tablo';
import { arsivKoku, arsivle, boyutKB, cikart } from '../web/src/core/arsiv';
import { children, defaultPc, KULLANICI } from '../web/src/core/winpc';

describe('Excel hesaplayıcı', () => {
  const h = { A1: '10', A2: '20', A3: '30,5', B1: '=TOPLA(A1:A3)', B2: '=ORTALAMA(A1:A2)', B3: '=A1*2+A2/4', B4: '=MAK(A1:A3)-MİN(A1:A3)', B5: '=EĞER(A1>5;"büyük";"küçük")', B6: '=A1/0', B7: '=B8', B8: '=B7', B9: '=YOK(A1)', C1: 'metin', C2: '=sum(a1:a2)', C3: '=SAY(A1:C1)' };
  it('formüller', () => {
    expect(hesapla(h, 'B1')).toBe(60.5);
    expect(hesapla(h, 'B2')).toBe(15);
    expect(hesapla(h, 'B3')).toBe(25);
    expect(hesapla(h, 'B4')).toBe(20.5);
    expect(hesapla(h, 'B5')).toBe('büyük');
    expect(hesapla(h, 'C2')).toBe(30);
    expect(hesapla(h, 'C3')).toBe(2);
  });
  it('hatalar', () => {
    expect(hesapla(h, 'B6')).toBe('#SAYI/0!');
    expect(hesapla(h, 'B7')).toBe('#DÖNGÜ!');
    expect(hesapla(h, 'B9')).toBe('#AD?');
    expect(hesapla({ A1: '=C1+1', C1: 'metin' }, 'A1')).toBe('#DEĞER!');
  });
  it('Türkçe sayı biçimi', () => {
    expect(sayiOku('1.250,75')).toBe(1250.75);
    expect(sayiOku('12.000')).toBe(12000);
    expect(goster(1250.5)).toBe('1.250,5');
  });
});

describe('WinRAR arşivleri', () => {
  it('arşivle → içini gör → çıkart; parola ve sonra sil', () => {
    const pc = defaultPc();
    const belge = `${KULLANICI}/Belgeler/ders-notlari.docx`;
    const arsiv = `${KULLANICI}/Belgeler/notlar.rar`;
    arsivle(pc, [belge], arsiv, 'rar', { sil: true, parola: 'gizli' });
    expect(pc.fs[arsiv].arsiv).toBe('rar');
    expect(pc.fs[arsiv].parola).toBe('gizli');
    expect(pc.fs[belge]).toBeUndefined();
    expect(children(pc, arsiv)).toEqual([`${arsiv}/ders-notlari.docx`]);
    expect(arsivKoku(pc, `${arsiv}/ders-notlari.docx`)).toBe(arsiv);
    expect(boyutKB(pc.fs[arsiv].boyut)).toBeLessThan(24);
    cikart(pc, arsiv, `${KULLANICI}/Belgeler/notlar`);
    expect(pc.fs[`${KULLANICI}/Belgeler/notlar/ders-notlari.docx`]).toBeTruthy();
  });
});
