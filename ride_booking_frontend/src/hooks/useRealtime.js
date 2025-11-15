import { useEffect, useRef, useState } from 'react';
import { getWsUrl, apiFetch } from '../services/apiClient';

/**
 * PUBLIC_INTERFACE
 * useRealtime subscribes to /rides/:id updates via WebSocket if available, otherwise polls.
 * Returns { data, error, isWs }.
 */
export function useRealtime(resourcePath, { intervalMs = 3000 } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isWs, setIsWs] = useState(false);
  const wsRef = useRef(null);
  const pathRef = useRef(resourcePath);

  useEffect(() => {
    pathRef.current = resourcePath;
  }, [resourcePath]);

  useEffect(() => {
    const wsBase = getWsUrl();
    const canWs = typeof WebSocket !== 'undefined' && wsBase;
    let pollId;

    async function poll() {
      try {
        const d = await apiFetch(resourcePath);
        setData(d);
        setError(null);
      } catch (e) {
        setError(e);
      }
    }

    if (canWs) {
      try {
        const ws = new WebSocket(`${wsBase}${resourcePath}`);
        wsRef.current = ws;
        setIsWs(true);
        ws.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            setData(payload);
          } catch {
            // ignore
          }
        };
        ws.onerror = (e) => {
          setError(new Error('WebSocket error'));
        };
        ws.onclose = () => {
          setIsWs(false);
        };
      } catch (e) {
        setIsWs(false);
        poll();
        pollId = setInterval(poll, intervalMs);
      }
    } else {
      poll();
      pollId = setInterval(poll, intervalMs);
    }

    return () => {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      if (pollId) clearInterval(pollId);
    };
  }, [resourcePath, intervalMs]);

  return { data, error, isWs };
}
