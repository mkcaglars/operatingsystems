import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { evaluate, type Rule } from '../web/src/core/rules';
import { scoreTask, timeScore, levelOf } from '../web/src/core/scoring';
import type { TaskDef } from '../web/src/core/types';

const fx = JSON.parse(readFileSync(new URL('./fixtures/rules.json', import.meta.url), 'utf8'));
const ctx = { state: fx.durum, events: fx.olaylar };

describe('kural motoru (TS)', () => {
  for (const c of fx.kurallar) {
    it(c.ad, () => expect(evaluate(c.kural as Rule, ctx)).toBe(c.beklenen));
  }
});

describe('puanlama', () => {
  it('süre puanı', () => {
    expect(timeScore(50, 100)).toBe(100);
    expect(timeScore(200, 100)).toBe(50);
    expect(timeScore(300, 100)).toBe(0);
    expect(timeScore(999, undefined)).toBe(100);
  });
  it('düzeyler', () => {
    expect(levelOf(null)).toBe('baslamadi');
    expect(levelOf(30)).toBe('gelisiyor');
    expect(levelOf(50)).toBe('yeterli');
    expect(levelOf(85)).toBe('ustalasti');
  });
  it('örnek görev', () => {
    const r = scoreTask(fx.gorev as TaskDef, ctx, 80, 0);
    // a (2) geçti, b (1) geçmedi, c (1) geçti → 75; hata 15 → süreç 85; süre 100
    expect(r.basari).toBe(75);
    expect(r.surec).toBe(85);
    expect(r.puan).toBe(Math.round((75 * 70 + 85 * 20 + 100 * 10) / 100));
    expect(r.kazanimlar.Y1).toBe(r.puan);
  });
});

describe('TS ve PHP aynı sonucu verir', () => {
  const php = JSON.parse(execFileSync('php', ['tests/php/rules_test.php', '--json'], { encoding: 'utf8' }));
  it('kurallar', () => {
    expect(php.kurallar).toEqual(fx.kurallar.map((c: { kural: Rule }) => evaluate(c.kural, ctx)));
  });
  it('görevlerin örnek çözümleri', () => {
    const dir = new URL('../content/tasks/', import.meta.url);
    const ts = readdirSync(dir)
      .sort()
      .map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as TaskDef)
      .map((t) => [scoreTask(t, t.test_cozum!, 0, 0), scoreTask(t, { state: {}, events: [] }, 0, 0)]);
    expect(php.gorevler).toEqual(ts);
  });
  it('puanlama', () => {
    const ts = fx.puanlama.map((p: { sure: number; ipucu: number }) => scoreTask(fx.gorev as TaskDef, ctx, p.sure, p.ipucu));
    expect(php.puanlama).toEqual(ts);
  });
});

describe('içerik dosyaları', () => {
  const dir = new URL('../content/tasks/', import.meta.url);
  const kazanimlar = new Set(JSON.parse(readFileSync(new URL('../content/kazanimlar.json', import.meta.url), 'utf8')).map((k: { kod: string }) => k.kod));
  for (const f of readdirSync(dir)) {
    it(f, () => {
      const t = JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as TaskDef;
      expect(f).toBe(t.id + '.json');
      for (const k of t.kazanimlar) expect(kazanimlar.has(k)).toBe(true);
      for (const k of t.kriterler) for (const kk of k.kazanimlar ?? []) expect(t.kazanimlar).toContain(kk);
      // Hiçbir şey yapmayan öğrenci düşük başarı almalı (kurallar kendiliğinden geçmemeli)
      const bos = scoreTask(t, { state: {}, events: [] }, 0, 0);
      expect(bos.basari).toBeLessThan(20);
      // Örnek çözüm tam başarı almalı ve hiçbir hata kuralına takılmamalı
      expect(t.test_cozum, 'test_cozum eksik').toBeTruthy();
      const r = scoreTask(t, t.test_cozum!, 0, 0);
      expect(r.kriterler.filter((k) => !k.gecti).map((k) => k.id)).toEqual([]);
      expect(r.hatalar).toEqual([]);
      expect(r.puan).toBe(100);
    });
  }
});
