// Windows 11 açılış ekranları: logo + dönen noktalar → kilit ekranı (saat/tarih) → oturum açma (parola) → Hoş geldiniz.
// Kurulumdan sonraki ilk açılışta "Merhaba / Bazı şeyleri hazırlıyoruz" ekranları gelir. Kapatma ve yeniden başlatma ekranları da buradadır.
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Logo from '../components/Logo';
import { photoUrl } from '../components/Photo';

export function Spinner({ beyaz = true }: { beyaz?: boolean }) {
  return (
    <span className={'win-spinner' + (beyaz ? '' : ' koyu')} aria-label="Yükleniyor">
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </span>
  );
}

/** Siyah ekranda Windows logosu ve dönen noktalar (açılış, kurulum medyası) */
export function WindowsLogoEkrani({ metin }: { metin?: string }) {
  return (
    <div className="win-boot">
      <Logo id="windows" size="5.5em" />
      <Spinner />
      {metin && <p>{metin}</p>}
    </div>
  );
}

export function DurumEkrani({ metin, alt }: { metin: string; alt?: string }) {
  return (
    <div className="win-durum">
      <Spinner />
      <h2>{metin}</h2>
      {alt && <p>{alt}</p>}
    </div>
  );
}

type Asama = 'logo' | 'kilit' | 'giris' | 'hosgeldin' | 'ilk1' | 'ilk2' | 'ilk3' | 'masaustu';

interface Props {
  kullanici: string;
  /** Boşsa parola istenmez */
  parola: string;
  /** Kurulumdan sonraki ilk açılış */
  ilk: boolean;
  onIlkBitti: () => void;
  log: (type: string) => void;
  children: ReactNode;
}

const simdi = () => {
  const d = new Date();
  return { saat: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), tarih: d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }) };
};

export default function WindowsAcilis({ kullanici, parola, ilk, onIlkBitti, log, children }: Props) {
  const [asama, setAsama] = useState<Asama>('logo');
  const [pw, setPw] = useState('');
  const [hata, setHata] = useState(false);
  const [zaman, setZaman] = useState(simdi);

  // Zamanlı geçişler
  useEffect(() => {
    const sure: Partial<Record<Asama, [number, Asama]>> = {
      logo: [2600, ilk ? 'ilk1' : 'kilit'],
      hosgeldin: [1600, 'masaustu'],
      ilk1: [1800, 'ilk2'],
      ilk2: [2200, 'ilk3'],
      ilk3: [1800, 'masaustu'],
    };
    const s = sure[asama];
    if (!s) return;
    const t = setTimeout(() => {
      if (asama === 'ilk3') onIlkBitti();
      setAsama(s[1]);
    }, s[0]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asama]);
  useEffect(() => {
    if (asama !== 'kilit') return;
    const t = setInterval(() => setZaman(simdi()), 15000);
    // Kilit ekranında herhangi bir tuş ya da tıklama oturum açma ekranını getirir
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt') return;
      e.preventDefault();
      setAsama('giris');
    };
    window.addEventListener('keydown', on);
    return () => {
      clearInterval(t);
      window.removeEventListener('keydown', on);
    };
  }, [asama]);

  const giris = (e?: FormEvent) => {
    e?.preventDefault();
    if (parola && pw !== parola) {
      setHata(true);
      setPw('');
      log('windows.giris-hata');
      return;
    }
    log('windows.giris');
    setAsama('hosgeldin');
  };

  if (asama === 'masaustu') return <>{children}</>;
  if (asama === 'logo') return <WindowsLogoEkrani />;
  if (asama === 'ilk1') return <div className="win-ilk">Merhaba</div>;
  if (asama === 'ilk2') return <DurumEkrani metin="Bazı şeyleri sizin için hazırlıyoruz" alt="Bu işlem birkaç dakika sürebilir" />;
  if (asama === 'ilk3') return <DurumEkrani metin="Bilgisayarınızı kapatmayın" alt="Neredeyse hazır" />;
  if (asama === 'hosgeldin') return <DurumEkrani metin="Hoş geldiniz" />;

  const kilitArka = photoUrl('os-win11-kilit') ?? photoUrl('os-win11-duvar');
  return (
    <div className={'win-kilit' + (asama === 'giris' ? ' giris' : '')} style={kilitArka ? { backgroundImage: `url(${kilitArka})` } : undefined} onClick={() => asama === 'kilit' && setAsama('giris')}>
      {asama === 'kilit' ? (
        <div className="win-kilit-saat">
          <b>{zaman.saat}</b>
          <span>{zaman.tarih}</span>
          <small>Oturum açmak için bir tuşa basın ya da tıklayın</small>
        </div>
      ) : (
        <form className="win-giris" onSubmit={giris} onClick={(e) => e.stopPropagation()}>
          <div className="win-avatar">👤</div>
          <b>{kullanici}</b>
          {hata ? (
            <>
              <p>Parola yanlış. Yeniden deneyin.</p>
              <button type="button" className="win-giris-btn" autoFocus onClick={() => setHata(false)}>
                Tamam
              </button>
            </>
          ) : parola ? (
            <div className="win-parola">
              <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Parola" aria-label="Windows parolası" />
              <button aria-label="Oturum aç">→</button>
            </div>
          ) : (
            <button className="win-giris-btn" autoFocus>
              Oturum aç
            </button>
          )}
        </form>
      )}
      <div className="win-kilit-alt">🌐 ♿ ⏻</div>
    </div>
  );
}
