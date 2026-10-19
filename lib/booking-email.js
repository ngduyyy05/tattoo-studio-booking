import nodemailer from 'nodemailer';

export function bookingEmailMessage(booking, studio, artist, service, from) {
  const date = booking.date.split('-').reverse().join('/');
  return {
    from: { name: studio.name, address: from },
    to: booking.email,
    replyTo: studio.email,
    subject: `${studio.name} đã nhận yêu cầu đặt lịch ${booking.id.slice(0, 8)}`,
    text: [
      `Xin chào ${booking.customerName},`,
      '',
      `${studio.name} đã nhận yêu cầu đặt lịch của bạn. Lịch hẹn đang chờ studio xác nhận; email này chưa phải xác nhận lịch.`,
      '',
      `Mã lịch hẹn: ${booking.id}`,
      `Trạng thái: Chờ xác nhận`,
      `Nghệ sĩ: ${artist.name}`,
      `Dịch vụ: ${service.name}`,
      `Ngày giờ: ${date} lúc ${booking.time} (giờ Việt Nam)`,
      `Thời lượng dự kiến: ${booking.duration} phút`,
      `Vị trí xăm: ${booking.placement}`,
      `Kích thước dự kiến: ${booking.size || 'Chưa cung cấp'}`,
      `Họ và tên: ${booking.customerName}`,
      `Số điện thoại: ${booking.phone}`,
      `Email: ${booking.email}`,
      `Ý tưởng: ${booking.notes}`,
      '',
      `Studio: ${studio.address}`,
      `Liên hệ: ${studio.phone} · ${studio.email}`,
      studio.policy,
      '',
      'Nếu cần thay đổi thông tin, vui lòng liên hệ trực tiếp với studio và cung cấp mã lịch hẹn.'
    ].join('\n')
  };
}

export async function sendBookingEmail(booking, studio, artist, service, createTransport = nodemailer.createTransport) {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM?.trim();
  if (!host || !from) return 'not_configured';
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT không hợp lệ.');
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;
  if (!!user !== !!pass) throw new Error('SMTP_USER và SMTP_PASSWORD phải được cấu hình cùng nhau.');
  const transport = createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465 && !['localhost', '127.0.0.1', '::1'].includes(host),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    ...(user ? { auth: { user, pass } } : {})
  });
  await transport.sendMail(bookingEmailMessage(booking, studio, artist, service, from));
  return 'sent';
}
