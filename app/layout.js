import './globals.css';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { loadPublic, siteUrl } from '@/lib/data';

export async function generateMetadata() {
  const { studio } = await loadPublic();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${studio.name} | Tattoo & Booking`, template: `%s | ${studio.name}` },
    description: studio.heroText || `${studio.name}: khám phá artist, tác phẩm và đặt lịch xăm tại studio.`,
    openGraph: { siteName: studio.name, locale: 'vi_VN', type: 'website' },
    icons: { icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23110f0f'/%3E%3Cpath d='M18 44c8-18 17-25 28-27-3 12-10 21-27 28l-1-1z' fill='%23b7312c'/%3E%3Ccircle cx='44' cy='18' r='5' fill='%23d7b56d'/%3E%3C/svg%3E" }
  };
}

export default async function RootLayout({ children }) {
  const { studio } = await loadPublic();
  return (
    <html lang="vi">
      <body>
        <SiteHeader name={studio.name} logo={studio.logo} />
        <main id="main">{children}</main>
        <footer><span>{studio.name}</span><Link href="#top">Về đầu trang ↑</Link></footer>
      </body>
    </html>
  );
}
