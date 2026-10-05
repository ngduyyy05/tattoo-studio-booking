import { loadPublic } from '@/lib/data';
import PortfolioGallery from '@/components/PortfolioGallery';

export const metadata = { title: 'Portfolio', description: 'Thư viện tác phẩm tattoo, lọc theo artist hoặc phong cách.', alternates: { canonical: '/portfolio' } };

export default async function Portfolio({ searchParams }) {
  const q = await searchParams;
  const d = await loadPublic();
  return (
    <section className="section">
      <PortfolioGallery items={d.portfolio} artists={d.artists} styles={d.styles} initialArtist={typeof q.artist === 'string' ? q.artist : ''} initialStyle={typeof q.style === 'string' ? q.style : ''} />
    </section>
  );
}
