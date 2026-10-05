import { loadPublic } from '@/lib/data';
import { SectionHeading, ArtistCard, Empty } from '@/components/ui';

export const metadata = { title: 'Artists', description: 'Đội ngũ tattoo artist của studio, phong cách chuyên môn và portfolio riêng.', alternates: { canonical: '/artists' } };

export default async function Artists() {
  const d = await loadPublic();
  return (
    <section className="section">
      <SectionHeading as="h1" kicker="Đội ngũ nghệ sĩ" title="Tìm người kể câu chuyện của bạn." />
      <div className="artist-grid">{d.artists.length ? d.artists.map(a => <ArtistCard key={a.id} artist={a} styles={d.styles} />) : <Empty>Studio đang cập nhật đội ngũ nghệ sĩ.</Empty>}</div>
    </section>
  );
}
