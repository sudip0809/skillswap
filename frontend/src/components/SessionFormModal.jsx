import { useState } from 'react';
import api, { errMsg } from '../api';
import { Modal, ErrorBox } from './ui';
import { idOf } from '../utils';
import { useToast } from '../context/ToastContext';

const pad = n => String(n).padStart(2, '0');
const toDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Propose a new session (swap given) or reschedule an existing one (session given)
export default function SessionFormModal({ swap, me, session, onClose, onSaved }) {
  const toast = useToast();
  const partner = idOf(swap.from) === String(me._id) ? swap.to : swap.from;
  const start = session ? new Date(session.startAt) : null;
  const [teacher, setTeacher] = useState(session ? idOf(session.teacher) : idOf(swap.from));
  const [date, setDate] = useState(start ? toDate(start) : '');
  const [time, setTime] = useState(start ? toTime(start) : '');
  const [duration, setDuration] = useState(session ? session.duration : 60);
  const [mode, setMode] = useState(session ? session.mode : 'online');
  const [meetingLink, setLink] = useState(session?.meetingLink || '');
  const [location, setLocation] = useState(session?.location || '');
  const [notes, setNotes] = useState(session?.notes || '');
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);

  const options = [
    { id: idOf(swap.from), skill: swap.offeredSkill }, { id: idOf(swap.to), skill: swap.wantedSkill }
  ].map(o => ({ ...o, label: o.id === String(me._id) ? `I teach ${o.skill}` : `${partner.name} teaches ${o.skill}` }));

  const submit = async e => {
    e.preventDefault(); setError(''); setConflict(false);
    if (!date || !time) return setError('Pick a date and time');
    setBusy(true);
    const body = { startAt: new Date(`${date}T${time}`).toISOString(), duration, mode, meetingLink, location, notes };
    try {
      if (session) await api.patch(`/sessions/${session._id}`, body);
      else await api.post('/sessions', { ...body, swapId: swap._id, teacher });
      toast(session ? 'New time sent for confirmation' : 'Session proposed');
      onSaved(); onClose();
    } catch (err) { setError(errMsg(err)); setConflict(!!err.response?.data?.conflict); } finally { setBusy(false); }
  };

  return (
    <Modal title={session ? 'Reschedule session' : 'Propose a session'} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        {conflict && <div className="small text-secondary mb-2">Pick another date or time below and send again.</div>}
        {!session && (
          <div className="mb-3">
            <label className="form-label">Who teaches?</label>
            {options.map(o => (
              <div className="form-check" key={o.id}>
                <input className="form-check-input" type="radio" id={`t-${o.id}`} checked={teacher === o.id} onChange={() => setTeacher(o.id)} />
                <label className="form-check-label" htmlFor={`t-${o.id}`}>{o.label}</label>
              </div>
            ))}
          </div>
        )}
        <div className="row g-3 mb-3">
          <div className="col-sm-4"><label className="form-label">Date</label><input type="date" className="form-control" value={date} min={toDate(new Date())} onChange={e => setDate(e.target.value)} required /></div>
          <div className="col-sm-4"><label className="form-label">Time</label><input type="time" className="form-control" value={time} onChange={e => setTime(e.target.value)} required /></div>
          <div className="col-sm-4"><label className="form-label">Duration</label>
            <select className="form-select" value={duration} onChange={e => setDuration(Number(e.target.value))}>
              {[30, 45, 60, 90, 120, 180].map(m => <option key={m} value={m}>{m} min</option>)}
            </select></div>
        </div>
        <div className="mb-3">
          <label className="form-label d-block">Where</label>
          <div className="btn-group" role="group">
            {['online', 'offline'].map(m => (
              <button type="button" key={m} className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMode(m)}>{m === 'online' ? 'Online' : 'In person'}</button>
            ))}
          </div>
        </div>
        {mode === 'online'
          ? <div className="mb-3"><label className="form-label">Meeting link</label><input className="form-control" placeholder="https://meet.google.com/…" value={meetingLink} onChange={e => setLink(e.target.value)} /></div>
          : <div className="mb-3"><label className="form-label">Meeting place</label><input className="form-control" placeholder="Café, library, address…" value={location} onChange={e => setLocation(e.target.value)} /></div>}
        <div className="mb-3"><label className="form-label">What will you cover? (optional)</label><textarea className="form-control" rows="2" maxLength="500" value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light" onClick={onClose}>Close</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Checking availability…' : session ? 'Send new time' : 'Propose session'}</button>
        </div>
      </form>
    </Modal>
  );
}
