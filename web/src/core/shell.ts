// Ubuntu terminali için eğitsel kabuk simülasyonu (gerçek kabuk değildir).
// Saf fonksiyonlar: exec(durum, satır) → { durum, çıktı, kod }. Görev kuralları durum üzerinden denetlenir.

export type FsNode = { t: 'd'; c: Record<string, FsNode> } | { t: 'f'; v: string };

export interface ShellUser {
  name: string;
  groups: string[];
}

export interface ShellState {
  user: string;
  host: string;
  cwd: string;
  fs: FsNode;
  users: ShellUser[];
  apt: { guncel: boolean; yukseltildi: boolean; bekleyen: number; kurulu: string[] };
  /** Kurallar için düz dosya/klasör listesi (mutlak yollar; klasörler '/' ile biter) */
  dosyalar: string[];
  /** Kurallar için: kullanıcı adları ve sudo grubundakiler */
  kullanicilar: string[];
  sudocular: string[];
  history: string[];
  sistem: { ram: string; disk: string; cpu: string; ag: string; ekran: string; ip: string };
  /** Çift önyükleme: GRUB menüsünde Windows girişi var mı (update-grub ile os-prober çalışınca) */
  grub: { windows: boolean; osProber: boolean };
  /** Kurulu sistemde diskin gerçek bölümleri (lsblk için; yoksa canlı oturum düzeni) */
  bolumler?: { boyut: string; baglama: string }[];
}

export interface ExecResult {
  state: ShellState;
  out: string;
  code: number;
  /** komutun adı (sudo hariç) — olay kaydı için */
  ad: string;
  clear?: boolean;
}

const dir = (c: Record<string, FsNode> = {}): FsNode => ({ t: 'd', c });
const file = (v = ''): FsNode => ({ t: 'f', v });

export function defaultShell(user = 'ogrenci', host = 'lab-pc'): ShellState {
  const home = dir({
    Masaüstü: dir({ 'gecici.tmp': file('geçici dosya\n') }),
    Belgeler: dir({ 'notlar.txt': file('İşletim sistemleri dersi notları\n') }),
    İndirilenler: dir({ 'rapor.txt': file('Laboratuvar envanter raporu\nBilgisayar sayısı: 24\n') }),
    Resimler: dir(),
    Müzik: dir(),
    Videolar: dir(),
  });
  const s: ShellState = {
    user,
    host,
    cwd: `/home/${user}`,
    fs: dir({
      home: dir({ [user]: home }),
      etc: dir({
        default: dir({ grub: file('GRUB_DEFAULT=0\nGRUB_TIMEOUT_STYLE=hidden\nGRUB_TIMEOUT=0\nGRUB_CMDLINE_LINUX_DEFAULT="quiet splash"\n#GRUB_DISABLE_OS_PROBER=false\n') }),
        hostname: file(host + '\n'), 'os-release': file('PRETTY_NAME="Ubuntu 24.04.1 LTS"\nNAME="Ubuntu"\nVERSION_ID="24.04"\n') }),
      tmp: dir(),
      usr: dir({ bin: dir() }),
      var: dir({ log: dir() }),
      boot: dir({ efi: dir() }),
    }),
    users: [
      { name: 'root', groups: ['root'] },
      { name: user, groups: [user, 'adm', 'sudo'] },
    ],
    apt: { guncel: false, yukseltildi: false, bekleyen: 0, kurulu: [] },
    grub: { windows: true, osProber: true },
    dosyalar: [],
    kullanicilar: [],
    sudocular: [],
    history: [],
    sistem: { ram: '7.6Gi', disk: '238.5G', cpu: 'Intel(R) Core(TM) i5-10400 CPU @ 2.90GHz', ag: 'Realtek Semiconductor Co., Ltd. RTL8111/8168/8211/8411 PCI Express Gigabit Ethernet Controller', ekran: 'Intel Corporation CometLake-S GT2 [UHD Graphics 630]', ip: '192.168.1.57' },
  };
  return withIndex(s);
}

// ---------- Dosya sistemi yardımcıları ----------

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function homeOf(s: ShellState, user = s.user): string {
  return user === 'root' ? '/root' : `/home/${user}`;
}

