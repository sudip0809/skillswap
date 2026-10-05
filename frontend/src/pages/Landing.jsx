import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  ['Build your profile', 'List what you can teach, what you want to learn, your level and languages.'],
  ['Find a match', 'We compare offered and wanted skills, level, rating, language and learning mode, then score each person from 0 to 100%.'],
  ['Send a swap request', 'Pick the skill you give and the skill you get. They accept or decline.'],
  ['Meet in your exchange room', 'Chat in real time, plan sessions, share resources and track progress together.'],
  ['Learn, rate, repeat', 'Complete sessions, rate each other and build your reputation.']
];
const FEATURES = [
  ['people', 'Smart matching', 'Two-way matches rank first, with a score you can inspect.'],
  ['chat-dots', 'Real-time chat', 'Talk to your swap partner the moment they accept.'],
  ['calendar-check', 'Session planning', 'Date, time, duration, online or in person, with conflict checks and reminders.'],
  ['folder2-open', 'Shared resources', 'Upload files or links and choose what your partner can see.'],
  ['star', 'Ratings & reviews', 'Every completed session builds a visible reputation.'],
  ['speedometer2', 'Your dashboard', 'Requests, upcoming sessions and progress in one place.']
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <h1>Trade what you know for what you want to learn.</h1>
              <p className="lead my-4">SkillSwap pairs you with people who teach the skill you need and want to learn the one you have. No money changes hands, just time and knowledge.</p>
              <Link to={user ? '/dashboard' : '/register'} className="btn btn-warning btn-lg me-2">{user ? 'Go to dashboard' : 'Start swapping'}</Link>
              <a href="#how" className="btn btn-outline-light btn-lg">How it works</a>
            </div>
            <div className="col-lg-5" aria-hidden="true">
              <div className="swap-diagram">
                <div className="swap-card t"><small>You teach</small><span className="fs-5 display-font">Something you know well</span></div>
                <div className="swap-arrows"><i className="bi bi-arrow-down-up" /></div>
                <div className="swap-card l"><small>You learn</small><span className="fs-5 display-font">Something you want next</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="container py-5">
        <div className="row g-4">
          <div className="col-lg-5"><h2>About SkillSwap</h2><p className="text-secondary">Everyone is good at something and curious about something else. SkillSwap turns that into a fair exchange: you teach one hour, you learn one hour.</p></div>
          <div className="col-lg-7"><div className="row g-3">
            {FEATURES.map(([icon, t, d]) => (
              <div className="col-sm-6" key={t}><div className="card h-100"><div className="card-body">
                <i className={`bi bi-${icon} fs-4`} style={{ color: 'var(--ss-teach)' }} /><h3 className="h6 mt-2">{t}</h3><p className="small text-secondary mb-0">{d}</p>
              </div></div></div>
            ))}
          </div></div>
        </div>
      </section>

      <section id="how" className="container pb-5">
        <h2 className="mb-4">How it works</h2>
        <div className="col-lg-7 px-0">
          {STEPS.map(([t, d], i) => (
            <div className="step-line" key={t}><span className="n">{i + 1}</span><h3 className="h5 mb-1">{t}</h3><p className="text-secondary mb-0">{d}</p></div>
          ))}
        </div>
      </section>

      {!user && (
        <section className="container pb-5"><div className="card text-bg-dark"><div className="card-body p-4 d-flex flex-wrap justify-content-between align-items-center gap-3" style={{ background: 'var(--ss-ink)' }}>
          <div><h2 className="h4 mb-1">Ready to find your first swap?</h2><div className="text-white-50">Create a free account and set up your profile in two minutes.</div></div>
          <div><Link to="/register" className="btn btn-warning me-2">Create account</Link><Link to="/login" className="btn btn-outline-light">Log in</Link></div>
        </div></div></section>
      )}
    </>
  );
}
