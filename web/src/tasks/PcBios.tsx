// Sanal bilgisayar: güç düğmesi → POST (zamanlı tuş penceresi) → BIOS Setup (Aptio benzeri) → önyükleme.
// İ2'nin Setup'a giriş, önyükleme sırası, sanallaştırma, BIOS güvenliği ve CMOS pili görevleri bu bileşeni kullanır.
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Photo, { photoUrl } from '../components/Photo';
import Sorular, { type Soru } from '../components/Sorular';
import { evaluate, type Rule } from '../core/rules';
import type { TaskUIProps } from './registry';

export interface Cmos {
  tarih: string; // YYYY-MM-DD
  saat: string; // HH:MM:SS
  bootOrder: string[];
  sata: 'AHCI' | 'IDE' | 'RAID';
  vt: boolean;
  ses: boolean;
  lan: boolean;
  fastBoot: boolean;
  usbBoot: boolean;
  csm: boolean;
  adminSifre: boolean;
  secureBoot: boolean;
  tpm: boolean;
}
export type Ekran = 'kapali' | 'post' | 'posthata' | 'setup' | 'bootmenu' | 'os' | 'kurulum' | 'bootfail' | 'bsod';
export interface BiosVeri {
  cmos: Cmos;
  aygitlar: { id: string; ad: string }[];
  usbTakili?: boolean;
  diskSata?: string;
  bilgi: { anakart: string; bios: string; islemci: string; bellek: string };
  postHata?: { mesaj: string; tus: string; kosul: Rule };
  donanim?: { id: string; ad: string; gorsel?: string; aciklama: string; sifirla?: Partial<Cmos> }[];
  /** Bu donanım işlemi yapılana kadar disk (SSD) bağlı değildir (ör. gevşek SATA kablosu) */
  diskYok?: string;
  sorular?: Soru[];
}
export interface BiosState {
  ekran: Ekran;
  cmos: Cmos;
  setup: Cmos | null;
  sifreDeger: string | null;
  sonAcilis: string | null;
  donanim: Record<string, boolean>;
  cevaplar: Record<string, string | string[]>;
}

export const initialPcBios = (task: { veri: unknown }): State => {
  const v = task.veri as BiosVeri;
  return { ekran: 'kapali', cmos: { ...v.cmos }, setup: null, sifreDeger: null, sonAcilis: null, donanim: {}, cevaplar: {} };
};

type Veri = BiosVeri;
type State = BiosState;

export const DEFAULTS: Partial<Cmos> = { sata: 'AHCI', vt: false, ses: true, lan: true, fastBoot: false, usbBoot: true, csm: false, secureBoot: true, tpm: true };
const TABS = ['Main', 'Advanced', 'Boot', 'Security', 'Save & Exit'] as const;
const LEGEND = ['→←: Select Screen', '↑↓: Select Item', 'Enter: Select', '+/-: Change Opt.', 'F1: General Help', 'F9: Optimized Defaults', 'F10: Save & Exit', 'ESC: Exit'];

type Item =
  | { kind: 'info'; label: string; value: string }
  | { kind: 'head'; label: string }
  | { kind: 'enum'; label: string; key: keyof Cmos; opts: { v: string | boolean; l: string }[]; help: string; tr: string }
  | { kind: 'boot'; label: string; index: number; help: string; tr: string }
  | { kind: 'date' | 'time' | 'password'; label: string; help: string; tr: string }
  | { kind: 'action'; label: string; act: 'save' | 'discard' | 'defaults'; help: string; tr: string };

