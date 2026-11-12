// Sistem Özellikleri › Sistem Koruması: geri yükleme noktası oluşturma.
import { useState } from 'react';
import type { AppCtx } from './Masaustu';

export default function SistemKoruma(ctx: AppCtx) {
  const { pc, act } = ctx;
  const [olustur, setOlustur] = useState(false);
  const [ad, setAd] = useState('');
  const [mesaj, setMesaj] = useState('');
  return (
    <div className="sp">
      <div className="sp-tabs">
        <span>Bilgisayar Adı</span>
        <span>Donanım</span>
        <span>Gelişmiş</span>
        <span className="on">Sistem Koruması</span>
        <span>Uzak</span>
      </div>
      <div className="sp-body">
        <p className="small">İstenmeyen sistem değişikliklerini geri almak için sistem korumasını kullanın.</p>
        <fieldset>
          <legend>Sistem Geri Yükleme</legend>
          <p className="small">Bilgisayarınızı önceki bir geri yükleme noktasına döndürerek sistem değişikliklerini geri alabilirsiniz.</p>
          <button className="ws-btn" disabled={pc.geriYukleme.length === 0}>
            Sistem Geri Yükleme...
          </button>
        </fieldset>
        <fieldset>
          <legend>Koruma Ayarları</legend>
          <table className="tm-table">
            <thead>
              <tr>
                <th>Kullanılabilir Sürücüler</th>
                <th>Koruma</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>💽 Yerel Disk (C:) (Sistem)</td>
                <td>Açık</td>
              </tr>
            </tbody>
          </table>
          <div className="row">
            <span className="small">Sistem korumasının açık olduğu sürücüler için şimdi bir geri yükleme noktası oluşturun.</span>
            <button className="ws-btn" onClick={() => (setOlustur(true), setMesaj(''))}>
              Oluştur...
            </button>
          </div>
          {pc.geriYukleme.length > 0 && <p className="small">Geri yükleme noktaları: {pc.geriYukleme.join(', ')}</p>}
        </fieldset>
        {mesaj && <p className="ok-text small">{mesaj}</p>}
      </div>
      {olustur && (
        <div className="ws-modal">
          <div className="ws-dlg">
            <div className="ws-h">Geri yükleme noktası oluştur</div>
            <p className="small">Geri yükleme noktasını tanımlamanıza yardımcı olacak bir açıklama yazın. Geçerli tarih ve saat otomatik olarak eklenir.</p>
            <input value={ad} onChange={(e) => setAd(e.target.value)} aria-label="Geri yükleme noktası açıklaması" autoFocus />
            <div className="ws-foot">
              <button
                className="ws-btn primary"
                disabled={!ad.trim()}
                onClick={() => {
                  const a = ad.trim();
                  ctx.uac('Sistem Koruması', 'Microsoft Windows', () => {
                    act('geriyukleme.olustur', { ad: a }, (p) => (p.geriYukleme.push(a), p));
                    setOlustur(false);
                    setAd('');
                    setMesaj('Geri yükleme noktası başarıyla oluşturuldu.');
                  });
                }}
              >
                Oluştur
              </button>
              <button className="ws-btn" onClick={() => setOlustur(false)}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
