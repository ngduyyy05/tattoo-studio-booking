import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingEmailMessage, sendBookingEmail } from '../lib/booking-email.js';

const booking = { id: 'abc12345-6789', customerName: 'Nguyễn An', email: 'an@example.com', phone: '0901234567', date: '2026-11-02', time: '14:00', duration: 60, placement: 'Cổ tay', size: '5 cm', notes: 'Hoa sen' };
const studio = { name: 'Inkline Studio', email: 'studio@example.com', phone: '0901222333', address: '42 Nguyễn Huệ', policy: 'Studio sẽ liên hệ xác nhận.' };
const artist = { name: 'Minh Trần' };
const service = { name: 'Xăm nhỏ' };

test('email gửi đúng khách và ghi rõ lịch đang chờ xác nhận', () => {
  const mail = bookingEmailMessage(booking, studio, artist, service, 'send@example.com');
  assert.equal(mail.to, booking.email);
  assert.equal(mail.from.address, 'send@example.com');
  for (const value of ['Nguyễn An', 'abc12345-6789', 'Minh Trần', 'Xăm nhỏ', '02/11/2026', '14:00', 'Hoa sen', 'chờ studio xác nhận']) assert.ok(mail.text.includes(value), value);
});

test('SMTP đã cấu hình chuyển đúng email cho transport', async () => {
  const saved = Object.fromEntries(['SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM', 'SMTP_USER', 'SMTP_PASSWORD'].map(key => [key, process.env[key]]));
  Object.assign(process.env, { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_FROM: 'send@example.com', SMTP_USER: 'send@example.com', SMTP_PASSWORD: 'secret' });
  let options, message;
  try {
    const status = await sendBookingEmail(booking, studio, artist, service, config => {
      options = config;
      return { async sendMail(mail) { message = mail; } };
    });
    assert.equal(status, 'sent');
    assert.equal(options.secure, true);
    assert.equal(options.auth.user, 'send@example.com');
    assert.equal(message.to, 'an@example.com');
  } finally {
    for (const [key, value] of Object.entries(saved)) value === undefined ? delete process.env[key] : process.env[key] = value;
  }
});
