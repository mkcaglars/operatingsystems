// API uçtan uca testi: PHP yerleşik sunucusunu geçici bir SQLite veritabanıyla başlatır ve
// kurulum → öğretmen → sınıf → öğrenci → portal girişi → görev → rapor akışını sınar.
// Kullanım: node tests/api/smoke.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tmp = mkdtempSync(join(tmpdir(), 'islab-'));
const SECRET = 'x'.repeat(40);
const cfg = join(tmp, 'config.php');
writeFileSync(cfg, `<?php return [
  'db' => ['dsn' => 'sqlite:${tmp}/db.sqlite', 'user' => null, 'pass' => null],
  'kurulum_kodu' => 'kurulum123', 'jwt_secret' => '${SECRET}', 'token_max_age' => 300,
  'session_hours' => 10, 'portal_url' => 'https://portal.mkcaglar.com/', 'test_portal' => true,
];`);
const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', join(root, 'server')], { env: { ...process.env, ISLAB_CONFIG: cfg }, stdio: ['ignore', 'ignore', 'pipe'] });
let srvErr = '';
srv.stderr.on('data', (d) => (srvErr += d));

class Client {
  cookie = '';
  csrf = '';
  async req(method, path, body, { form = false, raw = false } = {}) {
    const headers = { Cookie: this.cookie };
    if (this.csrf) headers['X-CSRF-Token'] = this.csrf;
    let payload;
    if (body !== undefined) {
      if (form) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        payload = new URLSearchParams(body).toString();
      } else {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
      }
    }
    const res = await fetch(BASE + path, { method, headers, body: payload, redirect: 'manual' });
    const sc = res.headers.getSetCookie?.() ?? [];
    for (const c of sc) {
      const m = c.match(/^ISLAB=([^;]*)/);
      if (m) this.cookie = m[1] === 'deleted' ? '' : `ISLAB=${m[1]}`;
    }
    if (raw) return res;
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  }
  api(method, route, body) {
    return this.req(method, `/api/index.php?r=${route}`, body);
  }
  async refresh() {
    const r = await this.api('GET', 'auth/me');
    this.csrf = r.data.csrf ?? '';
    return r.data.user;
  }
  async login(username, password) {
    const r = await this.api('POST', 'auth/login', { username, password });
    if (r.status === 200) this.csrf = r.data.csrf;
    return r;
  }
}

const b64u = (s) => Buffer.from(s).toString('base64url');
function portalLink(payload) {
  const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const b = b64u(JSON.stringify(payload));
  const s = createHmac('sha256', SECRET).update(`${h}.${b}`).digest('base64url');
  return `/giris.php?token=${encodeURIComponent(`${h}.${b}.${s}`)}`;
}

let passed = 0;
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (e) {
    console.error('  ✗ ' + name);
    throw e;
  }
}

async function waitServer() {
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(BASE + '/robots.txt');
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('PHP sunucusu başlamadı: ' + srvErr);
}

const fullState = {
  hazirlik: { secilen: ['yedek', 'donanim', 'gereksinim', 'surucu', 'lisans', 'medya', 'guc'] },
  gereksinim: { karar: 'uygun-degil', eksikler: ['tpm'] },
};

