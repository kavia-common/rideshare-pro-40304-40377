# Rideshare Pro Backend

Environment variables:
- PORT: HTTP port (default 4000)
- JWT_SECRET: JWT signing secret (change in production)
- FRONTEND_URL: CORS allowed origin (e.g., http://localhost:3000)
- WS_PATH: WebSocket path (default /ws)
- LOG_LEVEL: debug|info|warn|error (default info)

WebSocket protocol:
- Connect to ws://<host>:<PORT><WS_PATH>
- Send: { "type": "subscribe", "rideId": "<id>" }
- Server broadcasts updated ride objects as JSON.

CORS:
- Express CORS is configured with origin=FRONTEND_URL and credentials=true.

Healthcheck:
- GET /healthz returns { status, time, wsPath }.
