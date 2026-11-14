// Microsoft Word: etkinleştirme (ürün anahtarı), Dosya › Hesap ürün bilgisi; bozuk kurulumda çökme.
import { useEffect, useState } from 'react';
import { adOf } from '../core/winpc';
import type { AppCtx } from './Masaustu';
import { EtkinlestirPenceresi, HesapPaneli } from './OfficeEtkinlestir';


export default function Word(ctx: AppCtx) {
  const { pc } = ctx;
  const office = pc.uygulamalar.find((u) => u.id === 'office');
  const [dlg, setDlg] = useState(false);
  const [hesap, setHesap] = useState(false);

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
        <HesapPaneli ctx={ctx} etkinlestir={() => setDlg(true)} />      ) : (
        <div className="wa-page">
          <p>{ctx.arg ? adOf(ctx.arg) : 'Belge1'}</p>
          <p className="muted">Laboratuvar kullanım kuralları…</p>
        </div>
      )}
      {dlg && <EtkinlestirPenceresi ctx={ctx} kapat={() => setDlg(false)} tamam={() => setHesap(true)} />}
    </div>
  );
}
