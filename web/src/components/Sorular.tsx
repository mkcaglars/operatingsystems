// Görevlerin içine gömülen kısa bilgi soruları (tek ya da çok seçimli).
// Cevaplar sim durumunda "cevaplar.<soruId>" altında tutulur: tek seçimde metin, çok seçimde dizi.
import type { Sim } from '../core/sim';
import { toggleIn } from '../core/sim';

export interface Soru {
  id: string;
  soru: string;
  coklu?: boolean;
  secenekler: { id: string; metin: string; dogru?: boolean; aciklama?: string }[];
}

type WithCevap = { cevaplar: Record<string, string | string[]> };

export default function Sorular({ sorular, sim, learn, title = 'Sorular' }: { sorular: Soru[]; sim: Sim<WithCevap>; learn: boolean; title?: string }) {
  const cev = sim.state.cevaplar ?? {};
  return (
    <section className="card sorular">
      <h4>{title}</h4>
      {sorular.map((q) => {
        const val = cev[q.id];
        return (
          <fieldset key={q.id}>
            <legend>
              {q.soru} {q.coklu && <small className="muted">(birden çok seçilebilir)</small>}
            </legend>
            {q.secenekler.map((o) => {
              const on = q.coklu ? Array.isArray(val) && val.includes(o.id) : val === o.id;
              const fb = learn && on && o.dogru !== undefined ? (o.dogru ? 'good' : 'bad') : '';
              return (
                <label key={o.id} className={'opt ' + fb}>
                  <input
                    type={q.coklu ? 'checkbox' : 'radio'}
                    name={q.id}
                    checked={on}
                    onChange={(e) =>
                      sim.act('soru.cevap', { soru: q.id, secenek: o.id, secili: q.coklu ? e.target.checked : true }, (s) => ({
                        ...s,
                        cevaplar: {
                          ...s.cevaplar,
                          [q.id]: q.coklu ? toggleIn((Array.isArray(s.cevaplar?.[q.id]) ? s.cevaplar[q.id] : []) as string[], o.id, e.target.checked) : o.id,
                        },
                      }))
                    }
                  />
                  <span>
                    {o.metin}
                    {fb && o.aciklama && <small>{o.aciklama}</small>}
                  </span>
                </label>
              );
            })}
          </fieldset>
        );
      })}
    </section>
  );
}
