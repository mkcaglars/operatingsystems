// Görev Yöneticisi: İşlemler, Performans, Başlangıç uygulamaları.
import { useState } from 'react';
import type { AppCtx } from './Masaustu';

export default function GorevYoneticisi(ctx: AppCtx) {
  const { pc, act } = ctx;
  const [tab, setTab] = useState<'islem' | 'perf' | 'basla'>('islem');
  const [sec, setSec] = useState<string | null>(null);
  const [sira, setSira] = useState<'ram' | 'cpu' | 'ad'>('ram');
  const [uyari, setUyari] = useState<string | null>(null);
  const topRam = pc.surecler.reduce((a, s) => a + s.ram, 0) + 3100;
  const topCpu = Math.min(100, pc.surecler.reduce((a, s) => a + s.cpu, 0) + 2);
  const liste = [...pc.surecler].sort((a, b) => (sira === 'ad' ? a.ad.localeCompare(b.ad, 'tr') : sira === 'cpu' ? b.cpu - a.cpu : b.ram - a.ram));
  const secili = pc.surecler.find((s) => s.id === sec);
  const secB = pc.baslangic.find((b) => b.id === sec);

  const sonlandir = () => {
    if (!secili) return;
    if (secili.sistem) {
      setUyari(`"${secili.ad}" bir Windows sistem işlemidir. Sonlandırılırsa Windows kararsız hale gelebilir ya da kapanabilir.`);
      return;
    }
    act('gorev.sonlandir', { surec: secili.id }, (p) => ((p.surecler = p.surecler.filter((x) => x.id !== secili.id)), p));
    setSec(null);
  };

  return (
    <div className="tm">
      <nav className="tm-nav">
        <button className={tab === 'islem' ? 'on' : ''} onClick={() => (setTab('islem'), setSec(null))}>
          ▤ İşlemler
        </button>
        <button className={tab === 'perf' ? 'on' : ''} onClick={() => setTab('perf')}>
          📈 Performans
        </button>
        <button className={tab === 'basla' ? 'on' : ''} onClick={() => (setTab('basla'), setSec(null))}>
          🚀 Başlangıç uygulamaları
        </button>
      </nav>
      <main className="tm-main">
        {tab === 'islem' && (
          <>
            <div className="tm-bar">
              <h3>İşlemler</h3>
              <button className="ws-btn" disabled={!secili} onClick={sonlandir}>
                ⊘ Görevi sonlandır
              </button>
            </div>
            <table className="tm-table">
              <thead>
                <tr>
                  <th onClick={() => setSira('ad')}>Ad</th>
                  <th onClick={() => setSira('cpu')} className={sira === 'cpu' ? 'sort' : ''}>
                    {topCpu.toFixed(0)}%<br />
                    CPU
                  </th>
                  <th onClick={() => setSira('ram')} className={sira === 'ram' ? 'sort' : ''}>
                    %{Math.round((topRam / 16384) * 100)}
                    <br />
                    Bellek
                  </th>
                </tr>
              </thead>
              <tbody>
                {liste.map((s) => (
                  <tr key={s.id} className={sec === s.id ? 'on' : ''} onClick={() => setSec(s.id)}>
                    <td>{s.ad}</td>
                    <td className={s.cpu > 10 ? 'hot' : ''}>{s.cpu.toFixed(1).replace('.', ',')}%</td>
                    <td className={s.ram > 1000 ? 'hot' : ''}>{s.ram.toLocaleString('tr-TR')} MB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {tab === 'perf' && (
          <div className="tm-perf">
            <div className="tm-card">
              <b>CPU</b>
              <span className="big">%{topCpu.toFixed(0)}</span>
              <small>{pc.cihaz.islemci}</small>
            </div>
            <div className="tm-card">
              <b>Bellek</b>
              <span className="big">
                {(topRam / 1024).toFixed(1).replace('.', ',')}/16,0 GB
              </span>
              <small>%{Math.round((topRam / 16384) * 100)} kullanımda</small>
            </div>
            <div className="tm-card">
              <b>Disk 0 (C:)</b>
              <span className="big">%2</span>
              <small>{pc.cihaz.depolama}</small>
            </div>
            <div className="tm-card">
              <b>GPU 0</b>
              <span className="big">%1</span>
              <small>{pc.cihaz.ekranKarti}</small>
            </div>
          </div>
        )}
        {tab === 'basla' && (
          <>
            <div className="tm-bar">
              <h3>Başlangıç uygulamaları</h3>
              <button className="ws-btn" disabled={!secB || secB.acik} onClick={() => secB && act('baslangic.ayarla', { uygulama: secB.id, acik: true }, (p) => ((p.baslangic.find((x) => x.id === secB.id)!.acik = true), p))}>
                Etkinleştir
              </button>
              <button className="ws-btn" disabled={!secB || !secB.acik} onClick={() => secB && act('baslangic.ayarla', { uygulama: secB.id, acik: false }, (p) => ((p.baslangic.find((x) => x.id === secB.id)!.acik = false), p))}>
                Devre dışı bırak
              </button>
            </div>
            <table className="tm-table">
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>Yayımcı</th>
                  <th>Durum</th>
                  <th>Başlangıç etkisi</th>
                </tr>
              </thead>
              <tbody>
                {pc.baslangic.map((b) => (
                  <tr key={b.id} className={sec === b.id ? 'on' : ''} onClick={() => setSec(b.id)}>
                    <td>{b.ad}</td>
                    <td>{b.yayinci}</td>
                    <td>{b.acik ? 'Etkin' : 'Devre dışı'}</td>
                    <td className={b.etki === 'Yüksek' ? 'hot' : ''}>{b.etki}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </main>
      {uyari && (
        <div className="ws-modal">
          <div className="ws-dlg">
            <div className="ws-h">Görev Yöneticisi</div>
            <p>{uyari}</p>
            <div className="ws-foot">
              <button
                className="ws-btn"
                onClick={() => {
                  ctx.log('gorev.sistem-uyari', { surec: sec ?? '' });
                  setUyari(null);
                }}
              >
                İptal (önerilen)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
