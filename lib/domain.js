export const statuses = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Completed: 'Hoàn thành', Cancelled: 'Đã hủy' };
export const transitions = { Pending: ['Confirmed', 'Cancelled'], Confirmed: ['Completed', 'Cancelled'], Completed: [], Cancelled: [] };
export function today(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export const minutes = value => /^\d{2}:\d{2}$/.test(value || '') ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;
export function validDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date || '') && !isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
export function slots(data, artistId, serviceId, date, ignoreId = '', now = new Date(), durationOverride) {
  const artist = data.artists.find(a => a.id === artistId && a.visible);
  const service = data.services.find(s => s.id === serviceId && s.visible !== false);
  if (!artist || !service || !validDate(date) || date < today(now)) return [];
  const day = new Date(date + 'T12:00:00+07:00').getUTCDay();
  if (!data.studio.openDays.includes(day) || !artist.workDays.includes(day) || artist.daysOff.includes(date)) return [];
  const duration = durationOverride ?? service.duration;
  const result = [];
  for (let start = minutes(data.studio.openTime); start + duration <= minutes(data.studio.closeTime); start += data.studio.slotStep) {
    const time = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
    if (Date.parse(`${date}T${time}:00+07:00`) <= now.getTime()) continue;
    const conflict = data.bookings.some(b => b.id !== ignoreId && b.artistId === artistId && b.date === date && b.status !== 'Cancelled' && start < minutes(b.time) + b.duration && start + duration > minutes(b.time));
    if (!conflict) result.push(time);
  }
  return result;
}
export function bookingError(data, booking, ignoreId = '', now = new Date()) {
  if (!booking.customerName?.trim() || !booking.placement?.trim() || !booking.notes?.trim()) return 'Vui lòng nhập tên, vị trí xăm và ý tưởng.';
  if (!/^(?:0\d{9}|\+84\d{9})$/.test((booking.phone || '').replace(/[\s.-]/g, ''))) return 'Số điện thoại cần có 10 chữ số hoặc dạng +84.';
  if (booking.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) return 'Email không hợp lệ.';
  if (!slots(data, booking.artistId, booking.serviceId, booking.date, ignoreId, now).includes(booking.time)) return 'Khung giờ không còn trống hoặc ngoài lịch làm việc. Vui lòng chọn lại.';
  return '';
}
