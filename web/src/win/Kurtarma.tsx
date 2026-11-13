// Mavi ekran (BSOD) ve Windows Kurtarma Ortamı (WinRE): Otomatik Onarım → Gelişmiş seçenekler →
// Sorun Gider → Başlangıç Ayarları (Güvenli Mod) / Sistem Geri Yükleme / Başlangıç Onarımı / Bu bilgisayarı sıfırla.
import { useEffect, useState } from 'react';
import { yenidenBaslat } from '../core/winpc';
import type { AppCtx } from './Masaustu';

type Sayfa = 'otomatik' | 'secenek' | 'sorun' | 'gelismis' | 'baslangic' | 'baslangic-liste' | 'onarim-sonuc' | 'geri' | 'geri-sonuc';

export default function Kurtarma(ctx: AppCtx) {
  const { pc, act } = ctx;
  const [sayfa, setSayfa] = useState<Sayfa>('otomatik');
  const [pct, setPct] = useState(0);
  const sorunlu = pc.aygitlar.find((a) => a.sorunluSurucu);

  useEffect(() => {
    if (pc.acilis !== 'bsod') return;
    setPct(0);
    const t0 = Date.now();
    const t = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - t0) / 3000) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(t);
        act('kurtarma.otomatik-onarim', {}, (x) => ((x.acilis = 'kurtarma'), x));
        setSayfa('otomatik');
      }
    }, 120);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pc.acilis]);

  if (pc.acilis === 'bsod')
    return (
      <div className="bsod w11-bsod">
        <div className="sad">:(</div>
        <p>Bilgisayarınız bir sorunla karşılaştı ve yeniden başlatılması gerekiyor. Yalnızca bazı hata bilgilerini topluyoruz, ardından sizin için yeniden başlatacağız.</p>
        <p>%{pct} tamamlandı</p>
        <p className="small">
          Durdurma kodu: SYSTEM THREAD EXCEPTION NOT HANDLED
          <br />
          Başarısız olan: {sorunlu?.id === 'gpu' ? 'nvlddmkm.sys' : 'driver.sys'}
        </p>
      </div>
    );

  const git = (s: Sayfa, ev?: string) => {
    setSayfa(s);
    if (ev) ctx.log('kurtarma.' + ev, {});
  };
  const Kutu = ({ ik, ad, alt, onClick }: { ik: string; ad: string; alt?: string; onClick: () => void }) => (
    <button className="re-tile" onClick={onClick}>
      <i>{ik}</i>
      <span>
        <b>{ad}</b>
        {alt && <small>{alt}</small>}
      </span>
    </button>
  );

  return (
    <div className="winre">
      {sayfa === 'otomatik' && (
        <>
          <h2>Otomatik Onarım</h2>
          <p>Bilgisayarınız doğru başlatılamadı</p>
          <p className="small">Bilgisayarınızı yeniden başlatmak için "Yeniden başlat"a basın; bu bazen sorunu düzeltebilir. Bilgisayarınızı onarmak üzere diğer seçenekleri denemek için "Gelişmiş seçenekler"e de basabilirsiniz.</p>
          <div className="re-btns">
            <button onClick={() => git('secenek', 'gelismis-secenekler')}>Gelişmiş seçenekler</button>
            <button onClick={() => act('kurtarma.yeniden-baslat', {}, (x) => yenidenBaslat(x))}>Yeniden başlat</button>
          </div>
        </>
      )}
      {sayfa === 'secenek' && (
        <>
          <h2>Bir seçenek belirleyin</h2>
          <Kutu ik="→" ad="Devam et" alt="Çıkın ve Windows 11'e devam edin" onClick={() => act('kurtarma.devam', {}, (x) => yenidenBaslat(x))} />
          <Kutu ik="🔧" ad="Sorun gider" alt="Bilgisayarınızı sıfırlayın ya da gelişmiş seçenekleri görün" onClick={() => git('sorun')} />
          <Kutu ik="⏻" ad="Bilgisayarınızı kapatın" onClick={() => act('kurtarma.kapat', {}, (x) => yenidenBaslat(x))} />
        </>
      )}
      {sayfa === 'sorun' && (
        <>
          <h2>Sorun gider</h2>
          <Kutu ik="↺" ad="Bu bilgisayarı sıfırla" alt="Kişisel dosyalarınızı tutmayı ya da kaldırmayı seçip Windows'u yeniden yükleyin" onClick={() => ctx.log('kurtarma.sifirla-denemesi', {})} />
          <Kutu ik="☰" ad="Gelişmiş seçenekler" onClick={() => git('gelismis')} />
        </>
      )}
      {sayfa === 'gelismis' && (
        <>
          <h2>Gelişmiş seçenekler</h2>
          <div className="re-grid">
            <Kutu ik="🛠" ad="Başlangıç Onarımı" alt="Windows'un yüklenmesini engelleyen sorunları düzeltin" onClick={() => git('onarim-sonuc', 'baslangic-onarimi')} />
            <Kutu ik="⚙" ad="Başlangıç Ayarları" alt="Windows başlangıç davranışını değiştirin" onClick={() => git('baslangic')} />
            <Kutu ik="⟲" ad="Sistem Geri Yükleme" alt="Windows'u geri yüklemek için bilgisayarınızda kayıtlı bir geri yükleme noktası kullanın" onClick={() => git('geri')} />
            <Kutu ik="⌨" ad="Komut İstemi" alt="Gelişmiş sorun giderme için" onClick={() => ctx.log('kurtarma.komut-istemi', {})} />
            <Kutu ik="⬇" ad="Güncelleştirmeleri kaldır" alt="Son yüklenen kalite ya da özellik güncelleştirmelerini kaldırın" onClick={() => ctx.log('kurtarma.guncelleme-kaldir', {})} />
            <Kutu ik="🖥" ad="UEFI Bellenim Ayarları" alt="Bilgisayarınızın UEFI bellenimindeki ayarları değiştirin" onClick={() => ctx.log('kurtarma.uefi', {})} />
          </div>
          <button className="re-back" onClick={() => git('sorun')}>
            ← Geri
          </button>
        </>
      )}
      {sayfa === 'onarim-sonuc' && (
        <>
          <h2>Başlangıç Onarımı</h2>
          <p>Başlangıç Onarımı bilgisayarınızı onaramadı.</p>
          <p className="small">Günlük dosyası: C:\Windows\System32\Logfiles\Srt\SrtTrail.txt — Sorun bir aygıt sürücüsünden kaynaklanıyor olabilir.</p>
          <button className="re-back" onClick={() => git('gelismis')}>
            ← Gelişmiş seçenekler
          </button>
        </>
      )}
      {sayfa === 'baslangic' && (
        <>
          <h2>Başlangıç Ayarları</h2>
          <p>Windows seçeneklerini değiştirmek için yeniden başlatın; örneğin:</p>
          <ul className="small">
            <li>Düşük çözünürlüklü video modunu etkinleştir</li>
            <li>Hata ayıklama modunu etkinleştir</li>
            <li>Güvenli Modu etkinleştir</li>
            <li>Sürücü imzası zorlamasını devre dışı bırak</li>
          </ul>
          <div className="re-btns">
            <button onClick={() => git('baslangic-liste', 'baslangic-ayarlari')}>Yeniden başlat</button>
          </div>
        </>
      )}
      {sayfa === 'baslangic-liste' && (
        <>
          <h2>Başlangıç Ayarları</h2>
          <p>Aşağıdaki seçeneklerden birini belirlemek için numarasına basın:</p>
          <ol className="re-list">
            {[
              'Hata ayıklamayı etkinleştir',
              'Önyükleme günlüğünü etkinleştir',
              'Düşük çözünürlüklü videoyu etkinleştir',
              'Güvenli Modu etkinleştir',
              'Ağ ile Güvenli Modu etkinleştir',
              'Komut İstemi ile Güvenli Modu etkinleştir',
              'Sürücü imzası zorlamasını devre dışı bırak',
              'Erken başlatılan kötü amaçlı yazılımdan koruma özelliğini devre dışı bırak',
              'Hatadan sonra otomatik olarak yeniden başlatmayı devre dışı bırak',
            ].map((t, i) => (
              <li key={t}>
                <button
                  onClick={() => {
                    if (i === 3 || i === 4) act('kurtarma.guvenli-mod', { secenek: i + 1 }, (x) => yenidenBaslat(x, 'guvenli'));
                    else act('kurtarma.baslangic-secenegi', { secenek: i + 1 }, (x) => yenidenBaslat(x));
                  }}
                >
                  {i + 1}) {t}
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
      {sayfa === 'geri' && (
        <>
          <h2>Sistem Geri Yükleme</h2>
          {pc.geriYukleme.length === 0 ? (
            <p>Bu bilgisayarın sistem sürücüsünde geri yükleme noktası oluşturulmamış.</p>
          ) : (
            <>
              <p>Bir geri yükleme noktası seçin:</p>
              {pc.geriYukleme.map((g) => (
                <button
                  key={g}
                  className="re-tile"
                  onClick={() => {
                    act('kurtarma.geri-yukle', { nokta: g }, (x) => {
                      for (const a of x.aygitlar) if (a.sorunluSurucu) a.sorunluSurucu = false;
                      return yenidenBaslat(x);
                    });
                  }}
                >
                  <i>⟲</i>
                  <span>
                    <b>{g}</b>
                    <small>Sistem dosyaları ve sürücüler bu noktaya döndürülür; kişisel dosyalar etkilenmez.</small>
                  </span>
                </button>
              ))}
            </>
          )}
          <button className="re-back" onClick={() => git('gelismis')}>
            ← Gelişmiş seçenekler
          </button>
        </>
      )}
    </div>
  );
}
