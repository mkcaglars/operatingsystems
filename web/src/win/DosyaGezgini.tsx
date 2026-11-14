// Dosya Gezgini: gezinme bölmesi, klasör/dosya listesi, çoklu seçim (Ctrl/Shift ve fareyle seçim kutusu),
// sürükle-bırak (başka sürücüye kopyalar, aynı sürücüde taşır), sağ tık menüsü, klavye kısayolları,
// kes/kopyala/yapıştır, yeni klasör/metin belgesi, yeniden adlandır, sil, ZIP, özellikler (gizli özniteliği).
import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { adOf, children, gorunenAd, KULLANICI, parentOf } from '../core/winpc';
import { arsivAdi, arsivKoku, arsivle, cikart } from '../core/arsiv';
import { kopyala, sil as silYollar, tasi, uzanti, varsayilanIslem } from '../core/dosyaIslem';
import type { MenuOge } from './BaglamMenu';
import type { AppCtx } from './Masaustu';

const NAV: [string, string, string][] = [
  ['Masaüstü', `${KULLANICI}/Masaüstü`, '🖥'],
  ['Belgeler', `${KULLANICI}/Belgeler`, '📄'],
  ['İndirilenler', `${KULLANICI}/İndirilenler`, '⬇'],
  ['Resimler', `${KULLANICI}/Resimler`, '🖼'],
];
const SURUKLE = 'text/fe-yollar';

function turAdi(tur: 'klasor' | 'dosya', yol: string) {
  if (tur === 'klasor') return 'Dosya klasörü';
  const uz = uzanti(yol);
  const ad: Record<string, string> = {
    exe: 'Uygulama',
    docx: 'Microsoft Word Belgesi',
    xlsx: 'Microsoft Excel Çalışma Sayfası',
    pdf: 'PDF Belgesi',
    zip: 'Sıkıştırılmış klasör',
    rar: 'WinRAR arşivi',
    iso: 'Disk Görüntüsü Dosyası',
    mp3: 'MP3 Biçimi Ses',
    jpg: 'JPG Dosyası',
    txt: 'Metin Belgesi',
    pptx: 'Microsoft PowerPoint Sunusu',
  };
  return ad[uz] ?? `${uz.toUpperCase()} Dosyası`;
}
const ikon = (tur: 'klasor' | 'dosya', yol: string) => {
  if (tur === 'klasor') return '📁';
  const uz = uzanti(yol);
  return uz === 'exe' ? '⚙' : uz === 'docx' ? '📘' : uz === 'xlsx' ? '📗' : uz === 'zip' || uz === 'rar' ? '🗜' : uz === 'txt' ? '📝' : uz === 'jpg' || uz === 'png' ? '🖼' : '📄';
};

