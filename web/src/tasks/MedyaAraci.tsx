// İ4 Kurulum medyası hazırlama: Rufus benzeri araçla ISO'yu USB belleğe yazma.
// Doğru aygıt (yedek diski değil!), doğru ISO, hedef bilgisayarın bellenimine uygun bölüm düzeni (UEFI→GPT, BIOS→MBR).
import { useEffect, useState } from 'react';
import Sorular, { type Soru } from '../components/Sorular';
import type { TaskUIProps } from './registry';

interface Aygit {
  id: string;
  ad: string;
}
interface Iso {
  id: string;
  ad: string;
  boyut: string;
}
export interface MedyaVeri {
  aygitlar: Aygit[];
  isolar: Iso[];
  hedefPc: { ad: string; satirlar: { ad: string; deger: string }[] };
  sorular?: Soru[];
}
type Veri = MedyaVeri;
export interface MedyaState {
  medya: { aygit: string | null; iso: string | null; bolum: 'GPT' | 'MBR'; hedef: 'UEFI' | 'BIOS'; dosya: 'NTFS' | 'FAT32'; etiket: string; durum: 'hazir' | 'yaziliyor' | 'bitti' };
  yazilan: { aygit: string; iso: string; bolum: string; hedef: string } | null;
  cevaplar: Record<string, string | string[]>;
}

type State = MedyaState;

export const initialMedyaAraci = (): State => ({
  medya: { aygit: null, iso: null, bolum: 'MBR', hedef: 'BIOS', dosya: 'NTFS', etiket: '', durum: 'hazir' },
  yazilan: null,
  cevaplar: {},
});

