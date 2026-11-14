// Kum havuzundaki Ubuntu'nun grafik uygulamaları: Dosyalar (Nautilus), Firefox, Metin Düzenleyici ve Ayarlar.
// Hepsi Terminal ile aynı dosya sistemini (core/shell.ts) kullanır: Dosyalar'da açılan klasör terminalde `ls` ile görünür.
import { useEffect, useRef, useState, type DragEvent, type FormEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import Logo from './Logo';
import { photoUrl } from './Photo';
import { dugum, evKlasoru, fsDegistir, type FsNode, type ShellState } from '../core/shell';
import type { Sim } from '../core/sim';
import type { Json } from '../core/rules';
import { aramaDuzelt, KISA, oneriler, SITELER, sonuclar } from '../win/Tarayici';
import { WIFI } from '../core/kumhavuzu';
import { AGLAR, ayarHatalari, DHCP, maskeOnek, onekMaske, type AgTur, type IpAyar, type IpSonuc } from '../core/ag';

export type UbApp = 'dosyalar' | 'firefox' | 'terminal' | 'gedit' | 'ayarlar' | 'usbyazici';
export type UbAg = { ethernet: IpSonuc | null; wifi: IpSonuc | null; internet: boolean };
/** Takılı USB bellek (Başlangıç Diski Oluşturucu için) */
export interface UbUsb {
  id: string;
  ad: string;
  kapasite: string;
  etiket: string;
  icerik: string;
  dosyaSayisi: number;
}
export interface UbCtx {
  sim: Sim<{ sh: ShellState }>;
  wifi: string;
  wifiBaglan?: (ag: string) => void;
  usb?: UbUsb[];
  usbYaz?: (id: string, iso: string) => void;
  parola?: string;
  kablo?: boolean;
  ag?: UbAg;
  ipAyar?: Partial<Record<AgTur, IpAyar>>;
  ipKaydet?: (tur: AgTur, ayar: IpAyar) => void;
  ac: (app: UbApp, arg?: string) => void;
  kapat: () => void;
  log: (t: string, d?: Record<string, Json>) => void;
  bildir: (m: string) => void;
  arg?: string;
}

// ---------- yardımcılar ----------
const ad = (p: string) => p.slice(p.lastIndexOf('/') + 1);
const ust = (p: string) => p.slice(0, p.lastIndexOf('/')) || '/';
const birlestir = (a: string, b: string) => (a === '/' ? '' : a) + '/' + b;
const uzanti = (p: string) => (ad(p).includes('.') ? ad(p).slice(ad(p).lastIndexOf('.') + 1).toLowerCase() : '');
const IKILI = '\u0000ikili:';
/** Bu klasörlere yazılabilir (diğerleri root gerektirir) */
const yazilabilir = (sh: ShellState, p: string) => p === evKlasoru(sh) || p.startsWith(evKlasoru(sh) + '/') || p === '/tmp' || p.startsWith('/tmp/');
const copYolu = (sh: ShellState) => `${evKlasoru(sh)}/.local/share/Trash/files`;
function boyut(n: FsNode): string {
  if (n.t === 'd') return `${Object.keys(n.c).length} öğe`;
  if (n.v.startsWith(IKILI)) return n.v.slice(IKILI.length);
  const b = new TextEncoder().encode(n.v).length;
  return b < 1024 ? `${b} bayt` : `${(b / 1024).toFixed(1).replace('.', ',')} kB`;
}
function turAdi(p: string, n: FsNode): string {
  if (n.t === 'd') return 'Klasör';
  const u = uzanti(p);
  return (
    { txt: 'Düz metin belgesi', md: 'Markdown belgesi', sh: 'Kabuk betiği', deb: 'Debian paketi', iso: 'Disk görüntüsü', exe: 'Windows çalıştırılabilir dosyası', gz: 'Arşiv (tar.gz)', zip: 'ZIP arşivi', png: 'PNG görüntüsü', jpg: 'JPEG görüntüsü', pdf: 'PDF belgesi', tmp: 'Geçici dosya' }[u] ??
    (n.v.startsWith(IKILI) ? 'İkili dosya' : 'Düz metin belgesi')
  );
}
const OZEL_KLASOR: Record<string, string> = { Masaüstü: '🖥', Belgeler: '📄', İndirilenler: '⬇', Müzik: '🎵', Resimler: '🖼', Videolar: '🎬' };
function dosyaIkon(p: string, n: FsNode, ev: string): string {
  if (n.t !== 'd') return '';
  if (p === ev) return '🏠';
  return ust(p) === ev ? (OZEL_KLASOR[ad(p)] ?? '') : '';
}
/** Mevcut olmayan ara klasörleri oluşturur (mkdir -p) */
function klasorleriOlustur(k: { yaz: (a: string, n: FsNode) => boolean; oku: (a: string) => FsNode | null }, abs: string) {
  const parcalar = abs.split('/').filter(Boolean);
  let yol = '';
  for (const p of parcalar) {
    yol += '/' + p;
    if (!k.oku(yol)) k.yaz(yol, { t: 'd', c: {} });
  }
}

function UbIkon({ p, n, ev, boyutEm = 2.6 }: { p: string; n: FsNode; ev: string; boyutEm?: number }) {
  const ozel = dosyaIkon(p, n, ev);
  if (n.t === 'd')
    return (
      <span className="ubf-klasor" style={{ fontSize: `${boyutEm}em` }}>
        <svg viewBox="0 0 48 40" aria-hidden>
          <path d="M2 6a4 4 0 0 1 4-4h12l4 4h20a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="#e95420" />
          <path d="M2 12h44v22a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="#f47b4a" />
        </svg>
        {ozel && <i>{ozel}</i>}
      </span>
    );
  const u = uzanti(p);
  const renk = u === 'deb' ? '#a83b0f' : u === 'iso' ? '#4a4a4a' : u === 'exe' ? '#2563eb' : ['gz', 'zip', 'rar'].includes(u) ? '#8a6d3b' : '#fafafa';
  return (
    <span className="ubf-dosya" style={{ fontSize: `${boyutEm}em` }}>
      <svg viewBox="0 0 40 48" aria-hidden>
        <path d="M4 2h22l10 10v32a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill={renk} stroke="#c0bfbc" />
        <path d="M26 2v10h10" fill="#deddda" />
        {renk === '#fafafa' && <path d="M9 20h20M9 26h20M9 32h14" stroke="#9a9996" strokeWidth="2" />}
      </svg>
      {u && renk !== '#fafafa' && <b>{u}</b>}
    </span>
  );
}

// ---------- Dosyalar ----------
let PANO: { yollar: string[]; kes: boolean } | null = null;
type Menu = { x: number; y: number; ogeler: ({ ad: string; f: () => void; kapali?: boolean } | null)[] };

export function Dosyalar(ctx: UbCtx) {
  const sh = ctx.sim.state.sh;
  const ev = evKlasoru(sh);
  const baslangic = ctx.arg && dugum(sh, ctx.arg)?.t === 'd' ? ctx.arg : ev;
  const [gecmis, setGecmis] = useState({ liste: [baslangic], i: 0 });
  const yol = gecmis.liste[gecmis.i];
  const [sec, setSec] = useState<string[]>([]);
  const [gizli, setGizli] = useState(false);
  const [liste, setListe] = useState(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [dlg, setDlg] = useState<{ tur: 'klasor' | 'belge' | 'adlandir' | 'ozellik'; deger: string; hedef?: string; hata?: string } | null>(null);
  const kok = useRef<HTMLDivElement>(null);
  const copte = yol === copYolu(sh);

  const node = dugum(sh, yol);
  const ogeler = node?.t === 'd' ? Object.entries(node.c).filter(([a]) => gizli || !a.startsWith('.')).sort(([a, x], [b, y]) => (x.t === y.t ? a.localeCompare(b, 'tr') : x.t === 'd' ? -1 : 1)) : [];

  useEffect(() => {
    // Klasör silinirse bir üst klasöre dön
    if (!node) setGecmis((g) => ({ liste: [...g.liste.slice(0, g.i + 1), ev], i: g.i + 1 }));
  }, [node, ev]);

  const git = (p: string) => {
    setGecmis((g) => ({ liste: [...g.liste.slice(0, g.i + 1), p], i: g.i + 1 }));
    setSec([]);
    ctx.log('ubuntu.dosyalar.git', { yol: p });
  };
  const degistir = (tip: string, veri: Record<string, Json>, fn: Parameters<typeof fsDegistir>[1]) => ctx.sim.act(tip, veri, (s) => ({ sh: fsDegistir(s.sh, fn) }));
  const izinYok = (hedef: string) => {
    if (yazilabilir(sh, hedef)) return false;
    ctx.bildir(`"${hedef}" konumuna yazma izniniz yok. Sistem klasörleri yalnızca yönetici (sudo) tarafından değiştirilebilir.`);
    return true;
  };

  const ac = (p: string) => {
    const n = dugum(sh, p);
    if (!n) return;
    if (n.t === 'd') return git(p);
    const u = uzanti(p);
    ctx.log('ubuntu.dosyalar.ac', { dosya: p });
    if (u === 'deb') return ctx.bildir(`Debian paketi. Kurmak için Terminal'de: sudo apt install ./${ad(p)}  (önce cd ${p.startsWith(ev) ? '~' + ust(p).slice(ev.length) : ust(p)})`);
    if (u === 'exe' || u === 'msi') return ctx.bildir(`"${ad(p)}" bir Windows programıdır. Ubuntu'da doğrudan çalışmaz.`);
    if (u === 'iso') return ctx.ac('usbyazici', p);
    if (n.v.startsWith(IKILI)) return ctx.bildir(`"${ad(p)}" dosyasını açacak uygulama yüklü değil.`);
    ctx.ac('gedit', p);
  };
  const yeniOlustur = (tur: 'klasor' | 'belge', deger: string) => {
    const a = deger.trim();
    if (!a) return setDlg({ tur, deger, hata: 'Ad boş olamaz.' });
    if (a.includes('/')) return setDlg({ tur, deger, hata: 'Ad "/" içeremez.' });
    const p = birlestir(yol, a);
    if (dugum(sh, p)) return setDlg({ tur, deger, hata: 'Bu adda bir dosya ya da klasör zaten var.' });
    if (izinYok(yol)) return setDlg(null);
    degistir(tur === 'klasor' ? 'ubuntu.dosyalar.yeni-klasor' : 'ubuntu.dosyalar.yeni-belge', { yol: p }, (k) => void k.yaz(p, tur === 'klasor' ? { t: 'd', c: {} } : { t: 'f', v: '' }));
    setDlg(null);
    setSec([a]);
  };
  const adlandir = (eski: string, deger: string) => {
    const a = deger.trim();
    if (!a || a.includes('/')) return setDlg({ tur: 'adlandir', deger, hedef: eski, hata: 'Geçersiz ad.' });
    const p = birlestir(yol, a);
    if (a === ad(eski)) return setDlg(null);
    if (dugum(sh, p)) return setDlg({ tur: 'adlandir', deger, hedef: eski, hata: 'Bu adda bir dosya ya da klasör zaten var.' });
    if (izinYok(yol)) return setDlg(null);
    degistir('ubuntu.dosyalar.adlandir', { eski, yeni: p }, (k) => {
      const n = k.sil(eski);
      if (n) k.yaz(p, n);
    });
    setDlg(null);
    setSec([a]);
  };
  const secili = () => sec.map((a) => birlestir(yol, a)).filter((p) => dugum(sh, p));
  const copeTasi = (yollar = secili()) => {
    if (!yollar.length || izinYok(yol)) return;
    if (copte) return kaliciSil(yollar);
    const cop = copYolu(sh);
    degistir('ubuntu.dosyalar.cope', { yollar }, (k) => {
      klasorleriOlustur(k, cop);
      for (const p of yollar) {
        const n = k.sil(p);
        if (!n) continue;
        let h = birlestir(cop, ad(p));
        for (let i = 2; k.oku(h); i++) h = birlestir(cop, `${ad(p)}.${i}`);
        k.yaz(h, n);
      }
    });
    ctx.bildir(yollar.length === 1 ? `"${ad(yollar[0])}" çöpe taşındı.` : `${yollar.length} öğe çöpe taşındı.`);
    setSec([]);
  };
  const kaliciSil = (yollar = secili()) => {
    if (!yollar.length || izinYok(yol)) return;
    if (!window.confirm(`${yollar.length === 1 ? `"${ad(yollar[0])}"` : `${yollar.length} öğe`} kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) return;
    degistir('ubuntu.dosyalar.sil', { yollar }, (k) => yollar.forEach((p) => k.sil(p)));
    setSec([]);
  };
  const copuBosalt = () => {
    const cop = copYolu(sh);
    const n = dugum(sh, cop);
    if (n?.t !== 'd' || !Object.keys(n.c).length) return;
    if (!window.confirm('Çöpteki tüm öğeler kalıcı olarak silinsin mi?')) return;
    degistir('ubuntu.dosyalar.cop-bosalt', {}, (k) => void k.yaz(cop, { t: 'd', c: {} }));
  };
  const panoya = (kes: boolean) => {
    const y = secili();
    if (!y.length) return;
    PANO = { yollar: y, kes };
    ctx.bildir(`${y.length} öğe ${kes ? 'kesildi' : 'kopyalandı'}.`);
  };
  const tasiKopyala = (yollar: string[], hedef: string, kes: boolean) => {
    if (izinYok(hedef) || (kes && izinYok(ust(yollar[0])))) return;
    const gecerli = yollar.filter((p) => p !== hedef && !hedef.startsWith(p + '/'));
    if (!gecerli.length) return ctx.bildir('Bir klasör kendi içine taşınamaz ya da kopyalanamaz.');
    degistir(kes ? 'ubuntu.dosyalar.tasi' : 'ubuntu.dosyalar.kopyala', { yollar: gecerli, hedef }, (k) => {
      for (const p of gecerli) {
        const n = kes ? k.sil(p) : k.oku(p);
        if (!n) continue;
        let h = birlestir(hedef, ad(p));
        if (k.oku(h)) {
          if (kes && ust(p) === hedef) {
            k.yaz(p, n);
            continue;
          }
          const nokta = ad(p).lastIndexOf('.');
          const [taban, uz] = n.t === 'f' && nokta > 0 ? [ad(p).slice(0, nokta), ad(p).slice(nokta)] : [ad(p), ''];
          h = birlestir(hedef, `${taban} (kopya)${uz}`);
          for (let i = 2; k.oku(h); i++) h = birlestir(hedef, `${taban} (kopya ${i})${uz}`);
        }
        k.yaz(h, n);
      }
    });
  };
  const yapistir = (hedef = yol) => {
    if (!PANO) return;
    tasiKopyala(PANO.yollar, hedef, PANO.kes);
    if (PANO.kes) PANO = null;
  };

  const ogeTik = (e: MouseEvent, a: string) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) setSec((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]));
    else if (e.shiftKey && sec.length) {
      const adlar = ogeler.map(([x]) => x);
      const [i, j] = [adlar.indexOf(sec[sec.length - 1]), adlar.indexOf(a)].sort((x, y) => x - y);
      setSec(adlar.slice(i, j + 1));
    } else setSec([a]);
  };
  const menuAc = (e: MouseEvent, ogeler2: Menu['ogeler']) => {
    e.preventDefault();
    e.stopPropagation();
    const r = kok.current!.getBoundingClientRect();
    setMenu({ x: e.clientX - r.left, y: e.clientY - r.top, ogeler: ogeler2 });
  };
  const ogeMenu = (e: MouseEvent, a: string) => {
    const secim = sec.includes(a) ? sec : [a];
    if (!sec.includes(a)) setSec([a]);
    const p = birlestir(yol, a);
    const n = dugum(sh, p)!;
    const yollar = secim.map((x) => birlestir(yol, x));
    menuAc(e, [
      { ad: 'Aç', f: () => ac(p) },
      ...(n.t === 'f' && !n.v.startsWith(IKILI) ? [{ ad: 'Metin Düzenleyici ile Aç', f: () => ctx.ac('gedit', p) }] : []),
      ...(n.t === 'd' ? [{ ad: 'Terminalde Aç', f: () => terminaldeAc(p) }] : []),
      null,
      { ad: 'Kes', f: () => ((PANO = { yollar, kes: true }), ctx.bildir(`${yollar.length} öğe kesildi.`)) },
      { ad: 'Kopyala', f: () => ((PANO = { yollar, kes: false }), ctx.bildir(`${yollar.length} öğe kopyalandı.`)) },
      ...(n.t === 'd' && PANO ? [{ ad: 'Klasörün İçine Yapıştır', f: () => yapistir(p) }] : []),
      null,
      { ad: 'Yeniden Adlandır…', kapali: secim.length > 1, f: () => setDlg({ tur: 'adlandir', deger: a, hedef: p }) },
      { ad: copte ? 'Kalıcı Olarak Sil' : 'Çöpe Taşı', f: () => (copte ? kaliciSil(yollar) : copeTasi(yollar)) },
      null,
      { ad: 'Özellikler', kapali: secim.length > 1, f: () => setDlg({ tur: 'ozellik', deger: '', hedef: p }) },
    ]);
  };
  const bosMenu = (e: MouseEvent) => {
    setSec([]);
    menuAc(e, [
      { ad: 'Yeni Klasör…', f: () => setDlg({ tur: 'klasor', deger: 'Adsız Klasör' }), kapali: copte },
      { ad: 'Yeni Belge', f: () => setDlg({ tur: 'belge', deger: 'Adsız Belge.txt' }), kapali: copte },
      { ad: 'Yapıştır', f: () => yapistir(), kapali: !PANO || copte },
      null,
      { ad: 'Tümünü Seç', f: () => setSec(ogeler.map(([a]) => a)) },
      { ad: gizli ? '✓ Gizli Dosyaları Göster' : 'Gizli Dosyaları Göster', f: () => setGizli((g) => !g) },
      null,
      ...(copte ? [{ ad: 'Çöpü Boşalt', f: copuBosalt }] : [{ ad: 'Terminalde Aç', f: () => terminaldeAc(yol) }]),
    ]);
  };
  const terminaldeAc = (p: string) => {
    ctx.sim.act('ubuntu.terminalde-ac', { yol: p }, (s) => ({ sh: { ...s.sh, cwd: p } }));
    ctx.ac('terminal');
  };
  const tus = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && k === 'a') setSec(ogeler.map(([a]) => a));
    else if (ctrl && k === 'c') panoya(false);
    else if (ctrl && k === 'x') panoya(true);
    else if (ctrl && k === 'v') yapistir();
    else if (ctrl && k === 'h') setGizli((g) => !g);
    else if (ctrl && e.shiftKey && k === 'n') setDlg({ tur: 'klasor', deger: 'Adsız Klasör' });
    else if (e.key === 'Delete') e.shiftKey ? kaliciSil() : copeTasi();
    else if (e.key === 'F2' && sec.length === 1) setDlg({ tur: 'adlandir', deger: sec[0], hedef: birlestir(yol, sec[0]) });
    else if (e.key === 'Enter' && sec.length === 1) ac(birlestir(yol, sec[0]));
    else if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft')) gecmis.i > 0 && setGecmis((g) => ({ ...g, i: g.i - 1 }));
    else if (e.altKey && e.key === 'ArrowUp') yol !== '/' && git(ust(yol));
    else return;
    e.preventDefault();
  };
  // Sürükle-bırak: öğeyi klasöre ya da kenar çubuğundaki konuma taşı (Ctrl ile kopyala)
  const surukleBasla = (e: DragEvent, a: string) => {
    const secim = sec.includes(a) ? sec : [a];
    if (!sec.includes(a)) setSec([a]);
    e.dataTransfer.setData('text/ub-yollar', JSON.stringify(secim.map((x) => birlestir(yol, x))));
    e.dataTransfer.effectAllowed = 'copyMove';
  };
  const birak = (e: DragEvent, hedef: string) => {
    const veri = e.dataTransfer.getData('text/ub-yollar');
    if (!veri) return;
    e.preventDefault();
    e.stopPropagation();
    const yollar: string[] = JSON.parse(veri);
    if (hedef === copYolu(sh)) return copeTasi(yollar);
    tasiKopyala(yollar, hedef, !e.ctrlKey);
  };
  const birakIzin = (e: DragEvent) => e.dataTransfer.types.includes('text/ub-yollar') && e.preventDefault();

  const yanlar: [string, string, string][] = [
    ['Ev', ev, '🏠'],
    ['Masaüstü', `${ev}/Masaüstü`, '🖥'],
    ['Belgeler', `${ev}/Belgeler`, '📄'],
    ['İndirilenler', `${ev}/İndirilenler`, '⬇'],
    ['Müzik', `${ev}/Müzik`, '🎵'],
    ['Resimler', `${ev}/Resimler`, '🖼'],
    ['Videolar', `${ev}/Videolar`, '🎬'],
    ['Çöp', copYolu(sh), '🗑'],
  ];
  const yolParca = yol.startsWith(ev) ? [['Ev', ev], ...yol.slice(ev.length).split('/').filter(Boolean).map((p, i, arr) => [p, ev + '/' + arr.slice(0, i + 1).join('/')])] : [['Bilgisayar', '/'], ...yol.split('/').filter(Boolean).map((p, i, arr) => [p, '/' + arr.slice(0, i + 1).join('/')])];
  const baslik = yol === ev ? 'Ev' : copte ? 'Çöp' : yol === '/' ? 'Bilgisayar' : ad(yol);

  return (
    <div className="ubf" ref={kok} tabIndex={0} onKeyDown={tus} onClick={() => setMenu(null)}>
      <div className="ubf-bar">
        <button onClick={() => gecmis.i > 0 && setGecmis((g) => ({ ...g, i: g.i - 1 }))} disabled={gecmis.i === 0} aria-label="Geri">
          ‹
        </button>
        <button onClick={() => gecmis.i < gecmis.liste.length - 1 && setGecmis((g) => ({ ...g, i: g.i + 1 }))} disabled={gecmis.i >= gecmis.liste.length - 1} aria-label="İleri">
          ›
        </button>
        <div className="ubf-yol" aria-label="Konum">
          {yolParca.map(([a, p], i) => (
            <button key={p} className={i === yolParca.length - 1 ? 'on' : ''} onClick={() => git(p)} onDragOver={birakIzin} onDrop={(e) => birak(e, p)}>
              {copte && i === yolParca.length - 1 ? 'Çöp' : a}
            </button>
          ))}
        </div>
        <button onClick={() => setListe((l) => !l)} aria-label={liste ? 'Izgara görünümü' : 'Liste görünümü'} title={liste ? 'Izgara görünümü' : 'Liste görünümü'}>
          {liste ? '⊞' : '☰'}
        </button>
        <button onClick={(e) => bosMenu(e)} aria-label="Klasör menüsü">
          ⋮
        </button>
      </div>
      <div className="ubf-govde">
        <nav className="ubf-yan">
          {yanlar.map(([a, p, ik]) =>
            dugum(sh, p) || a === 'Çöp' ? (
              <button key={p} className={yol === p ? 'on' : ''} onClick={() => (a === 'Çöp' && !dugum(sh, p) ? degistir('ubuntu.dosyalar.cop-olustur', {}, (k) => klasorleriOlustur(k, p)) : undefined, git(p))} onDragOver={birakIzin} onDrop={(e) => birak(e, p)}>
                <i>{ik}</i>
                {a}
              </button>
            ) : null,
          )}
          <hr />
          <button className={yol === '/' ? 'on' : ''} onClick={() => git('/')}>
            <i>💽</i>Bilgisayar
          </button>
        </nav>
        <div className={'ubf-ana' + (liste ? ' liste' : '')} onClick={() => setSec([])} onContextMenu={bosMenu} onDragOver={birakIzin} onDrop={(e) => birak(e, yol)}>
          {copte && (
            <div className="ubf-cop-bar">
              <span>Çöp</span>
              <button onClick={copuBosalt} disabled={!ogeler.length}>
                Boşalt
              </button>
            </div>
          )}
          {!ogeler.length && <div className="ubf-bos">{copte ? 'Çöp boş' : 'Klasör boş'}</div>}
          {liste && ogeler.length > 0 && (
            <div className="ubf-satir ubf-baslik">
              <span>Ad</span>
              <span>Boyut</span>
              <span>Tür</span>
            </div>
          )}
          {ogeler.map(([a, n]) => {
            const p = birlestir(yol, a);
            return (
              <button
                key={a}
                className={(liste ? 'ubf-satir' : 'ubf-oge') + (sec.includes(a) ? ' on' : '') + (a.startsWith('.') ? ' gizli' : '')}
                aria-label={a}
                draggable
                onDragStart={(e) => surukleBasla(e, a)}
                onDragOver={n.t === 'd' ? birakIzin : undefined}
                onDrop={n.t === 'd' ? (e) => birak(e, p) : undefined}
                onClick={(e) => ogeTik(e, a)}
                onDoubleClick={() => ac(p)}
                onContextMenu={(e) => ogeMenu(e, a)}
              >
                {liste ? (
                  <>
                    <span>
                      <UbIkon p={p} n={n} ev={ev} boyutEm={1.2} /> {a}
                    </span>
                    <span>{boyut(n)}</span>
                    <span>{turAdi(p, n)}</span>
                  </>
                ) : (
                  <>
                    <UbIkon p={p} n={n} ev={ev} />
                    <span className="ubf-ad">{a}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="ubf-durum">
        {sec.length ? `"${sec.length === 1 ? sec[0] : `${sec.length} öğe`}" seçildi` : `${ogeler.length} öğe`} · {baslik}
        {!yazilabilir(sh, yol) && <span className="ubf-kilit"> · 🔒 Salt okunur (yönetici gerekir)</span>}
      </div>
      {menu && (
        <div className="ubf-menu" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          {menu.ogeler.map((o, i) =>
            o ? (
              <button key={i} disabled={o.kapali} onClick={() => (setMenu(null), o.f())}>
                {o.ad}
              </button>
            ) : (
              <hr key={i} />
            ),
          )}
        </div>
      )}
      {dlg && (
        <div className="ubf-modal" onClick={(e) => e.stopPropagation()}>
          {dlg.tur === 'ozellik' && dlg.hedef ? (
            <div className="ubf-dlg">
              <b>{ad(dlg.hedef)}</b>
              {(() => {
                const n = dugum(sh, dlg.hedef);
                return n ? (
                  <table>
                    <tbody>
                      <tr><td>Tür</td><td>{turAdi(dlg.hedef, n)}</td></tr>
                      <tr><td>Boyut</td><td>{boyut(n)}</td></tr>
                      <tr><td>Konum</td><td>{ust(dlg.hedef)}</td></tr>
                      <tr><td>Sahip</td><td>{yazilabilir(sh, dlg.hedef) ? sh.user : 'root'}</td></tr>
                      <tr><td>İzinler</td><td>{n.t === 'd' ? 'drwxr-xr-x' : '-rw-rw-r--'}</td></tr>
                    </tbody>
                  </table>
                ) : null;
              })()}
              <div className="ubf-dlg-btn">
                <button className="ana" onClick={() => setDlg(null)}>
                  Kapat
                </button>
              </div>
            </div>
          ) : (
            <form
              className="ubf-dlg"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (dlg.tur === 'adlandir') adlandir(dlg.hedef!, dlg.deger);
                else yeniOlustur(dlg.tur as 'klasor' | 'belge', dlg.deger);
              }}
            >
              <b>{dlg.tur === 'klasor' ? 'Yeni Klasör' : dlg.tur === 'belge' ? 'Yeni Belge' : 'Yeniden Adlandır'}</b>
              <label className="small">{dlg.tur === 'klasor' ? 'Klasör adı' : 'Dosya adı'}</label>
              <input
                autoFocus
                value={dlg.deger}
                onChange={(e) => setDlg({ ...dlg, deger: e.target.value, hata: undefined })}
                onFocus={(e) => {
                  const v = e.target.value;
                  const nokta = v.lastIndexOf('.');
                  e.target.setSelectionRange(0, nokta > 0 && dlg.tur !== 'klasor' ? nokta : v.length);
                }}
                onKeyDown={(e) => e.key === 'Escape' && setDlg(null)}
                aria-label={dlg.tur === 'klasor' ? 'Klasör adı' : 'Dosya adı'}
              />
              {dlg.hata && <small className="ubf-hata">{dlg.hata}</small>}
              <div className="ubf-dlg-btn">
                <button type="button" onClick={() => setDlg(null)}>
                  İptal
                </button>
                <button className="ana" type="submit">
                  {dlg.tur === 'adlandir' ? 'Yeniden Adlandır' : 'Oluştur'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Metin Düzenleyici ----------
export function MetinDuzenleyici(ctx: UbCtx & { baslikAyarla?: (b: string) => void }) {
  const sh = ctx.sim.state.sh;
  const [yol, setYol] = useState<string | null>(ctx.arg && dugum(sh, ctx.arg)?.t === 'f' ? ctx.arg : null);
  const ilk = yol ? (dugum(sh, yol) as { v: string } | null)?.v ?? '' : '';
  const [metin, setMetin] = useState(ilk);
  const [kayitli, setKayitli] = useState(ilk);
  const [kaydetDlg, setKaydetDlg] = useState<string | null>(null);
  const [durum, setDurum] = useState('');

  const yaz = (p: string) => {
    if (!yazilabilir(sh, ust(p))) {
      setDurum(`Kaydedilemedi: "${ust(p)}" konumuna yazma izniniz yok.`);
      return;
    }
    ctx.sim.act('ubuntu.metin.kaydet', { dosya: p, uzunluk: metin.length }, (s) => ({ sh: fsDegistir(s.sh, (k) => void k.yaz(p, { t: 'f', v: metin })) }));
    setYol(p);
    setKayitli(metin);
    setDurum(`Kaydedildi: ${p}`);
  };
  const kaydet = () => (yol ? yaz(yol) : setKaydetDlg('Adsız Belge.txt'));
  const degisti = metin !== kayitli;
  return (
    <div className="ubg">
      <div className="ubg-bar">
        <b>
          {degisti && '• '}
          {yol ? ad(yol) : 'Adsız Belge'}
        </b>
        <span className="small">{yol ? ust(yol).replace(evKlasoru(sh), '~') : ''}</span>
        <button className="ubg-kaydet" onClick={kaydet} title="Kaydet (Ctrl+S)">
          Kaydet
        </button>
      </div>
      <textarea
        value={metin}
        spellCheck={false}
        autoFocus
        aria-label="Metin"
        onChange={(e) => (setMetin(e.target.value), setDurum(''))}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') (e.preventDefault(), kaydet());
        }}
      />
      <div className="ubg-durum">{durum || `Düz Metin · Satır ${metin.split('\n').length}`}</div>
      {kaydetDlg !== null && (
        <div className="ubf-modal">
          <form
            className="ubf-dlg"
            onSubmit={(e) => {
              e.preventDefault();
              const a = kaydetDlg.trim();
              if (!a || a.includes('/')) return;
              setKaydetDlg(null);
              yaz(`${evKlasoru(sh)}/Belgeler/${a}`);
            }}
          >
            <b>Kaydet</b>
            <label className="small">Ad (Belgeler klasörüne)</label>
            <input autoFocus value={kaydetDlg} onChange={(e) => setKaydetDlg(e.target.value)} aria-label="Dosya adı" onKeyDown={(e) => e.key === 'Escape' && setKaydetDlg(null)} />
            <div className="ubf-dlg-btn">
              <button type="button" onClick={() => setKaydetDlg(null)}>
                İptal
              </button>
              <button className="ana" type="submit">
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ---------- Firefox ----------
interface LinuxSayfa {
  baslik: string;
  logo?: string;
  metin: ReactNode;
  indir?: { dosya: string; boyut: string; etiket: string }[];
}
const LINUX_SAYFA: Record<string, LinuxSayfa> = {
  'www.google.com/chrome': {
    baslik: 'Google Chrome',
    logo: 'chrome',
    metin: 'Linux için 64 bit .deb paketi (Debian/Ubuntu). İndirdikten sonra Terminal\'de: sudo apt install ./google-chrome-stable_current_amd64.deb',
    indir: [{ dosya: 'google-chrome-stable_current_amd64.deb', boyut: '112 MB', etiket: "Chrome'u indir (.deb)" }],
  },
  'ubuntu.com/download/desktop': {
    baslik: 'Ubuntu Desktop indir',
    logo: 'ubuntu',
    metin: 'Ubuntu 24.04.1 LTS — 5 yıl ücretsiz güvenlik güncellemesi. 64 bit ISO kalıbı.',
    indir: [{ dosya: 'ubuntu-24.04.1-desktop-amd64.iso', boyut: '5,8 GB', etiket: 'İndir 24.04.1 LTS' }],
  },
  'www.microsoft.com/tr-tr/microsoft-365/office-2024': {
    baslik: 'Microsoft Office 2024',
    logo: 'office',
    metin: (
      <>
        Office masaüstü uygulamalarının <b>Linux sürümü yoktur</b>; Windows yükleyicisi (OfficeSetup.exe) Ubuntu'da çalışmaz. Ubuntu'da <b>LibreOffice</b> (Writer, Calc, Impress) ücretsiz kullanılabilir: <code>sudo apt install libreoffice</code>. Office'i tarayıcıdan da kullanabilirsiniz (office.com).
      </>
    ),
  },
  'www.win-rar.com/turkce': {
    baslik: 'WinRAR / RAR for Linux',
    logo: 'winrar',
    metin: 'WinRAR yalnızca Windows içindir. Linux için komut satırı sürümü "RAR for Linux" vardır. Ubuntu\'da "Arşiv Yöneticisi" ZIP ve tar.gz dosyalarını zaten açar.',
    indir: [
      { dosya: 'rarlinux-x64-701.tar.gz', boyut: '720 kB', etiket: 'RAR for Linux x64' },
      { dosya: 'winrar-x64-701tr.exe', boyut: '3,9 MB', etiket: 'WinRAR (Windows)' },
    ],
  },
  'www.microsoft.com/tr-tr/software-download/windows11': {
    baslik: 'Windows 11 Disk Görüntüsü (ISO) indir',
    logo: 'windows',
    metin: 'Linux kullandığınız için doğrudan ISO indirme seçeneği gösteriliyor. USB belleğe yazmak için Ubuntu\'da "Başlangıç Diski Oluşturucu" ya da Windows\'ta Rufus kullanılır.',
    indir: [{ dosya: 'Win11_24H2_Turkish_x64.iso', boyut: '5,4 GB', etiket: '64-bit İndir' }],
  },
  'rufus.ie/tr': {
    baslik: 'Rufus',
    logo: 'rufus',
    metin: 'Rufus yalnızca Windows\'ta çalışır (.exe). Ubuntu\'da önyüklenebilir USB için "Başlangıç Diski Oluşturucu" kullanılır.',
    indir: [{ dosya: 'rufus-4.6.exe', boyut: '1,5 MB', etiket: 'rufus-4.6.exe' }],
  },
  'get.adobe.com/tr/reader': { baslik: 'Adobe Acrobat Reader', logo: 'acrobat', metin: 'Acrobat Reader\'ın güncel Linux sürümü yoktur. Ubuntu\'da PDF dosyaları "Belge Görüntüleyici" ile açılır.' },
  'www.adobe.com/tr/products/photoshop': { baslik: 'Adobe Photoshop', logo: 'photoshop', metin: 'Photoshop Linux\'ta çalışmaz. Ücretsiz ve açık kaynak alternatifi GIMP\'tir: sudo apt install gimp' },
};

export function Firefox(ctx: UbCtx) {
  const sh = ctx.sim.state.sh;
  const [gecmis, setGecmis] = useState<{ liste: string[]; i: number }>({ liste: ['yeni'], i: 0 });
  const url = gecmis.liste[gecmis.i];
  const [adres, setAdres] = useState('');
  const [q, setQ] = useState('');
  const [indirilen, setIndirilen] = useState<string[]>([]);
  const [panel, setPanel] = useState(false);
  const cevrimici = ctx.ag ? ctx.ag.internet : !!ctx.wifi;
  const bagliAmaYok = !!ctx.ag && !ctx.ag.internet && (!!ctx.ag.ethernet || !!ctx.ag.wifi);

  const git = (u0: string) => {
    const u = KISA[u0.replace(/\/$/, '')] ?? u0;
    setGecmis((g) => ({ liste: [...g.liste.slice(0, g.i + 1), u], i: g.i + 1 }));
    setAdres(u.startsWith('ara:') || u === 'yeni' ? '' : u);
    setQ(u.startsWith('ara:') ? u.slice(4) : '');
    ctx.log('ubuntu.firefox.git', { url: u, cevrimici });
  };
  const gez = (i: number) => {
    const u = gecmis.liste[i];
    setGecmis((g) => ({ ...g, i }));
    setAdres(u.startsWith('ara:') || u === 'yeni' ? '' : u);
    setQ(u.startsWith('ara:') ? u.slice(4) : '');
  };
  const adresGit = (e: FormEvent) => {
    e.preventDefault();
    const a = adres.trim().replace(/^https?:\/\//, '');
    if (!a) return;
    git(/\s/.test(a) || !a.includes('.') ? 'ara:' + a : a);
  };
  const indir = (dosya: string, b: string) => {
    const hedef = `${evKlasoru(sh)}/İndirilenler/${dosya}`;
    ctx.sim.act('ubuntu.firefox.indir', { dosya }, (s) =>
      ({ sh: fsDegistir(s.sh, (k) => {
        klasorleriOlustur(k, ust(hedef));
        k.yaz(hedef, { t: 'f', v: IKILI + b });
      }) }),
    );
    setIndirilen((l) => [dosya, ...l.filter((x) => x !== dosya)]);
    setPanel(true);
  };

  let sayfa: ReactNode;
  if (!cevrimici && url !== 'yeni')
    sayfa = (
      <div className="ubff-hata">
        <h2>{bagliAmaYok ? 'Hmm. O siteyi bulmakta sorun yaşıyoruz.' : 'Hmm. O siteye bağlanmakta sorun yaşıyoruz.'}</h2>
        <p>{bagliAmaYok ? 'Bilgisayar ağa bağlı ama internete ya da DNS sunucusuna ulaşılamıyor.' : 'Bilgisayar internete bağlı değil.'}</p>
        <ul className="small">
          {bagliAmaYok ? (
            <>
              <li>Ayarlar › Ağ bölümünde IPv4 ayarlarını (IP adresi, ağ geçidi, DNS) kontrol edin.</li>
              {[ctx.ag?.ethernet, ctx.ag?.wifi].map((d, i) => d?.sorun && <li key={i}>{d.aciklama}</li>)}
            </>
          ) : (
            <>
              <li>Sağ üstteki sistem menüsünden bir Wi-Fi ağına bağlanın.</li>
              <li>Ağ kablosunun takılı olduğunu kontrol edin.</li>
            </>
          )}
        </ul>
        <button className="ubff-btn" onClick={() => gez(gecmis.i)}>
          Yeniden dene
        </button>
      </div>
    );
  else if (url === 'yeni')
    sayfa = (
      <div className="ubff-yeni">
        <Logo id="firefox" size="4em" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) git('ara:' + q.trim());
          }}
        >
          <Logo id="google-g" size="1.2em" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Google ile arayın veya adres yazın" aria-label="Firefox arama" />
        </form>
        <div className="ubff-kisayol">
          {[
            ['Google', 'yeni-google', 'google-g'],
            ['Ubuntu', 'ubuntu.com/download/desktop', 'ubuntu'],
            ['Vikipedi', 'tr.wikipedia.org/wiki/Ubuntu', ''],
            ['mkcaglar', 'mkcaglar.com', ''],
          ].map(([a, u, l]) => (
            <button key={a} onClick={() => (u === 'yeni-google' ? git('ara:google') : git(u))}>
              <span>{l ? <Logo id={l} size="1.6em" /> : a.slice(0, 1).toUpperCase()}</span>
              {a}
            </button>
          ))}
        </div>
      </div>
    );
  else if (url.startsWith('ara:')) {
    const sorgu = url.slice(4);
    const duz = aramaDuzelt(sorgu);
    const s = sonuclar(duz ?? sorgu);
    sayfa = (
      <div className="ubff-sonuc">
        <form
          className="ubff-ara"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) git('ara:' + q.trim());
          }}
        >
          <Logo id="google" size="1.5em" oranli />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Arama" />
        </form>
        {duz && (
          <p className="br-dym">
            Şunu mu demek istediniz:{' '}
            <button className="br-link" onClick={() => git('ara:' + duz)}>
              <b>
                <i>{duz}</i>
              </b>
            </button>
          </p>
        )}
        {s.length === 0 && (
          <div className="br-oneri">
            <p className="small">
              <b>{sorgu}</b> ile ilgili sonuç bulunamadı.
            </p>
            {SITELER.filter((x) => !x.url.includes('mkcaglar')).map((x) => (
              <button key={x.url} className="br-link small" onClick={() => git(x.url)}>
                {x.ad}
              </button>
            ))}
          </div>
        )}
        {s.map((r) => (
          <div key={r.url} className="br-res">
            <small>
              {r.reklam && <b className="br-ad">Sponsorlu · </b>}
              https://{r.url}
            </small>
            <button className="br-link" onClick={() => git(r.url)}>
              {r.baslik}
            </button>
            <p>{r.ozet}</p>
          </div>
        ))}
      </div>
    );
  } else if (LINUX_SAYFA[url]) {
    const p = LINUX_SAYFA[url];
    sayfa = (
      <div className="ubff-site">
        <h1>
          {p.logo && <Logo id={p.logo} size="1.3em" />} {p.baslik}
        </h1>
        <p>{p.metin}</p>
        {p.indir?.map((d) => (
          <button key={d.dosya} className="ubff-btn" onClick={() => indir(d.dosya, d.boyut)}>
            ⬇ {d.etiket} <small>({d.dosya} · {d.boyut})</small>
          </button>
        ))}
      </div>
    );
  } else if (url === 'mkcaglar.com' || url === 'portal.mkcaglar.com') {
    const resim = photoUrl(url === 'mkcaglar.com' ? 'site-mkcaglar' : 'site-portal');
    sayfa = (
      <div className="br-gercek">
        <button className="br-gercek-resim" onClick={() => (ctx.log('ubuntu.firefox.gercek-site', { url }), window.open(`https://${url}`, '_blank', 'noopener'))} title={`https://${url} adresini yeni sekmede aç`}>
          {resim ? <img src={resim} alt={`${url} ekran görüntüsü`} /> : <span className="br-gercek-yer"><b>{url}</b></span>}
        </button>
        <p className="small muted">Bu, sitenin ekran görüntüsüdür. Gerçek siteye gitmek için görüntüye tıklayın.</p>
      </div>
    );
  } else if (/wikipedia\.org\/wiki\//.test(url)) {
    const konu = decodeURIComponent(url.slice(url.lastIndexOf('/') + 1)).replace(/_/g, ' ');
    sayfa = (
      <div className="ubff-site wiki">
        <h1>{konu}</h1>
        <p className="small muted">Vikipedi, özgür ansiklopedi</p>
        <p>
          <b>{konu}</b>, bilişim alanında yaygın olarak kullanılan bir yazılımdır. (Bu sayfa simülasyonda kısaltılmıştır.)
        </p>
      </div>
    );
  } else if (sonuclar(url).some((r) => r.url === url && r.reklam) || /crack|full|hizli|ucretsiz|etkinlestir/.test(url)) {
    sayfa = (
      <div className="ubff-site sahte">
        <h1>⬇ ÜCRETSİZ İNDİR — %100 GÜVENLİ</h1>
        <p>Tek tıkla indir! Lisans gerekmez!</p>
        <button className="ubff-btn kirmizi" onClick={() => indir('Setup_Full_Crack.exe', '2,3 MB')}>
          HEMEN İNDİR
        </button>
        <p className="small muted">İpucu: Bu bir korsan/sahte indirme sitesidir. İndirilen .exe Ubuntu'da çalışmaz ama Windows'ta zararlı yazılım bulaştırabilir.</p>
      </div>
    );
  } else {
    const o = oneriler(url);
    sayfa = (
      <div className="ubff-hata">
        <h2>Hmm. O siteyi bulmakta sorun yaşıyoruz.</h2>
        <p>
          <b>{url}</b> adresindeki sunucuya bağlanamıyoruz.
        </p>
        {o.length > 0 && (
          <div className="br-oneri">
            <b>Şunu mu demek istediniz?</b>
            {o.slice(0, 3).map((x) => (
              <button key={x.url} className="br-link" onClick={() => git(x.url)}>
                {x.url} — {x.ad}
              </button>
            ))}
          </div>
        )}
        <div className="br-oneri">
          <b>Bu simülasyonda bulunan siteler</b>
          {SITELER.filter((s) => !o.slice(0, 3).includes(s)).map((s) => (
            <button key={s.url} className="br-link small" onClick={() => git(s.url)}>
              {s.ad}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ubff" onKeyDown={(e) => e.altKey && e.key === 'ArrowLeft' && gecmis.i > 0 && (e.preventDefault(), gez(gecmis.i - 1))}>
      <div className="ubff-bar">
        <button onClick={() => gez(gecmis.i - 1)} disabled={gecmis.i === 0} aria-label="Geri">
          ←
        </button>
        <button onClick={() => gez(gecmis.i + 1)} disabled={gecmis.i >= gecmis.liste.length - 1} aria-label="İleri">
          →
        </button>
        <button onClick={() => gez(gecmis.i)} aria-label="Yenile">
          ⟳
        </button>
        <button onClick={() => git('yeni')} aria-label="Ana sayfa">
          ⌂
        </button>
        <form onSubmit={adresGit}>
          <span>{url === 'yeni' || url.startsWith('ara:') ? '🔍' : '🔒'}</span>
          <input value={adres} onChange={(e) => setAdres(e.target.value)} onFocus={(e) => e.target.select()} placeholder="Google ile arayın veya adres yazın" aria-label="Adres çubuğu" />
        </form>
        <button className={indirilen.length ? 'var' : ''} onClick={() => setPanel((p) => !p)} aria-label="İndirmeler">
          ⬇
        </button>
      </div>
      <div className="ubff-sayfa">{sayfa}</div>
      {panel && (
        <div className="ubff-panel">
          {indirilen.length ? (
            indirilen.map((d) => (
              <div key={d}>
                <span>📄 {d}</span>
                <small>Tamamlandı</small>
              </div>
            ))
          ) : (
            <small>Bu oturumda indirme yok.</small>
          )}
          <button onClick={() => (setPanel(false), ctx.ac('dosyalar', `${evKlasoru(sh)}/İndirilenler`))}>İndirilenler klasörünü göster</button>
        </div>
      )}
    </div>
  );
}

// ---------- Ayarlar ----------
export function UbuntuAyarlar(ctx: UbCtx) {
  const sh = ctx.sim.state.sh;
  const [bolum, setBolum] = useState<'ag' | 'wifi' | 'hakkinda'>(ctx.arg === 'ag' ? 'ag' : ctx.arg === 'hakkinda' ? 'hakkinda' : 'wifi');
  const [sifre, setSifre] = useState<{ ag: string; deger: string; hata?: string } | null>(null);
  const [ipDlg, setIpDlg] = useState<AgTur | null>(null);
  const eth = ctx.ag?.ethernet ?? null;
  return (
    <div className="uba">
      <nav>
        <button className={bolum === 'ag' ? 'on' : ''} onClick={() => setBolum('ag')}>
          🖧 Ağ
        </button>
        <button className={bolum === 'wifi' ? 'on' : ''} onClick={() => setBolum('wifi')}>
          📶 Wi-Fi
        </button>
        <button className={bolum === 'hakkinda' ? 'on' : ''} onClick={() => setBolum('hakkinda')}>
          ℹ Sistem › Hakkında
        </button>
      </nav>
      <main>
        {bolum === 'ag' ? (
          <>
            <h3>Kablolu</h3>
            <div className="uba-ag">
              <span>
                {ctx.kablo ? (eth?.internet ? 'Bağlandı — 1000 Mb/sn' : eth?.sorun === 'cakisma' ? 'Bağlantı başarısız (IP adresi çakışması)' : 'Bağlandı — internet yok') : 'Kablo çıkarıldı'}
              </span>
              <span className="uba-sag">
                <span className={'uba-anahtar' + (ctx.kablo ? ' acik' : '')} aria-hidden />
                <button onClick={() => setIpDlg('ethernet')} aria-label="Kablolu bağlantı ayarları" disabled={!ctx.ipKaydet}>
                  ⚙
                </button>
              </span>
            </div>
            {eth?.sorun && <p className="ubf-hata small">⚠ {eth.aciklama}</p>}
            <h3>VPN</h3>
            <p className="small muted">Yapılandırılmamış</p>
            <h3>Ağ Vekil Sunucusu</h3>
            <p className="small muted">Kapalı</p>
          </>
        ) : bolum === 'wifi' ? (
          <>
            <h3>Wi-Fi</h3>
            <p className="small">{ctx.wifi ? `Bağlı: ${ctx.wifi}` : 'Bağlı değil'}</p>
            {WIFI.map((w) => (
              <div key={w.ssid} className="uba-ag">
                <span>
                  {'▂▄▆█'.slice(0, w.guc)} {w.ssid} {w.sifre ? '🔒' : ''}
                </span>
                {ctx.wifi === w.ssid ? (
                  <span className="uba-sag">
                    <b className="small">{ctx.ag?.wifi && !ctx.ag.wifi.internet ? 'Bağlı, internet yok' : 'Bağlı ✓'}</b>
                    <button onClick={() => setIpDlg('wifi')} aria-label="Wi-Fi bağlantı ayarları" disabled={!ctx.ipKaydet}>
                      ⚙
                    </button>
                  </span>
                ) : (
                  <button disabled={!ctx.wifiBaglan} onClick={() => (w.sifre ? setSifre({ ag: w.ssid, deger: '' }) : (ctx.wifiBaglan?.(w.ssid), ctx.bildir(`${w.ssid} ağına bağlanıldı.`)))}>
                    Bağlan
                  </button>
                )}
              </div>
            ))}
            {sifre && (
              <form
                className="uba-sifre"
                onSubmit={(e) => {
                  e.preventDefault();
                  const w = WIFI.find((x) => x.ssid === sifre.ag)!;
                  if (sifre.deger !== w.sifre) return setSifre({ ...sifre, hata: 'Kimlik doğrulama başarısız. Parolayı kontrol edin.' });
                  ctx.wifiBaglan?.(w.ssid);
                  ctx.bildir(`${w.ssid} ağına bağlanıldı.`);
                  setSifre(null);
                }}
              >
                <label className="small">"{sifre.ag}" için parola</label>
                <input type="text" data-sim-parola autoComplete="off" spellCheck={false} autoFocus value={sifre.deger} onChange={(e) => setSifre({ ...sifre, deger: e.target.value, hata: undefined })} aria-label="Wi-Fi parolası" />
                {sifre.hata && <small className="ubf-hata">{sifre.hata}</small>}
                <button type="submit">Bağlan</button>
              </form>
            )}
          </>
        ) : (
          <>
            <div className="uba-logo">
              <Logo id="ubuntu" size="3em" />
              <b>Ubuntu 24.04.1 LTS</b>
            </div>
            <table className="uba-tablo">
              <tbody>
                <tr><td>Cihaz adı</td><td>{sh.host}</td></tr>
                <tr><td>İşlemci</td><td>{sh.sistem.cpu}</td></tr>
                <tr><td>Bellek</td><td>{sh.sistem.ram.replace('Gi', ' GiB')}</td></tr>
                <tr><td>Disk kapasitesi</td><td>{sh.sistem.disk.replace('G', ' GB')}</td></tr>
                <tr><td>Grafik</td><td>{sh.sistem.ekran}</td></tr>
                <tr><td>Masaüstü ortamı</td><td>GNOME 46</td></tr>
                <tr><td>Pencere sistemi</td><td>Wayland</td></tr>
                <tr><td>Kullanıcılar</td><td>{sh.kullanicilar.filter((u) => u !== 'root').join(', ')}</td></tr>
              </tbody>
            </table>
          </>
        )}
      </main>
      {ipDlg && ctx.ipKaydet && <UbuntuIpPenceresi tur={ipDlg} ayar={ctx.ipAyar?.[ipDlg]} durum={ipDlg === 'ethernet' ? ctx.ag?.ethernet ?? null : ctx.ag?.wifi ?? null} baslik={ipDlg === 'ethernet' ? 'Kablolu' : ctx.wifi} kapat={() => setIpDlg(null)} kaydet={(a) => (ctx.ipKaydet!(ipDlg, a), setIpDlg(null))} />}
    </div>
  );
}

/** GNOME bağlantı ayarları penceresi: Ayrıntılar ve IPv4 sekmeleri */
function UbuntuIpPenceresi({ tur, ayar, durum, baslik, kapat, kaydet }: { tur: AgTur; ayar?: IpAyar; durum: IpSonuc | null; baslik: string; kapat: () => void; kaydet: (a: IpAyar) => void }) {
  const ilk = ayar ?? DHCP;
  const [sekme, setSekme] = useState<'ayrinti' | 'ipv4'>('ayrinti');
  const [mod, setMod] = useState<'dhcp' | 'elle'>(ilk.mod);
  const [adres, setAdres] = useState(ilk.ip);
  const [maske, setMaske] = useState(ilk.maske || '24');
  const [gecit, setGecit] = useState(ilk.gecit);
  const [dns, setDns] = useState([ilk.dns1, ilk.dns2].filter(Boolean).join(', '));
  const [hatalar, setHatalar] = useState<string[]>([]);
  const uygula = () => {
    if (mod === 'dhcp') return kaydet({ ...DHCP });
    const m = /^\d{1,2}$/.test(maske.trim()) ? onekMaske(maske.trim()) : maske.trim();
    const [d1 = '', d2 = ''] = dns.split(/[,\s]+/).filter(Boolean);
    const a: IpAyar = { mod: 'elle', ip: adres.trim(), maske: m, gecit: gecit.trim(), dns1: d1, dns2: d2 };
    const h = ayarHatalari(a);
    if (h.length) return setHatalar(h);
    kaydet(a);
  };
  return (
    <div className="ubf-modal">
      <div className="ubf-dlg ubip" role="dialog" aria-label={`${baslik} ayarları`}>
        <div className="ubip-bas">
          <button onClick={kapat}>İptal</button>
          <b>{baslik}</b>
          <button className="ana" onClick={uygula}>
            Uygula
          </button>
        </div>
        <div className="ubip-sekme">
          <button className={sekme === 'ayrinti' ? 'on' : ''} onClick={() => setSekme('ayrinti')}>
            Ayrıntılar
          </button>
          <button className={sekme === 'ipv4' ? 'on' : ''} onClick={() => setSekme('ipv4')}>
            IPv4
          </button>
        </div>
        {sekme === 'ayrinti' ? (
          <table>
            <tbody>
              <tr><td>Bağlantı Hızı</td><td>{tur === 'ethernet' ? '1000 Mb/sn' : '574 Mb/sn'}</td></tr>
              <tr><td>IPv4 Adresi</td><td>{durum ? (durum.sorun === 'cakisma' ? 'Yok (adres çakışması)' : durum.ip) : '—'}</td></tr>
              <tr><td>Donanım Adresi</td><td>{AGLAR[tur].mac.replace(/-/g, ':')}</td></tr>
              <tr><td>Öntanımlı Rota</td><td>{durum?.gecit || '—'}</td></tr>
              <tr><td>DNS</td><td>{durum?.dns.join(', ') || '—'}</td></tr>
            </tbody>
          </table>
        ) : (
          <>
            <b className="small">IPv4 Yöntemi</b>
            <label className="ubip-radyo">
              <input type="radio" checked={mod === 'dhcp'} onChange={() => (setMod('dhcp'), setHatalar([]))} /> Otomatik (DHCP)
            </label>
            <label className="ubip-radyo">
              <input type="radio" checked={mod === 'elle'} onChange={() => (setMod('elle'), setHatalar([]))} /> Elle
            </label>
            {mod === 'elle' && (
              <>
                <b className="small">Adresler</b>
                <div className="ubip-adres">
                  <label>
                    Adres
                    <input value={adres} onChange={(e) => (setAdres(e.target.value), setHatalar([]))} aria-label="Adres" placeholder="192.168.1.60" />
                  </label>
                  <label>
                    Ağ Maskesi
                    <input value={maske} onChange={(e) => (setMaske(e.target.value), setHatalar([]))} aria-label="Ağ Maskesi" placeholder="24 ya da 255.255.255.0" />
                  </label>
                  <label>
                    Ağ Geçidi
                    <input value={gecit} onChange={(e) => (setGecit(e.target.value), setHatalar([]))} aria-label="Ağ Geçidi" placeholder="192.168.1.1" />
                  </label>
                </div>
                <b className="small">DNS</b>
                <input value={dns} onChange={(e) => (setDns(e.target.value), setHatalar([]))} aria-label="DNS" placeholder="Virgülle ayrılmış IP adresleri (ör. 8.8.8.8, 1.1.1.1)" />
              </>
            )}
            {mod === 'elle' && <small className="muted">Önek: /{maskeOnek(/^\d{1,2}$/.test(maske.trim()) ? onekMaske(maske.trim()) : maske.trim())}</small>}
          </>
        )}
        {hatalar.map((h) => (
          <small key={h} className="ubf-hata">
            {h}
          </small>
        ))}
      </div>
    </div>
  );
}

// ---------- Başlangıç Diski Oluşturucu (usb-creator-gtk) ----------
export function BaslangicDiski(ctx: UbCtx) {
  const sh = ctx.sim.state.sh;
  const usb = ctx.usb ?? [];
  const isolar = sh.dosyalar.filter((p) => /\.iso$/i.test(p));
  const [iso, setIso] = useState<string | null>(ctx.arg && isolar.includes(ctx.arg) ? ctx.arg : (isolar[0] ?? null));
  const [disk, setDisk] = useState<string | null>(usb[0]?.id ?? null);
  const [adim, setAdim] = useState<'sec' | 'onay' | 'parola' | 'yaziyor' | 'bitti'>('sec');
  const [pw, setPw] = useState('');
  const [hata, setHata] = useState('');
  const [yuzde, setYuzde] = useState(0);

  useEffect(() => {
    if (disk && !usb.some((u) => u.id === disk)) setDisk(usb[0]?.id ?? null);
    else if (!disk && usb.length) setDisk(usb[0].id);
  }, [usb, disk]);
  useEffect(() => {
    if (adim !== 'yaziyor') return;
    if (!usb.some((u) => u.id === disk)) {
      setAdim('sec');
      setHata('Yazma sırasında USB bellek çıkarıldı! Bellek bozulmuş olabilir; yeniden deneyin.');
      ctx.log('ubuntu.usb-yazici.cikarildi', {});
      return;
    }
    if (yuzde >= 100) {
      ctx.usbYaz?.(disk!, ad(iso!));
      ctx.log('ubuntu.usb-yazici.bitti', { iso: ad(iso!), disk: disk! });
      setAdim('bitti');
      return;
    }
    const t = setTimeout(() => setYuzde((y) => Math.min(100, y + 7)), 250);
    return () => clearTimeout(t);
  }, [adim, yuzde, usb, disk]); // eslint-disable-line react-hooks/exhaustive-deps

  const secDisk = usb.find((u) => u.id === disk);
  const windowsIso = !!iso && /win/i.test(ad(iso)) && !/ubuntu/i.test(ad(iso));
  const olustur = () => {
    setHata('');
    if (!iso || !secDisk) return;
    if (windowsIso) return setHata('Bu araç Windows kurulum kalıplarını önyüklenebilir USB\'ye çeviremez. Windows ISO için Windows\'ta Rufus kullanın.');
    setAdim('onay');
  };
  const dogrula = (e: FormEvent) => {
    e.preventDefault();
    if (ctx.parola !== undefined && pw !== ctx.parola) {
      setPw('');
      setHata('Üzgünüz, bu işe yaramadı. Lütfen yeniden deneyin.');
      ctx.log('ubuntu.usb-yazici.parola-hata', {});
      return;
    }
    setHata('');
    setYuzde(0);
    setAdim('yaziyor');
    ctx.log('ubuntu.usb-yazici.basla', { iso: ad(iso!), disk: secDisk!.id });
  };

  return (
    <div className="ubu">
      <p className="ubu-acik">Bir Ubuntu kurulum diski (önyüklenebilir USB) oluşturmak için bir kaynak disk kalıbı (.iso) ve hedef USB bellek seçin. Hedef bellekteki <b>tüm veriler silinir</b>.</p>
      <b className="ubu-h">Kaynak disk kalıbı (.iso):</b>
      <div className="ubu-tablo" role="listbox" aria-label="Kaynak disk kalıbı">
        <div className="ubu-satir bas">
          <span>CD-Disk Kalıbı</span>
          <span>İşletim Sistemi</span>
          <span>Boyut</span>
        </div>
        {isolar.length === 0 && <div className="ubu-bos">Ev klasöründe .iso dosyası yok. Firefox ile ubuntu.com'dan Ubuntu ISO'sunu indirin.</div>}
        {isolar.map((p) => {
          const n = dugum(sh, p);
          return (
            <button key={p} role="option" aria-selected={iso === p} className={'ubu-satir' + (iso === p ? ' on' : '')} onClick={() => (setIso(p), setHata(''))} disabled={adim === 'yaziyor'}>
              <span>{p.replace(evKlasoru(sh), '~')}</span>
              <span>{/ubuntu/i.test(p) ? 'Ubuntu 24.04.1 LTS' : /win/i.test(p) ? 'Windows 11 (desteklenmiyor)' : 'Bilinmiyor'}</span>
              <span>{n ? boyut(n) : ''}</span>
            </button>
          );
        })}
      </div>
      <b className="ubu-h">Kullanılacak disk:</b>
      <div className="ubu-tablo" role="listbox" aria-label="Kullanılacak disk">
        <div className="ubu-satir bas">
          <span>Aygıt</span>
          <span>Etiket</span>
          <span>Kapasite</span>
        </div>
        {usb.length === 0 && <div className="ubu-bos">USB bellek takılı değil. Kasadaki bir USB girişine flash bellek takın.</div>}
        {usb.map((u, i) => (
          <button key={u.id} role="option" aria-selected={disk === u.id} className={'ubu-satir' + (disk === u.id ? ' on' : '')} onClick={() => setDisk(u.id)} disabled={adim === 'yaziyor'}>
            <span>/dev/sd{'bc'[i] ?? 'd'} — {u.ad}</span>
            <span>{u.etiket}</span>
            <span>{u.kapasite}</span>
          </button>
        ))}
      </div>
      {hata && <p className="ubf-hata small">{hata}</p>}
      {adim === 'yaziyor' && (
        <div className="ubu-ilerleme">
          <span>Dosyalar yazılıyor… %{yuzde}</span>
          <div>
            <i style={{ width: `${yuzde}%` }} />
          </div>
          <small>Bitene kadar USB belleği çıkarmayın.</small>
        </div>
      )}
      {adim === 'bitti' && (
        <p className="ubu-tamam">
          ✔ Kurulum tamamlandı. {secDisk?.ad ?? 'USB bellek'} artık önyüklenebilir Ubuntu kurulum diski. Bilgisayarı yeniden başlatıp önyükleme menüsünden (F8/F11/F12) USB'yi seçebilirsiniz.
        </p>
      )}
      <div className="ubu-alt">
        {adim === 'bitti' ? (
          <button className="ana" onClick={ctx.kapat}>
            Çık
          </button>
        ) : (
          <>
            <button onClick={ctx.kapat} disabled={adim === 'yaziyor'}>
              Çık
            </button>
            <button className="ana" onClick={olustur} disabled={!iso || !secDisk || adim === 'yaziyor'}>
              Başlangıç Diski Oluştur
            </button>
          </>
        )}
      </div>
      {adim === 'onay' && secDisk && (
        <div className="ubf-modal">
          <div className="ubf-dlg">
            <b>{secDisk.ad} üzerine yazılsın mı?</b>
            <p className="small">
              Diskteki her şey silinecek{secDisk.dosyaSayisi ? ` (${secDisk.dosyaSayisi} öğe)` : ''}. Silinen veriler geri getirilemez.
            </p>
            <div className="ubf-dlg-btn">
              <button onClick={() => setAdim('sec')}>İptal</button>
              <button className="ana kirmizi" onClick={() => (setPw(''), setAdim('parola'))}>
                Diski Sil ve Yaz
              </button>
            </div>
          </div>
        </div>
      )}
      {adim === 'parola' && (
        <div className="ubf-modal">
          <form className="ubf-dlg" onSubmit={dogrula}>
            <b>🔒 Kimlik Doğrulaması Gerekli</b>
            <p className="small">Bir aygıtı biçimlendirmek için kimlik doğrulaması gerekir.</p>
            <label className="small">{sh.user} için parola</label>
            <input type="text" data-sim-parola autoComplete="off" spellCheck={false} autoFocus value={pw} onChange={(e) => (setPw(e.target.value), setHata(''))} aria-label="Kimlik doğrulama parolası" />
            {hata && <small className="ubf-hata">{hata}</small>}
            <div className="ubf-dlg-btn">
              <button type="button" onClick={() => (setAdim('sec'), setHata(''))}>
                İptal
              </button>
              <button className="ana" type="submit">
                Kimlik Doğrula
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