export function resolve(s: ShellState, p: string): string {
  if (!p || p === '~') return homeOf(s);
  if (p.startsWith('~/')) p = homeOf(s) + p.slice(1);
  const abs = p.startsWith('/') ? p : (s.cwd === '/' ? '' : s.cwd) + '/' + p;
  const parts: string[] = [];
  for (const seg of abs.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return '/' + parts.join('/');
}

function getNode(root: FsNode, abs: string): FsNode | null {
  let n: FsNode = root;
  for (const seg of abs.split('/').filter(Boolean)) {
    if (n.t !== 'd' || !(seg in n.c)) return null;
    n = n.c[seg];
  }
  return n;
}

function parentAndName(abs: string): [string, string] {
  const i = abs.lastIndexOf('/');
  return [abs.slice(0, i) || '/', abs.slice(i + 1)];
}

function walk(n: FsNode, base: string, out: string[]) {
  if (n.t !== 'd') return;
  for (const [k, v] of Object.entries(n.c)) {
    const p = (base === '/' ? '' : base) + '/' + k;
    out.push(v.t === 'd' ? p + '/' : p);
    walk(v, p, out);
  }
}

function withIndex(s: ShellState): ShellState {
  const out: string[] = [];
  walk(s.fs, '/', out);
  s.dosyalar = out.filter((p) => p.startsWith('/home/') || p.startsWith('/tmp/')).sort();
  s.kullanicilar = s.users.map((u) => u.name);
  s.sudocular = s.users.filter((u) => u.groups.includes('sudo')).map((u) => u.name);
  return s;
}

function pretty(s: ShellState, abs: string): string {
  const h = homeOf(s);
  if (abs === h) return '~';
  if (abs.startsWith(h + '/')) return '~' + abs.slice(h.length);
  return abs;
}

export function prompt(s: ShellState): string {
  return `${s.user}@${s.host}:${pretty(s, s.cwd)}${s.user === 'root' ? '#' : '$'}`;
}

/** Tırnakları destekleyen basit argüman ayırıcı */
export function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q: string | null = null;
  let has = false;
  for (const ch of line) {
    if (q) {
      if (ch === q) q = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      q = ch;
      has = true;
    } else if (/\s/.test(ch)) {
      if (cur || has) out.push(cur);
      cur = '';
      has = false;
    } else cur += ch;
  }
  if (cur || has) out.push(cur);
  return out;
}

const PKGS: Record<string, { ad: string; boyut: string }> = {
  'google-chrome-stable': { ad: 'google-chrome-stable', boyut: '112 MB' },
};

export const COMMANDS = ['update-grub', 'os-prober', 'nano', 'pwd', 'ls', 'cd', 'mkdir', 'touch', 'cat', 'cp', 'mv', 'rm', 'rmdir', 'echo', 'whoami', 'hostname', 'uname', 'lsblk', 'lspci', 'lsusb', 'free', 'df', 'ip', 'ping', 'sudo', 'apt', 'adduser', 'deluser', 'passwd', 'usermod', 'groups', 'id', 'clear', 'history', 'help', 'man', 'date'];

const HELP = `Kullanılabilen komutlar (eğitsel simülasyon):
  Dosya:     pwd  ls [-l] [-a]  cd  mkdir [-p]  touch  cat  cp [-r]  mv  rm [-r]  rmdir
  Sistem:    whoami  hostname  uname -a  date  lsblk  lspci  lsusb  free -h  df -h  ip a  ping -c 4 <adres>
  Paketler:  sudo apt update   sudo apt upgrade   sudo apt install <paket>
  Önyükleme: sudo os-prober   sudo update-grub   cat /etc/default/grub
  Kullanıcı: sudo adduser <ad>  sudo passwd <ad>  sudo usermod -aG <grup> <ad>  groups [ad]  id [ad]  sudo deluser <ad>
  Diğer:     clear  history  man <komut>  help`;

