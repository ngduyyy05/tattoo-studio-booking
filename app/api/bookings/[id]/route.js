import { json, route, readBody } from '@/lib/http';
import { getRepo } from '@/lib/repo';
import { slots, bookingError, transitions } from '@/lib/domain';
import { fail, text } from '@/lib/validate';

export const PATCH = route(async (req, { id }) => {
  const b = await readBody(req);
  const updated = await (await getRepo()).mutate(async (state, tx) => {
    const item = state.bookings.find(x => x.id === id);
    if (!item) fail('Không tìm thấy lịch hẹn.', 404);
    const at = new Date().toISOString();
    if (b.status) {
      if (!transitions[item.status]?.includes(b.status)) fail('Không thể chuyển trạng thái này.');
      if (b.status === 'Confirmed' && !slots(state, item.artistId, item.serviceId, item.date, item.id, new Date(), item.duration).includes(item.time)) fail('Lịch không còn phù hợp giờ làm việc. Hãy đổi lịch trước khi xác nhận.');
      if (b.status === 'Completed' && Date.parse(`${item.date}T${item.time}:00+07:00`) + item.duration * 60000 > Date.now()) fail('Chỉ hoàn thành sau khi kết thúc thời gian hẹn.');
      item.status = b.status;
      item.history.push({ status: b.status, at });
    } else {
      if (!['Pending', 'Confirmed'].includes(item.status)) fail('Chỉ đổi lịch đang chờ hoặc đã xác nhận.');
      const next = { ...item, artistId: text(b.artistId), serviceId: text(b.serviceId), date: text(b.date), time: text(b.time) };
      const error = bookingError(state, next, item.id);
      if (error) fail(error, 409);
      next.duration = state.services.find(s => s.id === next.serviceId).duration;
      next.history = [...item.history, { action: 'reschedule', from: `${item.date} ${item.time}`, to: `${next.date} ${next.time}`, at }];
      Object.assign(item, next);
    }
    await tx.updateBooking(item);
    return item;
  });
  return json(updated);
}, { auth: true });
