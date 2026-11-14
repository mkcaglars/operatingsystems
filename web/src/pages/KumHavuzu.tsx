// Serbest kum havuzu: puansız, tek bir gerçekçi bilgisayar. Ekran + güç/reset + LED'ler + 3 USB girişi + 2 flash bellek
// + durum çubuğu. BIOS, önyükleme menüsü ve yazı yazma gerçek klavyeden yapılır.
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from 'react';
import { api, ApiError } from '../api';
import { TopBar } from '../App';
import {
  altSim,
  ayir,
  bagla,
  biosVeri,
  harfler,
  ilkDurum,
  kurulumuIsle,
  kurulumVeri,
  rufusYaz,
  bootBellegi,
  OFFICE_ANAHTARI,
  OKU_BENI,
  ubuntuKurulumuIsle,
  ubuntuKurulumVeri,
  URUN_ANAHTARI,
  WIFI,
  windowsVar,
  yapilacaklar,
  type FlashId,
  type KhState,
  pxeDurum,
  ubuntuAg,
  kabukAgi,
  pxeGuncelle,
  pxeGunluk,
  pxeSonuc,
  PXE_IMAJ,
  PXE_SUNUCU,
  type PxeImaj,
  type PxeState,
} from '../core/kumhavuzu';
import { useSim, type Sim } from '../core/sim';
import { olayMetni } from '../core/gunluk';
import { toJpeg } from 'html-to-image';
import type { TaskDef } from '../core/types';
import { KULLANICI, sistemiTamamla, type WinPc } from '../core/winpc';
import PcBios from '../tasks/PcBios';
import Photo, { photoUrl } from '../components/Photo';
import WinSetup, { initialWinSetup } from '../tasks/WinSetup';
import UbuntuKur, { initialUbuntuKur } from '../tasks/UbuntuKur';
import { GrubMenu, UbuntuMasaustu } from '../components/UbuntuMasaustu';
import { PxeEkrani, PxeSunucu } from '../components/Pxe';
import type { ShellState } from '../core/shell';
import Masaustu, { type Kopru, type WinVeri } from '../win/Masaustu';
import WindowsAcilis, { DurumEkrani, WindowsLogoEkrani } from '../win/Acilis';

const SCOPE = 'kum-havuzu';
const GRUB_HATA = 'error: no such device: 4A1C-22F0.\nerror: disk `hd0,gpt2\' not found.\n\nPress any key to continue...';
const WIN_VERI: WinVeri = { uygulamalar: ['ayarlar', 'gorev', 'dosya', 'aygit', 'guvenlik', 'edge'], wifiAglari: WIFI, officeAnahtar: OFFICE_ANAHTARI };
/** Kurulumlardan çıkış (kapatma, reset): yarım kalan kurulumların disk etkisi işlenir, çalışan sistem kapanır */
const cik = (s: KhState): KhState => {
  const n = { ...ubuntuKurulumuIsle(kurulumuIsle(s)), calisan: null };
  return n.pxe?.kaynak ? { ...n, pxe: { ...n.pxe, kaynak: null } } : n;
};
const blur = (e: MouseEvent<HTMLElement>) => e.currentTarget.blur();
/** Görsel varsa CSS arka planı olarak (assets/gorseller/<ad>) */
const arkaPlan = (ad: string) => {
  const u = photoUrl(ad);
  return u ? { backgroundImage: `url(${u})` } : undefined;
};

