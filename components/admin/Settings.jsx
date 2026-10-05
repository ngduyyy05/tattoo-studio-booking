'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageField from '../ImageField';
import { Checks } from './Content';
import { dayNames } from './fields';

export default function SettingsForm({ data, call, refresh, notify }) {
  const s = data.studio;
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd);
    v.openDays = fd.getAll('openDays').map(Number);
    v.slotStep = Number(v.slotStep);
    try { await call('settings', 'PUT', v); await refresh(); router.refresh(); notify('Đã cập nhật cấu hình và trang khách.'); }
    catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }
  const field = (name, label, type = 'text', props = {}) => <label>{label}<input name={name} type={type} defaultValue={s[name]} {...props} /></label>;
  const area = (name, label, props = {}) => <label className="wide">{label}<textarea name={name} defaultValue={s[name]} {...props} /></label>;
  return (
    <form id="settingsForm" className="settings-form" onSubmit={submit}>
      {field('name', 'Tên studio *', 'text', { required: true })}
      {field('address', 'Địa chỉ *', 'text', { required: true })}
      {field('phone', 'Điện thoại *', 'tel', { required: true })}
      {field('email', 'Email *', 'email', { required: true })}
      {field('social', 'Liên kết mạng xã hội', 'url')}
      <ImageField name="logo" label="Logo" value={s.logo} onError={setMessage} />
      {field('heroTitle', 'Tiêu đề trang chủ *', 'text', { required: true })}
      {area('heroText', 'Mô tả trang chủ')}
      {area('about', 'Giới thiệu studio')}
      {field('openTime', 'Giờ mở cửa *', 'time', { required: true })}
      {field('closeTime', 'Giờ đóng cửa *', 'time', { required: true })}
      {field('slotStep', 'Khoảng cách giữa các giờ bắt đầu (phút)', 'number', { required: true, min: 15, max: 120 })}
      <Checks name="openDays" label="Ngày studio mở cửa" list={dayNames.map((name, id) => ({ id, name }))} selected={s.openDays} />
      {field('hours', 'Ghi chú giờ làm việc')}
      {area('policy', 'Chính sách đặt lịch *', { required: true })}
      <p className="wide muted">Thay đổi lịch làm việc áp dụng cho yêu cầu mới. Kiểm tra và sắp xếp lại các lịch hẹn đã có nếu cần.</p>
      <button className="button primary" type="submit" disabled={busy}>Lưu cấu hình</button>
      <p className="form-message" role="status">{message}</p>
    </form>
  );
}
