// Windows Komut İstemi (cmd) ve PowerShell simülasyonu: sanal bilgisayarın dosya sistemi ve durumu üzerinde çalışır.
// Saf fonksiyon: çıktı mevcut duruma göre hesaplanır; değişiklik gerekiyorsa "degis" işlevi döner (act ile uygulanır).
import { adOf, children, parentOf, type WinPc } from './winpc';
import { boyutKB } from './arsiv';
import { kopyala, sil, tasi } from './dosyaIslem';
import { AGLAR, type IpSonuc } from './ag';

export type Kabuk = 'cmd' | 'ps';
export interface Sonuc {
  cikti: string;
  hata?: boolean;
  cwd: string;
  degis?: (pc: WinPc) => void;
  ozel?: 'temizle' | 'cikis' | { ac: string; arg?: string };
}

/** İç yol (C:/Kullanıcılar/…) → gösterim (C:\Users\…) */
export const goster = (p: string) => (/^[A-Z]:$/.test(p) ? p + '\\' : p.replace(/^C:\/Kullanıcılar(?=\/|$)/, 'C:/Users').replace(/\//g, '\\'));
export const istem = (k: Kabuk, cwd: string) => (k === 'ps' ? `PS ${goster(cwd)}> ` : `${goster(cwd)}>`);

/** Kullanıcının yazdığı yolu iç yola çevirir (göreli/mutlak, büyük-küçük harf duyarsız) */
export function coz(pc: WinPc, cwd: string, girdi: string): string {
  let g = girdi.trim().replace(/^"(.*)"$/, '$1').replace(/\\/g, '/');
  if (!g) return cwd;
  let parcalar: string[];
  if (/^[a-z]:/i.test(g)) {
    parcalar = [g.slice(0, 2).toUpperCase(), ...g.slice(2).split('/')];
  } else if (g.startsWith('/')) parcalar = [cwd.slice(0, 2), ...g.split('/')];
  else parcalar = [...cwd.split('/'), ...g.split('/')];
  const out: string[] = [];
  for (const p of parcalar) {
    if (!p || p === '.') continue;
    if (p === '..') {
      if (out.length > 1) out.pop();
      continue;
    }
    out.push(p);
  }
  if (out[0] === 'C:' && out[1]?.toLowerCase() === 'users') out[1] = 'Kullanıcılar';
  // Windows büyük/küçük harfe duyarsızdır: var olan girdinin gerçek adını bul
  let yol = out[0] ?? cwd.slice(0, 2);
  for (const p of out.slice(1)) {
    const aday = `${yol}/${p}`;
    const gercek = pc.fs[aday] ? aday : Object.keys(pc.fs).find((k) => parentOf(k) === yol && adOf(k).toLocaleLowerCase('tr') === p.toLocaleLowerCase('tr'));
    yol = gercek ?? aday;
  }
  return yol;
}

const bayt = (f: { boyut?: string }) => Math.round(boyutKB(f.boyut) * 1024);
const sayi = (n: number) => n.toLocaleString('tr-TR');
const TARIH = '02.03.2026  09:41';

function dir(pc: WinPc, yol: string, k: Kabuk): string {
  const og = children(pc, yol).filter((p) => !pc.fs[p].gizli);
  if (k === 'ps') {
    const s = [`    Dizin: ${goster(yol)}`, '', 'Mode                 LastWriteTime         Length Name', '----                 -------------         ------ ----'];
    for (const p of og) {
      const f = pc.fs[p];
      s.push(`${f.tur === 'klasor' ? 'd-----' : '-a----'}        02.03.2026     09:41 ${f.tur === 'klasor' ? '              ' : String(bayt(f)).padStart(14)} ${adOf(p)}`);
    }
    return s.join('\n') + '\n';
  }
  const s = [` ${yol.slice(0, 1)} sürücüsündeki birimin etiketi ${yol.startsWith('C') ? 'Windows' : (pc.fs[yol.slice(0, 2)]?.boyut ?? 'yok')}.`, ' Birim Seri Numarası: 4A1C-22F0', '', ` ${goster(yol)} dizini`, ''];
  if (!/^[A-Z]:$/.test(yol)) s.push(`${TARIH}    <DIR>          .`, `${TARIH}    <DIR>          ..`);
  let dosya = 0;
  let toplam = 0;
  let klasor = 0;
  for (const p of og) {
    const f = pc.fs[p];
    if (f.tur === 'klasor') {
      klasor++;
      s.push(`${TARIH}    <DIR>          ${adOf(p)}`);
    } else {
      dosya++;
      toplam += bayt(f);
      s.push(`${TARIH} ${sayi(bayt(f)).padStart(17)} ${adOf(p)}`);
    }
  }
  s.push(`${String(dosya).padStart(15)} Dosya ${sayi(toplam).padStart(15)} bayt`, `${String(klasor + (/^[A-Z]:$/.test(yol) ? 0 : 2)).padStart(15)} Dizin ${sayi(398457856000).padStart(15)} bayt boş`);
  return s.join('\n');
}

function ipBlok(d: IpSonuc | null | undefined, tum: boolean, mac: string, ad: string, dns: string): string[] {
  const s: string[] = [];
  if (!d) return ['   Medya Durumu . . . . . . . . . . : Medyanın bağlantısı kesildi', ''];
  s.push(`   Bağlantıya özgü DNS Soneki . . . : ${dns}`);
  if (tum) s.push(`   Açıklama. . . . . . . . . . . . . : ${ad}`, `   Fiziksel Adres. . . . . . . . . . : ${mac}`, `   DHCP Etkin. . . . . . . . . . . . : ${d.dhcp ? 'Evet' : 'Hayır'}`);
  if (d.sorun === 'cakisma') s.push(`   Otomatik Yapılandırma IPv4 Adresi : ${d.ip}(Tercih edilen)`, `   IPv4 Adresi. . . . . . . . . . . : ${d.aciklama.match(/(\d+\.\d+\.\d+\.\d+)/)?.[1] ?? ''}(Çoğaltılmış)`);
  else s.push(`   IPv4 Adresi. . . . . . . . . . . : ${d.ip}${tum ? '(Tercih edilen)' : ''}`);
  s.push(`   Alt Ağ Maskesi . . . . . . . . . : ${d.maske}`, `   Varsayılan Ağ Geçidi . . . . . . : ${d.sorun === 'cakisma' ? '' : d.gecit}`);
  if (tum) s.push(`   DNS Sunucuları . . . . . . . . . : ${d.dns.join('\n                                       ') || ''}`);
  s.push('');
  return s;
}
function ipconfig(pc: WinPc, tum: boolean): string {
  const wifi = pc.aygitlar.some((a) => a.id === 'wifi');
  const s = ['', 'Windows IP Yapılandırması', ''];
  if (tum) s.splice(2, 0, `   Ana Bilgisayar Adı . . . . . . . : ${pc.cihaz.ad}`, '   Birincil Dns Soneki . . . . . . . :', '');
  s.push('Ethernet bağdaştırıcısı Ethernet:', '', ...ipBlok(pc.agDurum?.ethernet, tum, AGLAR.ethernet.mac, pc.aygitlar.find((a) => a.id === 'lan')?.ad ?? 'Ethernet', 'okul.local'));
  if (wifi) s.push('Kablosuz LAN bağdaştırıcısı Wi-Fi:', '', ...ipBlok(pc.agDurum?.wifi, tum, AGLAR.wifi.mac, pc.aygitlar.find((a) => a.id === 'wifi')?.ad ?? 'Wi-Fi', (pc.ag?.wifi ?? '').toLowerCase()));
  return s.join('\n');
}

function ping(pc: WinPc, hedef: string, ps: boolean): string {
  const h = hedef || 'google.com';
  const yerel = /^(127\.0\.0\.1|localhost)$/i.test(h);
  const ipHedef = /^\d+\.\d+\.\d+\.\d+$/.test(h);
  const durumlar = [pc.agDurum?.ethernet, pc.agDurum?.wifi].filter((x): x is IpSonuc => !!x);
  const dnsVar = durumlar.some((d) => d.internet);
  const disari = durumlar.some((d) => d.disari);
  const yerelAg = (ip: string) => durumlar.some((d) => d.yerel && ip.startsWith(d.ip.split('.').slice(0, 3).join('.') + '.'));
  if (!yerel && !ipHedef && !dnsVar)
    return ps ? `Test-Connection : '${h}' bilgisayarı ile bağlantı testi başarısız oldu: Ad çözümlenemedi.` : `Ping isteği ${h} ana bilgisayarını bulamadı. Lütfen adı denetleyin ve yeniden deneyin.`;
  const ulasir = yerel || (ipHedef ? (/^192\.168\./.test(h) ? yerelAg(h) && (Object.keys(AGLAR.ethernet.dolu).includes(h) || Object.keys(AGLAR.wifi.dolu).includes(h)) : disari) : dnsVar);
  const ip = yerel ? '127.0.0.1' : ipHedef ? h : h.includes('google') ? '142.250.187.110' : h.includes('microsoft') ? '20.112.250.133' : '104.18.32.47';
  if (!ulasir) {
    if (ps) return `Test-Connection : '${h}' bilgisayarı ile bağlantı testi başarısız oldu: İstek zaman aşımına uğradı.`;
    const kaynak = durumlar[0]?.ip;
    const satir = durumlar.length && !durumlar.some((d) => d.yerel) && kaynak ? `${kaynak} yanıtı: Hedef ana bilgisayara ulaşılamıyor.` : 'İstek zaman aşımına uğradı.';
    return ['', `${h} [${ip}] için 32 bayt veriyle Ping atılıyor:`, satir, satir, satir, satir, '', `${ip} için Ping istatistikleri:`, '    Paket: Giden = 4, Gelen = 0, Kaybolan = 4 (%100 kayıp),'].join('\n');
  }
  const sure = [12, 11, 14, 12].map((x) => (yerel || /^192\.168\./.test(h) ? 0 : x));
  const s = ['', `${h} [${ip}] için 32 bayt veriyle Ping atılıyor:`];
  for (const t of sure) s.push(`${ip} yanıtı: bayt=32 süre${t === 0 ? '<1' : '=' + t}ms TTL=${yerel ? 128 : /^192\.168\./.test(h) ? 64 : 117}`);
  s.push('', `${ip} için Ping istatistikleri:`, '    Paket: Giden = 4, Gelen = 4, Kaybolan = 0 (%0 kayıp),', 'Milisaniye türünden yaklaşık tur süreleri:', `    En Az = ${Math.min(...sure)}ms, En Çok = ${Math.max(...sure)}ms, Ortalama = ${Math.round(sure.reduce((a, b) => a + b, 0) / 4)}ms`);
  return s.join('\n');
}

const CMD_YARDIM = `Belirli bir komut hakkında daha fazla bilgi için HELP komut-adı yazın
CD        Geçerli dizinin adını görüntüler ya da değiştirir.
CLS       Ekranı temizler.
COPY      Bir ya da daha fazla dosyayı başka bir konuma kopyalar.
DATE      Tarihi görüntüler.
DEL       Bir ya da daha fazla dosyayı siler.
DIR       Bir dizindeki dosyaların ve alt dizinlerin listesini görüntüler.
ECHO      İleti görüntüler (ECHO metin > dosya.txt ile dosyaya yazar).
EXIT      CMD.EXE programından çıkar.
HOSTNAME  Bilgisayarın adını görüntüler.
IPCONFIG  IP yapılandırmasını görüntüler (IPCONFIG /ALL).
MD        Dizin oluşturur.
MOVE      Dosyaları bir dizinden diğerine taşır.
PING      Bir bilgisayarın ağda erişilebilir olduğunu sınar.
RD        Dizini kaldırır.
REN       Dosyayı yeniden adlandırır.
SYSTEMINFO  Bilgisayarın yapılandırmasını görüntüler.
TASKLIST  Çalışan görevleri görüntüler.
TASKKILL  Çalışan bir işlemi sonlandırır (TASKKILL /IM ad /F).
TIME      Saati görüntüler.
TREE      Bir sürücünün ya da yolun dizin yapısını görsel olarak görüntüler.
TYPE      Metin dosyasının içeriğini görüntüler.
VER       Windows sürümünü görüntüler.
WHOAMI    Oturum açmış kullanıcıyı görüntüler.`;

const PS_YARDIM = `Sık kullanılan PowerShell komutları (cmdlet'ler) ve kısa adları:
  Get-ChildItem (ls, dir)      Klasör içeriğini listeler
  Set-Location (cd)            Klasör değiştirir
  Get-Location (pwd)           Geçerli klasörü gösterir
  New-Item -ItemType Directory ad (mkdir)   Klasör oluşturur
  Remove-Item (rm, del)        Dosya/klasör siler
  Copy-Item (cp) / Move-Item (mv)           Kopyalar / taşır
  Get-Content (cat, type)      Dosya içeriğini gösterir
  Get-Process (ps)             Çalışan işlemleri listeler
  Stop-Process -Name ad        İşlemi sonlandırır
  Get-Date                     Tarih ve saat
  Test-Connection ad (ping)    Ağ bağlantısını sınar
  Clear-Host (cls)             Ekranı temizler
  ipconfig, whoami, hostname   Windows komutları da çalışır`;

/** Bir komut satırını çalıştırır */
export function calistir(pc: WinPc, cwd: string, satir: string, k: Kabuk): Sonuc {
  const s = satir.trim();
  if (!s) return { cikti: '', cwd };
  // echo metin > dosya
  const yonlendir = /^(echo|write-output)\s+(.*?)\s*(>>?)\s*(\S+)$/i.exec(s);
  if (yonlendir) {
    const yol = coz(pc, cwd, yonlendir[4]);
    const ek = yonlendir[3] === '>>';
    const metin = yonlendir[2].replace(/^"(.*)"$/, '$1');
    return {
      cikti: '',
      cwd,
      degis: (p) => {
        const onceki = ek ? (p.fs[yol]?.icerik ?? '') : '';
        const icerik = onceki + metin + '\r\n';
        p.fs[yol] = { tur: 'dosya', boyut: `${Math.max(1, Math.ceil(icerik.length / 1024))} KB`, icerik };
      },
    };
  }
  const [komut0, ...arg] = s.split(/\s+/);
  const komut = komut0.toLowerCase();
  const argStr = s.slice(komut0.length).trim();
  const bilinmiyor = (): Sonuc =>
    k === 'ps'
      ? { cikti: `${komut0} : '${komut0}' terimi bir cmdlet, işlev, betik dosyası veya çalıştırılabilir program adı olarak tanınmıyor.\nAdın yazımını denetleyin ya da bir yol varsa doğru olduğunu doğrulayıp yeniden deneyin.`, hata: true, cwd }
      : { cikti: `'${komut0}' iç ya da dış komut, çalıştırılabilir\nprogram ya da toplu iş dosyası olarak tanınmıyor.`, hata: true, cwd };
  const yolYok = (y: string): Sonuc => ({ cikti: k === 'ps' ? `Get-Item : '${goster(y)}' yolu bulunamıyor çünkü yok.` : 'Sistem belirtilen yolu bulamıyor.', hata: true, cwd });
  const parametresiz = arg.filter((a) => !/^[-/]/.test(a));

  // Sürücü değiştirme: "E:"
  if (/^[a-z]:$/i.test(s)) {
    const d = s.toUpperCase();
    return pc.fs[d] ? { cikti: '', cwd: d } : { cikti: 'Sistem belirtilen sürücüyü bulamıyor.', hata: true, cwd };
  }

  switch (komut) {
    case 'help':
    case 'get-help':
      return { cikti: k === 'ps' ? PS_YARDIM : CMD_YARDIM, cwd };
    case 'cls':
    case 'clear':
    case 'clear-host':
      return { cikti: '', cwd, ozel: 'temizle' };
    case 'exit':
      return { cikti: '', cwd, ozel: 'cikis' };
    case 'ver':
      return { cikti: `\nMicrosoft Windows [Version 10.0.${pc.cihaz.yapi.match(/(\d{5})/)?.[1] ?? '26100'}.2314]`, cwd };
    case 'whoami':
      return { cikti: `${pc.cihaz.ad.toLowerCase()}\\${pc.cihaz.kullanici.toLowerCase()}`, cwd };
    case 'hostname':
      return { cikti: pc.cihaz.ad, cwd };
    case 'pwd':
    case 'get-location':
      return { cikti: k === 'ps' ? `\nPath\n----\n${goster(cwd)}\n` : goster(cwd), cwd };
    case 'date':
    case 'get-date': {
      const d = new Date();
      return { cikti: komut === 'get-date' ? d.toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'medium' }) : `Geçerli tarih: ${d.toLocaleDateString('tr-TR')}`, cwd };
    }
    case 'time':
      return { cikti: `Geçerli saat: ${new Date().toLocaleTimeString('tr-TR')}`, cwd };
    case 'echo':
    case 'write-output':
    case 'write-host':
      return { cikti: argStr.replace(/^"(.*)"$/, '$1') || (k === 'cmd' ? 'ECHO açık.' : ''), cwd };
    case 'cd':
    case 'chdir':
    case 'set-location':
    case 'cd..': {
      if (komut === 'cd..') return { cikti: '', cwd: parentOf(cwd) || cwd };
      if (!argStr) return { cikti: k === 'cmd' ? goster(cwd) : '', cwd };
      const y = coz(pc, cwd, argStr.replace(/^\/d\s+/i, ''));
      if (!pc.fs[y] || pc.fs[y].tur !== 'klasor') return yolYok(y);
      return { cikti: '', cwd: y };
    }
    case 'dir':
    case 'ls':
    case 'gci':
    case 'get-childitem': {
      const y = parametresiz.length ? coz(pc, cwd, parametresiz.join(' ')) : cwd;
      if (!pc.fs[y]) return k === 'cmd' ? { cikti: 'Dosya Bulunamadı', hata: true, cwd } : yolYok(y);
      return { cikti: dir(pc, y, k === 'cmd' && komut === 'dir' ? 'cmd' : k), cwd };
    }
    case 'tree': {
      const satirlar = [`Klasör YOLU listesi`, `${goster(cwd)}`];
      const yaz = (y: string, onek: string) => {
        const alt = children(pc, y).filter((p) => pc.fs[p].tur === 'klasor' && !pc.fs[p].gizli);
        alt.forEach((p, i) => {
          const son = i === alt.length - 1;
          satirlar.push(`${onek}${son ? '└───' : '├───'}${adOf(p)}`);
          if (onek.length < 8) yaz(p, onek + (son ? '    ' : '│   '));
        });
      };
      yaz(cwd, '');
      return { cikti: satirlar.join('\n'), cwd };
    }
    case 'md':
    case 'mkdir':
    case 'new-item': {
      const ad = parametresiz.filter((a) => !/^directory$/i.test(a)).join(' ');
      if (!ad) return { cikti: 'Komutun sözdizimi yanlış.', hata: true, cwd };
      const y = coz(pc, cwd, ad);
      if (pc.fs[y]) return { cikti: `${ad} alt dizini ya da dosyası zaten var.`, hata: true, cwd };
      return { cikti: k === 'ps' ? `\n    Dizin: ${goster(parentOf(y))}\n\nMode                 LastWriteTime         Length Name\n----                 -------------         ------ ----\nd-----        02.03.2026     09:41                ${adOf(y)}\n` : '', cwd, degis: (p) => void (p.fs[y] = { tur: 'klasor' }) };
    }
    case 'rd':
    case 'rmdir':
    case 'del':
    case 'erase':
    case 'rm':
    case 'remove-item': {
      const ad = parametresiz.join(' ');
      if (!ad) return { cikti: 'Komutun sözdizimi yanlış.', hata: true, cwd };
      const y = coz(pc, cwd, ad);
      if (!pc.fs[y]) return k === 'ps' ? yolYok(y) : { cikti: `Bulunamadı: ${goster(y)}`, hata: true, cwd };
      const klasor = pc.fs[y].tur === 'klasor';
      if ((komut === 'del' || komut === 'erase') && k === 'cmd' && klasor) return { cikti: `${goster(y)}\\*, Emin misiniz (E/H)? E`, cwd, degis: (p) => sil(p, children(p, y).filter((c) => p.fs[c].tur === 'dosya')) };
      if ((komut === 'rd' || komut === 'rmdir') && klasor && children(pc, y).length && !arg.some((a) => /^\/s$/i.test(a))) return { cikti: 'Dizin boş değil.', hata: true, cwd };
      if (y.split('/').length <= 2 || /^C:\/(Windows|Program Files)/.test(y)) return { cikti: 'Erişim engellendi.', hata: true, cwd };
      return { cikti: '', cwd, degis: (p) => sil(p, [y]) };
    }
    case 'type':
    case 'cat':
    case 'get-content':
    case 'gc': {
      const y = coz(pc, cwd, parametresiz.join(' '));
      const f = pc.fs[y];
      if (!f || f.tur !== 'dosya') return k === 'ps' ? yolYok(y) : { cikti: 'Sistem belirtilen dosyayı bulamıyor.', hata: true, cwd };
      return { cikti: f.icerik ?? (/\.(txt|log|ini|csv)$/i.test(y) ? '' : 'PK\u0003\u0004\u0014\u0000\u0006\u0000\b\u0000!\u0000ß¤ÒlZ\u0001\u0000 ...'), cwd };
    }
    case 'copy':
    case 'cp':
    case 'copy-item':
    case 'move':
    case 'mv':
    case 'move-item': {
      if (parametresiz.length < 2) return { cikti: 'Komutun sözdizimi yanlış.', hata: true, cwd };
      const kaynak = coz(pc, cwd, parametresiz[0]);
      const hedef0 = coz(pc, cwd, parametresiz[1]);
      if (!pc.fs[kaynak]) return { cikti: 'Sistem belirtilen dosyayı bulamıyor.', hata: true, cwd };
      const tasima = /^(move|mv|move-item)$/.test(komut);
      const klasoreMi = pc.fs[hedef0]?.tur === 'klasor' || /^[A-Z]:$/.test(hedef0);
      return {
        cikti: k === 'cmd' ? `        1 dosya ${tasima ? 'taşındı' : 'kopyalandı'}.` : '',
        cwd,
        degis: (p) => {
          if (klasoreMi) (tasima ? tasi : kopyala)(p, [kaynak], hedef0);
          else {
            p.fs[hedef0] = { ...p.fs[kaynak] };
            if (tasima) delete p.fs[kaynak];
          }
        },
      };
    }
    case 'ren':
    case 'rename':
    case 'rename-item': {
      if (parametresiz.length < 2) return { cikti: 'Komutun sözdizimi yanlış.', hata: true, cwd };
      const eski = coz(pc, cwd, parametresiz[0]);
      if (!pc.fs[eski]) return { cikti: 'Sistem belirtilen dosyayı bulamıyor.', hata: true, cwd };
      const yeni = `${parentOf(eski)}/${parametresiz[1]}`;
      return {
        cikti: '',
        cwd,
        degis: (p) => {
          for (const key of Object.keys(p.fs))
            if (key === eski || key.startsWith(eski + '/')) {
              p.fs[yeni + key.slice(eski.length)] = p.fs[key];
              delete p.fs[key];
            }
        },
      };
    }
    case 'ipconfig':
      return { cikti: ipconfig(pc, /\/all/i.test(argStr)), cwd };
    case 'ping':
    case 'test-connection':
      return { cikti: ping(pc, parametresiz[0] ?? '', komut === 'test-connection'), cwd };
    case 'tasklist':
    case 'get-process':
    case 'ps': {
      if (k === 'ps' && komut !== 'tasklist')
        return { cikti: ['', 'Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName', '-------  ------    -----      -----     ------     --  -- -----------', ...pc.surecler.map((p, i) => `${String(200 + i * 37).padStart(7)} ${String(12 + i).padStart(7)} ${String(p.ram * 410).padStart(8)} ${String(p.ram * 1024).padStart(10)} ${p.cpu.toFixed(2).padStart(10)} ${String(1000 + i * 412).padStart(6)}   1 ${p.id}`)].join('\n'), cwd };
      return { cikti: ['', 'Görüntü Adı                    PID Oturum Adı        Oturum#    Bellek Kull.', '========================= ======== ================ =========== ============', ...pc.surecler.map((p, i) => `${(p.id + '.exe').padEnd(25)} ${String(1000 + i * 412).padStart(8)} Console                    1 ${sayi(p.ram * 1024).padStart(10)} K`)].join('\n'), cwd };
    }
    case 'taskkill':
    case 'stop-process':
    case 'kill': {
      const ad = (arg[arg.findIndex((a) => /^(\/im|-name)$/i.test(a)) + 1] ?? parametresiz[0] ?? '').replace(/\.exe$/i, '').toLowerCase();
      const sur = pc.surecler.find((p) => p.id.toLowerCase() === ad);
      if (!sur) return { cikti: k === 'ps' ? `Stop-Process : "${ad}" adlı işlem bulunamıyor.` : `HATA: "${ad}.exe" işlemi bulunamadı.`, hata: true, cwd };
      if (sur.sistem) return { cikti: k === 'ps' ? 'Stop-Process : Erişim engellendi.' : `HATA: "${ad}.exe" (PID 1000) işlemi sonlandırılamadı.\nNedeni: Erişim engellendi.`, hata: true, cwd };
      return { cikti: k === 'ps' ? '' : `BAŞARILI: "${ad}.exe" işlemi sonlandırıldı.`, cwd, degis: (p) => void (p.surecler = p.surecler.filter((x) => x.id !== sur.id)) };
    }
    case 'systeminfo':
      return {
        cikti: [
          '',
          `Ana Bilgisayar Adı:            ${pc.cihaz.ad}`,
          `İşletim Sistemi Adı:           Microsoft ${pc.cihaz.surum}`,
          `İşletim Sistemi Sürümü:        10.0.26100 Yapı 26100`,
          `Kayıtlı Sahip:                 ${pc.cihaz.kullanici}`,
          `Sistem Türü:                   x64-based PC`,
          `İşlemci(ler):                  ${pc.cihaz.islemci}`,
          `Toplam Fiziksel Bellek:        ${pc.cihaz.ram}`,
          `Ağ Kartları:                   ${pc.aygitlar.filter((a) => a.kategori.startsWith('Ağ')).map((a) => a.ad).join(', ')}`,
        ].join('\n'),
        cwd,
      };
    case '$psversiontable':
      return { cikti: '\nName                           Value\n----                           -----\nPSVersion                      5.1.26100.2314\nPSEdition                      Desktop\n', cwd };
    case 'notepad':
      return { cikti: '', cwd, ozel: { ac: 'notdefteri', arg: parametresiz.length ? coz(pc, cwd, parametresiz.join(' ')) : undefined } };
    case 'explorer':
      return { cikti: '', cwd, ozel: { ac: 'dosya', arg: parametresiz.length ? coz(pc, cwd, parametresiz.join(' ')) : cwd } };
    case 'powershell':
      return { cikti: '', cwd, ozel: { ac: 'powershell', arg: cwd } };
    case 'cmd':
      return { cikti: '', cwd, ozel: { ac: 'cmd', arg: cwd } };
    case 'shutdown':
      return { cikti: 'Bu simülasyonda bilgisayarı Başlat menüsündeki Güç düğmesinden kapatın.', cwd };
    default:
      return bilinmiyor();
  }
}

/** Tab ile tamamlama: son sözcüğü geçerli klasördeki dosya/klasör adlarıyla tamamlar */
export function tamamla(pc: WinPc, cwd: string, satir: string): string {
  const i = satir.lastIndexOf(' ');
  if (i < 0) return satir;
  const son = satir.slice(i + 1);
  const klasor = son.includes('\\') ? coz(pc, cwd, son.slice(0, son.lastIndexOf('\\'))) : cwd;
  const onek = son.includes('\\') ? son.slice(son.lastIndexOf('\\') + 1) : son;
  const aday = children(pc, klasor).find((p) => adOf(p).toLocaleLowerCase('tr').startsWith(onek.toLocaleLowerCase('tr')));
  if (!aday) return satir;
  const ad = adOf(aday);
  const tam = (son.includes('\\') ? son.slice(0, son.lastIndexOf('\\') + 1) : '') + (ad.includes(' ') ? `"${ad}"` : ad);
  return satir.slice(0, i + 1) + tam;
}
