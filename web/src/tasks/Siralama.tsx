// Sıralama + sorular görevi (ör. İ2-G1 bilgisayarın açılış zinciri ve BIOS'un görevleri).
import Sorular, { type Soru } from '../components/Sorular';
import type { TaskUIProps } from './registry';
import type { TaskDef } from '../core/types';

interface Veri {
  siralama: { baslik: string; aciklama?: string; ogeler: { id: string; metin: string }[]; dogruSira: string[] };
  sorular?: Soru[];
}
interface State {
  sira: string[];
  cevaplar: Record<string, string | string[]>;
}

export const initialSiralama = (task: TaskDef): State => ({ sira: (task.veri as unknown as Veri).siralama.ogeler.map((o) => o.id), cevaplar: {} });

export default function Siralama({ task, mode, sim }: TaskUIProps) {
  const veri = task.veri as unknown as Veri;
  const s = sim.state as State;
  const learn = mode === 'ogren';
  const metin = (id: string) => veri.siralama.ogeler.find((o) => o.id === id)?.metin ?? id;

  const tasi = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= s.sira.length) return;
    sim.act('sira.tasi', { oge: s.sira[i], yon: d }, (st: State) => {
      const a = [...st.sira];
      [a[i], a[j]] = [a[j], a[i]];
      return { ...st, sira: a };
    });
  };

  return (
    <div className="sr">
      <section className="card">
        <h4>{veri.siralama.baslik}</h4>
        {veri.siralama.aciklama && <p className="small muted">{veri.siralama.aciklama}</p>}
        <ol className="sr-list">
          {s.sira.map((id, i) => {
            const fb = learn ? (veri.siralama.dogruSira[i] === id ? 'good' : 'bad') : '';
            return (
              <li key={id} className={fb}>
                <span className="sr-n">{i + 1}</span>
                <span className="sr-t">{metin(id)}</span>
                <span className="sr-btns">
                  <button className="btn" onClick={() => tasi(i, -1)} disabled={i === 0} aria-label="Yukarı taşı">
                    ▲
                  </button>
                  <button className="btn" onClick={() => tasi(i, 1)} disabled={i === s.sira.length - 1} aria-label="Aşağı taşı">
                    ▼
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      </section>
      {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
    </div>
  );
}
