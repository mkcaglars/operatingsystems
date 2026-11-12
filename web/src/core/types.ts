import type { Json } from './rules';

export type Mode = 'ogren' | 'uygula' | 'degerlendir';

export interface TaskCriterion {
  id: string;
  aciklama: string;
  agirlik?: number;
  kazanimlar?: string[];
  kural: Json;
}

export interface TaskMistake {
  id: string;
  aciklama: string;
  ceza: number;
  kural: Json;
}

export interface TaskDef {
  id: string;
  istasyon: string;
  baslik: string;
  senaryo: string;
  kazanimlar: string[];
  /** Hangi arayüz bileşeni çalıştıracak (ör. "kontrol-listesi") */
  arayuz: string;
  /** Arayüze özel veriler */
  veri: Json;
  /** Öğren modunda gösterilen kısa anlatım paragrafları */
  ogren?: string[];
  ipuclari?: string[];
  ipucu_cezasi?: number;
  sure_hedef?: number;
  agirliklar?: { basari?: number; surec?: number; sure?: number };
  kriterler: TaskCriterion[];
  hatalar?: TaskMistake[];
  /** Testler için örnek tam puanlı çözüm (arayüzde kullanılmaz) */
  test_cozum?: { state: Json; events: import('./rules').SimEvent[] };
  /** Öğretmenin sınıf ayarlarından açtığı isteğe bağlı yazılım görevi (açılmadıysa öğrenciye görünmez) */
  istege_bagli?: 'winrar' | 'acrobat' | 'photoshop';
  /** "ileri düzey" görevler isteğe bağlıdır */
  ileri?: boolean;
}

export interface Station {
  id: string;
  kod: string;
  ad: string;
  aciklama: string;
  kazanimlar: string[];
  faz: string;
}

export interface Outcome {
  kod: string;
  tur: 'Bilgi' | 'Beceri' | 'Yeterlilik';
  metin: string;
  modul: string;
}
