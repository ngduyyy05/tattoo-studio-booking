import { randomUUID } from 'node:crypto';
import { json, route, limit, readBody } from '@/lib/http';
import { getRepo } from '@/lib/repo';
import { bookingError } from '@/lib/domain';
import { fail, text, url } from '@/lib/validate';

const fields = ['customerName', 'phone', 'email', 'artistId', 'serviceId', 'date', 'time', 'placement', 'size', 'notes'];

export const POST = route(async req => {
  limit(req, 'booking', 20, 3600000);
  const b = await readBody(req);
  const booking = Object.fromEntries(fields.map(k => [k, text(b[k])]));
  const reference = url(b.reference, true);
  // Availability is re-checked inside the write lock, so concurrent requests cannot overlap.
  const created = await (await getRepo()).mutate(async (state, tx) => {
    const error = bookingError(state, booking);
    if (error) fail(error, 409);
    const now = new Date().toISOString();
    const item = { ...booking, reference, id: randomUUID(), status: 'Pending', duration: state.services.find(s => s.id === booking.serviceId).duration, createdAt: now, history: [{ status: 'Pending', at: now }] };
    await tx.insertBooking(item);
    return item;
  });
  return json({ id: created.id, status: created.status }, 201);
});
