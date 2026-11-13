// Serbest kum havuzu: puansız, tek bir gerçekçi bilgisayar. Ekran + güç/reset + LED'ler + 3 USB girişi + 2 flash bellek
// + durum çubuğu. BIOS, önyükleme menüsü ve yazı yazma gerçek klavyeden yapılır.
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from 'react';
import { api, ApiError } from '../api';
import { TopBar } from '../App';
import {
  altSim,
  ayir,
  bagla,
  biosVeri,
  harfler,
  ilkDurum,
  kurulumuIsle,
  kurulumVeri,
  rufusYaz,
  URUN_ANAHTARI,
  WIFI,
  windowsVar,
  yapilacaklar,
  type FlashId,
  type KhState,
} from '../core/kumhavuzu';
import { useSim, type Sim } from '../core/sim';
import type { TaskDef } from '../core/types';
import type { WinPc } from '../core/winpc';
import PcBios from '../tasks/PcBios';
import WinSetup, { initialWinSetup } from '../tasks/WinSetup';
import Masaustu, { type Kopru, type WinVeri } from '../win/Masaustu';

const SCOPE = 'kum-havuzu';
const WIN_VERI: WinVeri = { uygulamalar: ['ayarlar', 'gorev', 'dosya', 'aygit', 'guvenlik', 'edge'], wifiAglari: WIFI };
const blur = (e: MouseEvent<HTMLElement>) => e.currentTarget.blur();

