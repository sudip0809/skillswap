import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ErrorBox } from '../components/ui';
import { SkillInput, TagInput } from '../components/SkillInput';

export default function ProfileForm({ setup = false }) {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [bio, setBio] = useState(user.bio || '');
  const [city, setCity] = useState(user.city || '');
  const [teach, setTeach] = useState(user.skillsTeach || []);
  const [want, setWant] = useState(user.skillsWant || []);
  const [languages, setLanguages] = useState(user.languages || []);
  const [mode, setMode] = useState(user.learningMode || 'online');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await api.put('/users/profile', { bio, city, skillsTeach: teach, skillsWant: want, languages, learningMode: mode });
      setUser(r.data.user); toast('Profile saved'); nav('/dashboard');
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="container page"><div className="row justify-content-center"><div className="col-lg-8">
      <h1 className="h3">{setup ? 'Create your profile' : 'Edit your profile'}</h1>
      <p className="text-secondary">{setup ? 'Matches are built from this, so be specific.' : 'Changes affect your match scores straight away.'}</p>
      <form onSubmit={submit} className="card"><div className="card-body p-4">
        <ErrorBox>{error}</ErrorBox>
        <div className="mb-4"><label className="form-label">Bio</label><textarea className="form-control" rows="3" maxLength="500" value={bio} onChange={e => setBio(e.target.value)} placeholder="Who are you and how do you like to teach?" /></div>
        <div className="mb-4"><label className="form-label"><span className="legend-dot" style={{ background: 'var(--ss-teach)' }} />Skills I teach</label>
          <SkillInput kind="teach" value={teach} onChange={setTeach} placeholder="e.g. React" levelLabel="Your level in this skill" />
          <div className="form-text">The level is how well you know it.</div></div>
        <div className="mb-4"><label className="form-label"><span className="legend-dot" style={{ background: 'var(--ss-learn)' }} />Skills I want to learn</label>
          <SkillInput kind="learn" value={want} onChange={setWant} placeholder="e.g. Java" levelLabel="Level you want to learn at" />
          <div className="form-text">The level is where you are starting from.</div></div>
        <div className="mb-4"><label className="form-label">Languages I can use in sessions</label><TagInput value={languages} onChange={setLanguages} placeholder="e.g. English" /></div>
        <div className="row g-3 mb-4">
          <div className="col-md-6"><label className="form-label">Learning mode</label>
            <select className="form-select" value={mode} onChange={e => setMode(e.target.value)}>
              <option value="online">Online</option><option value="offline">In person</option><option value="both">Both</option>
            </select></div>
          <div className="col-md-6"><label className="form-label">City</label><input className="form-control" value={city} onChange={e => setCity(e.target.value)} placeholder="Needed to match for in-person sessions" /></div>
        </div>
        <div className="d-flex justify-content-end gap-2">
          {!setup && <button type="button" className="btn btn-light" onClick={() => nav(-1)}>Cancel</button>}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : setup ? 'Save and continue' : 'Save changes'}</button>
        </div>
      </div></form>
    </div></div></div>
  );
}
