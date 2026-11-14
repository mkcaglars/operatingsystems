// Kum havuzunda kurulu Ubuntu: giriş ekranı (parola gerçek klavyeden), üst çubuk, dock, masaüstü ve pencereler
// (Firefox, Dosyalar, Terminal, Metin Düzenleyici, Ayarlar).
// Ayrıca GRUB önyükleme menüsü: ↑ ↓ ile seçim, Enter ile başlatma, 10 sn sonra varsayılan.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Logo from './Logo';
import { photoUrl } from './Photo';
import { UbuntuSaat } from './Saat';
import Terminal from './Terminal';
import type { Sim } from '../core/sim';
import { dugum, evKlasoru, type FsNode, type ShellState } from '../core/shell';
import type { Json } from '../core/rules';
import { BaslangicDiski, Dosyalar, Firefox, MetinDuzenleyici, UbuntuAyarlar, type UbAg, type UbApp, type UbCtx, type UbUsb } from './UbuntuUygulamalar';
import type { AgTur, IpAyar } from '../core/ag';

interface Props {
  hesap: { ad: string; kullanici: string; bilgisayar: string; parola: string };
  wifi: string;
  sim: Sim<{ sh: ShellState }>;
  guc: (t: 'kapat' | 'yeniden') => void;
  log: (type: string, data?: Record<string, Json>) => void;
  wifiBaglan?: (ag: string) => void;
  usb?: UbUsb[];
  usbYaz?: (id: string, iso: string) => void;
  kablo?: boolean;
  ag?: UbAg;
  ipAyar?: Partial<Record<AgTur, IpAyar>>;
  ipKaydet?: (tur: AgTur, ayar: IpAyar) => void;
}

export function UbuntuMasaustu(props: Props) {
  const { hesap, log, wifi, kablo } = props;
  const [girdi, setGirdi] = useState(false);
  const [pw, setPw] = useState('');
  const [hata, setHata] = useState('');

  const giris = (e: FormEvent) => {
    e.preventDefault();
    if (hesap.parola ? pw !== hesap.parola : !pw) {
      setHata('Üzgünüz, bu işe yaramadı. Lütfen yeniden deneyin.');
      setPw('');
      log('ubuntu.giris-hata');
      return;
    }
    log('ubuntu.giris');
    setGirdi(true);
  };

  if (!girdi)
    return (
      <div className="ubx-login" style={photoUrl('os-ubuntu-giris') ? { background: `center / cover url(${photoUrl('os-ubuntu-giris')})` } : undefined}>
        <div className="ubx-top">
          <span />
          <UbuntuSaat />
          <span>{kablo ? '🖧' : wifi ? '📶' : '🌐'} 🔊 ⏻</span>
        </div>
        <form className="ubx-login-box" onSubmit={giris}>
          <div className="ubx-avatar">{(hesap.ad || hesap.kullanici).slice(0, 1).toUpperCase()}</div>
          <b>{hesap.ad || hesap.kullanici}</b>
          <input type="password" autoFocus value={pw} onChange={(e) => (setPw(e.target.value), setHata(''))} placeholder="Parola" aria-label="Ubuntu parolası" />
          {hata && <small className="ubx-err">{hata}</small>}
        </form>
        <div className="ubx-logo">
          <Logo id="ubuntu" size="1.6em" /> ubuntu
        </div>
      </div>
    );

  return <UbuntuOturum {...props} />;
}

type Pencere = { id: number; app: UbApp; arg?: string; x: number; y: number; buyuk: boolean; kucuk: boolean };
const UYG: Record<UbApp, { ad: string; logo: string; w: number; h: number }> = {
  firefox: { ad: 'Firefox', logo: 'firefox', w: 78, h: 80 },
  dosyalar: { ad: 'Dosyalar', logo: 'nautilus', w: 66, h: 70 },
  terminal: { ad: 'Terminal', logo: 'terminal', w: 62, h: 62 },
  gedit: { ad: 'Metin Düzenleyici', logo: 'gedit', w: 56, h: 64 },
  ayarlar: { ad: 'Ayarlar', logo: 'ub-ayarlar', w: 60, h: 66 },
  usbyazici: { ad: 'Başlangıç Diski Oluşturucu', logo: 'usb-creator', w: 58, h: 78 },
};
const TUM: UbApp[] = ['firefox', 'dosyalar', 'terminal', 'gedit', 'ayarlar', 'usbyazici'];
const DOCK: UbApp[] = ['firefox', 'dosyalar', 'terminal', 'gedit', 'ayarlar'];

