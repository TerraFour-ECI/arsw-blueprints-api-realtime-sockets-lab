# Lab P4 - BluePrints in Real Time (Sockets & STOMP)

> **Repository:** [DECSIS-ECI/Lab_P4_BluePrints_RealTime-Sokets](https://github.com/DECSIS-ECI/Lab_P4_BluePrints_RealTime-Sokets)  
> **Front:** React + Vite (Canvas, CRUD, and RT technology selector)  
> **Reference backends (use one or compare both):**
> - **Socket.IO (Node.js):** [DECSIS-ECI/example-backend-socketio-node-](https://github.com/DECSIS-ECI/example-backend-socketio-node-/blob/main/README.md)
> - **STOMP (Spring Boot):** [DECSIS-ECI/example-backend-stopm](https://github.com/DECSIS-ECI/example-backend-stopm/tree/main)

<div align="center">

![Repo](https://img.shields.io/badge/Repository-Lab_P4_RealTime-0ea5e9?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-111827?style=for-the-badge&logo=socket.io&logoColor=white)
![STOMP](https://img.shields.io/badge/STOMP-Spring_WebSocket-16a34a?style=for-the-badge&logo=spring&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-f97316?style=for-the-badge)

### Collaborative realtime drawing with clean CRUD integration and dual RT protocol support.

</div>

---

## 🎯 Lab objective

Implement **real-time collaboration** for the BluePrints use case. The frontend consumes the Part 3 CRUD API (or equivalent) and enables realtime updates using **Socket.IO** or **STOMP**, so multiple clients can draw on the same blueprint simultaneously.

At the end, the team should:
1. Integrate the frontend with **CRUD API** operations (list/create/update/delete blueprints and total points per author).
2. Connect the frontend to a **realtime backend** (Socket.IO **or** STOMP) using the guide repos.
3. Demonstrate **live collaboration** (two browser tabs on the same blueprint).

---

## 🧩 Scope and functional criteria

- **CRUD (REST):**
  - `GET /api/blueprints?author=:author` -> list by author (including total points).
  - `GET /api/blueprints/:author/:name` -> blueprint points.
  - `POST /api/blueprints` -> create.
  - `PUT /api/blueprints/:author/:name` -> update.
  - `DELETE /api/blueprints/:author/:name` -> delete.
- **Realtime (choose one, implemented support for both in this frontend):**
  - **Socket.IO** (rooms): `join-room`, `draw-event` -> broadcast `blueprint-update`.
  - **STOMP** (topics): `@MessageMapping("/draw")` -> `convertAndSend(/topic/blueprints.{author}.{name})`.
- **UI:**
  - Canvas with **click-to-draw** (incremental points).
  - Author panel with blueprint **table** and **total point count** (`reduce`).
  - Action bar with **Create / Save/Update / Delete** and **RT selector** (None / Socket.IO / STOMP).
- **DX/Quality:** clean code, error handling, and team README.

---

## 🏗️ Architecture (quick view)

```text
React (Vite)
 ├─ HTTP (REST CRUD + initial state) ───────────────> Your API (P3 / own)
 └─ Realtime (choose one):
     ├─ Socket.IO: join-room / draw-event ──────────> Socket.IO Server (Node)
     └─ STOMP: /app/draw -> /topic/blueprints.* ────> Spring WebSocket/STOMP
```

**Recommended conventions**
- **Blueprint as channel/room:** `blueprints.{author}.{name}`
- **Point payload:** `{ x, y }`

---

## 🔗 Guide repositories

- **Part 3 UI / auth flow reference:** [DECSIS-ECI/Lab_P3_BluePrints_React_UI](https://github.com/DECSIS-ECI/Lab_P3_BluePrints_React_UI)
- **Socket.IO backend:** [DECSIS-ECI/example-backend-socketio-node-](https://github.com/DECSIS-ECI/example-backend-socketio-node-/blob/main/README.md)
  - Typical client usage: `io(VITE_IO_BASE, { transports: ['websocket'] })`, `join-room`, `draw-event`, `blueprint-update`.
- **STOMP backend:** [DECSIS-ECI/example-backend-stopm](https://github.com/DECSIS-ECI/example-backend-stopm/tree/main)
  - Typical client usage: `@stomp/stompjs` -> `client.publish('/app/draw', body)`; subscribe to `/topic/blueprints.{author}.{name}`.

---

## ⚙️ Environment variables (frontend)

Create `.env.local` at this repository root:

```bash
# CRUD API (secured backend)
VITE_API_BASE=http://localhost:8080

# Realtime endpoints
VITE_IO_BASE=http://localhost:3001     # Socket.IO (Node)
VITE_STOMP_BASE=http://localhost:8081  # STOMP (Spring in integrated flow)
```

In your UI, select the realtime technology with the RT selector.

---

## 🚀 Getting started

### 1) Realtime backend (choose one)

**Option A - Socket.IO (Node.js)**  
Follow: [example-backend-socketio-node-](https://github.com/DECSIS-ECI/example-backend-socketio-node-/blob/main/README.md)

```bash
npm i
npm run dev
# exposes: http://localhost:3001
# quick initial-state check:
curl http://localhost:3001/api/blueprints/juan/plano-1
```

**Option B - STOMP (Spring Boot)**  
Follow: [example-backend-stopm](https://github.com/DECSIS-ECI/example-backend-stopm/tree/main)

```bash
mvn spring-boot:run
# default: http://localhost:8080
# integrated local setup may run STOMP on http://localhost:8081
# WS endpoint: /ws-blueprints
```

### 2) Frontend (this repo)

```bash
npm i
npm run dev
# http://localhost:5174
```

In the UI: select **Socket.IO** or **STOMP**, set `author` and `name`, open **two tabs**, and draw on canvas.

---

## 🔌 Realtime protocols (minimal detail)

### A) Socket.IO

- **Join room**
  ```js
  socket.emit('join-room', `blueprints.${author}.${name}`)
  ```
- **Send point**
  ```js
  socket.emit('draw-event', { room, author, name, point: { x, y } })
  ```
- **Receive update**
  ```js
  socket.on('blueprint-update', (upd) => { /* append points and repaint */ })
  ```

### B) STOMP

- **Publish point**
  ```js
  client.publish({ destination: '/app/draw', body: JSON.stringify({ author, name, point }) })
  ```
- **Subscribe to topic**
  ```js
  client.subscribe(`/topic/blueprints.${author}.${name}`, (msg) => { /* append points and repaint */ })
  ```

---

## 🧪 Minimum test cases

- **Initial state:** selecting a blueprint loads points (`GET /api/blueprints/:author/:name`).
- **Local drawing:** canvas click appends points and repaints.
- **Realtime multi-tab:** with 2 tabs, points replicate almost in real time.
- **CRUD:** Create/Save/Delete work and refresh list plus author **Total**.

---

## 📊 Team deliverables

1. Frontend code integrated with **CRUD** and **RT** (Socket.IO and/or STOMP).
2. **Short video** (<= 90s) showing live collaboration and CRUD operations.
3. **Team README**: setup, used endpoints, room/topic decisions, and optional Socket.IO vs STOMP comparison.

---

## 🎬 Demo video

- **Watch full lab demo:** [demo-blueprints-realtime-socketio-stomp.mp4](demo-blueprints-realtime-socketio-stomp.mp4)

---

## 📸 Evidence gallery (real captures)

### 00 - JWT login success
Successful authentication before opening realtime.

![00-login-success-jwt](images/00-login-success-jwt.png)

### 01 - Handoff link visible after login
The **Realtime Lab** entry point is available after login.

![01-handoff-to-realtime-link](images/01-handoff-to-realtime-link.png)

### 02 - Realtime home overview
Main dashboard with transport selector and canvas.

![02-home-overview](images/02-home-overview.png)

### 03 - Author list loaded
Blueprint list and point totals loaded for selected author.

![03-author-list-loaded](images/03-author-list-loaded.png)

### 04 - Blueprint opened in canvas
Selected blueprint rendered with current points.

![04-open-blueprint](images/04-open-blueprint.png)

### 05 - Socket.IO realtime replication
Two-tab synchronization using Socket.IO transport.

![05-socketio-sync-tabA-tabB](images/05-socketio-sync-tabA-tabB.png)

### 06 - STOMP realtime replication
Two-tab synchronization using STOMP transport.

![06-stomp-sync-tabA-tabB](images/06-stomp-sync-tabA-tabB.png)

### 07 - Blueprint creation success
Successful Create operation through secured CRUD flow.

![07-create-blueprint-success](images/07-create-blueprint-success.png)

### 08 - Save/Update success
Successful persistence and updated totals.

![08-save-update-success](images/08-save-update-success.png)

### 09 - Delete success
Successful deletion and list refresh.

![09-delete-blueprint-success](images/09-delete-blueprint-success.png)

### 10 - Quality commands pass
Local quality checks and build evidence.

![10-quality-commands-pass](images/10-quality-commands-pass.png)

---

## 🧮 Suggested grading rubric

- **Functionality (40%)**: stable RT (join/broadcast), blueprint isolation, operational CRUD.
- **Technical quality (30%)**: clean structure, error handling, clear documentation.
- **Observability/DX (15%)**: useful logs (connections/events), basic health checks.
- **Analysis (15%)**: findings (latency/reconnection) and Socket.IO vs STOMP trade-offs.

---

## 🩺 Troubleshooting

- **Frontend blank screen:** check browser console, verify Vite React plugin and source imports.
- **No broadcast:** both tabs must join the **same room/topic** for the same blueprint.
- **CORS issues:** allow local origins during dev (especially `http://localhost:5174`, plus `http://localhost:5173` in auth handoff flows).
- **Socket.IO connection fails:** enforce WebSocket transport with `{ transports: ['websocket'] }`.
- **STOMP no updates:** verify broker URL/websocket endpoint and Spring `/app` + `/topic` prefixes.

---

## 🔐 Security minimums

- Validate payloads for draw and CRUD requests.
- Restrict allowed origins in production.
- Optional hardening: JWT-based authorization by blueprint room/topic.

---

## ✅ Quality commands

```bash
npm run lint
npm run test
npm run coverage
npm run build
```

---

## 📄 License

MIT [LICENSE](LICENSE)
