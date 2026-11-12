// İ1-G3 UPS seçimi: UPS'e bağlanacak cihazları seç, toplam gücü ve gereken VA değerini hesapla, uygun modeli seç.
import Photo from '../components/Photo';
import Sorular, { type Soru } from '../components/Sorular';
import { toggleIn } from '../core/sim';
import type { TaskUIProps } from './registry';

interface Cihaz {
  id: string;
  ad: string;
  watt: number;
  not?: string;
}
interface Model {
  id: string;
  ad: string;
  tur: string;
  va: number;
  w: number;
  ozellikler: string[];
  fiyat: string;
  gorsel: string;
}
interface Veri {
  cihazlar: Cihaz[];
  katsayi: number;
  modeller: Model[];
  sorular?: Soru[];
}
interface State {
  ups: { cihazlar: string[]; toplamW: number | null; va: number | null; model: string | null };
  cevaplar: Record<string, string | string[]>;
}

export const initialUpsSecimi = (): State => ({ ups: { cihazlar: [], toplamW: null, va: null, model: null }, cevaplar: {} });

const num = (v: string): number | null => {
  const n = Number(v.replace(',', '.'));
  return v.trim() === '' || !Number.isFinite(n) ? null : n;
};

export default function UpsSecimi({ task, mode, sim }: TaskUIProps) {
  const veri = task.veri as unknown as Veri;
  const s = sim.state as State;
  const learn = mode === 'ogren';
  const set = (key: keyof State['ups'], value: number | string | null) =>
    sim.act('ups.' + key, { deger: value }, (st: State) => ({ ...st, ups: { ...st.ups, [key]: value } }));
  const gercekToplam = veri.cihazlar.filter((c) => s.ups.cihazlar.includes(c.id)).reduce((a, c) => a + c.watt, 0);

  return (
    <div className="ups">
      <section className="doc ups-sheet">
        <h4>İdari büro — UPS ihtiyaç listesi</h4>
        <table>
          <thead>
            <tr>
              <th>UPS'e bağla</th>
              <th>Cihaz</th>
              <th>Güç</th>
            </tr>
          </thead>
          <tbody>
            {veri.cihazlar.map((c) => (
              <tr key={c.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={s.ups.cihazlar.includes(c.id)}
                    onChange={(e) => sim.act('ups.cihaz', { cihaz: c.id, secili: e.target.checked }, (st: State) => ({ ...st, ups: { ...st.ups, cihazlar: toggleIn(st.ups.cihazlar, c.id, e.target.checked) } }))}
                    aria-label={c.ad}
                  />
                </td>
                <td>
                  {c.ad}
                  {c.not && <small className="muted"> — {c.not}</small>}
                </td>
                <td>{c.watt} W</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ups-calc">
          <label>
            Seçilen cihazların toplam gücü (W)
            <input inputMode="decimal" value={s.ups.toplamW ?? ''} onChange={(e) => set('toplamW', num(e.target.value))} />
          </label>
          <label>
            Gereken en az UPS gücü (VA) = W × {String(veri.katsayi).replace('.', ',')}
            <input inputMode="decimal" value={s.ups.va ?? ''} onChange={(e) => set('va', num(e.target.value))} />
          </label>
          {learn && s.ups.toplamW !== null && (
            <p className={'small ' + (s.ups.toplamW === gercekToplam ? 'ok-text' : 'err-text')}>
              {s.ups.toplamW === gercekToplam ? '✔ Toplam doğru.' : `✘ Seçtiğin cihazların toplamı ${gercekToplam} W olmalı.`}
              {s.ups.va !== null && ` VA için ${s.ups.toplamW} × ${veri.katsayi} = ${Math.round(s.ups.toplamW * veri.katsayi)} VA.`}
            </p>
          )}
        </div>
      </section>

      <section className="ups-models">
        <h4>Teklif gelen UPS modelleri</h4>
        <div className="ups-grid">
          {veri.modeller.map((m) => (
            <button key={m.id} className={'ups-card ' + (s.ups.model === m.id ? 'on' : '')} onClick={() => set('model', m.id)}>
              <Photo name={m.gorsel} alt={m.ad} className="ups-img" fallback={<span className="ups-img ph">🔋</span>} />
              <b>{m.ad}</b>
              <span className="tag blue">{m.tur}</span>
              <span className="ups-cap">
                {m.va} VA / {m.w} W
              </span>
              <ul>
                {m.ozellikler.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              <span className="price">{m.fiyat}</span>
            </button>
          ))}
        </div>
      </section>
      {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
    </div>
  );
}
