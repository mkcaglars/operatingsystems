// Ubuntu (GNOME) terminal penceresi. Komutlar core/shell.ts ile çalışır; her komut "komut" olayı olarak kaydedilir.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { complete, exec, prompt, type ShellState } from '../core/shell';
import type { Sim } from '../core/sim';

interface Line {
  p?: string;
  text: string;
  err?: boolean;
}

type WithShell = { sh: ShellState };

function renderOut(text: string) {
  // ls çıktısında klasörler \u001b[d] ile işaretlenir → mavi kalın
  return text.split(/(\u001b\[d\][^\s]+)/).map((part, i) =>
    part.startsWith('\u001b[d]') ? (
      <b key={i} className="t-dir">
        {part.slice(4)}
      </b>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function Terminal({ sim, height = 360 }: { sim: Sim<WithShell>; height?: number }) {
  const sh = sim.state.sh;
  const [lines, setLines] = useState<Line[]>([{ text: 'Ubuntu 24.04.1 LTS — eğitsel terminal simülasyonu. Komut listesi için: help' }]);
  const [input, setInput] = useState('');
  const [hi, setHi] = useState<number | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const inp = useRef<HTMLInputElement>(null);

  useEffect(() => {
    body.current?.scrollTo(0, body.current.scrollHeight);
  }, [lines]);

  function run() {
    const line = input;
    const p = prompt(sh);
    const r = exec(sh, line);
    setInput('');
    setHi(null);
    if (r.clear) setLines([]);
    else setLines((l) => [...l, { p, text: line }, ...(r.out ? [{ text: r.out, err: r.code !== 0 }] : [])]);
    if (line.trim()) sim.act('komut', { ad: r.ad, satir: line.trim(), kod: r.code }, (st: WithShell) => ({ ...st, sh: r.state }));
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      run();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setInput(complete(sh, input));
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const h = sh.history;
      if (!h.length) return;
      let i = hi === null ? h.length : hi;
      i = e.key === 'ArrowUp' ? Math.max(0, i - 1) : Math.min(h.length, i + 1);
      setHi(i);
      setInput(h[i] ?? '');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }

  return (
    <div className="term" onClick={() => inp.current?.focus()}>
      <div className="term-title">
        <span>{prompt(sh).replace(/[$#]$/, '')}</span>
        <span className="term-ctrl" aria-hidden>
          <i>─</i>
          <i>☐</i>
          <i className="x">✕</i>
        </span>
      </div>
      <div className="term-body" ref={body} style={{ height }}>
        {lines.map((l, i) => (
          <div key={i} className={'t-line' + (l.err ? ' t-err' : '')}>
            {l.p && <span className="t-prompt">{l.p} </span>}
            {l.p ? l.text : renderOut(l.text)}
          </div>
        ))}
        <div className="t-line t-input">
          <span className="t-prompt">{prompt(sh)} </span>
          <input
            ref={inp}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            aria-label="Terminal komutu"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
