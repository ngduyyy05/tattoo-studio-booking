import { loadPublic } from '@/lib/data';
import { SectionHeading, BlogCard, Empty } from '@/components/ui';

export const metadata = { title: 'Blog', description: 'Bài viết về tattoo, chăm sóc hình xăm và chuẩn bị cho buổi tư vấn.', alternates: { canonical: '/blog' } };

export default async function Blog() {
  const d = await loadPublic();
  return (
    <section className="section">
      <SectionHeading as="h1" kicker="Journal" title="Cảm hứng & câu chuyện." />
      <div className="blog-grid">{d.blog.length ? d.blog.map(p => <BlogCard key={p.id} post={p} />) : <Empty>Bài viết đang được cập nhật.</Empty>}</div>
    </section>
  );
}
