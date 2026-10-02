# ReelRoom — Watch together. Stay in sync.

A real-time, synchronized YouTube watch party app. Open a room, share the link, and everyone's player stays on the same frame — with host controls, live chat, and reactions.

This project is a UI redesign and JavaScript migration of the original TypeScript codebase. The entire application source (frontend **and** backend) is now plain JavaScript/JSX — no TypeScript build step required.

## What's inside

```
ReelRoom/
├── backend/                 # Node.js + Express + Socket.IO (plain JavaScript, ESM)
│   ├── src/
│   │   ├── server.js        # Entry point — HTTP + WebSocket bootstrap
│   │   ├── app.js           # Express app (REST routes, CORS, 404)
│   │   ├── config/          # Env config, MongoDB connection
│   │   ├── routes/          # /api/v1/auth, /api/v1/rooms, /api/v1/health
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # JWT auth (HTTP + WebSocket)
│   │   ├── services/        # AuthService, RoomManager, PermissionService
│   │   ├── models/          # User, Room, Participant, VideoState
│   │   ├── database/models/ # Mongoose schemas (optional persistence)
│   │   ├── websocket/       # Socket.IO server + room/playback/chat/role handlers
│   │   └── utils/           # Logger, YouTube ID parsing, JSON file storage
│   ├── .env.example
│   └── package.json
└── frontend/                # React 19 + Vite + Tailwind CSS v4 (plain JSX)
    ├── src/
    │   ├── main.jsx         # Entry point
    │   ├── App.jsx          # Page routing, modals, toasts
    │   ├── components/      # Navbar, Lobby, Explore, Dashboard, WatchRoom, modals
    │   ├── context/         # AuthContext, RoomContext (socket state)
    │   ├── hooks/           # useYouTubeSync — drift correction engine
    │   └── services/        # REST api client, socket.io client
    ├── public/              # ReelRoom logo + favicon
    ├── index.html
    ├── vite.config.js
    └── .env.example
```

## Features

- **Frame-accurate sync** — play, pause and seek propagate to every viewer instantly; clients continuously correct drift against the host clock.
- **Rooms** — create rooms with a name + opening video, shareable `?room=<id>` invite links and short room codes, QR invite cards.
- **Roles (RBAC)** — Host, Moderator, Participant, Viewer. Only host/moderator can control playback; only host can assign roles, remove people, or transfer the room.
- **Live chat + reactions** — real-time messages and floating emoji reactions over the player.
- **Auth** — register/login with JWT (7-day expiry), session persisted in `localStorage`. Guests can join with a username once logged in via the join flow.
- **Persistence** — rooms and users persist to MongoDB when `MONGO_URI` is set, with automatic fallback to local JSON storage in `backend/data/`.

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm

## Setup & run

### 1. Backend (port 4000)

```bash
cd backend
npm install

# configure (optional — the server boots with local JSON storage if MongoDB is unset)
cp .env.example .env
# edit .env: set MONGO_URI and JWT_SECRET for production

# start
npm start

# development (auto-restart on change)
npm run dev
```

### 2. Frontend (port 3000)

```bash
cd frontend
npm install

# point at your backend if it isn't localhost:4000
cp .env.example .env

# start dev server
npm run dev

# production build
npm run build
```

### 3. Try it

1. Open `http://localhost:3000`
2. Log in (or register), then **Start a room**
3. Copy the invite link from the room header and open it in a second browser window
4. Press play — both players move as one. Try chat, reactions, and (as host) changing the video.

## API & realtime reference

REST base: `/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | `{ username, email, password }` → `{ user, token }` |
| POST | `/auth/login` | `{ emailOrUsername, password }` → `{ user, token }` |
| GET | `/auth/me` | Bearer token → current user |
| POST | `/rooms` | `{ name, hostUsername, hostUserId?, initialVideoUrl? }` → room |
| GET | `/rooms` | List all rooms |
| GET | `/rooms/my-rooms?userId=` | Rooms hosted by a user |
| GET | `/rooms/:roomId` | Room details (id or code) |
| DELETE | `/rooms/:roomId` | Delete room (host only) |
| GET | `/health` | `{ status, timestamp, uptimeSeconds, activeRooms }` |

WebSocket events (Socket.IO, auth via `auth: { token }` handshake):

Client → server: `join_room`, `leave_room`, `play`, `pause`, `seek`, `change_video`, `assign_role`, `remove_participant`, `transfer_host`, `send_message`, `send_reaction`

Server → client: `room_state`, `sync_state`, `user_joined`, `user_left`, `chat_history`, `chat_message`, `reaction`, `play`, `pause`, `seek`, `change_video`, `video_changed`, `role_assigned`, `participant_removed`, `host_transferred`, `kicked`, `error_event`

## Environment variables

| Variable | Where | Default | Description |
|---|---|---|---|
| `PORT` | backend | `4000` | HTTP/WebSocket listen port |
| `NODE_ENV` | backend | `development` | `production` silences debug logs |
| `CLIENT_ORIGIN` | backend | `*` | CORS origin hint |
| `MONGO_URI` | backend | _(unset)_ | MongoDB connection string; local JSON fallback when unset/unreachable |
| `JWT_SECRET` | backend | _(dev placeholder)_ | **Set a long random value in production** |
| `VITE_API_URL` | frontend | `http://localhost:4000/api/v1` | Backend REST base URL |
| `VITE_WS_URL` | frontend | `http://localhost:4000` | Backend WebSocket URL |

## Notes

- This is a JavaScript port: there is no `tsc` build step. The backend runs directly with `node src/server.js` (ES modules); the frontend builds with `vite build`.
- `backend/data/` is runtime storage (created automatically) and is intentionally not shipped.
- Never commit a real `.env` — only `.env.example` files are included.
