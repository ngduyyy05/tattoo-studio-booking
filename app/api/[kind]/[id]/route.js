import { json, route, readBody } from '@/lib/http';
import { getRepo } from '@/lib/repo';
import { entity, fail, contentKinds } from '@/lib/validate';

function existing(state, kind, id) {
  if (!contentKinds.includes(kind)) fail('Không tìm thấy chức năng.', 404);
  const previous = state[kind].find(x => x.id === id);
  if (!previous) fail('Nội dung không còn tồn tại.', 404);
  return previous;
}

export const PUT = route(async (req, { kind, id }) => {
  const b = await readBody(req);
  const item = await (await getRepo()).mutate(async (state, tx) => {
    const previous = existing(state, kind, id);
    const updated = { ...entity(kind, b, state, previous), id };
    await tx.save(kind, updated);
    return updated;
  });
  return json(item);
}, { auth: true });

export const DELETE = route(async (req, { kind, id }) => {
  await (await getRepo()).mutate(async (state, tx) => {
    existing(state, kind, id);
    if (kind === 'artists' && (state.bookings.some(x => x.artistId === id) || state.portfolio.some(x => x.artistId === id))) fail('Artist đã có tác phẩm hoặc lịch hẹn. Hãy ẩn thay vì xóa.');
    if (kind === 'services' && state.bookings.some(x => x.serviceId === id)) fail('Dịch vụ đã có lịch hẹn. Hãy ẩn thay vì xóa.');
    if (kind === 'styles' && (state.artists.some(x => x.styleIds.includes(id)) || state.portfolio.some(x => x.styleId === id))) fail('Phong cách đang được sử dụng. Gỡ liên kết trước khi xóa.');
    await tx.remove(kind, id);
  });
  return json({ ok: true });
}, { auth: true });
