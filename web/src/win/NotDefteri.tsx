// Not Defteri: metin dosyalarını açar, düzenler, kaydeder. Metin olmayan dosyalar (ör. .docx) anlamsız karakterler olarak görünür.
import { useState } from 'react';
import { uzanti } from '../core/dosyaIslem';
import { adOf, KULLANICI } from '../core/winpc';
import type { AppCtx } from './Masaustu';

const ANLAMSIZ = 'PK\u0003\u0004\u0014\u0000\u0006\u0000\b\u0000\u0000\u0000!\u0000ß¤ÒlZ\u0001\u0000\u0000 \u0005\u0000\u0000\u0013\u0000\b\u0002[Content_Types].xml ¢\u0004\u0002(\u0000\u0002\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000¬”ËNÃ0\u0010E÷HüCä-Jœ²@\b5í‚Ç\u0012*Q>Àēñ¶ÿîÃ=¦\u00172\u0010öÎ\u0019ÏÜ{\u0017®.\u0006\u0007ÐßéÌ';

export default function NotDefteri(ctx: AppCtx) {
  const { pc, act } = ctx;
  const yol = ctx.arg && pc.fs[ctx.arg] ? ctx.arg : null;
  const metinMi = !yol || ['txt', 'log', 'ini', 'inf', 'csv'].includes(uzanti(yol));
  const [metin, setMetin] = useState(() => (yol ? (metinMi ? (pc.fs[yol].icerik ?? '') : ANLAMSIZ.repeat(6)) : ''));
  const [degisti, setDegisti] = useState(false);
  const [mesaj, setMesaj] = useState('');

  const kaydet = () => {
    const hedef = yol ?? `${KULLANICI}/Belgeler/Adsız.txt`;
    const icerik = metin;
    act('notdefteri.kaydet', { dosya: hedef }, (p) => {
      p.fs[hedef] = { ...(p.fs[hedef] ?? { tur: 'dosya' }), tur: 'dosya', boyut: `${Math.max(1, Math.ceil(icerik.length / 1024))} KB`, icerik };
      return p;
    });
    setDegisti(false);
    setMesaj(`Kaydedildi: ${adOf(hedef)}`);
  };

  return (
    <div className="nd">
      <div className="nd-menu">
        <span>Dosya</span>
        <span>Düzenle</span>
        <span>Görünüm</span>
        <button className="ws-link" onClick={kaydet} title="Kaydet (Ctrl+S)">
          💾 Kaydet
        </button>
        {degisti && <span className="muted small">• kaydedilmedi</span>}
      </div>
      <textarea
        className="nd-metin"
        value={metin}
        spellCheck={false}
        onChange={(e) => (setMetin(e.target.value), setDegisti(true))}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            kaydet();
          }
        }}
        aria-label="Not Defteri metni"
      />
      <div className="nd-durum">
        <span>{mesaj || (metinMi ? `Satır ${metin.split('\n').length}` : 'Bu dosya metin değil: Not Defteri içeriğini doğru gösteremez.')}</span>
        <span>UTF-8 · Windows (CRLF)</span>
      </div>
    </div>
  );
}
