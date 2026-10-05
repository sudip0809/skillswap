import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api, { realtimeUrl } from '../api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const Ctx = createContext({ socket: null, unread: 0, refreshUnread: () => {} });
export const useRealtime = () => useContext(Ctx);

// subscribe to a socket event for as long as the component is mounted
export function useSocketEvent(event, handler) {
  const { socket } = useRealtime();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!socket) return;
    const h = (...a) => ref.current(...a);
    socket.on(event, h);
    return () => socket.off(event, h);
  }, [socket, event]);
}

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [socket, setSocket] = useState(null);
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(() => {
    api.get('/notifications').then(r => setUnread(r.data.unread)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) { setSocket(null); setUnread(0); return; }
    const s = io(realtimeUrl, { auth: { token: localStorage.getItem('ss_token') } });
    setSocket(s);
    refreshUnread();
    return () => s.disconnect();
  }, [user?._id]); // eslint-disable-line

  useEffect(() => {
    if (!socket) return;
    const onNote = n => { setUnread(u => u + 1); toast(n.message, 'dark'); };
    socket.on('notification', onNote);
    return () => socket.off('notification', onNote);
  }, [socket, toast]);

  return <Ctx.Provider value={{ socket, unread, setUnread, refreshUnread }}>{children}</Ctx.Provider>;
}
