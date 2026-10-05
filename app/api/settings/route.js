import { json, route, readBody } from '@/lib/http';
import { getRepo } from '@/lib/repo';
import { studioSettings } from '@/lib/validate';

export const PUT = route(async req => {
  const s = studioSettings(await readBody(req));
  await (await getRepo()).mutate((state, tx) => tx.saveStudio(s));
  return json(s);
}, { auth: true });
