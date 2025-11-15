//
// In-memory Rides datastore and helpers
//

/**
 * Types:
 * Ride {
 *   id: string
 *   userId: string
 *   pickup: { lat:number, lng:number, address?:string }
 *   dropoff: { lat:number, lng:number, address?:string }
 *   driverId?: string
 *   status: 'requested' | 'assigned' | 'enroute' | 'arrived' | 'completed' | 'cancelled'
 *   price?: number
 *   meta?: Record<string, any>
 *   createdAt: ISO string
 *   updatedAt: ISO string
 * }
 */

let _rideAutoId = 1000;

const ridesById = new Map();
const ridesByUser = new Map(); // Map<userId, rideIds[]>

// PUBLIC_INTERFACE
export function saveRide(ride) {
  /** Create or update a ride. If ride.id missing, creates a new one.
   * Returns the stored ride record.
   */
  if (!ride || !ride.userId) {
    throw new Error('ride.userId is required');
  }
  const now = new Date().toISOString();
  if (!ride.id) {
    const id = `R-${_rideAutoId++}`;
    const rec = {
      id,
      userId: ride.userId,
      pickup: ride.pickup || null,
      dropoff: ride.dropoff || null,
      driverId: ride.driverId || null,
      status: ride.status || 'requested',
      price: ride.price ?? null,
      meta: ride.meta || {},
      createdAt: now,
      updatedAt: now,
    };
    ridesById.set(id, rec);
    const arr = ridesByUser.get(rec.userId) || [];
    arr.unshift(id);
    ridesByUser.set(rec.userId, arr);
    return { ...rec };
  } else {
    const existing = ridesById.get(ride.id);
    if (!existing) {
      // If not exists treat as create with provided id
      const rec = {
        id: ride.id,
        userId: ride.userId,
        pickup: ride.pickup || null,
        dropoff: ride.dropoff || null,
        driverId: ride.driverId || null,
        status: ride.status || 'requested',
        price: ride.price ?? null,
        meta: ride.meta || {},
        createdAt: now,
        updatedAt: now,
  };
      ridesById.set(ride.id, rec);
      const arr = ridesByUser.get(rec.userId) || [];
      arr.unshift(ride.id);
      ridesByUser.set(rec.userId, arr);
      return { ...rec };
    }
    const updated = {
      ...existing,
      ...ride,
      updatedAt: now,
    };
    ridesById.set(existing.id, updated);
    if (existing.userId !== updated.userId) {
      // Move index if user changed
      const oldArr = ridesByUser.get(existing.userId) || [];
      ridesByUser.set(
        existing.userId,
        oldArr.filter((rid) => rid !== existing.id)
      );
      const newArr = ridesByUser.get(updated.userId) || [];
      newArr.unshift(updated.id);
      ridesByUser.set(updated.userId, newArr);
    }
    return { ...updated };
  }
}

// PUBLIC_INTERFACE
export function getRideById(id) {
  /** Get a ride by its id. Returns ride or null. */
  if (!id) return null;
  const rec = ridesById.get(id);
  return rec ? { ...rec } : null;
}

// PUBLIC_INTERFACE
export function listRidesByUser(userId, { limit = 50, offset = 0 } = {}) {
  /** List rides for a user, newest first. Supports basic pagination. */
  const ids = ridesByUser.get(userId) || [];
  const slice = ids.slice(offset, offset + limit);
  return slice.map((rid) => ({ ...ridesById.get(rid) }));
}

// PUBLIC_INTERFACE
export function updateRideStatus(id, status, extra = {}) {
  /** Update the status and optional extra fields of a ride. Returns updated ride or null. */
  if (!id) return null;
  const rec = ridesById.get(id);
  if (!rec) return null;
  const allowed = new Set(['requested', 'assigned', 'enroute', 'arrived', 'completed', 'cancelled']);
  if (!allowed.has(status)) {
    throw new Error('Invalid status');
  }
  const updated = {
    ...rec,
    status,
    ...extra,
    updatedAt: new Date().toISOString(),
  };
  ridesById.set(id, updated);
  return { ...updated };
}

// Internal helper for tests/bootstrapping
export function _clearRides() {
  ridesById.clear();
  ridesByUser.clear();
  _rideAutoId = 1000;
}
