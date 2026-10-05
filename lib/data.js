import { connection } from 'next/server';
import { getRepo } from './repo/index.js';

// What customers may see: no bookings, only visible content, no work by hidden artists.
export function publicData(state) {
  const { bookings, ...d } = state;
  d.artists = d.artists.filter(a => a.visible);
  d.services = d.services.filter(s => s.visible);
  d.portfolio = d.portfolio.filter(p => p.visible && d.artists.some(a => a.id === p.artistId));
  d.blog = d.blog.filter(b => b.visible);
  return d;
}

// For server components: render per request so admin edits show up immediately.
export async function loadPublic() {
  await connection();
  return publicData(await (await getRepo()).read());
}

export const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
export const siteUrl = () => (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
