// Excel: hücreler (A–H, 1–20), formül çubuğu, klavyeyle düzenleme, formüller (TOPLA, ORTALAMA, MAK, MİN, SAY, EĞER),
// Kaydet / Farklı Kaydet (.xlsx, Belgeler klasörüne). Office etkinleştirilmemişse düzenleme kapalıdır (gerçek Office gibi).
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Logo from '../components/Logo';
import { goster, hesapla, SATIR_SAYISI, SUTUNLAR, type Hucreler } from '../core/tablo';
import { adOf, KULLANICI } from '../core/winpc';
import type { AppCtx } from './Masaustu';

const sutunNo = (ad: string) => SUTUNLAR.indexOf(ad[0]);
const satirNo = (ad: string) => Number(ad.slice(1));
const hucre = (c: number, r: number) => SUTUNLAR[Math.max(0, Math.min(SUTUNLAR.length - 1, c))] + Math.max(1, Math.min(SATIR_SAYISI, r));

export default function Excel({ ctx, dosya: dosya0 }: { ctx: AppCtx; dosya?: string }) {
  const { pc, act } = ctx;
  const etkin = !!pc.uygulamalar.find((u) => u.id === 'office')?.etkin;
  const [dosya, setDosya] = useState<string | null>(dosya0 && pc.fs[dosya0] ? dosya0 : null);
  const [h, setH] = useState<Hucreler>(() => ({ ...((dosya0 && pc.fs[dosya0]?.tablo) || {}) }));
  const [sec, setSec] = useState('A1');
  const [duzen, setDuzen] = useState<string | null>(null);
  const [degisti, setDegisti] = useState(false);
  const [kaydet, setKaydet] = useState<{ ad: string; hata?: string } | null>(null);
  const [uyari, setUyari] = useState('');
  const kok = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kaydet) kok.current?.focus();
  }, [kaydet, duzen === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const yaz = (ad: string, deger: string) => {
    if (!etkin) {
      setUyari('Ürün etkinleştirilmediği için düzenleme kapalı. Word › Dosya › Hesap › Ürünü Etkinleştir.');
      return;
    }
    if ((h[ad] ?? '') === deger) return;
    setH((x) => {
      const y = { ...x };
      if (deger === '') delete y[ad];
      else y[ad] = deger;
      return y;
    });
    setDegisti(true);
    if (deger.startsWith('=')) ctx.log('excel.formul', { hucre: ad, formul: deger });
  };
  const git = (dc: number, dr: number) => setSec((s) => hucre(sutunNo(s) + dc, satirNo(s) + dr));
  const bitir = (dc: number, dr: number) => {
    if (duzen !== null) yaz(sec, duzen.trim());
    setDuzen(null);
    git(dc, dr);
  };

  const kaydetDosya = (yol: string) => {
    const tablo = { ...h };
    act('excel.kaydet', { dosya: yol, hucre: Object.keys(tablo).length, formul: Object.values(tablo).filter((v) => v.startsWith('=')).length }, (p) => {
      p.fs[yol] = { ...(p.fs[yol] ?? {}), tur: 'dosya', boyut: `${Math.max(8, 8 + Object.keys(tablo).length)} KB`, tablo };
      return p;
    });
    setDosya(yol);
    setDegisti(false);
    setUyari(`Kaydedildi: ${adOf(yol)}`);
  };
  const farkliKaydet = () => {
    if (!kaydet) return;
    const ad = kaydet.ad.trim().replace(/\.xlsx$/i, '');
    if (!ad || /[\\/:*?"<>|]/.test(ad)) return setKaydet({ ...kaydet, hata: 'Dosya adı şu karakterleri içeremez: \\ / : * ? " < > |' });
    setKaydet(null);
    kaydetDosya(`${KULLANICI}/Belgeler/${ad}.xlsx`);
  };
  const ctrlS = () => {
    if (!etkin) return setUyari('Etkinleştirilmemiş Office ile kaydedilemez.');
    if (dosya) kaydetDosya(dosya);
    else setKaydet({ ad: 'Kitap1' });
  };

  const tus = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      ctrlS();
      return;
    }
    if (duzen !== null) {
      // Düzenleme kutusu henüz odaklanmadan basılan tuşlar kaybolmasın
      if (e.target !== kok.current) return;
      const k = e.key;
      if (k === 'Enter') bitir(0, 1);
      else if (k === 'Tab') bitir(e.shiftKey ? -1 : 1, 0);
      else if (k === 'Escape') setDuzen(null);
      else if (k === 'Backspace') setDuzen((d) => (d ?? '').slice(0, -1));
      else if (k.length === 1 && !e.ctrlKey && !e.altKey) setDuzen((d) => (d ?? '') + k);
      else return;
      e.preventDefault();
      return;
    }
    const k = e.key;
    if (k === 'ArrowUp') git(0, -1);
    else if (k === 'ArrowDown' || k === 'Enter') git(0, 1);
    else if (k === 'ArrowLeft') git(-1, 0);
    else if (k === 'ArrowRight' || k === 'Tab') git(e.shiftKey && k === 'Tab' ? -1 : 1, 0);
    else if (k === 'Delete' || k === 'Backspace') yaz(sec, '');
    else if (k === 'F2') etkin ? setDuzen(h[sec] ?? '') : yaz(sec, h[sec] ?? '');
    else if (k.length === 1 && !e.ctrlKey && !e.altKey) {
      if (!etkin) return yaz(sec, k);
      setDuzen(k);
    } else return;
    e.preventDefault();
  };

  const v = (ad: string) => hesapla(h, ad);
  return (
    <div className="xl" ref={kok} tabIndex={0} onKeyDown={tus}>
      <div className="xl-ribbon">
        <Logo id="excel" size="1.4em" />
        <b>{dosya ? adOf(dosya) : 'Kitap1'}</b>
        {degisti && <span className="muted small">• kaydedilmedi</span>}
        <span className="xl-sekmeler">Dosya · Giriş · Ekle · Sayfa Düzeni · Formüller · Veri</span>
        <button className="ws-btn" onClick={ctrlS} title="Kaydet (Ctrl+S)">
          💾 Kaydet
        </button>
        <button className="ws-btn" onClick={() => (etkin ? setKaydet({ ad: dosya ? adOf(dosya).replace(/\.xlsx$/i, '') : 'Kitap1' }) : ctrlS())}>
          Farklı Kaydet
        </button>
        <button className="ws-btn" onClick={() => yaz(sec, `=TOPLA(${SUTUNLAR[sutunNo(sec)]}1:${SUTUNLAR[sutunNo(sec)]}${Math.max(1, satirNo(sec) - 1)})`)} title="Otomatik Toplam">
          Σ Otomatik Toplam
        </button>
      </div>
      {!etkin && (
        <div className="pg-uyari">
          <b>ÜRÜN ETKİNLEŞTİRİLMEDİ</b> Düzenleme devre dışı. Word'ü açıp Dosya › Hesap › Ürünü Etkinleştir ile ürün anahtarını girin.
        </div>
      )}
      <div className="xl-fbar">
        <span className="xl-ad">{sec}</span>
        <span className="xl-fx">fx</span>
        <input
          value={duzen ?? h[sec] ?? ''}
          readOnly={!etkin}
          onChange={(e) => setDuzen(e.target.value)}
          onFocus={() => etkin && duzen === null && setDuzen(h[sec] ?? '')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.preventDefault(), bitir(0, 1), kok.current?.focus());
            if (e.key === 'Escape') (setDuzen(null), kok.current?.focus());
          }}
          aria-label="Formül çubuğu"
        />
      </div>
      <div className="xl-izgara">
        <table>
          <thead>
            <tr>
              <th />
              {SUTUNLAR.map((c) => (
                <th key={c} className={sec[0] === c ? 'on' : ''}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SATIR_SAYISI }, (_, i) => i + 1).map((r) => (
              <tr key={r}>
                <th className={satirNo(sec) === r ? 'on' : ''}>{r}</th>
                {SUTUNLAR.map((c) => {
                  const ad = c + r;
                  const deger = v(ad);
                  return (
                    <td
                      key={ad}
                      className={(sec === ad ? 'sec ' : '') + (typeof deger === 'number' ? 'sayi' : '') + (typeof deger === 'string' && deger.startsWith('#') ? ' hata' : '')}
                      onMouseDown={() => {
                        if (duzen !== null) yaz(sec, duzen.trim());
                        setDuzen(null);
                        setSec(ad);
                      }}
                      onDoubleClick={() => etkin && setDuzen(h[ad] ?? '')}
                      aria-label={ad}
                    >
                      {sec === ad && duzen !== null ? (
                        <input
                          autoFocus
                          className="xl-hucre-input"
                          value={duzen}
                          onChange={(e) => setDuzen(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.preventDefault(), bitir(0, 1));
                            else if (e.key === 'Tab') (e.preventDefault(), bitir(e.shiftKey ? -1 : 1, 0));
                            else if (e.key === 'Escape') setDuzen(null);
                            else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') (e.preventDefault(), yaz(sec, duzen.trim()), setDuzen(null));
                          }}
                          aria-label={`${ad} hücresi`}
                        />
                      ) : (
                        goster(deger)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="xl-durum">
        <span>{uyari || 'Hazır'}</span>
        <span>Sayfa1</span>
      </div>
      {kaydet && (
        <div className="ws-modal">
          <div className="ws-dlg">
            <div className="ws-h">Farklı Kaydet</div>
            <p className="small">Bu bilgisayar › Belgeler</p>
            <label>
              Dosya adı
              <input
                autoFocus
                value={kaydet.ad}
                onChange={(e) => setKaydet({ ad: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && farkliKaydet()}
                aria-label="Dosya adı"
              />
            </label>
            <p className="small muted">Kayıt türü: Excel Çalışma Kitabı (*.xlsx)</p>
            {kaydet.hata && <p className="err-text small">{kaydet.hata}</p>}
            <div className="ws-foot">
              <button className="ws-btn primary" onClick={farkliKaydet}>
                Kaydet
              </button>
              <button className="ws-btn" onClick={() => setKaydet(null)}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
