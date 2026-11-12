import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, type ClassInfo, type ClassSettings, type Credential, type StudentRow } from '../../api';
import { useAuth } from '../../App';
import { outcomes, outcomeText, stationById, taskById, tasks } from '../../content';
import { levelOf, LEVEL_LABEL } from '../../core/scoring';
import { go } from '../../router';
import { CredentialCards } from './Credentials';
import { fmtDate } from './TeacherApp';

const TABS: [string, string][] = [
  ['ogrenciler', 'Öğrenciler'],
  ['canli', 'Canlı izleme'],
  ['rapor', 'Kazanım raporu'],
  ['ayarlar', 'Ayarlar'],
];

export default function ClassPage({ classId, tab }: { classId: number; tab: string }) {
  const [cls, setCls] = useState<ClassInfo | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(
    () =>
      api
        .get<ClassInfo[]>('classes')
        .then((l) => {
          const c = l.find((x) => x.id === classId);
          if (!c) setErr('Sınıf bulunamadı ya da size ait değil.');
          setCls(c ?? null);
        })
        .catch((e) => setErr(e.message)),
    [classId],
  );
  useEffect(() => {
    load();
  }, [load]);

  if (err) return <div className="note error">{err}</div>;
  if (!cls) return <p>Yükleniyor…</p>;
  return (
    <>
      <p className="crumb">
        <a href="#/ogretmen">Sınıflarım</a> › {cls.name}
      </p>
      <h2>{cls.name}</h2>
      <nav className="tabs">
        {TABS.map(([k, label]) => (
          <a key={k} href={`#/ogretmen/sinif/${classId}/${k}`} className={tab === k ? 'active' : ''}>
            {label}
          </a>
        ))}
      </nav>
      {tab === 'ogrenciler' && <Students cls={cls} onChange={load} />}
      {tab === 'canli' && <Live cls={cls} />}
      {tab === 'rapor' && <Report cls={cls} />}
      {tab === 'ayarlar' && <Settings cls={cls} onChange={load} />}
    </>
  );
}

