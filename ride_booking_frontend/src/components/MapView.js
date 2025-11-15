import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Default icon fix for Leaflet in CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/**
 * PUBLIC_INTERFACE
 * FitBounds component to adjust map view to given coordinates.
 */
function FitBounds({ coords }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords && coords.length >= 2) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
}

/**
 * PUBLIC_INTERFACE
 * MapView displays an OSM map with optional pickup/dropoff markers and route polyline.
 */
export default function MapView({ center = [37.7749, -122.4194], zoom = 13, pickup, dropoff, route }) {
  const coords = [];
  if (pickup?.lat && pickup?.lng) coords.push([pickup.lat, pickup.lng]);
  if (dropoff?.lat && dropoff?.lng) coords.push([dropoff.lat, dropoff.lng]);

  return (
    <div className="map-wrapper" role="region" aria-label="Ride map">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pickup && pickup.lat && pickup.lng && <Marker position={[pickup.lat, pickup.lng]} />}
        {dropoff && dropoff.lat && dropoff.lng && <Marker position={[dropoff.lat, dropoff.lng]} />}
        {route && route.length > 1 && (
          <Polyline positions={route} color="#2563EB" weight={5} opacity={0.7} />
        )}
        <FitBounds coords={coords} />
      </MapContainer>
    </div>
  );
}
