import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { Avatar, Chips, Empty, ErrorBox, Loading, Rating } from '../components/ui';
import SwapRequestModal from '../components/SwapRequestModal';

export default function Matches() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [mode, setMode] = useState('');
  const [target, setTarget] = useState(null);
  const { data, loading, error, reload } = useFetch('/matches', { q, type, mode });

  return (
    <div className="container page">
      <h1 className="h3">Find matches</h1>
      <p className="text-secondary">People are ranked by how well your skills, level, rating, language and learning mode fit. Strong matches are two-way swaps.</p>
      <div className="card mb-4"><div className="card-body row g-2">
        <div className="col-md-5"><input className="form-control" placeholder="Search by name or skill" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="col-6 col-md-3"><select className="form-select" value={type} onChange={e => setType(e.target.value)}><option value="">All matches</option><option value="strong">Strong</option><option value="partial">Partial</option></select></div>
        <div className="col-6 col-md-4"><select className="form-select" value={mode} onChange={e => setMode(e.target.value)}><option value="">Any learning mode</option><option value="online">Online</option><option value="offline">In person</option></select></div>
      </div></div>

      <ErrorBox>{error}</ErrorBox>
      {loading ? <Loading /> : data?.length === 0 ? (
        <Empty icon="search" title="No matches found">Matches appear when someone teaches what you want to learn, or wants what you teach. Try adding more skills to <Link to="/profile/edit">your profile</Link>.</Empty>
      ) : (
        <div className="row g-3">
          {data?.map(({ user: u, match, swap }) => (
            <div className="col-lg-6" key={u._id}><div className="card h-100"><div className="card-body">
              <div className="d-flex gap-3">
                <Avatar name={u.name} size={52} />
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start">
                    <div><Link to={`/users/${u._id}`} className="fw-semibold fs-5 text-body text-decoration-none display-font">{u.name}</Link>
                      <div className="small text-secondary">{u.city || 'Location not set'} · {u.learningMode === 'both' ? 'Online or in person' : u.learningMode === 'offline' ? 'In person' : 'Online'}</div>
                      <Rating avg={u.ratingAvg} count={u.ratingCount} /></div>
                    <div className="text-center"><div className={`score ${match.type}`} style={{ '--p': match.score }}><span>{match.score}%</span></div>
                      <span className={`badge mt-1 ${match.type === 'strong' ? 'text-bg-success' : 'text-bg-warning'}`}>{match.type === 'strong' ? 'Strong' : 'Partial'}</span></div>
                  </div>
                  <div className="mt-2 small">
                    {match.theyTeach.length > 0 && <div><span className="text-secondary">They teach what you want:</span> {match.theyTeach.map(s => <span key={s} className="chip chip-learn">{s}</span>)}</div>}
                    {match.iTeach.length > 0 && <div><span className="text-secondary">You teach what they want:</span> {match.iTeach.map(s => <span key={s} className="chip chip-teach">{s}</span>)}</div>}
                    {match.sharedLanguages.length > 0 && <div className="text-secondary">Shared language: {match.sharedLanguages.join(', ')}</div>}
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3 justify-content-end">
                <Link to={`/users/${u._id}`} className="btn btn-sm btn-outline-secondary">View profile</Link>
                {swap ? <Link to={swap.status === 'accepted' ? `/swaps/${swap.id}` : '/requests'} className="btn btn-sm btn-light">{swap.status === 'accepted' ? 'Open exchange room' : 'Request pending'}</Link>
                  : <button className="btn btn-sm btn-primary" onClick={() => setTarget(u)}>Send swap request</button>}
              </div>
            </div></div></div>
          ))}
        </div>
      )}
      {target && <SwapRequestModal target={target} me={user} match={data.find(x => x.user._id === target._id)?.match} onClose={() => setTarget(null)} onSent={reload} />}
    </div>
  );
}
