// Kurulan üçüncü taraf programların pencereleri: WinRAR, Excel, PowerPoint, Acrobat Reader, Photoshop ve istenmeyen programlar.
// Gerçek programların ilk açılış ekranlarına benzer; ayrıntılı işlev yoktur.
import Logo, { uygulamaLogo } from '../components/Logo';
import { adOf, children, gorunenAd, KULLANICI } from '../core/winpc';
import type { AppCtx } from './Masaustu';
import WinRar from './WinRar';
import { useState } from 'react';
import { EtkinlestirPenceresi, HesapPaneli } from './OfficeEtkinlestir';
import Excel from './Excel';

export const PROGRAM_AD: Record<string, string> = {
  winrar: 'WinRAR',
  excel: 'Excel',
  powerpoint: 'PowerPoint',
  outlook: 'Outlook',
  access: 'Access',
  publisher: 'Publisher',
  onenote: 'OneNote',
  acrobat: 'Adobe Acrobat',
  photoshop: 'Adobe Photoshop 2025',
  booster: 'PC Speed Booster',
  arama: 'Arama Asistanı Pro',
  'mcafee-scan': 'McAfee Security Scan Plus',
  'mcafee-safe': 'McAfee Safe Connect',
  teams: 'Microsoft Teams',
};

const OFFICE = ['excel', 'powerpoint', 'outlook', 'access', 'publisher', 'onenote'];

