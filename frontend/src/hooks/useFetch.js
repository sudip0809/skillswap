import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';

export default function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const key = JSON.stringify(params || {});
  const load = useCallback(async silent => {
    if (!silent) setLoading(true);
    try { setData((await api.get(url, { params: JSON.parse(key) })).data); setError(''); }
    catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, [url, key]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: () => load(true), setData };
}