const EN_DIS = [
  { v: true, l: 'Enabled' },
  { v: false, l: 'Disabled' },
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function items(tab: number, c: Cmos, v: Veri, diskVar: boolean): Item[] {
  switch (tab) {
    case 0: {
      const d = new Date(c.tarih + 'T00:00:00');
      const [y, m, dd] = c.tarih.split('-');
      return [
        { kind: 'info', label: 'BIOS Vendor', value: 'American Megatrends' },
        { kind: 'info', label: 'Project Version', value: v.bilgi.bios },
        { kind: 'info', label: 'Motherboard', value: v.bilgi.anakart },
        { kind: 'head', label: 'Processor Information' },
        { kind: 'info', label: 'Processor', value: v.bilgi.islemci },
        { kind: 'info', label: 'Total Memory', value: v.bilgi.bellek },
        { kind: 'head', label: '' },
        { kind: 'date', label: 'System Date', help: 'Set the Date. Use Tab to switch between Date elements.', tr: 'Sistem tarihi. Enter ile değiştir.' },
        { kind: 'time', label: 'System Time', help: 'Set the Time. Use Tab to switch between Time elements.', tr: 'Sistem saati. Enter ile değiştir.' },
      ].map((x) => (x.kind === 'date' ? { ...x, label: `System Date        [${DAYS[d.getDay()] ?? '???'} ${m}/${dd}/${y}]` } : x.kind === 'time' ? { ...x, label: `System Time        [${c.saat}]` } : x)) as Item[];
    }
    case 1:
      return [
        { kind: 'head', label: 'Storage Configuration' },
        { kind: 'info', label: 'SATA Port 1', value: diskVar ? 'Samsung SSD 870 EVO 500GB (500.1GB)' : 'Not Present' },
        { kind: 'info', label: 'SATA Port 2', value: 'Not Present' },
        { kind: 'enum', label: 'SATA Mode Selection', key: 'sata', opts: ['AHCI', 'IDE', 'RAID'].map((x) => ({ v: x, l: x })), help: 'Determines how SATA controller(s) operate.', tr: 'SATA denetleyicisinin çalışma modu. İşletim sistemi kurulduktan sonra değiştirilirse sistem açılmayabilir.' },
        { kind: 'head', label: 'CPU Configuration' },
        { kind: 'enum', label: 'Intel Virtualization Technology', key: 'vt', opts: EN_DIS, help: 'When enabled, a VMM can utilize the additional hardware capabilities provided by Vanderpool Technology.', tr: 'Sanallaştırma (VT-x). Sanal makine yazılımları için açılır.' },
        { kind: 'head', label: 'Onboard Devices Configuration' },
        { kind: 'enum', label: 'HD Audio Controller', key: 'ses', opts: EN_DIS, help: 'Enables or disables the onboard HD Audio controller.', tr: 'Anakart üzerindeki ses kartı.' },
        { kind: 'enum', label: 'LAN Controller', key: 'lan', opts: EN_DIS, help: 'Enables or disables the onboard LAN controller.', tr: 'Anakart üzerindeki ağ kartı.' },
      ];
    case 2:
      return [
        { kind: 'enum', label: 'Fast Boot', key: 'fastBoot', opts: EN_DIS, help: 'Enables or disables boot with initialization of a minimal set of devices.', tr: 'Hızlı açılış: bazı donanım testleri atlanır.' },
        { kind: 'enum', label: 'USB Boot', key: 'usbBoot', opts: EN_DIS, help: 'Enables or disables booting from USB storage devices.', tr: 'USB bellekten önyüklemeye izin verir.' },
        { kind: 'enum', label: 'Launch CSM', key: 'csm', opts: EN_DIS, help: 'Enables or disables the Compatibility Support Module (Legacy BIOS boot).', tr: 'Eski (Legacy/MBR) önyükleme desteği. UEFI + GPT için kapalı olmalıdır.' },
        { kind: 'head', label: 'Boot Option Priorities' },
        ...c.bootOrder.map((_, i) => ({ kind: 'boot' as const, label: `Boot Option #${i + 1}`, index: i, help: 'Sets the system boot order.', tr: 'Önyükleme sırası: bilgisayar önce #1’deki aygıttan açılmayı dener.' })),
      ];
    case 3:
      return [
        { kind: 'info', label: 'Administrator Password', value: c.adminSifre ? 'Installed' : 'Not Installed' },
        { kind: 'password', label: 'Administrator Password', help: 'Set Administrator Password', tr: 'Yönetici parolası: Setup’a girişi parolayla korur.' },
        { kind: 'head', label: '' },
        { kind: 'enum', label: 'Secure Boot', key: 'secureBoot', opts: EN_DIS, help: 'Secure Boot is activated when Platform Key (PK) is enrolled and CSM is disabled.', tr: 'Güvenli Önyükleme: yalnızca imzalı önyükleyicilere izin verir. Windows 11 için gereklidir.' },
        { kind: 'enum', label: 'Intel Platform Trust Technology (TPM 2.0)', key: 'tpm', opts: EN_DIS, help: 'Enables or disables the firmware TPM.', tr: 'TPM 2.0 güvenlik yongası. Windows 11 için gereklidir.' },
      ];
    default:
      return [
        { kind: 'action', label: 'Save Changes and Reset', act: 'save', help: 'Reset the system after saving the changes.', tr: 'Değişiklikleri kaydet ve yeniden başlat.' },
        { kind: 'action', label: 'Discard Changes and Exit', act: 'discard', help: 'Exit system setup without saving any changes.', tr: 'Değişiklikleri kaydetmeden çık.' },
        { kind: 'action', label: 'Restore Defaults', act: 'defaults', help: 'Restore/Load Default values for all the setup options.', tr: 'Tüm ayarları fabrika (optimize) varsayılanlarına döndür.' },
      ];
  }
}

const selectable = (it: Item) => it.kind !== 'info' && it.kind !== 'head';

type Popup =
  | { t: 'opts'; item: Item; opts: { v: string | boolean; l: string }[]; sel: number }
  | { t: 'confirm'; title: string; msg: string; onYes: () => void; sel: number }
  | { t: 'date' }
  | { t: 'time' }
  | { t: 'password'; mode: 'set' | 'enter' };

/** Kum havuzu gibi başka bir arayüze gömüldüğünde: yalnızca ekran çizilir, giriş yalnızca gerçek klavyeden. */
export interface BiosGomulu {
  /** Değişince POST zamanlayıcısı yeniden başlar (reset düğmesi) */
  nonce: number;
}

export default function PcBios({ task, mode, sim, gomulu }: TaskUIProps & { gomulu?: BiosGomulu }) {
  const veri = task.veri as unknown as Veri;
  const s = sim.state as State;
  const learn = mode === 'ogren';
  const ref = useRef(s);
  ref.current = s;
  const [tab, setTab] = useState(0);
  const [cur, setCur] = useState<number[]>([7, 1, 0, 1, 0]);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [postNonce, setPostNonce] = useState(0);
  const [postPct, setPostPct] = useState(0);
  const [son, setSon] = useState<string>('');
  const [bootSel, setBootSel] = useState(0);
  const postMs = mode === 'ogren' ? 7000 : mode === 'uygula' ? 4000 : 3000;

  const c = s.setup ?? s.cmos;
  const diskVar = !veri.diskYok || !!s.donanim[veri.diskYok];
  const list = useMemo(() => items(tab, c, veri, diskVar), [tab, c, veri, diskVar]);
  const ad = (id: string) => veri.aygitlar.find((a) => a.id === id)?.ad ?? id;

  // ---------- Önyükleme ----------
  const boot = useCallback(() => {
    const st = ref.current;
    let sonuc: Ekran = 'bootfail';
    let aygit = 'yok';
    for (const id of st.cmos.bootOrder) {
      if (id === 'usb') {
        if (veri.usbTakili && st.cmos.usbBoot) {
          sonuc = 'kurulum';
          aygit = id;
          break;
        }
      } else if (id === 'ssd') {
        if (veri.diskYok && !st.donanim[veri.diskYok]) continue;
        aygit = id;
        sonuc = veri.diskSata && st.cmos.sata !== veri.diskSata ? 'bsod' : 'os';
        break;
      }
    }
    sim.act('acilis', { aygit, sonuc }, (x: State) => ({ ...x, ekran: sonuc, sonAcilis: sonuc }));
  }, [sim, veri]);

  const bootAygitlari = veri.aygitlar.filter((a) => a.id !== 'ssd' || diskVar);
  const bootSec = (id: string) => {
    const st = ref.current;
    const sonuc: Ekran = id === 'usb' ? (veri.usbTakili && st.cmos.usbBoot ? 'kurulum' : 'bootfail') : id === 'ssd' ? (!diskVar ? 'bootfail' : veri.diskSata && st.cmos.sata !== veri.diskSata ? 'bsod' : 'os') : 'bootfail';
    sim.act('bootmenu.sec', { aygit: id, sonuc }, (x: State) => ({ ...x, ekran: sonuc, sonAcilis: sonuc }));
  };

  const postHataVar = useCallback(() => !!veri.postHata && evaluate(veri.postHata.kosul, { state: ref.current as never, events: [] }), [veri]);

  // POST zamanlayıcısı
  useEffect(() => {
    if (s.ekran !== 'post') return;
    setPostPct(0);
    const t0 = Date.now();
    const tick = setInterval(() => setPostPct(Math.min(100, ((Date.now() - t0) / postMs) * 100)), 100);
    const hata = postHataVar();
    const t = setTimeout(
      () => {
        if (ref.current.ekran !== 'post') return;
        if (hata) sim.act('post.hata', { mesaj: veri.postHata!.mesaj }, (x: State) => ({ ...x, ekran: 'posthata' }));
        else boot();
      },
      hata ? 1500 : postMs,
    );
    return () => {
      clearTimeout(t);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.ekran, postNonce, gomulu?.nonce]);

  const powerOn = () => {
    sim.act('pc.guc', { acik: true }, (x: State) => ({ ...x, ekran: 'post' }));
    setPostNonce((n) => n + 1);
  };
  const restart = () => {
    sim.act('pc.yenidenbaslat', {}, (x: State) => ({ ...x, ekran: 'post', setup: null }));
    setPostNonce((n) => n + 1);
  };
  const powerOff = () => sim.act('pc.guc', { acik: false }, (x: State) => ({ ...x, ekran: 'kapali', setup: null }));

  const girSetup = () => {
    if (ref.current.cmos.adminSifre) {
      setPopup({ t: 'password', mode: 'enter' });
      return;
    }
    sim.act('setup.gir', {}, (x: State) => ({ ...x, ekran: 'setup', setup: { ...x.cmos } }));
    setTab(0);
  };

  const setKey = (key: keyof Cmos, value: Cmos[keyof Cmos]) =>
    sim.act('bios.set', { anahtar: key, deger: value as never }, (x: State) => (x.setup ? { ...x, setup: { ...x.setup, [key]: value } } : x));

  const kaydet = () => {
    sim.act('bios.kaydet', {}, (x: State) => ({ ...x, cmos: x.setup ?? x.cmos, setup: null, ekran: 'post' }));
    setPopup(null);
    setPostNonce((n) => n + 1);
  };
  const iptal = () => {
    sim.act('bios.iptal', {}, (x: State) => ({ ...x, setup: null }));
    setPopup(null);
    boot();
  };
  const varsayilan = () => {
    sim.act('bios.varsayilan', {}, (x: State) => (x.setup ? { ...x, setup: { ...x.setup, ...DEFAULTS } } : x));
    setPopup(null);
  };

  const confirm = (title: string, msg: string, onYes: () => void) => setPopup({ t: 'confirm', title, msg, onYes, sel: 0 });

  const enterItem = (it: Item) => {
    if (it.kind === 'enum') setPopup({ t: 'opts', item: it, opts: it.opts, sel: Math.max(0, it.opts.findIndex((o) => o.v === c[it.key])) });
    else if (it.kind === 'boot') {
      const opts = [...veri.aygitlar.map((a) => ({ v: a.id, l: a.ad }))];
      setPopup({ t: 'opts', item: it, opts, sel: Math.max(0, opts.findIndex((o) => o.v === c.bootOrder[it.index])) });
    } else if (it.kind === 'date') setPopup({ t: 'date' });
    else if (it.kind === 'time') setPopup({ t: 'time' });
    else if (it.kind === 'password') setPopup({ t: 'password', mode: 'set' });
    else if (it.kind === 'action') {
      if (it.act === 'save') confirm('Save & Exit Setup', 'Save configuration and reset?', kaydet);
      if (it.act === 'discard') confirm('Exit Without Saving', 'Quit without saving?', iptal);
      if (it.act === 'defaults') confirm('Load Optimized Defaults', 'Load Optimized Defaults?', varsayilan);
    }
  };

  const chooseOpt = (it: Item, v: string | boolean) => {
    if (it.kind === 'enum') setKey(it.key, v as never);
    if (it.kind === 'boot') {
      // Gerçek BIOS gibi: seçilen aygıt bu sıraya gelir, eski yerindeki aygıtla yer değiştirir.
      const order = [...c.bootOrder];
      const from = order.indexOf(v as string);
      const prev = order[it.index];
      order[it.index] = v as string;
      if (from >= 0 && from !== it.index) order[from] = prev;
      setKey('bootOrder', order);
    }
    setPopup(null);
  };

  const moveSel = (d: 1 | -1) => {
    const n = list.length;
    let i = cur[tab];
    for (let k = 0; k < n; k++) {
      i = (i + d + n) % n;
      if (selectable(list[i])) break;
    }
    setCur((a) => a.map((x, j) => (j === tab ? i : x)));
  };

  // ---------- Tuşlar ----------
  const key = useCallback(
    (k: string) => {
      setSon(k);
      const st = ref.current;
      if (popup) {
        if (popup.t === 'opts') {
          if (k === 'ArrowUp' || k === 'ArrowDown') setPopup({ ...popup, sel: (popup.sel + (k === 'ArrowUp' ? -1 : 1) + popup.opts.length) % popup.opts.length });
          else if (k === 'Enter') chooseOpt(popup.item, popup.opts[popup.sel].v);
          else if (k === 'Escape') setPopup(null);
        } else if (popup.t === 'confirm') {
          if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Tab') setPopup({ ...popup, sel: popup.sel ? 0 : 1 });
          else if (k === 'Enter') popup.sel === 0 ? popup.onYes() : setPopup(null);
          else if (k === 'Escape') setPopup(null);
        } else if (k === 'Escape') setPopup(null);
        return;
      }
      if (st.ekran === 'post') {
        if (k === 'Delete' || k === 'F2') {
          sim.act('post.tus', { tus: k, basarili: true }, (x: State) => x);
          girSetup();
        } else if (k === 'F8' || k === 'F11' || k === 'F12') {
          setBootSel(0);
          sim.act('post.tus', { tus: k, basarili: true }, (x: State) => ({ ...x, ekran: 'bootmenu' }));
        } else sim.act('post.tus', { tus: k, basarili: false }, (x: State) => x);
        return;
      }
      if (st.ekran === 'bootmenu') {
        const n = bootAygitlari.length + 1;
        if (k === 'ArrowUp' || k === 'ArrowDown') setBootSel((i) => (i + (k === 'ArrowUp' ? -1 : 1) + n) % n);
        else if (k === 'Enter') {
          if (bootSel < bootAygitlari.length) bootSec(bootAygitlari[bootSel].id);
          else {
            sim.act('bootmenu.setup', {}, (x: State) => x);
            girSetup();
          }
        } else if (k === 'Escape') boot();
        return;
      }
      if (st.ekran === 'posthata') {
        if (k === veri.postHata?.tus) {
          sim.act('post.tus', { tus: k, basarili: true }, (x: State) => x);
          girSetup();
        }
        return;
      }
      if (st.ekran !== 'setup') return;
      const it = list[cur[tab]];
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        setTab((t) => (t + (k === 'ArrowLeft' ? -1 : 1) + TABS.length) % TABS.length);
      } else if (k === 'ArrowUp' || k === 'ArrowDown') moveSel(k === 'ArrowUp' ? -1 : 1);
      else if (k === 'Enter' && it && selectable(it)) enterItem(it);
      else if ((k === '+' || k === '-') && it?.kind === 'enum') {
        const i = it.opts.findIndex((o) => o.v === c[it.key]);
        const j = (i + (k === '+' ? 1 : -1) + it.opts.length) % it.opts.length;
        setKey(it.key, it.opts[j].v as never);
      } else if (k === 'F10') confirm('Save & Exit Setup', 'Save configuration and reset?', kaydet);
      else if (k === 'F9') confirm('Load Optimized Defaults', 'Load Optimized Defaults?', varsayilan);
      else if (k === 'Escape') confirm('Exit Without Saving', 'Quit without saving?', iptal);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [popup, list, cur, tab, c, bootSel, bootAygitlari],
  );

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const k = e.key === 'Del' ? 'Delete' : e.key;
      const handled = ['Delete', 'F1', 'F2', 'F8', 'F9', 'F10', 'F11', 'F12', 'Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-', 'Tab'];
      if (!handled.includes(k)) return;
      if (ref.current.ekran === 'kapali') return;
      e.preventDefault();
      key(k);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [key]);

  // ---------- Ekranlar ----------
  const curItem = list[cur[tab]];
  const help = curItem && 'help' in curItem ? curItem : null;

  function Screen() {
    switch (s.ekran) {
      case 'kapali':
        return <div className="off-text">Bilgisayar kapalı. Kasadaki güç düğmesine bas.</div>;
      case 'post':
        return (
          <div className="post">
            <div className="post-logo">
              {photoUrl('okul-logo') ? (
                <img className="post-okul" src={photoUrl('okul-logo')!} alt="Sedat Simavi Endüstri Meslek Lisesi logosu" />
              ) : (
                <span className="brand-logo big" aria-hidden>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              )}
              <span className="post-ad">
                <b>SSEML</b>
                <small>Sedat Simavi Endüstri Meslek Lisesi</small>
              </span>
            </div>
            <div className="post-msg">
              Press <b>DEL</b> or <b>F2</b> to enter UEFI BIOS setup. Press <b>F8</b> for BBS Popup (boot menu).
            </div>
            <div className="post-bar">
              <i style={{ width: postPct + '%' }} />
            </div>
          </div>
        );
      case 'posthata':
        return (
          <pre className="post-text">
            {`American Megatrends\nVersion 2.22.1287  Copyright (C) 2026 AMI\n\n${veri.bilgi.anakart}\nCPU : ${veri.bilgi.islemci}\nMemory : ${veri.bilgi.bellek}\n\n${veri.postHata?.mesaj}\n\nPress ${veri.postHata?.tus} to Run SETUP`}
          </pre>
        );
      case 'bootmenu':
        return (
          <div className="bios-popup center">
            <div className="bp-title">Please select boot device:</div>
            {bootAygitlari.map((a, i) => (
              <button key={a.id} className={'bp-opt' + (bootSel === i ? ' cur' : '')} onClick={() => bootSec(a.id)}>
                {a.ad}
              </button>
            ))}
            <button
              className={'bp-opt' + (bootSel === bootAygitlari.length ? ' cur' : '')}
              onClick={() => {
                sim.act('bootmenu.setup', {}, (x: State) => x);
                girSetup();
              }}
            >
              Enter Setup
            </button>
            <div className="bp-foot">↑ and ↓ to move selection · ENTER to select boot device · ESC to boot using defaults</div>
          </div>
        );
      case 'setup':
        return (
          <div className="bios">
            <div className="bios-title">Aptio Setup Utility – Copyright (C) 2026 American Megatrends, Inc.</div>
            <div className="bios-tabs">
              {TABS.map((t, i) => (
                <button key={t} className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>
                  {t}
                </button>
              ))}
            </div>
            <div className="bios-body">
              <div className="bios-left">
                {list.map((it, i) =>
                  it.kind === 'head' ? (
                    <div key={i} className="bh">
                      {it.label}
                    </div>
                  ) : it.kind === 'info' ? (
                    <div key={i} className="bi">
                      <span>{it.label}</span>
                      <span>{it.value}</span>
                    </div>
                  ) : (
                    <button
                      key={i}
                      className={'bi sel' + (cur[tab] === i ? ' cur' : '')}
                      onClick={() => {
                        setCur((a) => a.map((x, j) => (j === tab ? i : x)));
                        enterItem(it);
                      }}
                    >
                      <span>{it.kind === 'action' || it.kind === 'date' || it.kind === 'time' ? it.label : it.kind === 'password' ? 'Administrator Password' : it.label}</span>
                      <span>
                        {it.kind === 'enum' && `[${it.opts.find((o) => o.v === c[it.key])?.l ?? ''}]`}
                        {it.kind === 'boot' && `[${ad(c.bootOrder[it.index])}]`}
                      </span>
                    </button>
                  ),
                )}
              </div>
              <div className="bios-right">
                <div className="bios-help">
                  {help?.help}
                  {help && (
                    <p className="tr">
                      🇹🇷 {help.tr}
                    </p>
                  )}
                </div>
                <div className="bios-legend">
                  {LEGEND.map((l) => (
                    <div key={l}>{l}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bios-foot">Version 2.22.1287 Copyright (C) 2026 AMI</div>
            {popup && BiosPopup()}
          </div>
        );
      case 'os':
        return (
          <div className="w11-lock">
            <div className="clock">09:41</div>
            <div className="date">Pazartesi, 2 Mart</div>
            <div className="w11-note">Windows 11 sabit diskten açıldı.</div>
          </div>
        );
      case 'kurulum':
        return (
          <div className="w11-setup">
            <div className="dlg">
              <div className="dlg-title">Windows 11 Kurulumu</div>
              <p>Dil ayarlarınızı seçin</p>
              <p className="small">Yükleme dili: Türkçe · Saat ve para birimi: Türkçe (Türkiye) · Klavye: Türkçe Q</p>
              <span className="fake-btn">İleri</span>
            </div>
            <div className="w11-note">Bilgisayar kurulum USB'sinden açıldı.</div>
          </div>
        );
      case 'bootfail':
        return <pre className="post-text">{'Reboot and Select proper Boot device\nor Insert Boot Media in selected Boot device and press a key_'}</pre>;
      case 'bsod':
        return (
          <div className="bsod">
            <div className="sad">:(</div>
            <p>Bilgisayarınız bir sorunla karşılaştı ve yeniden başlatılması gerekiyor.</p>
            <p className="small">Durdurma kodu: INACCESSIBLE BOOT DEVICE</p>
          </div>
        );
    }
  }

  function BiosPopup() {
    const p = popup!;
    if (p.t === 'opts') {
      return (
        <div className="bios-popup">
          <div className="bp-title">{p.item.label.replace(/\s+\[.*$/, '')}</div>
          {p.opts.map((o, i) => (
            <button key={String(o.v)} className={'bp-opt' + (i === p.sel ? ' cur' : '')} onClick={() => chooseOpt(p.item, o.v)}>
              {o.l}
            </button>
          ))}
        </div>
      );
    }
    if (p.t === 'confirm') {
      return (
        <div className="bios-popup">
          <div className="bp-title">{p.title}</div>
          <p>{p.msg}</p>
          <div className="bp-yn">
            <button className={p.sel === 0 ? 'cur' : ''} onClick={p.onYes}>
              Yes
            </button>
            <button className={p.sel === 1 ? 'cur' : ''} onClick={() => setPopup(null)}>
              No
            </button>
          </div>
        </div>
      );
    }
    return (
      <FormPopup
        kind={p.t as 'date' | 'time' | 'password'}
        pwMode={p.t === 'password' ? p.mode : undefined}
        initial={p.t === 'date' ? c.tarih : p.t === 'time' ? c.saat : ''}
        onCancel={() => setPopup(null)}
        onDone={(a, b) => {
          if (p.t === 'date') {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(a)) return 'Geçersiz tarih';
            setKey('tarih', a);
          } else if (p.t === 'time') {
            const t = a.length === 5 ? a + ':00' : a;
            if (!/^\d{2}:\d{2}:\d{2}$/.test(t)) return 'Geçersiz saat';
            setKey('saat', t);
          } else if (p.t === 'password' && p.mode === 'set') {
            if (a.length < 3) return 'En az 3 karakter';
            if (a !== b) return 'Parolalar aynı değil';
            sim.act('bios.set', { anahtar: 'adminSifre', deger: true }, (x: State) => (x.setup ? { ...x, setup: { ...x.setup, adminSifre: true }, sifreDeger: a } : x));
          } else if (p.t === 'password' && p.mode === 'enter') {
            if (a !== ref.current.sifreDeger) {
              sim.act('setup.sifre', { dogru: false }, (x: State) => x);
              return 'Invalid Password';
            }
            sim.act('setup.sifre', { dogru: true }, (x: State) => x);
            sim.act('setup.gir', {}, (x: State) => ({ ...x, ekran: 'setup', setup: { ...x.cmos } }));
            setTab(0);
          }
          setPopup(null);
          return null;
        }}
      />
    );
  }

  const KEYS: [string, string][] = [
    ['Escape', 'Esc'],
    ['F1', 'F1'],
    ['F2', 'F2'],
    ['F8', 'F8'],
    ['F9', 'F9'],
    ['F10', 'F10'],
    ['F12', 'F12'],
    ['Delete', 'Del'],
    ['ArrowLeft', '←'],
    ['ArrowUp', '↑'],
    ['ArrowDown', '↓'],
    ['ArrowRight', '→'],
    ['-', '−'],
    ['+', '+'],
    ['Enter', 'Enter ↵'],
  ];

  if (gomulu)
    return (
      <div className={'screen-fill yalniz-klavye' + (s.ekran === 'kapali' ? '' : ' on')}>
        {s.ekran !== 'kapali' && Screen()}
        {popup && s.ekran !== 'setup' && BiosPopup()}
      </div>
    );

  return (
    <div className="pc">
      <div className="pc-main">
        <div className="monitor-css">
          <div className={'screen ' + (s.ekran === 'kapali' ? '' : 'on')}>
            {Screen()}
            {popup && s.ekran !== 'setup' && BiosPopup()}
          </div>
        </div>
        <div className="pc-keys" aria-label="Ekran klavyesi">
          {KEYS.map(([k, l]) => (
            <button key={k} className={'kbd' + (son === k ? ' last' : '')} onClick={() => s.ekran !== 'kapali' && key(k)}>
              {l}
            </button>
          ))}
        </div>
        <p className="small muted">Bilgisayar klavyesini de kullanabilirsin (Del, F2, F8, F10, Esc, yön tuşları, Enter, +/−). Ayarlar fareyle de seçilebilir.</p>
      </div>
      <aside className="pc-side">
        <div className="pc-case">
          <div className="pc-case-title">Kasa (ön panel)</div>
          <button className={'power ' + (s.ekran !== 'kapali' ? 'on' : '')} onClick={() => (s.ekran === 'kapali' ? powerOn() : restart())} title={s.ekran === 'kapali' ? 'Güç düğmesi' : 'Yeniden başlat (Reset)'}>
            ⏻
          </button>
          <small>{s.ekran === 'kapali' ? 'Güç düğmesi' : 'Reset (yeniden başlat)'}</small>
          {s.ekran !== 'kapali' && (
            <button className="btn" onClick={powerOff}>
              Kapat (güç düğmesine 5 sn bas)
            </button>
          )}
          {veri.usbTakili && <div className="usb-in">🔌 Kurulum USB'si takılı</div>}
        </div>
        {veri.donanim?.map((d) => (
          <div key={d.id} className="card pc-hw">
            {d.gorsel && <Photo name={d.gorsel} alt={d.ad} className="pc-hw-img" fallback={null} />}
            <p className="small">{d.aciklama}</p>
            <button
              className="btn"
              disabled={s.ekran !== 'kapali' || s.donanim[d.id]}
              onClick={() => sim.act('donanim.' + d.id, {}, (x: State) => ({ ...x, cmos: { ...x.cmos, ...(d.sifirla ?? {}) }, donanim: { ...x.donanim, [d.id]: true } }))}
              title={s.ekran !== 'kapali' ? 'Önce bilgisayarı kapat' : ''}
            >
              {s.donanim[d.id] ? '✔ ' : ''}
              {d.ad}
            </button>
            {s.ekran !== 'kapali' && !s.donanim[d.id] && <small className="muted">Donanım işlemi için önce bilgisayarı kapat.</small>}
          </div>
        ))}
        {learn && (
          <div className="card small">
            <b>Kaydedilmiş BIOS ayarları</b>
            <div>Önyükleme sırası:</div>
            <ol className="boot-list">
              {s.cmos.bootOrder.map((x) => (
                <li key={x}>{ad(x).split(/[(,]/)[0].trim()}</li>
              ))}
            </ol>
            <div>
              SATA: {s.cmos.sata} · VT: {s.cmos.vt ? 'açık' : 'kapalı'} · USB boot: {s.cmos.usbBoot ? 'açık' : 'kapalı'} · Parola: {s.cmos.adminSifre ? 'var' : 'yok'}
            </div>
            <div>
              Tarih: {s.cmos.tarih} {s.cmos.saat}
            </div>
            {s.setup && <div className="err-text">Setup'ta kaydedilmemiş değişiklikler olabilir — F10 ile kaydet.</div>}
          </div>
        )}
        {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
      </aside>
    </div>
  );
}

function FormPopup({ kind, pwMode, initial, onDone, onCancel }: { kind: 'date' | 'time' | 'password'; pwMode?: 'set' | 'enter'; initial: string; onDone: (a: string, b: string) => string | null; onCancel: () => void }) {
  const [a, setA] = useState(initial);
  const [b, setB] = useState('');
  const [err, setErr] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = onDone(a, b);
    if (r) setErr(r);
  };
  const title = kind === 'date' ? 'System Date' : kind === 'time' ? 'System Time' : pwMode === 'set' ? 'Create New Password' : 'Enter Password';
  return (
    <form className="bios-popup" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div className="bp-title">{title}</div>
      {kind === 'date' && <input type="date" value={a} onChange={(e) => setA(e.target.value)} autoFocus aria-label="Tarih" />}
      {kind === 'time' && <input type="time" step={1} value={a} onChange={(e) => setA(e.target.value)} autoFocus aria-label="Saat" />}
      {kind === 'password' && <input type="password" value={a} onChange={(e) => setA(e.target.value)} autoFocus placeholder="Password" aria-label="Parola" />}
      {kind === 'password' && pwMode === 'set' && <input type="password" value={b} onChange={(e) => setB(e.target.value)} placeholder="Confirm New Password" aria-label="Parola tekrar" />}
      {err && <div className="bp-err">{err}</div>}
      <div className="bp-yn">
        <button type="submit" className="cur">
          OK
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
