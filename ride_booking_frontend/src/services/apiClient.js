const WS_URL = process.env.REACT_APP_WS_URL || '';

/**
 * Normalize a base URL by removing trailing slashes.
 */
function normalizeBase(url) {
  return String(url || '').replace(/\/*$/, '');
}

/**
 * Resolve API base URL from the following sources, in order:
 * 1) process.env.REACT_APP_API_BASE
 * 2) window.__APP_CONFIG__.API_BASE (or BACKEND_URL as alias)
 * 3) process.env.REACT_APP_BACKEND_URL (legacy/alias)
 * If none are present, throw a clear error.
 */
function resolveApiBase() {
  const envBase = process.env.REACT_APP_API_BASE;

  const windowBase =
    typeof window !== 'undefined' &&
    window.__APP_CONFIG__ &&
    (window.__APP_CONFIG__.API_BASE || window.__APP_CONFIG__.BACKEND_URL);

  const legacyBase = process.env.REACT_APP_BACKEND_URL;

  const base = envBase || windowBase || legacyBase || '';
  const normalized = normalizeBase(base);

  if (!normalized) {
    throw new Error(
      '[apiClient] API base URL is missing. Set REACT_APP_API_BASE or provide window.__APP_CONFIG__.API_BASE at runtime.'
    );
  }
  return normalized;
}

// Cache the resolved base but allow late resolve if window config appears later.
let __API_BASE_CACHE;
try {
  __API_BASE_CACHE = resolveApiBase();
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn(String(e?.message || e));
  __API_BASE_CACHE = '';
}

// PUBLIC_INTERFACE
export function getApiBase() {
  /** Return the resolved API base URL, throwing if not configured. */
  if (!__API_BASE_CACHE) {
    // Attempt late resolve in case window config was injected after initial import.
    __API_BASE_CACHE = resolveApiBase();
  }
  return __API_BASE_CACHE;
}

// PUBLIC_INTERFACE
export function getWsUrl() {
  /** Return the configured WebSocket URL or derive from API base if absent. */
  if (WS_URL) return WS_URL;
  try {
    const base = getApiBase();
    if (base.startsWith('https://')) return base.replace(/^https:/, 'wss:') + '/ws';
    if (base.startsWith('http://')) return base.replace(/^http:/, 'ws:') + '/ws';
  } catch {
    // ignore
  }
  return '';
}

/**
 * PUBLIC_INTERFACE
 * apiFetch wraps fetch with base URL, JSON handling, and optional auth header.
 */
export async function apiFetch(path, options = {}) {
  const API_BASE = getApiBase();
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

// Startup banner to aid debugging environment at runtime.
(function logRuntimeConfig() {
  try {
    const api = getApiBase();
    const ws = getWsUrl();
    // eslint-disable-next-line no-console
    console.info(
      `[Rideshare Pro] Frontend connected to API: ${api} | WS: ${ws || '(derived/none)'}`
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Rideshare Pro] API base not resolved yet:', String(e?.message || e));
  }
})();