export default function DosyaGezgini(ctx: AppCtx) {
  const { pc, act } = ctx;
  const [yol, setYol] = useState(ctx.arg && pc.fs[ctx.arg] ? (pc.fs[ctx.arg].tur === 'klasor' || arsivKoku(pc, ctx.arg) ? ctx.arg : parentOf(ctx.arg)) : `${KULLANICI}/Belgeler`);
  const [sec, setSec] = useState<string[]>([]);
  const [capa, setCapa] = useState<string | null>(null);
  const [ad, setAd] = useState<{ path: string; value: string } | null>(null);
  const [gorunum, setGorunum] = useState(false);
  const [hata, setHata] = useState('');
  const [bilgi, setBilgi] = useState('');
  const [pano, setPano] = useState<{ yollar: string[]; kes: boolean } | null>(null);
  const [kutu, setKutu] = useState<{ x0: number; y0: number; x1: number; y1: number; ek: string[] } | null>(null);
  const [hedefVurgu, setHedefVurgu] = useState<string | null>(null);
  const [ozellik, setOzellik] = useState<string | null>(null);
  const liste = useRef<HTMLDivElement>(null);
  const surucler = Object.keys(pc.fs).filter((p) => /^[A-Z]:$/.test(p));
  const ogeler = children(pc, yol).filter((p) => pc.explorer.gizli || !pc.fs[p].gizli);
  const tek = sec.length === 1 ? sec[0] : null;
  const zipArsiv = arsivKoku(pc, yol);

  const git = (p: string) => {
    setYol(p);
    setSec([]);
    setHata('');
    ctx.log('dosya.gez', { yol: p });
  };
  const ac = (p: string) => {
    const f = pc.fs[p];
    if (!f) return;
    // Klasörler ve .zip arşivleri (Windows'ta klasör gibi) pencerenin içinde açılır; dosyalar ilişkili uygulamayla
    if (f.tur === 'klasor' || uzanti(p) === 'zip') return git(p);
    ctx.dosyaAc(p);
  };

  // ---------- Seçim ----------
  const tikla = (e: MouseEvent, p: string) => {
    if (e.shiftKey && capa) {
      const a = ogeler.indexOf(capa);
      const b = ogeler.indexOf(p);
      const [i, j] = a < b ? [a, b] : [b, a];
      setSec(ogeler.slice(i, j + 1));
    } else if (e.ctrlKey || e.metaKey) {
      setSec((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
      setCapa(p);
    } else {
      setSec([p]);
      setCapa(p);
    }
  };
  // Fareyle seçim kutusu: boş alandan ya da satırın ad dışındaki sütunlarından başlar
  const kutuBasla = (e: MouseEvent) => {
    if (e.button !== 0 || !liste.current) return;
    const r = liste.current.getBoundingClientRect();
    const x = e.clientX - r.left + liste.current.scrollLeft;
    const y = e.clientY - r.top + liste.current.scrollTop;
    const ek = e.ctrlKey || e.metaKey ? sec : [];
    if (!ek.length) setSec([]);
    setKutu({ x0: x, y0: y, x1: x, y1: y, ek });
    e.preventDefault();
  };
  useEffect(() => {
    if (!kutu) return;
    const hareket = (e: globalThis.MouseEvent) => {
      const el = liste.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x1 = e.clientX - r.left + el.scrollLeft;
      const y1 = e.clientY - r.top + el.scrollTop;
      setKutu((k) => (k ? { ...k, x1, y1 } : k));
      const [a, b] = [Math.min(kutu.y0, y1), Math.max(kutu.y0, y1)];
      const [c, d] = [Math.min(kutu.x0, x1), Math.max(kutu.x0, x1)];
      const secilen: string[] = [];
      el.querySelectorAll<HTMLElement>('[data-yol]').forEach((row) => {
        const top = row.offsetTop;
        const bottom = top + row.offsetHeight;
        const left = row.offsetLeft;
        const right = left + row.offsetWidth;
        if (bottom >= a && top <= b && right >= c && left <= d) secilen.push(row.dataset.yol!);
      });
      setSec([...new Set([...kutu.ek, ...secilen])]);
    };
    const bitir = () => {
      setKutu(null);
    };
    window.addEventListener('mousemove', hareket);
    window.addEventListener('mouseup', bitir);
    return () => {
      window.removeEventListener('mousemove', hareket);
      window.removeEventListener('mouseup', bitir);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kutu?.x0, kutu?.y0]);

  // ---------- İşlemler ----------
  const isle = (tur: 'kopyala' | 'tasi', kaynaklar: string[], hedef: string) => {
    const kaynak = kaynaklar.filter((k) => pc.fs[k]);
    if (!kaynak.length) return;
    // Sonuç (ve olası hata) önce bilgisayarın bir kopyası üzerinde hesaplanır
    const deneme = JSON.parse(JSON.stringify(pc));
    const sonuc = tur === 'kopyala' ? kopyala(deneme, kaynak, hedef) : tasi(deneme, kaynak, hedef);
    if (sonuc.hata) {
      setHata(sonuc.hata);
      return;
    }
    act(tur === 'kopyala' ? 'dosya.kopyala' : 'dosya.tasi', { kaynak: kaynak.join(', '), hedef, adet: kaynak.length }, (p) => {
      if (tur === 'kopyala') kopyala(p, kaynak, hedef);
      else tasi(p, kaynak, hedef);
      return p;
    });
    setHata('');
    const yerAdi = /^[A-Z]:$/.test(hedef) ? `${hedef} sürücüsüne` : `"${adOf(hedef)}" klasörüne`;
    setBilgi(`${kaynak.length} öğe ${yerAdi} ${tur === 'kopyala' ? 'kopyalandı' : 'taşındı'}.`);
    if (hedef === yol) setSec(sonuc.tamam);
    else setSec((s) => s.filter((x) => tur === 'kopyala' || !kaynak.includes(x)));
  };
  const kopyalaPano = (kes = false) => {
    if (!sec.length) return;
    setPano({ yollar: [...sec], kes });
    ctx.log(kes ? 'dosya.kes' : 'dosya.pano', { yol: sec.join(', ') });
    setBilgi(`${sec.length} öğe panoya ${kes ? 'kesildi' : 'kopyalandı'}.`);
  };
  const yapistir = (hedef = yol) => {
    if (!pano) return;
    isle(pano.kes ? 'tasi' : 'kopyala', pano.yollar, hedef);
    if (pano.kes) setPano(null);
  };
  const silSecili = (yollar = sec) => {
    if (!yollar.length) return;
    const s = [...yollar];
    act('dosya.sil', { yol: s.join(', '), adet: s.length }, (p) => (silYollar(p, s), p));
    setSec([]);
  };
  const yeniKlasor = () => {
    let n = `${yol}/Yeni klasör`;
    for (let i = 2; pc.fs[n]; i++) n = `${yol}/Yeni klasör (${i})`;
    act('dosya.yeni-klasor', { yol: n }, (p) => ((p.fs[n] = { tur: 'klasor' }), p));
    setSec([n]);
    setAd({ path: n, value: adOf(n) });
  };
  const yeniMetin = () => {
    let n = `${yol}/Yeni Metin Belgesi.txt`;
    for (let i = 2; pc.fs[n]; i++) n = `${yol}/Yeni Metin Belgesi (${i}).txt`;
    act('dosya.yeni', { yol: n }, (p) => ((p.fs[n] = { tur: 'dosya', boyut: '0 KB', icerik: '' }), p));
    setSec([n]);
    setAd({ path: n, value: pc.explorer.uzanti ? adOf(n) : adOf(n).replace(/\.txt$/, '') });
  };
  const adlandirBasla = (p = tek) => p && setAd({ path: p, value: pc.explorer.uzanti || pc.fs[p]?.tur === 'klasor' ? adOf(p) : gorunenAd(pc, p) });
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
            p.fs[yeni + k.slice(ad.path.length)] = p.fs[k];
            delete p.fs[k];
          }
        }
        return p;
      });
    setSec([yeni]);
    setAd(null);
  };
  const zipSikistir = (yollar = sec) => {
    if (!yollar.length || zipArsiv) return;
    const taban = yollar.length === 1 ? arsivAdi(adOf(yollar[0])).replace(/\.[^.]+$/, '') : adOf(yol);
    let hedef = `${yol}/${taban}.zip`;
    for (let i = 2; pc.fs[hedef]; i++) hedef = `${yol}/${taban} (${i}).zip`;
    const kaynak = [...yollar];
    act('zip.sikistir', { kaynak: kaynak.join(', '), arsiv: hedef }, (p) => arsivle(p, kaynak, hedef, 'zip'));
    setSec([hedef]);
  };
  const ayikla = (arsiv: string) => {
    const hedef = `${parentOf(arsiv)}/${arsivAdi(arsiv)}`;
    act('zip.ayikla', { arsiv, hedef }, (p) => cikart(p, arsiv, hedef));
    git(hedef);
  };

  // ---------- Sürükle-bırak ----------
  const suruklemeBasla = (e: DragEvent, p: string) => {
    const yollar = sec.includes(p) ? sec : [p];
    if (!sec.includes(p)) setSec([p]);
    e.dataTransfer.setData(SURUKLE, JSON.stringify(yollar));
    e.dataTransfer.effectAllowed = 'copyMove';
  };
  const birakmaUzerinde = (e: DragEvent, hedef: string) => {
    if (!e.dataTransfer.types.includes(SURUKLE)) return;
    e.preventDefault();
    setHedefVurgu(hedef);
  };
  const birak = (e: DragEvent, hedef: string) => {
    if (!e.dataTransfer.types.includes(SURUKLE)) return;
    e.preventDefault();
    e.stopPropagation();
    setHedefVurgu(null);
    const yollar: string[] = JSON.parse(e.dataTransfer.getData(SURUKLE) || '[]');
    if (!yollar.length || yollar.includes(hedef)) return;
    // Ctrl: kopyala, Shift: taşı; yoksa Windows kuralı (başka sürücü → kopyala, aynı sürücü → taşı)
    const tur = e.ctrlKey ? 'kopyala' : e.shiftKey ? 'tasi' : varsayilanIslem(yollar, hedef);
    isle(tur, yollar, hedef);
  };
  const birakmaHedefi = (hedef: string) => ({
    onDragOver: (e: DragEvent) => birakmaUzerinde(e, hedef),
    onDragLeave: () => setHedefVurgu((h) => (h === hedef ? null : h)),
    onDrop: (e: DragEvent) => birak(e, hedef),
  });

  // ---------- Sağ tık menüleri ----------
  const ogeMenusu = (e: MouseEvent, p: string) => {
    const yollar = sec.includes(p) ? sec : [p];
    if (!sec.includes(p)) setSec([p]);
    const f = pc.fs[p];
    const coklu = yollar.length > 1;
    const arsiv = arsivKoku(pc, p) === p;
    const winrar = pc.kurulu.includes('winrar');
    const ogeler: MenuOge[] = [
      { ad: 'Aç', kalin: true, ikon: '📂', kisayol: 'Enter', devreDisi: coklu, onClick: () => ac(p) },
      ...(f.tur === 'dosya' && !coklu ? [{ ad: 'Birlikte aç…', ikon: '🗂', onClick: () => ctx.birlikteAc(p) }] : []),
      ...(arsiv && !coklu ? [{ ad: 'Tümünü ayıkla…', ikon: '📤', onClick: () => ayikla(p) }] : []),
      ...(winrar && !coklu && arsiv ? [{ ad: 'WinRAR ile aç', ikon: 'logo:winrar', onClick: () => ctx.open('program', 'winrar|' + p) }] : []),
      ...(winrar && !arsiv ? [{ ad: 'WinRAR ile arşive ekle…', ikon: 'logo:winrar', onClick: () => ctx.open('program', 'winrar|' + yol) }] : []),
      ...(!arsiv && !zipArsiv ? [{ ad: 'ZIP dosyasına sıkıştır', ikon: '🗜', onClick: () => zipSikistir(yollar) }] : []),
      { ayrac: true },
      { ad: 'Kes', ikon: '✂', kisayol: 'Ctrl+X', onClick: () => (setPano({ yollar, kes: true }), setBilgi(`${yollar.length} öğe kesildi.`)) },
      { ad: 'Kopyala', ikon: '⧉', kisayol: 'Ctrl+C', onClick: () => (setPano({ yollar, kes: false }), ctx.log('dosya.pano', { yol: yollar.join(', ') }), setBilgi(`${yollar.length} öğe kopyalandı.`)) },
      ...(f.tur === 'klasor' && pano && !coklu ? [{ ad: 'Yapıştır', ikon: '📋', kisayol: 'Ctrl+V', onClick: () => yapistir(p) }] : []),
      { ad: 'Yeniden adlandır', ikon: '✎', kisayol: 'F2', devreDisi: coklu, onClick: () => adlandirBasla(p) },
      { ad: 'Sil', ikon: '🗑', kisayol: 'Del', onClick: () => silSecili(yollar) },
      { ayrac: true },
      { ad: 'Özellikler', ikon: 'ⓘ', kisayol: 'Alt+Enter', devreDisi: coklu, onClick: () => setOzellik(p) },
    ];
    ctx.menu(e, ogeler);
  };
  const bosMenu = (e: MouseEvent) => {
    setSec([]);
    ctx.menu(e, [
      { ad: 'Yenile', ikon: '⟳', onClick: () => ctx.log('dosya.yenile', { yol }) },
      { ad: 'Yapıştır', ikon: '📋', kisayol: 'Ctrl+V', devreDisi: !pano || !!zipArsiv, onClick: () => yapistir() },
      ...(zipArsiv ? [{ ad: 'Tümünü ayıkla…', ikon: '📤', onClick: () => ayikla(zipArsiv) }] : []),
      { ayrac: true },
      { ad: 'Yeni klasör', ikon: '📁', devreDisi: !!zipArsiv, onClick: yeniKlasor },
      { ad: 'Yeni metin belgesi', ikon: '📝', devreDisi: !!zipArsiv, onClick: yeniMetin },
      { ayrac: true },
      { ad: 'Terminalde aç', ikon: 'logo:powershell', devreDisi: !!zipArsiv, onClick: () => ctx.open('powershell', yol) },
      { ayrac: true },
      { ad: 'Dosya adı uzantılarını göster', ikon: '', isaretli: pc.explorer.uzanti, onClick: () => act('gezgin.uzanti', { deger: !pc.explorer.uzanti }, (p) => ((p.explorer.uzanti = !p.explorer.uzanti), p)) },
      { ad: 'Gizli öğeleri göster', ikon: '', isaretli: pc.explorer.gizli, onClick: () => act('gezgin.gizli', { deger: !pc.explorer.gizli }, (p) => ((p.explorer.gizli = !p.explorer.gizli), p)) },
      { ayrac: true },
      { ad: 'Özellikler', ikon: 'ⓘ', onClick: () => setOzellik(yol) },
    ]);
  };

  // ---------- Klavye ----------
  const tus = (e: KeyboardEvent) => {
    if (ad) return;
    const ctrl = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (ctrl && k === 'a') setSec(ogeler);
    else if (ctrl && k === 'c') kopyalaPano(false);
    else if (ctrl && k === 'x') kopyalaPano(true);
    else if (ctrl && k === 'v') yapistir();
    else if (e.key === 'Delete') silSecili();
    else if (e.key === 'F2') adlandirBasla();
    else if (e.key === 'Enter' && tek) ac(tek);
    else if (e.key === 'Backspace' && parentOf(yol)) git(parentOf(yol));
    else return;
    e.preventDefault();
  };

  const surucuAdi = (d: string) => (d === 'C:' ? 'Yerel Disk (C:)' : d === 'D:' ? 'Veri (D:)' : `${pc.fs[d]?.boyut ?? 'USB Sürücü'} (${d})`);
  const yolGoster = yol.startsWith(KULLANICI) ? yol.replace(KULLANICI, 'Ogrenci').replace(/\//g, ' › ') : 'Bu bilgisayar › ' + surucuAdi(yol.slice(0, 2)) + yol.slice(2).replace(/\//g, ' › ');
  const oz = ozellik ? pc.fs[ozellik] : null;
  return (
    <div className="fe">
      <div className="fe-toolbar">
        <button className="ws-link" onClick={yeniKlasor} title="Yeni klasör" disabled={!!zipArsiv}>
          ⊕ Yeni
        </button>
        <span className="sep" />
        <button className="ws-link" disabled={!sec.length} onClick={() => kopyalaPano(true)} title="Kes (Ctrl+X)">
          ✂ Kes
        </button>
        <button className="ws-link" disabled={!tek} onClick={() => adlandirBasla()} title="Yeniden adlandır">
          ✎ Yeniden adlandır
        </button>
        <button className="ws-link" disabled={!sec.length} onClick={() => kopyalaPano(false)} title="Kopyala">
          ⧉ Kopyala
        </button>
        <button className="ws-link" disabled={!pano || !!zipArsiv} onClick={() => yapistir()} title="Yapıştır">
          📋 Yapıştır
        </button>
        {zipArsiv ? (
          <button className="ws-link" onClick={() => ayikla(zipArsiv)} title="Tümünü ayıkla">
            📤 Tümünü ayıkla
          </button>
        ) : (
          <button className="ws-link" disabled={!sec.length} onClick={() => zipSikistir()} title="ZIP dosyasına sıkıştır">
            🗜 ZIP'e sıkıştır
          </button>
        )}
        <button className="ws-link" disabled={!sec.length} onClick={() => silSecili()} title="Sil">
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
        <button className="ws-link" disabled={!parentOf(yol)} onClick={() => parentOf(yol) && git(parentOf(yol))} aria-label="Yukarı">
          ↑
        </button>
        <span>{yolGoster}</span>
      </div>
      <div className="fe-body">
        <nav className="fe-nav">
          {NAV.map(([n, p, i]) => (
            <button key={p} className={(yol === p ? 'on' : '') + (hedefVurgu === p ? ' birak' : '')} onClick={() => git(p)} {...birakmaHedefi(p)}>
              {i} {n}
            </button>
          ))}
          <div className="fe-nav-h">Bu bilgisayar</div>
          {surucler.map((d) => (
            <button key={d} className={(yol === d ? 'on' : '') + (hedefVurgu === d ? ' birak' : '')} onClick={() => git(d)} {...birakmaHedefi(d)}>
              {d === 'C:' ? '💽 Yerel Disk (C:)' : d === 'D:' ? '💽 Veri (D:)' : `🔌 ${pc.fs[d]?.boyut ?? 'USB Sürücü'} (${d})`}
            </button>
          ))}
        </nav>
        <div
          className={'fe-list' + (hedefVurgu === yol ? ' birak' : '')}
          ref={liste}
          tabIndex={0}
          onKeyDown={tus}
          onMouseDown={(e) => e.target === e.currentTarget && kutuBasla(e)}
          onContextMenu={(e) => e.target === e.currentTarget && bosMenu(e)}
          {...birakmaHedefi(yol)}
        >
          <div className="fe-row fe-head">
            <span>Ad</span>
            <span>Tür</span>
            <span>Boyut</span>
          </div>
          {ogeler.length === 0 && <p className="small muted">Bu klasör boş.</p>}
          {ogeler.map((p) => {
            const f = pc.fs[p];
            const klasorHedef = f.tur === 'klasor' || /^[A-Z]:$/.test(p);
            return (
              <div
                key={p}
                data-yol={p}
                className={'fe-row' + (sec.includes(p) ? ' on' : '') + (f.gizli ? ' hidden' : '') + (pano?.kes && pano.yollar.includes(p) ? ' kesik' : '') + (hedefVurgu === p ? ' birak' : '')}
                onClick={(e) => tikla(e, p)}
                onDoubleClick={() => ac(p)}
                onContextMenu={(e) => ogeMenusu(e, p)}
                {...(klasorHedef ? birakmaHedefi(p) : {})}
                role="button"
                aria-label={adOf(p)}
                aria-selected={sec.includes(p)}
              >
                <span className="fe-ad" draggable={!ad} onDragStart={(e) => suruklemeBasla(e, p)} onDragEnd={() => setHedefVurgu(null)}>
                  {ikon(f.tur, p)}{' '}
                  {ad?.path === p ? (
                    <input
                      autoFocus
                      value={ad.value}
                      onChange={(e) => setAd({ ...ad, value: e.target.value })}
                      onKeyDown={(e) => {
                        e.stopPropagation();
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
                <span onMouseDown={(e) => !e.ctrlKey && !e.shiftKey && kutuBasla(e)}>{turAdi(f.tur, p)}</span>
                <span onMouseDown={(e) => !e.ctrlKey && !e.shiftKey && kutuBasla(e)}>{f.boyut ?? ''}</span>
              </div>
            );
          })}
          {kutu && (
            <div className="fe-kutu" style={{ left: Math.min(kutu.x0, kutu.x1), top: Math.min(kutu.y0, kutu.y1), width: Math.abs(kutu.x1 - kutu.x0), height: Math.abs(kutu.y1 - kutu.y0) }} />
          )}
          {hata && <p className="err-text small">{hata}</p>}
        </div>
      </div>
      <div className="fe-status">
        {ogeler.length} öğe{sec.length ? ` · ${sec.length} öğe seçildi` : ''}
        {bilgi ? <span className="fe-clip">{bilgi}</span> : <span className="fe-clip">çift tıkla: aç · sağ tık: menü · sürükle: taşı/kopyala</span>}
        {yol === 'C:' && <span className="fe-clip">Yerel Disk (C:) · 476 GB'nin 371 GB'ı boş</span>}
        {pano && <span className="fe-clip">Panoda: {pano.yollar.length === 1 ? adOf(pano.yollar[0]) : `${pano.yollar.length} öğe`}</span>}
      </div>
      {oz && ozellik && (
        <div className="ws-modal">
          <div className="ws-dlg fe-oz" role="dialog" aria-label="Özellikler">
            <div className="ws-h">
              {ikon(oz.tur, ozellik)} {adOf(ozellik) || surucuAdi(ozellik)} Özellikleri
            </div>
            <dl className="dm-kv">
              <dt>Tür</dt>
              <dd>{/^[A-Z]:$/.test(ozellik) ? 'Yerel Disk' : turAdi(oz.tur, ozellik)}</dd>
              <dt>Konum</dt>
              <dd>{parentOf(ozellik).replace(/\//g, '\\') || '—'}</dd>
              <dt>Boyut</dt>
              <dd>{oz.tur === 'klasor' ? `${Object.keys(pc.fs).filter((k) => k.startsWith(ozellik + '/') && pc.fs[k].tur === 'dosya').length} dosya` : (oz.boyut ?? '—')}</dd>
            </dl>
            <label className="ws-radio">
              <input
                type="checkbox"
                checked={!!oz.gizli}
                disabled={/^[A-Z]:$/.test(ozellik)}
                onChange={(e) => {
                  const y = ozellik;
                  const v = e.target.checked;
                  act('dosya.oznitelik', { yol: y, gizli: v }, (p) => {
                    if (p.fs[y]) p.fs[y] = { ...p.fs[y], gizli: v || undefined };
                    return p;
                  });
                }}
              />{' '}
              Gizli
            </label>
            <div className="ws-foot">
              <button className="ws-btn primary" onClick={() => setOzellik(null)}>
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
