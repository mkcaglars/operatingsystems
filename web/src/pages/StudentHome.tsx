import { useEffect, useState } from 'react';
import { api } from '../api';
import { TopBar, useAuth, isStaff } from '../App';
import { stations, tasksOf } from '../content';
import { levelOf, LEVEL_LABEL } from '../core/scoring';

interface Status {
  en_iyi: { task_id: string; mode: string; score: number }[];
  ayarlar: { degerlendirme_acik: boolean; istege_bagli: Record<string, boolean> };
}

export default function StudentHome() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    api.get<Status>('tasks/status').then(setStatus).catch(() => undefined);
    api.post('presence', { station: '', task_id: '', info: 'Ana sayfa' }).catch(() => undefined);
  }, []);

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
