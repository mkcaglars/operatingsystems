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
