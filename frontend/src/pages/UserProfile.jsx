import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { Avatar, Chips, Empty, ErrorBox, Loading, Rating, Stars } from '../components/ui';
import SwapRequestModal from '../components/SwapRequestModal';
import { fmtDate } from '../utils';

export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useFetch(`/users/${id}`);
  const [open, setOpen] = useState(false);
  if (loading) return <Loading />;
  if (error) return <div className="container page"><ErrorBox>{error}</ErrorBox></div>;
  const { user: u, reviews, match, swap, sessionsCompleted } = data;
  const mine = String(u._id) === String(me._id);
  const b = match?.breakdown;

  return (
    <div className="container page"><div className="row g-4">
      <div className="col-lg-8">
        <div className="card mb-4"><div className="card-body">
          <div className="d-flex gap-3 align-items-center">
            <Avatar name={u.name} size={72} />
            <div><h1 className="h3 mb-1">{u.name}</h1>
              <div className="text-secondary small">{u.city || 'Location not set'} · {u.learningMode === 'both' ? 'Online or in person' : u.learningMode === 'offline' ? 'In person' : 'Online'} · Member since {fmtDate(u.createdAt)}</div>
              <Rating avg={u.ratingAvg} count={u.ratingCount} /> <span className="small text-secondary ms-2">{sessionsCompleted} sessions completed</span></div>
          </div>
          {u.bio && <p className="mt-3 mb-0">{u.bio}</p>}
        </div></div>
        <div className="card mb-4"><div className="card-body">
          <h2 className="h5">Teaches</h2><Chips skills={u.skillsTeach} kind="teach" />
          <h2 className="h5 mt-3">Wants to learn</h2><Chips skills={u.skillsWant} kind="learn" />
          <h2 className="h5 mt-3">Languages</h2>{u.languages.map(l => <span key={l} className="chip chip-plain">{l}</span>)}
        </div></div>
        <div className="card"><div className="card-header fw-semibold">Reviews</div>
          {reviews.length === 0 ? <Empty icon="star" title="No reviews yet" /> : (
            <ul className="list-group list-group-flush">{reviews.map(r => (
              <li key={r._id} className="list-group-item"><div className="d-flex justify-content-between"><strong>{r.reviewer?.name}</strong><Stars value={r.rating} /></div>
                {r.comment && <div className="small">{r.comment}</div>}<div className="small text-secondary">{fmtDate(r.createdAt)}</div></li>))}
            </ul>)}
        </div>
      </div>
      <div className="col-lg-4">
        {mine ? <Link to="/profile/edit" className="btn btn-primary w-100">Edit profile</Link> : (
          <div className="card"><div className="card-body">
            {match && <>
              <div className="d-flex align-items-center gap-3 mb-3"><div className={`score ${match.type}`} style={{ '--p': match.score }}><span>{match.score}%</span></div>
                <div><div className="fw-semibold">{match.type === 'strong' ? 'Strong match' : 'Partial match'}</div><div className="small text-secondary">{match.mutual ? 'Two-way swap' : 'One-way swap'}</div></div></div>
              <table className="table table-sm small mb-3"><tbody>
                <tr><td>Skills</td><td className="text-end">{b.skills}/40</td></tr><tr><td>Skill level</td><td className="text-end">{b.level}/15</td></tr>
                <tr><td>Rating</td><td className="text-end">{b.rating}/15</td></tr><tr><td>Language</td><td className="text-end">{b.language}/15</td></tr>
                <tr><td>Learning mode</td><td className="text-end">{b.mode}/15</td></tr></tbody></table></>}
            {swap ? <Link to={swap.status === 'accepted' ? `/swaps/${swap._id}` : '/requests'} className="btn btn-light w-100">{swap.status === 'accepted' ? 'Open exchange room' : 'Request pending'}</Link>
              : <button className="btn btn-primary w-100" onClick={() => setOpen(true)} disabled={!match}>Send swap request</button>}
            {!match && <div className="small text-secondary mt-2">You have no skills in common yet, so a swap is not possible.</div>}
          </div></div>)}
      </div>
      {open && <SwapRequestModal target={u} me={me} match={match} onClose={() => setOpen(false)} onSent={reload} />}
    </div></div>
  );
}
