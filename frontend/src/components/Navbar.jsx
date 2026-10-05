import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unread } = useRealtime();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const close = () => { setOpen(false); setMenu(false); };
  const link = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <nav className="navbar navbar-expand-lg ss-nav sticky-top" data-bs-theme="dark">
      <div className="container">
        <Link to={user ? '/dashboard' : '/'} className="brand" onClick={close}><span className="swap-mark"><i className="bi bi-arrow-left-right" /></span>SkillSwap</Link>
        <button className="navbar-toggler" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><span className="navbar-toggler-icon" /></button>
        <div className={`collapse navbar-collapse${open ? ' show' : ''}`}>
          {user && user.profileComplete ? (
            <ul className="navbar-nav me-auto gap-lg-1 mt-2 mt-lg-0" onClick={close}>
              <li className="nav-item"><NavLink className={link} to="/dashboard">Dashboard</NavLink></li>
              <li className="nav-item"><NavLink className={link} to="/matches">Find matches</NavLink></li>
              <li className="nav-item"><NavLink className={link} to="/requests">Requests</NavLink></li>
              <li className="nav-item"><NavLink className={link} to="/swaps">My swaps</NavLink></li>
              <li className="nav-item"><NavLink className={link} to="/sessions">Sessions</NavLink></li>
            </ul>
          ) : <div className="me-auto" />}
          <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
            {user ? (
              <>
                <Link to="/notifications" className="btn btn-sm btn-outline-light position-relative" onClick={close} aria-label="Notifications">
                  <i className="bi bi-bell" />
                  {unread > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark dot-badge">{unread > 99 ? '99+' : unread}</span>}
                </Link>
                <div className="position-relative">
                  <button className="btn btn-sm btn-outline-light" onClick={() => setMenu(!menu)}>{user.name.split(' ')[0]} <i className="bi bi-chevron-down small" /></button>
                  {menu && (
                    <ul className="dropdown-menu dropdown-menu-end show" style={{ right: 0 }}>
                      <li><Link className="dropdown-item" to="/profile/edit" onClick={close}>Edit profile</Link></li>
                      <li><Link className="dropdown-item" to={`/users/${user._id}`} onClick={close}>My public profile</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><button className="dropdown-item" onClick={() => { close(); logout(); nav('/'); }}>Log out</button></li>
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-outline-light" onClick={close}>Log in</Link>
                <Link to="/register" className="btn btn-sm btn-warning" onClick={close}>Create account</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
