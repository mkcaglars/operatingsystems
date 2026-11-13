import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api';
import { TopBar } from '../App';
import { campaigns, outcomeText, stationById, taskById } from '../content';
import { evaluate, type Rule, type SimEvent } from '../core/rules';
import { levelOf, LEVEL_LABEL, type ScoreResult } from '../core/scoring';
import { useSim } from '../core/sim';
import { sistemiTamamla, type WinPc } from '../core/winpc';
import type { Mode, TaskDef } from '../core/types';
import { taskUIs } from '../tasks/registry';

const MODE_LABEL: Record<Mode, string> = { ogren: 'Öğren', uygula: 'Uygula', degerlendir: 'Değerlendir' };
const MODE_DESC: Record<Mode, string> = {
  ogren: 'Rehberli anlatım. Yaptıkların anında açıklanır. Puan verilmez.',
  uygula: 'Görevi kendin yap. İstersen ipucu alabilirsin (her ipucu 5 puan düşürür).',
  degerlendir: 'Öğretmeninin açtığı ölçme modu. İpucu ve anlık geri bildirim yok.',
};

interface Saved {
  attempt_id: number;
  mode: Mode;
  state: unknown;
  events: SimEvent[];
  hints: number;
}

export default function TaskPage({ taskId }: { taskId: string }) {
  const task = taskById(taskId);
  if (!task || !taskUIs[task.arayuz]) {
    return (
      <div className="page">
        <TopBar />
        <main className="container">
          <p>Görev bulunamadı.</p>
          <a href="#/">Görevlere dön</a>
        </main>
      </div>
    );
  }
  return <TaskRunner key={taskId} task={task} />;
}

