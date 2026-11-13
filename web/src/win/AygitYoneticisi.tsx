// Aygıt Yöneticisi: kategoriler, sorunlu aygıtlar (sarı ünlem), özellikler ve sürücü güncelleştirme sihirbazı.
import { useState } from 'react';
import type { AppCtx } from './Masaustu';

function durumMetni(a: { durum: string; cakisan?: string; sorunluSurucu?: boolean; ad: string }, ) {
  if (a.durum === 'devre-disi') return 'Bu aygıt devre dışı. (Kod 22)';
  if (a.durum === 'surucu-yok') return 'Bu aygıtın sürücüleri yüklenmedi. (Kod 28)\nBu aygıt için uyumlu sürücü yok.';
  if (a.durum === 'cakisma') return `Bu aygıt kullanabileceği yeterli boş kaynak bulamıyor. (Kod 12)\nBu aygıtı kullanmak istiyorsanız, bu sistemdeki diğer aygıtlardan birini devre dışı bırakmanız gerekecek. Çakışan kaynak: IRQ 17 (${a.cakisan === 'ses' ? 'Realtek High Definition Audio' : (a.cakisan ?? 'başka bir aygıt')}).`;
  if (a.sorunluSurucu) return 'Bu aygıt düzgün çalışıyor.\nNot: Bu aygıtın sürücüsü yakın zamanda güncelleştirildi.';
  return 'Bu aygıt düzgün çalışıyor.';
}

