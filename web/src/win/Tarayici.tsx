// Sanal tarayıcı (Edge/Chrome): arama sonuçları (reklamlı sahte siteler dahil), resmî indirme sayfaları,
// SmartScreen indirme uyarısı, indirilenler. İndirilen dosyalar İndirilenler klasörüne gelir.
import { useState, type FormEvent } from 'react';
import { INDIRILEN, KATALOG } from '../core/katalog';
import Logo from '../components/Logo';
import type { AppCtx } from './Masaustu';

interface Indirme {
  dosya: string;
  boyut: string;
  kurulum: string;
  /** kurulumsuz program (ör. rufus) */
  uygulama?: string;
  kaynak: 'resmi' | 'sahte';
  ekTeklifler?: string[];
}

interface Sonuc {
  url: string;
  baslik: string;
  ozet: string;
  reklam?: boolean;
}

const SAHTE: Record<string, { baslik: string; dosya: string; kurulum: string; slogan: string }> = {
  'chrome-indir-ucretsiz.net': { baslik: 'Chrome İndir — En Hızlı Sürüm!', dosya: 'ChromeSetup(1).exe', kurulum: 'chrome-sahte', slogan: 'Google Chrome 2026 Full Türkçe — Hızlı ve Ücretsiz İndir!' },
  'winrar-full-crack-indir.net': { baslik: 'WinRAR Full Crack İndir', dosya: 'WinRAR_Full_Crack_2026.exe', kurulum: 'kms', slogan: 'WinRAR 7 Full Lisanslı — Ömür Boyu Ücretsiz!' },
  'photoshop-crack-2025.net': { baslik: 'Photoshop 2025 Crack Full', dosya: 'Photoshop_2025_Crack_Patch.exe', kurulum: 'kms', slogan: 'Adobe Photoshop 2025 Full Crack — Lisans gerekmez!' },
  'windows11-full-etkinlestirilmis-indir.net': { baslik: 'Windows 11 Pro Full Etkinleştirilmiş', dosya: 'Win11_Pro_Activator_Full.exe', kurulum: 'kms', slogan: 'Windows 11 Pro + Etkinleştirici — Ömür boyu lisans!' },
  'office-2024-crack-kms-indir.net': { baslik: 'Office 2024 KMS Etkinleştirici', dosya: 'KMSPico_Office2024.exe', kurulum: 'kms', slogan: 'Office 2024 Full + KMS — Ürün anahtarı gerekmez!' },
  'pdf-reader-hizli-indir.com': { baslik: 'PDF Reader Hızlı İndir', dosya: 'PDFReader_Setup(2).exe', kurulum: 'chrome-sahte', slogan: 'En iyi PDF okuyucu — tek tık kurulum!' },
};

