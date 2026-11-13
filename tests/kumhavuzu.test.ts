import { describe, expect, it } from 'vitest';
import { ayir, bagla, biosVeri, ilkDurum, kurulumuIsle, rufusYaz, yapilacaklar } from '../web/src/core/kumhavuzu';
import { initialWinSetup } from '../web/src/tasks/WinSetup';
import { kurulumVeri } from '../web/src/core/kumhavuzu';
import { KULLANICI } from '../web/src/core/winpc';

describe('kum havuzu', () => {
  it('USB bellek Windows içinde E: olarak görünür, değişiklik belleğe yazılır', () => {
    let st = ilkDurum();
    st = { ...st, portlar: [null, 'turuncu', null] };
    const pc = bagla(st.pc, st);
    expect(pc.dosyalar).toContain('E:/tarih-odevi.docx');
    pc.fs['E:/yedek.docx'] = { tur: 'dosya' };
    st = ayir(st, pc);
    expect(st.flash.turuncu.dosyalar['yedek.docx']).toBeTruthy();
    expect(Object.keys(st.pc.fs).some((k) => k.startsWith('E:'))).toBe(false);
  });
  it('Rufus belleği siler; GPT bellek yalnızca CSM kapalıyken önyüklenir', () => {
    let st = rufusYaz({ ...ilkDurum(), portlar: ['turuncu', null, null] }, 'turuncu', 'GPT');
    expect(st.iz.turuncuSilindi).toBe(true);
    expect(st.flash.turuncu.dosyalar['tarih-odevi.docx']).toBeUndefined();
    expect(biosVeri(st).usbTakili).toBe(true);
    st = { ...st, bios: { ...st.bios, cmos: { ...st.bios.cmos, csm: true } } };
    expect(biosVeri(st).usbTakili).toBe(false);
  });
  it('bölüm silinip kurulum yarıda kalırsa Windows açılmaz; kurulum bitince yeni Windows', () => {
    const st = ilkDurum();
    const k = initialWinSetup({ veri: kurulumVeri(st) } as never);
    k.diskler = [{ id: 'd0', bolumler: [{ id: 'x', tur: 'ayrilmamis', boyutGB: 465 }] }];
    expect(kurulumuIsle({ ...st, kurulum: k }).windows).toBe(null);
    const bitti = kurulumuIsle({ ...st, kurulum: { ...k, kurulum: 'tamam', adim: 'bitti', ozet: { temiz: true, veriKaybi: [] }, oobe: { ...k.oobe, ag: 'wifi:OKUL-LAB', kullanici: 'Ayse' } } });
    expect(bitti.windows).toBe('yeni');
    expect(bitti.pc.internet).toBe(true);
    expect(bitti.pc.sorunluAygitlar.length).toBe(3);
    expect(bitti.pc.dosyalar.some((d) => d.startsWith(`${KULLANICI}/Belgeler/`))).toBe(false);
    expect(yapilacaklar(bitti).find((x) => x.id === 'kurulum')!.tamam).toBe(true);
  });
  it('biçimlendirmeden kurulursa eski dosyalar Windows.old klasörüne gider', () => {
    const st = ilkDurum();
    const k = initialWinSetup({ veri: kurulumVeri(st) } as never);
    const r = kurulumuIsle({ ...st, kurulum: { ...k, kurulum: 'tamam', adim: 'bitti', ozet: { temiz: false, veriKaybi: [] } } });
    expect(r.pc.dosyalar.some((d) => d.startsWith('C:/Windows.old/') && d.endsWith('proje-odevi.docx'))).toBe(true);
  });
});
