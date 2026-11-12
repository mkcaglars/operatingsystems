import { useEffect, useState } from 'react';
import { api } from '../api';
import { TopBar, useAuth, isStaff } from '../App';
import { campaignProgress, campaigns, stations, taskById, tasksOf } from '../content';
import { levelOf, LEVEL_LABEL } from '../core/scoring';

interface Status {
  en_iyi: { task_id: string; mode: string; score: number }[];
  ayarlar: { degerlendirme_acik: boolean; istege_bagli: Record<string, boolean> };
}

interface Bilet {
  id: number;
  task_id: string;
  mesaj: string;
  gonderen: string;
  created_at: string;
  okundu: boolean;
}

export default function StudentHome() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [biletler, setBiletler] = useState<Bilet[]>([]);

  useEffect(() => {
    api.get<Status>('tasks/status').then(setStatus).catch(() => undefined);
    api.post('presence', { station: '', task_id: '', info: 'Ana sayfa' }).catch(() => undefined);
    let alive = true;
    const yukle = () => api.get<Bilet[]>('commands/mine').then((b) => alive && setBiletler(b)).catch(() => undefined);
    yukle();
    const t = setInterval(yukle, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const bileteGit = (b: Bilet) => {
    api.post('commands/ack', { id: b.id }).catch(() => undefined);
    window.location.hash = `#/gorev/${b.task_id}`;
  };

  const best = (taskId: string) => {
    const list = status?.en_iyi.filter((b) => b.task_id === taskId) ?? [];
    return list.length ? Math.max(...list.map((b) => b.score)) : null;
  };

  return (
    <div className="page">
      <TopBar>{isStaff(user) && <a href="#/ogretmen">Öğretmen paneli</a>}</TopBar>
      <main className="container">
        <h2>Merhaba {user?.name.split(' ')[0]} 👋</h2>
        <p className="muted">
          Laboratuvardaki her istasyon bir bilgisayar işini öğretir. Bir görev seç; önce <b>Öğren</b> modunda incele, sonra <b>Uygula</b> modunda kendin yap.
          {status?.ayarlar.degerlendirme_acik && ' Öğretmenin değerlendirme modunu açtı.'}
        </p>
        {biletler.length > 0 && (
          <section className="tickets" aria-label="Servis biletleri">
            {biletler.map((b) => {
              const t = taskById(b.task_id);
              return (
                <div key={b.id} className={'ticket' + (b.okundu ? '' : ' new')}>
                  <span className="ticket-ic">🛠</span>
                  <div>
                    <b>Servis bileti #{b.id}: {t?.baslik ?? b.task_id}</b>
                    <small>
                      {b.gonderen} · {b.created_at.slice(11, 16)}
                      {b.mesaj && ` — “${b.mesaj}”`}
                    </small>
                  </div>
                  <button className="btn primary" onClick={() => bileteGit(b)}>
                    Arızaya git
                  </button>
                </div>
              );
            })}
          </section>
        )}
        <h3 className="sec-h">Kampanyalar</h3>
        <p className="muted small">Kampanyalar, gerçek bir işi baştan sona yaptıran görev dizileridir. Bir adımda en az 50 puan alınca sonraki adım açılır.</p>
        <div className="campaign-grid">
          {campaigns.map((c) => {
            const p = campaignProgress(c, best);
            return (
              <section key={c.id} className="campaign-card">
                <header>
                  <span className="station-code">{c.kod}</span>
                  <h3>{c.ad}</h3>
                  {p.biten > 0 && <span className={'level ' + levelOf(p.puan)}>{p.puan}</span>}
                </header>
                <p>{c.aciklama}</p>
                <div className="camp-bar" aria-label={`${p.biten} / ${c.adimlar.length} adım tamam`}>
                  <i style={{ width: `${(p.biten / c.adimlar.length) * 100}%` }} />
                </div>
                <ol className="camp-steps">
                  {p.adimlar.map((a) => {
                    const t = taskById(a.id);
                    const tamam = a.puan !== null && a.puan >= 50;
                    return (
                      <li key={a.id} className={tamam ? 'done' : a.acik ? 'open' : 'locked'}>
                        {a.acik ? <a href={`#/gorev/${a.id}?k=${c.id}`}>{t?.baslik ?? a.id}</a> : <span title="Önceki adımı tamamla">🔒 {t?.baslik ?? a.id}</span>}
                        {a.puan !== null && <span className={'level ' + levelOf(a.puan)}>{a.puan}</span>}
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
        <h3 className="sec-h">İstasyonlar</h3>
        <div className="station-grid">
          {stations.map((s) => {
            const list = tasksOf(s.id).filter((t) => !t.istege_bagli || !status || status.ayarlar.istege_bagli?.[t.istege_bagli]);
            return (
              <section key={s.id} className={'station-card' + (list.length ? '' : ' soon')}>
                <header>
                  <span className="station-code">{s.kod}</span>
                  <h3>{s.ad}</h3>
                </header>
                <p>{s.aciklama}</p>
                <div className="chips">
                  {s.kazanimlar.map((k) => (
                    <span key={k} className="chip">
                      {k}
                    </span>
                  ))}
                </div>
                {list.length === 0 ? (
                  <p className="soon-label">Hazırlanıyor</p>
                ) : (
                  <ul className="task-list">
                    {list.map((t) => {
                      const b = best(t.id);
                      return (
                        <li key={t.id}>
                          <a href={`#/gorev/${t.id}`}>{t.baslik}</a>
                          {t.istege_bagli && <span className="tag">isteğe bağlı</span>}
                          {b !== null && <span className={'level ' + levelOf(b)}>{b} · {LEVEL_LABEL[levelOf(b)]}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
