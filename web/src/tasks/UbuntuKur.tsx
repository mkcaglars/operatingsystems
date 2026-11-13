// İ5 Ubuntu 24.04 kurulumu: dil → erişilebilirlik → klavye → ağ → dene/kur → kurulum türü → uygulamalar → optimize →
// disk (diski sil / Windows ile birlikte / elle bölümleme) → hesap → saat dilimi → inceleme → kurulum → yeniden başlat → (GRUB).
import { useEffect, useMemo, useState } from 'react';
import Sorular, { type Soru } from '../components/Sorular';
import type { TaskDef } from '../core/types';
import type { TaskUIProps } from './registry';

export type Fs = 'ext4' | 'fat32' | 'swap' | 'ntfs' | 'bos';
export interface Part {
  id: string;
  ad: string;
  boyutGB: number;
  fs: Fs;
  baglama: string | null;
  bicimlendir: boolean;
  mevcut?: boolean;
  etiket?: string;
  windows?: boolean;
  /** kum havuzu: WinSetup bölüm türü (dönüştürme için) */
  tur?: string;
}
export type UbuntuAdim = 'dil' | 'erisim' | 'klavye' | 'ag' | 'denekur' | 'tur' | 'uygulama' | 'optimize' | 'disk' | 'elle' | 'birlikte' | 'hesap' | 'saat' | 'inceleme' | 'kuruluyor' | 'bitti' | 'grub' | 'ubuntu' | 'windows';
export interface UbuntuVeri {
  disk: { ad: string; boyutGB: number; bolumler: Part[] };
  windowsVar?: boolean;
  /** kum havuzu: kurulumun ağ adımında kablosuz ağlar */
  wifi?: { ssid: string; sifre: string; guc: number }[];
  sorular?: Soru[];
}
interface Ozet {
  kok: { fs: Fs; boyutGB: number } | null;
  home: { fs: Fs; boyutGB: number } | null;
  efi: { fs: Fs; boyutGB: number } | null;
  swap: boolean;
  windowsKorundu: boolean;
  diskSilindi: boolean;
}
type Adim = UbuntuAdim;
type Veri = UbuntuVeri;
export interface UbuntuKurState {
  adim: Adim;
  ayar: { dil: string; klavye: string; ag: string; uygulamalar: string; ucuncuParti: boolean; medya: boolean; diskSecenek: string | null; saatDilimi: string };
  bolumler: Part[];
  hesap: { ad: string; bilgisayar: string; kullanici: string; parola: boolean; parolaIste: boolean; parolaDeger?: string };
  ozet: Ozet;
  kurulum: 'yok' | 'tamam';
  acilan: string[];
  cevaplar: Record<string, string | string[]>;
}

type State = UbuntuKurState;

let seq = 0;
const nid = () => 'u' + Date.now().toString(36) + seq++;

function ozetle(b: Part[], winVar: boolean): Ozet {
  const f = (m: string) => {
    const p = b.find((x) => x.baglama === m);
    return p ? { fs: p.fs, boyutGB: p.boyutGB } : null;
  };
  return {
    kok: f('/'),
    home: f('/home'),
    efi: f('/boot/efi'),
    swap: b.some((x) => x.fs === 'swap'),
    windowsKorundu: winVar ? b.some((x) => x.windows && x.fs === 'ntfs' && !x.bicimlendir) : true,
    diskSilindi: false,
  };
}

export const initialUbuntuKur = (task: TaskDef): State => {
  const v = task.veri as unknown as Veri;
  const bolumler = JSON.parse(JSON.stringify(v.disk.bolumler)) as Part[];
  return {
    adim: 'dil',
    ayar: { dil: 'Türkçe', klavye: '', ag: '', uygulamalar: 'varsayilan', ucuncuParti: false, medya: false, diskSecenek: null, saatDilimi: '' },
    bolumler,
    hesap: { ad: '', bilgisayar: '', kullanici: '', parola: false, parolaIste: true },
    ozet: ozetle(bolumler, !!v.windowsVar),
    kurulum: 'yok',
    acilan: [],
    cevaplar: {},
  };
};

