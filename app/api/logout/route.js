import { json, route, sessionCookie, SESSION_COOKIE } from '@/lib/http';
import { getRepo } from '@/lib/repo';

export const POST = route(async req => {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await (await getRepo()).deleteSession(token);
  return json({ ok: true }, 200, { headers: { 'Set-Cookie': sessionCookie('', 0) } });
});
