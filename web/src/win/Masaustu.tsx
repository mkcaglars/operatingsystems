// Sanal Windows 11 masaüstü: görev çubuğu, başlat menüsü, pencereler, UAC (Kullanıcı Hesabı Denetimi).
// Uygulamalar win/ altında; hepsi sim durumundaki "pc" (WinPc) üzerinde çalışır.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Json } from '../core/rules';
import type { Sim } from '../core/sim';
import { adOf, children, derive, KULLANICI, yenidenBaslat, type WinPc } from '../core/winpc';
import { KATALOG } from '../core/katalog';
import { acicilar, uzanti } from '../core/dosyaIslem';
import BaglamMenu, { type MenuOge } from './BaglamMenu';
import BirlikteAc from './BirlikteAc';
import NotDefteri from './NotDefteri';
import Fotograflar from './Fotograflar';
import Kurtarma from './Kurtarma';
import Rufus from './Rufus';
import Program, { PROGRAM_AD } from './Program';
import Logo, { logoVar, uygulamaLogo } from '../components/Logo';
import { duvarArkaPlan } from '../components/Photo';
import { WindowsSaat } from '../components/Saat';
import Ayarlar from './Ayarlar';
import GorevYoneticisi from './GorevYoneticisi';
import DosyaGezgini from './DosyaGezgini';
import AygitYoneticisi from './AygitYoneticisi';
import Guvenlik from './Guvenlik';
import Tarayici from './Tarayici';
import Kurulum from './Kurulum';
import Word from './Word';
import Konsol from './Konsol';
import SistemKoruma from './SistemKoruma';

export type AppId = 'ayarlar' | 'gorev' | 'dosya' | 'aygit' | 'guvenlik' | 'edge' | 'chrome' | 'word' | 'kurulum' | 'sistemkoruma' | 'rufus' | 'program' | 'notdefteri' | 'fotograflar' | 'cmd' | 'powershell';

export interface WinVeri {
  uygulamalar?: AppId[];
  /** Standart kullanıcıyken UAC'de istenen yönetici hesabı */
  yonetici?: { ad: string; parola: string };
  surucuKlasorleri?: { id: string; ad: string }[];
  officeAnahtar?: string;
  adobeHesap?: { eposta: string; parola: string };
  baslangicUygulama?: AppId;
  baslangicSayfa?: string;
  /** Görev çubuğundaki ağ menüsünde görünen kablosuz ağlar */
  wifiAglari?: { ssid: string; sifre: string; guc: number }[];
}

/** Kum havuzunda sanal Windows'un gerçek donanımla (USB bellekler, güç) konuşması için */
export interface Kopru {
  usbler: { id: string; ad: string; harf: string; kapasite: string }[];
  /** Bilgisayar UEFI (CSM kapalı) mı */
  uefi: boolean;
  rufusBitti: (y: { aygit: string; iso: string; bolum: string; hedef: string }) => void;
  guc: (t: 'kapat' | 'yeniden') => void;
}

export interface AppCtx {
  pc: WinPc;
  act: (type: string, data: Record<string, Json>, f: (pc: WinPc) => WinPc) => void;
  /** pc'yi değiştirmeyen olay */
  log: (type: string, data: Record<string, Json>) => void;
  open: (app: AppId, arg?: string) => void;
  close: (app: AppId) => void;
  uac: (ad: string, yayinci: string, ok: () => void) => void;
  veri: WinVeri;
  learn: boolean;
  arg?: string;
  kopru?: Kopru;
  /** Dosyayı ilişkili uygulamayla açar; uygulama yoksa "Birlikte aç" penceresi gelir */
  dosyaAc: (yol: string) => void;
  birlikteAc: (yol: string) => void;
  /** Sağ tık menüsü */
  menu: (e: { clientX: number; clientY: number; preventDefault: () => void; stopPropagation: () => void }, ogeler: MenuOge[]) => void;
}