export default function Program(ctx: AppCtx) {
  const { pc } = ctx;
  // arg: "program" ya da "program|dosya yolu" (ör. "excel|C:/…/butce.xlsx")
  const [arg, dosyaYolu] = (ctx.arg ?? '').split('|');
  if (arg === 'excel') return <Excel ctx={ctx} dosya={dosyaYolu} />;
  if (arg === 'winrar') return <WinRar ctx={ctx} baslangic={dosyaYolu} />;
  if (OFFICE.includes(arg)) return <OfficeUygulama ctx={ctx} arg={arg} />;

  if (arg === 'winrar') {
    const yol = `${KULLANICI}/Belgeler`;
    return (
      <div className="pg-rar">
        <div className="pg-rar-menu">Dosya · Komutlar · Araçlar · Sık Kullanılanlar · Seçenekler · Yardım</div>
        <div className="pg-rar-tools">
          {(
            [
              ['Ekle', '📦'],
              ['Çıkart', '📂'],
              ['Sına', '✅'],
              ['Görüntüle', '👓'],
              ['Sil', '❌'],
              ['Bul', '🔍'],
              ['Sihirbaz', '🪄'],
              ['Bilgi', 'ℹ️'],
              ['Onar', '🩹'],
            ] as const
          ).map(([t, ik]) => (
            <span key={t}>
              <i className="pg-rar-ik">{ik}</i>
              {t}
            </span>
          ))}
        </div>
        <div className="pg-rar-yol">📁 {yol.replace(/\//g, '\\')}</div>
        <table className="pg-rar-list">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Boyut</th>
              <th>Tür</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>📁 ..</td>
              <td />
              <td>Dosya klasörü</td>
            </tr>
            {children(pc, yol).map((p) => (
              <tr key={p}>
                <td>
                  {pc.fs[p].tur === 'klasor' ? '📁' : '📄'} {gorunenAd(pc, p) || adOf(p)}
                </td>
                <td>{pc.fs[p].boyut ?? ''}</td>
                <td>{pc.fs[p].tur === 'klasor' ? 'Dosya klasörü' : 'Dosya'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pg-rar-durum">Değerlendirme kopyası · Lütfen bir lisans satın alın · 40 gün kaldı</div>
      </div>
    );
  }

  if (arg === 'acrobat')
    return (
      <div className="pg-acro">
        <div className="pg-acro-top">
          <Logo id="acrobat" size="1.6em" /> <b>Giriş</b> <span>Araçlar</span>
        </div>
        <main>
          <h2>Acrobat'a hoş geldiniz</h2>
          <div className="pg-acro-kart">
            <b>Bir dosya açın</b>
            <p className="small">PDF'leri görüntüleyin, yazdırın, yorum ekleyin ve imzalayın.</p>
            <span className="br-blue">Dosya seç</span>
          </div>
          <h3>Son kullanılanlar</h3>
          <p className="small muted">Henüz bir PDF açılmadı.</p>
        </main>
      </div>
    );

  if (arg === 'photoshop')
    return (
      <div className="pg-ps">
        <div className="pg-ps-top">
          <Logo id="photoshop" size="1.6em" /> Dosya Düzen Görüntü Katman Tür Seç Filtre 3B Görünüm Pencere Yardım
        </div>
        <main>
          <h2>Photoshop'a hoş geldiniz</h2>
          <div className="row">
            <span className="pg-ps-btn">Yeni dosya</span>
            <span className="pg-ps-btn ikincil">Aç</span>
          </div>
          <p className="small">Okul lisansıyla oturum açıldı · Creative Cloud</p>
        </main>
      </div>
    );

  if (arg === 'booster' || arg === 'arama')
    return (
      <div className="pg-booster">
        <Logo id="booster" size="3em" />
        <h2>{PROGRAM_AD[arg]}</h2>
        <p className="pg-kirmizi">⚠ 3.457 sorun bulundu! Bilgisayarınız tehlikede!</p>
        <p className="small">Tüm sorunları düzeltmek için PRO sürümü satın alın — yalnızca 49,99 €</p>
        <span className="pg-sahte-btn">ŞİMDİ DÜZELT</span>
        <p className="small muted">İpucu: Bu bir istenmeyen programdır (PUP). Ayarlar › Uygulamalar › Yüklü uygulamalar'dan kaldırın.</p>
      </div>
    );

  return (
    <div className="pg-genel">
      <Logo id={uygulamaLogo(arg)} size="3em" />
      <h2>{PROGRAM_AD[arg] ?? pc.uygulamalar.find((u) => u.id === arg)?.ad ?? arg}</h2>
      <p className="small muted">Program çalışıyor.</p>
    </div>
  );
}

/** Excel dışındaki Office uygulamalarının başlangıç ekranı (PowerPoint, Outlook…): Hesap ve etkinleştirme çalışır */
function OfficeUygulama({ ctx, arg }: { ctx: AppCtx; arg: string }) {
  const office = ctx.pc.uygulamalar.find((u) => u.id === 'office');
  const [sayfa, setSayfa] = useState<'giris' | 'hesap'>('giris');
  const [dlg, setDlg] = useState(false);
  const renk = arg === 'powerpoint' ? '#c43e1c' : arg === 'outlook' ? '#0f6cbd' : arg === 'access' ? '#a4373a' : arg === 'onenote' ? '#7719aa' : '#185abd';
  const bos = arg === 'powerpoint' ? 'Boş sunu' : 'Yeni';
  return (
    <div className="pg-office">
      <aside style={{ background: renk }}>
        <Logo id={uygulamaLogo(arg)} size="2.2em" />
        <b>{PROGRAM_AD[arg]}</b>
        <button className={sayfa === 'giris' ? 'on' : ''} onClick={() => setSayfa('giris')}>
          Giriş
        </button>
        <button onClick={() => setSayfa('giris')}>Yeni</button>
        <button onClick={() => setSayfa('giris')}>Aç</button>
        <button className={'alt' + (sayfa === 'hesap' ? ' on' : '')} onClick={() => setSayfa('hesap')}>
          Hesap
        </button>
      </aside>
      <main>
        {!office?.etkin && (
          <div className="pg-uyari">
            <b>ÜRÜN ETKİNLEŞTİRİLMEDİ</b> Bu ürünün çoğu özelliği devre dışı. Kullanmaya devam etmek için etkinleştirin.{' '}
            <button className="ws-btn" onClick={() => setDlg(true)}>
              Etkinleştir
            </button>
          </div>
        )}
        {sayfa === 'hesap' ? (
          <HesapPaneli ctx={ctx} etkinlestir={() => setDlg(true)} />
        ) : (
          <>
            <h2>Günaydın</h2>
            <div className="pg-sablonlar">
              <div className="pg-sablon on">
                <div className="pg-sayfa" />
                {bos}
              </div>
              <div className="pg-sablon">
                <div className="pg-sayfa cizgili" />
                Ders sunusu
              </div>
            </div>
            <h3>Son kullanılanlar</h3>
            <p className="small muted">Son kullanılan dosya yok.</p>
          </>
        )}
      </main>
      {dlg && <EtkinlestirPenceresi ctx={ctx} kapat={() => setDlg(false)} tamam={() => setSayfa('hesap')} />}
    </div>
  );
}
