import { useState } from 'react';
import api, { errMsg } from '../api';
import { Modal, ErrorBox } from './ui';
import { useToast } from '../context/ToastContext';

// target: the other user (needs _id, name, skillsTeach); me: current user
export default function SwapRequestModal({ target, me, match, onClose, onSent }) {
  const toast = useToast();
  const suggestWant = (match?.theyTeach || [])[0] || target.skillsTeach[0]?.name || '';
  const suggestOffer = (match?.iTeach || [])[0] || me.skillsTeach[0]?.name || '';
  const [offered, setOffered] = useState(suggestOffer);
  const [wanted, setWanted] = useState(suggestWant);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api.post('/swaps', { to: target._id, offeredSkill: offered, wantedSkill: wanted, message });
      toast(`Swap request sent to ${target.name}`);
      onSent && onSent(); onClose();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Modal title={`Swap skills with ${target.name}`} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <div className="mb-3">
          <label className="form-label"><span className="legend-dot" style={{ background: 'var(--ss-teach)' }} />I will teach</label>
          <select className="form-select" value={offered} onChange={e => setOffered(e.target.value)}>
            {me.skillsTeach.map(s => <option key={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label"><span className="legend-dot" style={{ background: 'var(--ss-learn)' }} />I want to learn</label>
          <select className="form-select" value={wanted} onChange={e => setWanted(e.target.value)}>
            {target.skillsTeach.map(s => <option key={s.name} value={s.name}>{s.name} ({s.level})</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Message (optional)</label>
          <textarea className="form-control" rows="3" maxLength="500" value={message} onChange={e => setMessage(e.target.value)} placeholder="Say hello and what you hope to get out of the swap" />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || !offered || !wanted}>{busy ? 'Sending…' : 'Send swap request'}</button>
        </div>
      </form>
    </Modal>
  );
}