const APP_INFO: Record<AppId, { ad: string; ikon: string; renk: string }> = {
  ayarlar: { ad: 'Ayarlar', ikon: '⚙', renk: '#5b5b5b' },
  gorev: { ad: 'Görev Yöneticisi', ikon: '📊', renk: '#0f6cbd' },
  dosya: { ad: 'Dosya Gezgini', ikon: '📁', renk: '#f2b600' },
  aygit: { ad: 'Aygıt Yöneticisi', ikon: '🖥', renk: '#3a6ea5' },
  guvenlik: { ad: 'Windows Güvenliği', ikon: '🛡', renk: '#0067c0' },
  edge: { ad: 'Microsoft Edge', ikon: '🌐', renk: '#0c8bd6' },
  chrome: { ad: 'Google Chrome', ikon: '🟡', renk: '#1a73e8' },
  word: { ad: 'Word', ikon: 'W', renk: '#185abd' },
  kurulum: { ad: 'Kurulum', ikon: '📦', renk: '#6b7280' },
  sistemkoruma: { ad: 'Sistem Özellikleri', ikon: '🖥', renk: '#3a6ea5' },
  rufus: { ad: 'Rufus', ikon: '🔧', renk: '#3c3c3c' },
  program: { ad: 'Program', ikon: '▦', renk: '#64748b' },
  notdefteri: { ad: 'Not Defteri', ikon: '📝', renk: '#2c7be5' },
  fotograflar: { ad: 'Fotoğraflar', ikon: '🖼', renk: '#0ea5e9' },
  cmd: { ad: 'Komut İstemi', ikon: '>_', renk: '#0c0c0c' },
  powershell: { ad: 'Windows PowerShell', ikon: '>_', renk: '#012456' },
};

/** Pencere başlığı ve simgesi ("program" penceresinde kurulu programın kendisi) */
function pencere(w: { id: AppId; arg?: string }): { ad: string; logo: string | null } {
  if (w.id === 'program') {
    const [taban, dosya] = (w.arg ?? '').split('|');
    const ad = PROGRAM_AD[taban] ?? taban ?? 'Program';
    return { ad: dosya ? `${dosya.slice(dosya.lastIndexOf('/') + 1)} - ${ad}` : ad, logo: uygulamaLogo(taban) };
  }
  if ((w.id === 'notdefteri' || w.id === 'fotograflar') && w.arg) return { ad: `${w.arg.slice(w.arg.lastIndexOf('/') + 1)} - ${APP_INFO[w.id].ad}`, logo: w.id };
  return { ad: APP_INFO[w.id].ad, logo: logoVar(w.id) ? w.id : null };
}

/** Uygulama simgesi: gerçek logo varsa SVG, yoksa renkli kutu */
export function AppIkon({ id, size }: { id: AppId; size?: string }) {
  if (logoVar(id)) return <Logo id={id} size={size} />;
  return <i style={{ background: APP_INFO[id].renk }}>{APP_INFO[id].ikon}</i>;
}

type Win = { id: AppId; arg?: string };

