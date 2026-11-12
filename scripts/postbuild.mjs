// Derlenmiş arayüzün (dist/) yanına PHP sunucu dosyalarını ve görev içeriklerini kopyalar.
// Sonuç: dist/ klasörünün içeriği doğrudan Hostinger'daki public_html'e yüklenir.
import { cpSync, rmSync, writeFileSync, existsSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
cpSync(new URL('../server/', import.meta.url), dist, {
  recursive: true,
  filter: (src) => !src.endsWith('/api/config.php'),
});
const content = new URL('api/content/', dist);
if (existsSync(content)) rmSync(content, { recursive: true });
cpSync(new URL('../content/', import.meta.url), content, { recursive: true });
// Görev cevapları (kurallar) web'den doğrudan indirilemesin; yalnızca PHP okur.
writeFileSync(new URL('.htaccess', content), 'Require all denied\n');
console.log('>> PHP dosyaları ve içerikler dist/ klasörüne kopyalandı.');
