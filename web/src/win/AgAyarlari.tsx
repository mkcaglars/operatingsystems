// Windows 11 Ayarlar › Ağ ve İnternet: Ethernet / Wi-Fi özellikleri ve "IP ayarlarını düzenle" penceresi.
import { useState, type ReactNode } from 'react';
import { AGLAR, ayarHatalari, DHCP, type AgTur, type IpAyar } from '../core/ag';
import type { AppCtx } from './Masaustu';

function Satir({ t, d, children, onClick }: { t: string; d?: ReactNode; children?: ReactNode; onClick?: () => void }) {
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

export function AgSayfasi({ ctx, sayfa, git }: { ctx: AppCtx; sayfa: string; git: (s: string) => void }) {
  const { pc } = ctx;
  const ethBagli = !!pc.ag?.kablo;
  const lanOk = pc.aygitlar.find((a) => a.id === 'lan')?.durum === 'ok';
  const eth = pc.agDurum?.ethernet ?? null;
  const wl = pc.agDurum?.wifi ?? null;
  const wifiVar = pc.aygitlar.some((a) => a.id === 'wifi');
  const [duzenle, setDuzenle] = useState<AgTur | null>(null);

  if (sayfa === 'ag') {
    const aktif = eth ?? wl;
    return (
      <>
        <div className="s-card ag-kart">
          <span className="ag-buyuk">{eth ? '🖧' : wl ? '📶' : '🌐'}</span>
          <div>
            <b>{eth ? 'Ethernet' : wl ? pc.ag.wifi : 'Bağlı değil'}</b>
            <small className={aktif?.internet ? 'ok-text' : 'err-text'}>{aktif ? aktif.durum : 'Bir ağa bağlı değilsiniz'}</small>
          </div>
        </div>
        <Satir t="Ethernet" d={!ethBagli ? 'Ağ kablosu takılı değil' : !lanOk ? 'Bağdaştırıcı çalışmıyor (sürücü)' : eth?.durum} onClick={() => git('ag-ethernet')} />
        {wifiVar && <Satir t="Wi-Fi" d={pc.ag?.wifi ? `${pc.ag.wifi} · ${wl?.durum ?? ''}` : 'Bağlı değil'} onClick={() => git('ag-wifi')} />}
      </>
    );
  }
  const tur: AgTur = sayfa === 'ag-wifi' ? 'wifi' : 'ethernet';
  const d = tur === 'ethernet' ? eth : wl;
  const ayar = pc.ag?.ip?.[tur] ?? DHCP;
  if (!d)
    return (
      <div className="s-card">
        <b>{tur === 'ethernet' ? (!ethBagli ? 'Ağ kablosu takılı değil' : 'Ethernet bağdaştırıcısı çalışmıyor') : 'Bir Wi-Fi ağına bağlı değilsiniz'}</b>
        <p className="small">{tur === 'ethernet' ? (!ethBagli ? 'Kasanın arkasındaki ağ (LAN) girişine kablo takın.' : 'Aygıt Yöneticisi ya da Windows Update ile sürücüyü yükleyin.') : 'Görev çubuğundaki ağ simgesinden bir ağ seçin.'}</p>
      </div>
    );
  return (
    <>
      <div className="s-card ag-kart">
        <span className="ag-buyuk">{tur === 'ethernet' ? '🖧' : '📶'}</span>
        <div>
          <b>{tur === 'ethernet' ? 'Ethernet' : pc.ag.wifi}</b>
          <small className={d.internet ? 'ok-text' : 'err-text'}>{d.durum}</small>
        </div>
      </div>
      {d.sorun && <div className="ag-uyari">⚠ {d.aciklama}</div>}
      <Satir t="Ağ profili türü" d="Özel ağ">
        <span className="small muted">Özel</span>
      </Satir>
      <Satir t="IP ataması:" d={ayar.mod === 'dhcp' ? 'Otomatik (DHCP)' : 'El ile'}>
        <button className="ws-btn" onClick={() => setDuzenle(tur)}>
          Düzenle
        </button>
      </Satir>
      <Satir t="DNS sunucusu ataması:" d={ayar.mod === 'dhcp' ? 'Otomatik (DHCP)' : 'El ile'}>
        <button className="ws-btn" onClick={() => setDuzenle(tur)}>
          Düzenle
        </button>
      </Satir>
      <div className="s-card ag-ozellik">
        <table>
          <tbody>
            <tr><td>Bağlantı hızı (Alma/İletim):</td><td>{tur === 'ethernet' ? '1000/1000 (Mbps)' : '574/574 (Mbps)'}</td></tr>
            <tr><td>IPv4 adresi:</td><td>{d.ip}{d.sorun === 'cakisma' ? ' (Otomatik yapılandırma — adres çakışması)' : ''}</td></tr>
            <tr><td>IPv4 alt ağ maskesi:</td><td>{d.maske}</td></tr>
            <tr><td>IPv4 varsayılan ağ geçidi:</td><td>{d.gecit || '—'}</td></tr>
            <tr><td>IPv4 DNS sunucuları:</td><td>{d.dns.length ? d.dns.join(', ') : '—'}</td></tr>
            <tr><td>Üretici:</td><td>{tur === 'ethernet' ? 'Realtek' : 'Intel Corporation'}</td></tr>
            <tr><td>Açıklama:</td><td>{pc.aygitlar.find((a) => a.id === (tur === 'ethernet' ? 'lan' : 'wifi'))?.ad}</td></tr>
            <tr><td>Fiziksel adres (MAC):</td><td>{AGLAR[tur].mac}</td></tr>
          </tbody>
        </table>
      </div>
      {duzenle && <IpDuzenle ctx={ctx} tur={duzenle} kapat={() => setDuzenle(null)} />}
    </>
  );
}

/** Windows 11 "IP ayarlarını düzenle" iletişim kutusu */
function IpDuzenle({ ctx, tur, kapat }: { ctx: AppCtx; tur: AgTur; kapat: () => void }) {
  const eski = ctx.pc.ag?.ip?.[tur] ?? DHCP;
  const [a, setA] = useState<IpAyar>(eski.mod === 'dhcp' ? { ...DHCP } : { ...eski });
  const [hatalar, setHatalar] = useState<string[]>([]);
  const alan = (k: keyof IpAyar, etiket: string, ipucu: string) => (
    <label className="ip-alan">
      {etiket}
      <input value={a[k]} onChange={(e) => (setA({ ...a, [k]: e.target.value }), setHatalar([]))} placeholder={ipucu} aria-label={etiket} spellCheck={false} />
    </label>
  );
  const kaydet = () => {
    const h = ayarHatalari(a);
    if (h.length) {
      setHatalar(h);
      ctx.log('ag.ip-hatali', { tur, hata: h[0] });
      return;
    }
    const yeni: IpAyar = a.mod === 'dhcp' ? { ...DHCP } : { ...a, ip: a.ip.trim(), maske: a.maske.trim(), gecit: a.gecit.trim(), dns1: a.dns1.trim(), dns2: a.dns2.trim() };
    ctx.act('ag.ip-ayarla', { tur, mod: yeni.mod, ip: yeni.ip, maske: yeni.maske, gecit: yeni.gecit, dns: [yeni.dns1, yeni.dns2].filter(Boolean).join(',') }, (p) => {
      p.ag = { ...p.ag, ip: { ...(p.ag.ip ?? {}), [tur]: yeni } };
      return p;
    });
    kapat();
  };
  return (
    <div className="ws-modal">
      <div className="ws-dlg ip-dlg" role="dialog" aria-label="IP ayarlarını düzenle">
        <div className="ws-h">IP ayarlarını düzenle</div>
        <select value={a.mod} onChange={(e) => (setA(e.target.value === 'dhcp' ? { ...DHCP } : { mod: 'elle', ip: '', maske: '255.255.255.0', gecit: '', dns1: '', dns2: '' }), setHatalar([]))} aria-label="IP ataması">
          <option value="dhcp">Otomatik (DHCP)</option>
          <option value="elle">El ile</option>
        </select>
        {a.mod === 'elle' && (
          <>
            <div className="ip-ipv4">
              <b>IPv4</b> <span className="ip-acik">Açık</span>
            </div>
            {alan('ip', 'IP adresi', 'ör. 192.168.1.60')}
            {alan('maske', 'Alt ağ maskesi', '255.255.255.0')}
            {alan('gecit', 'Ağ geçidi', 'ör. 192.168.1.1')}
            {alan('dns1', 'Tercih edilen DNS', 'ör. 8.8.8.8')}
            {alan('dns2', 'Diğer DNS', '')}
          </>
        )}
        {hatalar.map((h) => (
          <p key={h} className="err-text small">
            {h}
          </p>
        ))}
        <div className="ws-foot">
          <button className="ws-btn primary" onClick={kaydet}>
            Kaydet
          </button>
          <button className="ws-btn" onClick={kapat}>
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