function UbuntuOturum({ hesap, wifi, sim, guc, log, wifiBaglan, usb, usbYaz, kablo, ag, ipAyar, ipKaydet }: Props) {
  const sh = sim.state.sh;
  const ev = evKlasoru(sh);
  const [wins, setWins] = useState<Pencere[]>([]);
  const [sira, setSira] = useState<number[]>([]);
  const [menu, setMenu] = useState(false);
  const [izgara, setIzgara] = useState(false);
  const [not, setNot] = useState('');
  const sayac = useRef(1);
  const alan = useRef<HTMLDivElement>(null);
  const surukle = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const [masaSec, setMasaSec] = useState<string | null>(null);

  const cakisma = ag?.ethernet?.sorun === 'cakisma' ? ag.ethernet.aciklama : ag?.wifi?.sorun === 'cakisma' ? ag.wifi.aciklama : null;
  useEffect(() => {
    if (cakisma) setNot(`Bağlantı başarısız — ${cakisma} Ağ bağlantısı etkinleştirilemedi.`);
  }, [cakisma]);
  useEffect(() => {
    if (!not) return;
    const t = setTimeout(() => setNot(''), 6000);
    return () => clearTimeout(t);
  }, [not]);

  const one = (id: number) => setSira((s) => [...s.filter((x) => x !== id), id]);
  const ac = (app: UbApp, arg?: string) => {
    setIzgara(false);
    // Terminal, Ayarlar ve Firefox tek pencere; Dosyalar ve Metin Düzenleyici çoklu
    const var_ = wins.find((w) => w.app === app && (app === 'terminal' || app === 'ayarlar' || app === 'firefox' || app === 'usbyazici' || (arg !== undefined && w.arg === arg)));
    if (var_) {
      setWins((l) => l.map((w) => (w.id === var_.id ? { ...w, kucuk: false } : w)));
      one(var_.id);
      return;
    }
    const id = sayac.current++;
    const n = wins.length;
    setWins((l) => [...l, { id, app, arg, x: 7 + ((n * 3) % 15), y: 5 + ((n * 4) % 16), buyuk: false, kucuk: false }]);
    one(id);
    log('ubuntu.uygulama-ac', { uygulama: app });
  };
  const kapat = (id: number) => {
    setWins((l) => l.filter((w) => w.id !== id));
    setSira((s) => s.filter((x) => x !== id));
  };
  const dockTik = (app: UbApp) => {
    const acik = wins.filter((w) => w.app === app);
    if (!acik.length) return ac(app);
    const ust = sira[sira.length - 1];
    const hedef = acik[acik.length - 1];
    if (hedef.id === ust && !hedef.kucuk) setWins((l) => l.map((w) => (w.id === hedef.id ? { ...w, kucuk: true } : w)));
    else {
      setWins((l) => l.map((w) => (w.app === app ? { ...w, kucuk: false } : w)));
      one(hedef.id);
    }
  };
  const tasi = (e: PointerEvent) => {
    const d = surukle.current;
    const r = alan.current?.getBoundingClientRect();
    if (!d || !r) return;
    const x = Math.max(-20, Math.min(90, ((e.clientX - r.left - d.dx) / r.width) * 100));
    const y = Math.max(0, Math.min(85, ((e.clientY - r.top - d.dy) / r.height) * 100));
    setWins((l) => l.map((w) => (w.id === d.id ? { ...w, x, y } : w)));
  };
  useEffect(() => {
    const bitir = () => (surukle.current = null);
    window.addEventListener('pointermove', tasi);
    window.addEventListener('pointerup', bitir);
    return () => {
      window.removeEventListener('pointermove', tasi);
      window.removeEventListener('pointerup', bitir);
    };
  });

  const masaYol = `${ev}/Masaüstü`;
  const masa = dugum(sh, masaYol);
  const masaOgeleri = masa?.t === 'd' ? Object.entries(masa.c).filter(([a]) => !a.startsWith('.')) : [];
  const masaAc = (a: string, n: FsNode) => {
    const p = `${masaYol}/${a}`;
    if (n.t === 'd') ac('dosyalar', p);
    else if (n.v.startsWith('\u0000')) setNot(`"${a}" dosyasını açacak uygulama yok.`);
    else ac('gedit', p);
  };
  const ust = sira[sira.length - 1];

  return (
    <div className="ubx" style={photoUrl('os-ubuntu-duvar') ? { background: `center / cover url(${photoUrl('os-ubuntu-duvar')})` } : undefined}>
      <div className="ubx-top">
        <button className="ubx-tray" onClick={() => setIzgara((g) => !g)}>
          Etkinlikler
        </button>
        <UbuntuSaat />
        <span className="rel">
          <button className="ubx-tray" onClick={() => setMenu((m) => !m)} aria-label="Sistem menüsü">
            {kablo ? '🖧' : wifi ? '📶' : '🌐'}{ag && !ag.internet && (kablo || wifi) ? '?' : ''} 🔊 ⏻ ▾
          </button>
          {menu && (
            <span className="ubx-menu">
              {kablo && <span className="small">🖧 Kablolu: {ag?.ethernet?.internet ? 'Bağlı' : ag?.ethernet?.sorun === 'cakisma' ? 'Bağlantı başarısız (IP çakışması)' : 'Bağlı, internet yok'}</span>}
              <span className="small">{wifi ? `📶 Wi-Fi: ${wifi}${ag?.wifi && !ag.wifi.internet ? ' (internet yok)' : ''}` : kablo ? '📶 Wi-Fi: bağlı değil' : 'Ağ bağlantısı yok'}</span>
              <button onClick={() => (setMenu(false), ac('ayarlar', 'ag'))}>🖧 Ağ Ayarları</button>
              <button onClick={() => (setMenu(false), ac('ayarlar'))}>⚙ Ayarlar</button>
              <button onClick={() => (log('ubuntu.yeniden'), guc('yeniden'))}>Yeniden Başlat…</button>
              <button onClick={() => (log('ubuntu.kapat'), guc('kapat'))}>Kapat…</button>
            </span>
          )}
        </span>
      </div>
      <div className="ubx-dock">
        {DOCK.map((a) => (
          <button key={a} className={'ubx-app' + (wins.some((w) => w.app === a) ? ' on' : '')} title={UYG[a].ad} aria-label={UYG[a].ad} onClick={() => dockTik(a)}>
            <Logo id={UYG[a].logo} size="2em" />
          </button>
        ))}
        <button className="ubx-grid" onClick={() => setIzgara((g) => !g)} aria-label="Uygulamaları göster">
          ⋮⋮⋮
        </button>
      </div>
      <div className="ubx-alan" ref={alan} onClick={() => setMasaSec(null)}>
        <div className="ubx-masa">
          {[['Ev', '__ev'] as const, ...masaOgeleri.map(([a]) => [a, a] as const)].map(([a, k]) => {
            const n = k === '__ev' ? null : masa?.t === 'd' ? masa.c[k] : null;
            return (
              <button
                key={k}
                className={'ubx-masa-oge' + (masaSec === k ? ' on' : '')}
                aria-label={`Masaüstü: ${a}`}
                onClick={(e) => (e.stopPropagation(), setMasaSec(k))}
                onDoubleClick={() => (k === '__ev' ? ac('dosyalar', ev) : n && masaAc(k, n))}
              >
                <span className="ubx-masa-ik">{k === '__ev' ? '🏠' : n?.t === 'd' ? '📁' : '📄'}</span>
                <span>{a}</span>
              </button>
            );
          })}
        </div>
        <div className="ubx-wall">
          <Logo id="ubuntu" size="5em" />
        </div>
        {wins.map((w) => {
          const u = UYG[w.app];
          const ctx: UbCtx = { sim, wifi, wifiBaglan, usb, usbYaz, kablo, ag, ipAyar, ipKaydet, parola: hesap.parola || undefined, ac, kapat: () => kapat(w.id), log, bildir: setNot, arg: w.arg };
          const baslik = w.app === 'gedit' || w.app === 'dosyalar' ? (w.arg ? `${w.arg.slice(w.arg.lastIndexOf('/') + 1)} — ${u.ad}` : u.ad) : w.app === 'terminal' ? `${sh.user}@${sh.host}: ${sh.cwd.replace(ev, '~')}` : u.ad;
          return (
            <div
              key={w.id}
              className={'ubw ubw-' + w.app + (w.id === ust ? ' on' : '') + (w.buyuk ? ' buyuk' : '')}
              style={{ display: w.kucuk ? 'none' : undefined, zIndex: 10 + sira.indexOf(w.id), ...(w.buyuk ? {} : { left: `${w.x}%`, top: `${w.y}%`, width: `${u.w}%`, height: `${u.h}%` }) }}
              onPointerDown={() => one(w.id)}
              role="dialog"
              aria-label={u.ad}
            >
              <div
                className="ubw-bas"
                onDoubleClick={() => setWins((l) => l.map((x) => (x.id === w.id ? { ...x, buyuk: !x.buyuk } : x)))}
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest('button') || w.buyuk) return;
                  const r = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                  surukle.current = { id: w.id, dx: e.clientX - r.left, dy: e.clientY - r.top };
                }}
              >
                <span className="ubw-ad">
                  <Logo id={u.logo} size="1.1em" /> {baslik}
                </span>
                <span className="ubw-dugme">
                  <button onClick={() => setWins((l) => l.map((x) => (x.id === w.id ? { ...x, kucuk: true } : x)))} aria-label="Simge durumuna küçült">
                    –
                  </button>
                  <button onClick={() => setWins((l) => l.map((x) => (x.id === w.id ? { ...x, buyuk: !x.buyuk } : x)))} aria-label="Büyüt">
                    □
                  </button>
                  <button className="x" onClick={() => kapat(w.id)} aria-label="Kapat">
                    ✕
                  </button>
                </span>
              </div>
              <div className="ubw-icerik">
                {w.app === 'terminal' ? (
                  <Terminal sim={sim} />
                ) : w.app === 'dosyalar' ? (
                  <Dosyalar {...ctx} />
                ) : w.app === 'firefox' ? (
                  <Firefox {...ctx} />
                ) : w.app === 'gedit' ? (
                  <MetinDuzenleyici {...ctx} />
                ) : w.app === 'usbyazici' ? (
                  <BaslangicDiski {...ctx} />
                ) : (
                  <UbuntuAyarlar {...ctx} />
                )}
              </div>
            </div>
          );
        })}
        {izgara && (
          <div className="ubx-izgara" onClick={() => setIzgara(false)}>
            {TUM.map((a) => (
              <button key={a} onClick={(e) => (e.stopPropagation(), ac(a))}>
                <Logo id={UYG[a].logo} size="3em" />
                {UYG[a].ad}
              </button>
            ))}
          </div>
        )}
      </div>
      {not && (
        <div className="ubx-toast" role="status" onClick={() => setNot('')}>
          {not}
        </div>
      )}
    </div>
  );
}

