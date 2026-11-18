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
export const DUVAR_GORSEL: Record<string, string> = { win10: 'os-win10-duvar', bloom: 'os-win11-duvar', girne: 'duvar-kagidi-1', karpaz: 'duvar-kagidi-2', soyut: 'duvar-kagidi-3' };
const DUVAR_DEGRADE: Record<string, string> = {
  bloom: 'radial-gradient(ellipse at 40% 60%, #4a8df5, #1c4fa8 55%, #0d2a63)',
  win10: 'linear-gradient(115deg, transparent 38%, #5fc6ff33 46%, transparent 54%), linear-gradient(68deg, transparent 52%, #8fd8ff30 58%, transparent 64%), radial-gradient(ellipse at 66% 48%, #3fb4ff 0%, #0a6fd6 16%, #063b8c 38%, #021338 70%, #010616 100%)',
  girne: 'linear-gradient(180deg,#f59e0b 0%,#fb7185 35%,#1e3a8a 75%)',
  karpaz: 'linear-gradient(180deg,#7dd3fc 0%,#22d3ee 45%,#fde68a 75%)',
  soyut: 'linear-gradient(135deg,#4c1d95,#1e3a8a 50%,#0f766e)',
};
export function duvarArkaPlan(id: string): string {
  const u = photoUrl(DUVAR_GORSEL[id] ?? '');
  return u ? `center / cover no-repeat url(${u})` : (DUVAR_DEGRADE[id] ?? DUVAR_DEGRADE.bloom);
}
