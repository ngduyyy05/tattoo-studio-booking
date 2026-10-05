// Input validation for admin content, ported from the original server.mjs.
import { randomBytes } from 'node:crypto';
import { validDate } from './domain.js';

export const contentKinds = ['artists', 'styles', 'services', 'portfolio', 'blog'];
export const fail =(message, code = 400) => { throw Object.assign(new Error(message), { code }); };
export function text(value, max = 2000) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
export function required(value, label, max = 200) { const result = text(value, max); if (!result) fail(`Vui lòng nhập ${label}.`); return result; }
export function number(value, min, max, label) { const n = Number(value); if (!Number.isInteger(n) || n < min || n > max) fail(`${label} phải từ ${min} đến ${max}.`); return n; }
export function url(value, image = false) {
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
export function days(value) { if (!Array.isArray(value) || !value.length || value.some(d => !Number.isInteger(d) || d < 0 || d > 6)) fail('Chọn ít nhất một ngày làm việc.'); return [...new Set(value)]; }

// Readable, URL-friendly id for new content: "Minh Trần" -> "minh-tran-3f2a".
export function slugId(name) {
  const base = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return `${base || 'item'}-${randomBytes(2).toString('hex')}`;
}

export function entity(kind, body, data, previous) {
  if (kind === 'artists') {
    const styleIds = Array.isArray(body.styleIds) ? body.styleIds : [];
    if (styleIds.some(id => !data.styles.some(s => s.id === id))) fail('Phong cách không tồn tại.');
    const daysOff = Array.isArray(body.daysOff) ? body.daysOff : [];
    if (daysOff.some(d => !validDate(d))) fail('Ngày nghỉ không hợp lệ.');
    return { name: required(body.name, 'tên artist'), specialty: required(body.specialty, 'chuyên môn'), years: number(body.years, 0, 80, 'Số năm kinh nghiệm'), bio: text(body.bio), styleIds: [...new Set(styleIds)], workDays: days(body.workDays), daysOff, image: url(body.image, true), visible: body.visible !== false };
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

export function studioSettings(b) {
  const s = { name: required(b.name, 'tên studio'), address: required(b.address, 'địa chỉ'), phone: required(b.phone, 'điện thoại'), email: required(b.email, 'email'), hours: text(b.hours), social: url(b.social), logo: url(b.logo, true), heroTitle: required(b.heroTitle, 'tiêu đề trang chủ'), heroText: text(b.heroText), about: text(b.about), policy: required(b.policy, 'chính sách'), openDays: days(b.openDays), openTime: text(b.openTime), closeTime: text(b.closeTime), slotStep: number(b.slotStep, 15, 120, 'Bước khung giờ') };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) fail('Email không hợp lệ.');
  if (![s.openTime, s.closeTime].every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) || s.openTime >= s.closeTime) fail('Giờ đóng cửa phải sau giờ mở cửa.');
  return s;
}
