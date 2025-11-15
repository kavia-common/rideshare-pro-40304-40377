/**
 * Rideshare Pro Backend
 * Express server providing:
 * - Auth routes: POST /auth/register, POST /auth/login
 * - Ride routes: POST /rides, GET /rides/:id, POST /rides/:id/cancel, GET /rides
 * - WebSocket endpoint for live ride updates at WS_PATH (default: /ws)
 * - Healthcheck: GET /healthz
 * - Driver simulation loop broadcasting ride status/position updates
 *
 * Uses in-memory datastore at src/db.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';

import {
  createUser,
  findUserByEmail,
  findNearestDriver,
  setDriverAvailability,
  updateDriverPosition,
  saveRide,
  getRideById,
  listRidesByUser,
  updateRideStatus,
} from './db/index.js';

const app = express();

// Configuration via env
const PORT = parseInt(process.env.PORT || '4000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const WS_PATH = process.env.WS_PATH || '/ws';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Simple logger
function log(level, msg, meta) {
  const allowed = ['debug', 'info', 'warn', 'error'];
  const lvlIdx = allowed.indexOf(level);
  const cfgIdx = allowed.indexOf(LOG_LEVEL) === -1 ? 1 : allowed.indexOf(LOG_LEVEL);
  if (lvlIdx >= cfgIdx) {
    const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${msg}`;
    // eslint-disable-next-line no-console
    console.log(meta ? `${line} ${JSON.stringify(meta)}` : line);
  }
}

// CORS for frontend
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// PUBLIC_INTERFACE
function createToken(payload, expiresIn = '2h') {
  /** Create a signed JWT token with configurable expiry. */
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// PUBLIC_INTERFACE
function authMiddleware(req, res, next) {
  /** Express middleware to validate Bearer JWT and attach req.user. */
  const hdr = req.headers.authorization || '';
  const [, token] = hdr.split(' ');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Healthcheck
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    wsPath: WS_PATH,
  });
});

// ===== Auth Routes =====

// PUBLIC_INTERFACE
app.post('/auth/register', async (req, res) => {
  /**
   * Register a new user.
   * Body: { email: string, password: string }
   * Returns: { token, user: { id, email } }
   */
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    const pwHash = await bcrypt.hash(String(password), 10);
    const user = createUser({ email, passwordHash: pwHash });
    const token = createToken({ sub: user.id, email: user.email });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Registration failed' });
  }
});

// PUBLIC_INTERFACE
app.post('/auth/login', async (req, res) => {
  /**
   * Login an existing user.
   * Body: { email: string, password: string }
   * Returns: { token, user: { id, email } }
   */
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    const user = findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(String(password), String(user.passwordHash));
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = createToken({ sub: user.id, email: user.email });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (e) {
    return res.status(401).json({ error: 'Login failed' });
  }
});

// ===== Ride Routes =====

// PUBLIC_INTERFACE
app.post('/rides', authMiddleware, (req, res) => {
  /**
   * Create a ride request.
   * Body: {
   *   pickup: { lat, lng, address? },
   *   dropoff: { lat, lng, address? }
   * }
   * Returns: Ride record
   */
  const userId = req.user?.sub;
  const { pickup, dropoff } = req.body || {};
  if (
    !pickup ||
    typeof pickup.lat !== 'number' ||
    typeof pickup.lng !== 'number' ||
    !dropoff ||
    typeof dropoff.lat !== 'number' ||
    typeof dropoff.lng !== 'number'
  ) {
    return res.status(400).json({ error: 'pickup and dropoff must include numeric lat,lng' });
  }

  // Find nearest driver
  const nearest = findNearestDriver({ lat: pickup.lat, lng: pickup.lng });
  if (!nearest || !nearest.driver) {
    return res.status(503).json({ error: 'No drivers available' });
  }
  const driver = nearest.driver;
  setDriverAvailability(driver.id, false);

  // Save initial ride as assigned
  const price = estimatePrice(pickup, dropoff, nearest.distanceKm);
  const ride = saveRide({
    userId,
    pickup,
    dropoff,
    driverId: driver.id,
    status: 'assigned',
    price,
    meta: { distanceKm: nearest.distanceKm },
  });

  broadcastRide(ride.id, ride);
  res.status(201).json(ride);
});