try {
  await waitServer();
  const admin = new Client();
  const t1 = new Client();
  const t2 = new Client();
  const st = new Client();
  const portalSt = new Client();
  let classId, students, portalId;

  await step('kurulum gerekli görünür', async () => {
    const r = await admin.api('GET', 'config');
    assert.equal(r.data.kurulum_gerekli, true);
  });
  await step('kurulum kodu yanlışsa yönetici açılmaz', async () => {
    const r = await admin.req('POST', '/kurulum.php', { kod: 'yanlis', name: 'Yönetici', username: 'yonetici', password: 'GucluSifre1', password2: 'GucluSifre1' }, { form: true });
    assert.match(r.data, /Kurulum kodu hatalı/);
  });
  await step('kurulum ile yönetici oluşturulur ve oturum açılır', async () => {
    const r = await admin.req('POST', '/kurulum.php', { kod: 'kurulum123', name: 'Yönetici', username: 'yonetici', password: 'GucluSifre1', password2: 'GucluSifre1' }, { form: true, raw: true });
    assert.equal(r.status, 302);
    const u = await admin.refresh();
    assert.equal(u.role, 'admin');
  });
  await step('kurulum ikinci kez açılamaz', async () => {
    const r = await new Client().req('GET', '/kurulum.php');
    assert.equal(r.status, 404);
  });
  await step('CSRF anahtarı olmadan POST reddedilir', async () => {
    const c = new Client();
    c.cookie = admin.cookie;
    const r = await c.api('POST', 'teachers/create', { name: 'X', username: 'xxx', password: '12345678' });
    assert.equal(r.status, 419);
  });
  await step('yönetici iki öğretmen açar', async () => {
    assert.equal((await admin.api('POST', 'teachers/create', { name: 'Mehmet Kaya', username: 'mkaya', password: 'ogretmen123' })).status, 200);
    assert.equal((await admin.api('POST', 'teachers/create', { name: 'Elif Can', username: 'ecan', password: 'ogretmen456' })).status, 200);
    const r = await admin.api('POST', 'teachers/create', { name: 'Kısa', username: 'kisa', password: '123' });
    assert.equal(r.status, 400);
  });
  await step('öğretmen kullanıcı adı ve şifreyle girer', async () => {
    assert.equal((await t1.login('mkaya', 'ogretmen123')).status, 200);
    assert.equal((await t2.login('ECAN', 'ogretmen456')).status, 200);
    assert.equal((await new Client().login('mkaya', 'yanlis')).status, 401);
  });
  await step('öğretmen sınıf açar, aynı ad ikinci kez açılamaz', async () => {
    const r = await t1.api('POST', 'classes/create', { name: '9-A' });
    classId = r.data.id;
    assert.ok(classId);
    assert.equal((await t2.api('POST', 'classes/create', { name: '9-A' })).status, 409);
  });
  await step('toplu öğrenci ekleme (Türkçe adlardan kullanıcı adı)', async () => {
    const r = await t1.api('POST', 'students/bulk', { class_id: classId, rows: [{ name: 'Çağla Şükür' }, { name: 'İsmail Öztürk' }, { name: 'Çağla Şükür' }] });
    students = r.data.created;
    assert.deepEqual(students.map((s) => s.username), ['cagla.sukur', 'ismail.ozturk', 'cagla.sukur2']);
    assert.ok(students.every((s) => s.password.length === 6));
  });
  await step('başka öğretmen bu sınıfı ve öğrencileri göremez', async () => {
    assert.deepEqual((await t2.api('GET', 'classes')).data, []);
    assert.equal((await t2.api('GET', `students&class_id=${classId}`)).status, 403);
    assert.equal((await t2.api('POST', 'students/reset-password', { id: students[0].id })).status, 403);
  });
  await step('ikinci öğretmen sınıfa katılınca görür (çoklu öğretmen)', async () => {
    await t2.api('POST', 'classes/join', { id: classId });
    const r = await t2.api('GET', `students&class_id=${classId}`);
    assert.equal(r.data.length, 3);
    await t2.api('POST', 'classes/leave', { id: classId });
  });
  await step('öğrenci girer, değerlendirme modu kapalıyken başlatamaz', async () => {
    assert.equal((await st.login(students[0].username, students[0].password)).status, 200);
    const r = await st.api('POST', 'attempts/start', { task_id: 'i1-g5', mode: 'degerlendir' });
    assert.equal(r.status, 403);
  });
  await step('öğrenci öğretmen paneline erişemez', async () => {
    assert.equal((await st.api('GET', 'classes')).status, 403);
  });
  await step('uygula modunda görev: ipucu sunucuda sayılır, puan sunucuda hesaplanır', async () => {
    const a = await st.api('POST', 'attempts/start', { task_id: 'i1-g5', mode: 'uygula' });
    const h = await st.api('POST', 'attempts/hint', { attempt_id: a.data.attempt_id });
    assert.equal(h.data.hints, 1);
    const s = await st.api('POST', 'attempts/submit', { attempt_id: a.data.attempt_id, events: [{ type: 'x', t: 1 }], final_state: fullState });
    assert.equal(s.status, 200);
    assert.equal(s.data.sonuc.basari, 100);
    assert.equal(s.data.sonuc.puan, 95); // 100 - 1 ipucu × 5
    assert.equal((await st.api('POST', 'attempts/submit', { attempt_id: a.data.attempt_id, events: [], final_state: {} })).status, 409);
  });
  await step('hatalı seçimler süreç puanını düşürür', async () => {
    const a = await st.api('POST', 'attempts/start', { task_id: 'i1-g5', mode: 'uygula' });
    const bad = { hazirlik: { secilen: ['yedek', 'crack'] }, gereksinim: { karar: 'uygun', eksikler: [] } };
    const s = await st.api('POST', 'attempts/submit', { attempt_id: a.data.attempt_id, events: [], final_state: bad });
    assert.equal(s.data.sonuc.surec, 60);
    assert.ok(s.data.sonuc.puan < 40);
  });
  await step('öğretmen değerlendirmeyi açınca öğrenci başlatabilir', async () => {
    const cls = (await t1.api('GET', 'classes')).data[0];
    await t1.api('POST', 'classes/update', { id: classId, settings: { ...cls.settings, degerlendirme_acik: true } });
    const a = await st.api('POST', 'attempts/start', { task_id: 'i1-g5', mode: 'degerlendir' });
    assert.equal(a.status, 200);
    assert.equal((await st.api('POST', 'attempts/hint', { attempt_id: a.data.attempt_id })).status, 403);
    const s = await st.api('POST', 'attempts/submit', { attempt_id: a.data.attempt_id, events: [], final_state: fullState });
    assert.equal(s.data.sonuc.puan, 100);
  });
  await step('isteğe bağlı yazılım görevi yalnızca öğretmen açınca başlatılabilir', async () => {
    assert.equal((await st.api('POST', 'attempts/start', { task_id: 'i8-g3', mode: 'uygula' })).status, 403);
    const cls = (await t1.api('GET', 'classes')).data[0];
    await t1.api('POST', 'classes/update', { id: classId, settings: { ...cls.settings, istege_bagli: { ...cls.settings.istege_bagli, winrar: true } } });
    assert.equal((await st.api('POST', 'attempts/start', { task_id: 'i8-g3', mode: 'uygula' })).status, 200);
    assert.equal((await st.api('POST', 'attempts/start', { task_id: 'i8-g5', mode: 'uygula' })).status, 403);
    const s2 = await st.api('GET', 'tasks/status');
    assert.equal(s2.data.ayarlar.istege_bagli.winrar, true);
  });
  await step('servis bileti: öğretmen gönderir, öğrenci görür, teslimde kapanır', async () => {
    const r = await t1.api('POST', 'commands/send', { class_id: classId, student_ids: [students[0].id], task_id: 'i1-g5', mesaj: 'Müdür yardımcısının bilgisayarı' });
    assert.equal(r.data.gonderilen, 1);
    const mine = (await st.api('GET', 'commands/mine')).data;
    assert.equal(mine.length, 1);
    assert.equal(mine[0].gonderen, 'Mehmet Kaya');
    await st.api('POST', 'commands/ack', { id: mine[0].id });
    const live = (await t1.api('GET', `live&class_id=${classId}`)).data.students.find((x) => x.id === students[0].id);
    assert.deepEqual(live.biletler, [{ task_id: 'i1-g5', tamam: false, okundu: true }]);
    const a = await st.api('POST', 'attempts/start', { task_id: 'i1-g5', mode: 'uygula' });
    await st.api('POST', 'attempts/submit', { attempt_id: a.data.attempt_id, events: [{ type: 'x', t: 1 }], final_state: fullState });
    assert.equal((await st.api('GET', 'commands/mine')).data.length, 0);
    const det = await t1.api('GET', `attempt&id=${a.data.attempt_id}`);
    assert.equal(det.data.events.length, 1);
    assert.equal((await t2.api('GET', `attempt&id=${a.data.attempt_id}`)).status, 403);
  });
  await step('kum havuzu: öğretmen izlerken ekran görüntüsü gelir', async () => {
    assert.equal((await st.api('POST', 'presence', { station: '', task_id: '', info: 'Kum havuzu · BIOS · 0/14' })).data.izle, false);
    await st.api('POST', 'state/save', { scope: 'kum-havuzu', data: { st: {}, gunluk: [{ t: '09:00', m: 'Bilgisayarı açtı' }], ozet: [{ m: 'x', ok: false }] }, version: 0 });
    const v1 = await t1.api('GET', `sandbox/view&student_id=${students[0].id}`);
    assert.equal(v1.data.ekran, null);
    assert.equal(v1.data.gunluk[0].m, 'Bilgisayarı açtı');
    assert.equal((await st.api('POST', 'presence', { station: '', task_id: '', info: 'Kum havuzu' })).data.izle, true);
    assert.equal((await st.api('POST', 'sandbox/screen', { img: 'data:image/png;base64,AAAA' })).status, 400);
    await st.api('POST', 'sandbox/screen', { img: 'data:image/jpeg;base64,/9j/AAAA' });
    assert.equal((await t1.api('GET', `sandbox/view&student_id=${students[0].id}`)).data.ekran.img, 'data:image/jpeg;base64,/9j/AAAA');
    assert.equal((await t2.api('GET', `sandbox/view&student_id=${students[0].id}`)).status, 403);
    assert.equal((await st.api('GET', `sandbox/view&student_id=${students[0].id}`)).status, 403);
  });
  await step('durum kaydetme ve sürüm çakışması', async () => {
    assert.equal((await st.api('POST', 'state/save', { scope: 'vm', data: { a: 1 }, version: 0 })).data.version, 1);
    assert.equal((await st.api('POST', 'state/save', { scope: 'vm', data: { a: 2 }, version: 1 })).data.version, 2);
    assert.equal((await st.api('POST', 'state/save', { scope: 'vm', data: { a: 3 }, version: 1 })).status, 409);
    assert.deepEqual((await st.api('GET', 'state&scope=vm')).data.data, { a: 2 });
  });
  await step('canlı izleme', async () => {
    await st.api('POST', 'presence', { station: 'i1', task_id: 'i1-g5', info: 'Kontrol listesi' });
    const r = await t1.api('GET', `live&class_id=${classId}`);
    const me = r.data.students.find((s) => s.id === students[0].id);
    assert.equal(me.task_id, 'i1-g5');
    assert.ok(me.seen <= 2);
  });
  await step('portal bağlantısıyla öğrenci girişi, sınıfa otomatik ekleme', async () => {
    const p = { uid: '2042', name: 'Deniz Aksoy', role: 'ogrenci', sinif: '9-A', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300, jti: randomBytes(16).toString('hex') };
    const link = portalLink(p);
    const r = await portalSt.req('GET', link, undefined, { raw: true });
    assert.equal(r.status, 302);
    const u = await portalSt.refresh();
    assert.equal(u.name, 'Deniz Aksoy');
    assert.equal(u.portal, true);
    assert.equal(u.has_password, false);
    portalId = u.id;
    const list = (await t1.api('GET', `students&class_id=${classId}`)).data;
    assert.ok(list.some((s) => s.id === portalId));
    // Aynı bağlantı ikinci kez kullanılamaz
    const again = await new Client().req('GET', link);
    assert.equal(again.status, 403);
  });
  await step('portal bağlantısı: imza bozuksa ve süre dolmuşsa reddedilir', async () => {
    const now = Math.floor(Date.now() / 1000);
    const link = portalLink({ uid: '1', name: 'X', exp: now - 100, jti: 'a1' });
    assert.equal((await new Client().req('GET', link)).status, 403);
    const bad = portalLink({ uid: '1', name: 'X', exp: now + 100, jti: 'a2' }).slice(0, -3) + 'abc';
    assert.equal((await new Client().req('GET', bad)).status, 403);
  });
  await step('portal öğrencisine öğretmen şifre verir → portal dışından da girer', async () => {
    const r = await t1.api('POST', 'students/reset-password', { id: portalId });
    assert.equal(r.data.username, 'deniz.aksoy');
    const c = new Client();
    assert.equal((await c.login(r.data.username, r.data.password)).status, 200);
    assert.equal((await c.refresh()).id, portalId);
  });
  await step('portal öğretmeni sınıflara otomatik bağlanmaz', async () => {
    const now = Math.floor(Date.now() / 1000);
    const c = new Client();
    await c.req('GET', portalLink({ uid: 'T9', name: 'Portal Öğretmen', role: 'ogretmen', sinif: '9-A', exp: now + 200, jti: randomBytes(8).toString('hex') }));
    const u = await c.refresh();
    assert.equal(u.role, 'ogretmen');
    assert.deepEqual((await c.api('GET', 'classes')).data, []);
    assert.ok((await c.api('GET', 'classes/all')).data.some((x) => x.name === '9-A'));
  });
  await step('hesap birleştirme (portal + elle açılan hesap)', async () => {
    const ok = await t1.api('POST', 'students/merge', { keep_id: portalId, remove_id: students[1].id });
    assert.equal(ok.status, 200);
    const list = (await t1.api('GET', `students&class_id=${classId}`)).data;
    assert.ok(!list.some((s) => s.id === students[1].id));
  });
  await step('rapor: kazanım puanları', async () => {
    const r = await t1.api('GET', `report&class_id=${classId}`);
    const o = r.data.outcomes[students[0].id];
    assert.equal(o.Y1, 100);
    assert.equal(o.B6, 100);
    assert.equal(r.data.tasks.find((t) => t.user_id === students[0].id).mode, 'degerlendir');
  });
  await step('5 hatalı denemeden sonra hesap kilitlenir', async () => {
    const c = new Client();
    for (let i = 0; i < 5; i++) await c.login(students[2].username, 'yanlis');
    const r = await c.login(students[2].username, students[2].password);
    assert.equal(r.status, 429);
  });
  await step('öğrenci kendi şifresini değiştirir', async () => {
    const r = await st.api('POST', 'auth/password', { current: students[0].password, new: 'yeni1234' });
    assert.equal(r.status, 200);
    assert.equal((await new Client().login(students[0].username, 'yeni1234')).status, 200);
  });
  await step('öğrenci silinir', async () => {
    assert.equal((await t1.api('POST', 'students/delete', { id: students[0].id })).status, 200);
    assert.equal((await st.refresh()), null);
  });
  console.log(`\n${passed} API testi geçti.`);
} catch (e) {
  console.error(e);
  if (srvErr) console.error('--- PHP sunucu çıktısı ---\n' + srvErr.split('\n').filter((l) => !/Accepted|Closing|\[200\]|\[302\]|\[40\d\]|\[419\]|\[429\]/.test(l)).slice(-30).join('\n'));
  process.exitCode = 1;
} finally {
  srv.kill();
  rmSync(tmp, { recursive: true, force: true });
}
