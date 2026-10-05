import { notFound } from 'next/navigation';
import { loadPublic } from '@/lib/data';
import { SectionHeading, ArtistCard, PortfolioCard, Empty } from '@/components/ui';

async function find(params) {
  const { id } = await params;
  const d = await loadPublic();
  const style = d.styles.find(s => s.id === id);
  if (!style) notFound();
  return { d, style };
}

export async function generateMetadata({ params }) {
  const { style } = await find(params);
  return { title: `${style.name} tattoo`, description: style.description, alternates: { canonical: `/styles/${style.id}` } };
}

export default async function StyleDetail({ params }) {
  const { d, style } = await find(params);
  const artists = d.artists.filter(a => a.styleIds.includes(style.id));
  const works = d.portfolio.filter(p => p.styleId === style.id);
  return (
    <>
      <section className="section intro"><div><p className="eyebrow">Tattoo style</p><h1>{style.name}</h1></div><p>{style.description}</p></section>
      <section className="section">
        <SectionHeading kicker="Artist theo phong cách" title={`Ai xăm ${style.name}?`} />
        <div className="artist-grid">{artists.length ? artists.map(a => <ArtistCard key={a.id} artist={a} styles={d.styles} />) : <Empty>Chưa có artist cho phong cách này.</Empty>}</div>
      </section>
      <section className="section">
        <h2>Tác phẩm {style.name}</h2>
        <div className="portfolio-grid">{works.length ? works.map(p => <PortfolioCard key={p.id} item={p} artists={d.artists} styles={d.styles} />) : <Empty>Chưa có tác phẩm.</Empty>}</div>
      </section>
    </>
  );
}
