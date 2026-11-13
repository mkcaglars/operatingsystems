// İ4 Windows 11 kurulumu: dil → kurulum seçeneği → ürün anahtarı → lisans → disk → yükleme → ilk açılış (OOBE).
// Disk adımında bölüm silme/biçimlendirme/oluşturma gerçekçi sonuç doğurur; veri içeren bölümlere dikkat edilmelidir.
import { useEffect, useState } from 'react';
import Photo from '../components/Photo';
import Sorular, { type Soru } from '../components/Sorular';
import type { TaskDef } from '../core/types';
import type { TaskUIProps } from './registry';

type Tur = 'ayrilmamis' | 'sistem' | 'msr' | 'birincil' | 'kurtarma' | 'linux';
export interface Bolum {
  id: string;
  tur: Tur;
  boyutGB: number;
  etiket?: string;
  veri?: boolean;
  aciklama?: string;
  windows?: boolean;
  /** Kişisel dosyalar (korunmalı) */
  kisisel?: boolean;
  /** Linux bölümü (Ubuntu kurulumundan): dosya sistemi ve bağlama noktası */
  fs?: 'ext4' | 'swap';
  baglama?: string;
}
export interface Disk {
  id: string;
  bolumler: Bolum[];
}
type Adim = 'dil' | 'secenek' | 'anahtar' | 'surum' | 'lisans' | 'disk' | 'yukleniyor' | 'bolge' | 'klavye2' | 'ag' | 'ad' | 'hesap' | 'gizlilik' | 'bitti';
export interface WinSetupVeri {
  baslangic?: Adim;
  anahtar: string;
  surum: string;
  diskler: Disk[];
  diskNotu?: { disk: string; metin: string }[];
  /** true ise kurulumdan sonra ilk açılış (OOBE) adımları atlanır */
  oobeYok?: boolean;
  /** Kurulumun ağ adımında görünen kablosuz ağlar (kum havuzu) */
  wifi?: { ssid: string; sifre: string; guc: number }[];
  sorular?: Soru[];
}
type Veri = WinSetupVeri;
interface Gizlilik {
  konum: boolean;
  cihazBul: boolean;
  tanilama: 'gerekli' | 'istege';
  murekkep: boolean;
  ozel: boolean;
  reklam: boolean;
}
export interface WinSetupState {
  adim: Adim;
  dil: { dil: string; bicim: string; klavye: string };
  secenek: string | null;
  anahtar: { deger: string; durum: 'yok' | 'gecerli' | 'atlandi' };
  surum: string | null;
  lisans: boolean;
  diskler: Disk[];
  hedef: { disk: string; bolum: string } | null;
  ozet: { temiz: boolean; veriKaybi: string[] };
  kurulum: 'yok' | 'tamam';
  oobe: { bolge: string; klavye: string; ikinciDuzen: boolean; ag: string; cihazAdi: string; kullanici: string; parola: boolean; guvenlik: number; gizlilik: Gizlilik };
  cevaplar: Record<string, string | string[]>;
}

type State = WinSetupState;

const norm = (k: string) => k.toUpperCase().replace(/[^A-Z0-9]/g, '');
let nid = 0;
const newId = () => 'p' + Date.now().toString(36) + nid++;

export const initialWinSetup = (task: TaskDef): State => {
  const v = task.veri as unknown as Veri;
  const ileri = v.baslangic === 'disk';
  return {
    adim: v.baslangic ?? 'dil',
    dil: { dil: 'Türkçe', bicim: 'Türkçe (Türkiye)', klavye: 'Türkçe Q' },
    secenek: ileri ? 'yukle' : null,
    anahtar: { deger: ileri ? v.anahtar : '', durum: ileri ? 'gecerli' : 'yok' },
    surum: ileri ? v.surum : null,
    lisans: ileri,
    diskler: JSON.parse(JSON.stringify(v.diskler)),
    hedef: null,
    ozet: { temiz: false, veriKaybi: [] },
    kurulum: 'yok',
    oobe: { bolge: '', klavye: '', ikinciDuzen: false, ag: '', cihazAdi: '', kullanici: '', parola: false, guvenlik: 0, gizlilik: { konum: true, cihazBul: true, tanilama: 'istege', murekkep: true, ozel: true, reklam: true } },
    cevaplar: {},
  };
};

