//
// Aggregated exports for the in-memory datastore
//

export {
  createUser,
  findUserByEmail,
} from './users.js';

export {
  findNearestDriver,
  setDriverAvailability,
  updateDriverPosition,
} from './drivers.js';

export {
  saveRide,
  getRideById,
  listRidesByUser,
  updateRideStatus,
} from './rides.js';
