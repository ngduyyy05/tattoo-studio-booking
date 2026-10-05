'use client';
import { useState } from 'react';
import { SectionHeading, PortfolioCard, Empty } from './ui';

export default function PortfolioGallery({ items, artists, styles, initialArtist, initialStyle }) {
  const [artist, setArtist] = useState(initialArtist);
  const [style, setStyle] = useState(initialStyle);
  const shown = items.filter(p => (!artist || p.artistId === artist) && (!style || p.styleId === style));
  function update(nextArtist, nextStyle) {
    setArtist(nextArtist); setStyle(nextStyle);
    const q = new URLSearchParams({ ...(nextArtist && { artist: nextArtist }), ...(nextStyle && { style: nextStyle }) });
    window.history.replaceState(null, '', q.size ? `?${q}` : location.pathname);
  }
  return (
    <>
      <SectionHeading as="h1" kicker="Selected work" title="Dấu ấn trên làn da.">
        <div className="filter-row">
          <select id="portfolioArtist" aria-label="Lọc theo artist" value={artist} onChange={e => update(e.target.value, style)}>
            <option value="">Tất cả artist</option>{artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select id="portfolioStyle" aria-label="Lọc theo phong cách" value={style} onChange={e => update(artist, e.target.value)}>
            <option value="">Tất cả phong cách</option>{styles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </SectionHeading>
      <div className="portfolio-grid" id="portfolioGrid">{shown.length ? shown.map(p => <PortfolioCard key={p.id} item={p} artists={artists} styles={styles} />) : <Empty>Không có tác phẩm phù hợp bộ lọc.</Empty>}</div>
    </>
  );
}
