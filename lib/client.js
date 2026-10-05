// Browser helpers for client components.
export async function api(route, method = 'GET', body) {
  const res = await fetch('/api/' + route, { method, headers: method === 'GET' ? {} : { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result = await res.json();
  if (!res.ok) throw Object.assign(new Error(result.error || 'Không hoàn tất được yêu cầu.'), { status: res.status });
  return result;
}

export function readImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) return Promise.reject(new Error('Chọn ảnh PNG, JPG hoặc WebP không quá 1 MB.'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không đọc được ảnh.'));
    reader.readAsDataURL(file);
  });
}
