// İ2-G6 Bip kodu teşhisi: laboratuvarda ses olmadığı için bip dizisi görsel olarak gösterilir.
// Öğrenci her bilgisayar için bip dizisini tabloyla karşılaştırıp arızalı bileşeni seçer.
import { useEffect, useState } from 'react';
import Photo from '../components/Photo';
import Sorular, { type Soru } from '../components/Sorular';
import type { TaskUIProps } from './registry';

type Bip = 'k' | 'u';
interface Vaka {
  id: string;
  ad: string;
  bip: Bip[];
  ekran: 'siyah' | 'post';
  belirti: string;
  dogru?: string;
}
interface Veri {
  tablo: { uretici: string; satirlar: { bip: string; anlam: string }[] };
  vakalar: Vaka[];
  secenekler: { id: string; metin: string }[];
  sorular?: Soru[];
}
interface State {
  teshis: Record<string, string>;
  cevaplar: Record<string, string | string[]>;
}

export const initialBipKodlari = (): State => ({ teshis: {}, cevaplar: {} });

export function bipMetni(b: Bip[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < b.length) {
    let j = i;
    while (j < b.length && b[j] === b[i]) j++;
    parts.push(`${j - i} ${b[i] === 'u' ? 'uzun' : 'kısa'}`);
    i = j;
  }
  return parts.join(', ');
}

function BipGosterge({ bip, dinlendi }: { bip: Bip[]; dinlendi: () => void }) {
  const [aktif, setAktif] = useState(-1);
  const [calisiyor, setCalisiyor] = useState(false);
  useEffect(() => {
    if (!calisiyor) return;
    let i = -1;
    let iptal = false;
    const adim = () => {
      if (iptal) return;
      i++;
      if (i >= bip.length) {
        setAktif(-1);
        setCalisiyor(false);
        return;
      }
      setAktif(i);
      setTimeout(() => {
        if (!iptal) setAktif(-2);
        setTimeout(adim, 220);
      }, bip[i] === 'u' ? 900 : 300);
    };
    adim();
    return () => {
      iptal = true;
    };
  }, [calisiyor, bip]);
  return (
    <div className="bip">
      <span className="bip-label">🔈 Hoparlörden duyulan:</span>
      <div className="bip-seq" aria-label={bipMetni(bip)}>
        {bip.map((b, i) => (
          <span key={i} className={'bip-' + b + (aktif === i ? ' lit' : '')} />
        ))}
      </div>
      <button
        className="btn"
        onClick={() => {
          setCalisiyor(true);
          dinlendi();
        }}
        disabled={calisiyor}
      >
        ▶ Tekrar çal
      </button>
      <small className="muted">{bipMetni(bip)}</small>
    </div>
  );
}

export default function BipKodlari({ task, mode, sim }: TaskUIProps) {
  const veri = task.veri as unknown as Veri;
  const s = sim.state as State;
  const learn = mode === 'ogren';
  const [vakaId, setVakaId] = useState(veri.vakalar[0].id);
  const v = veri.vakalar.find((x) => x.id === vakaId)!;

  return (
    <div className="bk">
      <div className="bk-main">
        <div className="tabs-mini">
          {veri.vakalar.map((x) => (
            <button key={x.id} className={x.id === vakaId ? 'on' : ''} onClick={() => setVakaId(x.id)}>
              {x.ad} {s.teshis[x.id] ? '✓' : ''}
            </button>
          ))}
        </div>
        <div className="monitor-css">
          <div className="screen on">
            {v.ekran === 'siyah' ? (
              <div className="nosignal">Sinyal yok</div>
            ) : (
              <pre className="post-text">
                {`American Megatrends\nVersion 2.22.1287  Copyright (C) 2026 AMI\n\nCPU : Intel(R) Core(TM) i5-10400 CPU @ 2.90GHz\nMemory Test : 16384M OK\n\nPress DEL to run Setup`}
              </pre>
            )}
          </div>
        </div>
        <p className="small">
          <b>Belirti:</b> {v.belirti}
        </p>
        <BipGosterge key={v.id} bip={v.bip} dinlendi={() => sim.act('bip.dinle', { vaka: v.id }, (st: State) => st)} />
        <section className="card">
          <h4>{v.ad} için teşhisin</h4>
          <div className="check-grid">
            {veri.secenekler.map((o) => {
              const on = s.teshis[v.id] === o.id;
              const fb = learn && on && v.dogru ? (v.dogru === o.id ? 'good' : 'bad') : '';
              return (
                <label key={o.id} className={'opt ' + fb}>
                  <input type="radio" name={'t-' + v.id} checked={on} onChange={() => sim.act('bip.teshis', { vaka: v.id, secenek: o.id }, (st: State) => ({ ...st, teshis: { ...st.teshis, [v.id]: o.id } }))} />
                  <span>{o.metin}</span>
                </label>
              );
            })}
          </div>
        </section>
      </div>
      <aside className="doc bk-table">
        <h4>{veri.tablo.uretici} bip kodları</h4>
        <table>
          <tbody>
            {veri.tablo.satirlar.map((r) => (
              <tr key={r.bip}>
                <th>{r.bip}</th>
                <td>{r.anlam}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted">Bip kodları BIOS üreticisine göre değişir. Teşhisten önce anakartın kılavuzuna bakılır.</p>
        <Photo name="ram-yerinden-cikmis" alt="Yerine tam oturmamış RAM" className="bk-photo" fallback={null} />
      </aside>
      {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
    </div>
  );
}
