// Sınıflandırma görevi: her öğe, bir ya da birden çok "boyutta" bir gruba atanır
// (ör. İ3-G1: kullanım alanı → masaüstü/sunucu/mobil/gömülü; lisans → açık/kapalı kaynak).
import Photo from '../components/Photo';
import Sorular, { type Soru } from '../components/Sorular';
import type { TaskUIProps } from './registry';

interface Boyut {
  id: string;
  ad: string;
  gruplar: { id: string; ad: string }[];
}
interface Oge {
  id: string;
  ad: string;
  aciklama?: string;
  gorsel?: string;
  dogru?: Record<string, string>;
}
interface Veri {
  boyutlar: Boyut[];
  ogeler: Oge[];
  sorular?: Soru[];
}
interface State {
  atama: Record<string, Record<string, string>>;
  cevaplar: Record<string, string | string[]>;
}

export const initialEslestirme = (): State => ({ atama: {}, cevaplar: {} });

export default function Eslestirme({ task, mode, sim }: TaskUIProps) {
  const veri = task.veri as unknown as Veri;
  const s = sim.state as State;
  const learn = mode === 'ogren';
  const ata = (b: string, o: string, g: string) =>
    sim.act('atama', { boyut: b, oge: o, grup: g }, (st: State) => ({ ...st, atama: { ...st.atama, [b]: { ...(st.atama[b] ?? {}), [o]: g } } }));

  return (
    <div className="es">
      <div className="es-grid">
        {veri.ogeler.map((o) => (
          <div key={o.id} className="es-card card">
            <div className="es-head">
              {o.gorsel && <Photo name={o.gorsel} alt={o.ad} className="es-logo" fallback={<span className="es-logo ph">{o.ad[0]}</span>} />}
              <div>
                <b>{o.ad}</b>
                {o.aciklama && <small>{o.aciklama}</small>}
              </div>
            </div>
            {veri.boyutlar.map((b) => (
              <div key={b.id} className="es-row">
                <span className="es-label">{b.ad}</span>
                <div className="seg small">
                  {b.gruplar.map((g) => {
                    const on = s.atama[b.id]?.[o.id] === g.id;
                    const fb = learn && on && o.dogru?.[b.id] ? (o.dogru[b.id] === g.id ? ' good' : ' bad') : '';
                    return (
                      <button key={g.id} className={(on ? 'on' : '') + fb} onClick={() => ata(b.id, o.id, g.id)}>
                        {g.ad}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
    </div>
  );
}
