// İ6–İ8 Windows görevleri: sanal Windows 11 masaüstü + sorular. Başlangıç bilgisayarı görev verisindeki "pc" yamasıyla kurulur.
import Sorular, { type Soru } from '../components/Sorular';
import { pcWith, type WinPc } from '../core/winpc';
import type { TaskDef } from '../core/types';
import Masaustu, { type WinVeri } from '../win/Masaustu';
import type { TaskUIProps } from './registry';

interface Veri extends WinVeri {
  pc?: Record<string, unknown>;
  sorular?: Soru[];
  notlar?: string[];
}
interface State {
  pc: WinPc;
  cevaplar: Record<string, string | string[]>;
}

export const initialWinGorev = (task: TaskDef): State => ({ pc: pcWith((task.veri as unknown as Veri).pc), cevaplar: {} });

export default function WinGorev({ task, mode, sim }: TaskUIProps) {
  const veri = task.veri as unknown as Veri;
  const learn = mode === 'ogren';
  return (
    <div className="wg">
      <div className="wg-main">
        <div className="monitor-css">
          <div className="screen on wg-screen">
            <Masaustu sim={sim} veri={veri} learn={learn} />
          </div>
        </div>
      </div>
      {(veri.sorular || veri.notlar) && (
        <aside className="wg-side">
          {veri.notlar && (
            <div className="card small">
              {veri.notlar.map((n) => (
                <p key={n}>{n}</p>
              ))}
            </div>
          )}
          {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
        </aside>
      )}
    </div>
  );
}
