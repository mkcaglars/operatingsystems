// Görev başarı koşullarını denetleyen bildirimsel kural motoru.
// AYNI kurallar sunucuda server/api/lib/rules.php ile değerlendirilir; iki uygulamanın
// aynı sonucu verdiği tests/fixtures/rules.json ile sınanır. Birini değiştirirseniz diğerini de değiştirin.

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export interface SimEvent {
  /** Olay türü, ör. "bios.set", "checklist.toggle" */
  type: string;
  /** Görev başlangıcından itibaren milisaniye */
  t: number;
  [k: string]: Json | undefined;
}

export interface RuleContext {
  state: Json;
  events: SimEvent[];
}

export type CountCond = { eq?: number; gte?: number; lte?: number; gt?: number; lt?: number };

export type Rule =
  | { all: Rule[] }
  | { any: Rule[] }
  | { not: Rule }
  | ({ path: string } & PathCond)
  | { event: string; where?: Record<string, Json>; count?: CountCond }
  | { before: [string, string] };

export interface PathCond {
  eq?: Json;
  neq?: Json;
  in?: Json[];
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  exists?: boolean;
  includes?: Json;
  excludes?: Json;
  len_eq?: number;
  len_gte?: number;
  len_lte?: number;
}

const MISSING = Symbol('missing');
type Value = Json | typeof MISSING;

/** "a.b[0].c" ya da "a.b.0.c" biçimindeki yolu parçalara ayırır. */
export function splitPath(path: string): string[] {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter((p) => p !== '');
}

export function getPath(obj: Json, path: string): Value {
  let cur: Value = obj;
  for (const key of splitPath(path)) {
    if (cur === null || typeof cur !== 'object') return MISSING;
    if (Array.isArray(cur)) {
      if (!/^\d+$/.test(key)) return MISSING;
      const i = Number(key);
      if (i >= cur.length) return MISSING;
      cur = cur[i];
    } else {
      if (!Object.prototype.hasOwnProperty.call(cur, key)) return MISSING;
      cur = (cur as Record<string, Json>)[key];
    }
  }
  return cur;
}

function isObj(v: unknown): v is Record<string, Json> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Derin eşitlik. Sayılar sayısal olarak karşılaştırılır; boş dizi ile boş nesne eşit sayılır (PHP uyumu). */
export function deepEqual(a: Json | undefined, b: Json | undefined): boolean {
  if (typeof a === 'number' && typeof b === 'number') return a === b;
  const emptyA = (Array.isArray(a) && a.length === 0) || (isObj(a) && Object.keys(a).length === 0);
  const emptyB = (Array.isArray(b) && b.length === 0) || (isObj(b) && Object.keys(b).length === 0);
  if (emptyA && emptyB) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((x, i) => deepEqual(x, b[i]));
  }
  if (isObj(a) && isObj(b)) {
    const ka = Object.keys(a);
    if (ka.length !== Object.keys(b).length) return false;
    return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
  }
  return a === b;
}

function num(v: Value): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function checkCount(n: number, c: CountCond | undefined): boolean {
  if (!c) return n >= 1;
  if (c.eq !== undefined && n !== c.eq) return false;
  if (c.gte !== undefined && n < c.gte) return false;
  if (c.lte !== undefined && n > c.lte) return false;
  if (c.gt !== undefined && n <= c.gt) return false;
  if (c.lt !== undefined && n >= c.lt) return false;
  return true;
}

function eventMatches(e: SimEvent, type: string, where?: Record<string, Json>): boolean {
  if (e.type !== type) return false;
  if (!where) return true;
  return Object.entries(where).every(([k, v]) => deepEqual(e[k] as Json | undefined, v));
}

function checkPath(v: Value, r: PathCond): boolean {
  if (r.exists !== undefined) {
    const ex = v !== MISSING && v !== null;
    if (ex !== r.exists) return false;
  }
  if (r.eq !== undefined && (v === MISSING || !deepEqual(v, r.eq))) return false;
  if (r.neq !== undefined && v !== MISSING && deepEqual(v, r.neq)) return false;
  if (r.in !== undefined && (v === MISSING || !r.in.some((x) => deepEqual(v, x)))) return false;
  const n = num(v);
  if (r.gt !== undefined && (n === null || !(n > r.gt))) return false;
  if (r.gte !== undefined && (n === null || !(n >= r.gte))) return false;
  if (r.lt !== undefined && (n === null || !(n < r.lt))) return false;
  if (r.lte !== undefined && (n === null || !(n <= r.lte))) return false;
  if (r.includes !== undefined || r.excludes !== undefined || r.len_eq !== undefined || r.len_gte !== undefined || r.len_lte !== undefined) {
    const arr = Array.isArray(v) ? v : typeof v === 'string' ? null : undefined;
    const len = Array.isArray(v) ? v.length : typeof v === 'string' ? [...v].length : null;
    if (r.includes !== undefined) {
      if (Array.isArray(arr)) {
        if (!arr.some((x) => deepEqual(x, r.includes))) return false;
      } else if (typeof v === 'string' && typeof r.includes === 'string') {
        if (!v.includes(r.includes)) return false;
      } else return false;
    }
    if (r.excludes !== undefined) {
      if (Array.isArray(arr)) {
        if (arr.some((x) => deepEqual(x, r.excludes))) return false;
      } else if (typeof v === 'string' && typeof r.excludes === 'string') {
        if (v.includes(r.excludes)) return false;
      }
    }
    if (r.len_eq !== undefined && len !== r.len_eq) return false;
    if (r.len_gte !== undefined && (len === null || len < r.len_gte)) return false;
    if (r.len_lte !== undefined && (len === null || len > r.len_lte)) return false;
  }
  return true;
}

export function evaluate(rule: Rule, ctx: RuleContext): boolean {
  if ('all' in rule) return rule.all.every((r) => evaluate(r, ctx));
  if ('any' in rule) return rule.any.some((r) => evaluate(r, ctx));
  if ('not' in rule) return !evaluate(rule.not, ctx);
  if ('path' in rule) return checkPath(getPath(ctx.state, rule.path), rule);
  if ('event' in rule) {
    const n = ctx.events.filter((e) => eventMatches(e, rule.event, rule.where)).length;
    return checkCount(n, rule.count);
  }
  if ('before' in rule) {
    const [a, b] = rule.before;
    const ia = ctx.events.findIndex((e) => e.type === a);
    const ib = ctx.events.findIndex((e) => e.type === b);
    return ia !== -1 && (ib === -1 || ia < ib);
  }
  throw new Error('Bilinmeyen kural: ' + JSON.stringify(rule));
}