export default function MedyaAraci({ task, mode, sim, gomulu }: TaskUIProps & { gomulu?: { kapat: () => void } }) {
  const veri = task.veri as unknown as Veri;
  const s = sim.state as State;
  const m = s.medya;
  const learn = mode === 'ogren';
  const [onay, setOnay] = useState(false);
  const [pct, setPct] = useState(0);

  const set = (alan: keyof State['medya'], deger: string) =>
    sim.act('medya.set', { alan, deger }, (st: State) => {
      const md = { ...st.medya, [alan]: deger, durum: 'hazir' as const };
      // Rufus gibi: GPT yalnızca UEFI'ye, MBR yalnızca BIOS'a (ya da UEFI-CSM) önyükler
      if (alan === 'bolum') md.hedef = deger === 'GPT' ? 'UEFI' : 'BIOS';
      if (alan === 'iso') {
        const iso = veri.isolar.find((x) => x.id === deger);
        md.etiket = iso ? iso.ad.replace(/\.iso$/i, '').slice(0, 11).toUpperCase() : '';
        md.dosya = /win/i.test(deger) ? 'NTFS' : 'FAT32';
      }
      return { ...st, medya: md };
    });

  useEffect(() => {
    if (m.durum !== 'yaziliyor') return;
    setPct(0);
    const t0 = Date.now();
    const t = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - t0) / 4000) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(t);
        sim.act('medya.bitti', {}, (st: State) => ({ ...st, medya: { ...st.medya, durum: 'bitti' } }));
      }
    }, 120);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.durum]);

  const baslat = () => {
    setOnay(false);
    sim.act('medya.baslat', { aygit: m.aygit!, iso: m.iso!, bolum: m.bolum, hedef: m.hedef }, (st: State) => ({
      ...st,
      medya: { ...st.medya, durum: 'yaziliyor' },
      yazilan: { aygit: st.medya.aygit!, iso: st.medya.iso!, bolum: st.medya.bolum, hedef: st.medya.hedef },
    }));
  };

  const aygitAd = veri.aygitlar.find((a) => a.id === m.aygit)?.ad ?? '';
  const rufus = (
      <div className="rufus" role="dialog" aria-label="Rufus">
        <div className="rf-title">
          <span>🔧 Rufus 4.6.2208</span>
          <span className="win11-ctrl" aria-hidden>
            <i>─</i>
            <i className="x">✕</i>
          </span>
        </div>
        <div className="rf-body">
          <div className="rf-sec">Sürücü Özellikleri</div>
          <label>
            Aygıt
            <select value={m.aygit ?? ''} onChange={(e) => set('aygit', e.target.value)} disabled={m.durum === 'yaziliyor'}>
              <option value="">— seçin —</option>
              {veri.aygitlar.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.ad}
                </option>
              ))}
            </select>
          </label>
          <label>
            Önyükleme seçimi
            <select value={m.iso ?? ''} onChange={(e) => set('iso', e.target.value)} disabled={m.durum === 'yaziliyor'}>
              <option value="">Disk ya da ISO kalıbı (lütfen seçin)</option>
              {veri.isolar.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.ad} ({i.boyut})
                </option>
              ))}
            </select>
          </label>
          <div className="rf-2">
            <label>
              Bölüm düzeni
              <select value={m.bolum} onChange={(e) => set('bolum', e.target.value)} disabled={m.durum === 'yaziliyor'}>
                <option value="MBR">MBR</option>
                <option value="GPT">GPT</option>
              </select>
            </label>
            <label>
              Hedef sistem
              <select value={m.hedef} disabled>
                <option value="BIOS">BIOS (ya da UEFI-CSM)</option>
                <option value="UEFI">UEFI (CSM olmayan)</option>
              </select>
            </label>
          </div>
          <div className="rf-sec">Biçimlendirme Seçenekleri</div>
          <div className="rf-2">
            <label>
              Birim etiketi
              <input value={m.etiket} readOnly />
            </label>
            <label>
              Dosya sistemi
              <input value={m.dosya} readOnly />
            </label>
          </div>
          <div className="rf-sec">Durum</div>
          <div className={'rf-status ' + m.durum}>
            <i style={{ width: (m.durum === 'bitti' ? 100 : m.durum === 'yaziliyor' ? pct : 0) + '%' }} />
            <span>{m.durum === 'bitti' ? 'HAZIR' : m.durum === 'yaziliyor' ? `ISO dosyaları kopyalanıyor: ${pct}%` : 'HAZIR'}</span>
          </div>
          <div className="rf-btns">
            <button className="btn" disabled={!m.aygit || !m.iso || m.durum === 'yaziliyor'} onClick={() => setOnay(true)}>
              BAŞLAT
            </button>
            <button className="btn" disabled={!gomulu || m.durum === 'yaziliyor'} onClick={() => gomulu?.kapat()}>
              KAPAT
            </button>
          </div>
          {m.durum === 'bitti' && s.yazilan && (
            <p className="small ok-text">
              ✔ {veri.isolar.find((i) => i.id === s.yazilan!.iso)?.ad} → {veri.aygitlar.find((a) => a.id === s.yazilan!.aygit)?.ad} ({s.yazilan.bolum}, {s.yazilan.hedef})
            </p>
          )}
        </div>
        {onay && (
          <div className="rf-dialog">
            <b>⚠ Rufus</b>
            <p>
              UYARI: '{aygitAd}' AYGITINDAKİ TÜM VERİLER YOK EDİLECEK.
              <br />
              Devam etmek için TAMAM'a, çıkmak için İPTAL'e tıklayın.
            </p>
            <div className="row">
              <button className="btn primary" onClick={baslat}>
                TAMAM
              </button>
              <button className="btn" onClick={() => setOnay(false)}>
                İPTAL
              </button>
            </div>
          </div>
        )}
      </div>
  );
  if (gomulu) return rufus;
  return (
    <div className="ma">
      {rufus}
      <div className="ma-side">
        <section className="doc">
          <h4>{veri.hedefPc.ad}</h4>
          <table>
            <tbody>
              {veri.hedefPc.satirlar.map((r) => (
                <tr key={r.ad}>
                  <th>{r.ad}</th>
                  <td>{r.deger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {learn && (
          <div className="note info small">
            Hedef bilgisayar <b>UEFI</b> ise bölüm düzeni <b>GPT</b>, eski <b>BIOS (Legacy)</b> ise <b>MBR</b> seçilir. Aygıt listesinde yedek diskin de göründüğüne dikkat et!
          </div>
        )}
        {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
      </div>
    </div>
  );
}
