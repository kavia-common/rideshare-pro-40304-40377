import React from 'react';
import { apiFetch } from '../services/apiClient';

/**
 * PUBLIC_INTERFACE
 * History page fetches recent rides from backend.
 */
export default function History() {
  const [rides, setRides] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    try {
      const data = await apiFetch('/rides?limit=20');
      setRides(data || []);
      setError(null);
    } catch (e) {
      setError(e?.message || 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  return (
    <div className="section">
      <h2 style={{ marginTop: 0 }}>Trip history</h2>
      {loading && <div className="subtitle">Loading…</div>}
      {error && <div className="subtitle" style={{ color: '#EF4444' }}>{error}</div>}
      <div style={{ display: 'grid', gap: 10 }}>
        {rides.map(r => (
          <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 800 }}>
                {(r.pickup?.address || `${r.pickup?.lat?.toFixed?.(3)}, ${r.pickup?.lng?.toFixed?.(3)}`) || 'Unknown'} →
                {' '}
                {(r.dropoff?.address || `${r.dropoff?.lat?.toFixed?.(3)}, ${r.dropoff?.lng?.toFixed?.(3)}`) || 'Unknown'}
              </div>
              <div className="subtitle">{new Date(r.createdAt).toLocaleString()} • {r.status}</div>
            </div>
            <div style={{ fontWeight: 800 }}>{r.price != null ? `$${r.price}` : ''}</div>
          </div>
        ))}
        {!loading && rides.length === 0 && !error && <div className="subtitle">No rides yet.</div>}
      </div>
    </div>
  );
}
