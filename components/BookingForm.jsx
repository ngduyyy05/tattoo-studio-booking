'use client';
import { useEffect, useRef, useState } from 'react';
import { today } from '@/lib/domain';
import { api } from '@/lib/client';
import ImageField from './ImageField';

const blank = { customerName: '', phone: '', email: '', date: '', time: '', placement: '', size: '', notes: '', reference: '' };

export default function BookingForm({ artists, services, initialArtist, initialService }) {
  const [form, setForm] = useState({ ...blank, artistId: initialArtist, serviceId: initialService });
  const [times, setTimes] = useState(null); // null = not loaded
  const [hint, setHint] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const request = useRef(0);
  const closed = !artists.length || !services.length;
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  async function loadSlots(f = form) {
    const id = ++request.current;
    setTimes(null);
    if (closed) { setHint('Studio chưa có artist hoặc dịch vụ nhận lịch. Vui lòng liên hệ trực tiếp.'); return; }
    if (!f.date) { setHint(''); return; }
    try {
      const result = await api('availability?' + new URLSearchParams({ artistId: f.artistId, serviceId: f.serviceId, date: f.date }));
      if (id !== request.current) return;
      setTimes(result.times);
      if (!result.times.includes(f.time)) set('time', '');
      setHint(result.times.length ? `Dịch vụ dự kiến ${services.find(s => s.id === f.serviceId)?.duration} phút. Giờ trống đã tính thời gian thực hiện.` : 'Ngày này đã kín lịch hoặc là ngày nghỉ. Hãy chọn ngày hoặc artist khác.');
    } catch (e) { if (id === request.current) { setTimes([]); setHint(e.message); } }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSlots(); }, [form.artistId, form.serviceId, form.date]);

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    if (!form.time) { setMessage('Vui lòng chọn khung giờ còn trống.'); return; }
    setBusy(true);
    try {
      const result = await api('bookings', 'POST', form);
      const next = { ...blank, artistId: form.artistId, serviceId: form.serviceId };
      setForm(next); setImageKey(k => k + 1);
      setMessage(`Đã nhận yêu cầu. Mã lịch hẹn: ${result.id}. Trạng thái: chờ xác nhận. Studio sẽ liên hệ với bạn.`);
    } catch (err) {
      setMessage(err.message);
      loadSlots();
    } finally { setBusy(false); }
  }

  const input = (name, label, type = 'text', props = {}) => <label>{label}<input name={name} type={type} value={form[name]} onChange={e => set(name, e.target.value)} {...props} /></label>;
  const timeLabel = closed ? 'Tạm ngừng nhận lịch' : !form.date ? 'Chọn ngày để xem giờ trống' : times === null ? 'Đang tải giờ trống…' : times.length ? 'Chọn giờ hẹn' : 'Không còn giờ trống';

  return (
    <form className="booking-form" id="bookingForm" onSubmit={submit}>
      <div className="form-grid">
        {input('customerName', 'Họ và tên *', 'text', { required: true, maxLength: 100, autoComplete: 'name' })}
        {input('phone', 'Số điện thoại *', 'tel', { required: true, autoComplete: 'tel', placeholder: '0901234567' })}
        {input('email', 'Email', 'email', { autoComplete: 'email' })}
        <label id="artistField" className={artists.length === 1 ? 'hidden' : ''}>Artist *
          <select name="artistId" id="bookingArtist" required value={form.artistId} onChange={e => set('artistId', e.target.value)}>{artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </label>
        <label>Dịch vụ *
          <select name="serviceId" id="bookingService" required value={form.serviceId} onChange={e => set('serviceId', e.target.value)}>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </label>
        {input('date', 'Ngày hẹn *', 'date', { required: true, min: today(), suppressHydrationWarning: true })}
        <label>Khung giờ trống *
          <select name="time" id="bookingTime" required disabled={!times?.length} value={form.time} onChange={e => set('time', e.target.value)}>
            <option value="">{timeLabel}</option>{times?.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        {input('placement', 'Vị trí xăm *', 'text', { required: true, placeholder: 'Cổ tay, vai, lưng…' })}
        {input('size', 'Kích thước dự kiến', 'text', { placeholder: '5 cm, nửa cánh tay…' })}
        <ImageField key={imageKey} name="reference" label="Hình tham khảo" onChange={v => set('reference', v)} onError={setMessage} />
        <label className="wide">Mô tả ý tưởng *<textarea name="notes" required value={form.notes} onChange={e => set('notes', e.target.value)} /></label>
      </div>
      <p id="availabilityHint" role="status">{hint}</p>
      <button className="button primary full" type="submit" disabled={closed || busy}>Gửi yêu cầu đặt lịch</button>
      <p className="form-message" id="bookingMessage" role="status">{message}</p>
    </form>
  );
}
