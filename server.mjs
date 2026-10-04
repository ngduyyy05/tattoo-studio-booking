import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import seed from './seed.mjs';
import { slots, bookingError, transitions, minutes, validDate } from './domain.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(root, 'data', 'studio.sqlite');
if (dbPath !== ':memory:') mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, content TEXT NOT NULL); CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL);');
const initial = structuredClone(seed);
initial.studio = { ...initial.studio, email: 'hello@inkline.vn', social: '', logo: '', heroTitle: 'Mỗi hình xăm, một câu chuyện.', heroText: 'Tìm phong cách của bạn. Gặp người nghệ sĩ phù hợp. Cùng tạo nên dấu ấn riêng.', about: 'Inkline là không gian dành cho những ý tưởng mang dấu ấn cá nhân. Chúng tôi lắng nghe câu chuyện của bạn, tư vấn thiết kế và đồng hành từ buổi hẹn đầu tiên.', policy: 'Studio phản hồi trong 24 giờ. Yêu cầu chờ xác nhận sẽ giữ khung giờ cho bạn. Vui lòng liên hệ studio nếu cần đổi hoặc hủy lịch.', openTime: '10:00', closeTime: '20:00', slotStep: 30, openDays: [0, 2, 3, 4, 5, 6] };
initial.artists.forEach(a => Object.assign(a, { workDays: [0, 1, 2, 3, 4, 5, 6], daysOff: [], image: '' }));
initial.services.forEach((s, i) => Object.assign(s, { duration: [30, 60, 120, 180][i], visible: true }));
initial.portfolio.forEach(p => Object.assign(p, { image: '', description: '', visible: true }));
initial.blog.forEach(b => Object.assign(b, { content: b.content || b.excerpt, visible: true }));
initial.bookings = [];
if (!db.prepare('SELECT id FROM state WHERE id=1').get()) db.prepare('INSERT INTO state VALUES (1, ?)').run(JSON.stringify(initial));
if (!db.prepare('SELECT username FROM users LIMIT 1').get()) {
  const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString('base64url');
  if (password.length < 10) throw new Error('ADMIN_PASSWORD phải dài ít nhất 10 ký tự.');
  const salt = randomBytes(16).toString('hex');
  db.prepare('INSERT INTO users VALUES (?, ?, ?)').run('admin', salt, scryptSync(password, salt, 64).toString('hex'));
  if (!process.env.ADMIN_PASSWORD) console.log(`Tài khoản quản trị: admin / ${password} (lưu lại mật khẩu này)`);
}
const load = () => JSON.parse(db.prepare('SELECT content FROM state WHERE id=1').get().content);
const save = data => db.prepare('UPDATE state SET content=? WHERE id=1').run(JSON.stringify(data));
const fail = (message, code = 400) => { throw Object.assign(new Error(message), { code }); };
function text(value, max = 2000) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function required(value, label, max = 200) { const result = text(value, max); if (!result) fail(`Vui lòng nhập ${label}.`); return result; }
function number(value, min, max, label) { const n = Number(value); if (!Number.isInteger(n) || n < min || n > max) fail(`${label} phải từ ${min} đến ${max}.`); return n; }
function url(value, image = false) {
  if (typeof value === 'string' && value.length > (image ? 1500000 : 2048)) fail('Đường dẫn hoặc ảnh vượt giới hạn cho phép.');
  const str = text(value, image ? 1500000 : 2048);
  if (!str) return '';
  if (image && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(str)) {
    if (Buffer.from(str.split(',')[1], 'base64').length > 1024 * 1024) fail('Ảnh không được vượt quá 1 MB.');
    return str;
  }
  try { const u = new URL(str); if (u.protocol === 'https:' || u.protocol === 'http:') return u.href; } catch {}
  fail(image ? 'Ảnh phải là PNG/JPEG/WebP dưới 1 MB hoặc URL http(s).' : 'Đường dẫn phải bắt đầu bằng http:// hoặc https://.');
}
function days(value) { if (!Array.isArray(value) || !value.length || value.some(d => !Number.isInteger(d) || d < 0 || d > 6)) fail('Chọn ít nhất một ngày làm việc.'); return [...new Set(value)]; }
function entity(kind, body, data, previous) {
  if (kind === 'artists') {
    const styleIds = Array.isArray(body.styleIds) ? body.styleIds : [];
    if (styleIds.some(id => !data.styles.some(s => s.id === id))) fail('Phong cách không tồn tại.');
    const daysOff = Array.isArray(body.daysOff) ? body.daysOff : [];
    if (daysOff.some(d => !validDate(d))) fail('Ngày nghỉ không hợp lệ.');
    return { name: required(body.name, 'tên artist'), specialty: required(body.specialty, 'chuyên môn'), years: number(body.years, 0, 80, 'Số năm kinh nghiệm'), bio: text(body.bio), styleIds, workDays: days(body.workDays), daysOff, image: url(body.image, true), visible: body.visible !== false };
  }
  if (kind === 'styles') return { name: required(body.name, 'tên phong cách'), description: text(body.description) };
  if (kind === 'services') return { name: required(body.name, 'tên dịch vụ'), price: required(body.price, 'giá tham khảo'), description: text(body.description), duration: number(body.duration, 15, 600, 'Thời lượng (phút)'), visible: body.visible !== false };
  if (kind === 'portfolio') {
    if (!data.artists.some(a => a.id === body.artistId) || !data.styles.some(s => s.id === body.styleId)) fail('Chọn artist và phong cách hợp lệ.');
    return { title: required(body.title, 'tên tác phẩm'), artistId: body.artistId, styleId: body.styleId, placement: required(body.placement, 'vị trí'), image: url(body.image, true), description: text(body.description), visible: body.visible !== false, gradient: previous?.gradient || 'linear-gradient(135deg, #241d1b, #875045)' };
  }
  if (kind === 'blog') return { title: required(body.title, 'tiêu đề'), tag: required(body.tag, 'chủ đề'), excerpt: required(body.excerpt, 'tóm tắt', 500), content: required(body.content, 'nội dung', 20000), visible: body.visible !== false };
  fail('Loại nội dung không hợp lệ.', 404);
}
const attempts = new Map();
function limit(key, max, windowMs) {
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const state = attempts.get(key) || { count: 0, until: now + windowMs };
  if (++state.count > max) fail('Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.', 429);
  attempts.set(key, state);
}
async function body(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 2000000) fail('Dữ liệu vượt quá giới hạn 2 MB.', 413); chunks.push(chunk); }
  const result = Buffer.concat(chunks).toString('utf8');
  try { const value = JSON.parse(result || '{}'); if (!value || Array.isArray(value) || typeof value !== 'object') fail('Dữ liệu không hợp lệ.'); return value; } catch { fail('Dữ liệu JSON không hợp lệ.'); }
}
function session(req) {
  const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('inkline_session='))?.slice(16);
  return token && db.prepare('SELECT token FROM sessions WHERE token=? AND expires>?').get(token, Date.now())?.token;
}
function send(res, value, code = 200, headers = {}) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }); res.end(JSON.stringify(value)); }
const cookie = (token, age) => `inkline_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${process.env.COOKIE_SECURE === '1' ? '; Secure' : ''}`;

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https: http:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  try {
    const u = new URL(req.url, 'http://localhost');
    const route = u.pathname;
    if (!route.startsWith('/api/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') fail('Phương thức không hỗ trợ.', 405);
      const files = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'], '/domain.mjs': ['domain.mjs', 'text/javascript'], '/assets/tattoo-studio-hero.png': ['assets/tattoo-studio-hero.png', 'image/png'] };
      if (!files[route]) fail('Không tìm thấy trang.', 404);
      const [file, type] = files[route]; res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-cache' }); res.end(req.method === 'HEAD' ? undefined : readFileSync(path.join(root, file))); return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) fail('Nguồn yêu cầu không hợp lệ.', 403);
      if (!req.headers['content-type']?.startsWith('application/json')) fail('Yêu cầu phải là JSON.', 415);
    }
    if (route === '/api/session' && req.method === 'GET') return send(res, { authenticated: !!session(req) });
    if (route === '/api/login' && req.method === 'POST') {
      limit('login:' + req.socket.remoteAddress, 10, 15 * 60000);
      const b = await body(req); const user = db.prepare('SELECT * FROM users WHERE username=?').get(text(b.username));
      const hash = scryptSync(text(b.password, 256), user?.salt || 'invalid', 64);
      if (!user || !timingSafeEqual(hash, Buffer.from(user.hash, 'hex'))) fail('Sai tài khoản hoặc mật khẩu.', 401);
      const token = randomBytes(32).toString('hex');
      db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
      db.prepare('INSERT INTO sessions VALUES (?, ?)').run(token, Date.now() + 8 * 3600000);
      return send(res, { authenticated: true }, 200, { 'Set-Cookie': cookie(token, 8 * 3600) });
    }
    if (route === '/api/logout' && req.method === 'POST') {
      db.prepare('DELETE FROM sessions WHERE token=?').run(session(req) || '');
      return send(res, { ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
    }
    if (route === '/api/public' && req.method === 'GET') {
      const d = load(); delete d.bookings;
      d.artists = d.artists.filter(a => a.visible);
      d.services = d.services.filter(s => s.visible);
      d.portfolio = d.portfolio.filter(p => p.visible && d.artists.some(a => a.id === p.artistId));
      d.blog = d.blog.filter(b => b.visible);
      return send(res, d);
    }
    if (route === '/api/availability' && req.method === 'GET') return send(res, { times: slots(load(), u.searchParams.get('artistId'), u.searchParams.get('serviceId'), u.searchParams.get('date')) });
    if (route === '/api/bookings' && req.method === 'POST') {
      limit('booking:' + req.socket.remoteAddress, 20, 3600000);
      const b = await body(req); const d = load();
      const booking = Object.fromEntries(['customerName', 'phone', 'email', 'artistId', 'serviceId', 'date', 'time', 'placement', 'size', 'notes'].map(k => [k, text(b[k])]));
      const error = bookingError(d, booking); if (error) fail(error, 409);
      booking.reference = url(b.reference, true);
      Object.assign(booking, { id: randomUUID(), status: 'Pending', duration: d.services.find(s => s.id === booking.serviceId).duration, createdAt: new Date().toISOString(), history: [{ status: 'Pending', at: new Date().toISOString() }] });
      d.bookings.unshift(booking); save(d);
      return send(res, { id: booking.id, status: booking.status }, 201);
    }
    if (!session(req)) fail('Vui lòng đăng nhập quản trị.', 401);
    if (route === '/api/admin' && req.method === 'GET') return send(res, load());
    if (route === '/api/settings' && req.method === 'PUT') {
      const b = await body(req); const d = load();
      const s = { name: required(b.name, 'tên studio'), address: required(b.address, 'địa chỉ'), phone: required(b.phone, 'điện thoại'), email: required(b.email, 'email'), hours: text(b.hours), social: url(b.social), logo: url(b.logo, true), heroTitle: required(b.heroTitle, 'tiêu đề trang chủ'), heroText: text(b.heroText), about: text(b.about), policy: required(b.policy, 'chính sách'), openDays: days(b.openDays), openTime: text(b.openTime), closeTime: text(b.closeTime), slotStep: number(b.slotStep, 15, 120, 'Bước khung giờ') };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) fail('Email không hợp lệ.');
      if (![s.openTime, s.closeTime].every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) || minutes(s.openTime) >= minutes(s.closeTime)) fail('Giờ đóng cửa phải sau giờ mở cửa.');
      d.studio = s; save(d); return send(res, s);
    }
    const bookingMatch = route.match(/^\/api\/bookings\/([^/]+)$/);
    if (bookingMatch && req.method === 'PATCH') {
      const b = await body(req); const d = load(); const item = d.bookings.find(x => x.id === bookingMatch[1]);
      if (!item) fail('Không tìm thấy lịch hẹn.', 404);
      if (b.status) {
        if (!transitions[item.status]?.includes(b.status)) fail('Không thể chuyển trạng thái này.');
        if (b.status === 'Confirmed' && !slots(d, item.artistId, item.serviceId, item.date, item.id, new Date(), item.duration).includes(item.time)) fail('Lịch không còn phù hợp giờ làm việc. Hãy đổi lịch trước khi xác nhận.');
        if (b.status === 'Completed' && Date.parse(`${item.date}T${item.time}:00+07:00`) + item.duration * 60000 > Date.now()) fail('Chỉ hoàn thành sau khi kết thúc thời gian hẹn.');
        item.status = b.status;
        item.history.push({ status: b.status, at: new Date().toISOString() });
      } else {
        if (!['Pending', 'Confirmed'].includes(item.status)) fail('Chỉ đổi lịch đang chờ hoặc đã xác nhận.');
        const next = { ...item, artistId: text(b.artistId), serviceId: text(b.serviceId), date: text(b.date), time: text(b.time) };
        const error = bookingError(d, next, item.id); if (error) fail(error, 409);
        next.duration = d.services.find(s => s.id === next.serviceId).duration;
        next.history.push({ action: 'reschedule', from: `${item.date} ${item.time}`, to: `${next.date} ${next.time}`, at: new Date().toISOString() });
        Object.assign(item, next);
      }
      save(d); return send(res, item);
    }
    if (route === '/api/admin-availability' && req.method === 'GET') return send(res, { times: slots(load(), u.searchParams.get('artistId'), u.searchParams.get('serviceId'), u.searchParams.get('date'), u.searchParams.get('ignoreId')) });
    const match = route.match(/^\/api\/(artists|styles|services|portfolio|blog)(?:\/([^/]+))?$/);
    if (match) {
      const [, kind, id] = match;
      // Read body before state to avoid lost updates while receiving concurrent requests.
      const b = ['POST', 'PUT'].includes(req.method) ? await body(req) : {};
      const d = load(); const previous = d[kind].find(x => x.id === id);
      if (id && !previous) fail('Nội dung không còn tồn tại.', 404);
      if (req.method === 'DELETE' && id) {
        if (kind === 'artists' && (d.bookings.some(x => x.artistId === id) || d.portfolio.some(x => x.artistId === id))) fail('Artist đã có tác phẩm hoặc lịch hẹn. Hãy ẩn thay vì xóa.');
        if (kind === 'services' && d.bookings.some(x => x.serviceId === id)) fail('Dịch vụ đã có lịch hẹn. Hãy ẩn thay vì xóa.');
        if (kind === 'styles' && (d.artists.some(x => x.styleIds.includes(id)) || d.portfolio.some(x => x.styleId === id))) fail('Phong cách đang được sử dụng. Gỡ liên kết trước khi xóa.');
        d[kind] = d[kind].filter(x => x.id !== id); save(d); return send(res, { ok: true });
      }
      if ((req.method === 'POST' && !id) || (req.method === 'PUT' && id)) {
        const item = { ...entity(kind, b, d, previous), id: id || randomUUID() };
        if (previous) Object.assign(previous, item); else d[kind].push(item);
        save(d); return send(res, item, previous ? 200 : 201);
      }
    }
    fail('Không tìm thấy chức năng.', 404);
  } catch (error) { if (!res.headersSent) send(res, { error: error.code && typeof error.code === 'number' ? error.message : 'Máy chủ gặp lỗi. Vui lòng thử lại.' }, typeof error.code === 'number' ? error.code : 500); if (!error.code) console.error(error); }
});
server.listen(Number(process.env.PORT || 5173), process.env.HOST || '127.0.0.1', () => console.log(`Inkline Studio: http://${process.env.HOST || '127.0.0.1'}:${server.address().port}`));
