// İ1-G2 Kasa arka paneli: kabloyu seç, porta tıkla. Fiş tipi uymuyorsa takılmaz; tipi uyup yanlış olan
// porta takılabilir (gerçekteki gibi) ve "Bilgisayarı aç ve dene" ile sonucu görülür.
import { useState, type ReactNode } from 'react';
import Sorular, { type Soru } from '../components/Sorular';
import type { TaskUIProps } from './registry';

type PortTur = 'guc' | 'ps2' | 'usb' | 'hdmi' | 'dp' | 'vga' | 'rj45' | 'jak';
interface Port {
  id: string;
  tur: PortTur;
  ad: string;
  x: number;
  y: number;
  renk?: string;
}
interface Kablo {
  id: string;
  ad: string;
  tur: PortTur;
  renk: string;
  dogru: string[];
  yanlisMesaj: string;
}
interface Veri {
  kablolar: Kablo[];
  sorular?: Soru[];
}
interface State {
  baglanti: Record<string, string>;
  test: Record<string, boolean> | null;
  cevaplar: Record<string, string | string[]>;
}

export const initialArkaPanel = (): State => ({ baglanti: {}, test: null, cevaplar: {} });

const PORTS: Port[] = [
  { id: 'psu', tur: 'guc', ad: 'Güç kaynağı girişi (IEC C14)', x: 236, y: 62 },
  { id: 'ps2-mor', tur: 'ps2', ad: 'PS/2 (mor) — klavye', x: 65, y: 205, renk: '#7c3aed' },
  { id: 'ps2-yesil', tur: 'ps2', ad: 'PS/2 (yeşil) — fare', x: 115, y: 205, renk: '#16a34a' },
  { id: 'usb-1', tur: 'usb', ad: 'USB 2.0', x: 42, y: 232 },
  { id: 'usb-2', tur: 'usb', ad: 'USB 2.0', x: 96, y: 232 },
  { id: 'mb-dp', tur: 'dp', ad: 'Anakart DisplayPort (tümleşik grafik)', x: 44, y: 266 },
  { id: 'mb-hdmi', tur: 'hdmi', ad: 'Anakart HDMI (tümleşik grafik)', x: 96, y: 266 },
  { id: 'mb-vga', tur: 'vga', ad: 'Anakart VGA (tümleşik grafik)', x: 60, y: 298 },
  { id: 'usb-3', tur: 'usb', ad: 'USB 3.2 (mavi)', x: 42, y: 340, renk: '#2563eb' },
  { id: 'usb-4', tur: 'usb', ad: 'USB 3.2 (mavi)', x: 96, y: 340, renk: '#2563eb' },
  { id: 'lan', tur: 'rj45', ad: 'Ağ (RJ45)', x: 48, y: 372 },
  { id: 'usb-5', tur: 'usb', ad: 'USB 3.2 (mavi)', x: 96, y: 372, renk: '#2563eb' },
  { id: 'usb-6', tur: 'usb', ad: 'USB 3.2 (mavi)', x: 96, y: 392, renk: '#2563eb' },
  { id: 'ses-mavi', tur: 'jak', ad: 'Line-in (mavi)', x: 58, y: 442, renk: '#3b82f6' },
  { id: 'ses-yesil', tur: 'jak', ad: 'Line-out — hoparlör (yeşil)', x: 90, y: 442, renk: '#22c55e' },
  { id: 'ses-pembe', tur: 'jak', ad: 'Mikrofon (pembe)', x: 122, y: 442, renk: '#ec4899' },
  { id: 'gpu-hdmi', tur: 'hdmi', ad: 'Ekran kartı HDMI', x: 70, y: 532 },
  { id: 'gpu-dp', tur: 'dp', ad: 'Ekran kartı DisplayPort', x: 130, y: 532 },
  { id: 'gpu-dp2', tur: 'dp', ad: 'Ekran kartı DisplayPort', x: 180, y: 532 },
];

