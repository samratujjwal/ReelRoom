# 🎬 ReelRoom — Watch together. Stay in sync.

A full-stack, real-time synchronized YouTube watch party application. Multiple people,
one room, one reel — everyone stays in sync. Built with a strict Role-Based Access
Control (RBAC) system so hosts can run the room and moderate with confidence.

**🌐 Live demo:** https://reel-room-omega.vercel.app/

---

## 🚀 Features & Implementation Checklist

### Core Requirements

- ✅ **Real-time synchronization** — Server-authoritative video state over WebSockets.
  When a host/moderator plays, pauses, or seeks, every participant's player adjusts,
  with a live drift readout so you can see exactly how tight the sync is.
- ✅ **Room-based model** — Every room gets a unique room code plus a shareable invite
  link (with QR). Join from the lobby ticket form or a deep link.
- ✅ **YouTube integration** — Embedded player built on the YouTube IFrame API via
  `react-youtube`, framed in a cinematic theater view.
- ✅ **WebSockets** — Real-time, bi-directional communication powered by Socket.IO.
- ✅ **Role-based access (RBAC)** — Distinct permissions for **Host**, **Moderator**,
  **Participant**, and **Guest**.

### Host & Role Capabilities

- ✅ **Assign Role** — Host can promote participants to Moderator or demote them back.
- ✅ **Remove Participant** — Host can kick users out of the room instantly.
- ✅ **Transfer Host** — Host can securely hand the Host role to another participant.
- ✅ **Role Enforcement** — The backend strictly validates every WebSocket event
  (e.g. a Participant's `change_video` is rejected; only Host/Moderator can drive playback).

### Bonus Features Implemented

- ✅ **OOP WebSocket Server** — Clean architecture with `RoomManager`, `Room`,
  `VideoState`, and `PermissionService` classes encapsulating room logic.
- ✅ **Persistent Rooms & Authentication** — MongoDB stores room metadata and users;
  JWT-based register/login with guest access. Falls back to local JSON storage
  when no database is configured.
- ✅ **Live Chat & Reactions** — Real-time text chat and floating emoji reactions
  layered over the theater view.

---

## 🛠️ Technology Stack

| Layer     | Technology                          | Purpose                                  |
|-----------|-------------------------------------|------------------------------------------|
| Frontend  | React 19, JavaScript, Vite          | Fast, responsive UI with modern tooling  |
| Styling   | Tailwind CSS v4, Fraunces + Inter   | Warm editorial design system             |
| Backend   | Node.js, Express, JavaScript        | REST API and robust server logic         |
| Real-time | Socket.IO                           | Bi-directional, low-latency communication |
| Database  | MongoDB Atlas, Mongoose             | Persistent storage for users and rooms   |
| Video     | YouTube IFrame API (react-youtube)  | Embedded, controllable player            |

---

## 🏗️ Architecture Overview

The application follows a client-server architecture split into two directories:
`ReelRoom/backend` and `ReelRoom/frontend`.

### Backend Flow

- **REST API** — Handles authentication (`/api/v1/auth`), room management
  (`/api/v1/rooms`), and health checks (`/api/v1/health`).
- **WebSocket Server** — Socket.IO with JWT handshake auth. On `join_room`, the
  socket joins the room's channel and receives the full room + sync state.
- **OOP State Management**
  - `RoomManager` (singleton) tracks active `Room` instances in memory.
  - `Room` manages participants and its `VideoState`.
  - `VideoState` tracks `isPlaying`, `timestamp`, and `lastUpdated`,
    computing the authoritative playback position for every client.
- **RBAC Validation** — Every sensitive action (play, pause, seek, change video,
  kick, promote, transfer host) passes through `PermissionService` before any
  state mutation or broadcast.

### Frontend Flow

- **Context Providers** — `AuthContext` and `RoomContext` are the global state
  managers. `RoomContext` wires directly into Socket.IO listeners.
- **Sync Engine** — `useYouTubeSync` compares local player time against the
  server's authoritative timestamp and corrects drift beyond the threshold,
  with the live drift shown in the sync badge.
- **UI Components** — Editorial, cinema-inspired design: lobby hero, admission-ticket
  quick join, explore, dashboard, and the theater watch room (player, chat,
  reactions, people, programme).

---

## 💻 Setup & Run Instructions

### Prerequisites

- Node.js (v18+)
- npm

### 1. Backend Setup

```bash
cd ReelRoom/backend
npm install

# Copy and fill in your secrets
cp .env.example .env

# Start the server (runs on port 4000)
node src/server.js
