// Dosya Gezgini: gezinme bölmesi, klasör/dosya listesi, yeni klasör, yeniden adlandır, sil, görünüm seçenekleri,
// kurulum dosyalarını çalıştırma (UAC → kurulum sihirbazı).
import { useState } from 'react';
import { KATALOG } from '../core/katalog';
import { adOf, children, gorunenAd, KULLANICI, parentOf } from '../core/winpc';
import type { AppCtx } from './Masaustu';

const NAV: [string, string, string][] = [
  ['Masaüstü', `${KULLANICI}/Masaüstü`, '🖥'],
  ['Belgeler', `${KULLANICI}/Belgeler`, '📄'],
  ['İndirilenler', `${KULLANICI}/İndirilenler`, '⬇'],
  ['Resimler', `${KULLANICI}/Resimler`, '🖼'],
];

export default function DosyaGezgini(ctx: AppCtx) {
  const { pc, act } = ctx;
  const [yol, setYol] = useState(ctx.arg || `${KULLANICI}/Belgeler`);
  const [sec, setSec] = useState<string | null>(null);
  const [ad, setAd] = useState<{ path: string; value: string } | null>(null);
  const [gorunum, setGorunum] = useState(false);
  const [hata, setHata] = useState('');
  const [pano, setPano] = useState<string | null>(null);
  const surucler = Object.keys(pc.fs).filter((p) => /^[A-Z]:$/.test(p));
  const ogeler = children(pc, yol).filter((p) => pc.explorer.gizli || !pc.fs[p].gizli);

  const ac = (p: string) => {
    const f = pc.fs[p];
    if (!f) return;
    if (f.tur === 'klasor') {
      setYol(p);
      setSec(null);
      ctx.log('dosya.gez', { yol: p });
      return;
    }
    if (f.uygulama === 'rufus') {
      ctx.log('dosya.calistir', { dosya: p, uygulama: f.uygulama });
      ctx.uac(adOf(p), 'Akeo Consulting', () => ctx.open('rufus'));
      return;
    }
    if (/\.iso$/i.test(p)) {
      setHata('Bu bir disk kalıbı (ISO). Kurulum belleği hazırlamak için Rufus ile bir USB belleğe yazın.');
      return;
    }
    if (f.kurulum) {
      const t = KATALOG[f.kurulum];
      ctx.log('dosya.calistir', { dosya: p, kurulum: f.kurulum });
      ctx.uac(adOf(p), f.kaynak === 'sahte' ? 'Bilinmiyor' : t.uygulama.yayinci, () => ctx.open('kurulum', p));
      return;
    }
    if (/\.docx?$/.test(p) && pc.kurulu.includes('office')) ctx.open('word', p);
  };

  const yeniKlasor = () => {
    let n = `${yol}/Yeni klasör`;
    for (let i = 2; pc.fs[n]; i++) n = `${yol}/Yeni klasör (${i})`;
    act('dosya.yeni-klasor', { yol: n }, (p) => ((p.fs[n] = { tur: 'klasor' }), p));
    setSec(n);
    setAd({ path: n, value: adOf(n) });
  };

  const adlandir = () => {
    if (!ad) return;
    const v = ad.value.trim();
    if (!v || /[\\/:*?"<>|]/.test(v)) {
      setHata('Dosya adı şu karakterlerden hiçbirini içeremez: \\ / : * ? " < > |');
      return;
    }
    const f = pc.fs[ad.path];
    // Uzantılar gizliyken dosya yeniden adlandırılırsa Windows eski uzantıyı korur
    const eskiUz = f?.tur === 'dosya' && !pc.explorer.uzanti ? (adOf(ad.path).match(/\.[^.]+$/)?.[0] ?? '') : '';
    const yeni = `${parentOf(ad.path)}/${v}${eskiUz}`;
    if (yeni !== ad.path && pc.fs[yeni]) {
      setHata('Bu konumda aynı adlı bir dosya ya da klasör zaten var.');
      return;
    }
    setHata('');
    if (yeni !== ad.path)
      act('dosya.adlandir', { eski: ad.path, yeni }, (p) => {
        for (const k of Object.keys(p.fs)) {
          if (k === ad.path || k.startsWith(ad.path + '/')) {
            const nk = yeni + k.slice(ad.path.length);
            p.fs[nk] = p.fs[k];
            delete p.fs[k];
          }
        }
        return p;
      });
    setSec(yeni);
    setAd(null);
  };

  const yapistir = () => {
    if (!pano || !pc.fs[pano]) return;
    let hedef = `${yol}/${adOf(pano)}`;
    if (yol === pano || yol.startsWith(pano + '/')) {
      setHata('Hedef klasör, kaynak klasörün bir alt klasörü.');
      return;
    }
    // Aynı klasöre yapıştırma → "- Kopya"; başka yerde aynı adlı öğe varsa Windows gibi birleştir/üzerine yaz
    if (parentOf(pano) === yol) for (let i = 2; pc.fs[hedef]; i++) hedef = `${yol}/${adOf(pano).replace(/(\.[^.]+)?$/, ` - Kopya (${i})$1`)}`;
    setHata('');
    const kaynak = pano;
    act('dosya.kopyala', { kaynak, hedef }, (p) => {
      for (const k of Object.keys(p.fs)) if (k === kaynak || k.startsWith(kaynak + '/')) p.fs[hedef + k.slice(kaynak.length)] = { ...p.fs[k] };
      return p;
    });
    setSec(hedef);
  };

  const sil = () => {
    if (!sec) return;
    act('dosya.sil', { yol: sec }, (p) => {
      for (const k of Object.keys(p.fs)) if (k === sec || k.startsWith(sec + '/')) delete p.fs[k];
      return p;
    });
    setSec(null);
  };

  const yolGoster = yol.replace(/\//g, ' › ').replace('C: › Kullanıcılar › Ogrenci', 'Ogrenci');
  return (
    <div className="fe">
      <div className="fe-toolbar">
        <button className="ws-link" onClick={yeniKlasor} title="Yeni klasör">
          ⊕ Yeni
        </button>
        <span className="sep" />
        <button className="ws-link" disabled={!sec} onClick={() => sec && setAd({ path: sec, value: pc.explorer.uzanti || pc.fs[sec]?.tur === 'klasor' ? adOf(sec) : gorunenAd(pc, sec) })} title="Yeniden adlandır">
          ✎ Yeniden adlandır
        </button>
        <button className="ws-link" disabled={!sec} onClick={() => sec && (setPano(sec), ctx.log('dosya.pano', { yol: sec }))} title="Kopyala">
          ⧉ Kopyala
        </button>
        <button className="ws-link" disabled={!pano} onClick={yapistir} title="Yapıştır">
          📋 Yapıştır
        </button>
        <button className="ws-link" disabled={!sec} onClick={sil} title="Sil">
          🗑 Sil
        </button>
        <span className="sep" />
        <span className="rel">
          <button className="ws-link" onClick={() => setGorunum((g) => !g)}>
            ☰ Görünüm ▾
          </button>
          {gorunum && (
            <div className="s-menu fe-menu">
              <b>Göster</b>
              <label>
                <input type="checkbox" checked={pc.explorer.uzanti} onChange={(e) => act('gezgin.uzanti', { deger: e.target.checked }, (p) => ((p.explorer.uzanti = e.target.checked), p))} /> Dosya adı uzantıları
              </label>
              <label>
                <input type="checkbox" checked={pc.explorer.gizli} onChange={(e) => act('gezgin.gizli', { deger: e.target.checked }, (p) => ((p.explorer.gizli = e.target.checked), p))} /> Gizli öğeler
              </label>
            </div>
          )}
        </span>
      </div>
      <div className="fe-addr">
        <button className="ws-link" disabled={!parentOf(yol)} onClick={() => parentOf(yol) && setYol(parentOf(yol))} aria-label="Yukarı">
          ↑
        </button>
        <span>{yolGoster}</span>
      </div>
      <div className="fe-body">
        <nav className="fe-nav">
          {NAV.map(([n, p, i]) => (
            <button key={p} className={yol === p ? 'on' : ''} onClick={() => (setYol(p), setSec(null))}>
              {i} {n}
            </button>
          ))}
          <div className="fe-nav-h">Bu bilgisayar</div>
          {surucler.map((d) => (
            <button key={d} className={yol === d ? 'on' : ''} onClick={() => (setYol(d), setSec(null))}>
              {d === 'C:' ? '💽 Yerel Disk (C:)' : d === 'D:' ? '💽 Veri (D:)' : `🔌 ${pc.fs[d]?.boyut ?? 'USB Sürücü'} (${d})`}
            </button>
          ))}
        </nav>
        <div className="fe-list" onClick={(e) => e.target === e.currentTarget && setSec(null)}>
          <div className="fe-row fe-head">
            <span>Ad</span>
            <span>Tür</span>
            <span>Boyut</span>
          </div>
          {ogeler.length === 0 && <p className="small muted">Bu klasör boş.</p>}
          {ogeler.map((p) => {
            const f = pc.fs[p];
            const uz = adOf(p).match(/\.([^.]+)$/)?.[1]?.toLowerCase();
            const tur = f.tur === 'klasor' ? 'Dosya klasörü' : uz === 'exe' ? 'Uygulama' : uz === 'docx' ? 'Microsoft Word Belgesi' : uz === 'pdf' ? 'PDF Belgesi' : uz === 'zip' || uz === 'rar' ? 'Sıkıştırılmış klasör' : uz === 'iso' ? 'Disk Görüntüsü Dosyası' : uz === 'mp3' ? 'MP3 Biçimi Ses' : uz === 'jpg' ? 'JPG Dosyası' : `${(uz ?? '').toUpperCase()} Dosyası`;
            return (
              <div key={p} className={'fe-row' + (sec === p ? ' on' : '') + (f.gizli ? ' hidden' : '')} onClick={() => setSec(p)} onDoubleClick={() => ac(p)} role="button" aria-label={adOf(p)}>
                <span>
                  {f.tur === 'klasor' ? '📁' : uz === 'exe' ? '⚙' : uz === 'docx' ? '📘' : '📄'}{' '}
                  {ad?.path === p ? (
                    <input
                      autoFocus
                      value={ad.value}
                      onChange={(e) => setAd({ ...ad, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') adlandir();
                        if (e.key === 'Escape') setAd(null);
                      }}
                      onBlur={adlandir}
                      aria-label="Yeni ad"
                    />
                  ) : (
                    gorunenAd(pc, p)
                  )}
                </span>
                <span>{tur}</span>
                <span>{f.boyut ?? ''}</span>
              </div>
            );
          })}
          {hata && <p className="err-text small">{hata}</p>}
        </div>
      </div>
      <div className="fe-status">
        {ogeler.length} öğe{sec ? ' · 1 öğe seçildi' : ''} — çift tıklayarak aç/çalıştır
        {pano && <span className="fe-clip">Panoda: {adOf(pano)}</span>}
      </div>
    </div>
  );
}