// PUBLIC_INTERFACE
app.get('/rides/:id', authMiddleware, (req, res) => {
  /**
   * Get a ride by id.
   * Params: id
   * Returns: Ride record
   */
  const ride = getRideById(req.params.id);
  if (!ride || ride.userId !== req.user?.sub) {
    return res.status(404).json({ error: 'Ride not found' });
  }
  res.json(ride);
});

// PUBLIC_INTERFACE
app.post('/rides/:id/cancel', authMiddleware, (req, res) => {
  /**
   * Cancel a ride by id.
   * Params: id
   * Returns: Updated ride
   */
  const ride = getRideById(req.params.id);
  if (!ride || ride.userId !== req.user?.sub) {
    return res.status(404).json({ error: 'Ride not found' });
  }
  if (ride.status === 'completed' || ride.status === 'cancelled') {
    return res.status(400).json({ error: 'Ride already finished' });
  }
  const updated = updateRideStatus(ride.id, 'cancelled');
  if (updated?.driverId) {
    setDriverAvailability(updated.driverId, true);
  }
  broadcastRide(updated.id, updated);
  res.json(updated);
});

// PUBLIC_INTERFACE
app.get('/rides', authMiddleware, (req, res) => {
  /**
   * List rides for the authenticated user.
   * Query: limit?, offset?
   * Returns: Ride[]
   */
  const limit = clampInt(req.query.limit, 50, 1, 200);
  const offset = clampInt(req.query.offset, 0, 0, 10000);
  const rides = listRidesByUser(req.user?.sub, { limit, offset });
  res.json(rides);
});

// ===== Utilities =====
function clampInt(val, def, min, max) {
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
}

function estimatePrice(pickup, dropoff, driverDistanceKm = 0) {
  // Very rough price estimation: base + per-km distance
  const dx = Math.abs((dropoff.lat - pickup.lat) * 111);
  const dy = Math.abs((dropoff.lng - pickup.lng) * 85);
  const tripKm = Math.sqrt(dx * dx + dy * dy);
  const base = 3.0;
  const perKm = 1.8;
  const surge = 1.0;
  return Math.round((base + (tripKm + driverDistanceKm * 0.3) * perKm) * surge * 100) / 100;
}

// ===== WebSocket Server =====
const server = app.listen(PORT, () => {
  log('info', `Backend listening on :${PORT}`, { WS_PATH, FRONTEND_URL });
});

const wss = new WebSocketServer({ server, path: WS_PATH });

// Map of rideId -> Set<WebSocket>
const rideChannels = new Map();

// Broadcast helper
function broadcastRide(rideId, payload) {
  const subs = rideChannels.get(rideId);
  if (!subs || subs.size === 0) return;
  const msg = JSON.stringify(payload);
  for (const ws of subs) {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.send(msg);
      } catch {
        // ignore
      }
    }
  }
}

// PUBLIC_INTERFACE
// WebSocket connection: clients connect to ws://host:port/WS_PATH and must send a first message
// like: { "type": "subscribe", "rideId": "R-1001" } to receive updates for that ride.
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'subscribe' && msg.rideId) {
        let set = rideChannels.get(msg.rideId);
        if (!set) {
          set = new Set();
          rideChannels.set(msg.rideId, set);
        }
        set.add(ws);
        ws._subRideId = msg.rideId; // track for cleanup
        log('debug', 'WS subscribed', { rideId: msg.rideId });
      }
    } catch (e) {
      // ignore malformed
    }
  });

  ws.on('close', () => {
    if (ws._subRideId) {
      const set = rideChannels.get(ws._subRideId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) rideChannels.delete(ws._subRideId);
      }
    }
  });
});

// WS keepalive
const wsPingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {
      // ignore
    }
  });
}, 30000);

server.on('close', () => {
  clearInterval(wsPingInterval);
});

// ===== Driver Simulation Loop =====
//
// Periodically move assigned drivers toward pickup and then toward dropoff,
// updating ride status along the way and broadcasting over WS.
//
const SIM_TICK_MS = 1500;
setInterval(simulationTick, SIM_TICK_MS);

