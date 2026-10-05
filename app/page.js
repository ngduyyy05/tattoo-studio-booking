import Link from 'next/link';
import Image from 'next/image';
import { loadPublic } from '@/lib/data';
import { SectionHeading, ArtistCard, PortfolioCard, ServiceItem, BlogCard, Empty } from '@/components/ui';
import ContactSection from '@/components/ContactSection';

export default async function Home() {
  const d = await loadPublic();
  const s = d.studio;
  return (
    <>
      <section className="hero" id="home">
        <Image className="hero-image" src="/assets/tattoo-studio-hero.png" alt="Không gian tattoo studio" fill priority sizes="100vw" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">Tattoo · Art · Individuality</p>
          <h1>{s.heroTitle}</h1>
          <p>{s.heroText}</p>
          <div className="hero-actions"><Link className="button primary" href="/booking">Đặt lịch tư vấn ↗</Link><Link className="button ghost" href="/portfolio">Khám phá tác phẩm</Link></div>
        </div>
        <div className="hero-stats"><span><strong>{d.artists.length}</strong>Nghệ sĩ</span><span><strong>{d.portfolio.length}</strong>Tác phẩm</span><span><strong>01</strong>Studio · dấu ấn riêng</span></div>
      </section>

      <section className="section intro" id="about"><div><p className="eyebrow">Câu chuyện studio</p><h2>Nghệ thuật bắt đầu từ bạn.</h2></div><p>{s.about} <Link className="text-link" href="/about">Tìm hiểu thêm ↗</Link></p></section>

      <section className="section" id="artists">
        <SectionHeading kicker="Đội ngũ nghệ sĩ" title="Tìm người kể câu chuyện của bạn."><Link className="text-link" href="/artists">Tất cả artist ↗</Link></SectionHeading>
        <div className="artist-grid">{d.artists.length ? d.artists.map(a => <ArtistCard key={a.id} artist={a} styles={d.styles} />) : <Empty>Studio đang cập nhật đội ngũ nghệ sĩ.</Empty>}</div>
      </section>

      <section className="section tonal" id="styles">
        <SectionHeading kicker="Tattoo styles" title="Chọn một phong cách." />
        <div className="style-list">{d.styles.map(st => <article className="style-pill" key={st.id}><strong>{st.name}</strong><span>{st.description}</span><Link className="button ghost small" href={`/styles/${st.id}`}>Xem tác phẩm</Link></article>)}</div>
      </section>

      <section className="section" id="portfolio">
        <SectionHeading kicker="Selected work" title="Dấu ấn trên làn da."><Link className="text-link" href="/portfolio">Toàn bộ portfolio ↗</Link></SectionHeading>
        <div className="portfolio-grid">{d.portfolio.slice(0, 6).map(p => <PortfolioCard key={p.id} item={p} artists={d.artists} styles={d.styles} />)}</div>
      </section>

      <section className="section split" id="services">
        <div><p className="eyebrow">Dịch vụ</p><h2>Từ ý tưởng đến hình xăm.</h2><p>Giá tham khảo tùy kích thước, vị trí và độ chi tiết. Studio sẽ trao đổi và báo giá trước khi thực hiện.</p></div>
        <div className="service-list">{d.services.length ? d.services.map(sv => <ServiceItem key={sv.id} service={sv} />) : <Empty>Chưa có dịch vụ nhận lịch.</Empty>}</div>
      </section>

      <section className="section" id="blog">
        <SectionHeading kicker="Journal" title="Cảm hứng & câu chuyện."><Link className="text-link" href="/blog">Tất cả bài viết ↗</Link></SectionHeading>
        <div className="blog-grid">{d.blog.slice(0, 3).map(p => <BlogCard key={p.id} post={p} />)}</div>
      </section>

      <ContactSection studio={s} />
    </>
  );
}
