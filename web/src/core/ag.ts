// Okul ağı ve IPv4 ayarları: DHCP ya da elle IP; yanlış ayarın sonucu (çakışma, yanlış alt ağ, ağ geçidi, DNS).
// Windows (winpc) ve Ubuntu (kum havuzu) aynı değerlendirmeyi kullanır.

export type AgTur = 'ethernet' | 'wifi';
export interface IpAyar {
  mod: 'dhcp' | 'elle';
  ip: string;
  maske: string;
  gecit: string;
  dns1: string;
  dns2: string;
  /** DNS'i de DHCP'den al (yalnızca mod "dhcp" iken anlamlı; elle modda DNS elle girilir) */
}
export const DHCP: IpAyar = { mod: 'dhcp', ip: '', maske: '', gecit: '', dns1: '', dns2: '' };

/** Ağların gerçek yapısı */
export const AGLAR: Record<AgTur, { ad: string; ag: string; gecit: string; dhcpIp: string; dolu: Record<string, string>; arayuz: string; mac: string }> = {
  ethernet: {
    ad: 'Okul LAN (kablolu)',
    ag: '192.168.1',
    gecit: '192.168.1.1',
    dhcpIp: '192.168.1.57',
    dolu: { '192.168.1.1': 'modem/yönlendirici', '192.168.1.10': 'PXE sunucusu SSEML-SRV01', '192.168.1.20': 'ağ yazıcısı', ...Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`192.168.1.${101 + i}`, `LAB-PC-${String(i + 1).padStart(2, '0')}`])) },
    arayuz: 'enp3s0',
    mac: '3C-7C-3F-1A-22-5E',
  },
  wifi: {
    ad: 'OKUL-LAB (kablosuz)',
    ag: '192.168.10',
    gecit: '192.168.10.1',
    dhcpIp: '192.168.10.23',
    dolu: { '192.168.10.1': 'kablosuz erişim noktası', '192.168.10.5': 'öğretmen dizüstü bilgisayarı', '192.168.10.50': 'akıllı tahta' },
    arayuz: 'wlp2s0',
    mac: 'A4-C3-F0-85-11-9D',
  },
};
/** Çalışan DNS sunucuları */
export const DNS_SUNUCULARI = ['192.168.1.1', '192.168.10.1', '8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1', '9.9.9.9'];

export type Sorun = 'cakisma' | 'alt-ag' | 'gecit' | 'dns' | null;
export interface IpSonuc {
  /** Kullanılan adres (çakışmada Windows 169.254.x.x verir) */
  ip: string;
  maske: string;
  gecit: string;
  dns: string[];
  dhcp: boolean;
  /** Yerel ağa erişim (yazıcı, sunucu) */
  yerel: boolean;
  /** IP ile internete ulaşma (ping 8.8.8.8) */
  disari: boolean;
  /** Ad çözümleme (DNS) — web siteleri için gerekli */
  internet: boolean;
  sorun: Sorun;
  /** Kısa durum: "Bağlı", "İnternet yok", "Tanımlanamayan ağ" */
  durum: string;
  aciklama: string;
}

const oktet = (s: string) => /^\d{1,3}$/.test(s) && Number(s) <= 255;
export const ipGecerli = (s: string) => {
  const p = s.trim().split('.');
  return p.length === 4 && p.every(oktet);
};
export const ipSayi = (s: string) => s.trim().split('.').reduce((a, b) => a * 256 + Number(b), 0);
export function maskeGecerli(s: string): boolean {
  if (!ipGecerli(s)) return false;
  const b = ipSayi(s).toString(2).padStart(32, '0');
  return /^1+0*$/.test(b) && !b.startsWith('0');
}
/** "24" gibi önek uzunluğunu maskeye çevirir */
export function onekMaske(onek: string): string {
  const n = Math.max(0, Math.min(32, Number(onek)));
  const v = n === 0 ? 0 : (0xffffffff << (32 - n)) >>> 0;
  return [24, 16, 8, 0].map((k) => (v >>> k) & 255).join('.');
}
export const maskeOnek = (m: string) => (maskeGecerli(m) ? ipSayi(m).toString(2).replace(/0/g, '').length : 24);
const ayniAg = (a: string, b: string, maske: string) => ((ipSayi(a) & ipSayi(maske)) >>> 0) === ((ipSayi(b) & ipSayi(maske)) >>> 0);

