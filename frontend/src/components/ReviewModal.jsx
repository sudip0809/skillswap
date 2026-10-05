import { useState } from 'react';
import api, { errMsg } from '../api';
import { Modal, ErrorBox, Stars } from './ui';
import { useToast } from '../context/ToastContext';

export default function ReviewModal({ session, partnerName, onClose, onSaved }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.post('/reviews', { sessionId: session._id, rating, comment }); toast('Review posted'); onSaved(); onClose(); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <Modal title={`Rate your ${session.skill} session`} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <p className="text-secondary">How was the session with {partnerName}?</p>
        <div className="mb-3"><Stars value={rating} onChange={setRating} size="2rem" /></div>
        <textarea className="form-control mb-3" rows="3" maxLength="500" placeholder="Add a comment (optional)" value={comment} onChange={e => setComment(e.target.value)} />
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || !rating}>Post review</button>
        </div>
      </form>
    </Modal>
  );
}
