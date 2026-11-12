// İ1-G5 Kurulum öncesi hazırlık: yapılacaklar panosu + Windows 11 "Hakkında" penceresi + gereksinim belgesi.
import { toggleIn } from '../core/sim';
import type { TaskDef } from '../core/types';
import type { TaskUIProps } from './registry';

interface Madde {
  id: string;
  metin: string;
  dogru: boolean;
  aciklama: string;
}
interface Satir {
  id: string;
  ad: string;
  deger: string;
}
interface Veri {
  maddeler: Madde[];
  bilgisayar: Satir[];
  gereksinimler: Satir[];
}
export interface KurulumOncesiState {
  hazirlik: { secilen: string[] };
  gereksinim: { karar: 'uygun' | 'uygun-degil' | null; eksikler: string[] };
}

export function initialKurulumOncesi(): KurulumOncesiState {
  return { hazirlik: { secilen: [] }, gereksinim: { karar: null, eksikler: [] } };
}

export default function KurulumOncesi({ task, mode, sim }: TaskUIProps) {
  const veri = (task as TaskDef & { veri: Veri }).veri;
  const s = sim.state as KurulumOncesiState;
  const learn = mode === 'ogren';

  const toggle = (id: string, on: boolean) =>
    sim.act('hazirlik.toggle', { madde: id, secili: on }, (st: KurulumOncesiState) => ({ ...st, hazirlik: { secilen: toggleIn(st.hazirlik.secilen, id, on) } }));
  const karar = (k: 'uygun' | 'uygun-degil') =>
    sim.act('gereksinim.karar', { karar: k }, (st: KurulumOncesiState) => ({ ...st, gereksinim: { karar: k, eksikler: k === 'uygun' ? [] : st.gereksinim.eksikler } }));
  const eksik = (id: string, on: boolean) =>
    sim.act('gereksinim.eksik', { gereksinim: id, secili: on }, (st: KurulumOncesiState) => ({ ...st, gereksinim: { ...st.gereksinim, eksikler: toggleIn(st.gereksinim.eksikler, id, on) } }));

  return (
    <div className="ko">
      {/* Pano: yapılacaklar listesi */}
      <section className="clipboard">
        <div className="clip" aria-hidden />
        <div className="paper">
          <h3>Kurulumdan önce yapılacaklar</h3>
          <p className="paper-sub">İdari büro bilgisayarı · Windows 11 kurulumu</p>
          <ul>
            {veri.maddeler.map((m) => {
              const on = s.hazirlik.secilen.includes(m.id);
              return (
                <li key={m.id} className={learn && on ? (m.dogru ? 'good' : 'bad') : ''}>
                  <label>
                    <input type="checkbox" checked={on} onChange={(e) => toggle(m.id, e.target.checked)} />
                    <span className="pen">{m.metin}</span>
                  </label>
                  {learn && on && <small>{m.dogru ? '✔ ' : '✘ '}{m.aciklama}</small>}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className="ko-right">
        {/* Windows 11 Ayarlar › Sistem › Hakkında */}
        <section className="win11" aria-label="Ayarlar penceresi">
          <div className="win11-title">
            <span>Ayarlar</span>
            <span className="win11-ctrl" aria-hidden>
              <i>─</i>
              <i>☐</i>
              <i className="x">✕</i>
            </span>
          </div>
          <div className="win11-body">
            <p className="win11-crumb">
              Sistem <span>›</span> <b>Hakkında</b>
            </p>
            <div className="win11-card">
              <h4>Cihaz özellikleri</h4>
              <table>
                <tbody>
                  <tr>
                    <th>Cihaz adı</th>
                    <td>IDARI-BURO-01</td>
                  </tr>
                  {veri.bilgisayar.map((b) => (
                    <tr key={b.id}>
                      <th>{b.ad}</th>
                      <td>{b.deger}</td>
                    </tr>
                  ))}
                  <tr>
                    <th>Sistem türü</th>
                    <td>64 bit işletim sistemi, x64 tabanlı işlemci</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Gereksinim belgesi */}
        <section className="doc">
          <h4>Windows 11 sistem gereksinimleri</h4>
          <table>
            <tbody>
              {veri.gereksinimler.map((g) => (
                <tr key={g.id}>
                  <th>{g.ad}</th>
                  <td>{g.deger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Karar */}
        <section className="card decision">
          <h4>Kararın</h4>
          <div className="radio-row">
            <label className={s.gereksinim.karar === 'uygun' ? 'on' : ''}>
              <input type="radio" name="karar" checked={s.gereksinim.karar === 'uygun'} onChange={() => karar('uygun')} />
              Bu bilgisayar Windows 11 için <b>uygun</b>
            </label>
            <label className={s.gereksinim.karar === 'uygun-degil' ? 'on' : ''}>
              <input type="radio" name="karar" checked={s.gereksinim.karar === 'uygun-degil'} onChange={() => karar('uygun-degil')} />
              Bu bilgisayar Windows 11 için <b>uygun değil</b>
            </label>
          </div>
          {s.gereksinim.karar === 'uygun-degil' && (
            <>
              <p className="small">Hangi gereksinim(ler) karşılanmıyor?</p>
              <div className="check-grid">
                {veri.gereksinimler.map((g) => (
                  <label key={g.id}>
                    <input type="checkbox" checked={s.gereksinim.eksikler.includes(g.id)} onChange={(e) => eksik(g.id, e.target.checked)} /> {g.ad}
                  </label>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
