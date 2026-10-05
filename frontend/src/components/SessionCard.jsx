import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { STATUS, fmtDate, fmtTime, idOf } from '../utils';
import { Stars } from './ui';
import SessionFormModal from './SessionFormModal';
import ReviewModal from './ReviewModal';
import { useToast } from '../context/ToastContext';

export default function SessionCard({ session: s, me, onChange, showSwapLink = false }) {
  const toast = useToast();
  const [edit, setEdit] = useState(false);
  const [review, setReview] = useState(false);
  const [log, setLog] = useState(false);
  const [busy, setBusy] = useState(false);

  const iTeach = idOf(s.teacher) === String(me._id);
  const partner = iTeach ? s.learner : s.teacher;
  const proposedByMe = idOf(s.proposedBy) === String(me._id);
  const st = STATUS[s.status];
  const now = Date.now();
  const canJoin = s.status === 'scheduled' && now >= new Date(s.startAt) - 15 * 60000 && now <= new Date(s.endAt);

  const act = async (path, body, msg) => {
    setBusy(true);
    try { await api.post(`/sessions/${s._id}/${path}`, body); if (msg) toast(msg); onChange(); }
    catch (e) { toast(errMsg(e), 'danger'); } finally { setBusy(false); }
  };
  const cancel = () => {
    const reason = window.prompt('Reason for cancelling (optional)');
    if (reason !== null) act('cancel', { reason }, 'Session cancelled');
  };

  return (
    <div className={`card mb-3 session-bar ${iTeach ? '' : 'learning'}`}>
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between gap-2">
          <div>
            <div className="fw-semibold fs-5 display-font">{s.skill}</div>
            <div className="text-secondary small">{iTeach ? `You teach ${partner.name}` : `${partner.name} teaches you`}</div>
          </div>
          <div className="text-end">
            <span className={`badge text-bg-${st.color}`}>{st.label}</span>
            {s.status === 'proposed' && <div className="small text-secondary mt-1">{proposedByMe ? `Waiting for ${partner.name}` : `${partner.name} proposed this`}</div>}
          </div>
        </div>
        <div className="mt-2 small">
          <i className="bi bi-calendar-event me-1" />{fmtDate(s.startAt)} · {fmtTime(s.startAt)}–{fmtTime(s.endAt)} ({s.duration} min)
          <span className="mx-2" />
          {s.mode === 'online' ? <><i className="bi bi-camera-video me-1" />Online</> : <><i className="bi bi-geo-alt me-1" />{s.location}</>}
        </div>
        {s.notes && <div className="small text-secondary mt-1">{s.notes}</div>}
        {s.cancelReason && <div className="small text-danger mt-1">Reason: {s.cancelReason}</div>}
        {['scheduled', 'in_progress'].includes(s.status) && s.mode === 'online' && s.meetingLink && (
          <div className="small mt-1"><a href={s.meetingLink} target="_blank" rel="noreferrer"><i className="bi bi-link-45deg" /> Meeting link</a></div>
        )}

        <div className="d-flex flex-wrap gap-2 mt-3 align-items-center">
          {s.status === 'proposed' && !proposedByMe && <>
            <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => act('respond', { action: 'accept' }, 'Session scheduled')}>Accept</button>
            <button className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={() => act('respond', { action: 'reject' }, 'Proposal declined')}>Decline</button>
            <button className="btn btn-sm btn-outline-primary" onClick={() => setEdit(true)}>Suggest new time</button>
          </>}
          {s.status === 'proposed' && proposedByMe && <>
            <button className="btn btn-sm btn-outline-primary" onClick={() => setEdit(true)}>Change time</button>
            <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={cancel}>Withdraw</button>
          </>}
          {s.status === 'scheduled' && <>
            <button className="btn btn-sm btn-primary" disabled={busy || !canJoin} onClick={() => act('start', {}, 'You joined the session')}>Join session</button>
            {!canJoin && <span className="small text-secondary">Opens 15 min before start</span>}
            <button className="btn btn-sm btn-outline-primary" onClick={() => setEdit(true)}>Reschedule</button>
            <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={cancel}>Cancel</button>
          </>}
          {s.status === 'in_progress' && <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => act('complete', {}, 'Session completed')}>Mark as completed</button>}
          {s.status === 'completed' && (s.myReview
            ? <span className="small">Your rating: <Stars value={s.myReview.rating} /></span>
            : <button className="btn btn-sm btn-learn" onClick={() => setReview(true)}>Rate {partner.name}</button>)}
          {showSwapLink && <Link to={`/swaps/${idOf(s.swap)}`} className="btn btn-sm btn-link ms-auto">Open exchange room</Link>}
          <button className="btn btn-sm btn-link text-secondary ms-auto" onClick={() => setLog(!log)}>{log ? 'Hide' : 'Activity'}</button>
        </div>
        {log && (
          <ul className="small text-secondary mt-2 mb-0 ps-3">
            {s.history.map((h, i) => <li key={i}>{h.action}{h.note ? ` — ${h.note}` : ''} · {fmtDate(h.at)} {fmtTime(h.at)}</li>)}
          </ul>
        )}
      </div>
      {edit && <SessionFormModal swap={s.swap.from && s.swap.from.name ? s.swap : { from: { _id: idOf(s.swap.from) }, to: { _id: idOf(s.swap.to) } }} me={me} session={s} onClose={() => setEdit(false)} onSaved={onChange} />}
      {review && <ReviewModal session={s} partnerName={partner.name} onClose={() => setReview(false)} onSaved={onChange} />}
    </div>
  );
}
