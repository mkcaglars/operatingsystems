// Windows 11 sağ tık (bağlam) menüsü. Masaüstü ve uygulamalar ctx.menu(e, ogeler) ile açar.
import { useEffect, useRef } from 'react';
import Logo from '../components/Logo';

export interface MenuOge {
  ad?: string;
  /** Emoji ya da logo kimliği ("logo:winrar") */
  ikon?: string;
  kisayol?: string;
  kalin?: boolean;
  devreDisi?: boolean;
  isaretli?: boolean;
  ayrac?: boolean;
  onClick?: () => void;
}

export default function BaglamMenu({ x, y, ogeler, kapat }: { x: number; y: number; ogeler: MenuOge[]; kapat: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const disari = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) kapat();
    };
    const tus = (e: KeyboardEvent) => e.key === 'Escape' && kapat();
    // Menüyü açan tıklamanın kendisi menüyü kapatmasın
    const t = setTimeout(() => {
      window.addEventListener('mousedown', disari);
      window.addEventListener('contextmenu', disari);
    }, 0);
    window.addEventListener('keydown', tus);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mousedown', disari);
      window.removeEventListener('contextmenu', disari);
      window.removeEventListener('keydown', tus);
    };
  }, [kapat]);
  // Ekran dışına taşmasın
  useEffect(() => {
    const el = ref.current;
    if (!el || !el.parentElement) return;
    const p = el.parentElement.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.right > p.right) el.style.left = `${Math.max(0, x - r.width)}px`;
    if (r.bottom > p.bottom) el.style.top = `${Math.max(0, y - r.height)}px`;
  }, [x, y]);
  return (
    <div className="ctx-menu" ref={ref} style={{ left: x, top: y }} role="menu" onContextMenu={(e) => e.preventDefault()}>
      {ogeler.map((o, i) =>
        o.ayrac ? (
          <div key={i} className="ctx-ayrac" />
        ) : (
          <button
            key={i}
            role="menuitem"
            className={'ctx-oge' + (o.kalin ? ' kalin' : '')}
            disabled={o.devreDisi}
            onClick={() => {
              kapat();
              o.onClick?.();
            }}
          >
            <span className="ctx-ikon">{o.ikon?.startsWith('logo:') ? <Logo id={o.ikon.slice(5)} size="1.1em" /> : (o.ikon ?? '')}</span>
            <span className="ctx-ad">{o.ad}</span>
            <span className="ctx-kisayol">{o.isaretli ? '✓' : (o.kisayol ?? '')}</span>
          </button>
        ),
      )}
    </div>
  );
}
