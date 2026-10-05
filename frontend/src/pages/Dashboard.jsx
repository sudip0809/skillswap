import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/RealtimeContext';
import { Loading, ErrorBox, Empty, Rating, Chips } from '../components/ui';
import { fmtDate, fmtTime, idOf, timeAgo } from '../utils';

const Stat = ({ icon, label, value, to, tone }) => (
  <div className="col-6 col-lg-3"><Link to={to} className="text-decoration-none text-body"><div className="card h-100"><div className="card-body">
    <i className={`bi bi-${icon}`} style={{ color: tone || 'var(--ss-teach)', fontSize: '1.3rem' }} />
    <div className="stat-num mt-2">{value}</div><div className="small text-secondary">{label}</div>
  </div></div></Link></div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const { data: d, loading, error, reload } = useFetch('/dashboard');
  useSocketEvent('notification', reload);
  if (loading) return <Loading />;
  if (error) return <div className="container page"><ErrorBox>{error}</ErrorBox></div>;
  const who = (s, f) => (idOf(f) === String(user._id) ? 'You teach' : `${(idOf(s.teacher) === String(user._id) ? s.learner : s.teacher).name} teaches`);

  return (
    <div className="container page">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div><h1 className="h3 mb-1">Hi {user.name.split(' ')[0]}</h1><Rating avg={d.rating.avg} count={d.rating.count} /></div>
        <Link to="/matches" className="btn btn-primary"><i className="bi bi-search me-1" />Find matches</Link>
      </div>

      <div className="row g-3 mb-4">
        <Stat icon="arrow-left-right" label="Active swaps" value={d.activeSwaps} to="/swaps" />
        <Stat icon="inbox" label="Requests waiting for you" value={d.incomingRequests} to="/requests" tone="var(--ss-learn)" />
        <Stat icon="chat-dots" label="Unread messages" value={d.unreadMessages} to="/swaps" />
        <Stat icon="check2-circle" label="Sessions completed" value={d.completedSessions} to="/sessions" />
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          {d.awaiting.length > 0 && (
            <div className="card mb-4 border-warning"><div className="card-header bg-warning-subtle fw-semibold">Session proposals waiting for your answer</div>
              <ul className="list-group list-group-flush">
                {d.awaiting.map(s => (
                  <li key={s._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div><div className="fw-semibold">{s.skill}</div><div className="small text-secondary">{fmtDate(s.startAt)}, {fmtTime(s.startAt)} · {s.duration} min</div></div>
                    <Link to={`/swaps/${idOf(s.swap)}`} className="btn btn-sm btn-primary">Review</Link>
                  </li>))}
              </ul></div>
          )}
          <div className="card"><div className="card-header d-flex justify-content-between"><span className="fw-semibold">Upcoming sessions</span><Link to="/sessions" className="small">All sessions</Link></div>
            {d.upcoming.length === 0 ? <Empty icon="calendar" title="No sessions scheduled">Open a swap and propose a time.</Empty> : (
              <ul className="list-group list-group-flush">
                {d.upcoming.map(s => (
                  <li key={s._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div><div className="fw-semibold">{s.skill} <span className={`badge ${s.status === 'in_progress' ? 'text-bg-primary' : 'text-bg-info'} ms-1`}>{s.status === 'in_progress' ? 'In progress' : 'Scheduled'}</span></div>
                      <div className="small text-secondary">{who(s, s.teacher)} · {fmtDate(s.startAt)}, {fmtTime(s.startAt)}</div></div>
                    <Link to={`/swaps/${idOf(s.swap)}`} className="btn btn-sm btn-outline-primary">Open</Link>
                  </li>))}
              </ul>)}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card mb-4"><div className="card-header fw-semibold">Time exchanged</div><div className="card-body d-flex gap-4">
            <div><div className="stat-num" style={{ color: 'var(--ss-teach)' }}>{d.hoursTaught}h</div><div className="small text-secondary">taught</div></div>
            <div><div className="stat-num" style={{ color: 'var(--ss-learn-ink)' }}>{d.hoursLearned}h</div><div className="small text-secondary">learned</div></div>
          </div></div>
          <div className="card mb-4"><div className="card-header fw-semibold">Your skills</div><div className="card-body">
            <div className="small text-secondary mb-1">Teaching</div><Chips skills={user.skillsTeach} kind="teach" />
            <div className="small text-secondary mt-2 mb-1">Learning</div><Chips skills={user.skillsWant} kind="learn" />
            <div className="mt-2"><Link to="/profile/edit" className="small">Edit profile</Link></div>
          </div></div>
          <div className="card"><div className="card-header d-flex justify-content-between"><span className="fw-semibold">Latest activity</span><Link to="/notifications" className="small">See all</Link></div>
            {d.notifications.length === 0 ? <Empty icon="bell" title="Nothing yet" /> : (
              <ul className="list-group list-group-flush">
                {d.notifications.map(n => <li key={n._id} className="list-group-item small"><Link to={n.link || '/notifications'} className="text-body text-decoration-none">{n.message}</Link><div className="text-secondary">{timeAgo(n.createdAt)}</div></li>)}
              </ul>)}
          </div>
        </div>
      </div>
    </div>
  );
}
