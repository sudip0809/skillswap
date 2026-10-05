import { useEffect, useRef, useState } from 'react';
import api, { errMsg } from '../api';
import useFetch from '../hooks/useFetch';
import { useSocketEvent, useRealtime } from '../context/RealtimeContext';
import { useToast } from '../context/ToastContext';
import { Empty, ErrorBox, Loading } from './ui';
import SessionCard from './SessionCard';
import SessionFormModal from './SessionFormModal';
import { fmtDateTime, fmtSize, fmtTime, idOf, timeAgo } from '../utils';

/* ---------- Real-time chat ---------- */
export function ChatPanel({ swap, me, partner }) {
  const { socket } = useRealtime();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const box = useRef(null);
  const timer = useRef(null);
  const sid = String(swap._id);

  useEffect(() => { api.get(`/messages/${sid}`).then(r => setMsgs(r.data)).catch(e => setError(errMsg(e))); }, [sid]);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs, typing]);

  useSocketEvent('message:new', ({ swap: s, message }) => {
    if (s !== sid) return;
    setMsgs(l => (l.some(m => m._id === message._id) ? l : [...l, message]));
    if (String(message.sender) !== String(me._id)) api.post(`/messages/${sid}/read`).catch(() => {});
  });
  useSocketEvent('typing', ({ swap: s, userId, isTyping }) => { if (s === sid && userId !== String(me._id)) setTyping(isTyping); });

  const onType = v => {
    setText(v);
    if (!socket) return;
    socket.emit('typing', { swapId: sid, isTyping: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => socket.emit('typing', { swapId: sid, isTyping: false }), 1500);
  };
  const send = async e => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText(''); setError('');
    try { const r = await api.post(`/messages/${sid}`, { text: t }); setMsgs(l => (l.some(m => m._id === r.data._id) ? l : [...l, r.data])); }
    catch (err) { setError(errMsg(err)); setText(t); }
  };

  return (
    <div>
      <div className="chat-box mb-2" ref={box}>
        {msgs.length === 0 && <Empty icon="chat-dots" title={`Say hello to ${partner.name}`}>Agree on goals and a first session time.</Empty>}
        {msgs.map(m => {
          const mine = idOf(m.sender) === String(me._id);
          return <div key={m._id} className={`bubble ${mine ? 'me' : 'them'}`}>{m.text}<span className="t">{fmtTime(m.createdAt)}</span></div>;
        })}
        {typing && <div className="small text-secondary">{partner.name} is typing…</div>}
      </div>
      <ErrorBox>{error}</ErrorBox>
      {swap.status === 'accepted' ? (
        <form className="input-group" onSubmit={send}>
          <input className="form-control" placeholder="Write a message" value={text} onChange={e => onType(e.target.value)} maxLength="2000" />
          <button className="btn btn-primary" disabled={!text.trim()}><i className="bi bi-send" /> Send</button>
        </form>
      ) : <div className="text-secondary small">This swap is finished, so chat is read-only.</div>}
    </div>
  );
}

/* ---------- Sessions ---------- */
export function SessionsPanel({ swap, me, sessions, reload }) {
  const [form, setForm] = useState(false);
  const open = sessions.filter(s => ['proposed', 'scheduled', 'in_progress'].includes(s.status));
  const past = sessions.filter(s => !['proposed', 'scheduled', 'in_progress'].includes(s.status)).sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-secondary">Plan one session for each skill, or as many as you like.</div>
        {swap.status === 'accepted' && <button className="btn btn-primary" onClick={() => setForm(true)}><i className="bi bi-plus-lg me-1" />Propose session</button>}
      </div>
      <h2 className="h6">Upcoming & pending</h2>
      {open.length === 0 ? <Empty icon="calendar" title="Nothing planned yet" /> : open.map(s => <SessionCard key={s._id} session={s} me={me} onChange={reload} />)}
      <h2 className="h6 mt-4">Session history</h2>
      {past.length === 0 ? <div className="text-secondary small">Completed, declined and cancelled sessions appear here.</div> : past.map(s => <SessionCard key={s._id} session={s} me={me} onChange={reload} />)}
      {form && <SessionFormModal swap={swap} me={me} onClose={() => setForm(false)} onSaved={reload} />}
    </div>
  );
}

