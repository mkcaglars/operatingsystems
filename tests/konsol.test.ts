import { describe, expect, it } from 'vitest';
import { calistir, coz, goster, tamamla } from '../web/src/core/winkabuk';
import { defaultPc, KULLANICI, type WinPc } from '../web/src/core/winpc';

const uygula = (pc: WinPc, cwd: string, s: string, k: 'cmd' | 'ps' = 'cmd') => {
  const r = calistir(pc, cwd, s, k);
  r.degis?.(pc);
  return r;
};

describe('cmd / PowerShell', () => {
  it('yolları Windows biçiminde gösterir ve çözer', () => {
    const pc = defaultPc();
    expect(goster(KULLANICI)).toBe('C:\\Users\\Ogrenci');
    expect(coz(pc, KULLANICI, 'belgeler')).toBe(`${KULLANICI}/Belgeler`);
    expect(coz(pc, KULLANICI, 'C:\\Users\\Ogrenci\\..')).toBe('C:/Kullanıcılar');
  });
  it('cd, mkdir, echo >, type, dir, del çalışır', () => {
    const pc = defaultPc();
    let cwd = KULLANICI;
    cwd = uygula(pc, cwd, 'cd Belgeler').cwd;
    expect(cwd).toBe(`${KULLANICI}/Belgeler`);
    uygula(pc, cwd, 'mkdir Odev');
    expect(pc.fs[`${cwd}/Odev`].tur).toBe('klasor');
    uygula(pc, cwd, 'echo merhaba dünya > not.txt');
    expect(uygula(pc, cwd, 'type not.txt').cikti).toContain('merhaba dünya');
    expect(uygula(pc, cwd, 'dir').cikti).toContain('Odev');
    expect(uygula(pc, cwd, 'Get-ChildItem', 'ps').cikti).toContain('not.txt');
    uygula(pc, cwd, 'del not.txt');
    expect(pc.fs[`${cwd}/not.txt`]).toBeUndefined();
    expect(uygula(pc, cwd, 'cd yok').hata).toBe(true);
  });
  it('bilinmeyen komut ve ağ komutları', () => {
    const pc = defaultPc();
    expect(uygula(pc, 'C:', 'foo').cikti).toContain('tanınmıyor');
    expect(uygula(pc, 'C:', 'foo', 'ps').cikti).toContain('cmdlet');
    pc.internet = false;
    expect(uygula(pc, 'C:', 'ping google.com').cikti).toContain('bulamadı');
    pc.internet = true;
    expect(uygula(pc, 'C:', 'ping google.com').cikti).toContain('Kaybolan = 0');
    expect(uygula(pc, 'C:', 'ipconfig').cikti).toContain('Windows IP');
    expect(uygula(pc, 'C:', 'whoami').cikti).toContain('\\');
    expect(uygula(pc, 'C:', 'cls').ozel).toBe('temizle');
  });
  it('Tab tamamlama', () => {
    const pc = defaultPc();
    expect(tamamla(pc, KULLANICI, 'cd bel')).toBe('cd Belgeler');
  });
});
