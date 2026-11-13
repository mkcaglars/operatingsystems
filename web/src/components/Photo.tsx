// Gerçekçi görsel: assets/gorseller/<ad>.(webp|png|jpg) varsa onu, yoksa yedek çizimi gösterir.
// Mevcut görsellerin listesi derleme sırasında üretilir (virtual:gorseller); olmayan görsel için istek atılmaz.
// Görseller eklendikçe kod değişmeden fotoğraflar devreye girer.
import type { CSSProperties, ReactNode } from 'react';
import files from 'virtual:gorseller';

const byName = new Map<string, string>();
for (const f of files as string[]) {
  const base = f.replace(/\.[^.]+$/, '');
  // webp öncelikli
  if (!byName.has(base) || f.endsWith('.webp')) byName.set(base, f);
}

export function photoUrl(name: string): string | null {
  const f = byName.get(name);
  return f ? `gorseller/${f}` : null;
}

export default function Photo({ name, alt, fallback, className, style }: { name: string; alt: string; fallback: ReactNode; className?: string; style?: CSSProperties }) {
  const url = photoUrl(name);
  if (!url) return <>{fallback}</>;
  return <img className={className} style={style} src={url} alt={alt} draggable={false} loading="lazy" />;
}

/** Windows masaüstü arka planları: görsel yüklüyse fotoğraf, yoksa degrade */
export const DUVAR_GORSEL: Record<string, string> = { bloom: 'os-win11-duvar', girne: 'duvar-kagidi-1', karpaz: 'duvar-kagidi-2', soyut: 'duvar-kagidi-3' };
const DUVAR_DEGRADE: Record<string, string> = {
  bloom: 'radial-gradient(ellipse at 40% 60%, #4a8df5, #1c4fa8 55%, #0d2a63)',
  girne: 'linear-gradient(180deg,#f59e0b 0%,#fb7185 35%,#1e3a8a 75%)',
  karpaz: 'linear-gradient(180deg,#7dd3fc 0%,#22d3ee 45%,#fde68a 75%)',
  soyut: 'linear-gradient(135deg,#4c1d95,#1e3a8a 50%,#0f766e)',
};
export function duvarArkaPlan(id: string): string {
  const u = photoUrl(DUVAR_GORSEL[id] ?? '');
  return u ? `center / cover no-repeat url(${u})` : (DUVAR_DEGRADE[id] ?? DUVAR_DEGRADE.bloom);
}
