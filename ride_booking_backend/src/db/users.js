//
// In-memory Users datastore
// Module-scoped arrays/maps to persist during process lifetime.
//

/**
 * Simple incremental ID generator for users.
 */
let _userAutoId = 1;

/**
 * Module-scoped store for users.
 * Shape:
 * - byId: Map<id, user>
 * - byEmail: Map<emailLower, id>
 */
const store = {
  byId: new Map(),
  byEmail: new Map(),
};

// PUBLIC_INTERFACE
export function createUser({ email, passwordHash }) {
  /** Create and store a user with required fields.
   * Returns the created user record.
   */
  if (!email || !passwordHash) {
    throw new Error('email and passwordHash are required');
  }
  const emailKey = String(email).trim().toLowerCase();
  if (store.byEmail.has(emailKey)) {
    throw new Error('User already exists with this email');
  }
  const id = String(_userAutoId++);
  const user = {
    id,
    email: emailKey,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  store.byId.set(id, user);
  store.byEmail.set(emailKey, id);
  return user;
}

// PUBLIC_INTERFACE
export function findUserByEmail(email) {
  /** Find a user by email (case-insensitive). Returns user or null. */
  if (!email) return null;
  const emailKey = String(email).trim().toLowerCase();
  const id = store.byEmail.get(emailKey);
  if (!id) return null;
  return store.byId.get(id) || null;
}

// Internal helper for tests/bootstrapping
export function _clearUsers() {
  store.byId.clear();
  store.byEmail.clear();
  _userAutoId = 1;
}
