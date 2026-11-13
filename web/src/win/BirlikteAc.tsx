// Windows 11 "Bu dosyayı nasıl açmak istiyorsunuz?" penceresi (Birlikte aç). Uygun uygulama yoksa Microsoft Store önerilir.
import { useState } from 'react';
import Logo from '../components/Logo';
import { acicilar, uzanti, type Acici } from '../core/dosyaIslem';
import { adOf, type WinPc } from '../core/winpc';

const NOT_DEFTERI: Acici = { id: 'notdefteri', ad: 'Not Defteri', logo: 'notdefteri' };

export default function BirlikteAc({ pc, yol, sec, store, kapat }: { pc: WinPc; yol: string; sec: (id: string, herZaman: boolean) => void; store: () => void; kapat: () => void }) {
  const uz = uzanti(yol);
  const uygun = acicilar(pc, yol);
  const diger = uygun.some((a) => a.id === 'notdefteri') ? [] : [NOT_DEFTERI];
  const [secili, setSecili] = useState<string>(uygun[0]?.id ?? '');
  const Satir = ({ a }: { a: Acici }) => (
    <button className={'ba-oge' + (secili === a.id ? ' on' : '')} onClick={() => setSecili(a.id)} onDoubleClick={() => sec(a.id, false)}>
      <Logo id={a.logo} size="1.6em" />
      {a.ad}
    </button>
  );
  return (
    <div className="ws-modal">
      <div className="ws-dlg ba" role="dialog" aria-label="Birlikte aç">
        <div className="ws-h">{uygun.length ? `Bu .${uz} dosyasını nasıl açmak istiyorsunuz?` : 'Bu dosyayı açmak için bir uygulama seçin'}</div>
        <p className="small muted">{adOf(yol)}</p>
        {uygun.length === 0 && (
          <div className="ba-yok">
            <b>Bu bilgisayarda .{uz} dosyalarını açabilecek bir uygulama bulunamadı.</b>
            <span className="small">Microsoft Store'da bir uygulama arayın ya da aşağıdaki uygulamalardan birini deneyin.</span>
          </div>
        )}
        <button className="ba-oge store" onClick={store}>
          <span className="ba-store">🛍</span>
          Microsoft Store'da uygulama ara
        </button>
        {uygun.length > 0 && <div className="ba-baslik">Önerilen uygulamalar</div>}
        {uygun.map((a) => (
          <Satir key={a.id} a={a} />
        ))}
        <div className="ba-baslik">Diğer seçenekler</div>
        {diger.map((a) => (
          <Satir key={a.id} a={a} />
        ))}
        <div className="ws-foot">
          <button className="ws-btn primary" disabled={!secili} onClick={() => sec(secili, true)}>
            Her zaman
          </button>
          <button className="ws-btn" disabled={!secili} onClick={() => sec(secili, false)}>
            Yalnızca bir kez
          </button>
          <button className="ws-btn" onClick={kapat}>
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