// ---------------------------------------------------------------- Öğrenciler
function Students({ cls, onChange }: { cls: ClassInfo; onChange: () => void }) {
  const [list, setList] = useState<StudentRow[] | null>(null);
  const [err, setErr] = useState('');
  const [cred, setCred] = useState<{ title: string; list: Credential[] } | null>(null);
  const [one, setOne] = useState({ name: '', username: '', password: '' });
  const [bulk, setBulk] = useState('');
  const [merge, setMerge] = useState<StudentRow | null>(null);
  const [mergeWith, setMergeWith] = useState('');
  const [myClasses, setMyClasses] = useState<ClassInfo[]>([]);

  const load = useCallback(() => {
    api.get<StudentRow[]>('students', { class_id: cls.id }).then((l) => setList(l.sort(byName))).catch((e) => setErr(e.message));
  }, [cls.id]);
  useEffect(() => {
    load();
    api.get<ClassInfo[]>('classes').then(setMyClasses).catch(() => undefined);
  }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setErr('');
    try {
      await fn();
      load();
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  async function addOne(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const r = await api.post<Credential>('students/create', { class_id: cls.id, ...one });
      setCred({ title: 'Yeni öğrenci', list: [r] });
      setOne({ name: '', username: '', password: '' });
    });
  }

  async function addBulk(e: FormEvent) {
    e.preventDefault();
    const rows = parseBulk(bulk);
    if (!rows.length) return setErr('Liste boş.');
    await run(async () => {
      const r = await api.post<{ created: Credential[] }>('students/bulk', { class_id: cls.id, rows });
      setCred({ title: `${r.created.length} öğrenci eklendi`, list: r.created });
      setBulk('');
    });
  }

  if (list === null) return <p>Yükleniyor…</p>;
  return (
    <>
      {err && <div className="note error">{err}</div>}
      <div className="row space">
        <p className="muted">{list.length} öğrenci</p>
        {list.some((s) => s.has_password) && (
          <button
            className="btn"
            onClick={() =>
              confirm('Şifresi olan TÜM öğrencilerin şifreleri sıfırlanıp yazdırılabilir kartlar üretilsin mi?') &&
              run(async () => {
                const out: Credential[] = [];
                for (const s of list.filter((x) => x.active)) out.push({ name: s.name, ...(await api.post<Credential>('students/reset-password', { id: s.id })) });
                setCred({ title: 'Sınıfın giriş kartları', list: out });
              })
            }
          >
            🖨 Tüm sınıfa yeni şifre + kart
          </button>
        )}
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Ad soyad</th>
            <th>Kullanıcı adı</th>
            <th>Giriş yolu</th>
            <th>Son giriş</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.id} className={s.active ? '' : 'inactive'}>
              <td>
                {s.name}
                {!s.active && <span className="tag">pasif</span>}
              </td>
              <td>{s.username ?? '—'}</td>
              <td>
                {s.portal_uid && <span className="tag blue" title={`Portal kodu: ${s.portal_uid}`}>Portal</span>}
                {s.has_password && <span className="tag">Şifre</span>}
              </td>
              <td>{fmtDate(s.last_login)}</td>
              <td className="actions">
                <a className="link" href={`#/ogretmen/sinif/${cls.id}/rapor?ogrenci=${s.id}`}>
                  Sonuçlar
                </a>
                <button
                  className="link"
                  onClick={() =>
                    run(async () => {
                      const r = await api.post<Credential>('students/reset-password', { id: s.id });
                      setCred({ title: 'Yeni şifre', list: [{ name: s.name, ...r }] });
                    })
                  }
                >
                  {s.has_password ? 'Şifre sıfırla' : 'Şifre ver'}
                </button>
                <button
                  className="link"
                  onClick={() => {
                    const n = prompt('Ad soyad', s.name);
                    if (n && n !== s.name) run(() => api.post('students/update', { id: s.id, name: n }));
                  }}
                >
                  Adı düzelt
                </button>
                <button
                  className="link"
                  onClick={() => {
                    const n = prompt('Yeni kullanıcı adı', s.username ?? '');
                    if (n && n !== s.username) run(() => api.post('students/update', { id: s.id, username: n }));
                  }}
                >
                  Kullanıcı adı
                </button>
                {myClasses.length > 1 && (
                  <select
                    className="mini"
                    value=""
                    onChange={(e) => e.target.value && run(() => api.post('students/move', { id: s.id, class_id: Number(e.target.value), from_class_id: cls.id }))}
                  >
                    <option value="">Taşı…</option>
                    {myClasses
                      .filter((c) => c.id !== cls.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                )}
                <button className="link" onClick={() => setMerge(s)}>
                  Birleştir
                </button>
                <button className="link" onClick={() => run(() => api.post('students/update', { id: s.id, active: !s.active }))}>
                  {s.active ? 'Pasifleştir' : 'Etkinleştir'}
                </button>
                <button className="link danger" onClick={() => confirm(`${s.name} ve tüm çalışmaları silinsin mi? Bu geri alınamaz.`) && run(() => api.post('students/delete', { id: s.id }))}>
                  Sil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="two-col">
        <form className="card stack" onSubmit={addOne}>
          <h3>Öğrenci ekle</h3>
          <label>
            Ad soyad
            <input value={one.name} onChange={(e) => setOne({ ...one, name: e.target.value })} required />
          </label>
          <label>
            Kullanıcı adı <small className="muted">(boş bırakılırsa addan üretilir)</small>
            <input value={one.username} onChange={(e) => setOne({ ...one, username: e.target.value })} autoCapitalize="none" />
          </label>
          <label>
            Şifre <small className="muted">(boş bırakılırsa rastgele üretilir)</small>
            <input value={one.password} onChange={(e) => setOne({ ...one, password: e.target.value })} />
          </label>
          <button className="btn primary">Ekle</button>
        </form>
        <form className="card stack" onSubmit={addBulk}>
          <h3>Listeden toplu ekle</h3>
          <p className="small muted">
            Her satıra bir öğrenci. Excel'den sütunları kopyalayıp yapıştırabilirsiniz: <code>Ad Soyad</code> ya da <code>Ad Soyad ; kullanıcı adı ; şifre</code>
          </p>
          <textarea rows={7} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={'Ayşe Yılmaz\nMehmet Kaya\nZeynep Demir'} />
          <button className="btn primary">Hepsini ekle</button>
        </form>
      </div>

      {merge && (
        <div className="modal-back">
          <div className="modal">
            <h3>Hesap birleştir: {merge.name}</h3>
            <p className="small">
              Aynı öğrencinin iki hesabı varsa (ör. portaldan gelen hesap ve elle açılan hesap) birleştirin. Seçtiğiniz hesabın tüm çalışmaları <b>{merge.name}</b> hesabına
              taşınır ve o hesap silinir. Eksik giriş bilgileri (portal kodu, kullanıcı adı, şifre) aktarılır.
            </p>
            <select value={mergeWith} onChange={(e) => setMergeWith(e.target.value)}>
              <option value="">Birleştirilecek hesabı seçin…</option>
              {list
                .filter((x) => x.id !== merge.id)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} {x.username ? `(${x.username})` : ''} {x.portal_uid ? '· portal' : ''}
                  </option>
                ))}
            </select>
            <div className="row">
              <button
                className="btn primary"
                disabled={!mergeWith}
                onClick={() =>
                  run(async () => {
                    await api.post('students/merge', { keep_id: merge.id, remove_id: Number(mergeWith) });
                    setMerge(null);
                    setMergeWith('');
                  })
                }
              >
                Birleştir
              </button>
              <button className="btn" onClick={() => setMerge(null)}>
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
      {cred && <CredentialCards title={cred.title} list={cred.list} onClose={() => setCred(null)} />}
    </>
  );
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'tr');

