// Office ürün anahtarı ile etkinleştirme penceresi ve Dosya › Hesap paneli (Word, Excel, PowerPoint ve diğer Office uygulamaları ortak).
import { useState } from 'react';
import type { AppCtx } from './Masaustu';

const norm = (k: string) => k.toUpperCase().replace(/[^A-Z0-9]/g, '');

export function EtkinlestirPenceresi({ ctx, kapat, tamam }: { ctx: AppCtx; kapat: () => void; tamam?: () => void }) {
  const [anahtar, setAnahtar] = useState('');
  const [hata, setHata] = useState('');
  const dene = () => {
    const ok = !!ctx.veri.officeAnahtar && norm(anahtar) === norm(ctx.veri.officeAnahtar);
    ctx.act('office.etkinlestir', { dogru: ok }, (p) => {
      const o = p.uygulamalar.find((u) => u.id === 'office');
      if (ok && o) o.etkin = true;
      return p;
    });
    if (ok) {
      kapat();
      tamam?.();
    } else setHata(/^([A-Z0-9]{5}-){4}[A-Z0-9]{5}$/.test(anahtar.trim()) ? 'Bu ürün anahtarı geçerli değil. Lütfen denetleyip yeniden deneyin.' : 'Ürün anahtarı 25 karakterdir: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX');
  };
  return (
    <div className="ws-modal">
      <div className="ws-dlg">
        <div className="ws-h">Ürün anahtarınızı girin</div>
        <p className="small">Office ürün anahtarı satın aldığınız kartın ya da e-postanın üzerindedir.</p>
        <input
          autoFocus
          value={anahtar}
          onChange={(e) => setAnahtar(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && dene()}
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
          maxLength={29}
          aria-label="Office ürün anahtarı"
        />
        {hata && <p className="err-text small">{hata}</p>}
        <div className="ws-foot">
          <button className="ws-btn primary" onClick={dene}>
            Etkinleştir
          </button>
          <button className="ws-btn" onClick={kapat}>
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}

/** Dosya › Hesap: ürün bilgisi ve etkinleştirme düğmesi */
export function HesapPaneli({ ctx, etkinlestir }: { ctx: AppCtx; etkinlestir: () => void }) {
  const office = ctx.pc.uygulamalar.find((u) => u.id === 'office');
  if (!office) return null;
  return (
    <div className="wa-account">
      <h3>Hesap</h3>
      <b>Ürün Bilgileri</b>
      <p>{office.ad.replace(' - tr-tr', '')}</p>
      <p className={office.etkin ? 'ok-text' : 'err-text'}>{office.etkin ? '✔ Ürün Etkinleştirildi' : '✖ Ürün Etkinleştirmesi Gerekli'}</p>
      <p className="small">Bu ürün şunları içerir: {(office.bilesenler ?? []).map((b) => b[0].toUpperCase() + b.slice(1)).join(', ')}</p>
      {!office.etkin && (
        <button className="ws-btn primary" onClick={etkinlestir}>
          Ürünü Etkinleştir
        </button>
      )}
    </div>
  );
}
