// İ1-G1 Klavye ve fare seçimi: her müşterinin ihtiyacına uygun ürünü katalogdan seçme.
import { useState } from 'react';
import Photo from '../components/Photo';
import Sorular, { type Soru } from '../components/Sorular';
import type { TaskUIProps } from './registry';

interface Urun {
  id: string;
  tur: 'klavye' | 'fare';
  ad: string;
  ozellikler: string[];
}
interface Musteri {
  id: string;
  kisi: string;
  gorsel?: string;
  ihtiyac: string;
  istenen: ('klavye' | 'fare')[];
  dogru?: Record<string, string>;
}
interface Veri {
  katalog: Urun[];
  musteriler: Musteri[];
  sorular?: Soru[];
}
interface State {
  secim: Record<string, Record<string, string>>;
  cevaplar: Record<string, string | string[]>;
}

export const initialCevreBirimi = (): State => ({ secim: {}, cevaplar: {} });

export default function CevreBirimi({ task, mode, sim }: TaskUIProps) {
  const veri = task.veri as unknown as Veri;
  const s = sim.state as State;
  const learn = mode === 'ogren';
  const [aktif, setAktif] = useState<{ m: string; tur: 'klavye' | 'fare' } | null>({ m: veri.musteriler[0].id, tur: veri.musteriler[0].istenen[0] });

  const ata = (u: Urun) => {
    if (!aktif || aktif.tur !== u.tur) return;
    sim.act('secim.ata', { musteri: aktif.m, tur: u.tur, urun: u.id }, (st: State) => ({ ...st, secim: { ...st.secim, [aktif.m]: { ...(st.secim[aktif.m] ?? {}), [u.tur]: u.id } } }));
    // Sıradaki boş yuvaya geç
    for (const m of veri.musteriler) for (const t of m.istenen) if (!(m.id === aktif.m && t === u.tur) && !s.secim[m.id]?.[t]) return setAktif({ m: m.id, tur: t });
  };
  const urun = (id?: string) => veri.katalog.find((u) => u.id === id);

  return (
    <div className="cb">
      <div className="cb-customers">
        {veri.musteriler.map((m) => (
          <div key={m.id} className="cb-customer card">
            <div className="cb-who">
              {m.gorsel && <Photo name={m.gorsel} alt={m.kisi} className="avatar" fallback={<span className="avatar ph">{m.kisi[0]}</span>} />}
              <div>
                <b>{m.kisi}</b>
                <p>{m.ihtiyac}</p>
              </div>
            </div>
            <div className="cb-slots">
              {m.istenen.map((t) => {
                const sel = urun(s.secim[m.id]?.[t]);
                const on = aktif?.m === m.id && aktif.tur === t;
                const fb = learn && sel && m.dogru ? (m.dogru[t] === sel.id ? 'good' : 'bad') : '';
                return (
                  <button key={t} className={'cb-slot ' + (on ? 'on ' : '') + fb} onClick={() => setAktif({ m: m.id, tur: t })}>
                    <small>{t === 'klavye' ? 'Klavye' : 'Fare'}</small>
                    {sel ? sel.ad : <i>Seçmek için tıkla, sonra katalogdan ürün seç</i>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <section className="cb-catalog">
        <h4>Ürün kataloğu {aktif && <span className="muted small">— şimdi seçilen: {veri.musteriler.find((m) => m.id === aktif.m)?.kisi} için {aktif.tur}</span>}</h4>
        <div className="cb-grid">
          {veri.katalog.map((u) => (
            <button key={u.id} className={'cb-item ' + (aktif && aktif.tur !== u.tur ? 'dim' : '')} onClick={() => ata(u)} disabled={!aktif || aktif.tur !== u.tur}>
              <Photo name={u.id} alt={u.ad} className="cb-img" fallback={<span className="cb-img ph">{u.tur === 'klavye' ? '⌨️' : '🖱️'}</span>} />
              <b>{u.ad}</b>
              <ul>
                {u.ozellikler.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </section>
      {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
    </div>
  );
}
