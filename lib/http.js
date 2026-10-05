// Shared helpers for API route handlers: JSON responses, CSRF/origin checks, sessions, rate limits.
import { NextResponse } from 'next/server';
import { getRepo } from './repo/index.js';
import { fail } from './validate.js';

export const SESSION_COOKIE = 'inkline_session';
export const json = (value, status = 200, init = {}) => NextResponse.json(value, { status, ...init, headers: { 'Cache-Control': 'no-store', ...init.headers } });

export function sessionCookie(token, maxAge) {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.COOKIE_SECURE === '1' ? '; Secure' : ''}`;
}

export async function isAuthenticated(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return !!token && /^[a-f0-9]{64}$/.test(token) && (await getRepo()).validSession(token);
}

const attempts = (globalThis.__inklineAttempts ??= new Map());
export function limit(req, name, max, windowMs) {
  const key = name + ':' + (req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local');
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const state = attempts.get(key) || { count: 0, until: now + windowMs };
  if (++state.count > max) fail('Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.', 429);
  attempts.set(key, state);
}

export async function readBody(req) {
  const raw = await req.text();
  if (raw.length > 2000000) fail('Dữ liệu vượt quá giới hạn 2 MB.', 413);
  let value;
  try { value = JSON.parse(raw || '{}'); } catch { fail('Dữ liệu JSON không hợp lệ.'); }
  if (!value || Array.isArray(value) || typeof value !== 'object') fail('Dữ liệu không hợp lệ.');
  return value;
}

// Wraps a route handler: rejects cross-site writes, enforces login when `auth` is set,
// and turns thrown `fail(...)` errors into JSON responses.
export function route(fn, { auth = false } = {}) {
  return async (req, ctx) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) {
        const origin = req.headers.get('origin');
        if (req.headers.get('sec-fetch-site') === 'cross-site' || (origin && new URL(origin).host !== req.headers.get('host'))) fail('Nguồn yêu cầu không hợp lệ.', 403);
        if (!req.headers.get('content-type')?.startsWith('application/json')) fail('Yêu cầu phải là JSON.', 415);
      }
      if (auth && !(await isAuthenticated(req))) fail('Vui lòng đăng nhập quản trị.', 401);
      const params = ctx?.params ? await ctx.params : {};
      return await fn(req, params);
    } catch (error) {
      if (typeof error.code === 'number') return json({ error: error.message }, error.code);
      console.error(error);
      return json({ error: 'Máy chủ gặp lỗi. Vui lòng thử lại.' }, 500);
    }
  };
}