function sonuclar(q: string): Sonuc[] {
  const s = q.toLocaleLowerCase('tr');
  if (/chrome/.test(s))
    return [
      { url: 'chrome-indir-ucretsiz.net', baslik: 'Chrome İndir Ücretsiz - Hızlı İndirme Linki', ozet: 'Chrome 2026 Full Türkçe tek tıkla indir. %100 güvenli, virüssüz!', reklam: true },
      { url: 'www.google.com/chrome', baslik: 'Google Chrome - Google\'ın hızlı ve güvenli tarayıcısını indirin', ozet: 'Google Chrome, Google\'ın sunduğu yenilikleri içeren hızlı ve güvenli bir tarayıcıdır.' },
      { url: 'tr.wikipedia.org/wiki/Google_Chrome', baslik: 'Google Chrome - Vikipedi', ozet: 'Google Chrome, Google tarafından geliştirilen ücretsiz bir web tarayıcısıdır…' },
    ];
  if (/reader|acrobat|pdf/.test(s))
    return [
      { url: 'pdf-reader-hizli-indir.com', baslik: 'PDF Reader İndir - Ücretsiz', ozet: 'En hızlı PDF okuyucu. Hemen indir!', reklam: true },
      { url: 'get.adobe.com/tr/reader', baslik: 'Adobe Acrobat Reader: Ücretsiz PDF görüntüleyici indirin', ozet: 'PDF\'leri görüntülemek, yazdırmak, imzalamak ve yorum eklemek için ücretsiz, resmi Adobe Acrobat Reader.' },
    ];
  if (/winrar|rar/.test(s))
    return [
      { url: 'www.win-rar.com/turkce', baslik: 'WinRAR Türkçe — win.rar GmbH', ozet: 'WinRAR resmi indirme sayfası. 40 günlük deneme sürümü.' },
      { url: 'winrar-full-crack-indir.net', baslik: 'WinRAR Full Crack İndir 2026', ozet: 'WinRAR full lisanslı crack, keygen dahil.' },
    ];
  if (/office|word|excel|powerpoint/.test(s))
    return [
      { url: 'www.microsoft.com/tr-tr/microsoft-365/office-2024', baslik: 'Microsoft Office 2024 - Ürün anahtarınızla yükleyin', ozet: 'Office Professional Plus 2024: Word, Excel, PowerPoint, Outlook. Yükleyiciyi indirin ve ürün anahtarıyla etkinleştirin.' },
      { url: 'office-2024-crack-kms-indir.net', baslik: 'Office 2024 Full KMS Etkinleştirici İndir', ozet: 'Ürün anahtarı gerektirmez! KMSPico ile tek tık.', reklam: true },
    ];
  if (/ubuntu|linux/.test(s))
    return [
      { url: 'ubuntu.com/download/desktop', baslik: 'Ubuntu Desktop indir | Ubuntu', ozet: 'Ubuntu 24.04.1 LTS: 5 yıl güvenlik desteği. 64 bit ISO kalıbını indirin.' },
      { url: 'tr.wikipedia.org/wiki/Ubuntu', baslik: 'Ubuntu - Vikipedi', ozet: 'Ubuntu, Canonical tarafından geliştirilen Debian tabanlı bir Linux dağıtımıdır.' },
    ];
  if (/windows|win ?11|iso|kurulum medya/.test(s))
    return [
      { url: 'www.microsoft.com/tr-tr/software-download/windows11', baslik: "Windows 11'i İndirin - Microsoft", ozet: 'Windows 11 Kurulum Yardımcısı, kurulum medyası oluşturma ve x64 cihazlar için Windows 11 Disk Görüntüsü (ISO) indirme.' },
      { url: 'windows11-full-etkinlestirilmis-indir.net', baslik: 'Windows 11 Pro Full Etkinleştirilmiş ISO İndir', ozet: 'Lisans gerektirmez! Crack dahil tek link.', reklam: true },
    ];
  if (/rufus|usb|önyükle|bootable/.test(s))
    return [
      { url: 'rufus.ie/tr', baslik: 'Rufus - Önyüklenebilir USB sürücülerini kolay bir şekilde oluşturun', ozet: 'Rufus, USB bellekleri biçimlendirmeye ve önyüklenebilir USB sürücüler oluşturmaya yardımcı olan bir araçtır.' },
    ];
  if (/photoshop|adobe/.test(s))
    return [
      { url: 'www.adobe.com/tr/products/photoshop', baslik: 'Adobe Photoshop | Fotoğraf düzenleme yazılımı', ozet: 'Photoshop\'u Creative Cloud ile indirin. Sistem gereksinimleri ve okul lisansları.' },
      { url: 'photoshop-crack-2025.net', baslik: 'Photoshop 2025 Crack Full İndir', ozet: 'Lisanssız tam sürüm Photoshop.' },
    ];
  return [{ url: 'www.bing.com', baslik: `"${q}" için sonuç bulunamadı`, ozet: 'Farklı anahtar kelimeler deneyin (ör. "chrome indir").' }];
}

