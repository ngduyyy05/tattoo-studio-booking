'use client';
import { useState } from 'react';
import ImageField from '../ImageField';
import { dayNames } from './fields';

export const names = { artists: 'Artist', styles: 'Phong cách', services: 'Dịch vụ', portfolio: 'Tác phẩm', blog: 'Bài viết' };
const titleOf = x => x.name || x.title;
const dayOptions = dayNames.map((name, id) => ({ id, name }));

export function ContentTab({ kind, data, call, refresh, notify, act, setDialog }) {
  const items = data[kind];
  return (
    <>
      <div className="admin-list-heading"><h3>{names[kind]} · {items.length}</h3><button type="button" className="button primary small" data-edit={kind} onClick={() => setDialog({ type: 'editor', kind })}>+ Thêm mới</button></div>
      <div className="admin-list">
        {items.length ? items.map(x => (
          <article className="admin-item" key={x.id}>
            <div><strong>{titleOf(x)}</strong><p>{x.specialty || x.price || x.tag || x.description || ''}</p>{'visible' in x && <span className="tag">{x.visible ? 'Đang hiển thị' : 'Đang ẩn'}</span>}</div>
            <div className="row-actions">
              <button type="button" className="button ghost small" data-edit={kind} data-id={x.id} onClick={() => setDialog({ type: 'editor', kind, id: x.id })}>Sửa</button>
              {'visible' in x && <button type="button" className="button ghost small" data-toggle={kind} data-id={x.id} onClick={() => act(async () => { await call(`${kind}/${x.id}`, 'PUT', { ...x, visible: !x.visible }); await refresh(); notify('Đã cập nhật hiển thị.'); })}>{x.visible ? 'Ẩn' : 'Hiện'}</button>}
              <button type="button" className="button ghost small" data-delete={kind} data-id={x.id} onClick={() => act(async () => { if (!confirm('Xóa nội dung này? Thao tác không thể hoàn tác.')) return; await call(`${kind}/${x.id}`, 'DELETE'); await refresh(); notify('Đã xóa nội dung.'); })}>Xóa</button>
            </div>
          </article>
        )) : <p className="empty-state">Chưa có nội dung. Thêm mục đầu tiên để bắt đầu.</p>}
      </div>
    </>
  );
}

function Field({ name, label, value = '', type = 'text', required = false, ...props }) {
  return <label>{label}<input name={name} type={type} defaultValue={value} required={required} {...props} /></label>;
}
function Area({ name, label, value = '', required = false }) {
  return <label className="wide">{label}<textarea name={name} defaultValue={value} required={required} /></label>;
}
function Select({ name, label, list, value }) {
  return <label>{label}<select name={name} required defaultValue={value}>{list.map(x => <option key={x.id} value={x.id}>{titleOf(x)}</option>)}</select></label>;
}
export function Checks({ name, label, list, selected }) {
  return (
    <fieldset className="wide"><legend>{label}</legend>
      <div className="checks">{list.map(x => <label key={x.id}><input type="checkbox" name={name} value={x.id} defaultChecked={selected.includes(x.id)} />{x.name}</label>)}</div>
    </fieldset>
  );
}

export function Editor({ kind, id, data, call, refresh, notify, setDialog }) {
  const x = data[kind].find(item => item.id === id) || {};
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd);
    if (kind !== 'styles') v.visible = fd.has('visible');
    if (kind === 'artists') { v.years = Number(v.years); v.styleIds = fd.getAll('styleIds'); v.workDays = fd.getAll('workDays').map(Number); v.daysOff = v.daysOff.split(',').map(d => d.trim()).filter(Boolean); }
    if (kind === 'services') v.duration = Number(v.duration);
    try { await call(kind + (id ? '/' + id : ''), id ? 'PUT' : 'POST', v); await refresh(); setDialog(null); notify('Đã lưu nội dung.'); }
    catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }

  return (
    <>
      <h2 id="dialogTitle">{x.id ? 'Sửa' : 'Thêm'} {names[kind].toLowerCase()}</h2>
      <form id="editorForm" onSubmit={submit}>
        <div className="form-grid">
          {kind === 'artists' && <>
            <Field name="name" label="Tên artist *" value={x.name} required />
            <Field name="specialty" label="Chuyên môn *" value={x.specialty} required />
            <Field name="years" label="Số năm kinh nghiệm" value={x.years ?? 0} type="number" required min="0" max="80" />
            <Area name="bio" label="Giới thiệu" value={x.bio} />
            <ImageField name="image" label="Ảnh artist" value={x.image} onError={setMessage} />
            <Checks name="styleIds" label="Phong cách chuyên môn" list={data.styles} selected={x.styleIds || []} />
            <Checks name="workDays" label="Ngày làm việc" list={dayOptions} selected={x.workDays || [0, 1, 2, 3, 4, 5, 6]} />
            <Area name="daysOff" label="Ngày nghỉ riêng (YYYY-MM-DD, cách nhau bằng dấu phẩy)" value={(x.daysOff || []).join(', ')} />
          </>}
          {kind === 'styles' && <>
            <Field name="name" label="Tên phong cách *" value={x.name} required />
            <Area name="description" label="Mô tả" value={x.description} />
          </>}
          {kind === 'services' && <>
            <Field name="name" label="Tên dịch vụ *" value={x.name} required />
            <Field name="price" label="Giá tham khảo *" value={x.price} required />
            <Field name="duration" label="Thời lượng (phút) *" value={x.duration || 60} type="number" required min="15" max="600" />
            <Area name="description" label="Mô tả" value={x.description} />
          </>}
          {kind === 'portfolio' && <>
            <Field name="title" label="Tên tác phẩm *" value={x.title} required />
            <Select name="artistId" label="Artist *" list={data.artists} value={x.artistId} />
            <Select name="styleId" label="Phong cách *" list={data.styles} value={x.styleId} />
            <Field name="placement" label="Vị trí xăm *" value={x.placement} required />
            <ImageField name="image" label="Ảnh tác phẩm" value={x.image} onError={setMessage} />
            <Area name="description" label="Câu chuyện tác phẩm" value={x.description} />
          </>}
          {kind === 'blog' && <>
            <Field name="title" label="Tiêu đề *" value={x.title} required />
            <Field name="tag" label="Chủ đề *" value={x.tag} required />
            <Area name="excerpt" label="Tóm tắt *" value={x.excerpt} required />
            <Area name="content" label="Nội dung bài viết *" value={x.content} required />
          </>}
          {kind !== 'styles' && <label className="check-label wide"><input type="checkbox" name="visible" defaultChecked={x.visible !== false} />Hiển thị trên website</label>}
        </div>
        <p className="form-message" role="status">{message}</p>
        <div className="row-actions"><button className="button primary" type="submit" disabled={busy}>Lưu nội dung</button><button type="button" className="button ghost small" onClick={() => setDialog(null)}>Hủy</button></div>
      </form>
    </>
  );
}
