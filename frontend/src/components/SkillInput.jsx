import { useState } from 'react';
import { LEVELS } from '../utils';

// Editable list of {name, level}. kind: 'teach' (teal) or 'learn' (amber)
export function SkillInput({ value, onChange, kind = 'teach', placeholder, levelLabel }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('Beginner');
  const add = () => {
    const n = name.trim();
    if (!n || value.some(s => s.name.toLowerCase() === n.toLowerCase())) { setName(''); return; }
    onChange([...value, { name: n, level }]);
    setName('');
  };
  return (
    <div>
      <div className="input-group mb-2">
        <input className="form-control" placeholder={placeholder} value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <select className="form-select" style={{ maxWidth: 150 }} value={level} onChange={e => setLevel(e.target.value)} aria-label={levelLabel}>
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
        <button type="button" className="btn btn-outline-primary" onClick={add}>Add</button>
      </div>
      <div>
        {value.map(s => (
          <span key={s.name} className={`chip chip-${kind}`}>{s.name}<small>{s.level}</small>
            <button type="button" className="btn-x" onClick={() => onChange(value.filter(x => x.name !== s.name))} aria-label={`Remove ${s.name}`}><i className="bi bi-x-lg" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function TagInput({ value, onChange, placeholder }) {
  const [text, setText] = useState('');
  const add = () => {
    const t = text.trim();
    if (t && !value.some(v => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setText('');
  };
  return (
    <div>
      <div className="input-group mb-2">
        <input className="form-control" placeholder={placeholder} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className="btn btn-outline-primary" onClick={add}>Add</button>
      </div>
      {value.map(t => (
        <span key={t} className="chip chip-plain">{t}
          <button type="button" className="btn-x" onClick={() => onChange(value.filter(x => x !== t))} aria-label={`Remove ${t}`}><i className="bi bi-x-lg" /></button>
        </span>
      ))}
    </div>
  );
}
