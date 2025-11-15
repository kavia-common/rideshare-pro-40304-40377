import React, { useMemo, useState } from 'react';
import MapView from '../components/MapView';
import { useDispatch, useSelector } from 'react-redux';
import { setPickup, setDropoff, setStatus, resetRide } from '../store/slices/rideSlice';
import { apiFetch } from '../services/apiClient';
import { useRealtime } from '../hooks/useRealtime';

/**
 * PUBLIC_INTERFACE
 * MapBooking page now calls backend to create a ride and subscribes to WS updates.
 */
export default function MapBooking() {
  const ride = useSelector(s => s.ride);
  const auth = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const [pickupText, setPickupText] = useState(ride.pickup);
  const [dropoffText, setDropoffText] = useState(ride.dropoff);
  const [rideId, setRideId] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Simple demo: map text presence to fixed coords
  const pickupCoord = useMemo(() => (pickupText ? { lat: 37.776, lng: -122.417 } : null), [pickupText]);
  const dropoffCoord = useMemo(() => (dropoffText ? { lat: 37.784, lng: -122.409 } : null), [dropoffText]);

  const { data: liveRide, error: wsError, isWs } = useRealtime(rideId ? `/rides/${rideId}` : '', { intervalMs: 2000 });

  async function requestRide() {
    setApiError(null);
    if (!auth?.token) {
      setApiError('Please sign in first.');
      return;
    }
    if (!pickupCoord || !dropoffCoord) return;

    dispatch(setPickup(pickupText));
    dispatch(setDropoff(dropoffText));
    dispatch(setStatus('searching'));
    try {
      const created = await apiFetch('/rides', {
        method: 'POST',
        body: JSON.stringify({
          pickup: pickupCoord,
          dropoff: dropoffCoord,
        }),
      });
      setRideId(created.id);
      dispatch(setStatus(created.status || 'assigned'));
    } catch (e) {
      setApiError(e?.message || 'Failed to create ride');
      dispatch(setStatus('idle'));
    }
  }

  function cancel() {
    dispatch(resetRide());
    setRideId(null);
  }

  const route = pickupCoord && dropoffCoord ? [
    [pickupCoord.lat, pickupCoord.lng],
    [dropoffCoord.lat, dropoffCoord.lng],
  ] : null;

  const currentStatus = liveRide?.status || ride.status;
  const driverInfo = liveRide?.driverId ? `Driver #${liveRide.driverId}` : null;
  const driverPos = liveRide?.meta?.driverPos;

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
            {apiError && <div className="subtitle" style={{ color: '#EF4444' }}>{apiError}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" onClick={requestRide} disabled={!pickupText || !dropoffText || currentStatus === 'searching'}>
                {currentStatus === 'searching' ? 'Finding driver…' : 'Request ride'}
              </button>
              <button className="btn btn-outline" onClick={cancel}>Cancel</button>
            </div>
            {currentStatus !== 'idle' && (
              <div className="card" style={{ background: 'rgba(37,99,235,0.05)' }}>
                <strong>Status:</strong> {currentStatus} {isWs ? '(live)' : '(poll)'}
                {driverInfo && (
                  <div style={{ marginTop: 6 }}>
                    <div>{driverInfo}</div>
                    {liveRide?.price != null && <div>Price: ${liveRide.price}</div>}
                    {driverPos && <div>Driver pos: {driverPos.lat.toFixed(5)}, {driverPos.lng.toFixed(5)}</div>}
                  </div>
                )}
                {wsError && <div className="subtitle" style={{ color: '#EF4444' }}>Realtime error: {String(wsError)}</div>}
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
