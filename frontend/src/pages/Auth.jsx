import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import { ErrorBox } from '../components/ui';

function Shell({ title, sub, children, foot }) {
  return (
    <div className="container page"><div className="row justify-content-center"><div className="col-md-7 col-lg-5">
      <div className="card"><div className="card-body p-4">
        <h1 className="h3">{title}</h1><p className="text-secondary">{sub}</p>{children}
      </div></div>
      <p className="text-center mt-3 text-secondary">{foot}</p>
    </div></div></div>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.profileComplete ? '/dashboard' : '/profile/setup'} replace />;
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { const u = await login(f.email, f.password); nav(u.profileComplete ? loc.state?.from || '/dashboard' : '/profile/setup', { replace: true }); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Log in" sub="Welcome back to SkillSwap." foot={<>New here? <Link to="/register">Create an account</Link></>}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <div className="mb-3"><label className="form-label">Email</label><input type="email" className="form-control" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Password</label><input type="password" className="form-control" required value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></div>
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.profileComplete ? '/dashboard' : '/profile/setup'} replace />;
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { await register(f); nav('/profile/setup', { replace: true }); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Create your account" sub="Next you'll set up your teaching and learning profile." foot={<>Already have an account? <Link to="/login">Log in</Link></>}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <div className="mb-3"><label className="form-label">Full name</label><input className="form-control" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Email</label><input type="email" className="form-control" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Password</label><input type="password" className="form-control" minLength="6" required value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /><div className="form-text">At least 6 characters.</div></div>
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
    </Shell>
  );
}
