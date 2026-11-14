import { describe, expect, it } from 'vitest';
import { complete, defaultShell, exec, prompt, resolve, tokenize, type ShellState } from '../web/src/core/shell';

function run(s: ShellState, ...lines: string[]) {
  let st = s;
  let last = { out: '', code: 0 };
  for (const l of lines) {
    const r = exec(st, l);
    st = r.state;
    last = r;
  }
  return { s: st, ...last };
}

describe('kabuk simülasyonu', () => {
  const s0 = defaultShell();

  it('istem ve yol çözümleme', () => {
    expect(prompt(s0)).toBe('ogrenci@lab-pc:~$');
    expect(resolve(s0, '../..')).toBe('/');
    expect(resolve(s0, '~/Belgeler/../İndirilenler')).toBe('/home/ogrenci/İndirilenler');
    expect(tokenize('mkdir "Yeni Klasör" a')).toEqual(['mkdir', 'Yeni Klasör', 'a']);
  });

  it('dosya işlemleri', () => {
    const r = run(s0, 'mkdir -p Belgeler/Proje', 'mv İndirilenler/rapor.txt Belgeler/Proje/', 'rm Masaüstü/gecici.tmp', 'cd Belgeler/Proje', 'cat rapor.txt');
    expect(r.out).toContain('Bilgisayar sayısı: 24');
    expect(r.s.dosyalar).toContain('/home/ogrenci/Belgeler/Proje/rapor.txt');
    expect(r.s.dosyalar).not.toContain('/home/ogrenci/İndirilenler/rapor.txt');
    expect(r.s.dosyalar).not.toContain('/home/ogrenci/Masaüstü/gecici.tmp');
    expect(prompt(r.s)).toBe('ogrenci@lab-pc:~/Belgeler/Proje$');
    // önceki durum değişmez (saf fonksiyon)
    expect(s0.dosyalar).toContain('/home/ogrenci/İndirilenler/rapor.txt');
  });

  it('hatalar', () => {
    expect(run(s0, 'cd yok').code).toBe(1);
    expect(run(s0, 'rm Belgeler').out).toContain('Bir dizin');
    expect(run(s0, 'mkdir a/b').code).toBe(1);
    expect(run(s0, 'foo').code).toBe(127);
    expect(run(s0, 'mkdir /etc/x').out).toContain('Erişim engellendi');
  });

  it('cp -r ve rmdir', () => {
    const r = run(s0, 'cp -r Belgeler Yedek', 'rmdir Resimler');
    expect(r.s.dosyalar).toContain('/home/ogrenci/Yedek/notlar.txt');
    expect(r.s.dosyalar).not.toContain('/home/ogrenci/Resimler/');
  });

  it('apt: sudo gerekir, önce update', () => {
    expect(run(s0, 'apt update').out).toContain('root mu?');
    const r = run(s0, 'sudo apt update', 'sudo apt upgrade');
    expect(r.code).toBe(1); // -y olmadan iptal
    const r2 = run(r.s, 'sudo apt upgrade -y');
    expect(r2.s.apt).toMatchObject({ guncel: true, yukseltildi: true, bekleyen: 0 });
  });

  it('kullanıcı yönetimi', () => {
    expect(run(s0, 'adduser stajyer').code).toBe(1);
    const r = run(s0, 'sudo adduser stajyer', 'groups stajyer');
    expect(r.out).toBe('stajyer : stajyer users');
    expect(r.s.dosyalar).toContain('/home/stajyer/');
    const r2 = run(r.s, 'sudo usermod -aG sudo stajyer', 'groups stajyer');
    expect(r2.out).toContain('sudo');
  });

  it('sudo yetkisi olmayan kullanıcı', () => {
    const s = { ...s0, user: 'stajyer', users: [...s0.users, { name: 'stajyer', groups: ['stajyer'] }] };
    expect(run(s, 'sudo apt update').out).toContain('sudoers');
  });

  it('sekme tamamlama', () => {
    expect(complete(s0, 'pw')).toBe('pwd ');
    expect(complete(s0, 'ls')).toBe('ls'); // ls, lsblk, lspci… birden çok eşleşme
    expect(complete(s0, 'cd Bel')).toBe('cd Belgeler/');
    expect(complete(s0, 'cat İndirilenler/ra')).toBe('cat İndirilenler/rapor.txt ');
  });

  it('donanım komutları', () => {
    expect(run(s0, 'free -h').out).toContain('7.6Gi');
    expect(run(s0, 'lspci').out).toContain('Ethernet controller');
    expect(run(s0, 'lsblk').out).toContain('sda');
  });
});

describe('Ubuntu Dosyalar için fsDegistir', () => {
  it('klasör oluşturur, taşır ve dizini günceller', async () => {
    const { defaultShell, fsDegistir, dugum } = await import('../web/src/core/shell');
    const s0 = defaultShell('ayse', 'pc');
    const s1 = fsDegistir(s0, (k) => {
      k.yaz('/home/ayse/Belgeler/Odev', { t: 'd', c: {} });
      const n = k.sil('/home/ayse/Belgeler/notlar.txt');
      if (n) k.yaz('/home/ayse/Belgeler/Odev/notlar.txt', n);
    });
    expect(dugum(s1, '/home/ayse/Belgeler/Odev/notlar.txt')).not.toBeNull();
    expect(dugum(s0, '/home/ayse/Belgeler/notlar.txt')).not.toBeNull();
    expect(s1.dosyalar).toContain('/home/ayse/Belgeler/Odev/');
  });
});
