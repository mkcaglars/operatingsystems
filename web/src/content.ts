// Görev içerikleri (content/ klasörü) derleme sırasında arayüze gömülür.
import istasyonlarJson from '@content/istasyonlar.json';
import kazanimlarJson from '@content/kazanimlar.json';
import kampanyalarJson from '@content/kampanyalar.json';
import type { Campaign, Outcome, Station, TaskDef } from './core/types';

const modules = import.meta.glob('@content/tasks/*.json', { eager: true, import: 'default' });

export const stations = istasyonlarJson as Station[];
export const outcomes = kazanimlarJson as Outcome[];
export const campaigns = kampanyalarJson as Campaign[];
export const tasks: TaskDef[] = Object.values(modules as Record<string, TaskDef>).sort((a, b) => a.id.localeCompare(b.id));

export function taskById(id: string): TaskDef | undefined {
  return tasks.find((t) => t.id === id);
}

export function tasksOf(stationId: string): TaskDef[] {
  return tasks.filter((t) => t.istasyon === stationId);
}

export function stationById(id: string): Station | undefined {
  return stations.find((s) => s.id === id);
}

export function outcomeText(kod: string): string {
  return outcomes.find((o) => o.kod === kod)?.metin ?? kod;
}

/** Kampanya ilerlemesi: adım adım en iyi puanlar; bir adım, önceki adım ≥ esik olunca açılır. Kampanya puanı = ortalama. */
export function campaignProgress(c: Campaign, best: (taskId: string) => number | null, esik = 50) {
  let acik = true;
  const adimlar = c.adimlar.map((id) => {
    const puan = best(id);
    const a = { id, puan, acik };
    acik = acik && puan !== null && puan >= esik;
    return a;
  });
  const puan = Math.round(adimlar.reduce((t, a) => t + (a.puan ?? 0), 0) / adimlar.length);
  const biten = adimlar.filter((a) => a.puan !== null && a.puan >= esik).length;
  return { adimlar, puan, biten };
}
