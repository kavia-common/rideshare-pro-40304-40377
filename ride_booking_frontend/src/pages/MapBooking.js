import React, { useMemo, useState } from 'react';
import MapView from '../components/MapView';
import { useDispatch, useSelector } from 'react-redux';
import { setPickup, setDropoff, setStatus, setDriver, setTrip, resetRide } from '../store/slices/rideSlice';

/**
 * PUBLIC_INTERFACE
 * MapBooking page provides the booking flow with inputs and a live OSM map preview.
 */
export default function MapBooking() {
  const ride = useSelector(s => s.ride);
  const dispatch = useDispatch();
  const [pickupText, setPickupText] = useState(ride.pickup);
  const [dropoffText, setDropoffText] = useState(ride.dropoff);

  const pickupCoord = useMemo(() => (pickupText ? { lat: 37.776, lng: -122.417 } : null), [pickupText]);
  const dropoffCoord = useMemo(() => (dropoffText ? { lat: 37.784, lng: -122.409 } : null), [dropoffText]);

  function requestRide() {
    dispatch(setPickup(pickupText));
    dispatch(setDropoff(dropoffText));
    dispatch(setStatus('searching'));
    // Simulate driver assignment after delay
    setTimeout(() => {
      dispatch(setDriver({ name: 'Alex P.', car: 'Prius · 8JK123', rating: 4.9 }));
      dispatch(setStatus('assigned'));
      dispatch(setTrip({ id: 'T-2048', etaMin: 4 }));
      setTimeout(() => dispatch(setStatus('enroute')), 1500);
    }, 800);
  }

  function cancel() {
    dispatch(resetRide());
  }

  const route = pickupCoord && dropoffCoord ? [
    [pickupCoord.lat, pickupCoord.lng],
    [dropoffCoord.lat, dropoffCoord.lng],
  ] : null;

  return (
    <div className="section">
      <div className="grid-2">
        <div>
          <div className="card" style={{ display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0 }}>Book your ride</h2>
            <label className="input">
              <span>📍</span>
              <input placeholder="Pickup location" value={pickupText} onChange={(e) => setPickupText(e.target.value)} />
            </label>
            <label className="input">
              <span>🏁</span>
              <input placeholder="Dropoff location" value={dropoffText} onChange={(e) => setDropoffText(e.target.value)} />
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" onClick={requestRide} disabled={!pickupText || !dropoffText || ride.status === 'searching'}>
                {ride.status === 'searching' ? 'Finding driver…' : 'Request ride'}
              </button>
              <button className="btn btn-outline" onClick={cancel}>Cancel</button>
            </div>
            {ride.status !== 'idle' && (
              <div className="card" style={{ background: 'rgba(37,99,235,0.05)' }}>
                <strong>Status:</strong> {ride.status}
                {ride.driver && (
                  <div style={{ marginTop: 6 }}>
                    <div>Driver: <strong>{ride.driver.name}</strong> ({ride.driver.rating}★)</div>
                    <div>Vehicle: {ride.driver.car}</div>
                    {ride.trip && <div>ETA: {ride.trip.etaMin} min</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <MapView pickup={pickupCoord} dropoff={dropoffCoord} route={route} />
        </div>
      </div>
    </div>
  );
}
