import Link from 'next/link';
import { loadPublic } from '@/lib/data';
import { SectionHeading } from '@/components/ui';
import ContactSection from '@/components/ContactSection';

export const metadata = { title: 'Về studio', alternates: { canonical: '/about' } };

export default async function About() {
  const d = await loadPublic();
  return (
    <>
      <section className="section intro">
        <div><p className="eyebrow">Câu chuyện studio</p><h1>Nghệ thuật bắt đầu từ bạn.</h1></div>
        <p className="pre-wrap">{d.studio.about}</p>
      </section>
      <section className="section tonal">
        <SectionHeading kicker="Phong cách" title="Những gì chúng tôi theo đuổi." />
        <div className="style-list">{d.styles.map(s => <article className="style-pill" key={s.id}><strong>{s.name}</strong><span>{s.description}</span><Link className="button ghost small" href={`/styles/${s.id}`}>Xem tác phẩm</Link></article>)}</div>
      </section>
      <ContactSection studio={d.studio} />
    </>
  );
}
