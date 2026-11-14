// Komut İstemi (cmd) ve Windows PowerShell penceresi: komutlar core/winkabuk.ts ile sanal bilgisayarda çalışır.
import { useEffect, useRef, useState } from 'react';
import { calistir, istem, tamamla, type Kabuk } from '../core/winkabuk';
import { KULLANICI } from '../core/winpc';
import type { AppCtx, AppId } from './Masaustu';

const BASLIK: Record<Kabuk, string> = {
  cmd: 'Microsoft Windows [Version 10.0.26100.2314]\n(c) Microsoft Corporation. Tüm hakları saklıdır.\n',
  ps: 'Windows PowerShell\nTelif Hakkı (C) Microsoft Corporation. Tüm hakları saklıdır.\n\nYeni özellikler ve iyileştirmeler için en son PowerShell\'i yükleyin! https://aka.ms/PSWindows\n',
};

type Satir = { t: string; hata?: boolean };

export default function Konsol({ ctx, kabuk }: { ctx: AppCtx; kabuk: Kabuk }) {
  const { pc } = ctx;
  const [cwd, setCwd] = useState(() => (ctx.arg && pc.fs[ctx.arg]?.tur === 'klasor' ? ctx.arg : KULLANICI));
  const [satirlar, setSatirlar] = useState<Satir[]>([{ t: BASLIK[kabuk] + '\n' + (kabuk === 'cmd' ? 'Komutların listesi için help yazın.\n' : 'Komutların listesi için help yazın.\n') }]);
  const [girdi, setGirdi] = useState('');
  const [gecmis, setGecmis] = useState<string[]>([]);
  const [gi, setGi] = useState(-1);
  const giris = useRef<HTMLInputElement>(null);
  const alt = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alt.current?.scrollIntoView({ block: 'end' });
  }, [satirlar]);
  useEffect(() => giris.current?.focus(), []);

  const gonder = () => {
    const komut = girdi;
    const s = calistir(pc, cwd, komut, kabuk);
    setGirdi('');
    setGi(-1);
    if (komut.trim()) setGecmis((g) => [...g, komut]);
    const ad = komut.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
    if (komut.trim()) ctx.act(`konsol.komut`, { kabuk, komut: ad, satir: komut.trim().slice(0, 120), hata: !!s.hata }, (p) => (s.degis?.(p), p));
    if (s.ozel === 'temizle') return setSatirlar([]);
    if (s.ozel === 'cikis') return ctx.close(kabuk === 'ps' ? 'powershell' : 'cmd');
    setSatirlar((x) => [...x, { t: istem(kabuk, cwd) + komut }, ...(s.cikti ? [{ t: s.cikti, hata: s.hata }] : []), ...(komut.trim() ? [{ t: '' }] : [])]);
    setCwd(s.cwd);
    if (s.ozel && typeof s.ozel === 'object') ctx.open(s.ozel.ac as AppId, s.ozel.arg);
  };

  return (
    <div className={'konsol ' + kabuk} onClick={() => window.getSelection()?.isCollapsed && giris.current?.focus()} role="log" aria-label={kabuk === 'ps' ? 'PowerShell' : 'Komut İstemi'}>
      {satirlar.map((s, i) => (
        <pre key={i} className={s.hata ? 'hata' : ''}>
          {s.t}
        </pre>
      ))}
      <div className="konsol-satir" ref={alt}>
        <pre>{istem(kabuk, cwd)}</pre>
        <input
          ref={giris}
          value={girdi}
          spellCheck={false}
          autoComplete="off"
          aria-label="Komut"
          onChange={(e) => setGirdi(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.preventDefault(), gonder());
            else if (e.key === 'Tab') (e.preventDefault(), setGirdi((g) => tamamla(pc, cwd, g)));
            else if (e.key === 'ArrowUp' && gecmis.length) {
              e.preventDefault();
              const i = gi < 0 ? gecmis.length - 1 : Math.max(0, gi - 1);
              setGi(i);
              setGirdi(gecmis[i]);
            } else if (e.key === 'ArrowDown' && gi >= 0) {
              e.preventDefault();
              const i = gi + 1;
              if (i >= gecmis.length) (setGi(-1), setGirdi(''));
              else (setGi(i), setGirdi(gecmis[i]));
            } else if (e.key === 'Escape') setGirdi('');
            else if (e.ctrlKey && e.key.toLowerCase() === 'l') (e.preventDefault(), setSatirlar([]));
          }}
        />
      </div>
    </div>
  );
}
