import { json, route } from '@/lib/http';
import { getRepo } from '@/lib/repo';
import { publicData } from '@/lib/data';

export const GET = route(async () => json(publicData(await (await getRepo()).read())));