export default function KumHavuzu() {
  const sim = useSim<KhState>(ilkDurum());
  const st = sim.state;
  const [nonce, setNonce] = useState(0);
  const [bilgi, setBilgi] = useState('');
  const [liste, setListe] = useState(true);
  const [pxePanel, setPxePanel] = useState(false);
  /** Windows'tan kapatma/yeniden başlatma ekranı */
  const [kapanis, setKapanis] = useState<null | 'kapat' | 'yeniden'>(null);
  /** USB'den açılışta kurulum medyası yükleniyor (logo + dönen noktalar) */
  const [medyaYukleniyor, setMedyaYukleniyor] = useState(false);
  const [yuklendi, setYuklendi] = useState(false);
  const version = useRef(0);
  const e = st.bios.ekran;
  const [gunluk, setGunluk] = useState<{ t: string; m: string }[]>([]);
  const islenen = useRef(0);
  const ekranRef = useRef<HTMLDivElement>(null);
  // Yeni olayları öğretmen için okunur günlüğe çevir
  useEffect(() => {
    const yeni = sim.events.slice(islenen.current);
    islenen.current = sim.events.length;
    const satirlar = yeni
      .map((ev) => olayMetni(ev))
      .filter((m): m is string => !!m)
      .map((m) => ({ t: new Date().toTimeString().slice(0, 8), m }));
    if (satirlar.length)
      setGunluk((g) => {
        const out = [...g];
        for (const r of satirlar) if (out[out.length - 1]?.m !== r.m) out.push(r);
        return out.slice(-200);
      });
  }, [sim.events]);

  // ---------- Kayıt: öğrenci kaldığı yerden devam eder ----------
  useEffect(() => {
    api
      .get<{ data: { st: KhState; gunluk?: { t: string; m: string }[] } | null; version: number }>('state', { scope: SCOPE })
      .then((r) => {
        version.current = r.version;
        if (r.data?.st?.pc) {
          // Sayfa kapandığında bilgisayar kapanmış sayılır
          const ilk = ilkDurum();
          const kayit = r.data.st;
          // Eski sürümde kaydedilmiş bilgisayar: eksik sistem klasörleri tamamlanır
          const pcT = sistemiTamamla(kayit.pc);
          // Eski sürümdeki not yerine güncel kılavuz
          const not = pcT.fs[`${KULLANICI}/Masaüstü/OKU-BENİ.txt`];
          if (not && (!not.icerik || not.icerik.startsWith('Merhaba teknisyen'))) not.icerik = OKU_BENI;
          const s = cik({ ...ilk, ...kayit, pc: pcT, iz: { ...ilk.iz, ...kayit.iz } });
          sim.restore({ ...s, bios: { ...s.bios, ekran: 'kapali', setup: null } }, []);
          if (Array.isArray((r.data as { gunluk?: unknown }).gunluk)) setGunluk((r.data as { gunluk: { t: string; m: string }[] }).gunluk);
        }
      })
      .catch(() => undefined)
      .finally(() => setYuklendi(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const gunlukRef = useRef(gunluk);
  gunlukRef.current = gunluk;
  const kaydet = useCallback(async (s: KhState) => {
    try {
      const ozet = yapilacaklar(s).map((x) => ({ m: x.metin, ok: x.tamam }));
      const r = await api.post<{ version: number }>('state/save', { scope: SCOPE, data: { st: s, gunluk: gunlukRef.current, ozet }, version: version.current });
      version.current = r.version;
    } catch (er) {
      if (er instanceof ApiError && er.status === 409) {
        const r = await api.get<{ version: number }>('state', { scope: SCOPE });
        version.current = r.version;
      }
    }
  }, []);
  const son = useRef(st);
  son.current = st;
  useEffect(() => {
    if (!yuklendi) return;
    const t = setTimeout(() => kaydet(son.current), 3000);
    return () => clearTimeout(t);
  }, [sim.events.length, yuklendi, kaydet]);

  // ---------- Canlı izleme: öğretmen izlerken ekran görüntüsü gönderilir ----------
  const durumRef = useRef('');
  useEffect(() => {
    let alive = true;
    let izle = false;
    let mesgul = false;
    const ping = async () => {
      try {
        const ok = yapilacaklar(son.current).filter((x) => x.tamam).length;
        const r = await api.post<{ izle?: boolean }>('presence', { station: '', task_id: '', info: `Kum havuzu · ${durumRef.current} · ${ok}/${yapilacaklar(son.current).length}` });
        izle = !!r.izle;
      } catch {
        /* ağ hatası: bir sonraki denemede */
      }
    };
    const cek = async () => {
      if (!izle || mesgul || !ekranRef.current) return;
      mesgul = true;
      try {
        const img = await toJpeg(ekranRef.current, { quality: 0.6, pixelRatio: 0.75, skipFonts: true, cacheBust: false });
        if (alive) await api.post('sandbox/screen', { img });
      } catch {
        /* görüntü alınamadı */
      }
      mesgul = false;
    };
    ping();
    const t1 = setInterval(ping, 8000);
    const t2 = setInterval(cek, 3000);
    return () => {
      alive = false;
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  // ---------- Güç ----------
  const ac = () => {
    sim.act('kh.guc', { acik: true }, (s) => ({ ...s, bios: { ...s.bios, ekran: 'post', setup: null } }));
    setNonce((n) => n + 1);
    setBilgi('Bilgisayar açıldı. Açılışta Del ya da F2: BIOS · F8: önyükleme menüsü (gerçek klavyenden bas).');
  };
  const kapat = () => {
    sim.act('kh.guc', { acik: false }, (s) => {
      const n = cik(s);
      return { ...n, bios: { ...n.bios, ekran: 'kapali', setup: null } };
    });
    setBilgi('Bilgisayar kapatıldı.');
  };
  const reset = () => {
    sim.act('kh.reset', {}, (s) => {
      const n = cik(s);
      return { ...n, bios: { ...n.bios, ekran: 'post', setup: null } };
    });
    setNonce((n) => n + 1);
    setBilgi('Bilgisayar yeniden başlatıldı.');
  };

  // ---------- USB ----------
  const tak = (id: FlashId, port?: number) => {
    const s = son.current;
    if (s.portlar.includes(id)) return;
    const i = port ?? s.portlar.indexOf(null);
    if (i < 0 || s.portlar[i]) return setBilgi('Bu USB girişi dolu.');
    sim.act('kh.usb-tak', { flash: id, port: i + 1 }, (x) => ({ ...x, portlar: x.portlar.map((p, j) => (j === i ? id : p)) }));
    const f = s.flash[id];
    setBilgi(`${f.ad} ${f.kapasite} ${i + 1}. USB girişine takıldı.` + (e === 'os' && windowsVar(s) ? ' Windows yeni sürücüyü algıladı (Dosya Gezgini › Bu bilgisayar).' : ''));
  };
  const cikar = (id: FlashId) => {
    sim.act('kh.usb-cikar', { flash: id }, (x) => ({ ...x, portlar: x.portlar.map((p) => (p === id ? null : p)) }));
    setBilgi(`${st.flash[id].ad} çıkarıldı.`);
  };

  // ---------- Kurulum: USB'den açılınca başlar, bitince bilgisayar yeniden başlar ----------
  const gereksinimOk = st.bios.cmos.tpm && st.bios.cmos.secureBoot;
  const bb = bootBellegi(st);
  const pxe = pxeDurum(st);
  // Kurulum kaynağı: PXE menüsünden seçilen imaj ya da takılı kurulum belleği
  const ubuntuUsb = pxe.kaynak ? pxe.kaynak === 'ubuntu' : bb?.icerik === 'ubuntu';
  const kaynakAdi = pxe.kaynak ? 'ağdan (PXE)' : 'USB bellekten';
  useEffect(() => {
    if (e === 'kurulum' && ubuntuUsb && !st.ukur) {
      sim.act('kh.ubuntu-basla', {}, (s) => ({ ...s, ukur: initialUbuntuKur({ veri: ubuntuKurulumVeri(s) } as unknown as TaskDef), iz: { ...s.iz, usbAcilis: true } }));
      setBilgi(`Bilgisayar ${kaynakAdi} açıldı: Ubuntu 24.04 kurulumu.`);
      return;
    }
    if (e === 'kurulum' && !ubuntuUsb && !st.kurulum && gereksinimOk) {
      sim.act('kh.kurulum-basla', {}, (s) => ({ ...s, kurulum: initialWinSetup({ veri: kurulumVeri(s) } as unknown as TaskDef), iz: { ...s.iz, usbAcilis: true } }));
      setBilgi(`Bilgisayar ${kaynakAdi} açıldı: Windows 11 Kurulumu.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e, !!st.kurulum, !!st.ukur, gereksinimOk, ubuntuUsb]);
  // Ubuntu kurulumu bitti ve "Şimdi yeniden başlat"a basıldı
  useEffect(() => {
    if (st.ukur && st.ukur.kurulum === 'tamam' && ['grub', 'ubuntu', 'windows'].includes(st.ukur.adim)) {
      sim.act('kh.ubuntu-bitti', {}, (s) => {
        const n = cik(s);
        return { ...n, bios: { ...n.bios, ekran: 'post', setup: null } };
      });
      setNonce((n) => n + 1);
      setBilgi('Ubuntu kuruldu, bilgisayar yeniden başlıyor. Kurulum belleğini çıkar; açılışta GRUB menüsü gelecek.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.ukur?.adim]);
  useEffect(() => {
    if (st.kurulum?.adim === 'bitti') {
      sim.act('kh.kurulum-bitti', {}, (s) => {
        const n = kurulumuIsle(s);
        return { ...n, bios: { ...n.bios, ekran: 'post', setup: null } };
      });
      setNonce((n) => n + 1);
      setBilgi('Windows 11 kuruldu, bilgisayar yeniden başlıyor. USB bellek takılıysa ve önyüklemede öndeyse kurulum yeniden başlar: belleği çıkar!');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.kurulum?.adim]);
  useEffect(() => {
    if (e === 'os' && st.onyukleyici === 'grub' && st.ubuntu && !st.calisan) setBilgi('GRUB önyükleme menüsü: ↑ ↓ ile seç, Enter ile başlat (10 sn sonra Ubuntu açılır).');
    else if (e === 'os' && st.calisan === 'ubuntu') setBilgi('Ubuntu giriş ekranı: parolanı klavyeyle yaz, Enter.');
    else if (e === 'os' && windowsVar(st)) setBilgi(st.windows === 'eski' ? 'Windows açıldı. Bu bilgisayar çok yavaş ve reklam çıkıyor…' : 'Windows 11 açıldı.');
    if (e === 'setup') setBilgi('BIOS Setup: ← → sekme, ↑ ↓ seçim, Enter değiştir, F10 kaydet ve çık, Esc çık.');
    if (e === 'bootmenu') setBilgi('Önyükleme menüsü: ↑ ↓ ile seç, Enter ile başlat.');
    if (e === 'pxe') setBilgi('Ağdan önyükleme (PXE): bilgisayar DHCP ile adres alıyor ve sunucudan önyükleme dosyasını indiriyor.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e, st.calisan]);

  useEffect(() => {
    if (e !== 'kurulum') return;
    setMedyaYukleniyor(true);
    const t = setTimeout(() => setMedyaYukleniyor(false), 2500);
    return () => clearTimeout(t);
  }, [e]);

  // Açılış hatası ekranında bir tuşa basınca yeniden dener
  const grubVar = st.onyukleyici === 'grub' && !!st.ubuntu;
  const acilisHatasi = e === 'bootfail' || (e === 'os' && !windowsVar(st) && !grubVar) || (e === 'os' && grubVar && st.calisan === 'windows' && !windowsVar(st));
  useEffect(() => {
    if (!acilisHatasi) return;
    setBilgi('Önyüklenebilir aygıt bulunamadı. Bir tuşa basınca bilgisayar yeniden başlar.');
    const on = (k: KeyboardEvent) => {
      k.preventDefault();
      reset();
    };
    window.addEventListener('keydown', on, { once: true });
    return () => window.removeEventListener('keydown', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acilisHatasi]);

  // ---------- PXE: ağdan önyükleme ----------
  const pxeS = pxeSonuc(st);
  useEffect(() => {
    if (e !== 'pxe') return;
    const p = pxeDurum(st);
    sim.act('kh.pxe-acilis', { kablo: p.kablo, dhcp: p.dhcp, tftp: p.tftp, hata: pxeS.hata ?? '' }, (s) => {
      if (!pxeDurum(s).kablo) return s;
      let n = pxeGunluk(s, `DHCPDISCOVER ${PXE_SUNUCU.mac}`);
      if (!pxeDurum(s).dhcp) return pxeGunluk(n, 'DHCP hizmeti durdurulmuş: yanıt verilmedi');
      n = pxeGunluk(n, `DHCPOFFER ${PXE_SUNUCU.istemciIp} → ${PXE_SUNUCU.mac} (066=${PXE_SUNUCU.ip}, 067=${PXE_SUNUCU.dosya})`);
      return pxeGunluk(n, pxeDurum(s).tftp ? `TFTP ${PXE_SUNUCU.dosya} gönderildi → ${PXE_SUNUCU.istemciIp}` : `TFTP isteği ${PXE_SUNUCU.dosya}: hizmet durdurulmuş`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e]);
  const pxeSec = (h: PxeImaj | 'disk' | 'yeniden') => {
    if (h === 'yeniden') return reset();
    if (h === 'disk') return sim.act('kh.pxe-sec', { hedef: 'disk' }, (s) => ({ ...s, bios: { ...s.bios, ekran: 'os' } }));
    sim.act('kh.pxe-sec', { hedef: h }, (s) => {
      const n = pxeGunluk(s, `Menü: ${PXE_IMAJ[h].ad} seçildi, kurulum dosyaları gönderiliyor`);
      return { ...n, pxe: { ...pxeDurum(n), kaynak: h }, bios: { ...n.bios, ekran: 'kurulum' }, iz: { ...n.iz, pxeKurulum: true } };
    });
  };
  const pxeDegistir = (tip: string, veri: Record<string, string | boolean>, fn: (p: PxeState) => PxeState) => sim.act(tip, veri, (s) => pxeGuncelle(s, fn));

  // ---------- Alt simülasyonlar ----------
  const biosSim = altSim(sim, (s) => s.bios, (s, b) => ({ ...s, bios: b }));
  const kurSim = altSim(sim, (s) => s.kurulum!, (s, k) => ({ ...s, kurulum: k }));
  const ukurSim = altSim(sim, (s) => s.ukur!, (s, k) => ({ ...s, ukur: k }));
  const shSim = st.ubuntu && altSim<KhState, { sh: ShellState }>(
    sim,
    (s) => ({ sh: { ...s.ubuntu!.sh, ag: kabukAgi(s) } }),
    (s, v) => ({ ...s, ubuntu: { ...s.ubuntu!, sh: v.sh } }),
  );
  const grubSec = (hedef: 'ubuntu' | 'windows' | 'uefi') => {
    if (hedef === 'uefi') {
      sim.act('kh.grub', { hedef }, (s) => ({ ...s, bios: { ...s.bios, ekran: 'setup', setup: { ...s.bios.cmos } } }));
      return;
    }
    sim.act('kh.grub', { hedef }, (s) => ({ ...s, calisan: hedef, iz: { ...s.iz, grubAcilan: s.iz.grubAcilan.includes(hedef) ? s.iz.grubAcilan : [...s.iz.grubAcilan, hedef] } }));
    setBilgi(hedef === 'ubuntu' ? 'GRUB: Ubuntu başlatılıyor.' : 'GRUB: Windows Boot Manager başlatılıyor.');
  };
  const bagliPc = useMemo(() => bagla(st.pc, st), [st]);
  const winSim: Sim<{ pc: WinPc }> = {
    state: { pc: bagliPc },
    events: sim.events,
    act: (type, data, update) => sim.act(type, data, (s) => ayir(s, update({ pc: bagla(s.pc, s) }).pc)),
    restore: () => undefined,
    elapsedMs: sim.elapsedMs,
  };
  const h = harfler(st);
  const kopru: Kopru = {
    usbler: st.portlar.filter((x): x is FlashId => !!x).map((id) => ({ id, ad: st.flash[id].ad, harf: h[id]!, kapasite: st.flash[id].kapasite })),
    uefi: !st.bios.cmos.csm,
    rufusBitti: (y) => {
      sim.act('kh.rufus', { flash: y.aygit, bolum: y.bolum, iso: y.iso }, (s) => rufusYaz(s, y.aygit as FlashId, y.bolum, y.iso));
      setBilgi(`Rufus bitti: ${st.flash[y.aygit as FlashId]?.ad} artık ${/ubuntu/i.test(y.iso) ? 'Ubuntu' : 'Windows 11'} kurulum belleği (${y.bolum}).`);
    },
    guc: (t) => {
      setKapanis(t);
      setTimeout(() => {
        setKapanis(null);
        if (t === 'kapat') kapat();
        else reset();
      }, 2200);
    },
  };

  function Ekran() {
    if (e === 'pxe')
      return (
        <PxeEkrani
          key={nonce}
          satirlar={pxeS.satirlar}
          hata={pxeS.hata}
          imajlar={pxe.imajlar}
          sec={pxeSec}
          basarisiz={() => sim.act('kh.pxe-basarisiz', { hata: pxeS.hata ?? 'iptal' }, (s) => ({ ...s, bios: { ...s.bios, ekran: 'bootfail' } }))}
        />
      );
    if (e === 'kurulum' && medyaYukleniyor)
      return ubuntuUsb ? (
        <div className="win-boot ubuntu-boot">
          <span className="ubuntu-boot-logo">ubuntu</span>
          <span className="ubuntu-dots">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      ) : (
        <WindowsLogoEkrani />
      );
    if (e === 'kurulum' && ubuntuUsb) {
      if (!st.ukur) return <div className="screen-fill on" />;
      return <UbuntuKur task={{ veri: ubuntuKurulumVeri(st) } as unknown as TaskDef} mode="uygula" sim={ukurSim} gomulu />;
    }
    if (e === 'kurulum') {
      if (!gereksinimOk)
        return (
          <div className="screen-fill on ws-screen">
            <div className="ws-dlg">
              <div className="ws-h">Bu bilgisayar Windows 11'i çalıştıramaz</div>
              <p>Bu bilgisayar şu anda Windows 11 sistem gereksinimlerini karşılamıyor.</p>
              <ul className="small">
                {!st.bios.cmos.tpm && <li>Bilgisayar TPM 2.0'ı desteklemelidir.</li>}
                {!st.bios.cmos.secureBoot && <li>Bilgisayar Güvenli Önyüklemeyi desteklemelidir.</li>}
              </ul>
              <p className="small">BIOS'ta (Security sekmesi) bu ayarları açıp yeniden deneyin.</p>
            </div>
          </div>
        );
      if (!st.kurulum) return <div className="screen-fill on ws-screen" />;
      return <WinSetup task={{ veri: kurulumVeri(st) } as unknown as TaskDef} mode="uygula" sim={kurSim} gomulu />;
    }
    if (e === 'os' && grubVar && st.calisan === null) return <GrubMenu windows={st.ubuntu!.sh.grub.windows} sec={grubSec} log={(t) => sim.act(t, {}, (x) => x)} />;
    if (e === 'os' && grubVar && st.calisan === 'ubuntu')
      return (
        <div className="screen-fill on">
          <UbuntuMasaustu hesap={st.ubuntu!.hesap} wifi={st.ubuntu!.wifi} sim={shSim!} guc={(t) => (t === 'kapat' ? kapat() : reset())}
            log={(t, d) => sim.act(t, d ?? {}, (x) => x)}
            usb={st.portlar.filter((x): x is FlashId => !!x).map((id) => ({ id, ad: st.flash[id].ad, kapasite: st.flash[id].kapasite, etiket: st.flash[id].etiket, icerik: st.flash[id].icerik, dosyaSayisi: Object.keys(st.flash[id].dosyalar).length }))}
            usbYaz={(id, iso) => sim.act('ubuntu.usb-yaz', { aygit: id, iso }, (x) => rufusYaz(x, id as FlashId, 'GPT', iso))}
            kablo={pxe.kablo}
            ag={ubuntuAg(st)}
            ipAyar={st.ubuntu!.ip ?? {}}
            ipKaydet={(tur, ayar) => sim.act('ubuntu.ip-ayarla', { tur, mod: ayar.mod, ip: ayar.ip, maske: ayar.maske, gecit: ayar.gecit, dns: [ayar.dns1, ayar.dns2].filter(Boolean).join(',') }, (x) => (x.ubuntu ? { ...x, ubuntu: { ...x.ubuntu, ip: { ...(x.ubuntu.ip ?? {}), [tur]: ayar } } } : x))}
            wifiBaglan={(ag) => sim.act('ubuntu.wifi', { ag }, (x) => (x.ubuntu ? { ...x, ubuntu: { ...x.ubuntu, wifi: ag } } : x))}
          />
        </div>
      );
    if (e === 'os' && grubVar && st.calisan === 'windows' && !windowsVar(st))
      return <pre className="post-text">{GRUB_HATA}</pre>;
    if (e === 'os') {
      if (!windowsVar(st)) return <pre className="post-text">{'Reboot and Select proper Boot device\nor Insert Boot Media in selected Boot device and press a key_'}</pre>;
      return (
        <div className="screen-fill on wg-screen">
          {kapanis ? (
            <DurumEkrani metin={kapanis === 'kapat' ? 'Kapatılıyor' : 'Yeniden başlatılıyor'} />
          ) : (
            <WindowsAcilis
              kullanici={st.pc.cihaz.kullanici}
              parola={st.windows === 'yeni' ? st.winParola : ''}
              ilk={st.winIlk && st.windows === 'yeni'}
              onIlkBitti={() => sim.act('kh.ilk-acilis', {}, (s) => ({ ...s, winIlk: false }))}
              log={(t) => sim.act(t, {}, (x) => x)}
            >
              <Masaustu sim={winSim} veri={WIN_VERI} learn={false} kopru={kopru} />
            </WindowsAcilis>
          )}
        </div>
      );
    }
    return <PcBios task={{ veri: biosVeri(st) } as unknown as TaskDef} mode="uygula" sim={biosSim} gomulu={{ nonce }} />;
  }

  const acik = e !== 'kapali';
  const diskAktif = e === 'post' || (e === 'kurulum' && st.kurulum?.adim === 'yukleniyor');
  const durum =
    e === 'kapali'
      ? 'Bilgisayar kapalı — açmak için On/off düğmesine bas.'
      : e === 'post'
        ? 'POST: Del/F2 = BIOS Setup · F8 = önyükleme menüsü'
        : bilgi;
  const islerim = yapilacaklar(st);
  durumRef.current =
    e === 'kapali' ? 'kapalı' : e === 'post' ? 'açılış' : e === 'setup' ? 'BIOS' : e === 'bootmenu' ? 'önyükleme menüsü' : e === 'pxe' ? 'ağdan önyükleme (PXE)' : e === 'kurulum' ? (ubuntuUsb ? 'Ubuntu kurulumu' : 'Windows kurulumu') : e === 'os' ? (grubVar && st.calisan === 'ubuntu' ? 'Ubuntu' : grubVar && !st.calisan ? 'GRUB' : st.windows === 'eski' ? 'eski Windows' : 'Windows 11') : 'açılış hatası';
  const ondrop = (i: number) => (ev: DragEvent) => {
    ev.preventDefault();
    const id = ev.dataTransfer.getData('text/flash') as FlashId;
    if (id === 'mavi' || id === 'turuncu') {
      if (st.portlar.includes(id)) cikar(id);
      tak(id, i);
    }
  };

  return (
    <div className="page kh-page">
      <TopBar>
        <a href="#/">← Görevler</a>
      </TopBar>
      <main className="kh">
        <div className="kh-ust">
          <div className="kh-ekran" aria-label="Ekran" tabIndex={-1} ref={ekranRef}>
            {Ekran()}
          </div>
          <aside className={'kh-kasa' + (photoUrl('kh-kasa-on') ? ' foto' : '')} aria-label="Kasa ön paneli" style={arkaPlan('kh-kasa-on')}>
            <div className="kh-guc">
              <div className="kh-dugmeler">
                <button
                  className={'kh-onoff' + (acik ? ' on' : '') + (photoUrl('kh-guc-dugmesi') ? ' foto' : '')}
                  onClick={(ev) => (blur(ev), acik ? kapat() : ac())}
                  title={acik ? 'Kapat (güç düğmesine uzun bas)' : 'Aç'}
                  aria-label="Güç düğmesi"
                >
                  <Photo
                    name="kh-guc-dugmesi"
                    alt=""
                    className="kh-dugme-foto"
                    fallback={
                      <>
                        On/
                        <br />
                        off
                      </>
                    }
                  />
                </button>
                <button className={'kh-reset' + (photoUrl('kh-reset-dugmesi') ? ' foto' : '')} onClick={(ev) => (blur(ev), acik && reset())} title="Reset (yeniden başlat)" aria-label="Reset düğmesi">
                  <Photo name="kh-reset-dugmesi" alt="" className="kh-dugme-foto" fallback="r" />
                </button>
              </div>
              <div className="kh-ledler">
                <span className={'kh-led guc' + (acik ? ' on' : '')} title="Güç ışığı" />
                <span className={'kh-led disk' + (diskAktif ? ' yogun' : acik ? ' on' : '')} title="Disk etkinlik ışığı" />
              </div>
            </div>
            <div className="kh-portlar">
              {st.portlar.map((p, i) => (
                <button
                  key={i}
                  className={'kh-port' + (p ? ' dolu ' + p : '') + (photoUrl('kh-usb-giris') ? ' foto' : '')}
                  style={arkaPlan('kh-usb-giris')}
                  onClick={(ev) => (blur(ev), p && cikar(p))}
                  onDragOver={(ev) => ev.preventDefault()}
                  onDrop={ondrop(i)}
                  title={p ? `${st.flash[p].ad} — çıkarmak için tıkla` : 'Boş USB girişi: bir flash belleği buraya sürükle'}
                  aria-label={`USB girişi ${i + 1}${p ? ': ' + st.flash[p].ad : ''}`}
                >
                  {!photoUrl('kh-usb-giris') && 'USB'}
                  {p && <Photo name={'kh-flash-' + p} alt="" className={'kh-takili-foto ' + p} fallback={<span className={'kh-takili ' + p} />} />}
                </button>
              ))}
            </div>
            <button
              className={'kh-lan' + (pxe.kablo ? ' takili' : '')}
              onClick={(ev) => {
                blur(ev);
                sim.act(pxe.kablo ? 'kh.lan-cikar' : 'kh.lan-tak', {}, (s) => pxeGuncelle(s, (p) => ({ ...p, kablo: !p.kablo })));
                setBilgi(pxe.kablo ? 'Ağ kablosu çıkarıldı.' : 'Ağ kablosu takıldı: bilgisayar okul ağına (ve PXE sunucusuna) bağlandı.');
              }}
              title={pxe.kablo ? 'Ağ kablosu takılı — çıkarmak için tıkla' : 'Ağ (LAN) girişi — kablo takmak için tıkla'}
              aria-label={`Ağ kablosu ${pxe.kablo ? 'takılı' : 'takılı değil'}`}
            >
              <span className="kh-rj45" />
              {pxe.kablo && <span className="kh-kablo" />}
              <small>LAN</small>
            </button>
            <div className="kh-flashlar">
              {(['mavi', 'turuncu'] as FlashId[]).map((id) => {
                const f = st.flash[id];
                const takili = st.portlar.includes(id);
                return (
                  <button
                    key={id}
                    className={'kh-flash ' + id + (takili ? ' takili' : '')}
                    draggable
                    onDragStart={(ev) => ev.dataTransfer.setData('text/flash', id)}
                    onClick={(ev) => (blur(ev), takili ? cikar(id) : tak(id))}
                    title={`${f.ad} ${f.kapasite} — ${f.icerik === 'win11' ? 'Windows 11 kurulum belleği' : Object.keys(f.dosyalar).length ? 'içinde dosyalar var' : 'boş'}. Takmak/çıkarmak için tıkla ya da sürükle.`}
                    aria-label={`${id === 'mavi' ? 'Mavi' : 'Turuncu'} flash bellek ${takili ? '(takılı)' : ''}`}
                  >
                    <Photo
                      name={'kh-flash-' + id}
                      alt=""
                      className="kh-flash-foto"
                      fallback={
                        <>
                          <span className="kh-flash-govde">
                            Flash
                            <br />
                            Disk
                          </span>
                          <span className="kh-flash-uc" />
                        </>
                      }
                    />
                    <small>
                      {f.kapasite}
                      {f.icerik === 'win11' ? ' · W11' : ''}
                    </small>
                  </button>
                );
              })}
            </div>
            <div className={'kh-etiket' + (photoUrl('lisans-etiketi') ? ' foto' : '')} title="Kasanın yanındaki lisans etiketi" style={arkaPlan('lisans-etiketi')}>
              <b>Windows 11 Pro</b>
              <code>{URUN_ANAHTARI}</code>
            </div>
            <div className={'kh-etiket office' + (photoUrl('lisans-etiketi') ? ' foto' : '')} title="Office lisans kartı" style={arkaPlan('lisans-etiketi')}>
              <b>Office Professional Plus 2024</b>
              <code>{OFFICE_ANAHTARI}</code>
            </div>
            <div className={'kh-not' + (photoUrl('kh-not-kagidi') ? ' foto' : '')} title="Masadaki not kâğıdı" style={arkaPlan('kh-not-kagidi')}>
              Wi-Fi: <b>OKUL-LAB</b>
              <br />
              Şifre: <b>Kibris2026</b>
              <span className="kh-not-ip">
                <u>Bu PC kablolu (sabit IP):</u>
                <br />
                IP: <b>192.168.1.60</b>
                <br />
                Maske: <b>255.255.255.0</b>
                <br />
                Ağ geçidi: <b>192.168.1.1</b>
                <br />
                DNS: <b>192.168.1.1</b> / <b>8.8.8.8</b>
              </span>
              <span className="kh-not-reklam" aria-hidden>
                MKCaglarOS
              </span>
            </div>
          </aside>
        </div>
        <div className="kh-durum" role="status">
          <span>{durum}</span>
          <span className="kh-durum-sag">
            <button className="kh-mini" onClick={(ev) => (blur(ev), setPxePanel(true))}>
              🖧 PXE sunucusu
            </button>
            <button className="kh-mini" onClick={(ev) => (blur(ev), setListe((x) => !x))}>
              ☑ Yapılacaklar {islerim.filter((x) => x.tamam).length}/{islerim.length}
            </button>
            <button
              className="kh-mini"
              onClick={(ev) => {
                blur(ev);
                if (!window.confirm('Kum havuzu baştan başlasın mı? Bilgisayar ve flash bellekler ilk hâline döner.')) return;
                sim.act('kh.sifirla', {}, () => ilkDurum());
                setGunluk([]);
                setBilgi('Yeni bilgisayar hazır.');
              }}
            >
              ↺ Baştan başla
            </button>
          </span>
        </div>
        {pxePanel && <PxeSunucu pxe={pxe} degistir={pxeDegistir} kapat={() => setPxePanel(false)} />}
        {liste && (
          <section className="kh-liste card">
            <b>Serbest çalışma — önerilen iş sırası</b> <small className="muted">(puan verilmez; istediğin sırayla dene)</small>
            <p className="small">
              Bu bilgisayar çok yavaşlamış ve virüslü. Kullanıcının belgelerini kaybetmeden Windows 11'i temiz kur, internete bağla, Office ve diğer programları yükle. Sonra Ubuntu'yu Windows'un yanına kur (çift önyükleme).
            </p>
            <ol>
              {islerim.map((x) => (
                <li key={x.id} className={x.tamam ? 'ok' : ''}>
                  {x.tamam ? '✔' : '○'} {x.metin}
                </li>
              ))}
            </ol>
            {st.iz.turuncuSilindi && <p className="err-text small">⚠ Turuncu flash bellekteki dosyalar (müzik, ödev) Rufus yazarken silindi!</p>}
            <p className="small muted">
              Klavye: BIOS'a girmek, BIOS'ta gezinmek ve yazı yazmak için gerçek klavyeni kullan. Flash belleği bir USB girişine sürükle ya da üstüne tıkla.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