function TaskRunner({ task }: { task: TaskDef }) {
  const ui = taskUIs[task.arayuz];
  const sim = useSim<unknown>(ui.initial(task));
  const [phase, setPhase] = useState<'intro' | 'running' | 'result'>('intro');
  const [mode, setMode] = useState<Mode>('uygula');
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [hints, setHints] = useState(0);
  const [degerlendirAcik, setDegerlendirAcik] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [result, setResult] = useState<{ sonuc: ScoreResult; sure: number; mode: Mode } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const version = useRef(0);
  const station = stationById(task.istasyon);
  const scope = 'g-' + task.id;

  useEffect(() => {
    api.get<{ ayarlar: { degerlendirme_acik: boolean } }>('tasks/status').then((s) => setDegerlendirAcik(s.ayarlar.degerlendirme_acik)).catch(() => undefined);
    api
      .get<{ data: Saved | null; version: number }>('state', { scope })
      .then((r) => {
        version.current = r.version;
        if (r.data && r.data.attempt_id) setSaved(r.data);
      })
      .catch(() => undefined);
  }, [scope]);

  const save = useCallback(
    async (data: Saved | null) => {
      try {
        const r = await api.post<{ version: number }>('state/save', { scope, data, version: version.current });
        version.current = r.version;
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          const r = await api.get<{ version: number }>('state', { scope });
          version.current = r.version;
        }
      }
    },
    [scope],
  );

  // Çalışırken düzenli kayıt (öğrenci başka bilgisayardan devam edebilir) ve canlı izleme bildirimi
  const latest = useRef<Saved | null>(null);
  latest.current = attemptId ? { attempt_id: attemptId, mode, state: sim.state, events: sim.events, hints } : null;
  useEffect(() => {
    if (phase !== 'running') return;
    const t = setTimeout(() => latest.current && save(latest.current), 2500);
    return () => clearTimeout(t);
  }, [sim.events.length, hints, phase, save]);
  useEffect(() => {
    if (phase !== 'running') return;
    const ping = () => api.post('presence', { station: task.istasyon, task_id: task.id, info: `${MODE_LABEL[mode]} · ${sim.events.length} adım` }).catch(() => undefined);
    ping();
    const t = setInterval(ping, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, task.id]);

  async function start(m: Mode) {
    setErr('');
    setBusy(true);
    try {
      const r = await api.post<{ attempt_id: number }>('attempts/start', { task_id: task.id, mode: m });
      sim.restore(ui.initial(task), []);
      setMode(m);
      setHints(0);
      setAttemptId(r.attempt_id);
      setResult(null);
      setPhase('running');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function resume(s: Saved) {
    // Eski sürümde kaydedilmiş Windows durumu: eksik sistem klasörleri tamamlanır
    const durum = s.state as { pc?: WinPc } | null;
    sim.restore(durum && typeof durum === 'object' && durum.pc ? { ...durum, pc: sistemiTamamla(durum.pc) } : s.state, s.events);
    setMode(s.mode);
    setHints(s.hints);
    setAttemptId(s.attempt_id);
    setPhase('running');
  }

  async function hint() {
    if (!attemptId) return;
    try {
      const r = await api.post<{ hints: number }>('attempts/hint', { attempt_id: attemptId });
      setHints(r.hints);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function submit() {
    if (!attemptId) return;
    if (mode !== 'ogren' && !confirm('Görevi teslim etmek istiyor musun? Teslimden sonra değişiklik yapılamaz.')) return;
    setBusy(true);
    setErr('');
    try {
      const r = await api.post<{ sonuc: ScoreResult; sure: number; mode: Mode }>('attempts/submit', { attempt_id: attemptId, events: sim.events, final_state: sim.state });
      setResult(r);
      setPhase('result');
      setSaved(null);
      await save(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setErr('Bu deneme başka bir pencerede teslim edilmiş. Yeni bir deneme başlat.');
        setPhase('intro');
        setSaved(null);
        await save(null);
      } else setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const Comp = ui.Component;
  const shownHints = task.ipuclari?.slice(0, hints) ?? [];

  return (
    <div className="page">
      <TopBar>
        <a href="#/">← Görevler</a>
      </TopBar>
      <main className={phase === 'running' ? 'task-layout' : 'container'}>
        {phase === 'intro' && (
          <div className="task-intro">
            <p className="crumb">
              {station?.kod} · {station?.ad}
            </p>
            <h2>{task.baslik}</h2>
            <p className="scenario">{task.senaryo}</p>
            <div className="chips">
              {task.kazanimlar.map((k) => (
                <span key={k} className="chip" title={outcomeText(k)}>
                  {k} · {outcomeText(k)}
                </span>
              ))}
            </div>
            {saved && (
              <div className="note info">
                Yarım kalmış bir çalışman var ({MODE_LABEL[saved.mode]} modu, {saved.events.length} adım).{' '}
                <button className="btn primary" onClick={() => resume(saved)}>
                  Kaldığın yerden devam et
                </button>
              </div>
            )}
            <div className="mode-grid">
              {(['ogren', 'uygula', 'degerlendir'] as Mode[]).map((m) => {
                const closed = m === 'degerlendir' && !degerlendirAcik;
                return (
                  <button key={m} className={'mode-card ' + m} disabled={busy || closed} onClick={() => start(m)}>
                    <b>{MODE_LABEL[m]}</b>
                    <span>{closed ? 'Öğretmenin henüz açmadı.' : MODE_DESC[m]}</span>
                  </button>
                );
              })}
            </div>
            {err && <div className="note error">{err}</div>}
          </div>
        )}

        {phase === 'running' && (
          <>
            <div className="task-bar">
              <div>
                <span className={'mode-pill ' + mode}>{MODE_LABEL[mode]}</span> <b>{task.baslik}</b>
              </div>
              <div className="task-actions">
                {mode === 'uygula' && (task.ipuclari?.length ?? 0) > hints && (
                  <button className="btn" onClick={hint}>
                    💡 İpucu ({hints}/{task.ipuclari?.length})
                  </button>
                )}
                <button className="btn primary" onClick={submit} disabled={busy}>
                  {mode === 'ogren' ? 'Bitir' : 'Teslim et'}
                </button>
              </div>
            </div>
            <div className="task-main">
              <div className="task-stage">
                <p className="scenario small">{task.senaryo}</p>
                <Comp task={task} mode={mode} sim={sim} />
              </div>
              {(mode === 'ogren' || shownHints.length > 0) && (
                <aside className="task-side">
                  {mode === 'ogren' && (
                    <>
                      <h4>Bilmen gerekenler</h4>
                      {task.ogren?.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                      <h4>Kontrol listesi</h4>
                      <ul className="checks">
                        {task.kriterler.map((k) => {
                          const ok = evaluate(k.kural as Rule, { state: sim.state as never, events: sim.events });
                          return (
                            <li key={k.id} className={ok ? 'ok' : ''}>
                              {ok ? '✔' : '○'} {k.aciklama}
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                  {shownHints.length > 0 && (
                    <>
                      <h4>İpuçları</h4>
                      {shownHints.map((h, i) => (
                        <p key={i} className="hint">
                          💡 {h}
                        </p>
                      ))}
                    </>
                  )}
                </aside>
              )}
            </div>
            {err && <div className="note error">{err}</div>}
          </>
        )}

        {phase === 'result' && result && <ResultView task={task} r={result} onRetry={() => setPhase('intro')} />}
      </main>
    </div>
  );
}

function ResultView({ task, r, onRetry }: { task: TaskDef; r: { sonuc: ScoreResult; sure: number; mode: Mode }; onRetry: () => void }) {
  const s = r.sonuc;
  const scored = r.mode !== 'ogren';
  const dk = Math.floor(r.sure / 60);
  const sn = r.sure % 60;
  return (
    <div className="result">
      <p className="crumb">{MODE_LABEL[r.mode]} modu · {task.baslik}</p>
      {scored ? (
        <div className={'score-big ' + levelOf(s.puan)}>
          <b>{s.puan}</b>
          <span>{LEVEL_LABEL[levelOf(s.puan)]}</span>
        </div>
      ) : (
        <h2>Öğren modu tamamlandı</h2>
      )}
      <div className="score-parts">
        <div>
          <b>{s.basari}</b>
          <span>Başarı</span>
        </div>
        <div>
          <b>{s.surec}</b>
          <span>Süreç</span>
        </div>
        <div>
          <b>{s.sure}</b>
          <span>
            Süre ({dk} dk {sn} sn)
          </span>
        </div>
        {s.ipucu > 0 && (
          <div>
            <b>−{s.ipucu}</b>
            <span>İpucu</span>
          </div>
        )}
      </div>
      <h3>Ne yaptın?</h3>
      <ul className="checks">
        {s.kriterler.map((k) => (
          <li key={k.id} className={k.gecti ? 'ok' : 'no'}>
            {k.gecti ? '✔' : '✘'} {k.aciklama}
          </li>
        ))}
      </ul>
      {s.hatalar.length > 0 && (
        <>
          <h3>Yapılmaması gerekenler</h3>
          <ul className="checks">
            {s.hatalar.map((h) => (
              <li key={h.id} className="no">
                ⚠ {h.aciklama} (−{h.ceza})
              </li>
            ))}
          </ul>
        </>
      )}
      {scored && (
        <>
          <h3>Kazanımlar</h3>
          <ul className="outcomes">
            {Object.entries(s.kazanimlar).map(([k, p]) => (
              <li key={k}>
                <span className={'level ' + levelOf(p)}>{k}</span> {outcomeText(k)} — <b>{p}</b> ({LEVEL_LABEL[levelOf(p)]})
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="row">
        <button className="btn primary" onClick={onRetry}>
          Tekrar dene
        </button>
        <a className="btn" href="#/">
          Görevlere dön
        </a>
        <KampanyaSonraki taskId={task.id} puan={s.puan} />
      </div>
    </div>
  );
}

/** Kampanyadan gelindiyse (…?k=k1) sonraki adıma geçiş düğmesi */
function KampanyaSonraki({ taskId, puan }: { taskId: string; puan: number }) {
  const k = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('k');
  const c = campaigns.find((x) => x.id === k);
  if (!c) return null;
  const i = c.adimlar.indexOf(taskId);
  if (i < 0) return null;
  if (i === c.adimlar.length - 1) return <span className="ok-text">🏁 {c.kod} {c.ad} kampanyasının son adımı!</span>;
  if (puan < 50) return <span className="muted small">Kampanyada ilerlemek için en az 50 puan gerekir.</span>;
  const next = taskById(c.adimlar[i + 1]);
  return (
    <a className="btn primary" href={`#/gorev/${c.adimlar[i + 1]}?k=${c.id}`}>
      {c.kod} adım {i + 2}/{c.adimlar.length}: {next?.baslik} →
    </a>
  );
}
