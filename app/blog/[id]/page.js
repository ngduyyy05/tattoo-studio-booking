import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadPublic } from '@/lib/data';

async function find(params) {
  const { id } = await params;
  const post = (await loadPublic()).blog.find(p => p.id === id);
  if (!post) notFound();
  return post;
}

export async function generateMetadata({ params }) {
  const post = await find(params);
  return { title: post.title, description: post.excerpt, alternates: { canonical: `/blog/${post.id}` }, openGraph: { type: 'article', title: post.title, description: post.excerpt } };
}

export default async function BlogPost({ params }) {
  const post = await find(params);
  return (
    <article className="section">
      <span className="tag">{post.tag}</span>
      <h1>{post.title}</h1>
      <p className="muted">{post.excerpt}</p>
      {/* Plain text: content typed in admin is never rendered as HTML. */}
      <div className="pre-wrap article-body">{post.content}</div>
      <p><Link className="text-link" href="/blog">← Tất cả bài viết</Link> · <Link className="text-link" href="/booking">Đặt lịch tư vấn ↗</Link></p>
    </article>
  );
}
