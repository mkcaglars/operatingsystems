// İ5 terminal görevleri: Ubuntu masaüstü + terminal + sorular. Görev, kabuk durumunu (sh) ve komut olaylarını denetler.
import Sorular, { type Soru } from '../components/Sorular';
import Terminal from '../components/Terminal';
import { defaultShell, exec, type ShellState } from '../core/shell';
import type { TaskDef } from '../core/types';
import type { TaskUIProps } from './registry';

interface Veri {
  canli?: boolean;
  /** ev dizinine eklenecek dosyalar (ör. İndirilenler/google-chrome-stable_current_amd64.deb) */
  ekDosyalar?: string[];
  /** Arıza: GRUB menüsünde Windows yok (os-prober kapalı) */
  grubArizasi?: boolean;
  kopya?: { komut: string; aciklama: string }[];
  sorular?: Soru[];
}
interface State {
  sh: ShellState;
  cevaplar: Record<string, string | string[]>;
}

export const initialUbuntuTerminal = (task: TaskDef): State => {
  const v = task.veri as unknown as Veri;
  let sh = v.canli ? defaultShell('ubuntu', 'ubuntu') : defaultShell();
  for (const f of v.ekDosyalar ?? []) sh = exec(sh, `touch ${f}`).state;
  sh = { ...sh, history: [], ...(v.grubArizasi ? { grub: { windows: false, osProber: false } } : {}) };
  return { sh, cevaplar: {} };
};

const DOCK = [
  { ad: 'Firefox', renk: '#e66000', harf: '🦊' },
  { ad: 'Dosyalar', renk: '#5e6c80', harf: '🗂' },
  { ad: 'Terminal', renk: '#2d2d2d', harf: '>_', on: true },
  { ad: 'App Center', renk: '#e95420', harf: 'A' },
  { ad: 'Ayarlar', renk: '#6a6a6a', harf: '⚙' },
];

export default function UbuntuTerminal({ task, mode, sim }: TaskUIProps) {
  const veri = task.veri as unknown as Veri;
  const learn = mode === 'ogren';
  return (
    <div className="ut">
      <div className="ubuntu-desktop">
        <div className="ub-top">
          <span>Etkinlikler</span>
          <span>2 Mar 09:41</span>
          <span>🔊 ⏻</span>
        </div>
        <div className="ub-dock">
          {DOCK.map((d) => (
            <span key={d.ad} className={'ub-app' + (d.on ? ' on' : '')} title={d.ad} style={{ background: d.renk }}>
              {d.harf}
            </span>
          ))}
          <span className="ub-grid" title="Uygulamaları göster">
            ⋮⋮⋮
          </span>
        </div>
        <div className="ub-win">
          <Terminal sim={sim} />
        </div>
        {veri.canli && <div className="ub-live">💿 Ubuntu'yu kurmadan dene (canlı oturum)</div>}
      </div>
      <div className="ut-side">
        {(learn || veri.kopya) && veri.kopya && (
          <section className="card small">
            <h4>Komut kartı</h4>
            <table className="cmd-card">
              <tbody>
                {veri.kopya.map((k) => (
                  <tr key={k.komut}>
                    <td>
                      <code>{k.komut}</code>
                    </td>
                    <td>{k.aciklama}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted">İpucu: Tab tuşu komut ve dosya adlarını tamamlar; ↑ ile önceki komutlar gelir.</p>
          </section>
        )}
        {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
      </div>
    </div>
  );
}
