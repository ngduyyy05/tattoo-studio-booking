import { loadPublic } from '@/lib/data';
import { ServiceItem, Empty } from '@/components/ui';

export const metadata = { title: 'Dịch vụ', description: 'Dịch vụ tattoo, thời lượng và giá tham khảo.', alternates: { canonical: '/services' } };

export default async function Services() {
  const d = await loadPublic();
  return (
    <section className="section split">
      <div><p className="eyebrow">Dịch vụ</p><h1>Từ ý tưởng đến hình xăm.</h1><p>Giá tham khảo tùy kích thước, vị trí và độ chi tiết. Studio sẽ trao đổi và báo giá trước khi thực hiện.</p></div>
      <div className="service-list">{d.services.length ? d.services.map(s => <ServiceItem key={s.id} service={s} />) : <Empty>Chưa có dịch vụ nhận lịch.</Empty>}</div>
    </section>
  );
}
