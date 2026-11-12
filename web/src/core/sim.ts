// Simülasyon durumu + olay günlüğü. Her öğrenci eylemi zaman damgalı bir olay olarak kaydedilir;
// puan, görev sonunda son durum ve bu günlük üzerinden (sunucuda) hesaplanır.
import { useCallback, useRef, useState } from 'react';
import type { Json, SimEvent } from './rules';

export interface Sim<S> {
  state: S;
  events: SimEvent[];
  /** Bir eylemi kaydeder ve durumu günceller. */
  act: (type: string, data: Record<string, Json>, update: (s: S) => S) => void;
  /** Kaydedilmiş bir çalışmadan devam etmek için */
  restore: (state: S, events: SimEvent[]) => void;
  elapsedMs: () => number;
}

export function useSim<S>(initial: S): Sim<S> {
  const [state, setState] = useState<S>(initial);
  const [events, setEvents] = useState<SimEvent[]>([]);
  const t0 = useRef(performance.now());

  const elapsedMs = useCallback(() => Math.round(performance.now() - t0.current), []);

  const act = useCallback(
    (type: string, data: Record<string, Json>, update: (s: S) => S) => {
      const e: SimEvent = { ...data, type, t: elapsedMs() };
      setEvents((list) => [...list, e]);
      setState((s) => update(s));
    },
    [elapsedMs],
  );

  const restore = useCallback((s: S, ev: SimEvent[]) => {
    setState(s);
    setEvents(ev);
    const last = ev.length ? ev[ev.length - 1].t : 0;
    t0.current = performance.now() - last;
  }, []);

  return { state, events, act, restore, elapsedMs };
}

/** Dizide öğeyi ekler/çıkarır (değişmez). */
export function toggleIn<T>(list: T[], item: T, on: boolean): T[] {
  const has = list.includes(item);
  if (on && !has) return [...list, item];
  if (!on && has) return list.filter((x) => x !== item);
  return list;
}