export default function Masaustu({ sim, veri, learn, kopru }: { sim: Sim<{ pc: WinPc }>; veri: WinVeri; learn: boolean; kopru?: Kopru }) {
  const pc = sim.state.pc;
  const [wins, setWins] = useState<Win[]>(veri.baslangicUygulama ? [{ id: veri.baslangicUygulama, arg: veri.baslangicSayfa }] : []);
  const [aktif, setAktif] = useState<AppId | null>(veri.baslangicUygulama ?? null);
  const [start, setStart] = useState(false);
  const [guc, setGuc] = useState(false);
  const [reklamKapali, setReklamKapali] = useState(false);
  const [menuDurum, setMenuDurum] = useState<{ x: number; y: number; ogeler: MenuOge[] } | null>(null);
  const [birlikte, setBirlikte] = useState<string | null>(null);
  const [mesajDlg, setMesajDlg] = useState<{ baslik: string; metin: string } | null>(null);
  const [masaSec, setMasaSec] = useState<string | null>(null);
  const kok = useRef<HTMLDivElement>(null);
  const [agMenu, setAgMenu] = useState(false);
  const [cakismaBildirim, setCakismaBildirim] = useState<string | null>(null);
  const cakisma = pc.agDurum?.ethernet?.sorun === 'cakisma' ? pc.agDurum.ethernet.aciklama : pc.agDurum?.wifi?.sorun === 'cakisma' ? pc.agDurum.wifi.aciklama : null;
  useEffect(() => {
    setCakismaBildirim(cakisma);
  }, [cakisma]);
  const [wifiSec, setWifiSec] = useState<string | null>(null);
  const [wifiPw, setWifiPw] = useState('');
  const [wifiHata, setWifiHata] = useState('');
  const [uacReq, setUacReq] = useState<{ ad: string; yayinci: string; ok: () => void } | null>(null);
  const [uacPw, setUacPw] = useState('');
  const [uacErr, setUacErr] = useState('');

  // "Bu bilgisayarı sıfırla" sonrası bilgisayar yeniden başlar: açık pencereler kapanır
  const sonSifirlama = useRef(pc.sifirlama);
  useEffect(() => {
    if (pc.sifirlama !== sonSifirlama.current) {
      sonSifirlama.current = pc.sifirlama;
      setWins([]);
      setAktif(null);
    }
  }, [pc.sifirlama]);

  const act: AppCtx['act'] = (type, data, f) => sim.act(type, data, (st) => ({ ...st, pc: derive(f(JSON.parse(JSON.stringify(st.pc)))) }));
  const log: AppCtx['log'] = (type, data) => sim.act(type, data, (st) => st);
  const open = (id: AppId, arg?: string) => {
    setStart(false);
    setWins((w) => (w.some((x) => x.id === id) ? w.map((x) => (x.id === id ? { id, arg: arg ?? x.arg } : x)) : [...w, { id, arg }]));
    setAktif(id);
    sim.act('uygulama.ac', { uygulama: id }, (st) => st);
  };
  const close = (id: AppId) => {
    setWins((w) => w.filter((x) => x.id !== id));
    setAktif((a) => (a === id ? null : a));
  };
  const uac: AppCtx['uac'] = (ad, yayinci, ok) => {
    setUacPw('');
    setUacErr('');
    setUacReq({ ad, yayinci, ok });
  };
  const menu: AppCtx['menu'] = (e, ogeler) => {
    e.preventDefault();
    e.stopPropagation();
    const r = kok.current?.getBoundingClientRect();
    setMenuDurum({ x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0), ogeler });
  };
  /** Dosyayı seçilen uygulamayla açar */
  const ileAc = (uyg: string, yol: string) => {
    sim.act('dosya.ac', { dosya: yol, uygulama: uyg }, (st) => st);
    if (uyg === 'word') open('word', yol);
    else if (uyg === 'excel') open('program', 'excel|' + yol);
    else if (uyg === 'winrar') open('program', 'winrar|' + yol);
    else if (uyg === 'dosya') open('dosya', yol);
    else if (uyg === 'notdefteri' || uyg === 'fotograflar') open(uyg, yol);
    else if (uyg === 'edge' || uyg === 'chrome') open(uyg);
    else open('program', uyg);
  };
  const birlikteAc: AppCtx['birlikteAc'] = (yol) => {
    sim.act('dosya.birlikte-ac', { dosya: yol, uzanti: uzanti(yol), uygulamaVar: acicilar(pc, yol).length > 0 }, (st) => st);
    setBirlikte(yol);
  };
  const dosyaAc: AppCtx['dosyaAc'] = (yol) => {
    const f = pc.fs[yol];
    if (!f) return;
    if (f.tur === 'klasor') return open('dosya', yol);
    if (f.uygulama === 'rufus') {
      sim.act('dosya.calistir', { dosya: yol, uygulama: f.uygulama }, (st) => st);
      return uac(adOf(yol), 'Akeo Consulting', () => open('rufus'));
    }
    if (f.kurulum) {
      const t = KATALOG[f.kurulum];
      sim.act('dosya.calistir', { dosya: yol, kurulum: f.kurulum }, (st) => st);
      return uac(adOf(yol), f.kaynak === 'sahte' ? 'Bilinmiyor' : t.uygulama.yayinci, () => open('kurulum', yol));
    }
    const uz = uzanti(yol);
    if (uz === 'iso') return setMesajDlg({ baslik: adOf(yol), metin: 'Bu bir disk görüntüsü (ISO). Kurulum belleği hazırlamak için Rufus ile bir USB belleğe yazın.' });
    if (uz === 'exe' || uz === 'msi') return setMesajDlg({ baslik: adOf(yol), metin: 'Bu uygulama bu bilgisayarda çalıştırılamıyor. Bir yayımcıya başvurun.' });
    const a = acicilar(pc, yol);
    if (a.length) ileAc(a[0].id, yol);
    else birlikteAc(yol);
  };
  /** Microsoft Store'da uygulama ara: bilinen dosya türleri için indirme sayfası açılır */
  const storeAra = (yol: string) => {
    const uz = uzanti(yol);
    setBirlikte(null);
    sim.act('dosya.store-ara', { uzanti: uz }, (st) => st);
    if (['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(uz)) open('edge', 'www.microsoft.com/tr-tr/microsoft-365/office-2024');
    else if (['rar', '7z'].includes(uz)) open('edge', 'www.win-rar.com/turkce');
    else if (uz === 'pdf') open('edge', 'get.adobe.com/tr/reader');
    else setMesajDlg({ baslik: 'Microsoft Store', metin: `".${uz}" dosyaları için uygun bir uygulama bulunamadı.` });
  };
  const ben = pc.hesaplar.find((h) => h.ad === pc.cihaz.kullanici);
  const standart = ben?.tur === 'standart';

  const izinli = (veri.uygulamalar ?? ['ayarlar', 'gorev', 'dosya', 'aygit', 'guvenlik', 'edge']) as AppId[];
  const pinned: AppId[] = izinli.filter((a) => a !== 'kurulum' && a !== 'sistemkoruma' && a !== 'word' && a !== 'rufus');
  if (pc.kurulu.includes('chrome') && !pinned.includes('chrome')) pinned.push('chrome');
  if (pc.kurulu.includes('office') && !pinned.includes('word')) pinned.push('word');

  // Kurulu programların kısayolları (masaüstü ve Başlat › Tüm uygulamalar)
  type Kisayol = { anahtar: string; ad: string; logo: string; ac: () => void; masaustu: boolean };
  const kisayollar: Kisayol[] = [];
  for (const u of pc.uygulamalar) {
    if (u.id === 'kms') continue;
    if (u.id === 'edge') kisayollar.push({ anahtar: 'edge', ad: 'Microsoft Edge', logo: 'edge', ac: () => open('edge'), masaustu: false });
    else if (u.id === 'chrome') kisayollar.push({ anahtar: 'chrome', ad: 'Google Chrome', logo: 'chrome', ac: () => open('chrome'), masaustu: true });
    else if (u.id === 'office') {
      for (const b of pc.bilesenler.office ?? ['word', 'excel', 'powerpoint', 'outlook']) {
        const ad = b === 'word' ? 'Word' : (PROGRAM_AD[b] ?? b);
        kisayollar.push({ anahtar: b, ad, logo: logoVar(b) ? b : 'office', ac: () => (b === 'word' ? open('word') : open('program', b)), masaustu: ['word', 'excel', 'powerpoint'].includes(b) });
      }
    } else kisayollar.push({ anahtar: u.id, ad: PROGRAM_AD[u.id] ?? u.ad, logo: uygulamaLogo(u.id), ac: () => open('program', u.id), masaustu: u.id !== 'teams' && u.id !== 'onedrive' });
  }
  kisayollar.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));

  const MASA = `${KULLANICI}/Masaüstü`;
  const masaDosyalari = children(pc, MASA).filter((p) => pc.explorer.gizli || !pc.fs[p].gizli);
  const yeniAd = (taban: string, uz = '') => {
    let n = `${MASA}/${taban}${uz}`;
    for (let i = 2; pc.fs[n]; i++) n = `${MASA}/${taban} (${i})${uz}`;
    return n;
  };
  function dosyaMenusu(yol: string): MenuOge[] {
    const f = pc.fs[yol];
    const klasor = f?.tur === 'klasor';
    return [
      { ad: 'Aç', kalin: true, ikon: '📂', onClick: () => dosyaAc(yol) },
      ...(klasor ? [] : [{ ad: 'Birlikte aç…', ikon: '🗂', onClick: () => birlikteAc(yol) }]),
      { ayrac: true },
      { ad: 'Sil', ikon: '🗑', kisayol: 'Del', onClick: () => act('dosya.sil', { yol }, (p) => (Object.keys(p.fs).forEach((k) => (k === yol || k.startsWith(yol + '/')) && delete p.fs[k]), p)) },
      { ad: 'Özellikler', ikon: 'ⓘ', kisayol: 'Alt+Enter', onClick: () => setMesajDlg({ baslik: `${adOf(yol)} Özellikleri`, metin: `Tür: ${klasor ? 'Dosya klasörü' : `.${uzanti(yol)} dosyası`} · Konum: ${MASA.replace(/\//g, '\\')} · Boyut: ${f?.boyut ?? '—'}` }) },
    ];
  }
  function masaustuMenu(e: Parameters<AppCtx['menu']>[0]) {
    menu(e, [
      { ad: 'Görünüm', ikon: '▦', kisayol: '›', devreDisi: true },
      { ad: 'Sıralama ölçütü', ikon: '⇅', kisayol: '›', devreDisi: true },
      { ad: 'Yenile', ikon: '⟳', onClick: () => log('masaustu.yenile', {}) },
      { ayrac: true },
      {
        ad: 'Yeni klasör',
        ikon: '📁',
        onClick: () => {
          const n = yeniAd('Yeni klasör');
          act('dosya.yeni-klasor', { yol: n }, (p) => ((p.fs[n] = { tur: 'klasor' }), p));
        },
      },
      {
        ad: 'Yeni metin belgesi',
        ikon: '📝',
        onClick: () => {
          const n = yeniAd('Yeni Metin Belgesi', '.txt');
          act('dosya.yeni', { yol: n }, (p) => ((p.fs[n] = { tur: 'dosya', boyut: '0 KB', icerik: '' }), p));
        },
      },
      { ayrac: true },
      { ad: 'Terminalde aç', ikon: 'logo:powershell', onClick: () => open('powershell', MASA) },
      { ayrac: true },
      { ad: 'Ekran ayarları', ikon: '🖥', onClick: () => open('ayarlar', 'ekran') },
      { ad: 'Kişiselleştir', ikon: '🖌', onClick: () => open('ayarlar', 'arkaplan') },
    ]);
  }

  function renderApp(w: Win): ReactNode {
    const ctx: AppCtx = { pc, act, log, open, close, uac, veri, learn, arg: w.arg, kopru, dosyaAc, birlikteAc, menu };
    switch (w.id) {
      case 'ayarlar':
        return <Ayarlar {...ctx} />;
      case 'gorev':
        return <GorevYoneticisi {...ctx} />;
      case 'dosya':
        return <DosyaGezgini {...ctx} />;
      case 'aygit':
        return <AygitYoneticisi {...ctx} />;
      case 'guvenlik':
        return <Guvenlik {...ctx} />;
      case 'edge':
      case 'chrome':
        return <Tarayici key={w.arg} {...ctx} chrome={w.id === 'chrome'} />;
      case 'notdefteri':
        return <NotDefteri key={w.arg} {...ctx} />;
      case 'fotograflar':
        return <Fotograflar {...ctx} />;
      case 'word':
        return <Word {...ctx} />;
      case 'cmd':
        return <Konsol ctx={ctx} kabuk="cmd" />;
      case 'powershell':
        return <Konsol ctx={ctx} kabuk="ps" />;
      case 'kurulum':
        return <Kurulum key={w.arg} {...ctx} />;
      case 'sistemkoruma':
        return <SistemKoruma {...ctx} />;
      case 'rufus':
        return <Rufus {...ctx} />;
      case 'program':
        return <Program key={w.arg?.split('|')[0]} {...ctx} />;
    }
  }

  const yeniden = (mod: 'normal' | 'guvenli' = 'normal', kapat = false) => {
    setStart(false);
    setGuc(false);
    if (kopru) {
      sim.act(kapat ? 'pc.kapat' : 'pc.yeniden-baslat', { mod }, (st) => st);
      kopru.guc(kapat ? 'kapat' : 'yeniden');
      return;
    }
    setWins([]);
    setAktif(null);
    act('pc.yeniden-baslat', { mod }, (x) => yenidenBaslat(x, mod));
  };
  if (pc.acilis === 'bsod' || pc.acilis === 'kurtarma') {
    const ctx: AppCtx = { pc, act, log, open, close, uac, veri, learn, kopru, dosyaAc, birlikteAc, menu };
    return (
      <div className="w11 w11-boot">
        <Kurtarma {...ctx} />
      </div>
    );
  }
  const guvenli = pc.acilis === 'guvenli';

  const dark = pc.ekran.tema === 'koyu';
  return (
    <div ref={kok} onContextMenu={(e) => (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('w11-icons')) && masaustuMenu(e)} onMouseDown={(e) => (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('w11-icons')) && setMasaSec(null)} className={'w11' + (dark ? ' dark' : '') + (pc.ekran.kontrast ? ' contrast' : '') + (guvenli ? ' safe' : '')} style={{ background: guvenli ? '#000' : duvarArkaPlan(pc.ekran.arkaPlan), ['--olcek' as string]: String((pc.ekran.olcek / 100) * (pc.ekran.metin / 100)) }}>
      {guvenli && (
        <>
          <span className="safe-c sc-tl">Güvenli Mod</span>
          <span className="safe-c sc-tr">Güvenli Mod</span>
          <span className="safe-c sc-bl">Güvenli Mod</span>
          <span className="safe-c sc-br">Güvenli Mod</span>
          <span className="safe-ver">Windows 11 Pro Derleme 26100</span>
        </>
      )}
      <div className="w11-icons">
        <span className="w11-icon">
          <Logo id="geridonusum" size="2.4em" />
          Geri Dönüşüm Kutusu
        </span>
        {pinned
          .filter((a) => a !== 'chrome' && a !== 'word')
          .slice(0, 3)
          .map((a) => (
            <span key={a} className="w11-icon" onDoubleClick={() => open(a)}>
              {logoVar(a) ? <Logo id={a} size="2.4em" /> : <i>{APP_INFO[a].ikon}</i>}
              {APP_INFO[a].ad}
            </span>
          ))}
        {kisayollar
          .filter((k) => k.masaustu)
          .map((k) => (
            <span
              key={k.anahtar}
              className={'w11-icon kisayol' + (masaSec === k.anahtar ? ' on' : '')}
              onClick={() => setMasaSec(k.anahtar)}
              onDoubleClick={k.ac}
              onContextMenu={(e) => (setMasaSec(k.anahtar), menu(e, [{ ad: 'Aç', kalin: true, ikon: 'logo:' + k.logo, onClick: k.ac }, { ayrac: true }, { ad: 'Özellikler', ikon: 'ⓘ', onClick: () => setMesajDlg({ baslik: `${k.ad} Özellikleri`, metin: `Tür: Kısayol · Hedef: ${k.ad}` }) }]))}
              title={k.ad}
              aria-label={`${k.ad} kısayolu`}
            >
              <Logo id={k.logo} size="2.4em" />
              {k.ad}
            </span>
          ))}
        {masaDosyalari.map((yol) => {
          const f = pc.fs[yol];
          const uz = uzanti(yol);
          const a = acicilar(pc, yol)[0];
          const logo = f.tur === 'klasor' ? 'dosya' : a ? a.logo : 'program';
          return (
            <span
              key={yol}
              className={'w11-icon dosya-ikon' + (masaSec === yol ? ' on' : '')}
              onClick={() => setMasaSec(yol)}
              onDoubleClick={() => dosyaAc(yol)}
              onContextMenu={(e) => (setMasaSec(yol), menu(e, dosyaMenusu(yol)))}
              aria-label={`Masaüstü: ${adOf(yol)}`}
              title={adOf(yol)}
            >
              {uz === 'txt' && !a ? <Logo id="notdefteri" size="2.4em" /> : <Logo id={logo} size="2.4em" />}
              {pc.explorer.uzanti || f.tur === 'klasor' ? adOf(yol) : adOf(yol).replace(/\.[^.]+$/, '')}
            </span>
          );
        })}
      </div>
      {pc.belirti.reklam && !reklamKapali && (
        <div className="w11-ad">
          <button className="ad-x" onClick={() => setReklamKapali(true)} aria-label="Reklamı kapat">
            ✕
          </button>
          <b>🎉 TEBRİKLER! Bilgisayarınız 3 virüs içeriyor!</b>
          <span>Hemen temizlemek için PC Speed Booster PRO'yu satın alın</span>
        </div>
      )}
      {wins.map((w) => (
        <div key={w.id} className={'w11-win' + (aktif === w.id ? ' on' : '') + ' app-' + w.id} onMouseDown={() => setAktif(w.id)}>
          <div className="w11-titlebar">
            <span>
              {pencere(w).logo ? (
                <Logo id={pencere(w).logo!} size="1.2em" />
              ) : (
                <i className="ti" style={{ background: APP_INFO[w.id].renk }}>
                  {APP_INFO[w.id].ikon}
                </i>
              )}
              {pencere(w).ad}
            </span>
            <span className="win11-ctrl">
              <i onClick={() => setAktif(null)}>─</i>
              <i>☐</i>
              <i className="x" onClick={() => close(w.id)} role="button" aria-label={`${pencere(w).ad} kapat`}>
                ✕
              </i>
            </span>
          </div>
          <div className="w11-winbody">{renderApp(w)}</div>
        </div>
      ))}
      {start && (
        <div className="w11-start">
          <input
            placeholder="Uygulama, ayar ve belge arayın"
            aria-label="Başlat araması"
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const q = e.currentTarget.value.trim().toLocaleLowerCase('tr');
              const hedef: AppId | null = /^(cmd|komut)/.test(q) ? 'cmd' : /^(powershell|terminal|ps)/.test(q) ? 'powershell' : /^(not|notepad)/.test(q) ? 'notdefteri' : /^(dosya|explorer|gezgin)/.test(q) ? 'dosya' : /^(ayar)/.test(q) ? 'ayarlar' : /^(görev|gorev|taskmgr)/.test(q) ? 'gorev' : null;
              if (hedef) open(hedef);
            }}
          />
          <div className="w11-start-h">Sabitlenmiş</div>
          <div className="w11-start-grid">
            {izinli
              .filter((a) => a !== 'kurulum' && a !== 'sistemkoruma' && a !== 'rufus' && (a !== 'word' || pc.kurulu.includes('office')))
              .concat(pc.kurulu.includes('chrome') && !izinli.includes('chrome') ? (['chrome'] as AppId[]) : [])
              .map((a) => (
                <button key={a} onClick={() => open(a)}>
                  <AppIkon id={a} size="2em" />
                  {APP_INFO[a].ad}
                </button>
              ))}
          </div>
          {(
            <>
              <div className="w11-start-h">Tüm uygulamalar</div>
              <div className="w11-start-tum">
                {[...kisayollar, { anahtar: 'cmd', ad: 'Komut İstemi', logo: 'cmd', ac: () => open('cmd'), masaustu: false }, { anahtar: 'powershell', ad: 'Windows PowerShell', logo: 'powershell', ac: () => open('powershell'), masaustu: false }].map((k) => (
                  <button key={k.anahtar} onClick={k.ac}>
                    <Logo id={k.logo} size="1.5em" />
                    {k.ad}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="w11-start-foot">
            <span>👤 {pc.cihaz.kullanici}</span>
            <span className="rel">
              <button className="w11-power" onClick={() => setGuc((g) => !g)} aria-label="Güç">
                ⏻
              </button>
              {guc && (
                <span className="w11-power-menu">
                  <button onClick={() => yeniden()}>↻ Yeniden başlat</button>
                  <button onClick={() => yeniden('normal', true)}>⏻ Kapat</button>
                </span>
              )}
            </span>
          </div>
        </div>
      )}
      <div className="w11-taskbar">
        <button className="tb-start" onClick={() => setStart((x) => !x)} aria-label="Başlat">
          <Logo id="windows" size="1.5em" />
        </button>
        {pinned.map((a) => (
          <button key={a} className={'tb-app' + (wins.some((w) => w.id === a) ? ' open' : '') + (aktif === a ? ' on' : '')} title={APP_INFO[a].ad} onClick={() => (wins.some((w) => w.id === a) ? setAktif(aktif === a ? null : a) : open(a))}>
            <AppIkon id={a} />
          </button>
        ))}
        {wins
          .filter((w) => !pinned.includes(w.id))
          .map((w) => (
            <button key={w.id} className={'tb-app open' + (aktif === w.id ? ' on' : '')} title={pencere(w).ad} onClick={() => setAktif(w.id)}>
              {w.id === 'program' ? <Logo id={pencere(w).logo!} /> : <AppIkon id={w.id} />}
            </button>
          ))}
        <span className="tb-tray">
          {pc.uyariSayisi > 0 && <span title="Windows Güvenliği: eylem gerekiyor">🛡⚠</span>}
          <button className="tb-net" onClick={() => setAgMenu((x) => !x)} title={pc.internet ? 'İnternet erişimi' : 'İnternet yok'} aria-label={pc.internet ? 'Ağ: bağlı' : 'Ağ: internet yok'}>
            {pc.internet ? (pc.ag?.wifi ? '📶' : '🖧') : '🌐⃠'}
          </button>
          <span>TUR</span>
          <span className="tb-clock">
            <WindowsSaat />
          </span>
        </span>
      </div>
      {agMenu && (
        <div className="w11-agmenu" role="dialog" aria-label="Ağ ve İnternet">
          <b>Ağ ve İnternet</b>
          <div className="ag-satir">
            🖧 Ethernet —{' '}
            {pc.ag?.kablo ? (pc.aygitlar.find((a) => a.id === 'lan')?.durum === 'ok' ? <span className={pc.agDurum?.ethernet?.internet ? 'ok-text' : 'err-text'}>{pc.agDurum?.ethernet?.internet ? 'Bağlı' : (pc.agDurum?.ethernet?.durum ?? 'Bağlı')}</span> : 'Bağdaştırıcı çalışmıyor') : 'Ağ kablosu takılı değil'}
            {pc.ag?.kablo && (
              <button className="ws-link small" onClick={() => (setAgMenu(false), open('ayarlar', 'ag-ethernet'))}>
                Özellikler
              </button>
            )}
          </div>
          {pc.ag?.wifi && pc.agDurum?.wifi && !pc.agDurum.wifi.internet && <div className="ag-satir err-text small">📶 {pc.ag.wifi}: {pc.agDurum.wifi.durum}</div>}
          <button className="ws-link small" onClick={() => (setAgMenu(false), open('ayarlar', 'ag'))}>
            Ağ ve İnternet ayarları
          </button>
          {pc.aygitlar.some((a) => a.id === 'wifi') ? (
            <>
              <div className="ag-h">Wi-Fi</div>
              {(veri.wifiAglari ?? []).map((w) => {
                const bagli = pc.ag?.wifi === w.ssid;
                return (
                  <div key={w.ssid} className={'ag-wifi' + (bagli ? ' bagli' : '')}>
                    <button className="ag-wifi-ad" onClick={() => (setWifiSec(wifiSec === w.ssid ? null : w.ssid), setWifiPw(''), setWifiHata(''))}>
                      📶 {w.ssid} <small>{bagli ? 'Bağlı, güvenli' : w.sifre ? 'Güvenli' : 'Açık'}</small>
                    </button>
                    {wifiSec === w.ssid &&
                      (bagli ? (
                        <button className="ws-btn" onClick={() => (act('wifi.kes', { ssid: w.ssid }, (x) => ((x.ag = { ...x.ag, wifi: '' }), x)), setWifiSec(null))}>
                          Bağlantıyı kes
                        </button>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (w.sifre && wifiPw !== w.sifre) {
                              log('wifi.hata', { ssid: w.ssid });
                              setWifiHata('Ağ güvenlik anahtarı doğru değil.');
                              return;
                            }
                            act('wifi.baglan', { ssid: w.ssid }, (x) => ((x.ag = { ...x.ag, wifi: w.ssid }), x));
                            setWifiSec(null);
                          }}
                        >
                          {w.sifre && <input type="text" data-sim-parola autoComplete="off" spellCheck={false} autoFocus value={wifiPw} onChange={(e) => setWifiPw(e.target.value)} placeholder="Ağ güvenlik anahtarını girin" aria-label="Wi-Fi şifresi" />}
                          <button className="ws-btn primary">Bağlan</button>
                          {wifiHata && <small className="err-text">{wifiHata}</small>}
                        </form>
                      ))}
                  </div>
                );
              })}
            </>
          ) : (
            <small className="muted">Bu bilgisayarda kablosuz ağ bağdaştırıcısı yok.</small>
          )}
        </div>
      )}
      {cakismaBildirim && (
        <div className="w11-bildirim" role="alert">
          <b>Windows - Sistem Hatası</b>
          <p>Windows bir IP adresi çakışması algıladı. Bu ağdaki başka bir sistem bu bilgisayarla aynı IP adresine sahip. Bu sorunu çözmek için ağ yöneticinize başvurun.</p>
          <small className="muted">{cakismaBildirim}</small>
          <div className="row">
            <button className="ws-btn primary" onClick={() => (setCakismaBildirim(null), open('ayarlar', pc.agDurum?.ethernet?.sorun === 'cakisma' ? 'ag-ethernet' : 'ag-wifi'))}>
              Ağ ayarları
            </button>
            <button className="ws-btn" onClick={() => setCakismaBildirim(null)}>
              Tamam
            </button>
          </div>
        </div>
      )}
      {menuDurum && <BaglamMenu x={menuDurum.x} y={menuDurum.y} ogeler={menuDurum.ogeler} kapat={() => setMenuDurum(null)} />}
      {birlikte && (
        <BirlikteAc
          pc={pc}
          yol={birlikte}
          kapat={() => setBirlikte(null)}
          store={() => storeAra(birlikte)}
          sec={(id, herZaman) => {
            const y = birlikte;
            setBirlikte(null);
            if (herZaman) log('dosya.varsayilan-uygulama', { uzanti: uzanti(y), uygulama: id });
            ileAc(id, y);
          }}
        />
      )}
      {mesajDlg && (
        <div className="ws-modal">
          <div className="ws-dlg">
            <div className="ws-h">{mesajDlg.baslik}</div>
            <p>{mesajDlg.metin}</p>
            <div className="ws-foot">
              <button className="ws-btn primary" onClick={() => setMesajDlg(null)}>
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
      {uacReq && (
        <div className="uac-back">
          <div className="uac">
            <div className="uac-h">Kullanıcı Hesabı Denetimi</div>
            <div className="uac-q">Bu uygulamanın cihazınızda değişiklik yapmasına izin vermek istiyor musunuz?</div>
            <div className="uac-app">
              <b>{uacReq.ad}</b>
              <small>Doğrulanmış yayımcı: {uacReq.yayinci}</small>
            </div>
            {standart ? (
              <>
                <p className="small">Devam etmek için bir yönetici kullanıcı adı ve parolası girin.</p>
                <div className="uac-user">👤 {veri.yonetici?.ad ?? 'Yönetici'}</div>
                <input type="text" data-sim-parola autoComplete="off" spellCheck={false} placeholder="Parola" value={uacPw} onChange={(e) => setUacPw(e.target.value)} aria-label="Yönetici parolası" />
                {uacErr && <small className="err-text">{uacErr}</small>}
              </>
            ) : null}
            <div className="uac-btns">
              <button
                className="primary"
                onClick={() => {
                  if (standart && uacPw !== veri.yonetici?.parola) {
                    setUacErr('Kullanıcı adı veya parola yanlış.');
                    sim.act('uac', { izin: false, standart: true }, (st) => st);
                    return;
                  }
                  sim.act('uac', { izin: true, standart }, (st) => st);
                  const ok = uacReq.ok;
                  setUacReq(null);
                  ok();
                }}
              >
                Evet
              </button>
              <button
                onClick={() => {
                  sim.act('uac', { izin: false, standart }, (st) => st);
                  setUacReq(null);
                }}
              >
                Hayır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Ayarlar ve diğer uygulamalarda kullanılan Windows 11 benzeri anahtar (toggle) */
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className={'w-toggle' + (on ? ' on' : '')}>
      <span>{on ? 'Açık' : 'Kapalı'}</span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <i />
    </label>
  );
}