const TUR_AD: Record<PortTur, string> = { guc: 'güç', ps2: 'PS/2', usb: 'USB', hdmi: 'HDMI', dp: 'DisplayPort', vga: 'VGA', rj45: 'RJ45', jak: '3,5 mm jak' };

function PortShape({ p, state }: { p: Port; state: 'idle' | 'target' | 'used' }): ReactNode {
  const stroke = state === 'target' ? '#facc15' : '#0b0b0b';
  const sw = state === 'target' ? 2.5 : 1;
  switch (p.tur) {
    case 'guc':
      return (
        <g>
          <rect x={p.x} y={p.y} width={40} height={28} rx={3} fill="#111" stroke={stroke} strokeWidth={sw} />
          {[8, 18, 28].map((dx, i) => (
            <rect key={i} x={p.x + dx} y={p.y + (i === 1 ? 6 : 12)} width={4} height={9} fill="#9ca3af" />
          ))}
        </g>
      );
    case 'ps2':
      return (
        <g>
          <circle cx={p.x} cy={p.y} r={11} fill={p.renk} stroke={stroke} strokeWidth={sw} />
          <circle cx={p.x} cy={p.y} r={6} fill="#111" />
        </g>
      );
    case 'usb':
      return (
        <g>
          <rect x={p.x} y={p.y} width={30} height={12} rx={1} fill="#c7cbd1" stroke={stroke} strokeWidth={sw} />
          <rect x={p.x + 3} y={p.y + 2} width={24} height={5} fill={p.renk ?? '#111'} />
        </g>
      );
    case 'hdmi':
      return <path d={`M${p.x} ${p.y} h34 v8 l-4 5 h-26 l-4 -5 z`} fill="#111" stroke={state === 'target' ? stroke : '#9ca3af'} strokeWidth={sw} />;
    case 'dp':
      return <path d={`M${p.x} ${p.y} h30 v13 h-26 l-4 -4 z`} fill="#111" stroke={state === 'target' ? stroke : '#9ca3af'} strokeWidth={sw} />;
    case 'vga':
      return (
        <g>
          <path d={`M${p.x} ${p.y} h44 l-4 15 h-36 z`} fill="#1d4ed8" stroke={stroke} strokeWidth={sw} />
          <circle cx={p.x - 8} cy={p.y + 7} r={3.5} fill="#9ca3af" />
          <circle cx={p.x + 52} cy={p.y + 7} r={3.5} fill="#9ca3af" />
        </g>
      );
    case 'rj45':
      return (
        <g>
          <rect x={p.x} y={p.y} width={26} height={24} fill="#c7cbd1" stroke={stroke} strokeWidth={sw} />
          <rect x={p.x + 4} y={p.y + 4} width={18} height={14} fill="#111" />
          <rect x={p.x + 9} y={p.y + 18} width={8} height={4} fill="#111" />
          <circle cx={p.x + 4} cy={p.y + 3} r={1.6} fill="#22c55e" />
        </g>
      );
    case 'jak':
      return (
        <g>
          <circle cx={p.x} cy={p.y} r={10} fill={p.renk} stroke={stroke} strokeWidth={sw} />
          <circle cx={p.x} cy={p.y} r={4} fill="#111" />
        </g>
      );
  }
}

function center(p: Port): [number, number] {
  switch (p.tur) {
    case 'ps2':
    case 'jak':
      return [p.x, p.y];
    case 'guc':
      return [p.x + 20, p.y + 14];
    case 'vga':
      return [p.x + 22, p.y + 7];
    case 'rj45':
      return [p.x + 13, p.y + 12];
    default:
      return [p.x + 15, p.y + 6];
  }
}

