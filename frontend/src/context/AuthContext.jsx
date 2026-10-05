import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('ss_token'));

  useEffect(() => {
    if (!localStorage.getItem('ss_token')) return;
    api.get('/auth/me').then(r => setUser(r.data.user))
      .catch(() => localStorage.removeItem('ss_token'))
      .finally(() => setLoading(false));
  }, []);

  const save = ({ token, user }) => { localStorage.setItem('ss_token', token); setUser(user); return user; };
  const login = async (email, password) => save((await api.post('/auth/login', { email, password })).data);
  const register = async body => save((await api.post('/auth/register', body)).data);
  const logout = () => { localStorage.removeItem('ss_token'); setUser(null); };

  return <Ctx.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