export default function KumHavuzu() {
  const sim = useSim<KhState>(ilkDurum());
  const st = sim.state;
  const [nonce, setNonce] = useState(0);
  const [bilgi, setBilgi] = useState('');
  const [liste, setListe] = useState(true);
  const [yuklendi, setYuklendi] = useState(false);
  const version = useRef(0);
  const e = st.bios.ekran;

  // ---------- Kayıt: öğrenci kaldığı yerden devam eder ----------
  useEffect(() => {
    api
      .get<{ data: { st: KhState } | null; version: number }>('state', { scope: SCOPE })
      .then((r) => {
        version.current = r.version;
        if (r.data?.st?.pc) {
          // Sayfa kapandığında bilgisayar kapanmış sayılır
          const s = kurulumuIsle(r.data.st);
          sim.restore({ ...s, bios: { ...s.bios, ekran: 'kapali', setup: null } }, []);
        }
      })
      .catch(() => undefined)
      .finally(() => setYuklendi(true));
    api.post('presence', { station: '', task_id: '', info: 'Kum havuzu' }).catch(() => undefined);
    const t = setInterval(() => api.post('presence', { station: '', task_id: '', info: 'Kum havuzu' }).catch(() => undefined), 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const kaydet = useCallback(async (s: KhState) => {
    try {
      const r = await api.post<{ version: number }>('state/save', { scope: SCOPE, data: { st: s }, version: version.current });
      version.current = r.version;
    } catch (er) {
      if (er instanceof ApiError && er.status === 409) {
        const r = await api.get<{ version: number }>('state', { scope: SCOPE });
        version.current = r.version;
      }
    }
  }, []);
  const son = useRef(st);
  son.current = st;
  useEffect(() => {
    if (!yuklendi) return;
    const t = setTimeout(() => kaydet(son.current), 3000);
    return () => clearTimeout(t);
  }, [sim.events.length, yuklendi, kaydet]);

  // ---------- Güç ----------
  const ac = () => {
    sim.act('kh.guc', { acik: true }, (s) => ({ ...s, bios: { ...s.bios, ekran: 'post', setup: null } }));
    setNonce((n) => n + 1);
    setBilgi('Bilgisayar açıldı. Açılışta Del ya da F2: BIOS · F8: önyükleme menüsü (gerçek klavyenden bas).');
  };
  const kapat = () => {
    sim.act('kh.guc', { acik: false }, (s) => {
      const n = kurulumuIsle(s);
      return { ...n, bios: { ...n.bios, ekran: 'kapali', setup: null } };
    });
    setBilgi('Bilgisayar kapatıldı.');
  };
  const reset = () => {
    sim.act('kh.reset', {}, (s) => {
      const n = kurulumuIsle(s);
      return { ...n, bios: { ...n.bios, ekran: 'post', setup: null } };
    });
    setNonce((n) => n + 1);
    setBilgi('Bilgisayar yeniden başlatıldı.');
  };

  // ---------- USB ----------
  const tak = (id: FlashId, port?: number) => {
    const s = son.current;
    if (s.portlar.includes(id)) return;
    const i = port ?? s.portlar.indexOf(null);
    if (i < 0 || s.portlar[i]) return setBilgi('Bu USB girişi dolu.');
    sim.act('kh.usb-tak', { flash: id, port: i + 1 }, (x) => ({ ...x, portlar: x.portlar.map((p, j) => (j === i ? id : p)) }));
    const f = s.flash[id];
    setBilgi(`${f.ad} ${f.kapasite} ${i + 1}. USB girişine takıldı.` + (e === 'os' && windowsVar(s) ? ' Windows yeni sürücüyü algıladı (Dosya Gezgini › Bu bilgisayar).' : ''));
  };
  const cikar = (id: FlashId) => {
    sim.act('kh.usb-cikar', { flash: id }, (x) => ({ ...x, portlar: x.portlar.map((p) => (p === id ? null : p)) }));
    setBilgi(`${st.flash[id].ad} çıkarıldı.`);
  };

  // ---------- Kurulum: USB'den açılınca başlar, bitince bilgisayar yeniden başlar ----------
  const gereksinimOk = st.bios.cmos.tpm && st.bios.cmos.secureBoot;
  useEffect(() => {
    if (e === 'kurulum' && !st.kurulum && gereksinimOk) {
      sim.act('kh.kurulum-basla', {}, (s) => ({ ...s, kurulum: initialWinSetup({ veri: kurulumVeri(s) } as unknown as TaskDef), iz: { ...s.iz, usbAcilis: true } }));
      setBilgi('Bilgisayar USB bellekten açıldı: Windows 11 Kurulumu.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e, !!st.kurulum, gereksinimOk]);
  useEffect(() => {
    if (st.kurulum?.adim === 'bitti') {
      sim.act('kh.kurulum-bitti', {}, (s) => {
        const n = kurulumuIsle(s);
        return { ...n, bios: { ...n.bios, ekran: 'post', setup: null } };
      });
      setNonce((n) => n + 1);
      setBilgi('Windows 11 kuruldu, bilgisayar yeniden başlıyor. USB bellek takılıysa ve önyüklemede öndeyse kurulum yeniden başlar: belleği çıkar!');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.kurulum?.adim]);
  useEffect(() => {
    if (e === 'os' && windowsVar(st)) setBilgi(st.windows === 'eski' ? 'Windows açıldı. Bu bilgisayar çok yavaş ve reklam çıkıyor…' : 'Windows 11 açıldı.');
    if (e === 'setup') setBilgi('BIOS Setup: ← → sekme, ↑ ↓ seçim, Enter değiştir, F10 kaydet ve çık, Esc çık.');
    if (e === 'bootmenu') setBilgi('Önyükleme menüsü: ↑ ↓ ile seç, Enter ile başlat.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e]);

  // Açılış hatası ekranında bir tuşa basınca yeniden dener
  const acilisHatasi = e === 'bootfail' || (e === 'os' && !windowsVar(st));
  useEffect(() => {
    if (!acilisHatasi) return;
    setBilgi('Önyüklenebilir aygıt bulunamadı. Bir tuşa basınca bilgisayar yeniden başlar.');
    const on = (k: KeyboardEvent) => {
      k.preventDefault();
      reset();
    };
    window.addEventListener('keydown', on, { once: true });
    return () => window.removeEventListener('keydown', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acilisHatasi]);

  // ---------- Alt simülasyonlar ----------
  const biosSim = altSim(sim, (s) => s.bios, (s, b) => ({ ...s, bios: b }));
  const kurSim = altSim(sim, (s) => s.kurulum!, (s, k) => ({ ...s, kurulum: k }));
  const bagliPc = useMemo(() => bagla(st.pc, st), [st]);
  const winSim: Sim<{ pc: WinPc }> = {
    state: { pc: bagliPc },
    events: sim.events,
    act: (type, data, update) => sim.act(type, data, (s) => ayir(s, update({ pc: bagla(s.pc, s) }).pc)),
    restore: () => undefined,
    elapsedMs: sim.elapsedMs,
  };
  const h = harfler(st);
  const kopru: Kopru = {
    usbler: st.portlar.filter((x): x is FlashId => !!x).map((id) => ({ id, ad: st.flash[id].ad, harf: h[id]!, kapasite: st.flash[id].kapasite })),
    uefi: !st.bios.cmos.csm,
    rufusBitti: (y) => {
      sim.act('kh.rufus', { flash: y.aygit, bolum: y.bolum }, (s) => rufusYaz(s, y.aygit as FlashId, y.bolum));
      setBilgi(`Rufus bitti: ${st.flash[y.aygit as FlashId]?.ad} artık Windows 11 kurulum belleği (${y.bolum}).`);
    },
    guc: (t) => (t === 'kapat' ? kapat() : reset()),
  };

  function Ekran() {
    if (e === 'kurulum') {
      if (!gereksinimOk)
        return (
          <div className="screen-fill on ws-screen">
            <div className="ws-dlg">
              <div className="ws-h">Bu bilgisayar Windows 11'i çalıştıramaz</div>
              <p>Bu bilgisayar şu anda Windows 11 sistem gereksinimlerini karşılamıyor.</p>
              <ul className="small">
                {!st.bios.cmos.tpm && <li>Bilgisayar TPM 2.0'ı desteklemelidir.</li>}
                {!st.bios.cmos.secureBoot && <li>Bilgisayar Güvenli Önyüklemeyi desteklemelidir.</li>}
              </ul>
              <p className="small">BIOS'ta (Security sekmesi) bu ayarları açıp yeniden deneyin.</p>
            </div>
          </div>
        );
      if (!st.kurulum) return <div className="screen-fill on ws-screen" />;
      return <WinSetup task={{ veri: kurulumVeri(st) } as unknown as TaskDef} mode="uygula" sim={kurSim} gomulu />;
    }
    if (e === 'os') {
      if (!windowsVar(st)) return <pre className="post-text">{'Reboot and Select proper Boot device\nor Insert Boot Media in selected Boot device and press a key_'}</pre>;
      return (
        <div className="screen-fill on wg-screen">
          <Masaustu sim={winSim} veri={WIN_VERI} learn={false} kopru={kopru} />
        </div>
      );
    }
    return <PcBios task={{ veri: biosVeri(st) } as unknown as TaskDef} mode="uygula" sim={biosSim} gomulu={{ nonce }} />;
  }

  const acik = e !== 'kapali';
  const diskAktif = e === 'post' || (e === 'kurulum' && st.kurulum?.adim === 'yukleniyor');
  const durum =
    e === 'kapali'
      ? 'Bilgisayar kapalı — açmak için On/off düğmesine bas.'
      : e === 'post'
        ? 'POST: Del/F2 = BIOS Setup · F8 = önyükleme menüsü'
        : bilgi;
  const islerim = yapilacaklar(st);
  const ondrop = (i: number) => (ev: DragEvent) => {
    ev.preventDefault();
    const id = ev.dataTransfer.getData('text/flash') as FlashId;
    if (id === 'mavi' || id === 'turuncu') {
      if (st.portlar.includes(id)) cikar(id);
      tak(id, i);
    }
  };

  return (
    <div className="page kh-page">
      <TopBar>
        <a href="#/">← Görevler</a>
      </TopBar>
      <main className="kh">
        <div className="kh-ust">
          <div className="kh-ekran" aria-label="Ekran" tabIndex={-1}>
            {Ekran()}
          </div>
          <aside className="kh-kasa" aria-label="Kasa ön paneli">
            <div className="kh-guc">
              <div className="kh-dugmeler">
                <button
                  className={'kh-onoff' + (acik ? ' on' : '')}
                  onClick={(ev) => (blur(ev), acik ? kapat() : ac())}
                  title={acik ? 'Kapat (güç düğmesine uzun bas)' : 'Aç'}
                  aria-label="Güç düğmesi"
                >
                  On/
                  <br />
                  off
                </button>
                <button className="kh-reset" onClick={(ev) => (blur(ev), acik && reset())} title="Reset (yeniden başlat)" aria-label="Reset düğmesi">
                  r
                </button>
              </div>
              <div className="kh-ledler">
                <span className={'kh-led guc' + (acik ? ' on' : '')} title="Güç ışığı" />
                <span className={'kh-led disk' + (diskAktif ? ' yogun' : acik ? ' on' : '')} title="Disk etkinlik ışığı" />
              </div>
            </div>
            <div className="kh-portlar">
              {st.portlar.map((p, i) => (
                <button
                  key={i}
                  className={'kh-port' + (p ? ' dolu ' + p : '')}
                  onClick={(ev) => (blur(ev), p && cikar(p))}
                  onDragOver={(ev) => ev.preventDefault()}
                  onDrop={ondrop(i)}
                  title={p ? `${st.flash[p].ad} — çıkarmak için tıkla` : 'Boş USB girişi: bir flash belleği buraya sürükle'}
                  aria-label={`USB girişi ${i + 1}${p ? ': ' + st.flash[p].ad : ''}`}
                >
                  USB
                  {p && <span className={'kh-takili ' + p} />}
                </button>
              ))}
            </div>
            <div className="kh-flashlar">
              {(['mavi', 'turuncu'] as FlashId[]).map((id) => {
                const f = st.flash[id];
                const takili = st.portlar.includes(id);
                return (
                  <button
                    key={id}
                    className={'kh-flash ' + id + (takili ? ' takili' : '')}
                    draggable
                    onDragStart={(ev) => ev.dataTransfer.setData('text/flash', id)}
                    onClick={(ev) => (blur(ev), takili ? cikar(id) : tak(id))}
                    title={`${f.ad} ${f.kapasite} — ${f.icerik === 'win11' ? 'Windows 11 kurulum belleği' : Object.keys(f.dosyalar).length ? 'içinde dosyalar var' : 'boş'}. Takmak/çıkarmak için tıkla ya da sürükle.`}
                    aria-label={`${id === 'mavi' ? 'Mavi' : 'Turuncu'} flash bellek ${takili ? '(takılı)' : ''}`}
                  >
                    <span className="kh-flash-govde">
                      Flash
                      <br />
                      Disk
                    </span>
                    <span className="kh-flash-uc" />
                    <small>
                      {f.kapasite}
                      {f.icerik === 'win11' ? ' · W11' : ''}
                    </small>
                  </button>
                );
              })}
            </div>
            <div className="kh-etiket" title="Kasanın yanındaki lisans etiketi">
              <b>Windows 11 Pro</b>
              <code>{URUN_ANAHTARI}</code>
            </div>
            <div className="kh-not" title="Masadaki not kâğıdı">
              Wi-Fi: <b>OKUL-LAB</b>
              <br />
              Şifre: <b>Kibris2026</b>
            </div>
          </aside>
        </div>
        <div className="kh-durum" role="status">
          <span>{durum}</span>
          <span className="kh-durum-sag">
            <button className="kh-mini" onClick={(ev) => (blur(ev), setListe((x) => !x))}>
              ☑ Yapılacaklar {islerim.filter((x) => x.tamam).length}/{islerim.length}
            </button>
            <button
              className="kh-mini"
              onClick={(ev) => {
                blur(ev);
                if (!window.confirm('Kum havuzu baştan başlasın mı? Bilgisayar ve flash bellekler ilk hâline döner.')) return;
                sim.act('kh.sifirla', {}, () => ilkDurum());
                setBilgi('Yeni bilgisayar hazır.');
              }}
            >
              ↺ Baştan başla
            </button>
          </span>
        </div>
        {liste && (
          <section className="kh-liste card">
            <b>Serbest çalışma — önerilen iş sırası</b> <small className="muted">(puan verilmez; istediğin sırayla dene)</small>
            <p className="small">
              Bu bilgisayar çok yavaşlamış ve virüslü. Kullanıcının belgelerini kaybetmeden Windows 11'i temiz kur, internete bağla, programları yükle.
            </p>
            <ol>
              {islerim.map((x) => (
                <li key={x.id} className={x.tamam ? 'ok' : ''}>
                  {x.tamam ? '✔' : '○'} {x.metin}
                </li>
              ))}
            </ol>
            {st.iz.turuncuSilindi && <p className="err-text small">⚠ Turuncu flash bellekteki dosyalar (müzik, ödev) Rufus yazarken silindi!</p>}
            <p className="small muted">
              Klavye: BIOS'a girmek, BIOS'ta gezinmek ve yazı yazmak için gerçek klavyeni kullan. Flash belleği bir USB girişine sürükle ya da üstüne tıkla.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
