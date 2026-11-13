// Uygulama ve marka logoları (SVG). Eğitim amaçlı kapalı simülasyonda gerçek görünüme yakın çizimler.
import { useId, type ReactElement } from 'react';

const L: Record<string, (u: string) => ReactElement> = {
  windows: (u) => (
    <svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id={u + "lgw"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5fd0ff" />
          <stop offset="1" stopColor="#0067c0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="10.6" height="10.6" rx="0.6" fill={`url(#${u}lgw)`} />
      <rect x="12.4" y="1" width="10.6" height="10.6" rx="0.6" fill={`url(#${u}lgw)`} />
      <rect x="1" y="12.4" width="10.6" height="10.6" rx="0.6" fill={`url(#${u}lgw)`} />
      <rect x="12.4" y="12.4" width="10.6" height="10.6" rx="0.6" fill={`url(#${u}lgw)`} />
    </svg>
  ),
  microsoft: () => (
    <svg viewBox="0 0 24 24">
      <rect x="1" y="1" width="10.5" height="10.5" fill="#f25022" />
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7fba00" />
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00a4ef" />
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#ffb900" />
    </svg>
  ),
  chrome: () => (
    <svg viewBox="0 0 48 48">
      <path d="M24 24L6.68 14A20 20 0 0 1 41.32 14Z" fill="#ea4335" />
      <path d="M24 24L41.32 14A20 20 0 0 1 24 44Z" fill="#fbbc04" />
      <path d="M24 24L24 44A20 20 0 0 1 6.68 14Z" fill="#34a853" />
      <circle cx="24" cy="24" r="9.5" fill="#fff" />
      <circle cx="24" cy="24" r="7.6" fill="#1a73e8" />
    </svg>
  ),
  edge: (u) => (
    <svg viewBox="0 0 48 48">
      <defs>
        <linearGradient id={u + "lge1"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#35c1f1" />
          <stop offset="1" stopColor="#0c59a4" />
        </linearGradient>
        <linearGradient id={u + "lge2"} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1b9de2" />
          <stop offset="1" stopColor="#54d36a" />
        </linearGradient>
      </defs>
      <path d="M43 31c-3 7-10 12-19 12C12 43 4 34 4 24 4 12 13 4 24 4c10 0 19 7 19 16 0 6-5 9-10 9-4 0-7-2-7-4 0-2 2-3 2-6 0-5-4-9-10-9-7 0-12 6-12 13" fill={`url(#${u}lge1)`} />
      <path d="M18 24c0 8 7 14 15 14 4 0 8-2 10-7-3 2-6 3-9 3-8 0-14-6-14-12 0-3 1-5 3-7-3 1-5 5-5 9z" fill={`url(#${u}lge2)`} />
    </svg>
  ),
  dosya: () => (
    <svg viewBox="0 0 48 48">
      <path d="M4 12a3 3 0 0 1 3-3h12l4 4h18a3 3 0 0 1 3 3v3H4z" fill="#e6a700" />
      <path d="M4 17h40v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#ffc83d" />
      <rect x="4" y="20" width="40" height="5" fill="#2b88d8" />
    </svg>
  ),
  ayarlar: () => (
    <svg viewBox="0 0 48 48">
      <path d="M24 6l4 1 1 5 4 2 4-3 3 3-3 4 2 4 5 1v6l-5 1-2 4 3 4-3 3-4-3-4 2-1 5h-6l-1-5-4-2-4 3-3-3 3-4-2-4-5-1v-6l5-1 2-4-3-4 3-3 4 3 4-2 1-5z" fill="#6b6b6b" />
      <circle cx="24" cy="24" r="7" fill="#e8e8e8" />
    </svg>
  ),
  guvenlik: () => (
    <svg viewBox="0 0 48 48">
      <path d="M24 4l17 6v12c0 11-7 19-17 22C14 41 7 33 7 22V10z" fill="#0067c0" />
      <path d="M24 4l17 6v12c0 11-7 19-17 22z" fill="#2b8ce6" />
      <path d="M17 24l5 5 10-11" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  gorev: () => (
    <svg viewBox="0 0 48 48">
      <rect x="4" y="6" width="40" height="36" rx="4" fill="#1f2937" />
      <path d="M8 32l7-9 6 6 8-14 6 8 5-4" stroke="#37d67a" strokeWidth="3" fill="none" strokeLinejoin="round" />
    </svg>
  ),
  aygit: () => (
    <svg viewBox="0 0 48 48">
      <rect x="5" y="7" width="38" height="26" rx="2" fill="#2f5e94" />
      <rect x="8" y="10" width="32" height="20" fill="#9fd4ff" />
      <rect x="18" y="35" width="12" height="3" fill="#555" />
      <rect x="13" y="38" width="22" height="3" rx="1" fill="#777" />
      <circle cx="33" cy="22" r="6" fill="#6b7280" stroke="#e5e7eb" strokeWidth="2" />
    </svg>
  ),
  word: () => (
    <svg viewBox="0 0 48 48">
      <rect x="14" y="6" width="30" height="36" rx="3" fill="#41a5ee" />
      <rect x="14" y="18" width="30" height="12" fill="#2b7cd3" />
      <rect x="14" y="30" width="30" height="12" rx="0" fill="#185abd" />
      <rect x="4" y="13" width="22" height="22" rx="3" fill="#103f91" />
      <text x="15" y="30" fontSize="15" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Segoe UI, Arial">W</text>
    </svg>
  ),
  winrar: () => (
    <svg viewBox="0 0 48 48">
      <rect x="8" y="5" width="32" height="12" rx="1.5" fill="#8a3ab9" />
      <rect x="8" y="18" width="32" height="12" rx="1.5" fill="#2e9d4b" />
      <rect x="8" y="31" width="32" height="12" rx="1.5" fill="#2763c6" />
      <rect x="21" y="3" width="6" height="42" fill="#c99b4a" />
      <rect x="19" y="21" width="10" height="6" rx="1" fill="#e0c07a" stroke="#8a6a2a" />
    </svg>
  ),
  rufus: () => (
    <svg viewBox="0 0 48 48">
      <rect x="10" y="14" width="26" height="20" rx="3" fill="#3c3c3c" />
      <rect x="36" y="18" width="8" height="12" fill="#c0c0c0" />
      <rect x="38" y="21" width="2" height="2" fill="#555" />
      <rect x="38" y="25" width="2" height="2" fill="#555" />
      <circle cx="20" cy="24" r="5" fill="#f28c28" />
    </svg>
  ),
  kurulum: () => (
    <svg viewBox="0 0 48 48">
      <path d="M6 15l18-9 18 9v20l-18 9-18-9z" fill="#c58b45" />
      <path d="M6 15l18 9 18-9" stroke="#7b5426" strokeWidth="2" fill="none" />
      <path d="M24 24v20" stroke="#7b5426" strokeWidth="2" />
    </svg>
  ),
  sistemkoruma: () => (
    <svg viewBox="0 0 48 48">
      <rect x="5" y="8" width="38" height="26" rx="2" fill="#3a6ea5" />
      <rect x="8" y="11" width="32" height="20" fill="#cfe8ff" />
      <rect x="15" y="37" width="18" height="3" rx="1" fill="#777" />
    </svg>
  ),
  ubuntu: () => (
    <svg viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill="#e95420" />
      <circle cx="24" cy="24" r="9.5" fill="none" stroke="#fff" strokeWidth="4" />
      <circle cx="12" cy="24" r="4" fill="#fff" stroke="#e95420" strokeWidth="2" />
      <circle cx="30" cy="13.6" r="4" fill="#fff" stroke="#e95420" strokeWidth="2" />
      <circle cx="30" cy="34.4" r="4" fill="#fff" stroke="#e95420" strokeWidth="2" />
    </svg>
  ),
  terminal: () => (
    <svg viewBox="0 0 48 48">
      <rect x="4" y="7" width="40" height="34" rx="4" fill="#2c2c2c" />
      <path d="M11 17l7 6-7 6" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M21 31h14" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  firefox: () => (
    <svg viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="#7542e5" />
      <path d="M24 4a20 20 0 1 0 20 20c0-4-1-7-3-10 0 4-2 6-4 7 0-7-4-12-10-15 1 4-1 7-4 9-4 3-6 6-6 10 0 7 5 12 12 12a11 11 0 0 0 10-6c-3 2-8 2-11-1-2-2-3-5-2-8 1 2 3 3 5 3" fill="#ff9500" />
    </svg>
  ),
  office: () => (
    <svg viewBox="0 0 48 48">
      <path d="M8 11l20-7 12 4v32l-12 4-20-7 20 3V8L13 13v20l-5 2z" fill="#eb3c00" />
      <path d="M28 4l12 4v32l-12 4z" fill="#ff6a00" />
    </svg>
  ),
  excel: () => (
    <svg viewBox="0 0 48 48">
      <rect x="14" y="6" width="30" height="36" rx="3" fill="#21a366" />
      <rect x="29" y="6" width="15" height="12" fill="#33c481" />
      <rect x="29" y="30" width="15" height="12" rx="0" fill="#107c41" />
      <rect x="14" y="18" width="15" height="12" fill="#185c37" />
      <rect x="4" y="13" width="22" height="22" rx="3" fill="#107c41" />
      <text x="15" y="30" fontSize="15" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Segoe UI, Arial">X</text>
    </svg>
  ),
  powerpoint: () => (
    <svg viewBox="0 0 48 48">
      <circle cx="28" cy="24" r="18" fill="#ed6c47" />
      <path d="M28 6a18 18 0 0 1 18 18H28z" fill="#ff8f6b" />
      <path d="M28 24h18a18 18 0 0 1-18 18z" fill="#d35230" />
      <rect x="4" y="13" width="22" height="22" rx="3" fill="#c43e1c" />
      <text x="15" y="30" fontSize="15" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Segoe UI, Arial">P</text>
    </svg>
  ),
  acrobat: () => (
    <svg viewBox="0 0 48 48">
      <rect x="4" y="4" width="40" height="40" rx="9" fill="#b30b00" />
      <path d="M13 34c3-2 6-8 9-15 1-4 0-7-1-7s-2 2-1 6c2 6 6 11 12 13 3 1 5 0 4-1s-6-1-12 1c-6 2-10 5-11 3z" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  ),
  photoshop: () => (
    <svg viewBox="0 0 48 48">
      <rect x="4" y="4" width="40" height="40" rx="9" fill="#001e36" />
      <text x="24" y="31" fontSize="17" fontWeight="700" fill="#31a8ff" textAnchor="middle" fontFamily="Segoe UI, Arial">Ps</text>
    </svg>
  ),
  teams: () => (
    <svg viewBox="0 0 48 48">
      <circle cx="35" cy="14" r="5" fill="#7b83eb" />
      <rect x="27" y="20" width="16" height="17" rx="4" fill="#7b83eb" />
      <circle cx="23" cy="12" r="6" fill="#5059c9" />
      <rect x="12" y="19" width="22" height="22" rx="4" fill="#5059c9" />
      <rect x="4" y="15" width="20" height="20" rx="3" fill="#4b53bc" />
      <text x="14" y="30" fontSize="13" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Segoe UI, Arial">T</text>
    </svg>
  ),
  booster: () => (
    <svg viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="#16a34a" />
      <path d="M12 30a12 12 0 1 1 24 0" stroke="#fff" strokeWidth="4" fill="none" />
      <path d="M24 30l8-10" stroke="#fde047" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  mcafee: () => (
    <svg viewBox="0 0 48 48">
      <path d="M24 4l17 6v12c0 11-7 19-17 22C14 41 7 33 7 22V10z" fill="#c01818" />
      <path d="M15 31V17l9 8 9-8v14" stroke="#fff" strokeWidth="3.5" fill="none" />
    </svg>
  ),
  program: () => (
    <svg viewBox="0 0 48 48">
      <rect x="6" y="8" width="36" height="32" rx="4" fill="#64748b" />
      <rect x="6" y="8" width="36" height="8" rx="4" fill="#475569" />
      <rect x="12" y="22" width="24" height="3" fill="#e2e8f0" />
      <rect x="12" y="29" width="16" height="3" fill="#e2e8f0" />
    </svg>
  ),
  geridonusum: () => (
    <svg viewBox="0 0 48 48">
      <path d="M12 12h24l-3 30H15z" fill="#d9e6f2" stroke="#8aa4bd" strokeWidth="2" />
      <rect x="9" y="8" width="30" height="5" rx="1" fill="#b7cbe0" />
      <path d="M20 18v18M28 18v18" stroke="#8aa4bd" strokeWidth="2" />
    </svg>
  ),
};

export const logoVar = (id: string) => id in L;

/** Kurulu uygulama kimliğinden logo kimliği (bilinmeyenler için genel program simgesi) */
export function uygulamaLogo(id: string): string {
  if (id.startsWith('mcafee')) return 'mcafee';
  if (id === 'arama') return 'booster';
  return id in L ? id : 'program';
}

export default function Logo({ id, size = '1.6em', title }: { id: string; size?: string; title?: string }) {
  const u = useId().replace(/:/g, '');
  const svg = L[id]?.(u);
  if (!svg) return null;
  return (
    <span className="logo-svg" style={{ width: size, height: size }} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {svg}
    </span>
  );
}
