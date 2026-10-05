import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocketEvent } from '../context/RealtimeContext';
import { Avatar, Empty, ErrorBox, Loading } from '../components/ui';
import { timeAgo } from '../utils';

const BADGE = { pending: 'warning', accepted: 'success', rejected: 'secondary', cancelled: 'secondary', ended: 'dark' };

export default function Requests() {
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('incoming');
  const { data, loading, error, reload } = useFetch('/swaps', { box: tab });
  useSocketEvent('notification', reload);

  const act = async (id, path, body, after) => {
    try { await api.post(`/swaps/${id}/${path}`, body); after ? after() : reload(); }
    catch (e) { toast(errMsg(e), 'danger'); }
  };

  return (
    <div className="container page">
      <h1 className="h3 mb-3">Swap requests</h1>
      <ul className="nav nav-pills mb-3">
        {[['incoming', 'Received'], ['outgoing', 'Sent']].map(([k, l]) => <li className="nav-item" key={k}><button className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button></li>)}
      </ul>
      <ErrorBox>{error}</ErrorBox>
      {loading ? <Loading /> : data.length === 0 ? (
        <Empty icon="inbox" title={tab === 'incoming' ? 'No requests waiting' : 'You have not sent any requests'}>{tab === 'outgoing' && <Link to="/matches">Find someone to swap with</Link>}</Empty>
      ) : data.map(s => {
        const other = tab === 'incoming' ? s.from : s.to;
        return (
          <div className="card mb-3" key={s._id}><div className="card-body d-flex flex-wrap gap-3 align-items-center">
            <Avatar name={other.name} />
            <div className="flex-grow-1">
              <Link to={`/users/${other._id}`} className="fw-semibold text-body">{other.name}</Link>
              <div>{tab === 'incoming'
                ? <>offers <span className="chip chip-teach">{s.offeredSkill}</span> for <span className="chip chip-learn">{s.wantedSkill}</span></>
                : <>you offer <span className="chip chip-teach">{s.offeredSkill}</span> for <span className="chip chip-learn">{s.wantedSkill}</span></>}
                <span className="small text-secondary ms-1">Match {s.matchScore}%</span></div>
              {s.message && <div className="small fst-italic">“{s.message}”</div>}
              <div className="small text-secondary">{timeAgo(s.createdAt)}</div>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <span className={`badge text-bg-${BADGE[s.status]}`}>{s.status}</span>
              {tab === 'incoming' && s.status === 'pending' && <>
                <button className="btn btn-sm btn-primary" onClick={() => act(s._id, 'respond', { action: 'accept' }, () => { toast('Swap accepted'); nav(`/swaps/${s._id}`); })}>Accept</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => act(s._id, 'respond', { action: 'reject' })}>Reject</button></>}
              {tab === 'outgoing' && s.status === 'pending' && <button className="btn btn-sm btn-outline-danger" onClick={() => act(s._id, 'cancel')}>Cancel request</button>}
              {s.status === 'accepted' && <Link to={`/swaps/${s._id}`} className="btn btn-sm btn-primary">Open exchange room</Link>}
            </div>
          </div></div>);
      })}
    </div>
  );
}
