// Kum havuzunda kurulu Ubuntu: giriş ekranı (parola gerçek klavyeden), üst çubuk, dock ve terminal.
// Ayrıca GRUB önyükleme menüsü: ↑ ↓ ile seçim, Enter ile başlatma, 10 sn sonra varsayılan.
import { useEffect, useState, type FormEvent } from 'react';
import Logo from './Logo';
import { photoUrl } from './Photo';
import { UbuntuSaat } from './Saat';
import Terminal from './Terminal';
import type { Sim } from '../core/sim';
import type { ShellState } from '../core/shell';

interface Props {
  hesap: { ad: string; kullanici: string; bilgisayar: string; parola: string };
  wifi: string;
  sim: Sim<{ sh: ShellState }>;
  guc: (t: 'kapat' | 'yeniden') => void;
  log: (type: string) => void;
}

export function UbuntuMasaustu({ hesap, wifi, sim, guc, log }: Props) {
  const [girdi, setGirdi] = useState(false);
  const [pw, setPw] = useState('');
  const [hata, setHata] = useState('');
  const [terminal, setTerminal] = useState(true);
  const [menu, setMenu] = useState(false);
  const [not, setNot] = useState('');

  const giris = (e: FormEvent) => {
    e.preventDefault();
    if (hesap.parola ? pw !== hesap.parola : !pw) {
      setHata('Üzgünüz, bu işe yaramadı. Lütfen yeniden deneyin.');
      setPw('');
      log('ubuntu.giris-hata');
      return;
    }
    log('ubuntu.giris');
    setGirdi(true);
  };

  if (!girdi)
    return (
      <div className="ubx-login" style={photoUrl('os-ubuntu-giris') ? { background: `center / cover url(${photoUrl('os-ubuntu-giris')})` } : undefined}>
        <div className="ubx-top">
          <span />
          <UbuntuSaat />
          <span>{wifi ? '📶' : '🌐'} 🔊 ⏻</span>
        </div>
        <form className="ubx-login-box" onSubmit={giris}>
          <div className="ubx-avatar">{(hesap.ad || hesap.kullanici).slice(0, 1).toUpperCase()}</div>
          <b>{hesap.ad || hesap.kullanici}</b>
          <input type="password" autoFocus value={pw} onChange={(e) => (setPw(e.target.value), setHata(''))} placeholder="Parola" aria-label="Ubuntu parolası" />
          {hata && <small className="ubx-err">{hata}</small>}
        </form>
        <div className="ubx-logo">
          <Logo id="ubuntu" size="1.6em" /> ubuntu
        </div>
      </div>
    );

  const dock: { id: string; ad: string; logo: string }[] = [
    { id: 'firefox', ad: 'Firefox', logo: 'firefox' },
    { id: 'dosyalar', ad: 'Dosyalar', logo: 'dosya' },
    { id: 'terminal', ad: 'Terminal', logo: 'terminal' },
    { id: 'ayarlar', ad: 'Ayarlar', logo: 'ayarlar' },
  ];
  return (
    <div className="ubx" style={photoUrl('os-ubuntu-duvar') ? { background: `center / cover url(${photoUrl('os-ubuntu-duvar')})` } : undefined}>
      <div className="ubx-top">
        <span>Etkinlikler</span>
        <UbuntuSaat />
        <span className="rel">
          <button className="ubx-tray" onClick={() => setMenu((m) => !m)} aria-label="Sistem menüsü">
            {wifi ? '📶' : '🌐'} 🔊 ⏻ ▾
          </button>
          {menu && (
            <span className="ubx-menu">
              <span className="small">{wifi ? `Wi-Fi: ${wifi}` : 'Ağ bağlantısı yok'}</span>
              <button onClick={() => (log('ubuntu.yeniden'), guc('yeniden'))}>Yeniden Başlat…</button>
              <button onClick={() => (log('ubuntu.kapat'), guc('kapat'))}>Kapat…</button>
            </span>
          )}
        </span>
      </div>
      <div className="ubx-dock">
        {dock.map((d) => (
          <button
            key={d.id}
            className={'ubx-app' + (d.id === 'terminal' && terminal ? ' on' : '')}
            title={d.ad}
            onClick={() => (d.id === 'terminal' ? setTerminal((t) => !t) : setNot(`${d.ad}: bu simülasyonda Ubuntu'da Terminal kullanılır.`))}
          >
            <Logo id={d.logo} size="2em" />
          </button>
        ))}
        <span className="ubx-grid">⋮⋮⋮</span>
      </div>
      <div className="ubx-wall">
        <Logo id="ubuntu" size="5em" />
      </div>
      {terminal && (
        <div className="ubx-win">
          <Terminal sim={sim} />
        </div>
      )}
      {not && (
        <div className="ubx-toast" onClick={() => setNot('')}>
          {not}
        </div>
      )}
    </div>
  );
}

export function GrubMenu({ windows, sec, log }: { windows: boolean; sec: (hedef: 'ubuntu' | 'windows' | 'uefi') => void; log: (t: string) => void }) {
  const secenekler: { ad: string; hedef: 'ubuntu' | 'windows' | 'uefi' | null }[] = [
    { ad: 'Ubuntu', hedef: 'ubuntu' },
    { ad: 'Advanced options for Ubuntu', hedef: null },
    ...(windows ? [{ ad: 'Windows Boot Manager (on /dev/sda2)', hedef: 'windows' as const }] : []),
    { ad: 'UEFI Firmware Settings', hedef: 'uefi' },
  ];
  const [i, setI] = useState(0);
  const [sn, setSn] = useState<number | null>(10);
  useEffect(() => {
    if (sn === null) return;
    if (sn <= 0) {
      sec('ubuntu');
      return;
    }
    const t = setTimeout(() => setSn(sn - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sn]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) return;
      e.preventDefault();
      setSn(null);
      if (e.key === 'ArrowUp') setI((x) => (x + secenekler.length - 1) % secenekler.length);
      else if (e.key === 'ArrowDown') setI((x) => (x + 1) % secenekler.length);
      else {
        const h = secenekler[i].hedef;
        if (h) sec(h);
        else log('grub.gelismis');
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });
  return (
    <div className="grub yalniz-klavye">
      <div className="grub-title">GNU GRUB version 2.12</div>
      <div className="grub-box">
        {secenekler.map((g, j) => (
          <div key={g.ad} className={'grub-row' + (j === i ? ' on' : '')}>
            {j === i ? '*' : ' '}
            {g.ad}
          </div>
        ))}
      </div>
      <div className="grub-help">
        Use the ↑ and ↓ keys to select which entry is highlighted.
        <br />
        Press enter to boot the selected OS, `e' to edit the commands before booting or `c' for a command-line.
        {sn !== null && (
          <>
            <br />
            The highlighted entry will be executed automatically in {sn}s.
          </>
        )}
      </div>
    </div>
  );
}
