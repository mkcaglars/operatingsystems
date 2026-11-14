// Ağdan önyükleme (PXE): istemcinin PXE/iPXE ekranı ve okul ağındaki sanal PXE sunucusunun yönetim paneli.
import { useEffect, useState } from 'react';
import { PXE_IMAJ, PXE_SUNUCU, type PxeImaj, type PxeState } from '../core/kumhavuzu';

/** İstemci ekranı: UEFI PXE mesajları, ardından sunucunun iPXE menüsü (gerçek klavye ↑ ↓ Enter) */
export function PxeEkrani(props: { satirlar: string[]; hata: string | null; imajlar: PxeImaj[]; sec: (h: PxeImaj | 'disk' | 'yeniden') => void; basarisiz: () => void }) {
  // Açılış anındaki sunucu durumu kullanılır (açılış sürerken sunucu ayarı değişse de bu açılış etkilenmez)
  const [{ satirlar, hata, imajlar }] = useState(() => ({ satirlar: props.satirlar, hata: props.hata, imajlar: props.imajlar }));
  const { sec, basarisiz } = props;
  const [n, setN] = useState(0);
  const [i, setI] = useState(0);
  const menu = n >= satirlar.length + 2 && !hata;
  const secenekler: { ad: string; h: PxeImaj | 'disk' | 'yeniden' | null }[] = [
    ...(imajlar.length ? imajlar.map((x) => ({ ad: `${x === 'windows' ? 'Windows 11 Pro kurulumu' : 'Ubuntu 24.04.1 LTS kurulumu'}  (${PXE_IMAJ[x].dosyalar})`, h: x as PxeImaj })) : [{ ad: '(Sunucuda önyükleme imajı yok)', h: null }]),
    { ad: 'Yerel diskten başlat', h: 'disk' },
    { ad: 'Yeniden başlat', h: 'yeniden' },
  ];

  useEffect(() => {
    if (n < satirlar.length + 2) {
      const t = setTimeout(() => setN((x) => x + 1), n < 2 ? 500 : 280);
      return () => clearTimeout(t);
    }
    if (hata) {
      const t = setTimeout(basarisiz, 2500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, hata]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (!menu) {
        if (e.key === 'Escape') (e.preventDefault(), basarisiz());
        return;
      }
      if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'ArrowUp') setI((x) => (x + secenekler.length - 1) % secenekler.length);
      else if (e.key === 'ArrowDown') setI((x) => (x + 1) % secenekler.length);
      else if (secenekler[i].h) sec(secenekler[i].h!);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  if (menu)
    return (
      <div className="pxe-menu yalniz-klavye">
        <div className="pxe-baslik">
          iPXE 1.21.1 — {PXE_SUNUCU.ad} Ağ Kurulum Sunucusu ({PXE_SUNUCU.ip})
        </div>
        <div className="pxe-kutu">
          <div className="pxe-kutu-h">SSEML Bilişim Laboratuvarı — Önyükleme Menüsü</div>
          {secenekler.map((s, j) => (
            <div key={s.ad} className={'pxe-satir' + (j === i ? ' on' : '') + (s.h ? '' : ' pasif')}>
              {s.ad}
            </div>
          ))}
        </div>
        <div className="pxe-yardim">↑ ↓ ile seçin, Enter ile başlatın. İstemci: {PXE_SUNUCU.istemciIp} · MAC {PXE_SUNUCU.mac}</div>
      </div>
    );
  return (
    <pre className="post-text pxe-text">
      {satirlar.slice(0, Math.max(0, n - 1)).join('\n')}
      {hata && n >= satirlar.length + 1 ? '\n\n' + (hata === 'kablo' ? 'Ağ kablosu takılı değil.' : hata === 'dhcp' ? 'DHCP sunucusundan adres alınamadı.' : 'Önyükleme dosyası (NBP) indirilemedi.') + ' Sonraki önyükleme aygıtına geçiliyor…' : ''}
      {!hata || n < satirlar.length + 1 ? '_' : ''}
    </pre>
  );
}

/** Okul sunucusundaki PXE hizmetlerinin yönetim paneli */
export function PxeSunucu({ pxe, degistir, kapat }: { pxe: PxeState; degistir: (tip: string, veri: Record<string, string | boolean>, fn: (p: PxeState) => PxeState) => void; kapat: () => void }) {
  const [aktariliyor, setAktariliyor] = useState<{ imaj: PxeImaj; yuzde: number } | null>(null);
  useEffect(() => {
    if (!aktariliyor) return;
    if (aktariliyor.yuzde >= 100) {
      const im = aktariliyor.imaj;
      degistir('pxe.imaj-ekle', { imaj: im }, (p) => ({ ...p, imajlar: p.imajlar.includes(im) ? p.imajlar : [...p.imajlar, im] }));
      setAktariliyor(null);
      return;
    }
    const t = setTimeout(() => setAktariliyor((a) => a && { ...a, yuzde: Math.min(100, a.yuzde + 10) }), 180);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktariliyor]);

  const hazir = pxe.dhcp && pxe.tftp && pxe.imajlar.length > 0;
  return (
    <div className="pxs-modal" onClick={kapat}>
      <div className="pxs" role="dialog" aria-label="PXE sunucusu" onClick={(e) => e.stopPropagation()}>
        <div className="pxs-bas">
          <span>
            🖧 <b>{PXE_SUNUCU.ad}</b> — Ağ Önyükleme (PXE) Sunucusu · {PXE_SUNUCU.ip}
          </span>
          <button onClick={kapat} aria-label="Kapat">
            ✕
          </button>
        </div>
        <div className="pxs-govde">
          <p className="small pxs-acik">
            PXE ile bilgisayar USB bellek olmadan, <b>ağ kablosu</b> üzerinden sunucudan önyüklenir: istemci DHCP'den IP adresi ve önyükleme dosyasının yerini alır, dosyayı TFTP ile indirir, sonra sunucunun menüsünden kurulum seçilir. Birçok bilgisayara aynı anda işletim sistemi kurmak için kullanılır.
          </p>
          <h4>1. Hizmetler</h4>
          <div className="pxs-hizmet">
            <div>
              <b>DHCP sunucusu</b>
              <small>
                Kapsam 192.168.1.100–200 · Seçenek 066 (sunucu): {PXE_SUNUCU.ip} · Seçenek 067 (dosya): {PXE_SUNUCU.dosya}
              </small>
            </div>
            <button className={pxe.dhcp ? 'acik' : ''} onClick={() => degistir('pxe.dhcp', { acik: !pxe.dhcp }, (p) => ({ ...p, dhcp: !p.dhcp }))} aria-label={`DHCP ${pxe.dhcp ? 'durdur' : 'başlat'}`}>
              {pxe.dhcp ? '● Çalışıyor' : '○ Durduruldu'}
            </button>
          </div>
          <div className="pxs-hizmet">
            <div>
              <b>TFTP sunucusu</b>
              <small>Kök klasör: D:\PXE\tftpboot · {PXE_SUNUCU.dosya}, menü ve çekirdek dosyalarını gönderir</small>
            </div>
            <button className={pxe.tftp ? 'acik' : ''} onClick={() => degistir('pxe.tftp', { acik: !pxe.tftp }, (p) => ({ ...p, tftp: !p.tftp }))} aria-label={`TFTP ${pxe.tftp ? 'durdur' : 'başlat'}`}>
              {pxe.tftp ? '● Çalışıyor' : '○ Durduruldu'}
            </button>
          </div>
          <h4>2. Önyükleme imajları</h4>
          {(['windows', 'ubuntu'] as PxeImaj[]).map((im) => {
            const var_ = pxe.imajlar.includes(im);
            return (
              <div key={im} className="pxs-hizmet">
                <div>
                  <b>{PXE_IMAJ[im].ad}</b>
                  <small>
                    {PXE_IMAJ[im].dosyalar} · {PXE_IMAJ[im].boyut}
                  </small>
                  {aktariliyor?.imaj === im && (
                    <span className="pxs-bar">
                      <i style={{ width: `${aktariliyor.yuzde}%` }} />
                    </span>
                  )}
                </div>
                {var_ ? (
                  <button className="acik" onClick={() => degistir('pxe.imaj-kaldir', { imaj: im }, (p) => ({ ...p, imajlar: p.imajlar.filter((x) => x !== im) }))} title="İmajı kaldır">
                    ✔ Menüde · Kaldır
                  </button>
                ) : (
                  <button onClick={() => setAktariliyor({ imaj: im, yuzde: 0 })} disabled={!!aktariliyor}>
                    {aktariliyor?.imaj === im ? `İçe aktarılıyor… %${aktariliyor.yuzde}` : 'ISO\'dan içe aktar'}
                  </button>
                )}
              </div>
            );
          })}
          <h4>3. İstemci</h4>
          <p className="small">
            Kasa ağ kablosu: <b className={pxe.kablo ? 'ok-text' : 'err-text'}>{pxe.kablo ? 'takılı' : 'takılı değil'}</b> (kasadaki LAN girişine tıkla) · Sunucu durumu:{' '}
            <b className={hazir ? 'ok-text' : 'err-text'}>{hazir ? 'ağdan kuruluma hazır' : 'eksik ayar var'}</b>
          </p>
          <p className="small muted">Ağdan açmak için: bilgisayarı aç, F8 ile önyükleme menüsünde "UEFI: PXE IPv4 …" seç. (BIOS'ta Advanced › LAN Controller açık olmalı.)</p>
          <h4>Günlük</h4>
          <pre className="pxs-gunluk" aria-label="Sunucu günlüğü">{pxe.gunluk.length ? pxe.gunluk.join('\n') : 'Henüz istek yok.'}</pre>
        </div>
      </div>
    </div>
  );
}
