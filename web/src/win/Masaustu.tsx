// Sanal Windows 11 masaüstü: görev çubuğu, başlat menüsü, pencereler, UAC (Kullanıcı Hesabı Denetimi).
// Uygulamalar win/ altında; hepsi sim durumundaki "pc" (WinPc) üzerinde çalışır.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Json } from '../core/rules';
import type { Sim } from '../core/sim';
import { derive, yenidenBaslat, type WinPc } from '../core/winpc';
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
import SistemKoruma from './SistemKoruma';

export type AppId = 'ayarlar' | 'gorev' | 'dosya' | 'aygit' | 'guvenlik' | 'edge' | 'chrome' | 'word' | 'kurulum' | 'sistemkoruma' | 'rufus' | 'program';

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
};

/** Pencere başlığı ve simgesi ("program" penceresinde kurulu programın kendisi) */
function pencere(w: { id: AppId; arg?: string }): { ad: string; logo: string | null } {
  if (w.id === 'program') {
    const [taban, dosya] = (w.arg ?? '').split('|');
    const ad = PROGRAM_AD[taban] ?? taban ?? 'Program';
    return { ad: dosya ? `${dosya.slice(dosya.lastIndexOf('/') + 1)} - ${ad}` : ad, logo: uygulamaLogo(taban) };
  }
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
  const [agMenu, setAgMenu] = useState(false);
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

  function renderApp(w: Win): ReactNode {
    const ctx: AppCtx = { pc, act, log, open, close, uac, veri, learn, arg: w.arg, kopru };
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
        return <Tarayici {...ctx} chrome={w.id === 'chrome'} />;
      case 'word':
        return <Word {...ctx} />;
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
    const ctx: AppCtx = { pc, act, log, open, close, uac, veri, learn, kopru };
    return (
      <div className="w11 w11-boot">
        <Kurtarma {...ctx} />
      </div>
    );
  }
  const guvenli = pc.acilis === 'guvenli';

  const dark = pc.ekran.tema === 'koyu';
  return (
    <div className={'w11' + (dark ? ' dark' : '') + (pc.ekran.kontrast ? ' contrast' : '') + (guvenli ? ' safe' : '')} style={{ background: guvenli ? '#000' : duvarArkaPlan(pc.ekran.arkaPlan), ['--olcek' as string]: String((pc.ekran.olcek / 100) * (pc.ekran.metin / 100)) }}>
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
            <span key={k.anahtar} className="w11-icon kisayol" onDoubleClick={k.ac} title={k.ad} aria-label={`${k.ad} kısayolu`}>
              <Logo id={k.logo} size="2.4em" />
              {k.ad}
            </span>
          ))}
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
          <input placeholder="Uygulama, ayar ve belge arayın" aria-label="Başlat araması" />
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
          {kisayollar.length > 0 && (
            <>
              <div className="w11-start-h">Tüm uygulamalar</div>
              <div className="w11-start-tum">
                {kisayollar.map((k) => (
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
            🖧 Ethernet — {pc.ag?.kablo ? (pc.aygitlar.find((a) => a.id === 'lan')?.durum === 'ok' ? 'Bağlı' : 'Bağdaştırıcı çalışmıyor') : 'Ağ kablosu takılı değil'}
          </div>
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
                          {w.sifre && <input type="password" autoFocus value={wifiPw} onChange={(e) => setWifiPw(e.target.value)} placeholder="Ağ güvenlik anahtarını girin" aria-label="Wi-Fi şifresi" />}
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
                <input type="password" placeholder="Parola" value={uacPw} onChange={(e) => setUacPw(e.target.value)} aria-label="Yönetici parolası" />
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
