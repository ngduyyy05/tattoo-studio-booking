import { json, route, readBody } from '@/lib/http';
import { getRepo } from '@/lib/repo';
import { entity, fail, slugId, contentKinds } from '@/lib/validate';

export const POST = route(async (req, { kind }) => {
  if (!contentKinds.includes(kind)) fail('Không tìm thấy chức năng.', 404);
  const b = await readBody(req);
  const item = await (await getRepo()).mutate(async (state, tx) => {
    const value = entity(kind, b, state);
    const created = { ...value, id: slugId(value.name || value.title) };
    await tx.save(kind, created);
    return created;
  });
  return json(item, 201);
}, { auth: true });
