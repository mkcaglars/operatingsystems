// Windows 11 Ayarlar uygulaması (sadeleştirilmiş, gerçek menü yapısına uygun).
import { useState, type ReactNode } from 'react';
import { programDosyalari, sifirla } from '../core/winpc';
import { Toggle, type AppCtx } from './Masaustu';
import Logo, { uygulamaLogo } from '../components/Logo';
import { duvarArkaPlan } from '../components/Photo';

type Sayfa =
  | 'sistem' | 'ekran' | 'guc' | 'hakkinda' | 'kurtarma'
  | 'cihazlar' | 'fare'
  | 'kisisel' | 'arkaplan' | 'renkler'
  | 'uygulamalar' | 'yuklu' | 'varsayilan' | 'varsayilan-app' | 'baslangic'
  | 'hesaplar' | 'digerleri'
  | 'erisim' | 'metin' | 'isaretci' | 'kontrast'
  | 'gizlilik' | 'update';

const NAV: [Sayfa, string, string][] = [
  ['sistem', 'Sistem', '🖥'],
  ['cihazlar', 'Bluetooth ve cihazlar', '🖱'],
  ['kisisel', 'Kişiselleştirme', '🖌'],
  ['uygulamalar', 'Uygulamalar', '▦'],
  ['hesaplar', 'Hesaplar', '👤'],
  ['erisim', 'Erişilebilirlik', '♿'],
  ['gizlilik', 'Gizlilik ve güvenlik', '🛡'],
  ['update', 'Windows Update', '⟳'],
];

const KOK: Record<Sayfa, Sayfa> = {
  sistem: 'sistem', ekran: 'sistem', guc: 'sistem', hakkinda: 'sistem', kurtarma: 'sistem',
  cihazlar: 'cihazlar', fare: 'cihazlar',
  kisisel: 'kisisel', arkaplan: 'kisisel', renkler: 'kisisel',
  uygulamalar: 'uygulamalar', yuklu: 'uygulamalar', varsayilan: 'uygulamalar', 'varsayilan-app': 'uygulamalar', baslangic: 'uygulamalar',
  hesaplar: 'hesaplar', digerleri: 'hesaplar',
  erisim: 'erisim', metin: 'erisim', isaretci: 'erisim', kontrast: 'erisim',
  gizlilik: 'gizlilik', update: 'update',
};

const SURE = [
  [1, '1 dakika'], [3, '3 dakika'], [5, '5 dakika'], [10, '10 dakika'], [15, '15 dakika'], [30, '30 dakika'], [60, '1 saat'], [0, 'Hiçbir zaman'],
] as const;

function Row({ t, d, children, onClick }: { t: string; d?: string; children?: ReactNode; onClick?: () => void }) {
  return (
    <div className={'s-row' + (onClick ? ' link' : '')} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div>
        <b>{t}</b>
        {d && <small>{d}</small>}
      </div>
      <div className="s-ctl">{children ?? (onClick ? '›' : null)}</div>
    </div>
  );
}