const MAN: Record<string, string> = {
  ls: 'ls — dizin içeriğini listeler. -l: ayrıntılı, -a: gizli dosyalar da',
  cd: 'cd — çalışma dizinini değiştirir. cd .. bir üst dizin, cd ~ ev dizini',
  mkdir: 'mkdir — dizin oluşturur. -p: üst dizinleri de oluşturur',
  cp: 'cp — dosya kopyalar. -r: dizinleri de kopyalar',
  mv: 'mv — taşır ya da yeniden adlandırır',
  rm: 'rm — dosya siler. -r: dizinleri içindekilerle siler (dikkat: geri alınamaz)',
  apt: 'apt — paket yöneticisi. update: paket listesini yeniler, upgrade: kurulu paketleri yükseltir, install: paket kurar',
  sudo: 'sudo — komutu yönetici (root) yetkisiyle çalıştırır',
  adduser: 'adduser — yeni kullanıcı ekler (yönetici yetkisi gerekir)',
  usermod: 'usermod -aG <grup> <kullanıcı> — kullanıcıyı gruba ekler. sudo grubu yönetici yetkisi verir',
  lsblk: 'lsblk — diskleri ve bölümleri listeler',
  free: 'free -h — bellek (RAM) kullanımını gösterir',
  df: 'df -h — dosya sistemlerinin doluluk durumunu gösterir',
  lspci: 'lspci — PCI aygıtlarını (ekran kartı, ağ kartı…) listeler',
};

function lsLong(name: string, n: FsNode, owner: string): string {
  const d = n.t === 'd';
  const size = d ? 4096 : new TextEncoder().encode((n as { v: string }).v).length;
  return `${d ? 'drwxr-xr-x' : '-rw-r--r--'} ${d ? 2 : 1} ${owner} ${owner} ${String(size).padStart(5)} Mar  2 09:40 ${name}`;
}