export default function ArkaPanel({ task, mode, sim }: TaskUIProps) {
  const veri = task.veri as unknown as Veri;
  const s = sim.state as State;
  const learn = mode === 'ogren';
  const [secili, setSecili] = useState<string | null>(veri.kablolar[0].id);
  const [mesaj, setMesaj] = useState<{ ok: boolean; text: string } | null>(null);
  const kablo = veri.kablolar.find((k) => k.id === secili);
  const portSahibi = (pid: string) => Object.entries(s.baglanti).find(([, v]) => v === pid)?.[0];

  function portTikla(p: Port) {
    const sahip = portSahibi(p.id);
    if (sahip && sahip !== secili) {
      sim.act('baglanti.cikar', { kablo: sahip, port: p.id }, (st: State) => {
        const b = { ...st.baglanti };
        delete b[sahip];
        return { ...st, baglanti: b, test: null };
      });
      setSecili(sahip);
      setMesaj({ ok: true, text: `${veri.kablolar.find((k) => k.id === sahip)?.ad} çıkarıldı.` });
      return;
    }
    if (!kablo) return;
    if (kablo.tur !== p.tur) {
      sim.act('baglanti.uyumsuz', { kablo: kablo.id, port: p.id }, (st: State) => st);
      setMesaj({ ok: false, text: `${kablo.ad} bu porta uymuyor: fiş ${TUR_AD[kablo.tur]}, port ${TUR_AD[p.tur]}.` });
      return;
    }
    sim.act('baglanti.tak', { kablo: kablo.id, port: p.id }, (st: State) => ({ ...st, baglanti: { ...st.baglanti, [kablo.id]: p.id }, test: null }));
    setMesaj(learn ? { ok: kablo.dogru.includes(p.id), text: kablo.dogru.includes(p.id) ? `${kablo.ad} → ${p.ad}. Doğru!` : `${kablo.ad} → ${p.ad}. Fiş uyuyor ama bu port doğru mu? ${kablo.yanlisMesaj}` } : { ok: true, text: `${kablo.ad} → ${p.ad}` });
    const next = veri.kablolar.find((k) => k.id !== kablo.id && !s.baglanti[k.id]);
    setSecili(next?.id ?? null);
  }

  function dene() {
    const sonuc: Record<string, boolean> = {};
    const guc = veri.kablolar.find((k) => k.tur === 'guc');
    const enerji = !!guc && s.baglanti[guc.id] !== undefined && guc.dogru.includes(s.baglanti[guc.id]);
    for (const k of veri.kablolar) sonuc[k.id] = enerji && k.dogru.includes(s.baglanti[k.id] ?? '');
    sim.act('pc.test', { sonuc }, (st: State) => ({ ...st, test: sonuc }));
  }

  return (
    <div className="ap">
      <div className="ap-cables">
        <h4>Kablolar</h4>
        <p className="small muted">Bir kablo seç, sonra kasanın arkasındaki porta tıkla. Takılı bir porta tıklarsan kablo çıkar.</p>
        {veri.kablolar.map((k) => {
          const port = PORTS.find((p) => p.id === s.baglanti[k.id]);
          const t = s.test?.[k.id];
          return (
            <button key={k.id} className={'ap-cable ' + (secili === k.id ? 'on' : '')} onClick={() => setSecili(k.id)}>
              <span className="plug" style={{ background: k.renk }} />
              <span>
                <b>{k.ad}</b>
                <small>{port ? `→ ${port.ad}` : 'takılı değil'}</small>
              </span>
              {s.test && <span className={'res ' + (t ? 'ok' : 'no')}>{t ? '✔' : '✘'}</span>}
            </button>
          );
        })}
        <button className="btn primary block" onClick={dene} disabled={Object.keys(s.baglanti).length === 0}>
          ⏻ Bilgisayarı aç ve dene
        </button>
        {s.test && (
          <div className="ap-test small">
            {veri.kablolar.map((k) => (
              <div key={k.id} className={s.test![k.id] ? 'ok' : 'no'}>
                {s.test![k.id] ? '✔' : '✘'} {k.ad}: {s.test![k.id] ? 'çalışıyor' : s.baglanti[k.id] ? 'çalışmıyor' : 'bağlı değil'}
              </div>
            ))}
          </div>
        )}
        {mesaj && <div className={'note ' + (mesaj.ok ? 'info' : 'error')}>{mesaj.text}</div>}
      </div>

      <div className="ap-case">
        <svg viewBox="0 0 360 700" role="img" aria-label="Bilgisayar kasasının arka paneli">
          <defs>
            <linearGradient id="kasa" x1="0" x2="1">
              <stop offset="0" stopColor="#2a2d33" />
              <stop offset="0.5" stopColor="#3a3e45" />
              <stop offset="1" stopColor="#24272c" />
            </linearGradient>
            <pattern id="delik" width="9" height="9" patternUnits="userSpaceOnUse">
              <circle cx="4.5" cy="4.5" r="2.6" fill="#0e0f11" />
            </pattern>
            <linearGradient id="shield" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#b9bec6" />
              <stop offset="1" stopColor="#8e949c" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="352" height="692" rx="10" fill="url(#kasa)" stroke="#111" />
          {/* Güç kaynağı */}
          <rect x="20" y="20" width="320" height="130" rx="4" fill="#1b1d21" stroke="#0a0a0a" />
          <circle cx="110" cy="85" r="52" fill="url(#delik)" stroke="#444" />
          <circle cx="110" cy="85" r="12" fill="#2b2e33" />
          <text x="236" y="112" fill="#8b9098" fontSize="9">
            100-240V~ 50/60Hz
          </text>
          <rect x="292" y="64" width="22" height="26" rx="2" fill="#111" stroke="#555" />
          <rect x="296" y="68" width="14" height="18" fill="#2b2b2b" />
          <text x="297" y="62" fill="#8b9098" fontSize="8">
            I/O
          </text>
          {/* G/Ç paneli */}
          <rect x="28" y="178" width="126" height="298" rx="2" fill="url(#shield)" stroke="#555" />
          {/* Fan */}
          <circle cx="255" cy="320" r="72" fill="url(#delik)" stroke="#555" />
          <circle cx="255" cy="320" r="14" fill="#2b2e33" />
          {/* Genişleme yuvaları */}
          {[512, 562, 592, 622, 652].map((y, i) => (
            <g key={y}>
              <rect x="24" y={y} width="300" height={i === 0 ? 44 : 22} rx="2" fill={i === 0 ? '#1f2226' : '#2f3238'} stroke="#111" />
              {i > 0 && Array.from({ length: 9 }).map((_, j) => <rect key={j} x={44 + j * 30} y={y + 7} width={18} height={8} rx="2" fill="#16181b" />)}
            </g>
          ))}
          <text x="230" y="545" fill="#8b9098" fontSize="9">
            Ekran kartı
          </text>
          {PORTS.map((p) => {
            const used = !!portSahibi(p.id);
            const st = used ? 'used' : kablo && kablo.tur === p.tur ? 'target' : 'idle';
            return (
              <g key={p.id} className="ap-port" onClick={() => portTikla(p)} role="button" aria-label={p.ad}>
                <title>{p.ad}</title>
                <PortShape p={p} state={st} />
              </g>
            );
          })}
          {/* Takılı kablolar */}
          {veri.kablolar.map((k) => {
            const p = PORTS.find((x) => x.id === s.baglanti[k.id]);
            if (!p) return null;
            const [cx, cy] = center(p);
            return (
              <g key={k.id} pointerEvents="none">
                <path d={`M${cx} ${cy} C ${cx - 40} ${cy + 30}, ${-20} ${cy + 60}, -40 ${cy + 120}`} stroke={k.renk} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.92" />
                <circle cx={cx} cy={cy} r="7" fill={k.renk} stroke="#fff" strokeWidth="1.5" />
              </g>
            );
          })}
        </svg>
      </div>
      {veri.sorular && <Sorular sorular={veri.sorular} sim={sim} learn={learn} />}
    </div>
  );
}
