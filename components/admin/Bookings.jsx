'use client';
import { useEffect, useRef, useState } from 'react';
import { statuses, transitions, today } from '@/lib/domain';

const nameOf = (list, id) => list.find(x => x.id === id)?.name;

export default function BookingsTab({ data, setDialog }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [artist, setArtist] = useState('');
  const [date, setDate] = useState('');
  const needle = q.trim().toLowerCase();
  const list = data.bookings.filter(b => (!needle || [b.customerName, b.phone, b.id].some(v => v.toLowerCase().includes(needle))) && (!status || b.status === status) && (!artist || b.artistId === artist) && (!date || b.date === date));
  return (
    <>
      <div className="filter-row admin-filters">
        <label>Tìm khách / điện thoại / mã lịch<input id="bookingSearch" type="search" placeholder="Nhập để tìm…" value={q} onChange={e => setQ(e.target.value)} /></label>
        <label>Trạng thái<select id="bookingStatusFilter" value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Artist<select id="bookingArtistFilter" value={artist} onChange={e => setArtist(e.target.value)}><option value="">Tất cả artist</option>{data.artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label>Ngày hẹn<input id="bookingDateFilter" type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <button type="button" className="button ghost small" onClick={() => { setQ(''); setStatus(''); setArtist(''); setDate(''); }}>Xóa bộ lọc</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Khách hàng</th><th>Artist / dịch vụ</th><th>Ngày hẹn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody id="bookingRows">
            {list.length ? list.map(b => (
              <tr key={b.id}>
                <td><strong>{b.customerName}</strong><br /><a href={`tel:${b.phone.replace(/[^+\d]/g, '')}`}>{b.phone}</a><small className="booking-code">{b.id.slice(0, 8)}</small></td>
                <td>{nameOf(data.artists, b.artistId)}<br /><small>{nameOf(data.services, b.serviceId)} · {b.duration} phút</small></td>
                <td>{b.date.split('-').reverse().join('/')}<br /><strong>{b.time}</strong></td>
                <td><span className={`status ${b.status}`}>{statuses[b.status]}</span></td>
                <td><button type="button" className="button ghost small" data-booking={b.id} onClick={() => setDialog({ type: 'booking', id: b.id })}>Chi tiết / xử lý</button></td>
              </tr>
            )) : <tr><td colSpan={5}>Không có lịch hẹn phù hợp.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function BookingDetail({ id, data, call, refresh, notify, act, setDialog }) {
  const b = data.bookings.find(x => x.id === id);
  if (!b) return <p>Không tìm thấy lịch hẹn.</p>;
  const changeStatus = s => act(async () => {
    if (s === 'Cancelled' && !confirm('Hủy lịch hẹn này và trả lại khung giờ?')) return;
    await call('bookings/' + b.id, 'PATCH', { status: s }); await refresh(); notify('Đã cập nhật trạng thái.');
  });
  return (
    <>
      <h2 id="dialogTitle">Chi tiết lịch hẹn</h2>
      <p className="booking-code">{b.id}</p>
      <span className={`status ${b.status}`}>{statuses[b.status]}</span>
      <h3>{b.customerName}</h3>
      <p>{b.phone} · {b.email || 'Không có email'}</p>
      <p>{nameOf(data.artists, b.artistId)} · {nameOf(data.services, b.serviceId)}</p>
      <p>{b.date} · {b.time} · {b.duration} phút</p>
      <p>{b.placement} · {b.size || 'Chưa xác định kích thước'}</p>
      <p className="pre-wrap">{b.notes}</p>
      {b.reference && (b.reference.startsWith('data:')
        ? <img className="reference-image" src={b.reference} alt="Hình tham khảo của khách" />
        : <a className="text-link" href={b.reference} target="_blank" rel="noopener noreferrer">Mở hình tham khảo ↗</a>)}
      <div className="row-actions">
        {transitions[b.status].map(s => <button key={s} type="button" className={`button ${s !== 'Cancelled' ? 'primary' : 'ghost'} small`} data-status={s} onClick={() => changeStatus(s)}>{statuses[s]}</button>)}
        {['Pending', 'Confirmed'].includes(b.status) && <button type="button" className="button ghost small" data-reschedule={b.id} onClick={() => setDialog({ type: 'reschedule', id: b.id })}>Đổi lịch / artist</button>}
      </div>
      <details>
        <summary>Lịch sử xử lý</summary>
        {b.history.map((h, i) => <p key={i}>{new Date(h.at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} · {h.action === 'reschedule' ? `Đổi từ ${h.from} sang ${h.to}` : statuses[h.status]}</p>)}
      </details>
    </>
  );
}

export function RescheduleForm({ id, data, call, refresh, notify, setDialog }) {
  const b = data.bookings.find(x => x.id === id);
  const [form, setForm] = useState({ artistId: b.artistId, serviceId: b.serviceId, date: b.date, time: b.time });
  const [times, setTimes] = useState(null);
  const [message, setMessage] = useState('');
  const request = useRef(0);
  useEffect(() => {
    const n = ++request.current; setTimes(null);
    call('admin-availability?' + new URLSearchParams({ artistId: form.artistId, serviceId: form.serviceId, date: form.date, ignoreId: b.id }))
      .then(r => { if (n === request.current) setTimes(r.times); })
      .catch(e => { if (n === request.current) { setTimes([]); setMessage(e.message); } });
  }, [form.artistId, form.serviceId, form.date]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  async function submit(e) {
    e.preventDefault(); setMessage('');
    try { await call('bookings/' + b.id, 'PATCH', form); await refresh(); setDialog({ type: 'booking', id: b.id }); notify('Đã đổi lịch hẹn.'); }
    catch (err) { setMessage(err.message); }
  }
  return (
    <>
      <h2 id="dialogTitle">Đổi lịch hẹn</h2>
      <form id="rescheduleForm" onSubmit={submit}>
        <div className="form-grid">
          <label>Artist<select name="artistId" required value={form.artistId} onChange={e => set('artistId', e.target.value)}>{data.artists.filter(a => a.visible).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label>Dịch vụ<select name="serviceId" required value={form.serviceId} onChange={e => set('serviceId', e.target.value)}>{data.services.filter(s => s.visible).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label>Ngày hẹn<input name="date" type="date" required min={today()} value={form.date} onChange={e => set('date', e.target.value)} /></label>
          <label>Giờ hẹn<select name="time" required disabled={times === null} value={form.time} onChange={e => set('time', e.target.value)}>
            <option value="">{times === null ? 'Đang tải…' : times.length ? 'Chọn giờ' : 'Không có giờ trống'}</option>{times?.map(t => <option key={t} value={t}>{t}</option>)}
          </select></label>
        </div>
        <p className="form-message" role="status">{message}</p>
        <button className="button primary" type="submit">Lưu lịch mới</button>
      </form>
    </>
  );
}
