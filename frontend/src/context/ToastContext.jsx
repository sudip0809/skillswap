import { createContext, useCallback, useContext, useState } from 'react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setItems(l => [...l, { id, message, type }]);
    setTimeout(() => setItems(l => l.filter(i => i.id !== id)), 4500);
  }, []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="toast-wrap" aria-live="polite">
        {items.map(i => (
          <div key={i.id} className={`toast show align-items-center text-bg-${i.type} border-0`} role="status">
            <div className="d-flex"><div className="toast-body">{i.message}</div>
              <button className="btn-close btn-close-white me-2 m-auto" onClick={() => setItems(l => l.filter(x => x.id !== i.id))} aria-label="Close" /></div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
