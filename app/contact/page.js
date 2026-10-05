import { loadPublic } from '@/lib/data';
import ContactSection from '@/components/ContactSection';

export const metadata = { title: 'Liên hệ', alternates: { canonical: '/contact' } };

export default async function Contact() {
  const { studio } = await loadPublic();
  return <ContactSection studio={studio} headingLevel="h1" />;
}
