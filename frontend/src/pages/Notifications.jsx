import { useNavigate } from 'react-router-dom';
import api from '../api';
import useFetch from '../hooks/useFetch';
import { useRealtime, useSocketEvent } from '../context/RealtimeContext';
import { Empty, ErrorBox, Loading } from '../components/ui';
import { timeAgo } from '../utils';

export default function Notifications() {
  const nav = useNavigate();
  const { refreshUnread } = useRealtime();
  const { data, loading, error, reload } = useFetch('/notifications');
  useSocketEvent('notification', reload);
  const open = async n => { if (!n.read) { await api.post(`/notifications/${n._id}/read`); refreshUnread(); } if (n.link) nav(n.link); else reload(); };
  const readAll = async () => { await api.post('/notifications/read-all'); refreshUnread(); reload(); };
  return (
    <div className="container page"><div className="col-lg-8 px-0">
      <div className="d-flex justify-content-between align-items-center mb-3"><h1 className="h3 mb-0">Notifications</h1>
        {data?.unread > 0 && <button className="btn btn-sm btn-outline-secondary" onClick={readAll}>Mark all as read</button>}</div>
      <ErrorBox>{error}</ErrorBox>
      {loading ? <Loading /> : data.items.length === 0 ? <Empty icon="bell" title="No notifications yet">Requests, session reminders and reviews show up here.</Empty> : (
        <div className="list-group">{data.items.map(n => (
          <button key={n._id} className={`list-group-item list-group-item-action ${n.read ? '' : 'fw-semibold'}`} onClick={() => open(n)}>
            {!n.read && <span className="legend-dot" style={{ background: 'var(--ss-learn)' }} />}{n.message}<div className="small text-secondary fw-normal">{timeAgo(n.createdAt)}</div>
          </button>))}</div>)}
    </div></div>
  );
}
