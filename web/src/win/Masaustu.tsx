// Sanal Windows 11 masaüstü: görev çubuğu, başlat menüsü, pencereler, UAC (Kullanıcı Hesabı Denetimi).
// Uygulamalar win/ altında; hepsi sim durumundaki "pc" (WinPc) üzerinde çalışır.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Json } from '../core/rules';
import type { Sim } from '../core/sim';
import { derive, yenidenBaslat, type WinPc } from '../core/winpc';
import Kurtarma from './Kurtarma';
import Ayarlar from './Ayarlar';
import GorevYoneticisi from './GorevYoneticisi';
import DosyaGezgini from './DosyaGezgini';
import AygitYoneticisi from './AygitYoneticisi';
import Guvenlik from './Guvenlik';
import Tarayici from './Tarayici';
import Kurulum from './Kurulum';
import Word from './Word';
import SistemKoruma from './SistemKoruma';

export type AppId = 'ayarlar' | 'gorev' | 'dosya' | 'aygit' | 'guvenlik' | 'edge' | 'chrome' | 'word' | 'kurulum' | 'sistemkoruma';

export interface WinVeri {
  uygulamalar?: AppId[];
  /** Standart kullanıcıyken UAC'de istenen yönetici hesabı */
  yonetici?: { ad: string; parola: string };
  surucuKlasorleri?: { id: string; ad: string }[];
  officeAnahtar?: string;
  adobeHesap?: { eposta: string; parola: string };
  baslangicUygulama?: AppId;
  baslangicSayfa?: string;
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
};

type Win = { id: AppId; arg?: string };

