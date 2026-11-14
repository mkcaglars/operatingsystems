// WinRAR: klasörlerde gezinme, seçili dosyaları RAR/ZIP arşivine ekleme (parola, sonra silme), arşivin içini görme,
// çıkartma (parolalı arşivde parola sorar), sınama, silme ve arşiv bilgisi.
import { useState } from 'react';
import { arsivAdi, arsivKoku, arsivle, boyutKB, boyutYaz, cikart } from '../core/arsiv';
import { adOf, children, KULLANICI, parentOf } from '../core/winpc';
import type { AppCtx } from './Masaustu';

type Dlg =
  | { t: 'ekle'; ad: string; bicim: 'rar' | 'zip'; yontem: string; sil: boolean; parola: string; parola2: string; hata?: string }
  | { t: 'cikart'; arsiv: string; hedef: string; parola: string; hata?: string }
  | { t: 'mesaj'; baslik: string; metin: string };

const ARACLAR: [string, string][] = [
  ['Ekle', '📦'],
  ['Çıkart', '📂'],
  ['Sına', '✅'],
  ['Görüntüle', '👓'],
  ['Sil', '❌'],
  ['Bul', '🔍'],
  ['Sihirbaz', '🪄'],
  ['Bilgi', 'ℹ️'],
  ['Onar', '🩹'],
];

