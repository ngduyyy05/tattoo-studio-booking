import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section">
      <h1>Không tìm thấy trang.</h1>
      <p>Nội dung có thể đã được ẩn hoặc gỡ khỏi website.</p>
      <Link className="button primary" href="/">Về trang chủ</Link>
    </section>
  );
}
