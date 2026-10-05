import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/RealtimeContext';
import { Avatar, Empty, ErrorBox, Loading } from '../components/ui';
import { partnerOf } from '../utils';

export default function Swaps() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/swaps', { box: 'active' });
  useSocketEvent('message:unread', reload);
  useSocketEvent('notification', reload);
  return (
    <div className="container page">
      <h1 className="h3 mb-3">My swaps</h1>
      <ErrorBox>{error}</ErrorBox>
      {loading ? <Loading /> : data.length === 0 ? <Empty icon="arrow-left-right" title="No active swaps yet">Accepted requests open an exchange room here. <Link to="/matches">Find matches</Link></Empty> : (
        <div className="row g-3">{data.map(s => {
          const p = partnerOf(s, user._id);
          const iOffer = String(s.from._id) === String(user._id);
          return (
            <div className="col-md-6" key={s._id}><div className="card h-100"><div className="card-body">
              <div className="d-flex gap-3 align-items-center"><Avatar name={p.name} />
                <div className="flex-grow-1"><div className="fw-semibold">{p.name}</div>
                  <div className="small"><span className="chip chip-teach">You teach {iOffer ? s.offeredSkill : s.wantedSkill}</span><span className="chip chip-learn">You learn {iOffer ? s.wantedSkill : s.offeredSkill}</span></div></div>
                {s.unread > 0 && <span className="badge text-bg-warning">{s.unread} new</span>}
                {s.status === 'ended' && <span className="badge text-bg-dark">Finished</span>}
              </div>
              <Link to={`/swaps/${s._id}`} className="btn btn-sm btn-primary mt-3">Open exchange room</Link>
            </div></div></div>);
        })}</div>)}
    </div>
  );
}
