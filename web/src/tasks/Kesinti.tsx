// İ1-G4 Elektrik kesintisi: cihazları UPS'in doğru prizlerine bağla, çalışırken elektrik kesilir;
// UPS akü süresi bitmeden belgeyi kaydedip bilgisayarı güvenli kapat.
import { useEffect, useRef, useState } from 'react';
import Photo, { photoUrl } from '../components/Photo';
import Sorular, { type Soru } from '../components/Sorular';
import type { TaskUIProps } from './registry';

interface Cihaz {
  id: string;
  ad: string;
  watt: number;
  gorsel: string;
}
interface Priz {
  id: string;
  tur: 'aku' | 'surge' | 'duvar';
  ad: string;
}
interface Veri {
  cihazlar: Cihaz[];
  prizler: Priz[];
  kapasiteW: number;
  sorular?: Soru[];
}
type Asama = 'baglanti' | 'calisma' | 'kesinti' | 'bitti';
interface State {
  baglanti: Record<string, string>;
  asama: Asama;
  belge: { kaydedildi: boolean };
  pc: { kapatildi: 'guvenli' | 'ani' | null };
  veriKaybi: boolean;
  asiriYuk: boolean;
  cevaplar: Record<string, string | string[]>;
}

export const initialKesinti = (): State => ({ baglanti: {}, asama: 'baglanti', belge: { kaydedildi: false }, pc: { kapatildi: null }, veriKaybi: false, asiriYuk: false, cevaplar: {} });

const BELGE = 'TOPLANTI TUTANAĞI\n\nTarih: 12.11.2026\nKonu: Bilişim laboratuvarının yenilenmesi\n\n1. Laboratuvardaki 24 bilgisayarın işletim sistemi güncellenecek.\n2. Her masaya bir UPS konulması önerildi.\n3. ';

