import { loadPublic, siteUrl } from '@/lib/data';

export default async function sitemap() {
  const d = await loadPublic();
  const base = siteUrl();
  const pages = ['', '/about', '/artists', '/styles', '/portfolio', '/services', '/booking', '/blog', '/contact'];
  return [
    ...pages.map(p => ({ url: base + p, changeFrequency: 'weekly', priority: p ? 0.8 : 1 })),
    ...d.artists.map(a => ({ url: `${base}/artists/${a.id}`, changeFrequency: 'weekly', priority: 0.7 })),
    ...d.styles.map(s => ({ url: `${base}/styles/${s.id}`, changeFrequency: 'monthly', priority: 0.6 })),
    ...d.blog.map(b => ({ url: `${base}/blog/${b.id}`, changeFrequency: 'monthly', priority: 0.6 }))
  ];
}
