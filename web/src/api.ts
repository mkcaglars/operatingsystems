// Sunucu API'si ile konuşan küçük yardımcı. Tüm istekler api/index.php?r=<yol> adresine gider.

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

let csrf = '';
export function setCsrf(token: string | null | undefined) {
  csrf = token ?? '';
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function call<T>(route: string, body?: unknown): Promise<T> {
  const post = body !== undefined;
  const headers: Record<string, string> = {};
  if (post) {
    headers['Content-Type'] = 'application/json';
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }
  let res: Response;
  try {
    res = await fetch('api/index.php?r=' + route, {
      method: post ? 'POST' : 'GET',
      headers,
      credentials: 'same-origin',
      body: post ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Sunucuya ulaşılamadı. İnternet bağlantısını kontrol edin.', 0);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ApiError('Sunucu yanıtı okunamadı.', res.status);
  }
  if (!res.ok) {
    if (res.status === 401 && onUnauthorized && !route.startsWith('auth/')) onUnauthorized();
    throw new ApiError((data as { hata?: string })?.hata ?? 'Bilinmeyen hata', res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(route: string, params?: Record<string, string | number | undefined>) => {
    const qs = params
      ? Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('')
      : '';
    return call<T>(route + qs);
  },
  post: <T>(route: string, body: unknown = {}) => call<T>(route, body),
};

// ---- Paylaşılan türler ----

export type Role = 'admin' | 'ogretmen' | 'ogrenci';

export interface User {
  id: number;
  role: Role;
  name: string;
  username: string | null;
  portal: boolean;
  has_password: boolean;
}

export interface ClassSettings {
  degerlendirme_acik: boolean;
  istege_bagli: { winrar: boolean; acrobat: boolean; photoshop: boolean };
  hizli_kurulum: boolean;
  esik: { yeterli: number; usta: number };
}

export interface ClassInfo {
  id: number;
  name: string;
  students: number;
  settings: ClassSettings;
  teachers: { id: number; name: string }[];
}

export interface StudentRow {
  id: number;
  name: string;
  username: string | null;
  portal_uid: string | null;
  active: boolean;
  last_login: string | null;
  has_password: boolean;
  classes: { id: number; name: string }[];
}

export interface Credential {
  id?: number;
  name?: string;
  username: string;
  password: string;
}
