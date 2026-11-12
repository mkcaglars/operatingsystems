// Windows Güvenliği (Microsoft Defender): giriş, virüs ve tehdit koruması (tarama, ayarlar, güncelleştirme,
// fidye yazılımı koruması), güvenlik duvarı ve ağ koruması, uygulama ve tarayıcı denetimi, cihaz güvenliği, koruma geçmişi.
import { useEffect, useState } from 'react';
import { adOf, bulunanTehditler, guvenlikUyarilari, PROFIL_AD, type Profil } from '../core/winpc';
import { Toggle, type AppCtx } from './Masaustu';

type Sayfa = 'giris' | 'virus' | 'virus-ayar' | 'fidye' | 'tarama' | 'duvar' | 'smart' | 'cihaz' | 'gecmis' | 'hesap';

export default function Guvenlik(ctx: AppCtx) {
  const { pc, act } = ctx;
  const g = pc.guvenlik;
  const [sayfa, setSayfa] = useState<Sayfa>((ctx.arg as Sayfa) || 'giris');
  const [taramaTuru, setTaramaTuru] = useState<'hizli' | 'tam' | 'ozel' | 'cevrimdisi'>('hizli');
  const [tariyor, setTariyor] = useState<{ tur: string; pct: number } | null>(null);
  const [eylem, setEylem] = useState<Record<string, string>>({});
  const [ekle, setEkle] = useState('');
  const uyarilar = guvenlikUyarilari(pc);
  const durum = (bolum: string) => (uyarilar.some((u) => u.bolum === bolum) ? 'kirmizi' : 'yesil');

  const bulunanlar = bulunanTehditler(pc);

  useEffect(() => {
    if (!tariyor) return;
    const sure = tariyor.tur === 'hizli' ? 2500 : 5000;
    const t0 = Date.now();
    const t = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - t0) / sure) * 100));
      setTariyor((x) => (x ? { ...x, pct } : x));
      if (pct >= 100) {
        clearInterval(t);
        act('guvenlik.tarama', { tur: tariyor.tur }, (p) => ((p.guvenlik.sonTarama = tariyor.tur as typeof g.sonTarama), p));
        setTariyor(null);
      }
    }, 120);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tariyor?.tur]);

  const git = (s: Sayfa) => {
    setSayfa(s);
    ctx.log('guvenlik.sayfa', { sayfa: s });
  };
  const tara = (tur: 'hizli' | 'tam' | 'ozel' | 'cevrimdisi') => {
    if (!g.tanimlarGuncel) ctx.log('guvenlik.eski-tanimla-tarama', {});
    setTariyor({ tur, pct: 0 });
  };

  const Tile = ({ id, ad, ik, bolum }: { id: Sayfa; ad: string; ik: string; bolum?: string }) => {
    const d = bolum ? durum(bolum) : 'yesil';
    return (
      <button className={'ds-tile ' + d} onClick={() => git(id)}>
        <i>{ik}</i>
        <b>{ad}</b>
        <small>{d === 'yesil' ? '✔ Eylem gerekmiyor.' : '✖ Eylem gerekiyor.'}</small>
      </button>
    );
  };

  function icerik() {
    switch (sayfa) {
      case 'giris':
        return (
          <>
            <h2>Bir bakışta güvenlik</h2>
            <p className="small">Cihazınızın güvenliğini ve durumunu görün, gereken eylemleri gerçekleştirin.</p>
            <div className="ds-tiles">
              <Tile id="virus" ad="Virüs ve tehdit koruması" ik="🛡" bolum="virus" />
              <Tile id="hesap" ad="Hesap koruması" ik="👤" />
              <Tile id="duvar" ad="Güvenlik duvarı ve ağ koruması" ik="📶" bolum="duvar" />
              <Tile id="smart" ad="Uygulama ve tarayıcı denetimi" ik="🌐" bolum="smart" />
              <Tile id="cihaz" ad="Cihaz güvenliği" ik="💻" />
              <Tile id="gecmis" ad="Koruma geçmişi" ik="🕘" />
            </div>
          </>
        );
      case 'virus':
        return (
          <>
            <h2>🛡 Virüs ve tehdit koruması</h2>
            <section className="ds-sec">
              <h4>Geçerli tehditler</h4>
              {bulunanlar.length === 0 ? (
                <p className="small">{g.sonTarama ? `Geçerli tehdit yok. Son tarama: ${g.sonTarama === 'hizli' ? 'Hızlı tarama' : g.sonTarama === 'tam' ? 'Tam tarama' : 'Özel tarama'}.` : 'Henüz tarama yapılmadı.'}</p>
              ) : (
                <>
                  <p className="err-text small">Tehditler bulundu. Önerilen eylemleri başlatın.</p>
                  {bulunanlar.map(([p, f]) => (
                    <div key={p} className="ds-threat">
                      <div>
                        <b>{f.tehdit}</b>
                        <small>Önem derecesi: Ciddi · Dosya: {p.replace(/\//g, '\\')}</small>
                      </div>
                      <select value={eylem[p] ?? 'karantina'} onChange={(e) => setEylem({ ...eylem, [p]: e.target.value })} aria-label={`${adOf(p)} için eylem`}>
                        <option value="karantina">Karantinaya al</option>
                        <option value="kaldir">Kaldır</option>
                        <option value="izin">Cihazda izin ver</option>
                      </select>
                    </div>
                  ))}
                  <button
                    className="ws-btn primary"
                    onClick={() =>
                      act('guvenlik.eylem', { eylemler: bulunanlar.map(([p]) => `${adOf(p)}:${eylem[p] ?? 'karantina'}`) }, (pc2) => {
                        for (const [p] of bulunanlar) {
                          const e = eylem[p] ?? 'karantina';
                          if (e === 'izin') pc2.guvenlik.izinVerilen.push(p);
                          else {
                            pc2.guvenlik.karantina.push(p);
                            delete pc2.fs[p];
                            if (p.includes('svchost32')) pc2.surecler = pc2.surecler.filter((s) => s.id !== 'svchost32');
                          }
                        }
                        if (pc2.guvenlik.izinVerilen.length === 0 && pc2.guvenlik.karantina.some((k) => k.includes('svchost32'))) pc2.zararli = pc2.zararli.filter((z) => z !== 'trojan');
                        return pc2;
                      })
                    }
                  >
                    Eylemleri başlat
                  </button>
                </>
              )}
              <div className="row">
                <button className="ws-btn primary" disabled={!!tariyor} onClick={() => tara('hizli')}>
                  Hızlı tarama
                </button>
                <button className="ws-link" onClick={() => git('tarama')}>
                  Tarama seçenekleri
                </button>
              </div>
              {tariyor && (
                <div className="ds-scan">
                  {tariyor.tur === 'hizli' ? 'Hızlı tarama' : tariyor.tur === 'tam' ? 'Tam tarama' : 'Tarama'} çalışıyor… %{tariyor.pct}
                  <div className="ws-bar">
                    <i style={{ width: tariyor.pct + '%' }} />
                  </div>
                </div>
              )}
            </section>
            <section className="ds-sec">
              <h4>Virüs ve tehdit koruması ayarları</h4>
              <p className="small">{g.gercekZaman && g.bulut && g.kurcalama ? 'Eylem gerekmiyor.' : '✖ Bazı koruma ayarları kapalı.'}</p>
              <button className="ws-link" onClick={() => git('virus-ayar')}>
                Ayarları yönet
              </button>
            </section>
            <section className="ds-sec">
              <h4>Virüs ve tehdit koruması güncelleştirmeleri</h4>
              <p className="small">{g.tanimlarGuncel ? 'Güvenlik bilgileri güncel. Son güncelleştirme: bugün 08:12' : '✖ Güvenlik bilgileri güncel değil. Son güncelleştirme: 47 gün önce'}</p>
              <button className="ws-link" onClick={() => act('guvenlik.guncelle', {}, (p) => ((p.guvenlik.tanimlarGuncel = true), p))}>
                Koruma güncelleştirmeleri › Güncelleştirmeleri denetle
              </button>
            </section>
            <section className="ds-sec">
              <h4>Fidye yazılımı koruması</h4>
              <button className="ws-link" onClick={() => git('fidye')}>
                Fidye yazılımı korumasını yönet
              </button>
            </section>
          </>
        );
      case 'tarama':
        return (
          <>
            <h2>Tarama seçenekleri</h2>
            {(
              [
                ['hizli', 'Hızlı tarama', 'Sistemdeki tehditlerin genellikle bulunduğu klasörleri denetler.'],
                ['tam', 'Tam tarama', 'Sabit diskteki tüm dosyaları ve çalışan programları denetler. Bu tarama bir saatten uzun sürebilir.'],
                ['ozel', 'Özel tarama', 'Hangi dosya ve konumların denetleneceğini seçin.'],
                ['cevrimdisi', 'Microsoft Defender Çevrimdışı tarama', 'Bazı kötü amaçlı yazılımları kaldırmak zordur; bilgisayar yeniden başlatılarak taranır.'],
              ] as const
            ).map(([id, ad, d]) => (
              <label key={id} className="ws-radio ds-radio">
                <input type="radio" checked={taramaTuru === id} onChange={() => setTaramaTuru(id)} />
                <span>
                  <b>{ad}</b>
                  <small>{d}</small>
                </span>
              </label>
            ))}
            <button
              className="ws-btn primary"
              disabled={!!tariyor}
              onClick={() => {
                tara(taramaTuru);
                git('virus');
              }}
            >
              Şimdi tara
            </button>
          </>
        );
      case 'virus-ayar':
        return (
          <>
            <h2>Virüs ve tehdit koruması ayarları</h2>
            {(
              [
                ['gercekZaman', 'Gerçek zamanlı koruma', 'Kötü amaçlı yazılımların cihazınıza yüklenmesini ya da çalışmasını bulur ve durdurur.'],
                ['bulut', 'Bulut tabanlı koruma', 'Buluttaki en yeni koruma verilerine erişerek daha hızlı koruma sağlar.'],
                ['kurcalama', 'Kurcalama koruması', 'Başkalarının önemli güvenlik özelliklerini kurcalamasını önler.'],
              ] as const
            ).map(([k, ad, d]) => (
              <div key={k} className="ds-sec">
                <h4>{ad}</h4>
                <p className="small">{d}</p>
                {!g[k] && <p className="err-text small">✖ {ad} kapalı. Cihazınız savunmasız olabilir.</p>}
                <Toggle on={g[k]} label={ad} onChange={(v) => ctx.uac('Windows Güvenliği', 'Microsoft Windows', () => act('guvenlik.ayar', { ayar: k, deger: v }, (p) => ((p.guvenlik[k] = v), p)))} />
              </div>
            ))}
          </>
        );
      case 'fidye':
        return (
          <>
            <h2>Fidye yazılımı koruması</h2>
            <section className="ds-sec">
              <h4>Denetimli klasör erişimi</h4>
              <p className="small">Dosyaları, klasörleri ve bellek alanlarını cihazınızda kolay uygulamaların yetkisiz değişikliklerinden koruyun.</p>
              <Toggle on={g.denetimliKlasor} label="Denetimli klasör erişimi" onChange={(v) => ctx.uac('Windows Güvenliği', 'Microsoft Windows', () => act('guvenlik.denetimli', { deger: v }, (p) => ((p.guvenlik.denetimliKlasor = v), p)))} />
            </section>
            {g.denetimliKlasor && (
              <section className="ds-sec">
                <h4>Korumalı klasörler</h4>
                <ul className="small">
                  {['Belgeler', 'Resimler', 'Videolar', 'Müzik', 'Masaüstü'].map((x) => (
                    <li key={x}>{x} (Windows sistem klasörü)</li>
                  ))}
                  {g.korunan.map((k) => (
                    <li key={k}>{k.replace(/\//g, '\\')}</li>
                  ))}
                </ul>
                <div className="row">
                  <select value={ekle} onChange={(e) => setEkle(e.target.value)} aria-label="Korumalı klasör ekle">
                    <option value="">+ Korumalı klasör ekle…</option>
                    {Object.keys(pc.fs)
                      .filter((p) => pc.fs[p].tur === 'klasor' && !/^[A-Z]:$/.test(p) && !g.korunan.includes(p) && (p.startsWith('D:') || p.split('/').length <= 2))
                      .map((p) => (
                        <option key={p} value={p}>
                          {p.replace(/\//g, '\\')}
                        </option>
                      ))}
                  </select>
                  <button className="ws-btn" disabled={!ekle} onClick={() => ctx.uac('Windows Güvenliği', 'Microsoft Windows', () => (act('guvenlik.korunan-ekle', { klasor: ekle }, (p) => (p.guvenlik.korunan.push(ekle), p)), setEkle('')))}>
                    Ekle
                  </button>
                </div>
              </section>
            )}
          </>
        );
      case 'duvar':
        return (
          <>
            <h2>📶 Güvenlik duvarı ve ağ koruması</h2>
            <p className="small">Ağlarınıza ve cihazınıza kimlerin, nelerin erişebileceğini belirler.</p>
            {(['etki', 'ozel', 'ortak'] as Profil[]).map((p) => (
              <section key={p} className="ds-sec">
                <h4>
                  {PROFIL_AD[p]} ağ{p === 'ozel' ? ' (etkin)' : ''}
                </h4>
                <p className={'small ' + (g.duvar[p] ? '' : 'err-text')}>{g.duvar[p] ? 'Güvenlik duvarı açık.' : '✖ Güvenlik duvarı kapalı. Cihazınız savunmasız olabilir.'}</p>
                <Toggle on={g.duvar[p]} label={`${PROFIL_AD[p]} ağ — Microsoft Defender Güvenlik Duvarı`} onChange={(v) => ctx.uac('Windows Güvenliği', 'Microsoft Windows', () => act('guvenlik.duvar', { profil: p, deger: v }, (x) => ((x.guvenlik.duvar[p] = v), x)))} />
              </section>
            ))}
          </>
        );
      case 'smart':
        return (
          <>
            <h2>🌐 Uygulama ve tarayıcı denetimi</h2>
            <section className="ds-sec">
              <h4>İtibar tabanlı koruma (SmartScreen)</h4>
              <p className="small">Cihazınızı kötü amaçlı ya da istenmeyebilecek uygulamalardan, dosyalardan ve web sitelerinden korur.</p>
              {!g.smartScreen && <p className="err-text small">✖ SmartScreen kapalı.</p>}
              <Toggle on={g.smartScreen} label="SmartScreen" onChange={(v) => ctx.uac('Windows Güvenliği', 'Microsoft Windows', () => act('guvenlik.smartscreen', { deger: v }, (p) => ((p.guvenlik.smartScreen = v), p)))} />
            </section>
          </>
        );
      case 'cihaz':
        return (
          <>
            <h2>💻 Cihaz güvenliği</h2>
            <section className="ds-sec">
              <h4>Güvenlik işlemcisi</h4>
              <p className="small">Güvenilir Platform Modülü (TPM) 2.0 — cihazınıza ek şifreleme sağlar.</p>
            </section>
            <section className="ds-sec">
              <h4>Güvenli önyükleme</h4>
              <p className="small">Güvenli önyükleme açık. Kötü amaçlı yazılımların cihaz açılırken yüklenmesini önler.</p>
            </section>
          </>
        );
      case 'hesap':
        return (
          <>
            <h2>👤 Hesap koruması</h2>
            <p className="small">Windows Hello: PIN ile oturum açma ayarlandı. Dinamik kilit: telefonunuz uzaklaşınca cihazı kilitler (kapalı).</p>
          </>
        );
      case 'gecmis':
        return (
          <>
            <h2>🕘 Koruma geçmişi</h2>
            {g.karantina.length + g.izinVerilen.length === 0 && <p className="small">Gösterilecek son eylem yok.</p>}
            {g.karantina.map((k) => (
              <div key={k} className="ds-threat">
                <div>
                  <b>Tehdit karantinaya alındı</b>
                  <small>{k.replace(/\//g, '\\')}</small>
                </div>
              </div>
            ))}
            {g.izinVerilen.map((k) => (
              <div key={k} className="ds-threat warn">
                <div>
                  <b>Tehdide izin verildi (önerilmez)</b>
                  <small>{k.replace(/\//g, '\\')}</small>
                </div>
              </div>
            ))}
          </>
        );
    }
  }

  return (
    <div className="ds">
      <nav className="ds-nav">
        {(
          [
            ['giris', '⌂', 'Giriş'],
            ['virus', '🛡', 'Virüs ve tehdit koruması'],
            ['hesap', '👤', 'Hesap koruması'],
            ['duvar', '📶', 'Güvenlik duvarı ve ağ koruması'],
            ['smart', '🌐', 'Uygulama ve tarayıcı denetimi'],
            ['cihaz', '💻', 'Cihaz güvenliği'],
            ['gecmis', '🕘', 'Koruma geçmişi'],
          ] as [Sayfa, string, string][]
        ).map(([id, ik, ad]) => (
          <button key={id} className={sayfa === id || (id === 'virus' && ['virus-ayar', 'fidye', 'tarama'].includes(sayfa)) ? 'on' : ''} onClick={() => git(id)} title={ad}>
            <i>{ik}</i>
            <span>{ad}</span>
          </button>
        ))}
      </nav>
      <main className="ds-main">{icerik()}</main>
    </div>
  );
}
