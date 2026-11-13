// Excel benzeri tablo hesaplayıcı. Türkçe Excel gibi: ondalık ayırıcı virgül, bağımsız değişken ayırıcı noktalı virgül.
// Desteklenen: + - * / ^ ( ), hücre başvurusu (A1), aralık (A1:B5), TOPLA/SUM, ORTALAMA/AVERAGE, MAK/MAX, MİN/MIN, SAY/COUNT, EĞER/IF.

export type Hucreler = Record<string, string>;
export const SUTUNLAR = 'ABCDEFGH'.split('');
export const SATIR_SAYISI = 20;

type Deger = number | string;
class Hata extends Error {}

const hucreAdi = (s: string) => s.toUpperCase();

function aralik(a: string, b: string): string[] {
  const m1 = /^([A-Z])(\d+)$/.exec(a);
  const m2 = /^([A-Z])(\d+)$/.exec(b);
  if (!m1 || !m2) throw new Hata('#BAŞV!');
  const [c1, c2] = [m1[1].charCodeAt(0), m2[1].charCodeAt(0)].sort((x, y) => x - y);
  const [r1, r2] = [Number(m1[2]), Number(m2[2])].sort((x, y) => x - y);
  const out: string[] = [];
  for (let c = c1; c <= c2; c++) for (let r = r1; r <= r2; r++) out.push(String.fromCharCode(c) + r);
  return out;
}

/** Bir hücrenin görünen değerini hesaplar (formül değilse sayı ya da metin) */
export function hesapla(h: Hucreler, ad: string, yigin: string[] = []): Deger {
  const ham = (h[ad] ?? '').trim();
  if (!ham.startsWith('=')) {
    if (ham === '') return '';
    const n = sayiOku(ham);
    return n ?? ham;
  }
  if (yigin.includes(ad)) return '#DÖNGÜ!';
  try {
    const v = new Ayristirici(ham.slice(1), h, [...yigin, ad]).tum();
    if (typeof v === 'number' && !Number.isFinite(v)) return '#SAYI/0!';
    return v;
  } catch (e) {
    return e instanceof Hata ? e.message : '#DEĞER!';
  }
}

export function sayiOku(s: string): number | null {
  let t = s.trim();
  // 1.250,75 → binlik nokta + ondalık virgül; 1.250 → binlik; 3.5 → ondalık
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}

export function goster(v: Deger): string {
  if (typeof v === 'number') return v.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
  return v;
}

class Ayristirici {
  private i = 0;
  constructor(
    private s: string,
    private h: Hucreler,
    private yigin: string[],
  ) {}

