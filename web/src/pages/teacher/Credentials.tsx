import type { Credential } from '../../api';

/** Yeni oluşturulan/sıfırlanan giriş bilgilerini gösterir; yazdırılabilir kartlar üretir. */
export function CredentialCards({ title, list, onClose }: { title: string; list: Credential[]; onClose: () => void }) {
  const site = window.location.origin + window.location.pathname.replace(/index\.html$/, '');
  return (
    <div className="modal-back" role="dialog" aria-modal>
      <div className="modal wide">
        <div className="modal-head no-print">
          <h3>{title}</h3>
          <div className="row">
            <button className="btn primary" onClick={() => window.print()}>
              🖨 Yazdır
            </button>
            <button className="btn" onClick={onClose}>
              Kapat
            </button>
          </div>
        </div>
        <p className="note warn no-print">Şifreler yalnızca şimdi görünür. Yazdırın ya da not alın; sonra yalnızca sıfırlanabilir.</p>
        <div className="cred-grid print-area">
          {list.map((c, i) => (
            <div key={i} className="cred-card">
              <b>{c.name}</b>
              <div>
                Adres: <code>{site}</code>
              </div>
              <div>
                Kullanıcı adı: <code>{c.username}</code>
              </div>
              <div>
                Şifre: <code>{c.password}</code>
              </div>
              <small>İşletim Sistemleri Laboratuvarı</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
