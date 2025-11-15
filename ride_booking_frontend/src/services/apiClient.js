const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';
const WS_URL = process.env.REACT_APP_WS_URL || '';

/**
 * PUBLIC_INTERFACE
 * getApiBase returns the configured API base URL from environment variables.
 */
export function getApiBase() {
  return API_BASE.replace(/\/+$/, '');
}

/**
 * PUBLIC_INTERFACE
 * getWsUrl returns the configured WebSocket base URL from environment variables.
 */
export function getWsUrl() {
  return WS_URL;
}

/**
 * PUBLIC_INTERFACE
 * apiFetch wraps fetch with base URL, JSON handling, and optional auth header.
 */
export async function apiFetch(path, options = {}) {
  const url = `${getApiBase()}${path.startsWith('/') ? path : '/' + path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  try {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {}
  const resp = await fetch(url, { ...options, headers });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`API error ${resp.status}: ${text || resp.statusText}`);
  }
  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('application/json')) return resp.json();
  return resp.text();
}
