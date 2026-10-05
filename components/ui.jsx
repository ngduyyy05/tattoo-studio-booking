// Small presentational pieces shared by public pages (server or client).
import Link from 'next/link';

export const titleOf = x => x.name || x.title;

export function SectionHeading({ kicker, title, children, as: Tag = 'h2' }) {
  return (
    <div className="section-heading">
      <div><p className="eyebrow">{kicker}</p><Tag>{title}</Tag></div>
      {children}
    </div>
  );
}

export function Photo({ item, className = '' }) {
  if (item.image) return <img className={className} src={item.image} alt={titleOf(item)} loading="lazy" />;
  return <div className={`art-placeholder ${className}`}><span>{titleOf(item)}</span><small>Chưa có ảnh tác phẩm</small></div>;
}

export function Empty({ children }) {
  return <p className="empty-state">{children}</p>;
}

export function ArtistCard({ artist, styles }) {
  const initials = artist.name.split(' ').map(p => p[0]).slice(0, 2).join('');
  return (
    <article className="card">
      {artist.image ? <img className="artist-photo" src={artist.image} alt={artist.name} loading="lazy" /> : <div className="artist-avatar">{initials}</div>}
      <h3>{artist.name}</h3>
      <p>{artist.specialty} · {artist.years} năm kinh nghiệm</p>
      <div className="tag-row">{artist.styleIds.map(id => <span className="tag" key={id}>{styles.find(s => s.id === id)?.name}</span>)}</div>
      <Link className="button ghost small" href={`/artists/${artist.id}`}>Xem hồ sơ ↗</Link>
    </article>
  );
}

export function PortfolioCard({ item, artists, styles }) {
  return (
    <article className="portfolio-card">
      <Photo item={item} className="portfolio-photo" />
      <div className="content">
        <span className="tag">{styles.find(s => s.id === item.styleId)?.name}</span>
        <h3>{item.title}</h3>
        <p>{artists.find(a => a.id === item.artistId)?.name} · {item.placement}</p>
        {item.description && <p className="pre-wrap muted">{item.description}</p>}
        <Link className="button ghost small" href={`/booking?artist=${item.artistId}`}>Đặt lịch với artist này</Link>
      </div>
    </article>
  );
}

export function ServiceItem({ service }) {
  return (
    <article className="service-item">
      <div><h3>{service.name}</h3><p>{service.description}</p><span className="tag">{service.duration} phút</span></div>
      <div><p className="price">{service.price}</p><Link className="button ghost small" href={`/booking?service=${service.id}`}>Đặt lịch</Link></div>
    </article>
  );
}

export function BlogCard({ post }) {
  return (
    <article className="blog-card">
      <span className="tag">{post.tag}</span>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <Link className="button ghost small" href={`/blog/${post.id}`}>Đọc bài viết ↗</Link>
    </article>
  );
}
