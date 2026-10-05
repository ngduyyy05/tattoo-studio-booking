import { randomBytes, timingSafeEqual } from 'node:crypto';
import { json, route, limit, readBody, sessionCookie } from '@/lib/http';
import { getRepo, hashPassword } from '@/lib/repo';
import { fail, text } from '@/lib/validate';

export const POST = route(async req => {
  limit(req, 'login', 10, 15 * 60000);
  const b = await readBody(req);
  const repo = await getRepo();
  const user = await repo.findUser(text(b.username));
  // Hash even for unknown users so response time does not reveal which usernames exist.
  const hash = Buffer.from(hashPassword(text(b.password, 256), user?.salt || 'invalid'), 'hex');
  if (!user || !timingSafeEqual(hash, Buffer.from(user.hash, 'hex'))) fail('Sai tài khoản hoặc mật khẩu.', 401);
  const token = randomBytes(32).toString('hex');
  await repo.createSession(token, user.id, Date.now() + 8 * 3600000);
  return json({ authenticated: true }, 200, { headers: { 'Set-Cookie': sessionCookie(token, 8 * 3600) } });
});
