import { useState, type FormEvent } from 'react';
import { api, type User } from '../api';
import { TopBar, useAuth } from '../App';

export default function Account() {
  const { user, setUser } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [next2, setNext2] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!user) return null;
  const min = user.role === 'ogrenci' ? 4 : 8;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next !== next2) return setMsg({ ok: false, text: 'Yeni şifreler aynı değil.' });
    try {
      const r = await api.post<{ user: User }>('auth/password', { current, new: next });
      setUser(r.user);
      setCurrent('');
      setNext('');
      setNext2('');
      setMsg({ ok: true, text: 'Şifre kaydedildi.' + (r.user.username ? ` Kullanıcı adınız: ${r.user.username}` : '') });
    } catch (ex) {
      setMsg({ ok: false, text: (ex as Error).message });
    }
  }

  return (
    <div className="page">
      <TopBar />
      <main className="container narrow">
        <h2>Hesabım</h2>
        <dl className="kv">
          <dt>Ad soyad</dt>
          <dd>{user.name}</dd>
          <dt>Kullanıcı adı</dt>
          <dd>{user.username ?? '— (yalnızca portal ile giriş)'}</dd>
          <dt>Giriş yolları</dt>
          <dd>
            {[user.portal && 'Okul portalı', user.has_password && 'Kullanıcı adı + şifre'].filter(Boolean).join(', ') || '—'}
          </dd>
        </dl>
        <form className="card stack" onSubmit={submit}>
          <h3>{user.has_password ? 'Şifre değiştir' : 'Şifre belirle (portal dışından da girebilmek için)'}</h3>
          {user.has_password && (
            <label>
              Mevcut şifre
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
            </label>
          )}
          <label>
            Yeni şifre (en az {min} karakter)
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={min} autoComplete="new-password" required />
          </label>
          <label>
            Yeni şifre (tekrar)
            <input type="password" value={next2} onChange={(e) => setNext2(e.target.value)} minLength={min} autoComplete="new-password" required />
          </label>
          {msg && <div className={'note ' + (msg.ok ? 'ok' : 'error')}>{msg.text}</div>}
          <button className="btn primary">Kaydet</button>
        </form>
      </main>
    </div>
  );
}
