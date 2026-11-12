// Görev içerikleri (content/ klasörü) derleme sırasında arayüze gömülür.
import istasyonlarJson from '@content/istasyonlar.json';
import kazanimlarJson from '@content/kazanimlar.json';
import type { Outcome, Station, TaskDef } from './core/types';

const modules = import.meta.glob('@content/tasks/*.json', { eager: true, import: 'default' });

export const stations = istasyonlarJson as Station[];
export const outcomes = kazanimlarJson as Outcome[];
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
