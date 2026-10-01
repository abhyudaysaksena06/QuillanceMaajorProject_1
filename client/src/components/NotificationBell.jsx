import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { formatDate } from '../utils';

export default function NotificationBell() {
  const [data, setData] = useState({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = () => api('/notifications').then(setData).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const openItem = async (n) => {
    setOpen(false);
    if (!n.is_read) {
      api(`/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => {});
      setData((d) => ({ unread: Math.max(0, d.unread - 1), items: d.items.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)) }));
    }
    if (n.link) navigate(n.link);
  };

  const readAll = async () => {
    await api('/notifications/read-all', { method: 'POST' });
    setData((d) => ({ unread: 0, items: d.items.map((x) => ({ ...x, is_read: true })) }));
  };

  return (
    <div className="bell" ref={ref}>
      <button className="icon-btn" onClick={() => { setOpen(!open); if (!open) load(); }} aria-label="Notifications">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
        {data.unread > 0 && <span className="bell-count">{data.unread > 9 ? '9+' : data.unread}</span>}
      </button>
      {open && (
        <div className="bell-panel">
          <div className="bell-head">
            <span className="eyebrow">Notifications</span>
            {data.unread > 0 && <button className="link-btn" onClick={readAll}>Mark all read</button>}
          </div>
          <ul>
            {data.items.map((n) => (
              <li key={n.id} className={n.is_read ? '' : 'unread'} onClick={() => openItem(n)}>
                <strong>{n.title}</strong>
                {n.message && <span className="muted small">{n.message}</span>}
                <span className="when">{formatDate(n.created_at)}</span>
              </li>
            ))}
            {!data.items.length && <li className="muted">Nothing yet.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