export function exec(prev: ShellState, line: string): ExecResult {
  let s = clone(prev);
  const raw = line.trim();
  if (raw) s.history.push(raw);
  let args = tokenize(raw);
  if (args.length === 0) return { state: s, out: '', code: 0, ad: '' };
  let root = s.user === 'root';
  if (args[0] === 'sudo') {
    const me = s.users.find((u) => u.name === s.user);
    if (!root && !me?.groups.includes('sudo')) return { state: s, out: `${s.user} is not in the sudoers file.  This incident will be reported.`, code: 1, ad: args[1] ?? 'sudo' };
    root = true;
    args = args.slice(1);
    if (args.length === 0) return { state: s, out: 'usage: sudo command', code: 1, ad: 'sudo' };
  }
  const [cmd, ...rest] = args;
  const flags = rest.filter((a) => a.startsWith('-'));
  const params = rest.filter((a) => !a.startsWith('-'));
  const has = (f: string) => flags.some((x) => x === '-' + f || (x.startsWith('-') && !x.startsWith('--') && x.includes(f)));
  const R = (out: string, code = 0): ExecResult => ({ state: withIndex(s), out, code, ad: cmd });
  const err = (m: string) => R(m, 1);
  const owner = s.user;
  const writable = (abs: string) => root || abs.startsWith(homeOf(s)) || abs.startsWith('/tmp');

  switch (cmd) {
    case 'pwd':
      return R(s.cwd);
    case 'whoami':
      return R(root ? 'root' : s.user);
    case 'hostname':
      return R(s.host);
    case 'date':
      return R('Pzt 02 Mar 2026 09:41:07 +03');
    case 'clear':
      return { ...R(''), clear: true };
    case 'help':
      return R(HELP);
    case 'history':
      return R(s.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join('\n'));
    case 'man':
      return params[0] ? R(MAN[params[0]] ?? `No manual entry for ${params[0]}`, MAN[params[0]] ? 0 : 16) : err('What manual page do you want?');
    case 'echo':
      return R(params.join(' '));
    case 'cd': {
      const target = resolve(s, params[0] ?? '~');
      const n = getNode(s.fs, target);
      if (!n) return err(`bash: cd: ${params[0]}: Böyle bir dosya ya da dizin yok`);
      if (n.t !== 'd') return err(`bash: cd: ${params[0]}: Bir dizin değil`);
      s.cwd = target;
      return R('');
    }
    case 'ls': {
      const target = resolve(s, params[0] ?? '.');
      const n = getNode(s.fs, target);
      if (!n) return err(`ls: '${params[0]}' erişilemedi: Böyle bir dosya ya da dizin yok`);
      if (n.t === 'f') return R(has('l') ? lsLong(params[0], n, owner) : params[0]);
      let names = Object.keys(n.c).sort((a, b) => a.localeCompare(b, 'tr'));
      if (!has('a')) names = names.filter((x) => !x.startsWith('.'));
      if (has('l')) return R([`toplam ${names.length * 4}`, ...names.map((k) => lsLong(k, n.c[k], owner))].join('\n'));
      return R(names.map((k) => (n.c[k].t === 'd' ? `\u001b[d]${k}` : k)).join('  '));
    }
    case 'mkdir': {
      if (!params.length) return err('mkdir: eksik terim');
      for (const p of params) {
        const abs = resolve(s, p);
        if (!writable(abs)) return err(`mkdir: '${p}' dizini oluşturulamıyor: Erişim engellendi`);
        if (getNode(s.fs, abs)) {
          if (has('p')) continue;
          return err(`mkdir: '${p}' dizini oluşturulamıyor: Dosya mevcut`);
        }
        const segs = abs.split('/').filter(Boolean);
        let n = s.fs as { t: 'd'; c: Record<string, FsNode> };
        for (let i = 0; i < segs.length; i++) {
          const seg = segs[i];
          if (!(seg in n.c)) {
            if (i < segs.length - 1 && !has('p')) return err(`mkdir: '${p}' dizini oluşturulamıyor: Böyle bir dosya ya da dizin yok`);
            n.c[seg] = dir();
          }
          const nx = n.c[seg];
          if (nx.t !== 'd') return err(`mkdir: '${p}': Bir dizin değil`);
          n = nx;
        }
      }
      return R('');
    }
    case 'touch': {
      if (!params.length) return err('touch: eksik dosya terimi');
      for (const p of params) {
        const abs = resolve(s, p);
        const [par, name] = parentAndName(abs);
        const pn = getNode(s.fs, par);
        if (!pn || pn.t !== 'd') return err(`touch: '${p}' açılamadı: Böyle bir dosya ya da dizin yok`);
        if (!writable(abs)) return err(`touch: '${p}' açılamadı: Erişim engellendi`);
        if (!pn.c[name]) pn.c[name] = file('');
      }
      return R('');
    }
    case 'cat': {
      if (!params.length) return err('cat: dosya adı gerekli (bu simülasyonda)');
      const outs: string[] = [];
      for (const p of params) {
        const n = getNode(s.fs, resolve(s, p));
        if (!n) return err(`cat: ${p}: Böyle bir dosya ya da dizin yok`);
        if (n.t === 'd') return err(`cat: ${p}: Bir dizin`);
        outs.push(n.v.replace(/\n$/, ''));
      }
      return R(outs.join('\n'));
    }
    case 'cp':
    case 'mv': {
      if (params.length < 2) return err(`${cmd}: '${params[0] ?? ''}' sonrasında hedef dosya terimi eksik`);
      const dest = resolve(s, params[params.length - 1]);
      const destNode = getNode(s.fs, dest);
      for (const p of params.slice(0, -1)) {
        const src = resolve(s, p);
        const n = getNode(s.fs, src);
        if (!n) return err(`${cmd}: '${p}' durumlanamadı: Böyle bir dosya ya da dizin yok`);
        if (n.t === 'd' && cmd === 'cp' && !has('r')) return err(`cp: -r belirtilmedi; '${p}' dizini atlanıyor`);
        const [, name] = parentAndName(src);
        const target = destNode && destNode.t === 'd' ? (dest === '/' ? '' : dest) + '/' + name : dest;
        if (target === src || target.startsWith(src + '/')) return err(`${cmd}: '${p}' kendi içine taşınamaz`);
        const [tpar, tname] = parentAndName(target);
        const tp = getNode(s.fs, tpar);
        if (!tp || tp.t !== 'd') return err(`${cmd}: '${params[params.length - 1]}' oluşturulamıyor: Böyle bir dosya ya da dizin yok`);
        if (!writable(target) || (cmd === 'mv' && !writable(src))) return err(`${cmd}: Erişim engellendi`);
        tp.c[tname] = clone(n);
        if (cmd === 'mv') {
          const [spar, sname] = parentAndName(src);
          const sp = getNode(s.fs, spar) as { t: 'd'; c: Record<string, FsNode> };
          delete sp.c[sname];
        }
      }
      return R('');
    }
    case 'rm':
    case 'rmdir': {
      if (!params.length) return err(`${cmd}: eksik terim`);
      for (const p of params) {
        const abs = resolve(s, p);
        const n = getNode(s.fs, abs);
        if (!n) return err(`${cmd}: '${p}' silinemedi: Böyle bir dosya ya da dizin yok`);
        if (!writable(abs)) return err(`${cmd}: '${p}' silinemedi: Erişim engellendi`);
        if (abs === homeOf(s) || abs === '/') return err(`${cmd}: '${p}' silinmesi engellendi (simülasyon güvenliği)`);
        if (cmd === 'rm' && n.t === 'd' && !has('r')) return err(`rm: '${p}' silinemiyor: Bir dizin`);
        if (cmd === 'rmdir' && (n.t !== 'd' || Object.keys(n.c).length)) return err(`rmdir: '${p}' silinemedi: Dizin boş değil`);
        const [par, name] = parentAndName(abs);
        delete (getNode(s.fs, par) as { t: 'd'; c: Record<string, FsNode> }).c[name];
        if (s.cwd === abs || s.cwd.startsWith(abs + '/')) s.cwd = homeOf(s);
      }
      return R('');
    }
    case 'uname':
      return R(has('a') ? `Linux ${s.host} 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 x86_64 x86_64 GNU/Linux` : 'Linux');
    case 'lsblk':
      if (s.bolumler)
        return R(
          [
            'NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS',
            `sda           8:0    0 ${s.sistem.disk.padStart(6)}  0 disk`,
            ...s.bolumler.map((b, i) => `${i === s.bolumler!.length - 1 ? '└─' : '├─'}sda${i + 1}`.padEnd(14) + `8:${i + 1}`.padEnd(7) + `0 ${b.boyut.padStart(6)}  0 part ${b.baglama}`),
          ].join('\n'),
        );
      return R(
        [
          'NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS',
          `sda           8:0    0 ${s.sistem.disk.padStart(6)}  0 disk`,
          '├─sda1        8:1    0     1G  0 part /boot/efi',
          `└─sda2        8:2    0 ${'237.5G'.padStart(6)}  0 part /`,
          'sdb           8:16   1  28.9G  0 disk',
          '└─sdb1        8:17   1  28.9G  0 part /media/ubuntu',
        ].join('\n'),
      );
    case 'lspci':
      return R(
        [
          '00:00.0 Host bridge: Intel Corporation Comet Lake-S 6c Host Bridge/DRAM Controller',
          `00:02.0 VGA compatible controller: ${s.sistem.ekran}`,
          '00:14.0 USB controller: Intel Corporation Comet Lake PCH-V USB Controller',
          '00:17.0 SATA controller: Intel Corporation 400 Series Chipset Family SATA AHCI Controller',
          '00:1f.3 Audio device: Intel Corporation Comet Lake PCH-V cAVS',
          `03:00.0 Ethernet controller: ${s.sistem.ag}`,
        ].join('\n'),
      );
    case 'lsusb':
      return R(['Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub', 'Bus 001 Device 003: ID 0781:5567 SanDisk Corp. Cruzer Blade', 'Bus 001 Device 004: ID 046d:c077 Logitech, Inc. Mouse'].join('\n'));
    case 'free':
      return R(['               toplam      kullanılan  boş         paylaşılan  önbellek    kullanılabilir', `Bellek:        ${s.sistem.ram.padEnd(12)}1.9Gi       4.1Gi       312Mi       1.9Gi       5.7Gi`, 'Takas:         4.0Gi       0B          4.0Gi'].join('\n'));
    case 'df':
      return R(['Dosyasistemi    Boyut  Kull   Boş Kull% Bağlanılan yer', 'tmpfs            779M   2,1M  777M    1% /run', '/dev/sda2        233G    11G  211G    5% /', '/dev/sda1        1,1G   6,2M  1,1G    1% /boot/efi'].join('\n'));
    case 'ip':
      if (params[0] !== 'a' && params[0] !== 'addr' && params[0] !== 'address') return err('Kullanım: ip a');
      return R(['1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536', '    inet 127.0.0.1/8 scope host lo', '2: enp3s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500', '    link/ether 3c:7c:3f:1a:22:5b brd ff:ff:ff:ff:ff:ff', `    inet ${s.sistem.ip}/24 brd 192.168.1.255 scope global dynamic enp3s0`].join('\n'));
    case 'ping': {
      const host = params.find((p) => !/^\d+$/.test(p));
      if (!host) return err('ping: usage error: Hedef adres gerekli');
      return R([`PING ${host} 56(84) bytes of data.`, ...[1, 2, 3, 4].map((i) => `64 bytes from ${host}: icmp_seq=${i} ttl=117 time=${(12 + i * 0.7).toFixed(1)} ms`), '', `--- ${host} ping statistics ---`, '4 packets transmitted, 4 received, 0% packet loss'].join('\n'));
    }
    case 'apt':
    case 'apt-get': {
      const sub = params[0];
      if (!sub) return err('apt 2.7.14 (amd64)\nKullanım: apt [seçenekler] komut');
      if (!root && ['update', 'upgrade', 'install', 'remove', 'full-upgrade'].includes(sub))
        return err('E: Kilit dosyası /var/lib/dpkg/lock-frontend açılamadı - open (13: Erişim engellendi)\nE: Önyüz kilidi alınamıyor, root mu? (Komutu "sudo" ile çalıştırmayı deneyin.)');
      if (sub === 'update') {
        s.apt.guncel = true;
        s.apt.bekleyen = s.apt.yukseltildi ? 0 : 37;
        return R(
          [
            'Get:1 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]',
            'Get:2 http://archive.ubuntu.com/ubuntu noble InRelease [256 kB]',
            'Get:3 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]',
            '2.418 kB 3sn içinde getirildi (806 kB/s)',
            'Paket listeleri okunuyor... Bitti',
            s.apt.bekleyen ? `${s.apt.bekleyen} paket yükseltilebilir. Görmek için 'apt list --upgradable' komutunu çalıştırın.` : 'Tüm paketler güncel.',
          ].join('\n'),
        );
      }
      if (sub === 'upgrade' || sub === 'full-upgrade') {
        if (!s.apt.guncel) return R('Paket listeleri okunuyor... Bitti\n0 paket yükseltildi.\nİpucu: önce "sudo apt update" ile paket listesini yenileyin.');
        if (!s.apt.bekleyen) return R('Paket listeleri okunuyor... Bitti\n0 paket yükseltildi, 0 yeni paket kurulacak.');
        if (!has('y')) return { ...R(`Paket listeleri okunuyor... Bitti\n${s.apt.bekleyen} paket yükseltilecek.\n248 MB arşiv dosyası indirilecek.\nDevam etmek istiyor musunuz? [E/h] h\nİptal edildi. (Onay için komutun sonuna -y ekleyin.)`), code: 1 };
        const n = s.apt.bekleyen;
        s.apt.bekleyen = 0;
        s.apt.yukseltildi = true;
        return R(`Paket listeleri okunuyor... Bitti\n${n} paket yükseltildi, 0 yeni paket kurulacak, 0 paket kaldırılacak.\n248 MB arşiv dosyası indirilecek.\n...\nlinux-image-6.8.0-48-generic ayarlanıyor ...\nİşlemler tamamlandı.`);
      }
      if (sub === 'install') {
        const pk = params[1];
        if (!pk) return err('E: Kurulacak paket belirtilmedi');
        if (pk.startsWith('./') || pk.endsWith('.deb')) {
          const n = getNode(s.fs, resolve(s, pk));
          if (!n) return err(`E: ${pk} dosyası bulunamadı`);
          const name = pk.includes('chrome') ? 'google-chrome-stable' : pk.replace(/^.*\//, '').replace(/_.*$/, '');
          if (!s.apt.kurulu.includes(name)) s.apt.kurulu.push(name);
          return R(`Paket listeleri okunuyor... Bitti\nŞu YENİ paketler kurulacak:\n  ${name}\n${name} ayarlanıyor ...\nİşlemler tamamlandı.`);
        }
        if (!s.apt.guncel) return err(`Paket listeleri okunuyor... Bitti\nE: ${pk} paketi bulunamadı (önce "sudo apt update" çalıştırın)`);
        if (!PKGS[pk]) return err(`Paket listeleri okunuyor... Bitti\nE: ${pk} paketi bulunamadı`);
        if (!s.apt.kurulu.includes(pk)) s.apt.kurulu.push(pk);
        return R(`Şu YENİ paketler kurulacak:\n  ${pk}\n${pk} ayarlanıyor ...`);
      }
      return err(`E: Geçersiz işlem ${sub}`);
    }
    case 'adduser':
    case 'useradd': {
      const name = params[0];
      if (!root) return err(`${cmd}: Kullanıcı ya da grup eklemek için root yetkisi gerekir.`);
      if (!name) return err(`${cmd}: Yalnızca bir ya da iki ad belirtilmelidir.`);
      if (!/^[a-z][a-z0-9_-]{0,31}$/.test(name)) return err(`${cmd}: Lütfen geçerli bir kullanıcı adı girin (küçük harf, rakam, - ve _).`);
      if (s.users.some((u) => u.name === name)) return err(`${cmd}: '${name}' kullanıcısı zaten var.`);
      s.users.push({ name, groups: [name, 'users'] });
      (getNode(s.fs, '/home') as { t: 'd'; c: Record<string, FsNode> }).c[name] = dir();
      return R(
        [
          `info: '${name}' kullanıcısı ekleniyor ...`,
          `info: Yeni '${name}' grubu (1001) ekleniyor ...`,
          `info: '/home/${name}' ev dizini oluşturuluyor ...`,
          'Yeni parola: ********',
          'Yeni parolayı tekrar girin: ********',
          'passwd: parola başarıyla güncellendi',
          `${name} için kullanıcı bilgileri değiştiriliyor (varsayılanlar kabul edildi)`,
          `info: '${name}' kullanıcısı 'users' grubuna ekleniyor ...`,
        ].join('\n'),
      );
    }
    case 'deluser': {
      const name = params[0];
      if (!root) return err('deluser: Yalnızca root kullanıcı silebilir.');
      if (!name || !s.users.some((u) => u.name === name)) return err(`deluser: '${name ?? ''}' kullanıcısı yok.`);
      if (name === s.user || name === 'root') return err('deluser: Bu kullanıcı silinemez (simülasyon güvenliği).');
      s.users = s.users.filter((u) => u.name !== name);
      return R(`info: '${name}' kullanıcısı siliniyor ...\ninfo: Bitti.`);
    }
    case 'passwd': {
      const name = params[0] ?? s.user;
      if (name !== s.user && !root) return err('passwd: Başka bir kullanıcının parolasını yalnızca root değiştirebilir.');
      if (!s.users.some((u) => u.name === name)) return err(`passwd: '${name}' kullanıcısı yok`);
      return R('Yeni parola: ********\nYeni parolayı tekrar girin: ********\npasswd: parola başarıyla güncellendi');
    }
    case 'usermod': {
      if (!root) return err('usermod: Erişim engellendi.');
      const gi = rest.findIndex((a) => a === '-aG' || a === '-G' || a === '-a');
      const grp = rest.find((a, i) => i > gi && !a.startsWith('-'));
      const name = params[params.length - 1];
      if (gi < 0 || !grp || !name || grp === name) return err('Kullanım: usermod -aG <grup> <kullanıcı>');
      const u = s.users.find((x) => x.name === name);
      if (!u) return err(`usermod: '${name}' kullanıcısı yok`);
      if (!u.groups.includes(grp)) u.groups.push(grp);
      return R('');
    }
    case 'groups':
    case 'id': {
      const name = params[0] ?? (root ? 'root' : s.user);
      const u = s.users.find((x) => x.name === name);
      if (!u) return err(`${cmd}: '${name}': böyle bir kullanıcı yok`);
      if (cmd === 'groups') return R(`${params[0] ? name + ' : ' : ''}${u.groups.join(' ')}`);
      return R(`uid=${1000 + s.users.indexOf(u) - 1}(${name}) gid=${1000 + s.users.indexOf(u) - 1}(${name}) gruplar=${u.groups.map((g, i) => `${1000 + i}(${g})`).join(',')}`);
    }
    case 'os-prober':
      if (!root) return err('os-prober: root yetkisi gerekli (sudo os-prober)');
      return R('/dev/sda1@/efi/Microsoft/Boot/bootmgfw.efi:Windows Boot Manager:Windows:efi');
    case 'update-grub': {
      if (!root) return err('/usr/sbin/grub-mkconfig: Önce root olmalısınız. (sudo update-grub)');
      const lines = ['Sourcing file `/etc/default/grub\'', 'Generating grub configuration file ...', 'Found linux image: /boot/vmlinuz-6.8.0-45-generic', 'Found initrd image: /boot/initrd.img-6.8.0-45-generic'];
      if (s.grub.osProber) {
        s.grub.windows = true;
        lines.push('Found Windows Boot Manager on /dev/sda1@/efi/Microsoft/Boot/bootmgfw.efi', 'Adding boot menu entry for UEFI Firmware Settings ...');
      } else lines.push('Warning: os-prober will not be executed to detect other bootable partitions.', 'Systems on them will not be added to the GRUB boot configuration.', "Check GRUB_DISABLE_OS_PROBER documentation entry.");
      lines.push('done');
      return R(lines.join('\n'));
    }
    case 'nano': {
      const f = params[0];
      if (f !== '/etc/default/grub') return err('nano: bu simülasyonda yalnızca /etc/default/grub düzenlenebilir.');
      if (!root) return err('[ /etc/default/grub dosyası yazmak için açılamadı: Erişim engellendi ] (sudo nano kullanın)');
      // Eğitsel kısayol: düzenleyici yerine os-prober satırını açar
      s.grub.osProber = true;
      const n = getNode(s.fs, '/etc/default/grub');
      if (n && n.t === 'f') n.v = n.v.replace('#GRUB_DISABLE_OS_PROBER=false', 'GRUB_DISABLE_OS_PROBER=false').replace('GRUB_DISABLE_OS_PROBER=true', 'GRUB_DISABLE_OS_PROBER=false');
      return R('[ /etc/default/grub kaydedildi ] GRUB_DISABLE_OS_PROBER=false satırı etkinleştirildi.\n(Değişikliğin geçerli olması için: sudo update-grub)');
    }
    default:
      return R(`${cmd}: komut bulunamadı${COMMANDS.length ? '\n(Kullanılabilen komutlar için: help)' : ''}`, 127);
  }
}

/** Tab tamamlama: komut ya da yol */
export function complete(s: ShellState, line: string): string {
  const parts = line.split(' ');
  const last = parts[parts.length - 1];
  if (parts.length === 1 || (parts.length === 2 && parts[0] === 'sudo')) {
    const m = COMMANDS.filter((c) => c.startsWith(last));
    if (m.length === 1) parts[parts.length - 1] = m[0] + ' ';
    return parts.join(' ');
  }
  const slash = last.lastIndexOf('/');
  const base = slash >= 0 ? last.slice(0, slash + 1) : '';
  const frag = slash >= 0 ? last.slice(slash + 1) : last;
  const n = getNode(s.fs, resolve(s, base || '.'));
  if (!n || n.t !== 'd') return line;
  const m = Object.keys(n.c).filter((k) => k.startsWith(frag));
  if (m.length !== 1) return line;
  const k = m[0];
  parts[parts.length - 1] = base + (k.includes(' ') ? `"${k}"` : k) + (n.c[k].t === 'd' ? '/' : ' ');
  return parts.join(' ');
}

// ---------- Grafik uygulamalar (Ubuntu Dosyalar, Firefox) için dosya sistemi işlemleri ----------

/** Mutlak yoldaki düğüm (yoksa null) */
export function dugum(s: ShellState, abs: string): FsNode | null {
  return getNode(s.fs, abs);
}
/** Ev klasörü */
export function evKlasoru(s: ShellState): string {
  return homeOf(s);
}
/** Dosya sistemini kopya üzerinde değiştirir; dizin yeniden oluşturulur */
export function fsDegistir(prev: ShellState, fn: (k: { yaz: (abs: string, n: FsNode) => boolean; sil: (abs: string) => FsNode | null; oku: (abs: string) => FsNode | null }) => void): ShellState {
  const s = clone(prev);
  const yaz = (abs: string, n: FsNode) => {
    const [ust, ad] = parentAndName(abs);
    const p = getNode(s.fs, ust);
    if (!p || p.t !== 'd' || !ad) return false;
    p.c[ad] = clone(n);
    return true;
  };
  const sil = (abs: string) => {
    const [ust, ad] = parentAndName(abs);
    const p = getNode(s.fs, ust);
    if (!p || p.t !== 'd' || !(ad in p.c)) return null;
    const n = p.c[ad];
    delete p.c[ad];
    return n;
  };
  fn({ yaz, sil, oku: (abs) => getNode(s.fs, abs) });
  return withIndex(s);
}
