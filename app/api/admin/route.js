import { json, route } from '@/lib/http';
import { getRepo } from '@/lib/repo';

export const GET = route(async () => json(await (await getRepo()).read()), { auth: true });