export default function Tarayici(ctx: AppCtx & { chrome?: boolean }) {
  const { pc, act } = ctx;
  const [url, setUrl] = useState(ctx.arg || 'yeni');
  const [adres, setAdres] = useState(ctx.arg && ctx.arg !== 'yeni' ? ctx.arg : '');
  const [q, setQ] = useState('');
  const [indir, setIndir] = useState<string[]>([]);
  const [uyari, setUyari] = useState<Indirme | null>(null);
  const [panel, setPanel] = useState(false);
  const [modal, setModal] = useState(false);
  const [ekT, setEkT] = useState({ scan: true, safe: true });

  const git = (u: string) => {
    setUrl(u);
    setAdres(u.startsWith('ara:') ? '' : u);
    setModal(false);
    ctx.log('tarayici.git', { url: u, cevrimici: pc.internet });
  };
  const ara = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    git('ara:' + q.trim());
  };
  const adresGit = (e: FormEvent) => {
    e.preventDefault();
    const a = adres.trim().replace(/^https?:\/\//, '');
    if (!a) return;
    if (/\s/.test(a) || !a.includes('.')) git('ara:' + a);
    else git(a);
  };

  const indirmeyiKaydet = (d: Indirme) => {
    const yol = `${INDIRILEN}/${d.dosya}`;
    act('indirme', { dosya: d.dosya, kaynak: d.kaynak, kurulum: d.kurulum }, (p) => {
      p.fs[yol] = { tur: 'dosya', boyut: d.boyut, ...(d.kurulum ? { kurulum: d.kurulum } : {}), ...(d.uygulama ? { uygulama: d.uygulama } : {}), kaynak: d.kaynak, ...(d.ekTeklifler ? { ekTeklifler: d.ekTeklifler } : {}) };
      return p;
    });
    setIndir((l) => (l.includes(d.dosya) ? l : [d.dosya, ...l]));
    setPanel(true);
  };
  const indirBaslat = (d: Indirme) => {
    if (d.kaynak === 'sahte' && pc.guvenlik.smartScreen) {
      setUyari(d);
      ctx.log('smartscreen.uyari', { dosya: d.dosya });
      return;
    }
    indirmeyiKaydet(d);
  };
  const ac = (dosya: string) => {
    const yol = `${INDIRILEN}/${dosya}`;
    const f = pc.fs[yol];
    if (f?.uygulama === 'rufus') {
      ctx.log('dosya.calistir', { dosya: yol, uygulama: 'rufus' });
      ctx.uac(dosya, 'Akeo Consulting', () => ctx.open('rufus'));
      return;
    }
    if (!f?.kurulum) return;
    ctx.log('dosya.calistir', { dosya: yol, kurulum: f.kurulum });
    ctx.uac(dosya, f.kaynak === 'sahte' ? 'Bilinmiyor' : KATALOG[f.kurulum].uygulama.yayinci, () => ctx.open('kurulum', yol));
  };

  function sayfa() {
    if (!pc.internet && url !== 'yeni')
      return (
        <div className="br-offline">
          <div className="dino">{ctx.chrome ? '🦖' : '🏄'}</div>
          <h2>İnternete bağlı değilsiniz</h2>
          <p>Deneyebilecekleriniz:</p>
          <ul>
            <li>Ağ kablolarını, modemi ve yönlendiriciyi denetleme</li>
            <li>Ağ bağdaştırıcısının etkin olduğunu denetleme</li>
            <li>Windows Ağ Tanılama'yı çalıştırma</li>
          </ul>
          <p className="small muted">{ctx.chrome ? 'ERR_INTERNET_DISCONNECTED' : 'DNS_PROBE_FINISHED_NO_INTERNET'}</p>
        </div>
      );
    if (url === 'yeni')
      return (
        <div className="br-new">
          <div className="br-logo">{ctx.chrome ? 'Google' : 'Bing'}</div>
          <form onSubmit={ara}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Web'de arayın" aria-label="Arama" autoFocus />
          </form>
        </div>
      );
    if (url.startsWith('ara:'))
      return (
        <div className="br-results">
          <form onSubmit={ara} className="br-sbar">
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Arama" />
          </form>
          {sonuclar(url.slice(4)).map((r) => (
            <div key={r.url} className="br-res">
              <small>
                {r.reklam && <b className="br-ad">Reklam · </b>}
                https://{r.url}
              </small>
              <button className="br-link" onClick={() => git(r.url)}>
                {r.baslik}
              </button>
              <p>{r.ozet}</p>
            </div>
          ))}
        </div>
      );
    if (SAHTE[url]) {
      const s = SAHTE[url];
      return (
        <div className="br-fake">
          <div className="br-fake-ads">
            <span>🎰 KAZANDINIZ! iPhone 17</span>
            <span>⚠ Bilgisayarınız yavaş! Hemen temizleyin</span>
          </div>
          <h1>{s.slogan}</h1>
          <button className="br-fake-btn" onClick={() => indirBaslat({ dosya: s.dosya, boyut: '1,8 MB', kurulum: s.kurulum, kaynak: 'sahte' })}>
            ⬇ HEMEN İNDİR
          </button>
          <button className="br-fake-btn small" onClick={() => indirBaslat({ dosya: s.dosya, boyut: '1,8 MB', kurulum: s.kurulum, kaynak: 'sahte' })}>
            Download Now
          </button>
          <p className="small">İndirme Yöneticisi ile hızlı indirin. Kurulum sırasında önerilen yazılımları kabul edin.</p>
        </div>
      );
    }
    if (url === 'www.google.com/chrome')
      return (
        <div className="br-page chrome">
          <div className="br-g">Google Chrome</div>
          <h1>Google'ın hızlı ve güvenli tarayıcısı</h1>
          <button className="br-blue" onClick={() => setModal(true)}>
            Chrome'u indir
          </button>
          <p className="small">Windows 11/10 64 bit için.</p>
          {modal && (
            <div className="br-modal">
              <h3>Chrome'u indirin</h3>
              <p className="small">Google Chrome Hizmet Şartları'nı okudum ve kabul ediyorum.</p>
              <button className="br-blue" onClick={() => (setModal(false), indirBaslat({ dosya: 'ChromeSetup.exe', boyut: '1,4 MB', kurulum: 'chrome', kaynak: 'resmi' }))}>
                Kabul et ve indir
              </button>
            </div>
          )}
        </div>
      );
    if (url === 'get.adobe.com/tr/reader')
      return (
        <div className="br-page adobe">
          <div className="br-a">Adobe</div>
          <h1>Adobe Acrobat Reader</h1>
          <p>PDF'leri görüntülemek, yazdırmak, imzalamak ve paylaşmak için dünyanın en güvenilir ücretsiz PDF görüntüleyicisi.</p>
          <div className="br-offers">
            <b>İsteğe bağlı teklifler:</b>
            <label>
              <input type="checkbox" checked={ekT.scan} onChange={(e) => setEkT({ ...ekT, scan: e.target.checked })} /> Evet, ücretsiz McAfee Security Scan Plus yardımcı programını yükle
            </label>
            <label>
              <input type="checkbox" checked={ekT.safe} onChange={(e) => setEkT({ ...ekT, safe: e.target.checked })} /> Evet, McAfee Safe Connect'i yükle
            </label>
          </div>
          <button
            className="br-red"
            onClick={() => {
              ctx.log('acrobat.teklif', { scan: ekT.scan, safe: ekT.safe });
              indirBaslat({ dosya: 'Reader_tr_install.exe', boyut: '1,2 MB', kurulum: 'acrobat', kaynak: 'resmi', ekTeklifler: [...(ekT.scan ? ['mcafee-scan'] : []), ...(ekT.safe ? ['mcafee-safe'] : [])] });
            }}
          >
            Acrobat Reader'ı İndir
          </button>
        </div>
      );
    if (url === 'www.win-rar.com/turkce')
      return (
        <div className="br-page rar">
          <h1>WinRAR — Türkçe</h1>
          <table className="br-tbl">
            <tbody>
              <tr>
                <td>WinRAR 7.01 Türkçe (64 bit)</td>
                <td>Windows</td>
                <td>
                  <button className="br-blue" onClick={() => indirBaslat({ dosya: 'winrar-x64-701tr.exe', boyut: '3,9 MB', kurulum: 'winrar', kaynak: 'resmi' })}>
                    İndir
                  </button>
                </td>
              </tr>
              <tr>
                <td>WinRAR 7.01 Türkçe (32 bit)</td>
                <td>Windows</td>
                <td>
                  <button className="br-blue" onClick={() => indirBaslat({ dosya: 'winrar-x32-701tr.exe', boyut: '3,6 MB', kurulum: 'winrar', kaynak: 'resmi' })}>
                    İndir
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="small">WinRAR bir paylaşımlı yazılımdır: 40 günlük ücretsiz deneme süresinden sonra lisans satın alınmalıdır.</p>
        </div>
      );
    if (url === 'www.microsoft.com/tr-tr/software-download/windows11')
      return (
        <div className="br-page ms">
          <div className="br-ms">
            <Logo id="microsoft" size="1.4em" /> Microsoft
          </div>
          <h1>Windows 11'i İndirin</h1>
          <section className="br-ms-sec">
            <h3>Windows 11 Kurulum Medyası Oluşturma</h3>
            <p className="small">Windows 11'i yeniden yüklemek ya da temiz yükleme yapmak istiyorsanız önyüklenebilir USB ya da DVD oluşturmak için bu aracı kullanın.</p>
            <button className="br-blue" onClick={() => indirBaslat({ dosya: 'mediacreationtool.exe', boyut: '9,8 MB', kurulum: '', kaynak: 'resmi' })}>
              Şimdi indirin
            </button>
            <p className="small muted">Bu simülasyonda kurulum belleği Rufus ile hazırlanır: aşağıdan ISO dosyasını indirip Rufus'la USB belleğe yazın.</p>
          </section>
          <section className="br-ms-sec">
            <h3>x64 cihazlar için Windows 11 Disk Görüntüsü (ISO) indirin</h3>
            <label className="small">
              Sürüm seçin{' '}
              <select aria-label="ISO sürümü" defaultValue="w11">
                <option value="w11">Windows 11 (multi-edition ISO for x64 devices)</option>
              </select>
            </label>
            <label className="small">
              Ürün dilini seçin{' '}
              <select aria-label="ISO dili" defaultValue="tr">
                <option value="tr">Türkçe</option>
                <option value="en">English International</option>
              </select>
            </label>
            <button className="br-blue" onClick={() => indirBaslat({ dosya: 'Win11_24H2_Turkish_x64.iso', boyut: '5,8 GB', kurulum: '', kaynak: 'resmi' })}>
              64 bit İndir
            </button>
            <p className="small muted">Bağlantı 24 saat geçerlidir. SHA256 doğrulama değerleri sayfanın altında listelenir.</p>
          </section>
        </div>
      );
    if (url === 'www.microsoft.com/tr-tr/microsoft-365/office-2024')
      return (
        <div className="br-page ms">
          <div className="br-ms">
            <Logo id="microsoft" size="1.4em" /> Microsoft
          </div>
          <h1>Microsoft Office Professional Plus 2024</h1>
          <p>Word, Excel, PowerPoint, Outlook ve daha fazlası. Kurumunuzun verdiği ürün anahtarıyla etkinleştirin.</p>
          <section className="br-ms-sec">
            <h3>1. Office'i indirin ve yükleyin</h3>
            <button className="br-blue" onClick={() => indirBaslat({ dosya: 'OfficeSetup.exe', boyut: '7,1 MB', kurulum: 'office', kaynak: 'resmi' })}>
              Yükleyiciyi indir
            </button>
            <h3>2. Etkinleştirin</h3>
            <p className="small">Kurulumdan sonra Word'ü açın: Dosya › Hesap › Ürünü Etkinleştir ve 25 karakterlik ürün anahtarını girin.</p>
          </section>
        </div>
      );
    if (url === 'ubuntu.com/download/desktop')
      return (
        <div className="br-page ubuntu-site">
          <div className="br-ubuntu">
            <Logo id="ubuntu" size="1.6em" /> <b>Ubuntu</b>
          </div>
          <h1>Ubuntu Desktop indir</h1>
          <section className="br-ms-sec">
            <h3>Ubuntu 24.04.1 LTS</h3>
            <p className="small">Uzun süreli destek (LTS): Nisan 2029'a kadar güvenlik güncellemeleri. En az 4 GB RAM ve 25 GB disk alanı önerilir.</p>
            <button className="br-ubuntu-btn" onClick={() => indirBaslat({ dosya: 'ubuntu-24.04.1-desktop-amd64.iso', boyut: '5,7 GB', kurulum: '', kaynak: 'resmi' })}>
              İndir 24.04.1 LTS
            </button>
            <p className="small muted">Önyüklenebilir USB oluşturmak için Windows'ta Rufus kullanın.</p>
          </section>
        </div>
      );
    if (url === 'rufus.ie/tr')
      return (
        <div className="br-page rufus-site">
          <div className="br-rufus">
            <Logo id="rufus" size="2em" /> <b>Rufus</b>
          </div>
          <h1>Önyüklenebilir USB sürücülerini kolay bir şekilde oluşturun</h1>
          <p>Rufus; USB bellekler gibi önyüklenebilir USB flaş sürücüleri biçimlendirmeye ve oluşturmaya yardımcı olan bir araçtır.</p>
          <h3>İndir</h3>
          <table className="br-tbl">
            <tbody>
              <tr>
                <td>Rufus 4.6</td>
                <td>Standart</td>
                <td>Windows x64</td>
                <td>
                  <button className="br-blue" onClick={() => indirBaslat({ dosya: 'rufus-4.6.exe', boyut: '1,5 MB', kurulum: '', uygulama: 'rufus', kaynak: 'resmi' })}>
                    rufus-4.6.exe
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="small">Rufus kurulum gerektirmez (taşınabilir): indirdikten sonra doğrudan çalıştırılır. Yönetici izni ister.</p>
        </div>
      );
    if (url === 'www.adobe.com/tr/products/photoshop')
      return (
        <div className="br-page adobe">
          <div className="br-a">Adobe</div>
          <h1>Adobe Photoshop</h1>
          <p>Okulunuzun Adobe lisansıyla giriş yapıp Creative Cloud masaüstü uygulamasıyla Photoshop'u yükleyin.</p>
          <h4>Windows sistem gereksinimleri (en az)</h4>
          <table className="br-tbl">
            <tbody>
              <tr><td>İşlemci</td><td>SSE 4.2 destekli 64 bit Intel ya da AMD, 2 GHz+</td></tr>
              <tr><td>İşletim sistemi</td><td>Windows 10 (64 bit) 22H2 ya da Windows 11</td></tr>
              <tr><td>RAM</td><td>8 GB (16 GB önerilir)</td></tr>
              <tr><td>Ekran kartı</td><td>DirectX 12, en az 1,5 GB GPU belleği</td></tr>
              <tr><td>Disk alanı</td><td>20 GB boş alan (SSD önerilir)</td></tr>
            </tbody>
          </table>
          <button className="br-blue" onClick={() => indirBaslat({ dosya: 'Creative_Cloud_Set-Up.exe', boyut: '4,1 MB', kurulum: 'photoshop', kaynak: 'resmi' })}>
            Creative Cloud'u indir
          </button>
        </div>
      );
    return <div className="br-page"><h2>Bu sayfaya ulaşılamıyor</h2><p className="small">{url} adresinin sunucu IP adresi bulunamadı.</p></div>;
  }

  return (
    <div className={'br' + (ctx.chrome ? ' chrome' : '')}>
      <div className="br-top">
        <button onClick={() => git('yeni')} aria-label="Ana sayfa">
          ⌂
        </button>
        <form onSubmit={adresGit} className="br-addr">
          <span className={SAHTE[url] ? 'lock bad' : 'lock'}>{SAHTE[url] ? '⚠' : '🔒'}</span>
          <input value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="Arayın veya web adresi girin" aria-label="Adres çubuğu" />
        </form>
        <button onClick={() => setPanel((p) => !p)} aria-label="İndirilenler">
          ⬇
        </button>
      </div>
      <div className="br-body">{sayfa()}</div>
      {panel && (
        <div className="br-dl">
          <b>İndirilenler</b>
          {indir.length === 0 && <p className="small">Henüz indirme yok.</p>}
          {indir.map((d) => (
            <div key={d} className="br-dl-item">
              <span>⚙ {d}</span>
              <button className="ws-link" onClick={() => ac(d)} disabled={!pc.fs[`${INDIRILEN}/${d}`]}>
                Dosyayı aç
              </button>
            </div>
          ))}
        </div>
      )}
      {uyari && (
        <div className="br-dl warn">
          <b>⚠ {uyari.dosya} yaygın olarak indirilmiyor.</b>
          <p className="small">Microsoft Defender SmartScreen: Açmadan önce {uyari.dosya} dosyasına güvendiğinizden emin olun.</p>
          <div className="row">
            <button
              className="ws-btn primary"
              onClick={() => {
                ctx.log('smartscreen.sil', { dosya: uyari.dosya });
                setUyari(null);
              }}
            >
              Sil
            </button>
            <button
              className="ws-btn"
              onClick={() => {
                ctx.log('smartscreen.tut', { dosya: uyari.dosya });
                indirmeyiKaydet(uyari);
                setUyari(null);
              }}
            >
              Yine de tut
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
