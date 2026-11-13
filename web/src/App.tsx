import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setCsrf, setUnauthorizedHandler, type User } from './api';
import { go, useRoute } from './router';
import Login from './pages/Login';
import StudentHome from './pages/StudentHome';
import KumHavuzu from './pages/KumHavuzu';
import TaskPage from './pages/TaskPage';
import Account from './pages/Account';
import TeacherApp from './pages/teacher/TeacherApp';

interface AuthCtx {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const route = useRoute();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      go('giris');
    });
    api
      .get<{ user: User | null; csrf: string | null }>('auth/me')
      .then((r) => {
        setCsrf(r.csrf);
        setUser(r.user);
      })
      .catch(() => setUser(null));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('auth/logout');
    } catch {
      /* oturum zaten kapalı olabilir */
    }
    setCsrf(null);
    setUser(null);
    go('giris');
  }, []);

  if (user === undefined) return <div className="loading">Yükleniyor…</div>;

  const [first] = route.path;
  let page: ReactNode;
  if (!user || first === 'giris') {
    page = user ? <Redirect to={isStaff(user) ? 'ogretmen' : ''} /> : <Login />;
  } else if (first === 'gorev' && route.path[1]) {
    page = <TaskPage key={route.path[1]} taskId={route.path[1]} />;
  } else if (first === 'kum-havuzu') {
    page = <KumHavuzu />;
  } else if (first === 'hesap') {
    page = <Account />;
  } else if (first === 'ogretmen') {
    page = isStaff(user) ? <TeacherApp path={route.path.slice(1)} /> : <Redirect to="" />;
  } else if (first === 'gorevler' || !isStaff(user)) {
    page = <StudentHome />;
  } else {
    page = <Redirect to="ogretmen" />;
  }

  return <Ctx.Provider value={{ user: user ?? null, setUser, logout }}>{page}</Ctx.Provider>;
}

export function isStaff(u: User | null): boolean {
  return !!u && (u.role === 'ogretmen' || u.role === 'admin');
}

function Redirect({ to }: { to: string }) {
  useEffect(() => go(to), [to]);
  return null;
}

/** Üst çubuk: tüm sayfalarda ortak */
export function TopBar({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <a className="brand" href="#/">
        <span className="brand-logo" aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </span>
        İşletim Sistemleri Laboratuvarı
      </a>
      <nav>{children}</nav>
      {user && (
        <div className="who">
          <a href="#/hesap" title="Hesabım">
            {user.name}
            <small>{user.role === 'admin' ? 'Yönetici' : user.role === 'ogretmen' ? 'Öğretmen' : 'Öğrenci'}</small>
          </a>
          <button className="ghost" onClick={logout}>
            Çıkış
          </button>
        </div>
      )}
    </header>
  );
}