export default function Ayarlar(ctx: AppCtx) {
  const { pc, act } = ctx;
  const [sayfa, setSayfa] = useState<Sayfa>((ctx.arg as Sayfa) || 'sistem');
  const [vApp, setVApp] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [dlg, setDlg] = useState<{ t: 'tur' | 'kaldir' | 'onar'; id: string } | null>(null);
  const [metin, setMetin] = useState(pc.ekran.metin);
  const [mesaj, setMesaj] = useState('');
  const [sf, setSf] = useState<{ adim: 'secim' | 'kaynak' | 'onay'; secenek: 'koru' | 'hepsi'; kaynak: 'bulut' | 'yerel' } | null>(null);
  const git = (s: Sayfa) => {
    setSayfa(s);
    setMesaj('');
    ctx.log('ayarlar.sayfa', { sayfa: s });
  };

  const baslik: Record<Sayfa, string> = {
    sistem: 'Sistem', ekran: 'Sistem  ›  Ekran', guc: 'Sistem  ›  Güç', hakkinda: 'Sistem  ›  Hakkında', kurtarma: 'Sistem  ›  Kurtarma',
    cihazlar: 'Bluetooth ve cihazlar', fare: 'Bluetooth ve cihazlar  ›  Fare',
    kisisel: 'Kişiselleştirme', arkaplan: 'Kişiselleştirme  ›  Arka plan', renkler: 'Kişiselleştirme  ›  Renkler',
    uygulamalar: 'Uygulamalar', yuklu: 'Uygulamalar  ›  Yüklü uygulamalar', varsayilan: 'Uygulamalar  ›  Varsayılan uygulamalar', 'varsayilan-app': 'Uygulamalar  ›  Varsayılan uygulamalar', baslangic: 'Uygulamalar  ›  Başlangıç',
    hesaplar: 'Hesaplar', digerleri: 'Hesaplar  ›  Diğer kullanıcılar',
    erisim: 'Erişilebilirlik', metin: 'Erişilebilirlik  ›  Metin boyutu', isaretci: 'Erişilebilirlik  ›  Fare işaretçisi ve dokunma', kontrast: 'Erişilebilirlik  ›  Kontrast temaları',
    gizlilik: 'Gizlilik ve güvenlik', update: 'Windows Update',
  };

  function icerik() {
    switch (sayfa) {
      case 'sistem':
        return (
          <>
            <Row t="Ekran" d="Monitörler, parlaklık, gece ışığı, ölçek" onClick={() => git('ekran')} />
            <Row t="Güç" d="Uyku, pil kullanımı, ekranı kapatma" onClick={() => git('guc')} />
            <Row t="Kurtarma" d="Sıfırlama, gelişmiş başlangıç, geri dön" onClick={() => git('kurtarma')} />
            <Row t="Hakkında" d="Cihaz özellikleri, bilgisayarı yeniden adlandır, Windows belirtimleri" onClick={() => git('hakkinda')} />
          </>
        );
      case 'ekran':
        return (
          <>
            <Row t="Ölçek" d="Metin, uygulama ve diğer öğelerin boyutunu değiştirin">
              <select value={pc.ekran.olcek} onChange={(e) => act('ekran.olcek', { deger: Number(e.target.value) }, (p) => ((p.ekran.olcek = Number(e.target.value)), p))} aria-label="Ölçek">
                {[100, 125, 150, 175].map((v) => (
                  <option key={v} value={v}>
                    %{v}
                    {v === 100 ? ' (Önerilen)' : ''}
                  </option>
                ))}
              </select>
            </Row>
            <Row t="Ekran çözünürlüğü" d="Bağlı ekrana uyacak şekilde çözünürlüğü ayarlayın">
              <select value={pc.ekran.cozunurluk} onChange={(e) => act('ekran.cozunurluk', { deger: e.target.value }, (p) => ((p.ekran.cozunurluk = e.target.value), p))} aria-label="Ekran çözünürlüğü">
                {['1920 × 1080 (Önerilen)', '1600 × 900', '1366 × 768', '1280 × 720'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Row>
          </>
        );
      case 'guc':
        return (
          <>
            <div className="s-group">Ekran ve uyku</div>
            <Row t="Prize takılıyken ekranımı kapat:">
              <select value={pc.guc.ekranKapat} onChange={(e) => act('guc.ekran', { deger: Number(e.target.value) }, (p) => ((p.guc.ekranKapat = Number(e.target.value)), p))} aria-label="Ekranı kapat">
                {SURE.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Row>
            <Row t="Prize takılıyken cihazımı uyku moduna geçir:">
              <select value={pc.guc.uyku} onChange={(e) => act('guc.uyku', { deger: Number(e.target.value) }, (p) => ((p.guc.uyku = Number(e.target.value)), p))} aria-label="Uyku">
                {SURE.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Row>
          </>
        );
      case 'hakkinda':
        return (
          <>
            <div className="s-card">
              <div className="s-group">Cihaz özellikleri</div>
              <dl className="s-kv">
                <dt>Cihaz adı</dt>
                <dd>{pc.cihaz.ad}</dd>
                <dt>İşlemci</dt>
                <dd>{pc.cihaz.islemci}</dd>
                <dt>Yüklü RAM</dt>
                <dd>{pc.cihaz.ram}</dd>
                <dt>Depolama</dt>
                <dd>{pc.cihaz.depolama}</dd>
                <dt>Grafik kartı</dt>
                <dd>{pc.cihaz.ekranKarti}</dd>
                <dt>Sistem türü</dt>
                <dd>{pc.cihaz.sistemTuru}</dd>
              </dl>
              <div className="s-links">
                <button className="ws-link" onClick={() => ctx.open('sistemkoruma')}>
                  Sistem koruması
                </button>
                <button className="ws-link" onClick={() => ctx.open('aygit')}>
                  Aygıt Yöneticisi
                </button>
              </div>
            </div>
            <div className="s-card">
              <div className="s-group">Windows belirtimleri</div>
              <dl className="s-kv">
                <dt>Sürüm</dt>
                <dd>{pc.cihaz.surum}</dd>
                <dt>Versiyon</dt>
                <dd>{pc.cihaz.yapi}</dd>
              </dl>
            </div>
          </>
        );
      case 'cihazlar':
        return <Row t="Fare" d="Düğmeler, fare işaretçisi hızı, kaydırma" onClick={() => git('fare')} />;
      case 'fare':
        return (
          <>
            <Row t="Birincil fare düğmesi">
              <select value={pc.fare.birincil} onChange={(e) => act('fare.birincil', { deger: e.target.value }, (p) => ((p.fare.birincil = e.target.value as 'sol' | 'sag'), p))} aria-label="Birincil fare düğmesi">
                <option value="sol">Sol</option>
                <option value="sag">Sağ</option>
              </select>
            </Row>
            <Row t="Fare işaretçisi hızı">
              <input type="range" min={1} max={20} value={pc.fare.hiz} onChange={(e) => act('fare.hiz', { deger: Number(e.target.value) }, (p) => ((p.fare.hiz = Number(e.target.value)), p))} aria-label="Fare işaretçisi hızı" />
            </Row>
            <div className="s-group">İlgili ayarlar — Ek fare ayarları (Fare Özellikleri)</div>
            <Row t="Çift tıklama hızı" d="Yavaş ↔ Hızlı. Çift tıklamada zorlanan kullanıcılar için yavaşlatın.">
              <input type="range" min={1} max={10} value={pc.fare.ciftTik} onChange={(e) => act('fare.ciftTik', { deger: Number(e.target.value) }, (p) => ((p.fare.ciftTik = Number(e.target.value)), p))} aria-label="Çift tıklama hızı" />
              <span className="s-val">{pc.fare.ciftTik}</span>
            </Row>
          </>
        );
      case 'kisisel':
        return (
          <>
            <Row t="Arka plan" d="Arka plan resmi, renk, slayt gösterisi" onClick={() => git('arkaplan')} />
            <Row t="Renkler" d="Vurgu rengi, saydamlık efektleri, renk teması" onClick={() => git('renkler')} />
          </>
        );
      case 'arkaplan':
        return (
          <>
            <div className="s-group">Son resimler</div>
            <div className="s-thumbs">
              {(
                [
                  ['bloom', 'Windows (çiçek)'],
                  ['girne', 'Girne Limanı'],
                  ['karpaz', 'Karpaz sahili'],
                  ['soyut', 'Soyut'],
                ] as const
              ).map(([id, ad]) => (
                <button key={id} className={'thumb t-' + id + (pc.ekran.arkaPlan === id ? ' on' : '')} style={{ background: duvarArkaPlan(id) }} onClick={() => act('kisisel.arkaplan', { deger: id }, (p) => ((p.ekran.arkaPlan = id), p))} aria-label={ad} title={ad}>
                  <span>{ad}</span>
                </button>
              ))}
            </div>
          </>
        );
      case 'renkler':
        return (
          <Row t="Modunuzu seçin" d="Windows'ta ve uygulamalarınızda görünen renkleri değiştirin">
            <select value={pc.ekran.tema} onChange={(e) => act('kisisel.tema', { deger: e.target.value }, (p) => ((p.ekran.tema = e.target.value as 'acik' | 'koyu'), p))} aria-label="Mod">
              <option value="acik">Açık</option>
              <option value="koyu">Koyu</option>
            </select>
          </Row>
        );
      case 'uygulamalar':
        return (
          <>
            <Row t="Yüklü uygulamalar" d="Kaldırma ve değiştirme" onClick={() => git('yuklu')} />
            <Row t="Varsayılan uygulamalar" d="Dosya ve bağlantı türleri için varsayılanlar" onClick={() => git('varsayilan')} />
            <Row t="Başlangıç" d="Oturum açtığınızda otomatik başlayan uygulamalar" onClick={() => git('baslangic')} />
          </>
        );
      case 'yuklu':
        return (
          <>
            <p className="small">{pc.uygulamalar.length} uygulama bulundu</p>
            {pc.uygulamalar.map((u) => (
              <div key={u.id} className="s-row">
                <Logo id={uygulamaLogo(u.id)} size="2em" />
                <div className="s-row-ad">
                  <b>{u.ad}</b>
                  <small>
                    {u.surum} · {u.yayinci} · {u.boyutMB >= 1000 ? (u.boyutMB / 1000).toFixed(1).replace('.', ',') + ' GB' : u.boyutMB + ' MB'}
                  </small>
                </div>
                <div className="s-ctl rel">
                  <button className="s-more" onClick={() => setMenu(menu === u.id ? null : u.id)} aria-label={`${u.ad} seçenekleri`}>
                    ⋯
                  </button>
                  {menu === u.id && (
                    <div className="s-menu">
                      {u.id === 'office' && <button onClick={() => (setDlg({ t: 'onar', id: u.id }), setMenu(null))}>Değiştir</button>}
                      <button onClick={() => (setDlg({ t: 'kaldir', id: u.id }), setMenu(null))}>Kaldır</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        );
      case 'varsayilan':
        return (
          <>
            <div className="s-group">Uygulamalar için varsayılanları ayarlayın</div>
            {pc.uygulamalar
              .filter((u) => ['edge', 'chrome', 'acrobat'].includes(u.id))
              .map((u) => (
                <Row key={u.id} t={u.ad} d={u.id === 'acrobat' ? '.pdf' : '.htm, .html, HTTP, HTTPS'} onClick={() => (setVApp(u.id), git('varsayilan-app'))} />
              ))}
          </>
        );
      case 'varsayilan-app': {
        const u = pc.uygulamalar.find((x) => x.id === vApp);
        if (!u) return null;
        const tur = u.id === 'acrobat' ? 'pdf' : 'tarayici';
        const su = pc.varsayilan[tur] === u.id;
        return (
          <div className="s-card">
            <b>{u.ad}</b>
            <p className="small">{su ? `${u.ad} şu anda varsayılan ${tur === 'pdf' ? 'PDF uygulamanız' : 'tarayıcınız'}.` : `${u.ad} uygulamasını varsayılan ${tur === 'pdf' ? 'PDF uygulamanız' : 'tarayıcınız'} yapın.`}</p>
            <button className="ws-btn primary" disabled={su} onClick={() => act('varsayilan.ayarla', { tur, uygulama: u.id }, (p) => ((p.varsayilan[tur] = u.id), p))}>
              Varsayılan olarak ayarla
            </button>
          </div>
        );
      }
      case 'baslangic':
        return (
          <>
            <p className="small">Uygulamaları, oturum açtığınızda başlayacak şekilde yapılandırın. Çoğu durumda, uygulamalar simge durumunda başlar.</p>
            {pc.baslangic.map((b) => (
              <Row key={b.id} t={b.ad} d={`${b.yayinci} · ${b.etki} etki`}>
                <Toggle on={b.acik} label={b.ad} onChange={(v) => act('baslangic.ayarla', { uygulama: b.id, acik: v }, (p) => ((p.baslangic.find((x) => x.id === b.id)!.acik = v), p))} />
              </Row>
            ))}
          </>
        );
      case 'hesaplar':
        return <Row t="Diğer kullanıcılar" d="Cihaz erişimi, iş veya okul kullanıcıları" onClick={() => git('digerleri')} />;
      case 'digerleri':
        return (
          <>
            {pc.hesaplar.map((h) => (
              <div key={h.ad} className="s-row">
                <div>
                  <b>👤 {h.ad}</b>
                  <small>
                    {h.tur === 'yonetici' ? 'Yönetici' : 'Standart kullanıcı'} · Yerel hesap{h.ad === pc.cihaz.kullanici ? ' (siz)' : ''}
                  </small>
                </div>
                <div className="s-ctl">
                  <button className="ws-btn" onClick={() => setDlg({ t: 'tur', id: h.ad })}>
                    Hesap türünü değiştir
                  </button>
                </div>
              </div>
            ))}
          </>
        );
      case 'erisim':
        return (
          <>
            <Row t="Metin boyutu" d="Windows genelindeki metin boyutu" onClick={() => git('metin')} />
            <Row t="Fare işaretçisi ve dokunma" d="İşaretçi rengi ve boyutu" onClick={() => git('isaretci')} />
            <Row t="Kontrast temaları" d="Az görenler ve ışığa duyarlılar için renk temaları" onClick={() => git('kontrast')} />
          </>
        );
      case 'metin':
        return (
          <div className="s-card">
            <div className="s-preview" style={{ fontSize: `${metin / 100}em` }}>
              Metin boyutu önizlemesi
            </div>
            <Row t="Metin boyutu">
              <input type="range" min={100} max={225} step={5} value={metin} onChange={(e) => setMetin(Number(e.target.value))} aria-label="Metin boyutu" />
              <span className="s-val">%{metin}</span>
              <button className="ws-btn primary" onClick={() => act('erisim.metin', { deger: metin }, (p) => ((p.ekran.metin = metin), p))}>
                Uygula
              </button>
            </Row>
          </div>
        );
      case 'isaretci':
        return (
          <Row t="Boyut" d="Fare işaretçisinin boyutu (1–15)">
            <input type="range" min={1} max={15} value={pc.ekran.imlec} onChange={(e) => act('erisim.imlec', { deger: Number(e.target.value) }, (p) => ((p.ekran.imlec = Number(e.target.value)), p))} aria-label="İşaretçi boyutu" />
            <span className="s-val">{pc.ekran.imlec}</span>
          </Row>
        );
      case 'kontrast':
        return (
          <Row t="Kontrast temaları">
            <select value={pc.ekran.kontrast ? 'gece' : 'yok'} onChange={(e) => act('erisim.kontrast', { deger: e.target.value !== 'yok' }, (p) => ((p.ekran.kontrast = e.target.value !== 'yok'), p))} aria-label="Kontrast teması">
              <option value="yok">Yok</option>
              <option value="su">Su</option>
              <option value="col">Çöl</option>
              <option value="gece">Gece gökyüzü</option>
            </select>
          </Row>
        );
      case 'kurtarma':
        return (
          <>
            <div className="s-group">Kurtarma seçenekleri</div>
            <Row t="Bu bilgisayarı sıfırla" d="Kişisel dosyalarınızı tutmayı veya kaldırmayı seçin, ardından Windows'u yeniden yükleyin">
              <button className="ws-btn" onClick={() => (setSf({ adim: 'secim', secenek: 'koru', kaynak: 'yerel' }), ctx.log('sifirla.basla', {}))}>
                Bilgisayarı sıfırla
              </button>
            </Row>
            <Row t="Gelişmiş başlangıç" d="Cihaz veya disk (USB sürücüsü ya da DVD gibi) ile başlatma, Windows başlangıç ayarlarını değiştirme ya da Windows'u bir sistem görüntüsünden geri yükleme">
              <button className="ws-btn" onClick={() => act('kurtarma.gelismis-baslangic', {}, (p) => ((p.acilis = 'kurtarma'), p))}>
                Şimdi yeniden başlat
              </button>
            </Row>
          </>
        );
      case 'gizlilik':
        return <Row t="Windows Güvenliği" d="Virüsten koruma, tarayıcı, güvenlik duvarı ve ağ koruması" onClick={() => ctx.open('guvenlik')} />;
      case 'update':
        return (
          <div className="s-card">
            <b>{mesaj || (pc.guvenlik.tanimlarGuncel ? 'Güncelsiniz' : 'Güncelleştirmeler mevcut')}</b>
            <p className="small">Son denetim: bugün, 08:12</p>
            <button
              className="ws-btn primary"
              onClick={() => {
                if (!pc.internet) {
                  ctx.log('update.baglanti-yok', {});
                  setMesaj('Güncelleştirmeler denetlenemedi. İnternet bağlantınızı denetleyin. (0x8024402c)');
                  return;
                }
                // Windows Update, internet varsa eksik aygıt sürücülerini de yükler
                const surucu = pc.aygitlar.filter((a) => a.durum === 'surucu-yok' && a.surucu);
                act('update.denetle', { surucu: surucu.map((a) => a.id) }, (p) => {
                  p.guvenlik.tanimlarGuncel = true;
                  for (const a of p.aygitlar) if (a.durum === 'surucu-yok' && a.surucu) a.durum = 'ok';
                  return p;
                });
                setMesaj(
                  'Güncelleştirmeler yüklendi: Microsoft Defender Antivirus için güvenlik bilgileri güncelleştirmesi' +
                    (surucu.length ? ' · Sürücüler: ' + surucu.map((a) => a.ad).join(', ') : ''),
                );
              }}
            >
              Güncelleştirmeleri denetle
            </button>
          </div>
        );
    }
  }

  const dlgUyg = dlg ? pc.uygulamalar.find((u) => u.id === dlg.id) : null;
  return (
    <div className="settings-app">
      <nav className="s-nav">
        <div className="s-user">
          <span>👤</span>
          <div>
            <b>{pc.cihaz.kullanici}</b>
            <small>Yerel hesap</small>
          </div>
        </div>
        {NAV.map(([id, ad, ik]) => (
          <button key={id} className={KOK[sayfa] === id ? 'on' : ''} onClick={() => git(id)}>
            <i>{ik}</i>
            {ad}
          </button>
        ))}
      </nav>
      <main className="s-main">
        <h2>{baslik[sayfa]}</h2>
        {icerik()}
      </main>
      {sf && (
        <div className="ws-modal">
          <div className="ws-dlg sf-dlg">
            <div className="ws-h">Bu bilgisayarı sıfırla</div>
            {sf.adim === 'secim' && (
              <>
                <b>Bir seçenek belirleyin</b>
                <button className="dm-choice" onClick={() => setSf({ ...sf, adim: 'kaynak', secenek: 'koru' })}>
                  <b>Dosyalarımı koru</b>
                  <small>Uygulamaları ve ayarları kaldırır, ancak kişisel dosyalarınızı tutar.</small>
                </button>
                <button className="dm-choice" onClick={() => setSf({ ...sf, adim: 'kaynak', secenek: 'hepsi' })}>
                  <b>Her şeyi kaldır</b>
                  <small>Kişisel dosyalarınızın, uygulamalarınızın ve ayarlarınızın tümünü kaldırır.</small>
                </button>
                <div className="ws-foot">
                  <button className="ws-btn" onClick={() => setSf(null)}>
                    İptal
                  </button>
                </div>
              </>
            )}
            {sf.adim === 'kaynak' && (
              <>
                <b>Windows'u nasıl yeniden yüklemek istersiniz?</b>
                <button className="dm-choice" onClick={() => setSf({ ...sf, adim: 'onay', kaynak: 'bulut' })}>
                  <b>Bulut indirmesi</b>
                  <small>Windows'u indirin ve yeniden yükleyin (4 GB'tan fazla veri kullanabilir).</small>
                </button>
                <button className="dm-choice" onClick={() => setSf({ ...sf, adim: 'onay', kaynak: 'yerel' })}>
                  <b>Yerel olarak yeniden yükle</b>
                  <small>Windows'u bu cihazdan yeniden yükleyin.</small>
                </button>
                <div className="ws-foot">
                  <button className="ws-btn" onClick={() => setSf({ ...sf, adim: 'secim' })}>
                    Geri
                  </button>
                </div>
              </>
            )}
            {sf.adim === 'onay' && (
              <>
                <b>Bu bilgisayarı sıfırlamaya hazır</b>
                <p className="small">Sıfırlama işlemi şunları yapacak:</p>
                <ul className="small">
                  {sf.secenek === 'hepsi' && <li>Bu bilgisayardaki tüm kişisel dosyaları ve kullanıcı hesaplarını kaldırır</li>}
                  <li>Tüm uygulamaları ve programları kaldırır</li>
                  <li>Ayarları varsayılan değerlerine döndürür</li>
                  <li>Windows'u {sf.kaynak === 'bulut' ? 'buluttan indirerek' : 'bu cihazdan'} yeniden yükler</li>
                  {sf.secenek === 'koru' && <li>Kişisel dosyalarınızı tutar</li>}
                </ul>
                <p className="small muted">Diğer sürücülerdeki (D:, USB bellek) dosyalar etkilenmez. Bu işlem geri alınamaz.</p>
                {sf.kaynak === 'bulut' && !pc.internet && <p className="err-text small">Bulut indirmesi için internet bağlantısı gerekir.</p>}
                <div className="ws-foot">
                  <button
                    className="ws-btn primary"
                    disabled={sf.kaynak === 'bulut' && !pc.internet}
                    onClick={() => {
                      const { secenek, kaynak } = sf;
                      setSf(null);
                      act('sifirla', { secenek, kaynak }, (p) => sifirla(p, secenek));
                      ctx.close('ayarlar');
                    }}
                  >
                    Sıfırla
                  </button>
                  <button className="ws-btn" onClick={() => setSf(null)}>
                    İptal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {dlg && (
        <div className="ws-modal">
          <div className="ws-dlg">
            {dlg.t === 'tur' && (
              <>
                <div className="ws-h">Hesap türünü değiştir</div>
                <p>👤 {dlg.id}</p>
                <select
                  defaultValue={pc.hesaplar.find((h) => h.ad === dlg.id)?.tur}
                  id="hesap-turu"
                  aria-label="Hesap türü"
                >
                  <option value="yonetici">Yönetici</option>
                  <option value="standart">Standart kullanıcı</option>
                </select>
                <div className="ws-foot">
                  <button
                    className="ws-btn primary"
                    onClick={() => {
                      const v = (document.getElementById('hesap-turu') as HTMLSelectElement).value as 'yonetici' | 'standart';
                      const yoneticiKalir = pc.hesaplar.some((h) => h.ad !== dlg.id && h.tur === 'yonetici') || v === 'yonetici';
                      if (!yoneticiKalir) return alert('Bilgisayarda en az bir yönetici hesabı kalmalıdır.');
                      act('hesap.tur', { hesap: dlg.id, tur: v }, (p) => ((p.hesaplar.find((h) => h.ad === dlg.id)!.tur = v), p));
                      setDlg(null);
                    }}
                  >
                    Tamam
                  </button>
                  <button className="ws-btn" onClick={() => setDlg(null)}>
                    İptal
                  </button>
                </div>
              </>
            )}
            {dlg.t === 'kaldir' && dlgUyg && (
              <>
                <div className="ws-h">Kaldır</div>
                <p>Bu uygulama ve ilgili bilgileri kaldırılacak: {dlgUyg.ad}</p>
                <div className="ws-foot">
                  <button
                    className="ws-btn primary"
                    onClick={() => {
                      setDlg(null);
                      ctx.uac(`${dlgUyg.ad} Kaldırıcı`, dlgUyg.yayinci, () =>
                        act('uygulama.kaldir', { uygulama: dlgUyg.id }, (p) => {
                          p.uygulamalar = p.uygulamalar.filter((x) => x.id !== dlgUyg.id);
                          programDosyalari(p, dlgUyg.id, false);
                          p.baslangic = p.baslangic.filter((x) => x.id !== dlgUyg.id);
                          p.surecler = p.surecler.filter((x) => x.id !== dlgUyg.id);
                          if (p.varsayilan.tarayici === dlgUyg.id) p.varsayilan.tarayici = 'edge';
                          if (p.varsayilan.pdf === dlgUyg.id) p.varsayilan.pdf = 'edge';
                          if (['arama', 'booster'].includes(dlgUyg.id) && !p.uygulamalar.some((x) => ['arama', 'booster'].includes(x.id))) p.belirti.reklam = false;
                          return p;
                        }),
                      );
                    }}
                  >
                    Kaldır
                  </button>
                  <button className="ws-btn" onClick={() => setDlg(null)}>
                    İptal
                  </button>
                </div>
              </>
            )}
            {dlg.t === 'onar' && dlgUyg && (
              <>
                <div className="ws-h">Office programlarınızı nasıl onarmak istersiniz?</div>
                <label className="ws-radio">
                  <input type="radio" name="onar" defaultChecked value="hizli" /> Hızlı Onarım — çoğu sorunu hızla çözer, internet gerekmez
                </label>
                <label className="ws-radio">
                  <input type="radio" name="onar" value="cevrimici" /> Çevrimiçi Onarım — tüm sorunları çözer, daha uzun sürer
                </label>
                <div className="ws-foot">
                  <button
                    className="ws-btn primary"
                    onClick={() => {
                      const tur = (document.querySelector('input[name="onar"]:checked') as HTMLInputElement)?.value ?? 'hizli';
                      setDlg(null);
                      ctx.uac('Microsoft Office Tıkla Çalıştır', 'Microsoft Corporation', () => act('office.onar', { tur }, (p) => ((p.uygulamalar.find((x) => x.id === 'office')!.bozuk = false), p)));
                    }}
                  >
                    Onar
                  </button>
                  <button className="ws-btn" onClick={() => setDlg(null)}>
                    İptal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
