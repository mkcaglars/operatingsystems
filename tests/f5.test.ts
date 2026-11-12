import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { scoreTask } from '../web/src/core/scoring';
import type { TaskDef } from '../web/src/core/types';
import { derive, KULLANICI, pcWith, sifirla, yenidenBaslat } from '../web/src/core/winpc';

const dir = new URL('../content/tasks/', import.meta.url);
const tasks = readdirSync(dir).map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as TaskDef);

describe('Windows görevleri: başlangıç durumu', () => {
  for (const t of tasks.filter((x) => x.arayuz === 'windows')) {
    it(t.id, () => {
      const pc = pcWith((t.veri as { pc?: Record<string, unknown> }).pc);
      const r = scoreTask(t, { state: { pc, cevaplar: {} } as never, events: [] }, 0, 0);
      // Başlangıçta hiçbir hata kuralı tetiklenmemeli ve görev kendiliğinden yarıdan fazla geçmemeli
      expect(r.hatalar.map((h) => h.id)).toEqual([]);
      expect(r.basari).toBeLessThan(50);
    });
  }
});

describe('kampanyalar', () => {
  const ids = new Set(tasks.map((t) => t.id));
  const kamp = JSON.parse(readFileSync(new URL('../content/kampanyalar.json', import.meta.url), 'utf8')) as { id: string; adimlar: string[]; kazanimlar: string[] }[];
  for (const k of kamp)
    it(k.id, () => {
      expect(k.adimlar.length).toBeGreaterThan(2);
      for (const a of k.adimlar) expect(ids.has(a), a).toBe(true);
      const kapsam = new Set(k.adimlar.flatMap((a) => tasks.find((t) => t.id === a)!.kazanimlar));
      for (const kz of k.kazanimlar) expect(kapsam.has(kz), kz).toBe(true);
      // Kampanyalarda isteğe bağlı (öğretmenin kapatabileceği) görev olmamalı
      for (const a of k.adimlar) expect(tasks.find((t) => t.id === a)!.istege_bagli).toBeFalsy();
    });
});

describe('arıza mekanizmaları', () => {
  it('hatalı sürücü: normal açılış mavi ekran, geri alınca normal', () => {
    const pc = pcWith({ aygitlar: [{ id: 'gpu', kategori: 'G', ad: 'GPU', durum: 'ok', sorunluSurucu: true, oncekiSurucu: '1' }] });
    expect(yenidenBaslat(pc).acilis).toBe('bsod');
    expect(yenidenBaslat(pc, 'guvenli').acilis).toBe('guvenli');
    pc.aygitlar[0].sorunluSurucu = false;
    expect(yenidenBaslat(derive(pc)).acilis).toBe('normal');
  });
  it('Kod 12: çakışan aygıt kapatılınca diğeri çalışır', () => {
    const pc = pcWith({ aygitlar: [
      { id: 'ses', kategori: 'S', ad: 'Realtek', durum: 'ok' },
      { id: 'sesk', kategori: 'S', ad: 'SB', durum: 'cakisma', cakisan: 'ses' },
    ] });
    expect(pc.sorunluAygitlar).toEqual(['sesk']);
    pc.aygitlar[0].durum = 'devre-disi';
    const d = derive(pc);
    expect(d.sorunluAygitlar).toEqual([]);
    expect(d.devreDisi).toEqual(['ses']);
  });
  it('ağ bağdaştırıcısı kapalıysa internet yok', () => {
    const pc = pcWith({ aygitlar: [{ id: 'lan', kategori: 'A', ad: 'LAN', durum: 'devre-disi' }] });
    expect(pc.internet).toBe(false);
    expect(pc.sorunluAygitlar).toEqual([]);
  });
  it('sıfırla: "hepsi" C: siler, E: kalır; "koru" profildeki zararlıyı bırakır', () => {
    const pc = pcWith({
      zararli: ['profil'],
      fs: { [`${KULLANICI}/Belgeler/proje.docx`]: { tur: 'dosya' }, 'E:': { tur: 'klasor' }, 'E:/proje.docx': { tur: 'dosya' } },
      uygulamalar: [{ id: 'office', ad: 'Office', yayinci: 'M', surum: '1', boyutMB: 1 }],
    });
    const h = sifirla(pc, 'hepsi');
    expect(h.dosyalar).not.toContain(`${KULLANICI}/Belgeler/proje.docx`);
    expect(h.dosyalar).toContain('E:/proje.docx');
    expect(h.dosyalar).toContain(`${KULLANICI}/Belgeler`);
    expect(h.kurulu).not.toContain('office');
    expect(h.zararli).toEqual([]);
    const k = sifirla(pc, 'koru');
    expect(k.dosyalar).toContain(`${KULLANICI}/Belgeler/proje.docx`);
    expect(k.zararli).toEqual(['profil']);
    expect(k.surecAdlari).toContain('profil');
    expect(k.sifirlama).toBe('koru');
  });
});

describe('İ9 olumsuz yollar', () => {
  const t = tasks.find((x) => x.id === 'i9-g7')!;
  const pc0 = () => pcWith((t.veri as { pc?: Record<string, unknown> }).pc);
  const puanla = (pc: ReturnType<typeof pc0>, events: { type: string; t: number }[]) => scoreTask(t, { state: { pc, cevaplar: {} } as never, events }, 0, 0);
  it('yedeksiz "her şeyi kaldır" → veri kaybı cezası', () => {
    const r = puanla(sifirla(pc0(), 'hepsi'), [{ type: 'sifirla', t: 1 }]);
    expect(r.hatalar.map((h) => h.id)).toContain('kayip');
  });
  it('"dosyalarımı koru" → zararlı kalır, ceza', () => {
    const r = puanla(sifirla(pc0(), 'koru'), [{ type: 'sifirla', t: 1 }]);
    expect(r.hatalar.map((h) => h.id)).toEqual(['koru']);
    expect(r.kriterler.find((k) => k.id === 'temiz')!.gecti).toBe(false);
  });
});
