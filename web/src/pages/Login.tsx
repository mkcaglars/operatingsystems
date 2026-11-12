import { useEffect, useState, type FormEvent } from 'react';
import { api, setCsrf, type User } from '../api';
import { useAuth, isStaff } from '../App';
import { go } from '../router';
import { photoUrl } from '../components/Photo';

interface PublicConfig {
  portal_url: string;
  test_portal: boolean;
  kurulum_gerekli: boolean;
}

export default function Login() {
  const { setUser } = useAuth();
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<PublicConfig>('config').then(setCfg).catch(() => setCfg(null));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await api.post<{ user: User; csrf: string }>('auth/login', { username, password });
      setCsrf(r.csrf);
      setUser(r.user);
      go(isStaff(r.user) ? 'ogretmen' : '');
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page" style={photoUrl('ortam-servis-masasi') ? { backgroundImage: `url(${photoUrl('ortam-servis-masasi')})` } : undefined}>
      <div className="login-card">
        <div className="login-head">
          <span className="brand-logo big" aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </span>
          <div>
            <h1>İşletim Sistemleri Laboratuvarı</h1>
            <p>Sanal bilgisayar laboratuvarı · 9. sınıf Bilişim Teknolojileri</p>
          </div>
        </div>

        {cfg?.kurulum_gerekli && (
          <div className="note warn">
            İlk kurulum yapılmamış. Yönetici hesabını oluşturmak için <a href="kurulum.php">kurulum sayfasına</a> gidin.
          </div>
        )}

        {cfg?.portal_url && (
          <>
            <a className="btn primary block" href={cfg.portal_url}>
              Okul portalı ile giriş
            </a>
            <div className="or">
              <span>ya da kullanıcı adı ile</span>
            </div>
          </>
        )}

        <form onSubmit={submit} className="stack">
          <label>
            Kullanıcı adı
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required autoFocus />
          </label>
          <label>
            Şifre
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          {err && <div className="note error">{err}</div>}
          <button className="btn primary block" disabled={busy}>
            {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>
        <p className="muted small">Kullanıcı adınızı ve şifrenizi öğretmeniniz verir.</p>
        {cfg?.test_portal && (
          <p className="small">
            <a href="test-portal.php">Deneme portalı</a> (yalnızca deneme kurulumunda açıktır)
          </p>
        )}
      </div>
    </div>
  );
}
