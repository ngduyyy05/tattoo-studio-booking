'use client';
import { useState } from 'react';
import { readImage } from '@/lib/client';

// URL or uploaded PNG/JPEG/WebP (stored as a data URL). Reports the current value via onChange.
export default function ImageField({ name, label, value = '', onChange, onError }) {
  const [current, setCurrent] = useState(value);
  const [fileKey, setFileKey] = useState(0);
  const set = v => { setCurrent(v); onChange?.(v); };
  return (
    <div className="wide image-field">
      <input type="hidden" name={name} value={current} />
      <label>{label} — đường dẫn URL<input type="url" value={current.startsWith('data:') ? '' : current} onChange={e => set(e.target.value)} /></label>
      <label>Hoặc tải ảnh PNG, JPG, WebP (tối đa 1 MB)
        <input key={fileKey} type="file" accept="image/png,image/jpeg,image/webp" data-image-input={name} onChange={async e => { const file = e.target.files[0]; if (!file) return; try { set(await readImage(file)); } catch (err) { setFileKey(k => k + 1); onError?.(err.message); } }} />
      </label>
      {current && <img className="image-preview" src={current} alt="Ảnh hiện tại" />}
      <button type="button" className="button ghost small" onClick={() => { set(''); setFileKey(k => k + 1); }}>Gỡ ảnh</button>
    </div>
  );
}
