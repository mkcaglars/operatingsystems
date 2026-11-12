// Görev puanlaması. Sunucudaki karşılığı: server/api/lib/rules.php → score_task().
import { evaluate, type Rule, type RuleContext } from './rules';
import type { TaskDef } from './types';

export interface CriterionResult {
  id: string;
  aciklama: string;
  gecti: boolean;
}

export interface MistakeResult {
  id: string;
  aciklama: string;
  ceza: number;
}

export interface ScoreResult {
  puan: number;
  basari: number;
  surec: number;
  sure: number;
  ipucu: number;
  kriterler: CriterionResult[];
  hatalar: MistakeResult[];
  kazanimlar: Record<string, number>;
}

export const DEFAULT_WEIGHTS = { basari: 70, surec: 20, sure: 10 };

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Süre puanı: hedef sürede ya da daha kısa → 100; hedefin 3 katında → 0; arası doğrusal. */
export function timeScore(durationSec: number, targetSec: number | undefined): number {
  if (!targetSec || targetSec <= 0) return 100;
  if (durationSec <= targetSec) return 100;
  const over = (durationSec - targetSec) / (2 * targetSec);
  return clamp(Math.round(100 * (1 - over)));
}

export function scoreTask(task: TaskDef, ctx: RuleContext, durationSec: number, hints: number): ScoreResult {
  const w = { ...DEFAULT_WEIGHTS, ...(task.agirliklar ?? {}) };
  const wSum = w.basari + w.surec + w.sure || 1;

  const kriterler = task.kriterler.map((k) => ({ id: k.id, aciklama: k.aciklama, gecti: evaluate(k.kural as Rule, ctx), agirlik: k.agirlik ?? 1, kazanimlar: k.kazanimlar ?? [] }));
  const totalW = kriterler.reduce((s, k) => s + k.agirlik, 0) || 1;
  const basari = Math.round((100 * kriterler.filter((k) => k.gecti).reduce((s, k) => s + k.agirlik, 0)) / totalW);

  const hatalar = (task.hatalar ?? []).filter((h) => evaluate(h.kural as Rule, ctx)).map((h) => ({ id: h.id, aciklama: h.aciklama, ceza: h.ceza }));
  const surec = clamp(100 - hatalar.reduce((s, h) => s + h.ceza, 0));
  const sure = timeScore(durationSec, task.sure_hedef);
  const ipucu = hints * (task.ipucu_cezasi ?? 5);

  const combine = (b: number) => clamp(Math.round((b * w.basari + surec * w.surec + sure * w.sure) / wSum - ipucu));
  const puan = combine(basari);

  const kazanimlar: Record<string, number> = {};
  for (const kod of task.kazanimlar) {
    const ilgili = kriterler.filter((k) => k.kazanimlar.includes(kod));
    if (ilgili.length === 0) {
      kazanimlar[kod] = puan;
    } else {
      const tw = ilgili.reduce((s, k) => s + k.agirlik, 0) || 1;
      const b = Math.round((100 * ilgili.filter((k) => k.gecti).reduce((s, k) => s + k.agirlik, 0)) / tw);
      kazanimlar[kod] = combine(b);
    }
  }

  return {
    puan,
    basari,
    surec,
    sure,
    ipucu,
    kriterler: kriterler.map(({ id, aciklama, gecti }) => ({ id, aciklama, gecti })),
    hatalar,
    kazanimlar,
  };
}

export type Level = 'baslamadi' | 'gelisiyor' | 'yeterli' | 'ustalasti';

export function levelOf(score: number | null | undefined, esik = { yeterli: 50, usta: 85 }): Level {
  if (score === null || score === undefined) return 'baslamadi';
  if (score >= esik.usta) return 'ustalasti';
  if (score >= esik.yeterli) return 'yeterli';
  return 'gelisiyor';
}

export const LEVEL_LABEL: Record<Level, string> = {
  baslamadi: 'Başlamadı',
  gelisiyor: 'Gelişiyor',
  yeterli: 'Yeterli',
  ustalasti: 'Ustalaştı',
};
