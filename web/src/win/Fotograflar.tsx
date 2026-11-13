// Fotoğraflar uygulaması: resim dosyasını gösterir (görsel varsa gerçek fotoğraf, yoksa yer tutucu).
import { photoUrl } from '../components/Photo';
import { adOf } from '../core/winpc';
import type { AppCtx } from './Masaustu';

/** Örnek dosya adlarını projedeki fotoğraflarla eşleştirir */
function resim(ad: string): string | null {
  const a = ad.toLocaleLowerCase('tr');
  if (a.includes('girne')) return photoUrl('duvar-kagidi-1');
  if (a.includes('karpaz') || a.includes('sahil')) return photoUrl('duvar-kagidi-2');
  return photoUrl('os-win11-duvar');
}

export default function Fotograflar(ctx: AppCtx) {
  const yol = ctx.arg ?? '';
  const url = resim(adOf(yol));
  return (
    <div className="ft">
      <div className="ft-ust">
        <span>{adOf(yol)}</span>
        <span className="muted small">🔍 ↻ 🗑 ⓘ</span>
      </div>
      <div className="ft-alan">{url ? <img src={url} alt={adOf(yol)} /> : <span className="ft-yer">🖼</span>}</div>
    </div>
  );
}
