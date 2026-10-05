import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useRealtime, useSocketEvent } from '../context/RealtimeContext';
import { useToast } from '../context/ToastContext';
import { Avatar, ErrorBox, Loading, Rating } from '../components/ui';
import { ChatPanel, ProgressPanel, ResourcesPanel, SessionsPanel } from '../components/ExchangePanels';
import { partnerOf } from '../utils';

const TABS = [['chat', 'Chat', 'chat-dots'], ['sessions', 'Sessions', 'calendar-event'], ['resources', 'Resources', 'folder2-open'], ['progress', 'Progress', 'bar-chart']];

export default function ExchangeRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useRealtime();
  const toast = useToast();
  const [tab, setTab] = useState('chat');
  const swapQ = useFetch(`/swaps/${id}`);
  const sessQ = useFetch('/sessions', { swap: id });

  // join this swap's real-time room (and re-join after reconnects)
  useEffect(() => {
    if (!socket) return;
    const join = () => socket.emit('swap:join', id);
    join();
    socket.on('connect', join);
    return () => { socket.off('connect', join); socket.emit('swap:leave', id); };
  }, [socket, id]);
  useSocketEvent('session:update', ({ swap }) => swap === id && sessQ.reload());
  useSocketEvent('swap:update', ({ swap }) => swap === id && (swapQ.reload(), sessQ.reload()));

  if (swapQ.loading || sessQ.loading) return <Loading />;
  if (swapQ.error) return <div className="container page"><ErrorBox>{swapQ.error}</ErrorBox><Link to="/swaps">Back to my swaps</Link></div>;
  const swap = swapQ.data;
  if (!['accepted', 'ended'].includes(swap.status)) return <div className="container page"><div className="alert alert-info">This swap is {swap.status}. The exchange room opens once a request is accepted. <Link to="/requests">Go to requests</Link></div></div>;
  const partner = partnerOf(swap, user._id);
  const iOffer = String(swap.from._id) === String(user._id);
  const sessions = sessQ.data || [];

  const end = async () => {
    if (!window.confirm('Mark this swap as finished? Open session proposals will be cancelled and chat becomes read-only.')) return;
    try { await api.post(`/swaps/${id}/end`); toast('Swap marked as finished'); swapQ.reload(); sessQ.reload(); } catch (e) { toast(errMsg(e), 'danger'); }
  };

  return (
    <div className="container page">
      <div className="card mb-4"><div className="card-body d-flex flex-wrap gap-3 align-items-center">
        <Avatar name={partner.name} size={56} />
        <div className="flex-grow-1">
          <h1 className="h4 mb-1"><Link to={`/users/${partner._id}`} className="text-body text-decoration-none">{partner.name}</Link> {swap.status === 'ended' && <span className="badge text-bg-dark align-middle fs-6">Finished</span>}</h1>
          <Rating avg={partner.ratingAvg} count={partner.ratingCount} />
          <div className="mt-1"><span className="chip chip-teach">You teach {iOffer ? swap.offeredSkill : swap.wantedSkill}</span><span className="chip chip-learn">You learn {iOffer ? swap.wantedSkill : swap.offeredSkill}</span></div>
        </div>
        {swap.status === 'accepted' && <button className="btn btn-outline-secondary btn-sm" onClick={end}>Finish swap</button>}
      </div></div>

      <ul className="nav nav-pills mb-3 flex-wrap">
        {TABS.map(([k, l, ic]) => <li className="nav-item" key={k}><button className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}><i className={`bi bi-${ic} me-1`} />{l}</button></li>)}
      </ul>
      {/* panels stay mounted so chat keeps receiving messages while you look at other tabs */}
      <div className={tab === 'chat' ? '' : 'd-none'}><ChatPanel swap={swap} me={user} partner={partner} /></div>
      <div className={tab === 'sessions' ? '' : 'd-none'}><SessionsPanel swap={swap} me={user} sessions={sessions} reload={sessQ.reload} /></div>
      <div className={tab === 'resources' ? '' : 'd-none'}><ResourcesPanel swap={swap} me={user} sessions={sessions} /></div>
      <div className={tab === 'progress' ? '' : 'd-none'}><ProgressPanel swap={swap} me={user} sessions={sessions} /></div>
    </div>
  );
}
