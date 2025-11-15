import React from 'react';
import { Link } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * Landing screen with Ocean Professional theme and hero content.
 */
export default function Landing() {
  return (
    <div>
      <section className="section">
        <div className="hero">
          <div>
            <span className="pill">Ocean Professional</span>
            <h1 className="title-xl">Your premium ride, on your schedule.</h1>
            <p className="subtitle">
              Book reliable rides with live tracking, transparent pricing, and professional drivers.
              Powered by OpenStreetMap for privacy-friendly maps.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link className="btn" to="/book">Book a ride</Link>
              <Link className="btn btn-outline" to="/login">Sign in</Link>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="grid-2">
                <div className="input"><span>📍</span><input placeholder="Pickup location" aria-label="Pickup" /></div>
                <div className="input"><span>🏁</span><input placeholder="Dropoff location" aria-label="Dropoff" /></div>
              </div>
              <div className="grid-2">
                <div className="input"><span>⏱️</span><input placeholder="When" aria-label="When" /></div>
                <div className="input"><span>👥</span><input placeholder="Passengers" aria-label="Passengers" /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Link className="btn" to="/book">Preview on Map</Link>
                <Link className="btn btn-outline" to="/history">View History</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <div className="grid-2">
            <div>
              <h3 style={{ marginTop: 0 }}>Why Rideshare Pro?</h3>
              <ul>
                <li>Professional drivers with high ratings</li>
                <li>Live tracking with real-time updates</li>
                <li>Transparent pricing and ETAs</li>
              </ul>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="card" style={{ padding: 14 }}>
                  <div className="pill">Realtime</div>
                  <p className="subtitle">Follow your ride's progress live with reliable updates.</p>
                </div>
                <div className="card" style={{ padding: 14 }}>
                  <div className="pill">Comfort</div>
                  <p className="subtitle">Ride in clean, modern vehicles with friendly drivers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">© {new Date().getFullYear()} Rideshare Pro — All rights reserved.</footer>
    </div>
  );
}
