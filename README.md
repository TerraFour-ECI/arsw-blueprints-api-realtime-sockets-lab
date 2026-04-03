# Lab P4 — BluePrints in Real Time (Sockets & STOMP)

> **Repository:** `TerraFour-ECI/arsw-blueprints-api-realtime-sockets-lab`  
> **Front-end:** React + Vite (Canvas, CRUD, and RT technology selector)  
> **Reference backends (choose one or compare both):**
> - **Socket.IO (Node.js):** https://github.com/TerraFour-ECI/blueprints-example-backend-socketio-node
> - **STOMP (Spring Boot):** https://github.com/TerraFour-ECI/blueprints-example-backend-stomp

## 🎯 Lab objective
Implement **real-time collaboration** for the BluePrints case. The front-end consumes the Part 3 CRUD API (or equivalent) and enables real-time features using **Socket.IO** or **STOMP**, so multiple clients can draw on the same blueprint simultaneously.

By the end of the lab, the team must:
1. Integrate the front-end with its **CRUD API** (list/create/update/delete blueprints, and total points per author).
2. Connect the front-end to a **real-time** backend (Socket.IO **or** STOMP) following the reference repositories.
3. Demonstrate **live collaboration** (two browser tabs viewing the same blueprint).

---

## 🧩 Scope and functional criteria
- **CRUD** (REST):
  - `GET /api/blueprints?author=:author` → list by author (includes total points).
  - `GET /api/blueprints/:author/:name` → blueprint points.
  - `POST /api/blueprints` → create.
  - `PUT /api/blueprints/:author/:name` → update.
  - `DELETE /api/blueprints/:author/:name` → delete.
- **Real-time (RT)** (choose one):
  - **Socket.IO** (rooms): `join-room`, `draw-event` → broadcast `blueprint-update`.
  - **STOMP** (topics): `@MessageMapping("/draw")` → `convertAndSend(/topic/blueprints.{author}.{name})`.
- **UI**:
  - Canvas with **click-to-draw** behavior (incremental).
  - Author panel: blueprint **table** and **total points** (`reduce`).
  - Action bar: **Create / Save/Update / Delete** and **technology selector** (None / Socket.IO / STOMP).
- **DX/Quality**: clean code, error handling, team README.

---

## 🏗️ Architecture (quick view)

```
React (Vite)
 ├─ HTTP (REST CRUD + initial state) ───────────────> Your API (P3 / custom)
 └─ Real-time (choose one):
     ├─ Socket.IO: join-room / draw-event ──────────> Socket.IO Server (Node)
     └─ STOMP: /app/draw -> /topic/blueprints.* ────> Spring WebSocket/STOMP
```

**Recommended conventions**  
- **Blueprint as channel/room**: `blueprints.{author}.{name}`  
- **Point payload**: `{ x, y }`

---

## 📦 Reference repositories (clone/review)
- **Socket.IO (Node.js)**: https://github.com/DECSIS-ECI/example-backend-socketio-node-/blob/main/README.md  
  - *Typical client usage:* `io(VITE_IO_BASE, { transports: ['websocket'] })`, `join-room`, `draw-event`, `blueprint-update`.
- **STOMP (Spring Boot)**: https://github.com/DECSIS-ECI/example-backend-stopm/tree/main  
  - *Typical client usage:* `@stomp/stompjs` → `client.publish('/app/draw', body)`; subscribe to `/topic/blueprints.{author}.{name}`.

---

## ⚙️ Environment variables (Front-end)
Create `.env.local` at the root of the **front-end** project:
```bash
# REST (your CRUD backend)
VITE_API_BASE=http://localhost:8080

# Real-time: point to one or the other depending on the backend you use
VITE_IO_BASE=http://localhost:3001     # if you use Socket.IO (Node)
VITE_STOMP_BASE=http://localhost:8080  # if you use STOMP (Spring)
```
In the UI, select the technology in the **RT selector**.

---

## 🚀 Getting started

### 1) RT backend (choose one)

**Option A — Socket.IO (Node.js)**  
Follow the README in the reference repository:  
https://github.com/DECSIS-ECI/example-backend-socketio-node-/blob/main/README.md
```bash
npm i
npm run dev
# serves: http://localhost:3001
# quick initial-state test:
curl http://localhost:3001/api/blueprints/juan/blueprint-1
```

**Option B — STOMP (Spring Boot)**  
Follow the reference repository:  
https://github.com/DECSIS-ECI/example-backend-stopm/tree/main
```bash
./mvnw spring-boot:run
# serves: http://localhost:8080
# WS endpoint (example): /ws-blueprints
```

### 2) Front-end (this repository)
```bash
npm i
npm run dev
# http://localhost:5173
```
In the UI: select **Socket.IO** or **STOMP**, define `author` and `name`, open **two tabs**, and draw on the canvas (clicks).

---

## 🔌 Real-time protocols (minimum detail)

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
  socket.on('blueprint-update', (upd) => { /* append points y repintar */ })
  ```

### B) STOMP
- **Publish point**
  ```js
  client.publish({ destination: '/app/draw', body: JSON.stringify({ author, name, point }) })
  ```
- **Subscribe to topic**
  ```js
  client.subscribe(`/topic/blueprints.${author}.${name}`, (msg) => { /* append points and redraw */ })
  ```

---

## 🧪 Minimum test cases
- **Initial state**: when selecting a blueprint, the canvas loads points (`GET /api/blueprints/:author/:name`).  
- **Local drawing**: clicking on the canvas adds points and redraws.  
- **Multi-tab RT**: with 2 tabs, points are **replicated** almost in real time.  
- **CRUD**: Create/Save/Delete work and refresh the list and the author's **Total**.

---

## 📊 Team deliverables
1. Front-end code integrated with **CRUD** and **RT** (Socket.IO or STOMP).  
2. **Short video** (≤ 90s) showing live collaboration and CRUD operations.  
3. **Team README**: setup, endpoints used, decisions (rooms/topics), and an optional brief Socket.IO vs STOMP comparison.

---

## 🧮 Suggested rubric
- **Functionality (40%)**: stable RT (join/broadcast), blueprint isolation, operational CRUD.  
- **Technical quality (30%)**: clean structure, error handling, clear documentation.  
- **Observability/DX (15%)**: useful logs (connection, events), basic health checks.  
- **Analysis (15%)**: findings (latency/reconnection) and, when applicable, Socket.IO vs STOMP pros/cons.

---

## 🩺 Troubleshooting
- **Blank screen (front-end)**: check browser console; confirm `@vitejs/plugin-react` is installed and `AppP4.jsx` is in `src/`.  
- **No broadcast**: both tabs must `join-room` for the **same** blueprint (Socket.IO) or subscribe to the **same topic** (STOMP).  
- **CORS**: in dev allow `http://localhost:5173`; in prod, **restrict origins**.  
- **Socket.IO does not connect**: force WebSocket transport `{ transports: ['websocket'] }`.  
- **STOMP does not receive messages**: verify `brokerURL`/`webSocketFactory` and Spring `/app` and `/topic` prefixes.

---

## 🔐 Security (minimum)
- Payload validation (for example, zod/joi).  
- Origin restriction in production.  
- Optional: **JWT** + authorization by blueprint/room.

---

## 📄 License
MIT (or the one defined by the course/team).