/* ---------- Shared resources ---------- */
export function ResourcesPanel({ swap, me, sessions }) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/resources', { swap: swap._id });
  useSocketEvent('resource:update', ({ swap: s }) => s === String(swap._id) && reload());
  const [kind, setKind] = useState('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [session, setSession] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const fileRef = useRef(null);

  const upload = async e => {
    e.preventDefault(); setBusy(true); setFormError('');
    const fd = new FormData();
    fd.append('swap', swap._id); fd.append('title', title); fd.append('description', description);
    if (session) fd.append('session', session);
    if (kind === 'file' && file) fd.append('file', file); else if (kind === 'link') fd.append('url', url);
    try {
      await api.post('/resources', fd);
      toast('Resource added. Share it when you are ready.');
      setTitle(''); setDescription(''); setUrl(''); setFile(null); setSession(''); if (fileRef.current) fileRef.current.value = '';
      reload();
    } catch (err) { setFormError(errMsg(err)); } finally { setBusy(false); }
  };
  const download = async r => {
    try {
      const res = await api.get(`/resources/${r._id}/download`, { responseType: 'blob' });
      const href = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = href; a.download = r.originalName; a.click(); URL.revokeObjectURL(href);
    } catch { toast('Download failed', 'danger'); }
  };
  const toggleShare = async r => { try { await api.patch(`/resources/${r._id}/share`, { shared: !r.shared }); toast(r.shared ? 'No longer shared' : 'Shared with your partner'); reload(); } catch (e) { toast(errMsg(e), 'danger'); } };
  const remove = async r => { if (!window.confirm(`Delete "${r.title}"?`)) return; try { await api.delete(`/resources/${r._id}`); toast('Deleted'); reload(); } catch (e) { toast(errMsg(e), 'danger'); } };

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <form className="card" onSubmit={upload}><div className="card-body">
          <h2 className="h6">Add a resource</h2>
          <ErrorBox>{formError}</ErrorBox>
          <div className="btn-group mb-3" role="group">
            {[['file', 'File'], ['link', 'Link']].map(([k, l]) => <button type="button" key={k} className={`btn btn-sm ${kind === k ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setKind(k)}>{l}</button>)}
          </div>
          <input className="form-control mb-2" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required maxLength="120" />
          {kind === 'file' ? <input ref={fileRef} type="file" className="form-control mb-2" onChange={e => setFile(e.target.files[0] || null)} />
            : <input className="form-control mb-2" placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)} />}
          <textarea className="form-control mb-2" rows="2" placeholder="Description (optional)" maxLength="300" value={description} onChange={e => setDescription(e.target.value)} />
          <select className="form-select mb-3" value={session} onChange={e => setSession(e.target.value)}>
            <option value="">Not linked to a session</option>
            {sessions.map(s => <option key={s._id} value={s._id}>{s.skill} · {fmtDateTime(s.startAt)}</option>)}
          </select>
          <button className="btn btn-primary w-100" disabled={busy || !title || (kind === 'file' ? !file : !url)}>{busy ? 'Uploading…' : 'Upload'}</button>
          <div className="form-text">Files up to 20 MB. Only you can see a resource until you share it.</div>
        </div></form>
      </div>
      <div className="col-lg-7">
        <ErrorBox>{error}</ErrorBox>
        {loading ? <Loading /> : data.length === 0 ? <Empty icon="folder2-open" title="No resources yet">Upload notes, slides or links, then share them with your partner.</Empty> : data.map(r => {
          const mine = idOf(r.uploader) === String(me._id);
          return (
            <div className="card mb-2" key={r._id}><div className="card-body py-2 d-flex gap-3 align-items-center">
              <i className={`bi bi-${r.kind === 'link' ? 'link-45deg' : 'file-earmark-text'} fs-3 text-secondary`} />
              <div className="flex-grow-1">
                <div className="fw-semibold">{r.title}</div>
                <div className="small text-secondary">{mine ? 'You' : r.uploader.name} · {timeAgo(r.createdAt)}{r.kind === 'file' && ` · ${fmtSize(r.size)}`}{r.session && ` · ${r.session.skill} session`}</div>
                {r.description && <div className="small">{r.description}</div>}
              </div>
              {mine && <span className={`badge text-bg-${r.shared ? 'success' : 'secondary'}`}>{r.shared ? 'Shared' : 'Private'}</span>}
              {r.kind === 'link' ? <a className="btn btn-sm btn-outline-primary" href={r.url} target="_blank" rel="noreferrer">Open</a> : <button className="btn btn-sm btn-outline-primary" onClick={() => download(r)}>Download</button>}
              {mine && <>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleShare(r)}>{r.shared ? 'Unshare' : 'Share'}</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => remove(r)} aria-label="Delete"><i className="bi bi-trash" /></button></>}
            </div></div>);
        })}
      </div>
    </div>
  );
}

/* ---------- Progress ---------- */
export function ProgressPanel({ swap, me, sessions }) {
  const meId = String(me._id);
  const rows = [
    { skill: swap.offeredSkill, teacher: swap.from }, { skill: swap.wantedSkill, teacher: swap.to }
  ].map(r => {
    const mine = sessions.filter(s => s.skill === r.skill && idOf(s.teacher) === idOf(r.teacher));
    const done = mine.filter(s => s.status === 'completed');
    const ahead = mine.filter(s => ['scheduled', 'in_progress'].includes(s.status));
    const total = done.length + ahead.length;
    return { ...r, done: done.length, ahead: ahead.length, pct: total ? Math.round(100 * done.length / total) : 0, hours: Math.round(done.reduce((a, s) => a + s.duration, 0) / 6) / 10, iTeach: idOf(r.teacher) === meId };
  });
  const toReview = sessions.filter(s => s.status === 'completed' && !s.myReview).length;
  return (
    <div className="row g-3">
      {rows.map(r => (
        <div className="col-md-6" key={r.skill}><div className="card h-100"><div className="card-body">
          <span className={`chip ${r.iTeach ? 'chip-teach' : 'chip-learn'}`}>{r.iTeach ? 'You teach' : 'You learn'}</span>
          <h2 className="h5">{r.skill}</h2>
          <div className="small text-secondary mb-2">{r.iTeach ? 'You teach' : `${r.teacher.name} teaches`} · {r.hours} h completed</div>
          <div className="progress mb-2" role="progressbar" aria-valuenow={r.pct} aria-valuemin="0" aria-valuemax="100"><div className="progress-bar" style={{ width: `${r.pct}%`, background: r.iTeach ? undefined : 'var(--ss-learn)' }} /></div>
          <div className="small">{r.done} completed · {r.ahead} coming up</div>
        </div></div></div>
      ))}
      {toReview > 0 && <div className="col-12"><div className="alert alert-warning mb-0">You have {toReview} completed {toReview === 1 ? 'session' : 'sessions'} waiting for your rating. Open the Sessions tab to rate.</div></div>}
    </div>
  );
}
