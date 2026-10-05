import { dayNames } from '@/lib/data';

export default function ContactSection({ studio: s, headingLevel: H = 'h2' }) {
  return (
    <section className="section contact" id="contact">
      <div>
        <p className="eyebrow">Ghé thăm chúng tôi</p>
        <H>{s.name}</H>
        <p>{s.address}</p>
        <p><a href={`tel:${s.phone.replace(/[^+\d]/g, '')}`}>{s.phone}</a> · <a href={`mailto:${s.email}`}>{s.email}</a></p>
        <p>{s.openTime} – {s.closeTime} · {s.openDays.map(d => dayNames[d]).join(', ')}</p>
        {s.hours && <p>{s.hours}</p>}
        {s.social && <a className="text-link" href={s.social} target="_blank" rel="noopener noreferrer">Theo dõi studio ↗</a>}
      </div>
      <div className="policy"><strong>Chính sách đặt lịch</strong><p>{s.policy}</p></div>
    </section>
  );
}
