import React from 'react';

/**
 * PUBLIC_INTERFACE
 * History page shows a simple recent trips list placeholder.
 */
export default function History() {
  const trips = [
    { id: 'T-1024', from: 'Market St', to: 'Presidio', when: 'Yesterday 5:40 PM', price: '$18.40' },
    { id: 'T-1023', from: 'Downtown', to: 'Airport', when: 'Mon 9:15 AM', price: '$36.20' },
  ];
  return (
    <div className="section">
      <h2 style={{ marginTop: 0 }}>Trip history</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {trips.map(t => (
          <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 800 }}>{t.from} → {t.to}</div>
              <div className="subtitle">{t.when}</div>
            </div>
            <div style={{ fontWeight: 800 }}>{t.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