export function parseBulk(text: string): { name: string; username?: string; password?: string }[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(/\t|;|,/).map((x) => x.trim()))
    .filter((p) => p[0] && !/^ad(ı)?( ?soyad(ı)?)?$/i.test(p[0]))
    .map(([name, username, password]) => ({ name, username: username || undefined, password: password || undefined }));
}

// ---------------------------------------------------------------- Canlı izleme
interface LiveRow {
  id: number;
  name: string;
  station: string | null;
  task_id: string | null;
  info: string | null;
  seen: number | null;
}

function Live({ cls }: { cls: ClassInfo }) {
  const [rows, setRows] = useState<LiveRow[]>([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .get<{ students: LiveRow[] }>('live', { class_id: cls.id })
        .then((r) => alive && (setRows(r.students.sort(byName)), setErr('')))
        .catch((e) => alive && setErr(e.message));
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [cls.id]);
  const online = rows.filter((r) => r.seen !== null && r.seen < 60).length;
  return (
    <>
      <p className="muted">
        {online} / {rows.length} öğrenci çevrimiçi · 5 saniyede bir yenilenir
      </p>
      {err && <div className="note error">{err}</div>}
      <div className="live-grid">
        {rows.map((r) => {
          const on = r.seen !== null && r.seen < 60;
          const t = r.task_id ? taskById(r.task_id) : undefined;
          const st = r.station ? stationById(r.station) : undefined;
          return (
            <div key={r.id} className={'live-tile ' + (on ? 'on' : 'off')}>
              <b>
                <span className="dot" /> {r.name}
              </b>
              <span>{on ? (t ? `${st?.kod ?? ''} ${t.baslik}` : r.info || 'Ana sayfada') : r.seen === null ? 'Hiç girmedi' : `Son görülme: ${ago(r.seen)}`}</span>
              {on && t && <small>{r.info}</small>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ago(sec: number): string {
  if (sec < 3600) return `${Math.round(sec / 60)} dk önce`;
  if (sec < 86400) return `${Math.round(sec / 3600)} saat önce`;
  return `${Math.round(sec / 86400)} gün önce`;
}

// ---------------------------------------------------------------- Rapor
interface ReportData {
  students: { id: number; name: string }[];
  tasks: { user_id: number; task_id: string; mode: string; score: number }[];
  outcomes: Record<string, Record<string, number>>;
}

function Report({ cls }: { cls: ClassInfo }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [err, setErr] = useState('');
  const [view, setView] = useState<'kazanim' | 'gorev'>('kazanim');
  const esik = cls.settings.esik;
  const focus = Number(new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('ogrenci')) || null;

  useEffect(() => {
    api.get<ReportData>('report', { class_id: cls.id }).then((d) => setData({ ...d, students: d.students.sort(byName) })).catch((e) => setErr(e.message));
  }, [cls.id]);

  const taskCols = useMemo(() => tasks.map((t) => t.id), []);
  if (err) return <div className="note error">{err}</div>;
  if (!data) return <p>Yükleniyor…</p>;

  const score = (uid: number, tid: string) => data.tasks.find((t) => t.user_id === uid && t.task_id === tid);

  function csv() {
    const head = ['Öğrenci', ...outcomes.map((o) => o.kod), ...taskCols.map((t) => taskById(t)?.baslik ?? t)];
    const lines = data!.students.map((s) => [
      s.name,
      ...outcomes.map((o) => data!.outcomes[s.id]?.[o.kod] ?? ''),
      ...taskCols.map((t) => score(s.id, t)?.score ?? ''),
    ]);
    const text = '﻿' + [head, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = `${cls.name}-kazanim-raporu.csv`;
    a.click();
  }

  return (
    <>
      <div className="row space no-print">
        <div className="seg">
          <button className={view === 'kazanim' ? 'on' : ''} onClick={() => setView('kazanim')}>
            Kazanımlar
          </button>
          <button className={view === 'gorev' ? 'on' : ''} onClick={() => setView('gorev')}>
            Görevler
          </button>
        </div>
        <div className="row">
          <button className="btn" onClick={csv}>
            ⬇ Excel (CSV)
          </button>
          <button className="btn" onClick={() => window.print()}>
            🖨 Yazdır / PDF
          </button>
        </div>
      </div>
      <div className="legend">
        {(['baslamadi', 'gelisiyor', 'yeterli', 'ustalasti'] as const).map((l) => (
          <span key={l} className={'level ' + l}>
            {LEVEL_LABEL[l]}
          </span>
        ))}
        <small className="muted">
          Eşikler: Yeterli ≥ {esik.yeterli}, Ustalaştı ≥ {esik.usta}. Uygula ve Değerlendir modlarındaki en iyi deneme sayılır; Değerlendir modu önceliklidir.
        </small>
      </div>
      <div className="table-scroll">
        <table className="table heat print-area">
          <thead>
            <tr>
              <th>Öğrenci</th>
              {view === 'kazanim'
                ? outcomes.map((o) => (
                    <th key={o.kod} title={o.metin} className="rot">
                      {o.kod}
                    </th>
                  ))
                : taskCols.map((t) => (
                    <th key={t} title={taskById(t)?.baslik}>
                      {taskById(t)?.baslik}
                    </th>
                  ))}
            </tr>
          </thead>
          <tbody>
            {data.students.map((s) => (
              <tr key={s.id} className={focus === s.id ? 'focus' : ''}>
                <th>{s.name}</th>
                {view === 'kazanim'
                  ? outcomes.map((o) => {
                      const v = data.outcomes[s.id]?.[o.kod];
                      return (
                        <td key={o.kod} className={'level ' + levelOf(v, esik)} title={`${o.kod} ${outcomeText(o.kod)}: ${v ?? '—'}`}>
                          {v ?? ''}
                        </td>
                      );
                    })
                  : taskCols.map((t) => {
                      const v = score(s.id, t);
                      return (
                        <td key={t} className={'level ' + levelOf(v?.score, esik)} title={v ? `${v.mode === 'degerlendir' ? 'Değerlendirme' : 'Uygulama'}` : ''}>
                          {v ? `${v.score}${v.mode === 'degerlendir' ? ' ★' : ''}` : ''}
                        </td>
                      );
                    })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {view === 'gorev' && <p className="small muted">★ Değerlendirme modunda alınan puan</p>}
    </>
  );
}

// ---------------------------------------------------------------- Ayarlar
function Settings({ cls, onChange }: { cls: ClassInfo; onChange: () => void }) {
  const { user } = useAuth();
  const [s, setS] = useState<ClassSettings>(cls.settings);
  const [name, setName] = useState(cls.name);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [teachers, setTeachers] = useState<{ id: number; name: string; role: string }[]>([]);
  const [assigned, setAssigned] = useState<number[]>(cls.teachers.map((t) => t.id));

  useEffect(() => {
    if (user?.role === 'admin') api.get<{ id: number; name: string; role: string }[]>('teachers').then(setTeachers).catch(() => undefined);
  }, [user?.role]);

  const run = async (fn: () => Promise<unknown>, ok = 'Kaydedildi.') => {
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: ok });
      onChange();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  };

  const opt = s.istege_bagli;
  return (
    <div className="settings">
      {msg && <div className={'note ' + (msg.ok ? 'ok' : 'error')}>{msg.text}</div>}
      <section className="card stack">
        <h3>Değerlendirme</h3>
        <label className="inline">
          <input type="checkbox" checked={s.degerlendirme_acik} onChange={(e) => setS({ ...s, degerlendirme_acik: e.target.checked })} />
          <span>
            <b>Değerlendirme modu açık</b> — öğrenciler görevleri ipucusuz, puanlı ölçme modunda yapabilir.
          </span>
        </label>
        <div className="row">
          <label>
            "Yeterli" eşiği
            <input type="number" min={1} max={99} value={s.esik.yeterli} onChange={(e) => setS({ ...s, esik: { ...s.esik, yeterli: Number(e.target.value) } })} />
          </label>
          <label>
            "Ustalaştı" eşiği
            <input type="number" min={2} max={100} value={s.esik.usta} onChange={(e) => setS({ ...s, esik: { ...s.esik, usta: Number(e.target.value) } })} />
          </label>
        </div>
      </section>
      <section className="card stack">
        <h3>İsteğe bağlı yazılımlar (İ8)</h3>
        <p className="small muted">Açılan yazılımlar uygulama yazılımları istasyonunda öğrencilere görev olarak gelir. Microsoft Office ve Google Chrome her zaman açıktır.</p>
        {(
          [
            ['winrar', 'WinRAR'],
            ['acrobat', 'Adobe Acrobat Reader'],
            ['photoshop', 'Adobe Photoshop'],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="inline">
            <input type="checkbox" checked={opt[k]} onChange={(e) => setS({ ...s, istege_bagli: { ...opt, [k]: e.target.checked } })} /> {label}
          </label>
        ))}
        <label className="inline">
          <input type="checkbox" checked={s.hizli_kurulum} onChange={(e) => setS({ ...s, hizli_kurulum: e.target.checked })} />
          <span>
            <b>Hızlandırılmış kurulum</b> — kurulumu daha önce yapmış öğrenciler için bekleme süreleri kısalır (adımlar aynı kalır).
          </span>
        </label>
      </section>
      <button className="btn primary" onClick={() => run(() => api.post('classes/update', { id: cls.id, settings: s }))}>
        Ayarları kaydet
      </button>

      <section className="card stack">
        <h3>Sınıf</h3>
        <div className="row">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          <button className="btn" onClick={() => run(() => api.post('classes/update', { id: cls.id, name }), 'Sınıf adı değişti.')}>
            Yeniden adlandır
          </button>
        </div>
        <p className="small muted">Öğretmenler: {cls.teachers.map((t) => t.name).join(', ') || '—'}</p>
        {user?.role === 'admin' && teachers.length > 0 && (
          <>
            <p className="small">
              <b>Yönetici:</b> bu sınıfın öğretmenlerini seçin
            </p>
            <div className="check-grid">
              {teachers.map((t) => (
                <label key={t.id}>
                  <input type="checkbox" checked={assigned.includes(t.id)} onChange={(e) => setAssigned(e.target.checked ? [...assigned, t.id] : assigned.filter((x) => x !== t.id))} /> {t.name}
                </label>
              ))}
            </div>
            <button className="btn" onClick={() => run(() => api.post('classes/teachers', { id: cls.id, teacher_ids: assigned }), 'Öğretmenler güncellendi.')}>
              Öğretmenleri kaydet
            </button>
          </>
        )}
        <div className="row">
          <button
            className="btn"
            onClick={() =>
              confirm('Bu sınıftan ayrılırsanız sınıfı artık göremezsiniz. Devam edilsin mi?') &&
              run(async () => {
                await api.post('classes/leave', { id: cls.id });
                go('ogretmen');
              })
            }
          >
            Sınıftan ayrıl
          </button>
          <button
            className="btn danger"
            onClick={() =>
              confirm(`${cls.name} sınıfı silinsin mi? Öğrenci hesapları silinmez, yalnızca sınıf kaldırılır.`) &&
              run(async () => {
                await api.post('classes/delete', { id: cls.id });
                go('ogretmen');
              })
            }
          >
            Sınıfı sil
          </button>
        </div>
      </section>
    </div>
  );
}
