// Microsoft Word: etkinleştirme (ürün anahtarı), Dosya › Hesap ürün bilgisi; bozuk kurulumda çökme.
import { useEffect, useState } from 'react';
import { adOf } from '../core/winpc';
import type { AppCtx } from './Masaustu';

const norm = (k: string) => k.toUpperCase().replace(/[^A-Z0-9]/g, '');

export default function Word(ctx: AppCtx) {
  const { pc, act } = ctx;
  const office = pc.uygulamalar.find((u) => u.id === 'office');
  const [dlg, setDlg] = useState(false);
  const [hesap, setHesap] = useState(false);
  const [anahtar, setAnahtar] = useState('');
  const [hata, setHata] = useState('');

  const bozuk = !!office?.bozuk;
  useEffect(() => {
    if (bozuk) ctx.log('word.cokme', {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bozuk]);

  if (!office || (office.bilesenler && !office.bilesenler.includes('word'))) return <div className="inst-b">Word bu bilgisayarda yüklü değil.</div>;
  if (office.bozuk) {
    return (
      <div className="inst-b">
        <b>Microsoft Word çalışmayı durdurdu</b>
        <p className="small">Bir sorun programın düzgün çalışmasını engelledi. Office kurulumunu onarmayı deneyin: Ayarlar › Uygulamalar › Yüklü uygulamalar › Microsoft Office › Değiştir.</p>
        <button className="ws-btn primary" onClick={() => ctx.close('word')}>
          Programı kapat
        </button>
      </div>
    );
  }

  return (
    <div className="word-app">
      <div className="wa-ribbon">
        <button className={hesap ? 'on' : ''} onClick={() => setHesap((h) => !h)}>
          Dosya
        </button>
        <span className="on2">Giriş</span>
        <span>Ekle</span>
        <span>Tasarım</span>
        <span>Düzen</span>
        <span>Başvurular</span>
        <span>Gözden Geçir</span>
      </div>
      {!office.etkin && (
        <div className="wa-banner">
          <b>ÜRÜN ETKİNLEŞTİRİLMEDİ</b> Word'ün çoğu özelliği devre dışı bırakıldı. Kullanmaya devam etmek için etkinleştirin.
          <button className="ws-btn" onClick={() => setDlg(true)}>
            Etkinleştir
          </button>
        </div>
      )}
      {hesap ? (
        <div className="wa-account">
          <h3>Hesap</h3>
          <b>Ürün Bilgileri</b>
          <p>{office.ad.replace(' - tr-tr', '')}</p>
          <p className={office.etkin ? 'ok-text' : 'err-text'}>{office.etkin ? '✔ Ürün Etkinleştirildi' : '✖ Ürün Etkinleştirmesi Gerekli'}</p>
          <p className="small">Bu ürün şunları içerir: {(office.bilesenler ?? []).map((b) => b[0].toUpperCase() + b.slice(1)).join(', ')}</p>
          {!office.etkin && (
            <button className="ws-btn" onClick={() => setDlg(true)}>
              Ürün Anahtarını Değiştir
            </button>
          )}
        </div>
      ) : (
        <div className="wa-page">
          <p>{ctx.arg ? adOf(ctx.arg) : 'Belge1'}</p>
          <p className="muted">Laboratuvar kullanım kuralları…</p>
        </div>
      )}
      {dlg && (
        <div className="ws-modal">
          <div className="ws-dlg">
            <div className="ws-h">Ürün anahtarınızı girin</div>
            <input value={anahtar} onChange={(e) => setAnahtar(e.target.value.toUpperCase())} placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" maxLength={29} aria-label="Office ürün anahtarı" />
            {hata && <p className="err-text small">{hata}</p>}
            <div className="ws-foot">
              <button
                className="ws-btn primary"
                onClick={() => {
                  const ok = !!ctx.veri.officeAnahtar && norm(anahtar) === norm(ctx.veri.officeAnahtar);
                  act('office.etkinlestir', { dogru: ok }, (p) => {
                    if (ok) p.uygulamalar.find((u) => u.id === 'office')!.etkin = true;
                    return p;
                  });
                  if (ok) {
                    setDlg(false);
                    setHesap(true);
                  } else setHata('Bu ürün anahtarı geçerli değil. Lütfen denetleyip yeniden deneyin.');
                }}
              >
                Etkinleştir
              </button>
              <button className="ws-btn" onClick={() => setDlg(false)}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
