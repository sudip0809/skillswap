import { useEffect } from 'react';

export const Loading = ({ text = 'Loading…' }) => (
  <div className="text-center text-secondary py-5"><div className="spinner-border spinner-border-sm me-2" role="status" />{text}</div>
);
export const ErrorBox = ({ children }) => (children ? <div className="alert alert-danger py-2" role="alert">{children}</div> : null);
export const Empty = ({ icon = 'inbox', title, children }) => (
  <div className="text-center text-secondary py-5 px-3">
    <i className={`bi bi-${icon} fs-1 d-block mb-2`} />
    <div className="fw-semibold text-body">{title}</div>
    {children && <div className="mt-2">{children}</div>}
  </div>
);

const COLORS = ['#0e7c86', '#c2571a', '#5b4bb7', '#2f7d4f', '#b03a6a', '#2c5fa8', '#8a6d1d'];
export function Avatar({ name = '?', size = 44 }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const color = COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  return <span className="avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>{initials}</span>;
}

export function Stars({ value = 0, onChange, size = '1rem' }) {
  return (
    <span style={{ fontSize: size, color: '#e8a33d', whiteSpace: 'nowrap' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <i key={n} role={onChange ? 'button' : undefined} className={`bi bi-star${value >= n ? '-fill' : value >= n - 0.5 ? '-half' : ''} ${onChange ? 'cursor-pointer' : ''}`}
          onClick={onChange ? () => onChange(n) : undefined} />
      ))}
    </span>
  );
}
export const Rating = ({ avg, count }) => (count ? <span className="small"><Stars value={avg} /> <strong>{avg}</strong> <span className="text-secondary">({count})</span></span> : <span className="small text-secondary">No ratings yet</span>);

export const Chips = ({ skills = [], kind = 'teach', showLevel = true }) => (
  <>{skills.map(s => <span key={s.name} className={`chip chip-${kind}`}>{s.name}{showLevel && <small>{s.level}</small>}</span>)}</>
);

export function Modal({ title, onClose, children, size = '' }) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    const esc = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', esc); };
  }, [onClose]);
  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" onMouseDown={e => e.target === e.currentTarget && onClose()}>
        <div className={`modal-dialog modal-dialog-scrollable modal-dialog-centered ${size}`}>
          <div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">{title}</h5><button className="btn-close" onClick={onClose} aria-label="Close" /></div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