const TUR_AD: Record<Tur, string> = { ayrilmamis: 'Ayrılmamış Alan', sistem: 'Sistem', msr: 'MSR (Ayrılmış)', birincil: 'Birincil', kurtarma: 'Kurtarma', linux: 'Birincil' };
const gb = (x: number) => (x < 1 ? `${Math.round(x * 1024)} MB` : `${x.toFixed(1).replace('.', ',')} GB`);

/** Ardışık ayrılmamış alanları birleştirir */
function birlestir(b: Bolum[]): Bolum[] {
  const out: Bolum[] = [];
  for (const x of b) {
    const last = out[out.length - 1];
    if (last && last.tur === 'ayrilmamis' && x.tur === 'ayrilmamis') last.boyutGB = +(last.boyutGB + x.boyutGB).toFixed(3);
    else out.push({ ...x });
  }
  return out;
}

export default function WinSetup({ task, mode, sim, gomulu }: TaskUIProps & { gomulu?: boolean }) {
  const veri = task.veri as unknown as Veri;
  const s = sim.state as State;
  const learn = mode === 'ogren';
  const [sec, setSec] = useState<{ disk: string; bolum: string } | null>(null);
  const [dlg, setDlg] = useState<{ msg: string; onOk: () => void } | null>(null);
  const [hata, setHata] = useState('');
  const [anahtar, setAnahtar] = useState(s.anahtar.deger);
  const [pct, setPct] = useState(0);
  const [form, setForm] = useState({ ad: '', kullanici: '', p1: '', p2: '' });
  const [guv, setGuv] = useState(['', '', '']);
  const [gz, setGz] = useState<Gizlilik>(s.oobe.gizlilik);
  const [wifiSec, setWifiSec] = useState<string | null>(null);
  const [wifiPw, setWifiPw] = useState('');

  const go = (adim: Adim) => {
    setHata('');
    sim.act('adim', { adim }, (x: State) => ({ ...x, adim }));
  };

  // Yükleme ilerlemesi
  useEffect(() => {
    if (s.adim !== 'yukleniyor') return;
    setPct(0);
    const t0 = Date.now();
    const t = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - t0) / 6000) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(t);
        sim.act('kurulum.tamam', {}, (x: State) => ({ ...x, kurulum: 'tamam', adim: veri.oobeYok ? 'bitti' : 'bolge' }));
      }
    }, 150);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.adim]);

  const bolumAl = (d: string, b: string) => s.diskler.find((x) => x.id === d)?.bolumler.find((x) => x.id === b);
  const secili = sec ? bolumAl(sec.disk, sec.bolum) : undefined;

  const diskIslem = (islem: 'sil' | 'bicimlendir' | 'yeni', d: string, b: string) =>
    sim.act('disk.' + islem, { disk: d, bolum: b }, (x: State) => {
      const diskler = x.diskler.map((dk) => {
        if (dk.id !== d) return dk;
        let bl = dk.bolumler.map((p) => ({ ...p }));
        const i = bl.findIndex((p) => p.id === b);
        if (i < 0) return dk;
        if (islem === 'sil') bl[i] = { id: bl[i].id, tur: 'ayrilmamis', boyutGB: bl[i].boyutGB };
        if (islem === 'bicimlendir') bl[i] = { ...bl[i], veri: false, kisisel: false, aciklama: undefined };
        if (islem === 'yeni' && bl[i].tur === 'ayrilmamis') {
          const bos = dk.bolumler.every((p) => p.tur === 'ayrilmamis');
          const top = bl[i].boyutGB;
          // Windows boş diskte gerekli sistem bölümlerini kendisi oluşturur
          const yeni: Bolum[] = bos
            ? [
                { id: newId(), tur: 'kurtarma', boyutGB: 0.75 },
                { id: newId(), tur: 'sistem', boyutGB: 0.1 },
                { id: newId(), tur: 'msr', boyutGB: 0.016 },
                { id: newId(), tur: 'birincil', boyutGB: +(top - 0.866).toFixed(1) },
              ]
            : [{ id: newId(), tur: 'birincil', boyutGB: top }];
          bl.splice(i, 1, ...yeni);
        }
        bl = birlestir(bl);
        return { ...dk, bolumler: bl };
      });
      // Veri kaybı takibi
      const once = x.diskler.find((dk) => dk.id === d)?.bolumler.find((p) => p.id === b);
      const kayip = once?.kisisel && islem !== 'yeni' ? [...x.ozet.veriKaybi, `${d}:${once.etiket ?? b}`] : x.ozet.veriKaybi;
      return { ...x, diskler, ozet: { ...x.ozet, veriKaybi: kayip } };
    });

  function yukle() {
    if (!sec || !secili) return;
    if (secili.tur === 'ayrilmamis' || secili.tur === 'birincil') {
      const run = () => {
        setDlg(null);
        sim.act('disk.yukle', { disk: sec.disk, bolum: sec.bolum, tur: secili.tur, veri: !!secili.veri }, (x: State) => {
          let diskler = x.diskler;
          let hedefBolum = sec.bolum;
          if (secili.tur === 'ayrilmamis') {
            // Ayrılmamış alana kurulum: gerekli bölümler otomatik oluşturulur
            const dk = x.diskler.find((q) => q.id === sec.disk)!;
            const bos = dk.bolumler.every((p) => p.tur === 'ayrilmamis');
            const yeniC: Bolum = { id: newId(), tur: 'birincil', boyutGB: +(secili.boyutGB - (bos ? 0.866 : 0)).toFixed(1) };
            hedefBolum = yeniC.id;
            const ek: Bolum[] = bos ? [{ id: newId(), tur: 'kurtarma', boyutGB: 0.75 }, { id: newId(), tur: 'sistem', boyutGB: 0.1 }, { id: newId(), tur: 'msr', boyutGB: 0.016 }, yeniC] : [yeniC];
            diskler = x.diskler.map((q) => (q.id === sec.disk ? { ...q, bolumler: birlestir(q.bolumler.flatMap((p) => (p.id === sec.bolum ? ek : [p]))) } : q));
          }
          diskler = diskler.map((q) => (q.id === sec.disk ? { ...q, bolumler: q.bolumler.map((p) => (p.id === hedefBolum ? { ...p, etiket: 'Windows', windows: true } : p)) } : q));
          return { ...x, diskler, hedef: { disk: sec.disk, bolum: hedefBolum }, ozet: { ...x.ozet, temiz: !secili.veri }, adim: 'yukleniyor' };
        });
      };
      if (secili.veri) setDlg({ msg: 'Seçtiğiniz bölüm, önceki bir Windows yüklemesine ya da kişisel dosyalara ait dosyalar içeriyor olabilir. Bu dosyalar Windows.old klasörüne taşınacak; bölüm biçimlendirilmeyecek. Devam edilsin mi?', onOk: run });
      else run();
    } else setHata('Windows bu bölüme yüklenemez. (Sistem, MSR ve kurtarma bölümleri Windows tarafından kullanılır.)');
  }

  const Btn = ({ onClick, children, primary = true, disabled = false }: { onClick: () => void; children: string; primary?: boolean; disabled?: boolean }) => (
    <button className={'ws-btn' + (primary ? ' primary' : '')} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );

  function Ekran() {
    switch (s.adim) {
      case 'dil':
        return (
          <div className="ws-dlg">
            <div className="ws-h">Dil ayarlarını seçin</div>
            <label>
              Yüklenecek dil
              <select value={s.dil.dil} onChange={(e) => sim.act('dil.set', { alan: 'dil', deger: e.target.value }, (x: State) => ({ ...x, dil: { ...x.dil, dil: e.target.value } }))}>
                {['Türkçe', 'English (United States)', 'Deutsch'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label>
              Saat ve para birimi biçimi
              <select value={s.dil.bicim} onChange={(e) => sim.act('dil.set', { alan: 'bicim', deger: e.target.value }, (x: State) => ({ ...x, dil: { ...x.dil, bicim: e.target.value } }))}>
                {['Türkçe (Türkiye)', 'English (United Kingdom)', 'English (United States)'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label>
              Klavye veya giriş yöntemi
              <select value={s.dil.klavye} onChange={(e) => sim.act('dil.set', { alan: 'klavye', deger: e.target.value }, (x: State) => ({ ...x, dil: { ...x.dil, klavye: e.target.value } }))}>
                {['Türkçe Q', 'Türkçe F', 'İngilizce (ABD)'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <div className="ws-foot">
              <Btn onClick={() => go('secenek')}>İleri</Btn>
            </div>
          </div>
        );
      case 'secenek':
        return (
          <div className="ws-dlg">
            <div className="ws-h">Kurulum seçeneğini belirleyin</div>
            {[
              ['yukle', "Windows 11'i yükle"],
              ['onar', 'Bilgisayarımı onar'],
            ].map(([k, l]) => (
              <label key={k} className="ws-radio">
                <input type="radio" checked={s.secenek === k} onChange={() => sim.act('secenek', { deger: k }, (x: State) => ({ ...x, secenek: k }))} /> {l}
              </label>
            ))}
            {s.secenek === 'onar' && <p className="small">Onarım seçenekleri bu görevde kullanılmıyor.</p>}
            <div className="ws-foot">
              <Btn primary={false} onClick={() => go('dil')}>
                Geri
              </Btn>
              <Btn onClick={() => go('anahtar')} disabled={s.secenek !== 'yukle'}>
                İleri
              </Btn>
            </div>
          </div>
        );
      case 'anahtar':
        return (
          <div className="ws-dlg">
            <div className="ws-h">Ürün anahtarı</div>
            <p>Ürün anahtarı, Windows'un dijital kopyasıyla birlikte gelen e-postada ya da Windows'u içeren kutunun üzerinde bulunur.</p>
            <input className="ws-key" value={anahtar} onChange={(e) => setAnahtar(e.target.value.toUpperCase())} placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" aria-label="Ürün anahtarı" maxLength={29} />
            {hata && <p className="err-text small">{hata}</p>}
            <div className="ws-foot">
              <button
                className="ws-link"
                onClick={() => {
                  sim.act('anahtar.atla', {}, (x: State) => ({ ...x, anahtar: { deger: '', durum: 'atlandi' }, adim: 'surum' }));
                }}
              >
                Ürün anahtarım yok
              </button>
              <Btn
                onClick={() => {
                  const ok = norm(anahtar) === norm(veri.anahtar);
                  const bicim = /^([A-Z0-9]{5}-){4}[A-Z0-9]{5}$/.test(anahtar.trim());
                  sim.act('anahtar.gir', { dogru: ok }, (x: State) => (ok ? { ...x, anahtar: { deger: anahtar, durum: 'gecerli' }, surum: veri.surum, adim: 'lisans' } : x));
                  if (!ok) setHata(bicim ? 'Bu ürün anahtarı çalışmadı. Lütfen denetleyip yeniden deneyin.' : 'Ürün anahtarı 25 karakterdir: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX');
                }}
              >
                İleri
              </Btn>
            </div>
          </div>
        );
      case 'surum':
        return (
          <div className="ws-dlg">
            <div className="ws-h">Yüklemek istediğiniz sürümü seçin</div>
            {['Windows 11 Home', 'Windows 11 Pro', 'Windows 11 Education'].map((o) => (
              <label key={o} className="ws-radio">
                <input type="radio" checked={s.surum === o} onChange={() => sim.act('surum', { deger: o }, (x: State) => ({ ...x, surum: o }))} /> {o}
              </label>
            ))}
            <div className="ws-foot">
              <Btn primary={false} onClick={() => go('anahtar')}>
                Geri
              </Btn>
              <Btn onClick={() => go('lisans')} disabled={!s.surum}>
                İleri
              </Btn>
            </div>
          </div>
        );
      case 'lisans':
        return (
          <div className="ws-dlg">
            <div className="ws-h">Geçerli bildirimler ve lisans koşulları</div>
            <div className="ws-scroll">
              MICROSOFT YAZILIMI LİSANS KOŞULLARI — WINDOWS İŞLETİM SİSTEMİ. Bu yazılımı kullanarak bu koşulları kabul etmiş olursunuz. Yazılım lisanslanır, satılmaz. Ürün anahtarı yalnızca
              bir cihazda etkinleştirme için kullanılabilir… (Eğitsel simülasyon: metin kısaltılmıştır.)
            </div>
            <div className="ws-foot">
              <Btn primary={false} onClick={() => go('anahtar')}>
                Reddet
              </Btn>
              <Btn onClick={() => sim.act('lisans.kabul', {}, (x: State) => ({ ...x, lisans: true, adim: 'disk' }))}>Kabul et</Btn>
            </div>
          </div>
        );
      case 'disk':
        return (
          <div className="ws-dlg wide">
            <div className="ws-h">Windows 11'i yükleyeceğiniz konumu seçin</div>
            <table className="ws-disks">
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>Toplam boyut</th>
                  <th>Boş alan</th>
                  <th>Tür</th>
                </tr>
              </thead>
              <tbody>
                {s.diskler.map((d, di) =>
                  d.bolumler.map((b, bi) => {
                    const ad = b.tur === 'ayrilmamis' ? `Sürücü ${di} Ayrılmamış Alan` : `Sürücü ${di} Bölüm ${bi + 1}${b.etiket ? ': ' + b.etiket : ''}`;
                    const on = sec?.disk === d.id && sec.bolum === b.id;
                    return (
                      <tr key={b.id} className={on ? 'on' : ''} onClick={() => setSec({ disk: d.id, bolum: b.id })}>
                        <td>
                          {b.tur === 'ayrilmamis' ? '▫' : '🖴'} {ad}
                          {b.aciklama && <small> — {b.aciklama}</small>}
                        </td>
                        <td>{gb(b.boyutGB)}</td>
                        <td>{b.tur === 'ayrilmamis' ? gb(b.boyutGB) : b.veri ? gb(b.boyutGB * 0.4) : gb(b.boyutGB * 0.98)}</td>
                        <td>{TUR_AD[b.tur]}</td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
            <div className="ws-tools">
              <button className="ws-link" disabled>
                ⟳ Yenile
              </button>
              <button className="ws-link" disabled={!secili || secili.tur === 'ayrilmamis'} onClick={() => sec && setDlg({ msg: 'Bu bölüm bir bilgisayar üreticisi tarafından oluşturulmuş önemli dosyalar ya da uygulamalar içerebilir. Bu bölümü silerseniz, bölümde depolanan tüm veriler kaybolur.', onOk: () => (diskIslem('sil', sec.disk, sec.bolum), setDlg(null)) })}>
                ✖ Sil
              </button>
              <button className="ws-link" disabled={!secili || secili.tur !== 'birincil'} onClick={() => sec && setDlg({ msg: 'Bu bölümü biçimlendirirseniz, bölümde depolanan tüm veriler kaybolur.', onOk: () => (diskIslem('bicimlendir', sec.disk, sec.bolum), setDlg(null)) })}>
                🧹 Biçimlendir
              </button>
              <button className="ws-link" disabled={!secili || secili.tur !== 'ayrilmamis'} onClick={() => sec && diskIslem('yeni', sec.disk, sec.bolum)}>
                ✚ Yeni
              </button>
              <button className="ws-link" disabled>
                Sürücü yükle
              </button>
            </div>
            {hata && <p className="err-text small">{hata}</p>}
            <div className="ws-foot">
              <Btn onClick={yukle} disabled={!secili}>
                İleri
              </Btn>
            </div>
          </div>
        );
      case 'yukleniyor':
        return (
          <div className="ws-dlg">
            <div className="ws-h">Windows 11 yükleniyor</div>
            {['Windows dosyaları kopyalanıyor', 'Yükleme için dosyalar hazırlanıyor', 'Özellikler yükleniyor', 'Güncelleştirmeler yükleniyor', 'Bitiriliyor'].map((t, i) => (
              <div key={t} className={'ws-step' + (pct >= (i + 1) * 20 ? ' done' : pct >= i * 20 ? ' cur' : '')}>
                {pct >= (i + 1) * 20 ? '✔' : '•'} {t}
                {pct >= i * 20 && pct < (i + 1) * 20 ? ` (%${Math.round((pct - i * 20) * 5)})` : ''}
              </div>
            ))}
            <div className="ws-bar">
              <i style={{ width: pct + '%' }} />
            </div>
          </div>
        );
      case 'bolge':
      case 'klavye2':
      case 'ag':
      case 'ad':
      case 'hesap':
      case 'gizlilik':
        return Oobe();
      case 'bitti':
        return (
          <div className="w11-desktop">
            <div className="w11-note">Kurulum tamamlandı: Windows 11 masaüstü. Görevi teslim edebilirsin.</div>
            <div className="taskbar">
              <span className="win-logo" />
            </div>
          </div>
        );
    }
  }

  function Oobe() {
    const setO = (patch: Partial<State['oobe']>, type: string, adim: Adim) => {
      setHata('');
      sim.act(type, patch as never, (x: State) => ({ ...x, oobe: { ...x.oobe, ...patch }, adim }));
    };
    let body;
    switch (s.adim) {
      case 'bolge':
        body = (
          <>
            <h2>Bu doğru ülke veya bölge mi?</h2>
            <div className="oobe-list">
              {['Kıbrıs', 'Türkiye', 'Birleşik Krallık', 'Almanya'].map((r) => (
                <button key={r} className="oobe-item" onClick={() => setO({ bolge: r }, 'oobe.bolge', 'klavye2')}>
                  {r}
                </button>
              ))}
            </div>
          </>
        );
        break;
      case 'klavye2':
        body = (
          <>
            <h2>Bu doğru klavye düzeni ya da giriş yöntemi mi?</h2>
            <div className="oobe-list">
              {['Türkçe Q', 'Türkçe F', 'Birleşik Krallık', 'ABD'].map((r) => (
                <button key={r} className="oobe-item" onClick={() => setO({ klavye: r }, 'oobe.klavye', 'ag')}>
                  {r}
                </button>
              ))}
            </div>
            <p className="small">İkinci bir klavye düzeni eklemek isterseniz daha sonra Ayarlar'dan ekleyebilirsiniz.</p>
          </>
        );
        break;
      case 'ag':
        body = (
          <>
            <h2>Hadi sizi bir ağa bağlayalım</h2>
            <div className="oobe-list">
              {veri.wifi ? (
                veri.wifi.map((w) => (
                  <div key={w.ssid} className={'oobe-item wifi' + (wifiSec === w.ssid ? ' on' : '')}>
                    <button className="oobe-wifi" onClick={() => (setWifiSec(w.ssid), setWifiPw(''), setHata(''))}>
                      <span className="wifi-bars" data-guc={w.guc} aria-hidden /> {w.ssid} <small>{w.sifre ? 'Güvenli' : 'Açık'}</small>
                    </button>
                    {wifiSec === w.ssid && (
                      <form
                        className="oobe-wifi-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (w.sifre && wifiPw !== w.sifre) {
                            sim.act('oobe.wifi-hata', { ssid: w.ssid }, (x: State) => x);
                            return setHata('Ağ güvenlik anahtarı doğru değil. Yeniden deneyin.');
                          }
                          setO({ ag: 'wifi:' + w.ssid }, 'oobe.ag', 'ad');
                        }}
                      >
                        {w.sifre && <input type="password" autoFocus value={wifiPw} onChange={(e) => setWifiPw(e.target.value)} placeholder="Ağ güvenlik anahtarını girin" aria-label="Wi-Fi şifresi" />}
                        <button className="ws-btn primary">Bağlan</button>
                      </form>
                    )}
                  </div>
                ))
              ) : (
                <button className="oobe-item" onClick={() => setO({ ag: 'ethernet' }, 'oobe.ag', 'ad')}>
                  🖧 Ethernet — Bağlı
                </button>
              )}
              <button className="oobe-item" onClick={() => setO({ ag: 'yok' }, 'oobe.ag', 'ad')}>
                İnternetim yok
              </button>
            </div>
            {hata && <p className="err-text small">{hata}</p>}
          </>
        );
        break;
      case 'ad':
        body = (
          <>
            <h2>Cihazınızı adlandıralım</h2>
            <p className="small">En fazla 15 karakter; harf, rakam ve kısa çizgi (-). Boşluk kullanılamaz.</p>
            <input value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} aria-label="Cihaz adı" />
            {hata && <p className="err-text small">{hata}</p>}
            <button
              className="ws-btn primary"
              onClick={() => {
                const a = form.ad.trim();
                if (!a) return setHata('Bir ad girin.');
                if (a.length > 15) return setHata('Ad 15 karakterden uzun olamaz.');
                if (!/^[A-Za-z0-9-]+$/.test(a)) return setHata('Ad yalnızca harf, rakam ve kısa çizgi içerebilir; boşluk ya da Türkçe karakter kullanılamaz.');
                if (/^\d+$/.test(a)) return setHata('Ad yalnızca rakamlardan oluşamaz.');
                setO({ cihazAdi: a }, 'oobe.ad', 'hesap');
              }}
            >
              İleri
            </button>
          </>
        );
        break;
      case 'hesap':
        body = (
          <>
            <h2>Bu cihazı kim kullanacak?</h2>
            <p className="small">Yerel (çevrimdışı) hesap oluşturuluyor.</p>
            <input placeholder="Ad" value={form.kullanici} onChange={(e) => setForm({ ...form, kullanici: e.target.value })} aria-label="Kullanıcı adı" />
            <input type="password" placeholder="Parola" value={form.p1} onChange={(e) => setForm({ ...form, p1: e.target.value })} aria-label="Parola" />
            <input type="password" placeholder="Parolanızı onaylayın" value={form.p2} onChange={(e) => setForm({ ...form, p2: e.target.value })} aria-label="Parola onay" />
            <p className="small">Parolanızı unutursanız diye üç güvenlik sorusu yanıtlayın:</p>
            {['İlk evcil hayvanınızın adı neydi?', 'Doğduğunuz şehrin adı nedir?', 'Çocukluk takma adınız neydi?'].map((q, i) => (
              <input key={q} placeholder={q} value={guv[i]} onChange={(e) => setGuv(guv.map((g, j) => (j === i ? e.target.value : g)))} aria-label={`Güvenlik sorusu ${i + 1}`} />
            ))}
            {hata && <p className="err-text small">{hata}</p>}
            <button
              className="ws-btn primary"
              onClick={() => {
                if (!form.kullanici.trim()) return setHata('Bir ad girin.');
                if (form.p1.length < 4) return setHata('Güçlü bir parola girin (bu görevde en az 4 karakter).');
                if (form.p1 !== form.p2) return setHata('Parolalar eşleşmiyor.');
                if (guv.some((g) => !g.trim())) return setHata('Üç güvenlik sorusunu da yanıtlayın.');
                setO({ kullanici: form.kullanici.trim(), parola: true, guvenlik: 3 }, 'oobe.hesap', 'gizlilik');
              }}
            >
              İleri
            </button>
          </>
        );
        break;
      case 'gizlilik': {
        const rows: [keyof Gizlilik, string][] = [
          ['konum', 'Konum'],
          ['cihazBul', 'Cihazımı bul'],
          ['murekkep', 'Mürekkep ve yazma iyileştirme'],
          ['ozel', 'Tanılama verileriyle özel deneyimler'],
          ['reklam', 'Reklam kimliği'],
        ];
        body = (
          <>
            <h2>Cihazınız için gizlilik ayarlarını seçin</h2>
            <div className="oobe-priv">
              {rows.map(([k, l]) => (
                <label key={k} className="oobe-toggle">
                  <span>{l}</span>
                  <input type="checkbox" role="switch" checked={gz[k] as boolean} onChange={(e) => setGz({ ...gz, [k]: e.target.checked })} aria-label={l} />
                  <small>{gz[k] ? 'Açık' : 'Kapalı'}</small>
                </label>
              ))}
              <label className="oobe-toggle">
                <span>Tanılama verileri: isteğe bağlı verileri de gönder</span>
                <input type="checkbox" role="switch" checked={gz.tanilama === 'istege'} onChange={(e) => setGz({ ...gz, tanilama: e.target.checked ? 'istege' : 'gerekli' })} aria-label="İsteğe bağlı tanılama verileri" />
                <small>{gz.tanilama === 'istege' ? 'Açık' : 'Yalnızca gerekli'}</small>
              </label>
            </div>
            <button className="ws-btn primary" onClick={() => setO({ gizlilik: gz }, 'oobe.gizlilik', 'bitti')}>
              Kabul et
            </button>
          </>
        );
        break;
      }
    }
    return (
      <div className="oobe">
        <div className="oobe-art" aria-hidden>
          <span className="win-logo big" />
        </div>
        <div className="oobe-panel">{body}</div>
      </div>
    );
  }

  const modal = dlg && (
    <div className="ws-modal">
      <div className="ws-dlg">
        <div className="ws-h">Windows Kurulumu</div>
        <p>{dlg.msg}</p>
        <div className="ws-foot">
          <Btn onClick={dlg.onOk}>Tamam</Btn>
          <Btn primary={false} onClick={() => setDlg(null)}>
            İptal
          </Btn>
        </div>
      </div>
    </div>
  );
  if (gomulu)
    return (
      <div className="screen-fill on ws-screen">
        {Ekran()}
        {modal}
      </div>
    );

  const notlar = veri.diskNotu;
  return (
    <div className="ws">
      <div className="ws-main">
        <div className="monitor-css">
          <div className="screen on ws-screen">
            {Ekran()}
            {dlg && (
              <div className="ws-modal">
                <div className="ws-dlg">
                  <div className="ws-h">Windows Kurulumu</div>
                  <p>{dlg.msg}</p>
                  <div className="ws-foot">
                    <Btn onClick={dlg.onOk}>Tamam</Btn>
                    <Btn primary={false} onClick={() => setDlg(null)}>
                      İptal
                    </Btn>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <aside className="ws-side">
        <div className="card sticker">
          <Photo name="lisans-etiketi" alt="Lisans etiketi" className="sticker-img" fallback={<div className="sticker-img ph" />} />
          <div className="sticker-text">
            <b>{veri.surum}</b>
            <span>Product Key:</span>
            <code>{veri.anahtar}</code>
          </div>
          <small className="muted">Kurgusal ürün anahtarı (yalnızca bu simülasyonda geçerlidir).</small>
        </div>
        {notlar && (
          <div className="card small">
            <b>Diskler hakkında not</b>
            {notlar.map((n) => (
              <p key={n.disk}>{n.metin}</p>
            ))}
          </div>
        )}
        {learn && s.ozet.veriKaybi.length > 0 && <div className="note error small">Dikkat: kişisel dosyaların bulunduğu bir bölüm silindi ya da biçimlendirildi!</div>}
        {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
      </aside>
    </div>
  );
}
