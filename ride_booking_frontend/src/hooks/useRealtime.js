import { useEffect, useRef, useState } from 'react';
import { getWsUrl, apiFetch } from '../services/apiClient';

/**
 * PUBLIC_INTERFACE
 * useRealtime subscribes to ride updates via WebSocket (with subscribe message) or falls back to polling the REST resource.
 * Expects resourcePath like "/rides/:id".
 * Returns { data, error, isWs }.
 */
export function useRealtime(resourcePath, { intervalMs = 3000 } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isWs, setIsWs] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const wsBase = getWsUrl();
    const canWs = typeof WebSocket !== 'undefined' && !!wsBase;
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
        // Connect to base WS URL (e.g., ws://localhost:4000/ws)
        const ws = new WebSocket(wsBase);
        wsRef.current = ws;
        setIsWs(true);

        ws.onopen = () => {
          // If resourcePath looks like /rides/:id, extract id and send subscribe
          const m = /^\/rides\/([^\/\s]+)/.exec(resourcePath || '');
          const rideId = m ? m[1] : null;
          if (rideId) {
            try {
              ws.send(JSON.stringify({ type: 'subscribe', rideId }));
            } catch {}
          }
        };

        ws.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            setData(payload);
          } catch {
            // ignore
          }
        };
        ws.onerror = () => {
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
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
      if (pollId) clearInterval(pollId);
    };
  }, [resourcePath, intervalMs]);

  return { data, error, isWs };
}
