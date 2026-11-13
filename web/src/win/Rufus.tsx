// Windows içinde çalışan Rufus: takılı USB bellekleri ve İndirilenler'deki ISO dosyalarını görür.
// Yazma bitince kum havuzuna (gerçek donanıma) bildirilir: seçilen bellek Windows 11 kurulum belleği olur.
import { useEffect, useRef } from 'react';
import { useSim } from '../core/sim';
import { adOf } from '../core/winpc';
import MedyaAraci, { initialMedyaAraci, type MedyaState, type MedyaVeri } from '../tasks/MedyaAraci';
import type { TaskDef } from '../core/types';
import type { AppCtx } from './Masaustu';

export default function Rufus(ctx: AppCtx) {
  const sim = useSim<MedyaState>(initialMedyaAraci());
  const bildirildi = useRef(false);
  const usbler = ctx.kopru?.usbler ?? [];
  const isolar = Object.entries(ctx.pc.fs).filter(([p, f]) => f.tur === 'dosya' && /\.iso$/i.test(p));
  const veri: MedyaVeri = {
    aygitlar: usbler.map((u) => ({ id: u.id, ad: `${u.ad} (${u.harf}) [${u.kapasite}]` })),
    isolar: isolar.map(([p, f]) => ({ id: p, ad: adOf(p), boyut: f.boyut ?? '' })),
    hedefPc: { ad: '', satirlar: [] },
  };
  const task = { veri } as unknown as TaskDef;

  useEffect(() => {
    const m = sim.state.medya;
    if (m.durum === 'yaziliyor') bildirildi.current = false;
    if (m.durum === 'bitti' && sim.state.yazilan && !bildirildi.current) {
      bildirildi.current = true;
      const y = sim.state.yazilan;
      ctx.log('rufus.yaz', { aygit: y.aygit, iso: adOf(y.iso), bolum: y.bolum, hedef: y.hedef });
      ctx.kopru?.rufusBitti({ ...y, iso: adOf(y.iso) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.state.medya.durum]);

  return (
    <div className="rufus-app">
      {usbler.length === 0 && <p className="note small">Takılı USB bellek yok. Bilgisayarın USB girişine bir flash bellek takın.</p>}
      {isolar.length === 0 && <p className="note small">ISO kalıbı bulunamadı. Önce Microsoft'un sitesinden Windows 11 ISO dosyasını indirin.</p>}
      <MedyaAraci task={task} mode="uygula" sim={sim} gomulu={{ kapat: () => ctx.close('rufus') }} />
    </div>
  );
}