  tum(): Deger {
    const v = this.karsilastirma();
    this.bosluk();
    if (this.i < this.s.length) throw new Hata('#AD?');
    return v;
  }
  private bosluk() {
    while (this.s[this.i] === ' ') this.i++;
  }
  private sayi(v: Deger): number {
    if (typeof v === 'number') return v;
    if (v === '') return 0;
    if (v.startsWith('#')) throw new Hata(v);
    const n = sayiOku(v);
    if (n === null) throw new Hata('#DEĞER!');
    return n;
  }
  private karsilastirma(): Deger {
    const a = this.toplam();
    this.bosluk();
    const op = /^(<=|>=|<>|=|<|>)/.exec(this.s.slice(this.i))?.[0];
    if (!op) return a;
    this.i += op.length;
    const b = this.toplam();
    const x = this.sayi(a);
    const y = this.sayi(b);
    const r = op === '=' ? x === y : op === '<>' ? x !== y : op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
    return r ? 1 : 0;
  }
  private toplam(): Deger {
    let v = this.carpim();
    for (;;) {
      this.bosluk();
      const c = this.s[this.i];
      if (c !== '+' && c !== '-') return v;
      this.i++;
      const r = this.carpim();
      v = c === '+' ? this.sayi(v) + this.sayi(r) : this.sayi(v) - this.sayi(r);
    }
  }
  private carpim(): Deger {
    let v = this.us();
    for (;;) {
      this.bosluk();
      const c = this.s[this.i];
      if (c !== '*' && c !== '/') return v;
      this.i++;
      const r = this.sayi(this.us());
      if (c === '/' && r === 0) throw new Hata('#SAYI/0!');
      v = c === '*' ? this.sayi(v) * r : this.sayi(v) / r;
    }
  }
  private us(): Deger {
    const v = this.tekli();
    this.bosluk();
    if (this.s[this.i] === '^') {
      this.i++;
      return Math.pow(this.sayi(v), this.sayi(this.us()));
    }
    return v;
  }
  private tekli(): Deger {
    this.bosluk();
    if (this.s[this.i] === '-') {
      this.i++;
      return -this.sayi(this.tekli());
    }
    if (this.s[this.i] === '+') {
      this.i++;
      return this.tekli();
    }
    return this.oge();
  }
  private oge(): Deger {
    this.bosluk();
    const kalan = this.s.slice(this.i);
    if (kalan[0] === '(') {
      this.i++;
      const v = this.karsilastirma();
      this.bosluk();
      if (this.s[this.i] !== ')') throw new Hata('#AD?');
      this.i++;
      return v;
    }
    if (kalan[0] === '"') {
      const son = kalan.indexOf('"', 1);
      if (son < 0) throw new Hata('#AD?');
      this.i += son + 1;
      return kalan.slice(1, son);
    }
    const sayi = /^\d+(,\d+)?/.exec(kalan);
    if (sayi) {
      this.i += sayi[0].length;
      return Number(sayi[0].replace(',', '.'));
    }
    const fn = /^([A-Za-zÇĞİÖŞÜçğıöşü]+)\s*\(/.exec(kalan);
    if (fn) {
      this.i += fn[0].length;
      return this.islev(fn[1].toLocaleUpperCase('tr'));
    }
    const ref = /^([A-Za-z])(\d+)/.exec(kalan);
    if (ref) {
      this.i += ref[0].length;
      const ad = hucreAdi(ref[0]);
      if (!SUTUNLAR.includes(ad[0]) || Number(ref[2]) < 1 || Number(ref[2]) > SATIR_SAYISI) throw new Hata('#BAŞV!');
      const v = hesapla(this.h, ad, this.yigin);
      if (typeof v === 'string' && v.startsWith('#')) throw new Hata(v);
      return v;
    }
    throw new Hata('#AD?');
  }
  /** Bağımsız değişkenler: aralıklar düz listeye açılır */
  private argumanlar(): Deger[][] {
    const out: Deger[][] = [];
    this.bosluk();
    if (this.s[this.i] === ')') {
      this.i++;
      return out;
    }
    for (;;) {
      this.bosluk();
      const ar = /^([A-Za-z]\d+):([A-Za-z]\d+)/.exec(this.s.slice(this.i));
      if (ar) {
        this.i += ar[0].length;
        out.push(
          aralik(hucreAdi(ar[1]), hucreAdi(ar[2])).map((a) => {
            const v = hesapla(this.h, a, this.yigin);
            if (typeof v === 'string' && v.startsWith('#')) throw new Hata(v);
            return v;
          }),
        );
      } else out.push([this.karsilastirma()]);
      this.bosluk();
      if (this.s[this.i] === ';') {
        this.i++;
        continue;
      }
      if (this.s[this.i] === ')') {
        this.i++;
        return out;
      }
      throw new Hata('#AD?');
    }
  }
  private islev(ad: string): Deger {
    const args = this.argumanlar();
    const sayilar = () => args.flat().filter((v): v is number => typeof v === 'number');
    switch (ad) {
      case 'TOPLA':
      case 'SUM':
        return sayilar().reduce((a, b) => a + b, 0);
      case 'ORTALAMA':
      case 'AVERAGE': {
        const n = sayilar();
        if (!n.length) throw new Hata('#SAYI/0!');
        return n.reduce((a, b) => a + b, 0) / n.length;
      }
      case 'MAK':
      case 'MAX':
        return sayilar().length ? Math.max(...sayilar()) : 0;
      case 'MİN':
      case 'MIN':
        return sayilar().length ? Math.min(...sayilar()) : 0;
      case 'SAY':
      case 'COUNT':
        return sayilar().length;
      case 'EĞER':
      case 'IF':
      case 'İF': {
        const [k, d, y] = args.map((a) => a[0]);
        return this.sayi(k ?? 0) !== 0 ? (d ?? 1) : (y ?? 0);
      }
      default:
        throw new Hata('#AD?');
    }
  }
}