export default function AygitYoneticisi(ctx: AppCtx) {
  const { pc, act } = ctx;
  const [sec, setSec] = useState<string | null>(null);
  const [ozellik, setOzellik] = useState<string | null>(null);
  const [sihirbaz, setSihirbaz] = useState<'secim' | 'gozat' | 'sonuc' | null>(null);
  const [sonuc, setSonuc] = useState<{ ok: boolean; metin: string } | null>(null);
  const [onay, setOnay] = useState(false);
  const [kapali, setKapali] = useState<Record<string, boolean>>({});
  const kategoriler = Array.from(new Set(pc.aygitlar.map((a) => (a.durum === 'surucu-yok' && !a.kategori.startsWith('Diğer') ? 'Diğer aygıtlar' : a.kategori)))).sort((a, b) => a.localeCompare(b, 'tr'));
  const katOf = (a: (typeof pc.aygitlar)[number]) => (a.durum === 'surucu-yok' ? 'Diğer aygıtlar' : a.kategori);
  const ay = pc.aygitlar.find((a) => a.id === ozellik);
  const lanOk = pc.aygitlar.find((a) => a.id === 'lan')?.durum === 'ok';

  const kur = (ok: boolean, kaynak: string) => {
    if (!ay) return;
    if (ok) {
      // Olay türü aygıta özel: sıralama kuralları (önce yonga seti) için
      act('surucu.' + ay.id, { aygit: ay.id, kaynak }, (p) => {
        const x = p.aygitlar.find((q) => q.id === ay.id)!;
        x.durum = 'ok';
        return p;
      });
      setSonuc({ ok: true, metin: `Windows sürücülerinizi başarıyla güncelleştirdi: ${ay.ad}` });
    } else {
      ctx.log('surucu.bulunamadi', { aygit: ay.id, kaynak });
      setSonuc({ ok: false, metin: kaynak === 'otomatik' ? 'İnternet bağlantısı yok. Windows, çevrimiçi sürücü araması yapamadı.' : 'Windows, aygıtınız için sürücü yazılımı buldu ancak yüklemeye çalışırken bir sorunla karşılaştı: Bu klasör bu aygıt için uygun sürücüyü içermiyor.' }); // eslint-disable-line
    }
    setSihirbaz('sonuc');
  };

  return (
    <div className="dm">
      <div className="dm-toolbar">Dosya · Eylem · Görünüm · Yardım</div>
      <div className="dm-tree">
        <div className="dm-root">🖥 {pc.cihaz.ad}</div>
        {kategoriler.map((k) => {
          const list = pc.aygitlar.filter((a) => katOf(a) === k);
          const acik = !kapali[k] || list.some((a) => a.durum !== 'ok');
          return (
            <div key={k} className="dm-cat">
              <button className="dm-k" onClick={() => setKapali({ ...kapali, [k]: acik })}>
                {acik ? '⌄' : '›'} {k}
              </button>
              {acik &&
                list.map((a) => (
                  <button key={a.id} className={'dm-dev' + (sec === a.id ? ' on' : '')} onClick={() => setSec(a.id)} onDoubleClick={() => (setOzellik(a.id), setSihirbaz(null), setOnay(false))}>
                    {a.durum === 'surucu-yok' || a.durum === 'cakisma' ? <i className="warn">⚠</i> : a.durum === 'devre-disi' ? <i>⬇</i> : <i>▫</i>}
                    {a.durum === 'surucu-yok' ? (a.bilinmeyenAd ?? a.ad) : a.ad}
                  </button>
                ))}
            </div>
          );
        })}
      </div>
      <div className="dm-foot small muted">İpucu: bir aygıta çift tıklayarak özelliklerini açın.</div>
      {ay && (
        <div className="ws-modal">
          <div className="ws-dlg dm-props">
            <div className="ws-h">{ay.durum === 'surucu-yok' ? (ay.bilinmeyenAd ?? ay.ad) : ay.ad} Özellikleri</div>
            {!sihirbaz && (
              <>
                <div className="dm-status">
                  <b>Aygıt durumu</b>
                  <p>{durumMetni(ay)}</p>
                </div>
                <dl className="dm-kv small">
                  <dt>Sürücü sürümü</dt>
                  <dd>{ay.durum === 'surucu-yok' ? 'Yok' : (ay.surucuSurum ?? '10.0.26100.1')}</dd>
                </dl>
                {onay && (
                  <div className="dm-onay">
                    <p>⚠ Bu aygıtın devre dışı bırakılması, çalışmasının durmasına neden olur. Gerçekten devre dışı bırakmak istiyor musunuz?</p>
                    <button
                      className="ws-btn primary"
                      onClick={() => {
                        setOnay(false);
                        act('aygit.devre-disi', { aygit: ay.id }, (p) => ((p.aygitlar.find((q) => q.id === ay.id)!.durum = 'devre-disi'), p));
                      }}
                    >
                      Evet
                    </button>
                    <button className="ws-btn" onClick={() => setOnay(false)}>
                      Hayır
                    </button>
                  </div>
                )}
                <div className="ws-foot">
                  {ay.durum !== 'devre-disi' && (
                    <button className="ws-btn primary" onClick={() => setSihirbaz('secim')}>
                      Sürücüyü güncelleştir
                    </button>
                  )}
                  <button
                    className="ws-btn"
                    disabled={!ay.oncekiSurucu}
                    title={ay.oncekiSurucu ? `Önceki sürüm: ${ay.oncekiSurucu}` : 'Bu aygıt için önceki sürücü yok'}
                    onClick={() => {
                      act('surucu.geri-al', { aygit: ay.id }, (p) => {
                        const x = p.aygitlar.find((q) => q.id === ay.id)!;
                        x.surucuSurum = x.oncekiSurucu;
                        x.oncekiSurucu = undefined;
                        x.sorunluSurucu = false;
                        return p;
                      });
                    }}
                  >
                    Sürücüyü Geri Al
                  </button>
                  {ay.durum === 'devre-disi' ? (
                    <button className="ws-btn" onClick={() => act('aygit.etkinlestir', { aygit: ay.id }, (p) => ((p.aygitlar.find((q) => q.id === ay.id)!.durum = 'ok'), p))}>
                      Aygıtı etkinleştir
                    </button>
                  ) : (
                    <button
                      className="ws-btn"
                      onClick={() => setOnay(true)}
                    >
                      Aygıtı devre dışı bırak
                    </button>
                  )}
                  <button className="ws-btn" onClick={() => setOzellik(null)}>
                    Kapat
                  </button>
                </div>
              </>
            )}
            {sihirbaz === 'secim' && (
              <>
                <p>Sürücüleri nasıl aramak istiyorsunuz?</p>
                <button className="dm-choice" onClick={() => kur(lanOk, 'otomatik')}>
                  → <b>Sürücüleri otomatik olarak ara</b>
                  <small>Windows, bilgisayarınızda ve internette en iyi sürücüyü arar.</small>
                </button>
                <button className="dm-choice" onClick={() => setSihirbaz('gozat')}>
                  → <b>Sürücüler için bilgisayarıma gözat</b>
                  <small>Sürücü yazılımını el ile bulun ve yükleyin.</small>
                </button>
                <div className="ws-foot">
                  <button className="ws-btn" onClick={() => setSihirbaz(null)}>
                    İptal
                  </button>
                </div>
              </>
            )}
            {sihirbaz === 'gozat' && (
              <>
                <p>Sürücü yazılımının bulunduğu klasörü seçin:</p>
                {(ctx.veri.surucuKlasorleri ?? []).map((k) => (
                  <button key={k.id} className="dm-choice" onClick={() => kur(k.id === ay.surucu, k.id)}>
                    📁 {k.ad}
                  </button>
                ))}
                <div className="ws-foot">
                  <button className="ws-btn" onClick={() => setSihirbaz('secim')}>
                    Geri
                  </button>
                </div>
              </>
            )}
            {sihirbaz === 'sonuc' && sonuc && (
              <>
                <p className={sonuc.ok ? 'ok-text' : 'err-text'}>{sonuc.metin}</p>
                <div className="ws-foot">
                  <button className="ws-btn primary" onClick={() => (setOzellik(null), setSihirbaz(null), setSonuc(null))}>
                    Kapat
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
