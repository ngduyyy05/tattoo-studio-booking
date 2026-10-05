import { loadPublic } from '@/lib/data';
import BookingForm from '@/components/BookingForm';

export const metadata = { title: 'Đặt lịch', description: 'Chọn artist, dịch vụ và khung giờ còn trống để gửi yêu cầu đặt lịch xăm.', alternates: { canonical: '/booking' } };

export default async function Booking({ searchParams }) {
  const q = await searchParams;
  const d = await loadPublic();
  const pick = (value, list) => (typeof value === 'string' && list.some(x => x.id === value) ? value : list[0]?.id || '');
  return (
    <section className="section booking-section" id="booking">
      <div className="booking-copy">
        <p className="eyebrow">Bắt đầu câu chuyện</p>
        <h1>Hẹn gặp bạn tại studio.</h1>
        <p>Chọn artist, dịch vụ và khung giờ còn trống. Studio sẽ liên hệ để xác nhận ý tưởng và lịch hẹn.</p>
        <div className="flow"><span>01 · Chọn nghệ sĩ</span><span>02 · Chọn giờ trống</span><span>03 · Nhận xác nhận</span></div>
        <p className="booking-hint">Giờ hẹn theo múi giờ Việt Nam (UTC+7).</p>
        <p>{d.studio.policy}</p>
      </div>
      <BookingForm artists={d.artists} services={d.services} initialArtist={pick(q.artist, d.artists)} initialService={pick(q.service, d.services)} />
    </section>
  );
}
