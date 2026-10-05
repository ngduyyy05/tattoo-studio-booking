'use client';
import { useEffect, useRef, useState } from 'react';
import { statuses } from '@/lib/domain';
import { api } from '@/lib/client';
import BookingsTab, { BookingDetail, RescheduleForm } from './Bookings';
import { ContentTab, Editor, names } from './Content';
import SettingsForm from './Settings';

const tabs = { bookings: 'Lịch hẹn', ...names, settings: 'Cấu hình' };

function LoginForm({ onDone }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try { await api('login', 'POST', Object.fromEntries(new FormData(e.currentTarget))); await onDone(); }
    catch (err) { setMessage(err.message); } finally { setBusy(false); }
  }
  return (
    <form className="login-panel" id="loginForm" onSubmit={submit}>
      <p>Đăng nhập bằng tài khoản quản trị được tạo khi khởi động máy chủ.</p>
      <label>Tài khoản<input name="username" defaultValue="admin" required autoComplete="username" /></label>
      <label>Mật khẩu<input name="password" type="password" required autoComplete="current-password" /></label>
      <button className="button primary" type="submit" disabled={busy}>Đăng nhập</button>
      <p className="form-message" role="status">{message}</p>
    </form>
  );
}

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(null);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('bookings');
  const [dialog, setDialog] = useState(null); // { type: 'booking' | 'reschedule' | 'editor', ... }
  const [dialogError, setDialogError] = useState('');
  const [toast, setToast] = useState('');
  const dialogRef = useRef(null);
  const toastTimer = useRef();

  function notify(message) { setToast(message); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 5000); }
  async function refresh() { setData(await call('admin')); }
  // Any 401 means the session expired: drop back to the login form.
  async function call(...args) {
    try { return await api(...args); }
    catch (err) { if (err.status === 401) { setAuthenticated(false); setData(null); setDialog(null); } throw err; }
  }
  async function loggedIn() { setAuthenticated(true); setData(await api('admin')); notify('Đã đăng nhập.'); }

  useEffect(() => {
    api('session').then(async s => { setAuthenticated(s.authenticated); if (s.authenticated) setData(await api('admin')); }).catch(() => setAuthenticated(false));
  }, []);
  useEffect(() => {
    const el = dialogRef.current; if (!el) return;
    setDialogError('');
    if (dialog && !el.open) el.showModal();
    if (!dialog && el.open) el.close();
  }, [dialog]);

  // Runs an action from a button; errors show inside the open dialog or as a toast.
  async function act(fn) {
    try { await fn(); } catch (err) { if (dialogRef.current?.open) setDialogError(err.message); else notify(err.message); }
  }
  const ctx = { data, call, refresh, notify, act, setDialog };

  let body;
  if (authenticated === null) body = <p className="empty-state">Đang tải…</p>;
  else if (!authenticated || !data) body = <LoginForm onDone={loggedIn} />;
  else body = (
    <div className="admin-panel">
      <div className="admin-toolbar">
        {Object.entries(statuses).map(([k, v]) => <div className="metric" key={k}><strong>{data.bookings.filter(b => b.status === k).length}</strong><span>{v}</span></div>)}
        <button type="button" className="button ghost small" data-logout onClick={() => act(async () => { await api('logout', 'POST', {}); setAuthenticated(false); setData(null); setDialog(null); })}>Đăng xuất</button>
      </div>
      <div className="tabs" aria-label="Mục quản trị">
        {Object.entries(tabs).map(([k, v]) => <button key={k} type="button" className={`button ${tab === k ? 'primary' : 'ghost'} small`} data-tab={k} aria-pressed={tab === k} onClick={() => setTab(k)}>{v}</button>)}
      </div>
      <div id="adminContent">
        {tab === 'bookings' ? <BookingsTab {...ctx} /> : tab === 'settings' ? <SettingsForm {...ctx} /> : <ContentTab kind={tab} {...ctx} />}
      </div>
    </div>
  );

  return (
    <>
      {body}
      <div id="toast" className={toast ? 'show' : ''} role="status" aria-live="polite">{toast}</div>
      <dialog className="artist-dialog" id="detailDialog" ref={dialogRef} aria-labelledby="dialogTitle" onClose={() => setDialog(null)}
        onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) setDialog(null); } }}>
        <button className="dialog-close" type="button" aria-label="Đóng" onClick={() => setDialog(null)}>×</button>
        <div id="dialogContent">
          {dialog && data && (
            dialog.type === 'booking' ? <BookingDetail id={dialog.id} {...ctx} /> :
            dialog.type === 'reschedule' ? <RescheduleForm id={dialog.id} {...ctx} /> :
            <Editor key={dialog.kind + (dialog.id || '')} kind={dialog.kind} id={dialog.id} {...ctx} />
          )}
          {dialogError && <p id="dialogError" className="form-message" role="alert">{dialogError}</p>}
        </div>
      </dialog>
    </>
  );
}