export default function WinRar({ ctx, baslangic }: { ctx: AppCtx; baslangic?: string }) {
  const { pc, act } = ctx;
  const [yol, setYol] = useState(() => (baslangic && pc.fs[baslangic] ? (pc.fs[baslangic].tur === 'klasor' || arsivKoku(pc, baslangic) ? baslangic : parentOf(baslangic)) : `${KULLANICI}/Belgeler`));
  const [sec, setSec] = useState<string[]>([]);
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const arsiv = arsivKoku(pc, yol);
  const ogeler = children(pc, yol);
  const secArsiv = sec.length === 1 && arsivKoku(pc, sec[0]) === sec[0] ? sec[0] : null;
  const hedefArsiv = arsiv ?? secArsiv;

  const ac = (p: string) => {
    const f = pc.fs[p];
    if (!f) return;
    if (f.tur === 'klasor' || arsivKoku(pc, p) === p) {
      setYol(p);
      setSec([]);
    } else setDlg({ t: 'mesaj', baslik: adOf(p), metin: arsiv ? 'Arşivdeki bir dosyayı kullanmak için önce arşivi çıkartın (Çıkart).' : 'Bu dosya WinRAR ile açılmaz. Dosya Gezgini ile açın.' });
  };
  const tikla = (p: string, coklu: boolean) => setSec((s) => (coklu ? (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]) : [p]));

  const arac = (ad: string) => {
    if (ad === 'Ekle') {
      if (arsiv) return setDlg({ t: 'mesaj', baslik: 'WinRAR', metin: 'Arşivin içindeyken yeni dosya eklemek için önce bir üst klasöre çıkın.' });
      if (!sec.length) return setDlg({ t: 'mesaj', baslik: 'WinRAR', metin: 'Önce arşive eklenecek dosya ya da klasörleri seçin (birden fazla için Ctrl tuşuyla tıklayın).' });
      const ad0 = sec.length === 1 ? arsivAdi(adOf(sec[0])).replace(/\.[^.]+$/, '') : adOf(yol);
      setDlg({ t: 'ekle', ad: ad0 + '.rar', bicim: 'rar', yontem: 'Normal', sil: false, parola: '', parola2: '' });
    } else if (ad === 'Çıkart') {
      if (!hedefArsiv) return setDlg({ t: 'mesaj', baslik: 'WinRAR', metin: 'Çıkartmak için bir arşiv (.rar ya da .zip) seçin ya da arşivin içine girin.' });
      setDlg({ t: 'cikart', arsiv: hedefArsiv, hedef: `${parentOf(hedefArsiv)}/${arsivAdi(hedefArsiv)}`, parola: '' });
    } else if (ad === 'Sına') {
      if (!hedefArsiv) return setDlg({ t: 'mesaj', baslik: 'WinRAR', metin: 'Sınamak için bir arşiv seçin.' });
      ctx.log('winrar.sina', { arsiv: hedefArsiv });
      setDlg({ t: 'mesaj', baslik: 'Sınama sonuçları', metin: `${adOf(hedefArsiv)}: sınanan arşivlerde hata bulunamadı.` });
    } else if (ad === 'Sil') {
      if (!sec.length) return;
      const silinen = [...sec];
      act('winrar.sil', { sayi: silinen.length, arsivIci: !!arsiv }, (p) => {
        for (const s of silinen) for (const k of Object.keys(p.fs)) if (k === s || k.startsWith(s + '/')) delete p.fs[k];
        return p;
      });
      setSec([]);
    } else if (ad === 'Bilgi') {
      if (!hedefArsiv) return setDlg({ t: 'mesaj', baslik: 'Bilgi', metin: `${ogeler.length} öğe · ${yol.replace(/\//g, '\\')}` });
      const ic = Object.keys(pc.fs).filter((k) => k.startsWith(hedefArsiv + '/'));
      const acik = ic.filter((k) => pc.fs[k].tur === 'dosya').reduce((t, k) => t + boyutKB(pc.fs[k].boyut), 0);
      const f = pc.fs[hedefArsiv];
      setDlg({
        t: 'mesaj',
        baslik: `Arşiv: ${adOf(hedefArsiv)}`,
        metin: `Biçim: ${(f.arsiv ?? 'zip').toUpperCase()} · ${ic.length} öğe · Toplam: ${boyutYaz(acik)} · Arşiv: ${f.boyut ?? '?'} · Oran: %${acik ? Math.round((boyutKB(f.boyut) / acik) * 100) : 100}${f.parola ? ' · Parolalı' : ''}`,
      });
    } else setDlg({ t: 'mesaj', baslik: ad, metin: `${ad}: bu simülasyonda Ekle, Çıkart, Sına, Sil ve Bilgi kullanılabilir.` });
  };

  const ekle = () => {
    if (dlg?.t !== 'ekle') return;
    const ad = dlg.ad.trim();
    if (!ad || /[\\/:*?"<>|]/.test(ad)) return setDlg({ ...dlg, hata: 'Geçersiz arşiv adı.' });
    if (dlg.parola !== dlg.parola2) return setDlg({ ...dlg, hata: 'Parolalar eşleşmiyor.' });
    const dosya = ad.replace(/\.(rar|zip)$/i, '') + '.' + dlg.bicim;
    const hedef = `${yol}/${dosya}`;
    const kaynak = [...sec];
    const { bicim, sil, parola } = dlg;
    act('winrar.ekle', { arsiv: hedef, bicim, dosyalar: kaynak.length, sil, parolali: !!parola }, (p) => arsivle(p, kaynak, hedef, bicim, { sil, parola: parola || undefined }));
    setDlg(null);
    setSec([hedef]);
  };

  const cikartTamam = () => {
    if (dlg?.t !== 'cikart') return;
    const f = pc.fs[dlg.arsiv];
    if (f?.parola && dlg.parola !== f.parola) {
      ctx.log('winrar.parola-hata', { arsiv: dlg.arsiv });
      return setDlg({ ...dlg, hata: `Yanlış parola: ${adOf(dlg.arsiv)}` });
    }
    const hedef = dlg.hedef.replace(/\\/g, '/').replace(/\/+$/, '');
    if (!/^[A-Z]:/.test(hedef)) return setDlg({ ...dlg, hata: 'Hedef yol bir sürücüyle başlamalı (ör. C:\\Kullanıcılar\\Ogrenci\\Belgeler).' });
    const a = dlg.arsiv;
    act('winrar.cikart', { arsiv: a, hedef }, (p) => cikart(p, a, hedef));
    setDlg(null);
    setYol(hedef);
    setSec([]);
  };

  return (
    <div className="pg-rar">
      <div className="pg-rar-menu">Dosya · Komutlar · Araçlar · Sık Kullanılanlar · Seçenekler · Yardım</div>
      <div className="pg-rar-tools">
        {ARACLAR.map(([t, ik]) => (
          <button key={t} onClick={() => arac(t)}>
            <i className="pg-rar-ik">{ik}</i>
            {t}
          </button>
        ))}
      </div>
      <div className="pg-rar-yol">
        <button className="ws-link" disabled={!parentOf(yol)} onClick={() => (setYol(parentOf(yol)), setSec([]))} aria-label="Üst klasör">
          ⬆
        </button>
        {arsiv ? '📚' : '📁'} {yol.replace(/\//g, '\\')}
      </div>
      <div className="pg-rar-govde">
        <table className="pg-rar-list">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Boyut</th>
              <th>Tür</th>
            </tr>
          </thead>
          <tbody>
            {ogeler.map((p) => {
              const f = pc.fs[p];
              const ar = arsivKoku(pc, p) === p;
              return (
                <tr key={p} className={sec.includes(p) ? 'on' : ''} onClick={(e) => tikla(p, e.ctrlKey || e.metaKey)} onDoubleClick={() => ac(p)} aria-label={adOf(p)}>
                  <td>
                    {f.tur === 'klasor' ? '📁' : ar ? '📚' : '📄'} {adOf(p)}
                  </td>
                  <td>{f.tur === 'dosya' ? (f.boyut ?? '') : ''}</td>
                  <td>{f.tur === 'klasor' ? 'Dosya klasörü' : ar ? `WinRAR ${f.arsiv === 'zip' || /\.zip$/i.test(p) ? 'ZIP' : ''} arşivi` : 'Dosya'}</td>
                </tr>
              );
            })}
            {ogeler.length === 0 && (
              <tr>
                <td colSpan={3} className="muted small">
                  Boş klasör
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pg-rar-durum">
        {sec.length ? `${sec.length} öğe seçildi` : `Toplam ${ogeler.length} öğe`}
        {arsiv && pc.fs[arsiv]?.parola ? ' · 🔒 Parolalı arşiv' : ''} · Değerlendirme kopyası (40 gün)
      </div>
      {dlg && (
        <div className="ws-modal">
          <div className="ws-dlg rar-dlg">
            {dlg.t === 'ekle' && (
              <>
                <div className="ws-h">Arşiv adı ve parametreleri</div>
                <label>
                  Arşiv adı
                  <input value={dlg.ad} onChange={(e) => setDlg({ ...dlg, ad: e.target.value })} aria-label="Arşiv adı" autoFocus />
                </label>
                <div className="row">
                  <b className="small">Arşiv biçimi:</b>
                  {(['rar', 'zip'] as const).map((b) => (
                    <label key={b} className="ws-radio">
                      <input type="radio" checked={dlg.bicim === b} onChange={() => setDlg({ ...dlg, bicim: b, ad: dlg.ad.replace(/\.(rar|zip)$/i, '') + '.' + b })} /> {b.toUpperCase()}
                    </label>
                  ))}
                </div>
                <label>
                  Sıkıştırma yöntemi
                  <select value={dlg.yontem} onChange={(e) => setDlg({ ...dlg, yontem: e.target.value })} aria-label="Sıkıştırma yöntemi">
                    {['Depola', 'En hızlı', 'Hızlı', 'Normal', 'İyi', 'En iyi'].map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                </label>
                <label className="ws-radio">
                  <input type="checkbox" checked={dlg.sil} onChange={(e) => setDlg({ ...dlg, sil: e.target.checked })} /> Dosyaları arşivledikten sonra sil
                </label>
                <label>
                  Parola (isteğe bağlı)
                  <input type="text" data-sim-parola autoComplete="off" spellCheck={false} value={dlg.parola} onChange={(e) => setDlg({ ...dlg, parola: e.target.value })} aria-label="Arşiv parolası" />
                </label>
                {dlg.parola && (
                  <label>
                    Parolayı doğrulamak için yeniden girin
                    <input type="text" data-sim-parola autoComplete="off" spellCheck={false} value={dlg.parola2} onChange={(e) => setDlg({ ...dlg, parola2: e.target.value })} aria-label="Arşiv parolası tekrar" />
                  </label>
                )}
                <p className="small muted">Eklenecek: {sec.map((s) => adOf(s)).join(', ')}</p>
                {dlg.hata && <p className="err-text small">{dlg.hata}</p>}
                <div className="ws-foot">
                  <button className="ws-btn primary" onClick={ekle}>
                    Tamam
                  </button>
                  <button className="ws-btn" onClick={() => setDlg(null)}>
                    İptal
                  </button>
                </div>
              </>
            )}
            {dlg.t === 'cikart' && (
              <>
                <div className="ws-h">Çıkartma yolu ve seçenekleri</div>
                <label>
                  Hedef yol (yoksa oluşturulur)
                  <input value={dlg.hedef.replace(/\//g, '\\')} onChange={(e) => setDlg({ ...dlg, hedef: e.target.value })} aria-label="Hedef yol" />
                </label>
                {pc.fs[dlg.arsiv]?.parola && (
                  <label>
                    🔒 Parolayı girin: {adOf(dlg.arsiv)}
                    <input type="text" data-sim-parola autoComplete="off" spellCheck={false} value={dlg.parola} onChange={(e) => setDlg({ ...dlg, parola: e.target.value })} aria-label="Çıkartma parolası" autoFocus />
                  </label>
                )}
                {dlg.hata && <p className="err-text small">{dlg.hata}</p>}
                <div className="ws-foot">
                  <button className="ws-btn primary" onClick={cikartTamam}>
                    Tamam
                  </button>
                  <button className="ws-btn" onClick={() => setDlg(null)}>
                    İptal
                  </button>
                </div>
              </>
            )}
            {dlg.t === 'mesaj' && (
              <>
                <div className="ws-h">{dlg.baslik}</div>
                <p>{dlg.metin}</p>
                <div className="ws-foot">
                  <button className="ws-btn primary" onClick={() => setDlg(null)}>
                    Tamam
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
