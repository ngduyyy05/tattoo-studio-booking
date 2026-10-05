import Link from 'next/link';
import { loadPublic } from '@/lib/data';
import { SectionHeading, Empty } from '@/components/ui';

export const metadata = { title: 'Tattoo styles', description: 'Các phong cách tattoo tại studio: Fine Line, Minimal, Blackwork, Japanese…', alternates: { canonical: '/styles' } };

export default async function Styles() {
  const d = await loadPublic();
  return (
    <section className="section tonal">
      <SectionHeading as="h1" kicker="Tattoo styles" title="Chọn một phong cách." />
      <div className="style-list">{d.styles.length ? d.styles.map(s => (
        <article className="style-pill" key={s.id}>
          <strong>{s.name}</strong><span>{s.description}</span>
          <span className="muted">{d.portfolio.filter(p => p.styleId === s.id).length} tác phẩm · {d.artists.filter(a => a.styleIds.includes(s.id)).length} artist</span>
          <Link className="button ghost small" href={`/styles/${s.id}`}>Xem tác phẩm</Link>
        </article>
      )) : <Empty>Chưa có phong cách.</Empty>}</div>
    </section>
  );
}
