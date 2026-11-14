// Genel kurulum sihirbazı: KATALOG tanımındaki adımları yürütür (lisans, tür, bileşenler, ek teklifler,
// klasör, gereksinim, hesap, kurulum, bitti). Gerçek zamanlı koruma açıksa zararlı yükleyiciler engellenir.
import { useEffect, useState } from 'react';
import { KATALOG, kur, type KurulumAdim } from '../core/katalog';
import { adOf } from '../core/winpc';
import type { AppCtx } from './Masaustu';

export default function Kurulum(ctx: AppCtx) {
  const { pc, act } = ctx;
  const yol = ctx.arg ?? '';
  const dosya = pc.fs[yol];
  const t = dosya?.kurulum ? KATALOG[dosya.kurulum] : undefined;
  const [i, setI] = useState(0);
  const [lisans, setLisans] = useState(false);
  const [ozel, setOzel] = useState(false);
  const [bilesen, setBilesen] = useState<string[]>(t?.bilesenler?.map((b) => b.id) ?? []);
  const [teklif, setTeklif] = useState<string[]>(t?.teklifler?.map((x) => x.id) ?? []);
  const [hesap, setHesap] = useState({ e: '', p: '' });
  const [hata, setHata] = useState('');
  const [pct, setPct] = useState(0);
  const [engel, setEngel] = useState(false);

  // Zararlı yükleyici + gerçek zamanlı koruma → Defender engeller
  useEffect(() => {
    if (!t || !dosya) return;
    if (t.zararli === 'trojan' && pc.guvenlik.gercekZaman) {
      setEngel(true);
      act('defender.engelledi', { dosya: yol }, (p) => {
        p.guvenlik.karantina.push(yol);
        delete p.fs[yol];
        return p;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adimlar = (t?.adimlar ?? []).filter((a) => a !== 'bilesen' || !t?.adimlar.includes('tur') || ozel);
  const adim: KurulumAdim | undefined = adimlar[i];

  useEffect(() => {
    if (adim !== 'kur' || !t) return;
    setPct(0);
    const t0 = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - t0) / 3000) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(iv);
        const secim = { bilesenler: t.bilesenler && t.id !== 'winrar' ? bilesen : t.id === 'winrar' ? bilesen : undefined, teklifler: t.teklifler ? teklif : [], ekTeklifler: dosya?.ekTeklifler ?? [] };
        act('kurulum.tamam', { uygulama: t.uygulama.id, tanim: t.id, kaynak: dosya?.kaynak ?? 'resmi', teklifler: secim.teklifler, ekTeklifler: secim.ekTeklifler, bilesenler: secim.bilesenler ?? [] }, (p0) => kur(p0, t.id, secim, dosya?.kaynak));
        setI((x) => x + 1);
      }
    }, 120);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adim]);

  if (engel)
    return (
      <div className="inst">
        <div className="inst-h" style={{ background: '#0067c0' }}>
          🛡 Windows Güvenliği
        </div>
        <div className="inst-b">
          <b>Tehdit bulundu</b>
          <p>Microsoft Defender Antivirus tehditleri buldu ve karantinaya aldı: HackTool:Win32/AutoKMS</p>
          <p className="small">Dosya: {yol.replace(/\//g, '\\')}</p>
          <div className="inst-f">
            <button className="ws-btn primary" onClick={() => ctx.close('kurulum')}>
              Kapat
            </button>
          </div>
        </div>
      </div>
    );
  if (!t || !dosya) return <div className="inst-b">Kurulum dosyası bulunamadı.</div>;

  const ileri = () => {
    setHata('');
    if (adim === 'lisans' && !lisans) return setHata('Devam etmek için lisans koşullarını kabul etmelisiniz.');
    if (adim === 'bilesen' && t.id === 'office' && bilesen.length === 0) return setHata('En az bir uygulama seçin.');
    if (adim === 'hesap') {
      const h = ctx.veri.adobeHesap;
      if (!h || hesap.e.trim().toLowerCase() !== h.eposta.toLowerCase() || hesap.p !== h.parola) {
        ctx.log('kurulum.hesap', { dogru: false });
        return setHata('E-posta adresi ya da parola yanlış.');
      }
      ctx.log('kurulum.hesap', { dogru: true });
    }
    ctx.log('kurulum.adim', { tanim: t.id, adim: adim ?? '' });
    setI((x) => x + 1);
  };

  const req: [string, string, string, boolean][] = [
    ['İşlemci', '64 bit, SSE 4.2, 2 GHz+', pc.cihaz.islemci, true],
    ['İşletim sistemi', 'Windows 10 22H2 / Windows 11 (64 bit)', `${pc.cihaz.surum} ${pc.cihaz.yapi.split(' ')[0]}`, true],
    ['RAM', '8 GB (16 GB önerilir)', pc.cihaz.ram, !/^[1-7],/.test(pc.cihaz.ram)],
    ['Ekran kartı', 'DirectX 12, 1,5 GB GPU belleği', pc.cihaz.ekranKarti, !/Temel|Basic/.test(pc.cihaz.ekranKarti)],
    ['Disk alanı', '20 GB boş', '312 GB boş', true],
  ];

  return (
    <div className="inst">
      <div className="inst-h" style={{ background: t.renk }}>
        {t.baslik} — Kurulum
      </div>
      <div className="inst-b">
        {adim === 'hosgeldin' && (
          <>
            <b>{t.id === 'kms' ? 'Office ve Windows\'u ücretsiz etkinleştirin!' : `${t.baslik} kurulumuna hoş geldiniz`}</b>
            <p className="small">{t.id === 'kms' ? 'Lisans anahtarına gerek yok. %100 çalışır. Antivirüsünüzü kapatmanız önerilir.' : 'İndirme yöneticisi, Google Chrome\'u ve önerilen yazılımları bilgisayarınıza kuracak.'}</p>
          </>
        )}
        {adim === 'lisans' && (
          <>
            <b>Lisans koşulları</b>
            <div className="ws-scroll">{t.lisansMetni}</div>
            <label className="ws-radio">
              <input type="checkbox" checked={lisans} onChange={(e) => setLisans(e.target.checked)} /> Bu sözleşmenin koşullarını kabul ediyorum
            </label>
          </>
        )}
        {adim === 'tur' && (
          <>
            <b>İstediğiniz yüklemeyi seçin</b>
            <div className="row">
              <button className="ws-btn primary" onClick={() => (setOzel(false), ctx.log('kurulum.tur', { tur: 'simdi' }), setI((x) => x + 1))}>
                Şimdi Yükle
              </button>
              <button className="ws-btn" onClick={() => (setOzel(true), ctx.log('kurulum.tur', { tur: 'ozel' }), setI((x) => x + 1))}>
                Özelleştir
              </button>
            </div>
            <p className="small">Şimdi Yükle: tüm uygulamalar varsayılan ayarlarla yüklenir. Özelleştir: yüklenecek uygulamaları seçin.</p>
          </>
        )}
        {adim === 'bilesen' && (
          <>
            <b>{t.id === 'winrar' ? 'WinRAR\'ı şu dosya türleriyle ilişkilendir' : 'Yükleme Seçenekleri — yüklenecek uygulamalar'}</b>
            <div className="inst-list">
              {t.bilesenler?.map((b) => (
                <label key={b.id}>
                  <input type="checkbox" checked={bilesen.includes(b.id)} onChange={(e) => setBilesen((l) => (e.target.checked ? [...l, b.id] : l.filter((x) => x !== b.id)))} aria-label={b.ad} /> {b.ad}
                </label>
              ))}
            </div>
            {t.id === 'office' && <p className="small">Dil: Türkçe (tr-tr)</p>}
          </>
        )}
        {adim === 'teklif' && (
          <>
            <b>Önerilen yazılımlar</b>
            <p className="small">Daha iyi bir deneyim için şu ücretsiz yazılımları da kurun (önerilir):</p>
            <div className="inst-list">
              {t.teklifler?.map((x) => (
                <label key={x.id}>
                  <input type="checkbox" checked={teklif.includes(x.id)} onChange={(e) => setTeklif((l) => (e.target.checked ? [...l, x.id] : l.filter((y) => y !== x.id)))} aria-label={x.ad} /> <b>{x.ad}</b> — {x.aciklama}
                </label>
              ))}
            </div>
            <p className="tiny muted">Kabul Et'e tıklayarak teklif edilen yazılımların lisans koşullarını kabul etmiş olursunuz.</p>
          </>
        )}
        {adim === 'klasor' && (
          <>
            <b>Hedef klasör</b>
            <input value={t.klasor} readOnly aria-label="Hedef klasör" />
            <p className="small">Gereken alan: {t.uygulama.boyutMB} MB · Kullanılabilir alan: 312 GB</p>
          </>
        )}
        {adim === 'gereksinim' && (
          <>
            <b>Sistem gereksinimleri denetleniyor</b>
            <table className="inst-req">
              <thead>
                <tr>
                  <th>Bileşen</th>
                  <th>Gereksinim</th>
                  <th>Bu bilgisayar</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {req.map(([a, g, b, ok]) => (
                  <tr key={a}>
                    <td>{a}</td>
                    <td>{g}</td>
                    <td>{b}</td>
                    <td className={ok ? 'ok-text' : 'err-text'}>{ok ? '✔' : '✖'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {adim === 'hesap' && (
          <>
            <b>Adobe hesabınızla oturum açın</b>
            <input placeholder="E-posta adresi" value={hesap.e} onChange={(e) => setHesap({ ...hesap, e: e.target.value })} aria-label="E-posta" />
            <input type="text" data-sim-parola autoComplete="off" spellCheck={false} placeholder="Parola" value={hesap.p} onChange={(e) => setHesap({ ...hesap, p: e.target.value })} aria-label="Hesap parolası" />
          </>
        )}
        {adim === 'kur' && (
          <>
            <b>{t.id === 'chrome' ? 'Chrome indiriliyor ve yükleniyor…' : 'Yükleniyor…'}</b>
            <div className="ws-bar">
              <i style={{ width: pct + '%' }} />
            </div>
            <small>%{pct}</small>
          </>
        )}
        {adim === 'bitti' && (
          <>
            <b>{t.id === 'kms' ? '✔ Aktivasyon başarılı!' : '✔ Kurulum tamamlandı'}</b>
            <p className="small">{t.bittiNot ?? `${t.uygulama.ad} kuruldu.`}</p>
          </>
        )}
        {hata && <p className="err-text small">{hata}</p>}
        {adim !== 'tur' && adim !== 'kur' && (
          <div className="inst-f">
            {adim === 'bitti' ? (
              <button className="ws-btn primary" onClick={() => ctx.close('kurulum')}>
                {t.id === 'chrome' ? 'Kapat' : 'Son'}
              </button>
            ) : (
              <>
                <button className="ws-btn" onClick={() => (ctx.log('kurulum.iptal', { tanim: t.id }), ctx.close('kurulum'))}>
                  İptal
                </button>
                <button className="ws-btn primary" onClick={ileri}>
                  {adim === 'teklif' ? 'Kabul Et' : adim === 'klasor' ? 'Yükle' : adim === 'hesap' ? 'Oturum aç' : 'İleri'}
                </button>
              </>
            )}
          </div>
        )}
        <small className="muted tiny">Kurulum dosyası: {adOf(yol)}</small>
      </div>
    </div>
  );
}