/** Elle girilen ayarın biçim hataları (kaydetmeden önce; Windows ve Ubuntu kaydetmeye izin vermez) */
export function ayarHatalari(a: IpAyar): string[] {
  if (a.mod === 'dhcp') return [];
  const h: string[] = [];
  if (!ipGecerli(a.ip)) h.push('Geçerli bir IP adresi girin (ör. 192.168.1.60).');
  if (!maskeGecerli(a.maske)) h.push('Geçerli bir alt ağ maskesi girin (ör. 255.255.255.0).');
  if (a.gecit && !ipGecerli(a.gecit)) h.push('Ağ geçidi geçerli bir IP adresi olmalıdır.');
  if (a.dns1 && !ipGecerli(a.dns1)) h.push('Tercih edilen DNS geçerli bir IP adresi olmalıdır.');
  if (a.dns2 && !ipGecerli(a.dns2)) h.push('Diğer DNS geçerli bir IP adresi olmalıdır.');
  if (ipGecerli(a.ip) && maskeGecerli(a.maske)) {
    const son = ipSayi(a.ip) & ~ipSayi(a.maske);
    if (son === 0 || ((son | ipSayi(a.maske)) >>> 0) === 0xffffffff) h.push('Bu IP adresi ağ adresi ya da yayın adresidir; bir bilgisayara verilemez.');
  }
  return h;
}

/** Bağdaştırıcının ağdaki durumu */
export function ipDegerlendir(tur: AgTur, ayar: IpAyar | undefined, dhcpVar = true): IpSonuc {
  const g = AGLAR[tur];
  const a = ayar ?? DHCP;
  if (a.mod === 'dhcp') {
    if (!dhcpVar) return { ip: '169.254.71.12', maske: '255.255.0.0', gecit: '', dns: [], dhcp: true, yerel: false, disari: false, internet: false, sorun: 'alt-ag', durum: 'Tanımlanamayan ağ', aciklama: 'DHCP sunucusu yanıt vermedi; Windows otomatik özel IP (169.254.x.x) atadı.' };
    return { ip: g.dhcpIp, maske: '255.255.255.0', gecit: g.gecit, dns: [g.gecit], dhcp: true, yerel: true, disari: true, internet: true, sorun: null, durum: 'Bağlı, internet erişimi var', aciklama: `IP adresi DHCP ile otomatik alındı (${g.dhcpIp}).` };
  }
  const temel = { ip: a.ip, maske: a.maske, gecit: a.gecit, dns: [a.dns1, a.dns2].filter(Boolean), dhcp: false };
  const kimde = g.dolu[a.ip.trim()];
  if (kimde)
    return { ...temel, ip: `169.254.${(ipSayi(a.ip) % 250) + 1}.${(Math.floor(ipSayi(a.ip) / 8) % 250) + 1}`, maske: '255.255.0.0', gecit: '', yerel: false, disari: false, internet: false, sorun: 'cakisma', durum: 'Tanımlanamayan ağ', aciklama: `IP adresi çakışması: ${a.ip} adresini ağdaki başka bir aygıt (${kimde}) kullanıyor.` };
  if (!ayniAg(a.ip, g.gecit, '255.255.255.0'))
    return { ...temel, yerel: false, disari: false, internet: false, sorun: 'alt-ag', durum: 'Tanımlanamayan ağ', aciklama: `${a.ip} bu ağın adres aralığında değil (ağ: ${g.ag}.0/24). Bilgisayar ağdaki hiçbir aygıta ulaşamaz.` };
  if (a.gecit.trim() !== g.gecit || !ayniAg(a.ip, a.gecit, a.maske))
    return { ...temel, yerel: true, disari: false, internet: false, sorun: 'gecit', durum: 'İnternet yok', aciklama: a.gecit ? `Ağ geçidi ${a.gecit} yanlış (doğrusu ${g.gecit}). Yerel ağ çalışır ama internete çıkılamaz.` : `Ağ geçidi girilmedi. Yerel ağ çalışır ama internete çıkılamaz.` };
  const dnsOk = temel.dns.some((d) => DNS_SUNUCULARI.includes(d.trim()));
  if (!dnsOk)
    return { ...temel, yerel: true, disari: true, internet: false, sorun: 'dns', durum: 'İnternet yok', aciklama: temel.dns.length ? `DNS sunucusu (${temel.dns.join(', ')}) yanıt vermiyor: IP ile ping çalışır ama web siteleri açılmaz.` : 'DNS sunucusu girilmedi: IP ile ping çalışır ama web siteleri açılmaz.' };
  return { ...temel, yerel: true, disari: true, internet: true, sorun: null, durum: 'Bağlı, internet erişimi var', aciklama: `Statik IP ${a.ip} kullanılıyor.` };
}