const gb = (x: number) => `${x.toFixed(1).replace('.', ',')} GB`;

export default function UbuntuKur({ task, mode, sim, gomulu }: TaskUIProps & { gomulu?: boolean }) {
  const veri = task.veri as unknown as Veri;
  const s = sim.state as State;
  const learn = mode === 'ogren';
  const [hata, setHata] = useState('');
  const [secili, setSecili] = useState<string | null>(null);
  const [yeni, setYeni] = useState<{ boyut: string; fs: Fs; baglama: string } | null>(null);
  const [ubuntuBoyut, setUbuntuBoyut] = useState(60);
  const [h, setH] = useState({ ad: '', bilgisayar: '', kullanici: '', p1: '', p2: '' });
  const [pct, setPct] = useState(0);
  const [grubSec, setGrubSec] = useState(0);
  const [wifiPw, setWifiPw] = useState('');

  const go = (adim: Adim, data: Record<string, string | boolean> = {}, patch?: (x: State) => State) => {
    setHata('');
    sim.act('adim', { ...data, adim }, (x: State) => ({ ...(patch ? patch(x) : x), adim }));
  };
  const setAyar = (k: keyof State['ayar'], v: string | boolean) => sim.act('ayar', { alan: k, deger: v }, (x: State) => ({ ...x, ayar: { ...x.ayar, [k]: v } }));
  const setBolumler = (type: string, data: Record<string, string | number | boolean>, f: (b: Part[]) => Part[]) =>
    sim.act(type, data, (x: State) => {
      const b = f(x.bolumler.map((p) => ({ ...p })));
      return { ...x, bolumler: b, ozet: { ...ozetle(b, !!veri.windowsVar), diskSilindi: x.ozet.diskSilindi } };
    });

  const bosGB = useMemo(() => s.bolumler.filter((p) => p.fs === 'bos').reduce((a, p) => a + p.boyutGB, 0), [s.bolumler]);
  const win = s.bolumler.find((p) => p.windows);

  useEffect(() => {
    if (s.adim !== 'kuruluyor') return;
    setPct(0);
    const t0 = Date.now();
    const t = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - t0) / 6000) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(t);
        sim.act('kurulum.tamam', {}, (x: State) => ({ ...x, kurulum: 'tamam', adim: 'bitti' }));
      }
    }, 150);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.adim]);

  // ----- Disk seçenekleri -----
  function diskIleri() {
    const sec = s.ayar.diskSecenek;
    if (sec === 'sil') {
      const yeniB: Part[] = [
        { id: nid(), ad: '/dev/sda1', boyutGB: 1.1, fs: 'fat32', baglama: '/boot/efi', bicimlendir: true },
        { id: nid(), ad: '/dev/sda2', boyutGB: +(veri.disk.boyutGB - 1.1).toFixed(1), fs: 'ext4', baglama: '/', bicimlendir: true },
      ];
      sim.act('disk.sil-ve-kur', {}, (x: State) => ({ ...x, bolumler: yeniB, ozet: { ...ozetle(yeniB, !!veri.windowsVar), diskSilindi: true }, adim: 'hesap' }));
    } else if (sec === 'birlikte') go('birlikte');
    else if (sec === 'elle') go('elle');
    else setHata('Bir seçenek belirleyin.');
  }

  function birlikteIleri() {
    if (!win) return;
    const kalanWin = +(win.boyutGB - ubuntuBoyut).toFixed(1);
    setBolumler('disk.birlikte', { ubuntuGB: ubuntuBoyut }, (b) => {
      const out: Part[] = [];
      for (const p of b) {
        if (p.id === win.id) {
          out.push({ ...p, boyutGB: kalanWin });
          out.push({ id: nid(), ad: '/dev/sda5', boyutGB: ubuntuBoyut, fs: 'ext4', baglama: '/', bicimlendir: true });
        } else if (p.fs === 'fat32' && p.mevcut) out.push({ ...p, baglama: '/boot/efi', bicimlendir: false });
        else out.push(p);
      }
      return out;
    });
    go('hesap');
  }

  function yeniEkle() {
    if (!yeni || !secili) return;
    const bos = s.bolumler.find((p) => p.id === secili && p.fs === 'bos');
    const boyut = Number(yeni.boyut.replace(',', '.'));
    if (!bos) return setHata('Önce boş alanı seçin.');
    if (!(boyut > 0) || boyut > bos.boyutGB + 0.001) return setHata(`Boyut 0 ile ${gb(bos.boyutGB)} arasında olmalı.`);
    if (yeni.baglama && s.bolumler.some((p) => p.baglama === yeni.baglama)) return setHata(`${yeni.baglama} bağlama noktası zaten kullanılıyor.`);
    if (yeni.fs === 'fat32' && yeni.baglama !== '/boot/efi') return setHata('FAT32 (EFI sistem bölümü) için bağlama noktası /boot/efi olmalı.');
    if (yeni.fs === 'swap' && yeni.baglama) return setHata('Takas (swap) alanının bağlama noktası olmaz.');
    if ((yeni.fs === 'ext4') && !yeni.baglama) return setHata('ext4 bölümü için bir bağlama noktası seçin.');
    const n = s.bolumler.filter((p) => p.fs !== 'bos').length + 1;
    setBolumler('bolum.ekle', { boyutGB: boyut, fs: yeni.fs, baglama: yeni.baglama }, (b) =>
      b.flatMap((p) => {
        if (p.id !== secili) return [p];
        const yeniP: Part = { id: nid(), ad: `/dev/sda${n}`, boyutGB: boyut, fs: yeni.fs, baglama: yeni.baglama || null, bicimlendir: true };
        const kalan = +(p.boyutGB - boyut).toFixed(1);
        return kalan > 0.05 ? [yeniP, { ...p, id: nid(), boyutGB: kalan }] : [yeniP];
      }),
    );
    setYeni(null);
    setSecili(null);
    setHata('');
  }

  function sil() {
    const p = s.bolumler.find((x) => x.id === secili);
    if (!p || p.fs === 'bos') return;
    setBolumler('bolum.sil', { bolum: p.ad, windows: !!p.windows }, (b) => {
      const out = b.map((x) => (x.id === p.id ? { id: x.id, ad: 'boş alan', boyutGB: x.boyutGB, fs: 'bos' as Fs, baglama: null, bicimlendir: false } : x));
      // ardışık boş alanları birleştir
      const m: Part[] = [];
      for (const x of out) {
        const l = m[m.length - 1];
        if (l && l.fs === 'bos' && x.fs === 'bos') l.boyutGB = +(l.boyutGB + x.boyutGB).toFixed(1);
        else m.push({ ...x });
      }
      return m;
    });
    setSecili(null);
  }

  function hesapIleri() {
    if (!h.ad.trim() || !h.bilgisayar.trim() || !h.kullanici.trim()) return setHata('Tüm alanları doldurun.');
    if (!/^[a-z][a-z0-9_-]{0,31}$/.test(h.kullanici)) return setHata('Kullanıcı adı küçük harfle başlamalı; yalnızca küçük harf, rakam, - ve _ içerebilir.');
    if (!/^[A-Za-z0-9-]{1,63}$/.test(h.bilgisayar)) return setHata('Bilgisayar adı yalnızca harf, rakam ve kısa çizgi içerebilir.');
    if (h.p1.length < 4) return setHata('Parola en az 4 karakter olmalı (bu görevde).');
    if (h.p1 !== h.p2) return setHata('Parolalar eşleşmiyor.');
    go('saat', { kullanici: h.kullanici }, (x) => ({ ...x, hesap: { ad: h.ad.trim(), bilgisayar: h.bilgisayar.trim(), kullanici: h.kullanici, parola: true, parolaIste: true, ...(veri.wifi ? { parolaDeger: h.p1 } : {}) } }));
  }

  const Nav = ({ geri, ileri, ileriAd = 'İleri', disabled = false }: { geri?: Adim; ileri: () => void; ileriAd?: string; disabled?: boolean }) => (
    <div className="ui-nav">
      {geri ? (
        <button className="ui-btn" onClick={() => go(geri)}>
          Geri
        </button>
      ) : (
        <span />
      )}
      <button className="ui-btn primary" onClick={ileri} disabled={disabled}>
        {ileriAd}
      </button>
    </div>
  );

  const Radio = ({ alan, value, label, alt }: { alan: keyof State['ayar']; value: string; label: string; alt?: string }) => (
    <label className={'ui-radio' + (s.ayar[alan] === value ? ' on' : '')}>
      <input type="radio" checked={s.ayar[alan] === value} onChange={() => setAyar(alan, value)} />
      <span>
        <b>{label}</b>
        {alt && <small>{alt}</small>}
      </span>
    </label>
  );

  function Bolumler({ secilebilir }: { secilebilir: boolean }) {
    const top = s.bolumler.reduce((a, p) => a + p.boyutGB, 0);
    const renk: Record<Fs, string> = { ext4: '#e95420', fat32: '#3b82f6', swap: '#a855f7', ntfs: '#0ea5e9', bos: '#d1d5db' };
    return (
      <>
        <div className="ui-diskbar">
          {s.bolumler.map((p) => (
            <span key={p.id} style={{ flex: Math.max(p.boyutGB / top, 0.012), background: renk[p.fs] }} title={`${p.ad} ${gb(p.boyutGB)}`} />
          ))}
        </div>
        <table className="ui-parts">
          <thead>
            <tr>
              <th>Aygıt</th>
              <th>Tür</th>
              <th>Bağlama noktası</th>
              <th>Biçimlendir</th>
              <th>Boyut</th>
            </tr>
          </thead>
          <tbody>
            <tr className="disk-row">
              <td colSpan={5}>
                <b>{veri.disk.ad}</b> ({gb(veri.disk.boyutGB)})
              </td>
            </tr>
            {s.bolumler.map((p) => (
              <tr key={p.id} className={secili === p.id ? 'on' : ''} onClick={() => secilebilir && setSecili(p.id)}>
                <td>
                  {p.fs === 'bos' ? 'Boş alan' : p.ad}
                  {p.etiket ? ` (${p.etiket})` : ''}
                </td>
                <td>{p.fs === 'bos' ? '' : p.fs === 'fat32' ? 'vfat (EFI)' : p.fs}</td>
                <td>{p.baglama ?? ''}</td>
                <td>{p.fs !== 'bos' && p.bicimlendir ? '✔' : ''}</td>
                <td>{gb(p.boyutGB)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  function Ekran() {
    switch (s.adim) {
      case 'dil':
        return (
          <>
            <h2>Ubuntu'ya hoş geldiniz</h2>
            <p>Dilinizi seçin</p>
            <div className="ui-list">
              {['English', 'Deutsch', 'Türkçe', 'Ελληνικά'].map((d) => (
                <button key={d} className={'ui-item' + (s.ayar.dil === d ? ' on' : '')} onClick={() => setAyar('dil', d)}>
                  {d}
                </button>
              ))}
            </div>
            <Nav ileri={() => go('erisim')} />
          </>
        );
      case 'erisim':
        return (
          <>
            <h2>Erişilebilirlik</h2>
            <p className="small">Görme, işitme, yazma ve işaretleme ayarları. Gerekirse buradan açılabilir.</p>
            <Nav geri="dil" ileri={() => go('klavye')} />
          </>
        );
      case 'klavye':
        return (
          <>
            <h2>Klavye düzeni</h2>
            <div className="ui-list">
              {['Türkçe', 'Türkçe (F)', 'İngilizce (ABD)', 'Yunanca'].map((d) => (
                <button key={d} className={'ui-item' + (s.ayar.klavye === d ? ' on' : '')} onClick={() => setAyar('klavye', d)}>
                  {d}
                </button>
              ))}
            </div>
            <input className="ui-test" placeholder="Klavyenizi test etmek için buraya yazın" aria-label="Klavye testi" />
            <Nav geri="erisim" ileri={() => (s.ayar.klavye ? go('ag') : setHata('Bir klavye düzeni seçin.'))} />
          </>
        );
      case 'ag':
        return (
          <>
            <h2>İnternete bağlanın</h2>
            {veri.wifi ? (
              <>
                {veri.wifi.map((w) => (
                  <Radio key={w.ssid} alan="ag" value={'wifi:' + w.ssid} label={`📶 ${w.ssid}`} alt={w.sifre ? 'Güvenli (WPA2)' : 'Açık ağ'} />
                ))}
                {(() => {
                  const w = veri.wifi.find((x) => 'wifi:' + x.ssid === s.ayar.ag);
                  return w?.sifre ? <input type="password" value={wifiPw} onChange={(e) => setWifiPw(e.target.value)} placeholder="Parola" aria-label="Wi-Fi parolası" autoFocus /> : null;
                })()}
              </>
            ) : (
              <Radio alan="ag" value="kablolu" label="Kablolu bağlantı kullan" alt="Kablolu bağlantı algılandı" />
            )}
            <Radio alan="ag" value="yok" label="Şimdi internete bağlanmak istemiyorum" />
            <Nav
              geri="klavye"
              ileri={() => {
                if (!s.ayar.ag) return setHata('Bir seçenek belirleyin.');
                const w = veri.wifi?.find((x) => 'wifi:' + x.ssid === s.ayar.ag);
                if (w?.sifre && wifiPw !== w.sifre) {
                  sim.act('wifi.hata', { ssid: w.ssid }, (x: State) => x);
                  return setHata('Kimlik doğrulama başarısız: parola yanlış.');
                }
                go('denekur');
              }}
            />
          </>
        );
      case 'denekur':
        return (
          <>
            <h2>Ubuntu'yu dene veya kur</h2>
            <label className="ui-radio">
              <input type="radio" name="dk" onChange={() => sim.act('dene', {}, (x: State) => x)} />
              <span>
                <b>Ubuntu'yu dene</b>
                <small>Bilgisayarınızda değişiklik yapmadan Ubuntu'yu deneyebilirsiniz.</small>
              </span>
            </label>
            <label className="ui-radio on">
              <input type="radio" name="dk" defaultChecked />
              <span>
                <b>Ubuntu'yu kur</b>
                <small>Ubuntu'yu mevcut işletim sisteminizin yanına ya da yerine kurun.</small>
              </span>
            </label>
            <Nav geri="ag" ileri={() => go('tur')} />
          </>
        );
      case 'tur':
        return (
          <>
            <h2>Ubuntu'yu nasıl kurmak istiyorsunuz?</h2>
            <label className="ui-radio on">
              <input type="radio" defaultChecked />
              <span>
                <b>Etkileşimli kurulum</b>
                <small>Adım adım ilerleyin.</small>
              </span>
            </label>
            <label className="ui-radio">
              <input type="radio" disabled />
              <span>
                <b>Otomatik kurulum</b>
                <small>Bir otomatik kurulum dosyası gerekir.</small>
              </span>
            </label>
            <Nav geri="denekur" ileri={() => go('uygulama')} />
          </>
        );
      case 'uygulama':
        return (
          <>
            <h2>Hangi uygulamalarla başlamak istersiniz?</h2>
            <Radio alan="uygulamalar" value="varsayilan" label="Varsayılan seçim" alt="Web tarayıcısı ve temel yardımcı programlar." />
            <Radio alan="uygulamalar" value="genis" label="Genişletilmiş seçim" alt="Ofis araçları (LibreOffice) ve yardımcı programlar." />
            <Nav geri="tur" ileri={() => go('optimize')} />
          </>
        );
      case 'optimize':
        return (
          <>
            <h2>Bilgisayarınızı optimize edin</h2>
            <label className="ui-check">
              <input type="checkbox" checked={s.ayar.ucuncuParti} onChange={(e) => setAyar('ucuncuParti', e.target.checked)} />
              <span>
                <b>Grafik ve Wi-Fi donanımı için üçüncü taraf yazılımları kur</b>
                <small>Bu yazılımlar kendi lisans koşullarına tabidir.</small>
              </span>
            </label>
            <label className="ui-check">
              <input type="checkbox" checked={s.ayar.medya} onChange={(e) => setAyar('medya', e.target.checked)} />
              <span>
                <b>Ek medya biçimleri için destek indir ve kur</b>
              </span>
            </label>
            <Nav geri="uygulama" ileri={() => go('disk')} />
          </>
        );
      case 'disk':
        return (
          <>
            <h2>Disk kurulumu</h2>
            {veri.windowsVar && <Radio alan="diskSecenek" value="birlikte" label="Ubuntu'yu Windows Boot Manager ile birlikte kur" alt="Windows korunur; açılışta hangi sistemin başlatılacağını seçebilirsiniz." />}
            <Radio alan="diskSecenek" value="sil" label="Diski sil ve Ubuntu'yu kur" alt={veri.windowsVar ? 'Uyarı: Windows dahil diskteki TÜM veriler silinir.' : 'Diskteki tüm veriler silinir.'} />
            <Radio alan="diskSecenek" value="elle" label="Elle kurulum" alt="Bölümleri kendiniz oluşturun ya da boyutlandırın." />
            <Nav geri="optimize" ileri={diskIleri} />
          </>
        );
      case 'birlikte':
        return (
          <>
            <h2>Ubuntu'ya ne kadar yer ayrılsın?</h2>
            <p className="small">Windows bölümü küçültülecek. Windows'ta kullanılan alan korunur.</p>
            <div className="ui-split">
              <div style={{ flex: (win?.boyutGB ?? 1) - ubuntuBoyut }} className="w">
                Windows {gb((win?.boyutGB ?? 0) - ubuntuBoyut)}
              </div>
              <div style={{ flex: ubuntuBoyut }} className="u">
                Ubuntu {gb(ubuntuBoyut)}
              </div>
            </div>
            <input type="range" min={20} max={110} step={5} value={ubuntuBoyut} onChange={(e) => setUbuntuBoyut(Number(e.target.value))} aria-label="Ubuntu boyutu (GB)" />
            <p className="small">Ubuntu: {ubuntuBoyut} GB (en az 25 GB önerilir) · Windows'ta kullanılan alan: 117 GB</p>
            <Nav geri="disk" ileri={birlikteIleri} />
          </>
        );
      case 'elle':
        return (
          <>
            <h2>Elle bölümleme</h2>
            {Bolumler({ secilebilir: true })}
            <div className="ui-tools">
              <button className="ui-btn" onClick={() => (secili && s.bolumler.find((p) => p.id === secili)?.fs === 'bos' ? setYeni({ boyut: '', fs: 'ext4', baglama: '/' }) : setHata('Yeni bölüm için boş alanı seçin.'))}>
                ＋
              </button>
              <button className="ui-btn" onClick={sil} disabled={!secili || s.bolumler.find((p) => p.id === secili)?.fs === 'bos'}>
                −
              </button>
              <span className="small muted">Boş alan: {gb(bosGB)}</span>
            </div>
            {yeni && (
              <div className="ui-newpart">
                <b>Bölüm oluştur</b>
                <label>
                  Boyut (GB)
                  <input value={yeni.boyut} onChange={(e) => setYeni({ ...yeni, boyut: e.target.value })} inputMode="decimal" aria-label="Bölüm boyutu" />
                </label>
                <label>
                  Kullanım
                  <select value={yeni.fs} onChange={(e) => setYeni({ ...yeni, fs: e.target.value as Fs, baglama: e.target.value === 'fat32' ? '/boot/efi' : e.target.value === 'swap' ? '' : yeni.baglama || '/' })} aria-label="Dosya sistemi">
                    <option value="ext4">Ext4</option>
                    <option value="fat32">EFI sistem bölümü (FAT32)</option>
                    <option value="swap">Takas alanı (swap)</option>
                  </select>
                </label>
                <label>
                  Bağlama noktası
                  <select value={yeni.baglama} onChange={(e) => setYeni({ ...yeni, baglama: e.target.value })} aria-label="Bağlama noktası" disabled={yeni.fs !== 'ext4'}>
                    <option value="">—</option>
                    {['/', '/home', '/boot/efi', '/var', '/tmp'].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <div className="row">
                  <button className="ui-btn primary" onClick={yeniEkle}>
                    Oluştur
                  </button>
                  <button className="ui-btn" onClick={() => setYeni(null)}>
                    İptal
                  </button>
                </div>
              </div>
            )}
            <Nav geri="disk" ileri={() => (s.ozet.kok ? go('hesap') : setHata('Bir kök (/) bölümü oluşturmalısınız.'))} />
          </>
        );
      case 'hesap':
        return (
          <>
            <h2>Hesabınızı oluşturun</h2>
            <div className="ui-form">
              <input placeholder="Adınız" value={h.ad} onChange={(e) => setH({ ...h, ad: e.target.value })} aria-label="Adınız" />
              <input placeholder="Bilgisayarınızın adı" value={h.bilgisayar} onChange={(e) => setH({ ...h, bilgisayar: e.target.value })} aria-label="Bilgisayarın adı" />
              <input placeholder="Kullanıcı adınız" value={h.kullanici} onChange={(e) => setH({ ...h, kullanici: e.target.value })} aria-label="Kullanıcı adı" autoCapitalize="none" />
              <input type="password" placeholder="Parola" value={h.p1} onChange={(e) => setH({ ...h, p1: e.target.value })} aria-label="Parola" />
              <input type="password" placeholder="Parolayı onaylayın" value={h.p2} onChange={(e) => setH({ ...h, p2: e.target.value })} aria-label="Parola onay" />
              <label className="ui-check">
                <input type="checkbox" defaultChecked /> <span>Oturum açmak için parolamı iste</span>
              </label>
            </div>
            <Nav geri="disk" ileri={hesapIleri} />
          </>
        );
      case 'saat':
        return (
          <>
            <h2>Saat diliminizi seçin</h2>
            <select value={s.ayar.saatDilimi} onChange={(e) => setAyar('saatDilimi', e.target.value)} aria-label="Saat dilimi">
              <option value="">Konum seçin…</option>
              <option value="Europe/Nicosia">Lefkoşa (Europe/Nicosia)</option>
              <option value="Europe/Istanbul">İstanbul (Europe/Istanbul)</option>
              <option value="Europe/London">Londra (Europe/London)</option>
            </select>
            <Nav geri="hesap" ileri={() => (s.ayar.saatDilimi ? go('inceleme') : setHata('Bir konum seçin.'))} />
          </>
        );
      case 'inceleme':
        return (
          <>
            <h2>Seçimlerinizi inceleyin</h2>
            <dl className="kv small">
              <dt>Dil</dt>
              <dd>{s.ayar.dil}</dd>
              <dt>Klavye</dt>
              <dd>{s.ayar.klavye}</dd>
              <dt>Uygulamalar</dt>
              <dd>{s.ayar.uygulamalar === 'genis' ? 'Genişletilmiş seçim' : 'Varsayılan seçim'}</dd>
              <dt>Kullanıcı</dt>
              <dd>
                {s.hesap.kullanici}@{s.hesap.bilgisayar}
              </dd>
            </dl>
            {Bolumler({ secilebilir: false })}
            <p className="small">{s.ozet.diskSilindi ? '⚠ Diskteki tüm bölümler silinecek.' : 'İşaretli bölümler biçimlendirilecek.'}</p>
            <Nav geri="saat" ileri={() => go('kuruluyor', {}, (x) => x)} ileriAd="Kur" />
          </>
        );
      case 'kuruluyor':
        return (
          <>
            <h2>Ubuntu kuruluyor</h2>
            <p>{pct < 30 ? 'Dosyalar kopyalanıyor…' : pct < 60 ? 'Paketler kuruluyor…' : pct < 90 ? 'Önyükleyici (GRUB) kuruluyor…' : 'Son ayarlar yapılıyor…'}</p>
            <div className="ws-bar ub">
              <i style={{ width: pct + '%' }} />
            </div>
          </>
        );
      case 'bitti':
        return (
          <>
            <h2>Ubuntu 24.04 LTS kuruldu ve kullanıma hazır</h2>
            <p className="small">Yeni kurulumu kullanmak için bilgisayarı yeniden başlatın. Kurulum USB'sini çıkarın.</p>
            <Nav ileri={() => go(veri.windowsVar && s.ozet.windowsKorundu ? 'grub' : 'ubuntu')} ileriAd="Şimdi yeniden başlat" />
          </>
        );
      default:
        return null;
    }
  }

  const grubSecenekler = ['Ubuntu', 'Advanced options for Ubuntu', 'Windows Boot Manager (on /dev/sda1)', 'UEFI Firmware Settings'];
  const grubAc = (i: number) => {
    const hedef = i === 0 ? 'ubuntu' : i === 2 ? 'windows' : null;
    if (!hedef) return;
    sim.act('grub.sec', { hedef }, (x: State) => ({ ...x, adim: hedef as Adim, acilan: x.acilan.includes(hedef) ? x.acilan : [...x.acilan, hedef] }));
  };

  const ekranTam = s.adim === 'grub' || s.adim === 'ubuntu' || s.adim === 'windows';
  if (gomulu)
    return (
      <div className="screen-fill on">
        <div className="ui-installer">
          <div className="ui-top">
            <span>Ubuntu'yu Kur</span>
          </div>
          <div className="ui-page">
            {Ekran()}
            {hata && <p className="err-text small">{hata}</p>}
          </div>
        </div>
      </div>
    );
  return (
    <div className="ubk">
      <div className="ubk-main">
        <div className="monitor-css">
          <div className="screen on">
            {s.adim === 'grub' ? (
              <div className="grub">
                <div className="grub-title">GNU GRUB version 2.12</div>
                <div className="grub-box">
                  {grubSecenekler.map((g, i) => (
                    <button key={g} className={i === grubSec ? 'on' : ''} onClick={() => setGrubSec(i)} onDoubleClick={() => grubAc(i)}>
                      {i === grubSec ? '*' : ' '}
                      {g}
                    </button>
                  ))}
                </div>
                <div className="grub-help">
                  Seçmek için ↑ ve ↓ ya da tıkla. Başlatmak için Enter'a bas ya da{' '}
                  <button className="grub-go" onClick={() => grubAc(grubSec)}>
                    ↵ Başlat
                  </button>
                </div>
              </div>
            ) : s.adim === 'ubuntu' ? (
              <div className="ub-login">
                <div className="ub-user">{s.hesap.ad || s.hesap.kullanici}</div>
                <div className="w11-note">Ubuntu açıldı (giriş ekranı).</div>
                {veri.windowsVar && s.ozet.windowsKorundu && (
                  <button className="ui-btn" onClick={() => go('grub')}>
                    Yeniden başlat
                  </button>
                )}
              </div>
            ) : s.adim === 'windows' ? (
              <div className="w11-lock">
                <div className="clock">09:58</div>
                <div className="date">Pazartesi, 2 Mart</div>
                <div className="w11-note">Windows 11 açıldı: Windows korunmuş.</div>
                <button className="ui-btn small-abs" onClick={() => go('grub')}>
                  Yeniden başlat
                </button>
              </div>
            ) : (
              <div className="ui-installer">
                <div className="ui-top">
                  <span>Ubuntu'yu Kur</span>
                </div>
                <div className={'ui-page' + (ekranTam ? '' : '')}>
                  {Ekran()}
                  {hata && <p className="err-text small">{hata}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <aside className="ubk-side">
        {learn && (
          <div className="card small">
            <b>Bölüm özeti</b>
            <div>/ (kök): {s.ozet.kok ? `${s.ozet.kok.fs}, ${gb(s.ozet.kok.boyutGB)}` : '—'}</div>
            <div>/home: {s.ozet.home ? `${s.ozet.home.fs}, ${gb(s.ozet.home.boyutGB)}` : '—'}</div>
            <div>/boot/efi: {s.ozet.efi ? `${s.ozet.efi.fs}, ${gb(s.ozet.efi.boyutGB)}` : '—'}</div>
            {veri.windowsVar && <div className={s.ozet.windowsKorundu && !s.ozet.diskSilindi ? 'ok-text' : 'err-text'}>Windows: {s.ozet.windowsKorundu && !s.ozet.diskSilindi ? 'korunuyor' : 'SİLİNECEK!'}</div>}
          </div>
        )}
        {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
      </aside>
    </div>
  );
}
