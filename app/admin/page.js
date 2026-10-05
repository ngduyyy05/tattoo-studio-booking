import AdminApp from '@/components/admin/AdminApp';

export const metadata = { title: 'Quản trị', robots: { index: false, follow: false } };

export default function Admin() {
  return (
    <section className="section admin-section" id="admin">
      <div className="section-heading"><div><p className="eyebrow">Studio workspace</p><h1>Quản trị studio.</h1></div></div>
      <AdminApp />
    </section>
  );
}
