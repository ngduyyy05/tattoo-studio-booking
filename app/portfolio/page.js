import { loadPublic } from '@/lib/data';
import PortfolioGallery from '@/components/PortfolioGallery';

export const metadata = { title: 'Tác phẩm', description: 'Thư viện tác phẩm xăm, lọc theo nghệ sĩ hoặc phong cách.', alternates: { canonical: '/portfolio' } };

export default async function Portfolio({ searchParams }) {
  const q = await searchParams;
  const d = await loadPublic();
  return (
    <section className="section">
      <PortfolioGallery items={d.portfolio} artists={d.artists} styles={d.styles} initialArtist={typeof q.artist === 'string' ? q.artist : ''} initialStyle={typeof q.style === 'string' ? q.style : ''} />
    </section>
  );
}
