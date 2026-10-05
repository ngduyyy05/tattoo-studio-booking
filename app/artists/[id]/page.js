import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadPublic, dayNames } from '@/lib/data';
import { PortfolioCard, Empty } from '@/components/ui';

async function find(params) {
  const { id } = await params;
  const d = await loadPublic();
  const artist = d.artists.find(a => a.id === id);
  if (!artist) notFound();
  return { d, artist };
}

export async function generateMetadata({ params }) {
  const { artist } = await find(params);
  return { title: `${artist.name} · ${artist.specialty}`, description: artist.bio.slice(0, 160), alternates: { canonical: `/artists/${artist.id}` } };
}

export default async function ArtistDetail({ params }) {
  const { d, artist } = await find(params);
  const works = d.portfolio.filter(p => p.artistId === artist.id);
  return (
    <>
      <section className="section intro">
        <div>
          <p className="eyebrow">Tattoo artist</p>
          <h1>{artist.name}</h1>
          {artist.image && <img className="artist-photo" src={artist.image} alt={artist.name} />}
        </div>
        <div>
          <p>{artist.specialty} · {artist.years} năm kinh nghiệm</p>
          <div className="tag-row">{artist.styleIds.map(id => { const s = d.styles.find(x => x.id === id); return s && <Link className="tag" key={id} href={`/styles/${id}`}>{s.name}</Link>; })}</div>
          <p className="pre-wrap">{artist.bio}</p>
          <p>Ngày nhận lịch: {artist.workDays.filter(x => d.studio.openDays.includes(x)).map(x => dayNames[x]).join(', ')}</p>
          <Link className="button primary" href={`/booking?artist=${artist.id}`}>Đặt lịch với artist này</Link>
        </div>
      </section>
      <section className="section">
        <h2>Tác phẩm của {artist.name}</h2>
        <div className="portfolio-grid">{works.length ? works.map(p => <PortfolioCard key={p.id} item={p} artists={d.artists} styles={d.styles} />) : <Empty>Artist đang cập nhật tác phẩm.</Empty>}</div>
      </section>
    </>
  );
}
