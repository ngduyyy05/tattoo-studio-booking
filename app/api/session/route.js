import { json, route, isAuthenticated } from '@/lib/http';

export const GET = route(async req => json({ authenticated: await isAuthenticated(req) }));
