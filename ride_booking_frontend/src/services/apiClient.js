const API_BASE_RAW = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';
const WS_URL = process.env.REACT_APP_WS_URL || '';

/**
 * Normalize a base URL by removing trailing slashes.
 */
function normalizeBase(url) {
  return String(url || '').replace(/\/+$/, '');
}

const API_BASE = normalizeBase(API_BASE_RAW);

// Early validation to prevent silent relative fetches to the frontend dev server.
if (!API_BASE) {
  // eslint-disable-next-line no-console
  console.warn(
    '[apiClient] REACT_APP_API_BASE or REACT_APP_BACKEND_URL is not set. ' +
      'Auth and API calls will fail (requests will target the frontend origin). ' +
      'Set REACT_APP_API_BASE to your backend, e.g., http://localhost:4000'
  );
}

/**
 * PUBLIC_INTERFACE
 * getApiBase returns the configured API base URL from environment variables.
 */
export function getApiBase() {
  return API_BASE;
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
  if (!API_BASE) {
    throw new Error(
      'API base URL is not configured. Please set REACT_APP_API_BASE or REACT_APP_BACKEND_URL in .env'
    );
  }
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const url = `${API_BASE}${cleanPath}`.replace(/([^:]\/)\/+/g, '$1'); // collapse accidental double slashes (but not after protocol)
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  try {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    // ignore storage errors (e.g., SSR or private mode)
  }
  let resp;
  try {
    resp = await fetch(url, { ...options, headers, credentials: 'include' });
  } catch (e) {
    throw new Error(`Network error calling ${url}: ${e?.message || e}`);
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const snippet = text && text.length > 200 ? text.slice(0, 200) + '…' : text;
    throw new Error(`API error ${resp.status} on ${cleanPath}: ${snippet || resp.statusText}`);
  }
  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('application/json')) return resp.json();
  return resp.text();
}
