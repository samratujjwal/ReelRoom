# ReelRoom Backend

Real-time synchronized watch party backend — **plain JavaScript (ES modules)**, no TypeScript build step. Runs directly with Node.js.

## Stack

- **Node.js + Express 4** — REST API
- **Socket.IO 4** — real-time room sync
- **Mongoose 9** — optional MongoDB persistence (graceful fallback to local JSON files)
- **jsonwebtoken** — JWT auth (7-day expiry)
- **zod** — available for payload validation

## Run

```bash
npm install
cp .env.example .env   # set MONGO_URI + JWT_SECRET for production
npm start               # node src/server.js
npm run dev             # node --watch src/server.js (auto-restart)
```

The server listens on `PORT` (default `4000`). If MongoDB is unset or unreachable, rooms and users persist to `./data/*.json` instead — the server still boots.

## REST API

Base path: `/api/v1`

- `GET /` — welcome message
- `GET /api/v1/health` — `{ status, timestamp, uptimeSeconds, activeRooms }`
- `POST /api/v1/auth/register` — `{ username, email, password }`
- `POST /api/v1/auth/login` — `{ emailOrUsername, password }`
- `GET /api/v1/auth/me` — requires `Authorization: Bearer <token>`
- `POST /api/v1/rooms` — `{ name, hostUsername, hostUserId?, initialVideoUrl? }`
- `GET /api/v1/rooms` — list rooms
- `GET /api/v1/rooms/my-rooms?userId=<id>` — rooms hosted by a user
- `GET /api/v1/rooms/:roomId` — room by id **or** 6-char code
- `DELETE /api/v1/rooms/:roomId` — host-only delete

## WebSocket events

Authenticate with `io(url, { auth: { token } })`. Guests may connect without a token and join with a username.

| Client → server | Payload | Role required |
|---|---|---|
| `join_room` | `{ roomId, username?, userId? }` | any |
| `leave_room` | `{ roomId? }` | any |
| `play` / `pause` | `{ time? }` | Host / Moderator |
| `seek` | `{ time }` | Host / Moderator |
| `change_video` | `{ videoId }` or `{ videoUrl }` | Host / Moderator |
| `assign_role` | `{ userId, role }` | Host |
| `remove_participant` | `{ userId }` | Host |
| `transfer_host` | `{ userId }` | Host |
| `send_message` | `{ message }` | any member |
| `send_reaction` | `{ emoji }` | any member |

Server → client: `room_state`, `sync_state`, `user_joined`, `user_left`, `chat_history`, `chat_message`, `reaction`, `play`, `pause`, `seek`, `change_video`, `video_changed`, `role_assigned`, `participant_removed`, `host_transferred`, `kicked`, `error_event`.

## Architecture

- `services/RoomManager` (singleton) — in-memory room registry, persistence fan-out
- `models/Room` — participants, roles, chat history, video state
- `models/VideoState` — authoritative playback clock with drift calculation
- `services/PermissionService` — RBAC checks on every sensitive socket event
- `services/AuthService` — users, password hashing (PBKDF2), JWT issue/verify
- `websocket/handlers/*` — one module per event domain (room, playback, chat, role)

## Environment

See `.env.example`. In production, always set a strong `JWT_SECRET` and a `MONGO_URI`.