// Move a coordinate slightly towards a target
function stepTowards(pos, target, stepKm = 0.2) {
  // naive linear step on lat/lng degrees approximating ~111km/deg latitude
  const toDegLat = stepKm / 111; // ~ km per latitude degree
  const toDegLng = stepKm / 85; // rough scale at SF latitude
  const dLat = target.lat - pos.lat;
  const dLng = target.lng - pos.lng;
  const m = Math.max(Math.abs(dLat), Math.abs(dLng));
  if (m < 1e-6) return { ...target };
  const stepLat = Math.sign(dLat) * Math.min(Math.abs(dLat), toDegLat);
  const stepLng = Math.sign(dLng) * Math.min(Math.abs(dLng), toDegLng);
  return { lat: pos.lat + stepLat, lng: pos.lng + stepLng };
}

function simulationTick() {
  try {
    // Iterate all ride channels implies "active rides" that have subscribers,
    // but also we may update rides even without subscribers for progression.
    // For simplicity, iterate through rideChannels keys.
    for (const rideId of rideChannels.keys()) {
      const ride = getRideById(rideId);
      if (!ride) continue;
      if (!ride.driverId) continue;

      // Fetch current driver position via updateDriverPosition with same coords later
      // We'll simulate driver coords stored in meta if not present.
      let dPos = ride.meta?.driverPos;
      if (!dPos) {
        // initialize from a point slightly offset from pickup
        const init = {
          lat: (ride.pickup?.lat ?? 37.7749) + (Math.random() - 0.5) * 0.01,
          lng: (ride.pickup?.lng ?? -122.4194) + (Math.random() - 0.5) * 0.01,
        };
        dPos = init;
      }

      if (ride.status === 'assigned') {
        // Move towards pickup
        const next = stepTowards(dPos, ride.pickup);
        updateDriverPosition(ride.driverId, next);
        const updated = updateRideStatus(ride.id, 'enroute', {
          meta: { ...(ride.meta || {}), driverPos: next, phase: 'to_pickup' },
        });
        broadcastRide(ride.id, updated);
      } else if (ride.status === 'enroute') {
        // Check near pickup then switch to 'arrived'
        const next = stepTowards(ride.meta.driverPos, ride.pickup);
        const near =
          Math.abs(next.lat - ride.pickup.lat) < 0.0005 &&
          Math.abs(next.lng - ride.pickup.lng) < 0.0005;
        updateDriverPosition(ride.driverId, next);
        if (near) {
          const updated = updateRideStatus(ride.id, 'arrived', {
            meta: { ...(ride.meta || {}), driverPos: next, phase: 'pickup' },
          });
          broadcastRide(ride.id, updated);
        } else {
          const updated = updateRideStatus(ride.id, 'enroute', {
            meta: { ...(ride.meta || {}), driverPos: next, phase: 'to_pickup' },
          });
          broadcastRide(ride.id, updated);
        }
      } else if (ride.status === 'arrived') {
        // After arrival, start trip towards dropoff
        const next = stepTowards(ride.meta.driverPos, ride.dropoff);
        updateDriverPosition(ride.driverId, next);
        const updated = updateRideStatus(ride.id, 'enroute', {
          meta: { ...(ride.meta || {}), driverPos: next, phase: 'to_dropoff' },
        });
        broadcastRide(ride.id, updated);
      } else if (ride.status === 'completed' || ride.status === 'cancelled') {
        // Ensure driver becomes available; cleanup subscriptions later.
        setDriverAvailability(ride.driverId, true);
      } else {
        // status may be 'requested' or unexpected; ignore
      }

      // Completion check
      const r2 = getRideById(rideId);
      if (r2 && r2.meta?.phase === 'to_dropoff') {
        const near =
          Math.abs(r2.meta.driverPos.lat - r2.dropoff.lat) < 0.0005 &&
          Math.abs(r2.meta.driverPos.lng - r2.dropoff.lng) < 0.0005;
        if (near && r2.status !== 'completed') {
          const finished = updateRideStatus(r2.id, 'completed', {
            meta: { ...(r2.meta || {}), completedAt: new Date().toISOString() },
          });
          setDriverAvailability(r2.driverId, true);
          broadcastRide(r2.id, finished);
        }
      }
    }
  } catch (e) {
    log('warn', 'simulationTick error', { error: String(e?.message || e) });
  }
}

// Graceful shutdown
function shutdown() {
  log('info', 'Shutting down...');
  try {
    server.close(() => process.exit(0));
  } catch {
    process.exit(0);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
