// Kum havuzundaki olayları öğretmenin okuyacağı Türkçe cümlelere çevirir.
import type { SimEvent } from './rules';

const S = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));
const BIOS_AD: Record<string, string> = { bootOrder: 'önyükleme sırası', sata: 'SATA modu', vt: 'sanallaştırma', csm: 'CSM (eski önyükleme)', secureBoot: 'Güvenli Önyükleme', tpm: 'TPM', usbBoot: 'USB önyükleme', fastBoot: 'hızlı açılış', adminSifre: 'yönetici parolası', ses: 'ses kartı', lan: 'ağ kartı', tarih: 'tarih', saat: 'saat' };

export function olayMetni(e: SimEvent): string | null {
  const d = e as Record<string, unknown>;
  switch (e.type) {
    case 'kh.guc':
      return d.acik ? 'Bilgisayarı açtı' : 'Bilgisayarı kapattı';
    case 'kh.reset':
      return 'Reset düğmesiyle yeniden başlattı';
    case 'kh.usb-tak':
      return `${d.flash === 'mavi' ? 'Mavi' : 'Turuncu'} flash belleği ${S(d.port)}. USB girişine taktı`;
    case 'kh.usb-cikar':
      return `${d.flash === 'mavi' ? 'Mavi' : 'Turuncu'} flash belleği çıkardı`;
    case 'post.tus':
      return d.basarili ? `Açılışta ${S(d.tus)} tuşuna bastı` : null;
    case 'setup.gir':
      return "BIOS Setup'a girdi";
    case 'bios.set':
      return `BIOS: ${BIOS_AD[S(d.anahtar)] ?? S(d.anahtar)} → ${S(d.deger)}`;
    case 'bios.kaydet':
      return 'BIOS ayarlarını kaydetti (F10)';
    case 'bios.iptal':
      return "BIOS'tan kaydetmeden çıktı";
    case 'bios.varsayilan':
      return 'BIOS varsayılanlarını yükledi';
    case 'bootmenu.sec':
      return `Önyükleme menüsünden ${d.aygit === 'usb' ? 'USB belleği' : d.aygit === 'ssd' ? 'diski' : S(d.aygit)} seçti`;
    case 'acilis':
      return d.sonuc === 'bootfail' ? 'Açılış hatası: önyüklenebilir aygıt yok' : null;
    case 'kh.rufus':
      return `Rufus ile ${d.flash === 'mavi' ? 'mavi' : 'turuncu'} belleğe ${/ubuntu/i.test(S(d.iso)) ? 'Ubuntu' : 'Windows 11'} yazdı (${S(d.bolum)})`;
    case 'kh.kurulum-basla':
      return 'Windows 11 Kurulumu başladı (USB)';
    case 'kh.ubuntu-basla':
      return 'Ubuntu kurulumu başladı (USB)';
    case 'anahtar.gir':
      return d.dogru ? 'Windows ürün anahtarını girdi' : 'Yanlış ürün anahtarı girdi';
    case 'disk.sil':
      return 'Kurulumda bir disk bölümünü sildi';
    case 'disk.bicimlendir':
      return 'Kurulumda bir disk bölümünü biçimlendirdi';
    case 'disk.yeni':
      return 'Kurulumda yeni bölüm oluşturdu';
    case 'disk.yukle':
      return "Windows'u seçilen bölüme yüklemeye başladı";
    case 'kh.kurulum-bitti':
      return 'Windows 11 kurulumu tamamlandı';
    case 'disk.sil-ve-kur':
      return 'Ubuntu: "Diski sil ve kur" seçti (Windows silinir!)';
    case 'disk.birlikte':
      return `Ubuntu: Windows ile birlikte kurulum (${S(d.ubuntuGB)} GB)`;
    case 'kh.ubuntu-bitti':
      return 'Ubuntu kurulumu tamamlandı';
    case 'kh.grub':
      return `GRUB menüsünden ${d.hedef === 'ubuntu' ? 'Ubuntu' : d.hedef === 'windows' ? 'Windows' : 'UEFI ayarlarını'} seçti`;
    case 'oobe.ag':
    case 'wifi.baglan':
      return d.ssid || S(d.ag).startsWith('wifi:') ? `Wi-Fi ağına bağlandı: ${S(d.ssid ?? S(d.ag).slice(5))}` : null;
    case 'oobe.wifi-hata':
    case 'wifi.hata':
      return 'Wi-Fi şifresini yanlış girdi';
    case 'uygulama.ac':
      return `Windows'ta ${S(d.uygulama)} uygulamasını açtı`;
    case 'indirme':
      return `İndirdi: ${S(d.dosya)}${d.kaynak === 'sahte' ? ' (SAHTE SİTE!)' : ''}`;
    case 'tarayici.git':
      return `Tarayıcıda gitti: ${S(d.url).replace(/^ara:/, 'arama: ')}`;
    case 'dosya.kopyala':
      return `Kopyaladı: ${S(d.kaynak)} → ${S(d.hedef)}`;
    case 'dosya.sil':
      return `Sildi: ${S(d.yol)}`;
    case 'update.denetle':
      return 'Windows Update çalıştırdı';
    case 'kurulum.tamam':
      return d.uygulama ? `Program kurdu: ${S(d.uygulama)}${d.kaynak === 'sahte' ? ' (sahte yükleyici!)' : ''}` : 'Kurulum dosyaları kopyalandı';
    case 'uygulama.kaldir':
      return `Program kaldırdı: ${S(d.uygulama)}`;
    case 'office.etkinlestir':
      return d.dogru ? "Office'i ürün anahtarıyla etkinleştirdi" : 'Office için yanlış ürün anahtarı girdi';
    case 'varsayilan.ayarla':
      return `Varsayılan ${d.tur === 'pdf' ? 'PDF uygulaması' : 'tarayıcı'}: ${S(d.uygulama)}`;
    case 'guvenlik.tarama':
      return `Windows Güvenliği: ${S(d.tur)} tarama`;
    case 'uac':
      return d.izin ? null : 'Kullanıcı Hesabı Denetimi: izin vermedi';
    case 'komut':
      return `Ubuntu terminali: ${S(d.satir)}`;
    case 'ubuntu.giris':
      return "Ubuntu'ya giriş yaptı";
    case 'kh.sifirla':
      return 'Kum havuzunu baştan başlattı';
    default:
      return null;
  }
}
