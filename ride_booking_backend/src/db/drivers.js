//
// In-memory Drivers datastore with seed data and helpers
//

/**
 * Haversine distance between two coordinates in kilometers.
 */
function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDlat = Math.sin(dLat / 2);
  const sinDlng = Math.sin(dLng / 2);
  const h =
    sinDlat * sinDlat +
    Math.cos(lat1) * Math.cos(lat2) * sinDlng * sinDlng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/**
 * Module-scoped drivers map.
 * byId: Map<id, driver>
 */
const byId = new Map();

/**
 * Seed some initial drivers around San Francisco
 * Fields: id, name, vehicleType, position {lat,lng}, available
 */
const seedDrivers = [
  { id: 'D-1001', name: 'Alex Parker', vehicleType: 'Sedan', position: { lat: 37.7749, lng: -122.4194 }, available: true },
  { id: 'D-1002', name: 'Briana Lee', vehicleType: 'SUV', position: { lat: 37.784, lng: -122.409 }, available: true },
  { id: 'D-1003', name: 'Carlos Diaz', vehicleType: 'Hatchback', position: { lat: 37.768, lng: -122.431 }, available: true },
  { id: 'D-1004', name: 'Dana Kapoor', vehicleType: 'Minivan', position: { lat: 37.781, lng: -122.418 }, available: false },
  { id: 'D-1005', name: 'Ethan Wright', vehicleType: 'Sedan', position: { lat: 37.771, lng: -122.405 }, available: true },
];

for (const d of seedDrivers) {
  byId.set(d.id, { ...d });
}

// PUBLIC_INTERFACE
export function findNearestDriver({ lat, lng }) {
  /** Find the nearest available driver to the given coordinate.
   * Returns { driver, distanceKm } or null if none available.
   */
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('lat and lng must be numbers');
  }
  let best = null;
  for (const driver of byId.values()) {
    if (!driver.available) continue;
    const dist = haversineKm({ lat, lng }, driver.position);
    if (!best || dist < best.distanceKm) {
      best = { driver, distanceKm: dist };
    }
  }
  return best;
}

// PUBLIC_INTERFACE
export function setDriverAvailability(driverId, available) {
  /** Set driver availability flag. Returns updated driver or null if not found. */
  const d = byId.get(driverId);
  if (!d) return null;
  d.available = !!available;
  return { ...d };
}

// PUBLIC_INTERFACE
export function updateDriverPosition(driverId, { lat, lng }) {
  /** Update driver position by id. Returns updated driver or null if not found. */
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('lat and lng must be numbers');
  }
  const d = byId.get(driverId);
  if (!d) return null;
  d.position = { lat, lng };
  return { ...d };
}

// Internal helper
export function _getDriverById(id) {
  return byId.get(id) || null;
}

// Internal helper for tests/bootstrapping
export function _listDrivers() {
  return Array.from(byId.values()).map((d) => ({ ...d }));
}
