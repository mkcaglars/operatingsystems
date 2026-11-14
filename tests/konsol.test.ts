import { describe, expect, it } from 'vitest';
import { calistir, coz, goster, tamamla } from '../web/src/core/winkabuk';
import { defaultPc, derive, KULLANICI, type WinPc } from '../web/src/core/winpc';
import { ayarHatalari, ipDegerlendir } from '../web/src/core/ag';

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
    pc.ag.kablo = false;
    derive(pc);
    expect(uygula(pc, 'C:', 'ping google.com').cikti).toContain('bulamadı');
    pc.ag.kablo = true;
    derive(pc);
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

describe('tarayıcı önerileri', () => {
  it('yanlış yazılmış adres için siteler önerilir', async () => {
    const { oneriler } = await import('../web/src/win/Tarayici');
    for (const g of ['crome-indir.com', 'gogle.com', 'winrr.com', 'rufis.ie', 'ofice.com', 'asdfqwer.xyz']) console.log(g, oneriler(g).slice(0, 3).map((s) => s.url));
    expect(oneriler('crome-indir.com')[0].url).toBe('www.google.com/chrome');
    expect(oneriler('winrr.com')[0].url).toBe('www.win-rar.com/turkce');
    expect(oneriler('asdfqwer.xyz')).toHaveLength(0);
    for (const [g, u] of [['krom.com', 'www.google.com/chrome'], ['ofis-indir.net', 'www.microsoft.com/tr-tr/microsoft-365/office-2024'], ['vinrar.com', 'www.win-rar.com/turkce'], ['vindovs11.com', 'www.microsoft.com/tr-tr/software-download/windows11'], ['googlechrome.com', 'www.google.com/chrome'], ['ubunto.org', 'ubuntu.com/download/desktop']] as const)
      expect(oneriler(g)[0]?.url, g).toBe(u);
  });
  it('aramada yazım hatası düzeltilir', async () => {
    const { aramaDuzelt } = await import('../web/src/win/Tarayici');
    expect(aramaDuzelt('krom indir')).toBe('chrome indir');
    expect(aramaDuzelt('ofis 2024')).toBe('office 2024');
    expect(aramaDuzelt('wndows 11 indir')).toBe('windows 11 indir');
    expect(aramaDuzelt('winrar indir')).toBeNull();
  });
});

describe('IP ayarları', () => {
  const elle = (ip: string, gecit = '192.168.1.1', dns1 = '8.8.8.8', maske = '255.255.255.0') => ({ mod: 'elle' as const, ip, maske, gecit, dns1, dns2: '' });
  it('DHCP ve doğru statik IP ile internet var', () => {
    expect(ipDegerlendir('ethernet', undefined).internet).toBe(true);
    expect(ipDegerlendir('ethernet', elle('192.168.1.60')).internet).toBe(true);
  });
  it('çakışma, yanlış alt ağ, ağ geçidi ve DNS', () => {
    expect(ipDegerlendir('ethernet', elle('192.168.1.10')).sorun).toBe('cakisma');
    expect(ipDegerlendir('ethernet', elle('192.168.2.60')).sorun).toBe('alt-ag');
    const g = ipDegerlendir('ethernet', elle('192.168.1.60', '192.168.1.254'));
    expect([g.sorun, g.yerel, g.internet]).toEqual(['gecit', true, false]);
    const d = ipDegerlendir('ethernet', elle('192.168.1.60', '192.168.1.1', '10.0.0.53'));
    expect([d.sorun, d.disari, d.internet]).toEqual(['dns', true, false]);
  });
  it('biçim hataları kaydedilmez', () => {
    expect(ayarHatalari(elle('192.168.1.300'))).not.toHaveLength(0);
    expect(ayarHatalari(elle('192.168.1.60', '192.168.1.1', '8.8.8.8', '255.0.255.0'))).not.toHaveLength(0);
    expect(ayarHatalari(elle('192.168.1.255'))).not.toHaveLength(0);
  });
  it('Windows: çakışmada internet kopar, ipconfig ve ping bunu gösterir', () => {
    const pc = defaultPc();
    pc.ag.ip = { ethernet: elle('192.168.1.10') };
    derive(pc);
    expect(pc.internet).toBe(false);
    expect(pc.agSorunlari).toContain('cakisma');
    expect(uygula(pc, 'C:', 'ipconfig').cikti).toContain('Çoğaltılmış');
    pc.ag.ip = { ethernet: elle('192.168.1.60', '192.168.1.1', '10.0.0.53') };
    derive(pc);
    expect(uygula(pc, 'C:', 'ping 8.8.8.8').cikti).toContain('Kaybolan = 0');
    expect(uygula(pc, 'C:', 'ping google.com').cikti).toContain('bulamadı');
  });
});

describe('APIPA adresi', () => {
  it('çakışmada geçerli 169.254.x.x verilir', async () => {
    const { ipDegerlendir, ipGecerli } = await import('../web/src/core/ag');
    for (const ip of ['192.168.1.10', '192.168.1.1', '192.168.1.124', '192.168.10.50']) {
      const d = ipDegerlendir(ip.startsWith('192.168.10') ? 'wifi' : 'ethernet', { mod: 'elle', ip, maske: '255.255.255.0', gecit: '192.168.1.1', dns1: '8.8.8.8', dns2: '' });
      expect(d.ip.startsWith('169.254.') && ipGecerli(d.ip), d.ip).toBe(true);
    }
  });
});