export default function Masaustu({ sim, veri, learn }: { sim: Sim<{ pc: WinPc }>; veri: WinVeri; learn: boolean }) {
  const pc = sim.state.pc;
  const [wins, setWins] = useState<Win[]>(veri.baslangicUygulama ? [{ id: veri.baslangicUygulama, arg: veri.baslangicSayfa }] : []);
  const [aktif, setAktif] = useState<AppId | null>(veri.baslangicUygulama ?? null);
  const [start, setStart] = useState(false);
  const [guc, setGuc] = useState(false);
  const [reklamKapali, setReklamKapali] = useState(false);
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
  const pinned: AppId[] = izinli.filter((a) => a !== 'kurulum' && a !== 'sistemkoruma' && a !== 'word');
  if (pc.kurulu.includes('chrome') && !pinned.includes('chrome')) pinned.push('chrome');
  if (pc.kurulu.includes('office') && !pinned.includes('word')) pinned.push('word');

  function renderApp(w: Win): ReactNode {
    const ctx: AppCtx = { pc, act, log, open, close, uac, veri, learn, arg: w.arg };
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
    }
  }

  const yeniden = (mod: 'normal' | 'guvenli' = 'normal') => {
    setStart(false);
    setGuc(false);
    setWins([]);
    setAktif(null);
    act('pc.yeniden-baslat', { mod }, (x) => yenidenBaslat(x, mod));
  };
  if (pc.acilis === 'bsod' || pc.acilis === 'kurtarma') {
    const ctx: AppCtx = { pc, act, log, open, close, uac, veri, learn };
    return (
      <div className="w11 w11-boot">
        <Kurtarma {...ctx} />
      </div>
    );
  }
  const guvenli = pc.acilis === 'guvenli';

  const duvar = { bloom: 'radial-gradient(ellipse at 40% 60%, #4a8df5, #1c4fa8 55%, #0d2a63)', girne: 'linear-gradient(180deg,#f59e0b 0%,#fb7185 35%,#1e3a8a 75%)', karpaz: 'linear-gradient(180deg,#7dd3fc 0%,#22d3ee 45%,#fde68a 75%)', soyut: 'linear-gradient(135deg,#4c1d95,#1e3a8a 50%,#0f766e)' } as Record<string, string>;
  const dark = pc.ekran.tema === 'koyu';
  return (
    <div className={'w11' + (dark ? ' dark' : '') + (pc.ekran.kontrast ? ' contrast' : '') + (guvenli ? ' safe' : '')} style={{ background: guvenli ? '#000' : (duvar[pc.ekran.arkaPlan] ?? duvar.bloom), ['--olcek' as string]: String((pc.ekran.olcek / 100) * (pc.ekran.metin / 100)) }}>
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
          <i>🗑</i>Geri Dönüşüm Kutusu
        </span>
        {pinned.slice(0, 3).map((a) => (
          <span key={a} className="w11-icon" onDoubleClick={() => open(a)}>
            <i>{APP_INFO[a].ikon}</i>
            {APP_INFO[a].ad}
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
              <i className="ti" style={{ background: APP_INFO[w.id].renk }}>
                {APP_INFO[w.id].ikon}
              </i>
              {APP_INFO[w.id].ad}
            </span>
            <span className="win11-ctrl">
              <i onClick={() => setAktif(null)}>─</i>
              <i>☐</i>
              <i className="x" onClick={() => close(w.id)} role="button" aria-label={`${APP_INFO[w.id].ad} kapat`}>
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
              .filter((a) => a !== 'kurulum' && a !== 'sistemkoruma' && (a !== 'word' || pc.kurulu.includes('office')))
              .concat(pc.kurulu.includes('chrome') && !izinli.includes('chrome') ? (['chrome'] as AppId[]) : [])
              .map((a) => (
                <button key={a} onClick={() => open(a)}>
                  <i style={{ background: APP_INFO[a].renk }}>{APP_INFO[a].ikon}</i>
                  {APP_INFO[a].ad}
                </button>
              ))}
          </div>
          <div className="w11-start-foot">
            <span>👤 {pc.cihaz.kullanici}</span>
            <span className="rel">
              <button className="w11-power" onClick={() => setGuc((g) => !g)} aria-label="Güç">
                ⏻
              </button>
              {guc && (
                <span className="w11-power-menu">
                  <button onClick={() => yeniden()}>↻ Yeniden başlat</button>
                  <button onClick={() => yeniden()}>⏻ Kapat</button>
                </span>
              )}
            </span>
          </div>
        </div>
      )}
      <div className="w11-taskbar">
        <button className="tb-start" onClick={() => setStart((x) => !x)} aria-label="Başlat">
          <span className="win-logo" />
        </button>
        {pinned.map((a) => (
          <button key={a} className={'tb-app' + (wins.some((w) => w.id === a) ? ' open' : '') + (aktif === a ? ' on' : '')} title={APP_INFO[a].ad} onClick={() => (wins.some((w) => w.id === a) ? setAktif(aktif === a ? null : a) : open(a))}>
            <i style={{ background: APP_INFO[a].renk }}>{APP_INFO[a].ikon}</i>
          </button>
        ))}
        {wins
          .filter((w) => !pinned.includes(w.id))
          .map((w) => (
            <button key={w.id} className={'tb-app open' + (aktif === w.id ? ' on' : '')} title={APP_INFO[w.id].ad} onClick={() => setAktif(w.id)}>
              <i style={{ background: APP_INFO[w.id].renk }}>{APP_INFO[w.id].ikon}</i>
            </button>
          ))}
        <span className="tb-tray">
          {pc.uyariSayisi > 0 && <span title="Windows Güvenliği: eylem gerekiyor">🛡⚠</span>}
          <span title={pc.internet ? 'İnternet erişimi' : 'İnternet yok'} aria-label={pc.internet ? 'Ağ: bağlı' : 'Ağ: internet yok'}>
            {pc.internet ? '🖧' : '🌐⃠'}
          </span>
          <span>TUR</span>
          <span className="tb-clock">
            09:41
            <br />
            2.03.2026
          </span>
        </span>
      </div>
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
