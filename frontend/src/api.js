import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(c => {
  const t = localStorage.getItem('ss_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
export const errMsg = e => e?.response?.data?.message || (e?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running?' : e?.message) || 'Something went wrong';
export default api;
