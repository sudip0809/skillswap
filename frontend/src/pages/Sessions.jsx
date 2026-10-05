import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/RealtimeContext';
import { Empty, ErrorBox, Loading } from '../components/ui';
import SessionCard from '../components/SessionCard';

const OPEN = ['proposed', 'scheduled', 'in_progress'];

export default function Sessions() {
  const { user } = useAuth();
  const [tab, setTab] = useState('open');
  const { data, loading, error, reload } = useFetch('/sessions');
  useSocketEvent('notification', reload);
  const list = (data || []).filter(s => (tab === 'open') === OPEN.includes(s.status));
  if (tab === 'history') list.sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
  return (
    <div className="container page">
      <h1 className="h3 mb-3">Sessions</h1>
      <ul className="nav nav-pills mb-3">
        {[['open', 'Upcoming & pending'], ['history', 'History']].map(([k, l]) => <li className="nav-item" key={k}><button className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button></li>)}
      </ul>
      <ErrorBox>{error}</ErrorBox>
      {loading ? <Loading /> : list.length === 0 ? <Empty icon="calendar" title={tab === 'open' ? 'No sessions planned' : 'No past sessions yet'}>Plan sessions inside a swap’s exchange room.</Empty>
        : list.map(s => <SessionCard key={s._id} session={s} me={user} onChange={reload} showSwapLink />)}
    </div>
  );
}