export function GrubMenu({ windows, sec, log }: { windows: boolean; sec: (hedef: 'ubuntu' | 'windows' | 'uefi') => void; log: (t: string) => void }) {
  const secenekler: { ad: string; hedef: 'ubuntu' | 'windows' | 'uefi' | null }[] = [
    { ad: 'Ubuntu', hedef: 'ubuntu' },
    { ad: 'Advanced options for Ubuntu', hedef: null },
    ...(windows ? [{ ad: 'Windows Boot Manager (on /dev/sda2)', hedef: 'windows' as const }] : []),
    { ad: 'UEFI Firmware Settings', hedef: 'uefi' },
  ];
  const [i, setI] = useState(0);
  const [sn, setSn] = useState<number | null>(10);
  useEffect(() => {
    if (sn === null) return;
    if (sn <= 0) {
      sec('ubuntu');
      return;
    }
    const t = setTimeout(() => setSn(sn - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sn]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) return;
      e.preventDefault();
      setSn(null);
      if (e.key === 'ArrowUp') setI((x) => (x + secenekler.length - 1) % secenekler.length);
      else if (e.key === 'ArrowDown') setI((x) => (x + 1) % secenekler.length);
      else {
        const h = secenekler[i].hedef;
        if (h) sec(h);
        else log('grub.gelismis');
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });
  return (
    <div className="grub yalniz-klavye">
      <div className="grub-title">GNU GRUB version 2.12</div>
      <div className="grub-box">
        {secenekler.map((g, j) => (
          <div key={g.ad} className={'grub-row' + (j === i ? ' on' : '')}>
            {j === i ? '*' : ' '}
            {g.ad}
          </div>
        ))}
      </div>
      <div className="grub-help">
        Use the ↑ and ↓ keys to select which entry is highlighted.
        <br />
        Press enter to boot the selected OS, `e' to edit the commands before booting or `c' for a command-line.
        {sn !== null && (
          <>
            <br />
            The highlighted entry will be executed automatically in {sn}s.
          </>
        )}
      </div>
    </div>
  );
}