export default function Kesinti({ task, mode, sim }: TaskUIProps) {
  const veri = task.veri as unknown as Veri;
  const s = sim.state as State;
  const learn = mode === 'ogren';
  const [secili, setSecili] = useState<string | null>(veri.cihazlar[0].id);
  const [kalan, setKalan] = useState(0);
  const [baslat, setBaslat] = useState(false);
  const sure = learn ? 60 : 40;
  const ref = useRef(s);
  ref.current = s;

  const prizTur = (cid: string) => veri.prizler.find((p) => p.id === s.baglanti[cid])?.tur;
  const akuYuk = veri.cihazlar.filter((c) => prizTur(c.id) === 'aku').reduce((a, c) => a + c.watt, 0);

  // Çalışma başladıktan 6 sn sonra elektrik kesilir
  useEffect(() => {
    if (s.asama !== 'calisma') return;
    const t = setTimeout(() => {
      const st = ref.current;
      const pcTur = veri.prizler.find((p) => p.id === st.baglanti.pc)?.tur;
      const yuk = veri.cihazlar.filter((c) => veri.prizler.find((p) => p.id === st.baglanti[c.id])?.tur === 'aku').reduce((a, c) => a + c.watt, 0);
      const asiri = yuk > veri.kapasiteW;
      const aniKapanma = pcTur !== 'aku' || asiri;
      sim.act('elektrik.kesildi', { pcPriz: pcTur ?? 'yok', yukW: yuk, asiriYuk: asiri }, (x: State) =>
        aniKapanma ? { ...x, asama: 'bitti', asiriYuk: asiri, pc: { kapatildi: 'ani' }, veriKaybi: !x.belge.kaydedildi } : { ...x, asama: 'kesinti' },
      );
      setKalan(sure);
    }, 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.asama]);

  // Akü geri sayımı
  useEffect(() => {
    if (s.asama !== 'kesinti') return;
    let k = sure;
    const t = setInterval(() => {
      k -= 1;
      setKalan(Math.max(0, k));
      if (k <= 0) {
        clearInterval(t);
        if (ref.current.asama === 'kesinti') sim.act('ups.aku-bitti', {}, (x: State) => (x.asama === 'kesinti' ? { ...x, asama: 'bitti', pc: { kapatildi: 'ani' }, veriKaybi: !x.belge.kaydedildi } : x));
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.asama]);

  function prizTikla(p: Priz) {
    if (s.asama !== 'baglanti') return;
    const sahip = Object.entries(s.baglanti).find(([, v]) => v === p.id)?.[0];
    if (sahip) {
      sim.act('priz.cikar', { cihaz: sahip, priz: p.id }, (x: State) => {
        const b = { ...x.baglanti };
        delete b[sahip];
        return { ...x, baglanti: b };
      });
      setSecili(sahip);
      return;
    }
    if (!secili) return;
    sim.act('priz.tak', { cihaz: secili, priz: p.id, tur: p.tur }, (x: State) => ({ ...x, baglanti: { ...x.baglanti, [secili]: p.id } }));
    const next = veri.cihazlar.find((c) => c.id !== secili && !s.baglanti[c.id]);
    setSecili(next?.id ?? null);
  }

  const kaydet = () => sim.act('belge.kaydet', {}, (x: State) => ({ ...x, belge: { kaydedildi: true } }));
  const kapat = () => sim.act('pc.kapat', { kaydedildi: s.belge.kaydedildi }, (x: State) => ({ ...x, asama: 'bitti', pc: { kapatildi: 'guvenli' }, veriKaybi: !x.belge.kaydedildi }));

  const pcAcik = s.asama === 'calisma' || s.asama === 'kesinti';
  const dk = Math.ceil((kalan / sure) * 6);

  return (
    <div className="ks">
      <div className="ks-desk" style={photoUrl('ortam-lab-masa') ? { backgroundImage: `url(${photoUrl('ortam-lab-masa')})` } : undefined}>
        <div className={'ks-room ' + (s.asama === 'kesinti' || (s.asama === 'bitti' && s.pc.kapatildi) ? 'dark' : '')} />
        {/* Monitör */}
        <div className="ks-monitor">
          <div className={'screen ' + (pcAcik ? 'on' : '')}>
            {pcAcik ? (
              <div className="word">
                <div className="word-bar">
                  <span>Belge1 - Word</span>
                  {s.belge.kaydedildi && <span className="saved">Kaydedildi ✓</span>}
                </div>
                <div className="word-ribbon">
                  <button onClick={kaydet} title="Kaydet (Ctrl+S)">
                    💾 Kaydet
                  </button>
                  <span>Giriş</span>
                  <span>Ekle</span>
                  <span>Düzen</span>
                </div>
                <pre className="word-page">
                  {BELGE}
                  <span className="caret">▍</span>
                </pre>
                <div className="taskbar">
                  <button className="start" onClick={() => setBaslat((b) => !b)} title="Başlat">
                    <span className="win-logo" />
                  </button>
                  {baslat && (
                    <div className="start-menu">
                      <button onClick={kapat}>⏻ Kapat</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="off-text">{s.asama === 'bitti' ? (s.pc.kapatildi === 'guvenli' ? 'Bilgisayar güvenli şekilde kapatıldı.' : 'Bilgisayar aniden kapandı!') : ''}</div>
            )}
          </div>
          <div className="stand" />
        </div>

        {/* UPS */}
        <div className="ks-ups">
          <div className="ups-front">
            <span className={'led ' + (s.asama === 'kesinti' ? 'bat' : pcAcik ? 'on' : '')} />
            <div className="lcd">{s.asama === 'kesinti' ? `AKÜ  ${dk} dk` : s.asama === 'bitti' && s.asiriYuk ? 'AŞIRI YÜK' : pcAcik ? 'ŞEBEKE' : '---'}</div>
            {s.asama === 'kesinti' && <div className="beep">🔊 Bip… bip… (UPS uyarı sesi)</div>}
          </div>
          <div className="ups-rear">
            <small>UPS arka paneli</small>
            <div className="outlets">
              {veri.prizler
                .filter((p) => p.tur !== 'duvar')
                .map((p) => {
                  const sahip = Object.entries(s.baglanti).find(([, v]) => v === p.id)?.[0];
                  return (
                    <button key={p.id} className={'outlet ' + p.tur + (sahip ? ' used' : '')} onClick={() => prizTikla(p)} title={p.ad}>
                      <span className="iec" />
                      <small>{sahip ? veri.cihazlar.find((c) => c.id === sahip)?.ad : p.tur === 'aku' ? 'AKÜ + KORUMA' : 'YALNIZ KORUMA'}</small>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Duvar prizi (UK tipi) */}
        {veri.prizler
          .filter((p) => p.tur === 'duvar')
          .map((p) => {
            const sahip = Object.entries(s.baglanti).find(([, v]) => v === p.id)?.[0];
            return (
              <button key={p.id} className={'ks-wall' + (sahip ? ' used' : '')} onClick={() => prizTikla(p)} title={p.ad}>
                <span className="uk">
                  <i className="e" />
                  <i className="l" />
                  <i className="n" />
                </span>
                <small>{sahip ? veri.cihazlar.find((c) => c.id === sahip)?.ad : 'Duvar prizi'}</small>
              </button>
            );
          })}
      </div>

      <div className="ks-side">
        {s.asama === 'baglanti' && (
          <>
            <h4>1. Cihazları bağla</h4>
            <p className="small muted">Cihazı seç, sonra UPS'in arkasındaki ya da duvardaki prize tıkla.</p>
            {veri.cihazlar.map((c) => {
              const p = veri.prizler.find((x) => x.id === s.baglanti[c.id]);
              return (
                <button key={c.id} className={'ks-dev ' + (secili === c.id ? 'on' : '')} onClick={() => setSecili(c.id)}>
                  <Photo name={c.gorsel} alt={c.ad} className="ks-dev-img" fallback={<span className="ks-dev-img ph">🔌</span>} />
                  <span>
                    <b>{c.ad}</b>
                    <small>
                      {c.watt} W · {p ? p.ad : 'bağlı değil'}
                    </small>
                  </span>
                </button>
              );
            })}
            {learn && (
              <p className={'small ' + (akuYuk > veri.kapasiteW ? 'err-text' : 'muted')}>
                Akü çıkışlarındaki yük: {akuYuk} W / UPS kapasitesi {veri.kapasiteW} W
              </p>
            )}
            <button className="btn primary block" disabled={!s.baglanti.pc || !s.baglanti.monitor} onClick={() => sim.act('calisma.basla', {}, (x: State) => ({ ...x, asama: 'calisma' }))}>
              2. Bilgisayarı aç ve çalışmaya başla
            </button>
          </>
        )}
        {s.asama === 'calisma' && <div className="note info">Müdür yardımcısı toplantı tutanağını yazıyor…</div>}
        {s.asama === 'kesinti' && (
          <div className="note warn">
            <b>⚡ Elektrik kesildi!</b> UPS aküden çalışıyor. Akü bitmeden ne yapmalısın? (Kalan: {kalan} sn)
          </div>
        )}
        {s.asama === 'bitti' && (
          <div className={'note ' + (s.pc.kapatildi === 'guvenli' && !s.veriKaybi ? 'ok' : 'error')}>
            {s.asiriYuk
              ? 'UPS aşırı yüklendi ve kapandı: akü çıkışına çok güç çeken bir cihaz bağlanmıştı.'
              : s.pc.kapatildi === 'guvenli'
                ? s.veriKaybi
                  ? 'Bilgisayar kapatıldı ama belge kaydedilmediği için yazılanlar kayboldu.'
                  : 'Belge kaydedildi ve bilgisayar güvenli kapatıldı.'
                : 'Bilgisayar aniden kapandı' + (s.veriKaybi ? '; kaydedilmemiş belge kayboldu.' : '.')}
            <br />
            Görevi teslim edebilirsin.
          </div>
        )}
        {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
      </div>
    </div>
  );
}
