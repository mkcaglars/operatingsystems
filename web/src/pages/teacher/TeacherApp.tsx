import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, type ClassInfo, type Credential } from '../../api';
import { TopBar, useAuth } from '../../App';
import { go } from '../../router';
import ClassPage from './ClassPage';
import { CredentialCards } from './Credentials';

export default function TeacherApp({ path }: { path: string[] }) {
  const { user } = useAuth();
  const [sec, id, tab] = path;
  return (
    <div className="page">
      <TopBar>
        <a href="#/ogretmen" className={!sec ? 'active' : ''}>
          Sınıflarım
        </a>
        {user?.role === 'admin' && (
          <a href="#/ogretmen/ogretmenler" className={sec === 'ogretmenler' ? 'active' : ''}>
            Öğretmenler
          </a>
        )}
        <a href="#/gorevler">Görevleri dene</a>
      </TopBar>
      <main className="container wide">
        {sec === 'sinif' && id ? <ClassPage classId={Number(id)} tab={tab ?? 'ogrenciler'} /> : sec === 'ogretmenler' ? <Teachers /> : <Classes />}
      </main>
    </div>
  );
}

interface AllClass {
  id: number;
  name: string;
  students: number;
  teachers: string[];
  mine: boolean;
}

function Classes() {
  const [list, setList] = useState<ClassInfo[] | null>(null);
  const [all, setAll] = useState<AllClass[]>([]);
  const [name, setName] = useState('');
  const [join, setJoin] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    api.get<ClassInfo[]>('classes').then(setList).catch((e) => setErr(e.message));
    api.get<AllClass[]>('classes/all').then(setAll).catch(() => undefined);
  }, []);
  useEffect(load, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const r = await api.post<{ id: number }>('classes/create', { name });
      setName('');
      go(`ogretmen/sinif/${r.id}`);
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }

  async function doJoin(e: FormEvent) {
    e.preventDefault();
    if (!join) return;
    try {
      await api.post('classes/join', { id: Number(join) });
      setJoin('');
      load();
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }

  const joinable = all.filter((c) => !c.mine);
  return (
    <>
      <h2>Sınıflarım</h2>
      {err && <div className="note error">{err}</div>}
      {list === null ? (
        <p>Yükleniyor…</p>
      ) : list.length === 0 ? (
        <div className="note info">Henüz bir sınıfınız yok. Yeni sınıf açın ya da okul portalından gelen öğrencilerin sınıfına katılın.</div>
      ) : (
        <div className="class-grid">
          {list.map((c) => (
            <a key={c.id} className="class-card" href={`#/ogretmen/sinif/${c.id}`}>
              <b>{c.name}</b>
              <span>{c.students} öğrenci</span>
              <small>{c.teachers.map((t) => t.name).join(', ')}</small>
              {c.settings.degerlendirme_acik && <span className="tag">Değerlendirme açık</span>}
            </a>
          ))}
        </div>
      )}
      <div className="two-col">
        <form className="card stack" onSubmit={create}>
          <h3>Yeni sınıf</h3>
          <label>
            Sınıf adı (ör. 9-A)
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
          </label>
          <button className="btn primary">Sınıf aç</button>
        </form>
        <form className="card stack" onSubmit={doJoin}>
          <h3>Var olan sınıfa katıl</h3>
          <p className="small muted">Okul portalından gelen öğrencilerin sınıfları burada görünür. Bir sınıfı birden çok öğretmen paylaşabilir.</p>
          <select value={join} onChange={(e) => setJoin(e.target.value)}>
            <option value="">Sınıf seçin…</option>
            {joinable.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.students} öğrenci{c.teachers.length ? ` (${c.teachers.join(', ')})` : ' (öğretmeni yok)'}
              </option>
            ))}
          </select>
          <button className="btn" disabled={!join}>
            Katıl
          </button>
        </form>
      </div>
    </>
  );
}

interface TeacherRow {
  id: number;
  role: 'admin' | 'ogretmen';
  name: string;
  username: string | null;
  portal: boolean;
  active: boolean;
  last_login: string | null;
}

function Teachers() {
  const { user } = useAuth();
  const [list, setList] = useState<TeacherRow[]>([]);
  const [form, setForm] = useState({ name: '', username: '', password: '', admin: false });
  const [err, setErr] = useState('');
  const [cred, setCred] = useState<Credential[] | null>(null);
  const load = useCallback(() => api.get<TeacherRow[]>('teachers').then(setList).catch((e) => setErr(e.message)), []);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setErr('');
    try {
      await fn();
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  async function create(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      await api.post('teachers/create', form);
      setCred([{ name: form.name, username: form.username.toLowerCase(), password: form.password }]);
      setForm({ name: '', username: '', password: '', admin: false });
    });
  }

  if (user?.role !== 'admin') return <p>Bu sayfa yalnızca yönetici içindir.</p>;
  return (
    <>
      <h2>Öğretmenler</h2>
      {err && <div className="note error">{err}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Ad soyad</th>
            <th>Kullanıcı adı</th>
            <th>Giriş</th>
            <th>Rol</th>
            <th>Son giriş</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map((t) => (
            <tr key={t.id} className={t.active ? '' : 'inactive'}>
              <td>{t.name}</td>
              <td>{t.username ?? '—'}</td>
              <td>{[t.portal && 'Portal', t.username && 'Şifre'].filter(Boolean).join(' + ')}</td>
              <td>{t.role === 'admin' ? 'Yönetici' : 'Öğretmen'}</td>
              <td>{fmtDate(t.last_login)}</td>
              <td className="actions">
                <button
                  className="link"
                  onClick={() =>
                    run(async () => {
                      const r = await api.post<Credential>('teachers/reset-password', { id: t.id });
                      setCred([{ name: t.name, ...r }]);
                    })
                  }
                >
                  Şifre sıfırla
                </button>
                {t.id !== user.id && (
                  <>
                    <button className="link" onClick={() => run(() => api.post('teachers/update', { id: t.id, admin: t.role !== 'admin' }))}>
                      {t.role === 'admin' ? 'Yöneticiliği kaldır' : 'Yönetici yap'}
                    </button>
                    <button className="link" onClick={() => run(() => api.post('teachers/update', { id: t.id, active: !t.active }))}>
                      {t.active ? 'Pasifleştir' : 'Etkinleştir'}
                    </button>
                    <button className="link danger" onClick={() => confirm(`${t.name} silinsin mi?`) && run(() => api.post('teachers/delete', { id: t.id }))}>
                      Sil
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="card stack narrow-card" onSubmit={create}>
        <h3>Öğretmen ekle</h3>
        <label>
          Ad soyad
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label>
          Kullanıcı adı
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required autoCapitalize="none" />
        </label>
        <label>
          Şifre (en az 8 karakter)
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
        </label>
        <label className="inline">
          <input type="checkbox" checked={form.admin} onChange={(e) => setForm({ ...form, admin: e.target.checked })} /> Yönetici yetkisi
        </label>
        <button className="btn primary">Ekle</button>
      </form>
      {cred && <CredentialCards title="Öğretmen giriş bilgisi" list={cred} onClose={() => setCred(null)} />}
    </>
  );
}

export function fmtDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s.replace(' ', 'T') + 'Z');
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
