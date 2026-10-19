'use client';
import Link from 'next/link';
import { useState } from 'react';

const links = [['/artists', 'Nghệ sĩ'], ['/styles', 'Phong cách'], ['/portfolio', 'Tác phẩm'], ['/services', 'Dịch vụ'], ['/booking', 'Đặt lịch'], ['/blog', 'Bài viết'], ['/contact', 'Liên hệ'], ['/admin', 'Quản trị']];

export default function SiteHeader({ name, logo }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header" id="top">
      <Link className="brand" href="/" aria-label="Về trang chủ">
        <span className="brand-mark">{logo ? <img src={logo} alt="Logo studio" /> : name[0]}</span>
        <span><strong>{name}</strong><small>Nghệ thuật xăm · Đặt lịch</small></span>
      </Link>
      <button className="nav-toggle" type="button" aria-label="Mở menu" aria-expanded={open} onClick={() => setOpen(!open)}>Menu</button>
      <nav className={`main-nav${open ? ' open' : ''}`} aria-label="Điều hướng chính">
        {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
      </nav>
    </header>
  );
}
