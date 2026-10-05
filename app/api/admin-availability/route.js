import { json, route } from '@/lib/http';
import { getRepo } from '@/lib/repo';
import { slots } from '@/lib/domain';

export const GET = route(async req => {
  const q = req.nextUrl.searchParams;
  return json({ times: slots(await (await getRepo()).read(), q.get('artistId'), q.get('serviceId'), q.get('date'), q.get('ignoreId') || '') });
}, { auth: true });
