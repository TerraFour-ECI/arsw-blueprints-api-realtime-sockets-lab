# Lab P4 - BluePrints in Real Time (Sockets & STOMP)

> **Main repository:** [TerraFour-ECI/arsw-blueprints-api-realtime-sockets-lab](https://github.com/TerraFour-ECI/arsw-blueprints-api-realtime-sockets-lab)

<div align="center">

![Repo](https://img.shields.io/badge/Repository-P4_RealTime-0ea5e9?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-111827?style=for-the-badge&logo=socket.io&logoColor=white)
![STOMP](https://img.shields.io/badge/STOMP-Spring_WebSocket-16a34a?style=for-the-badge&logo=spring&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-f97316?style=for-the-badge)

### End-to-end flow: login, token handoff, secured CRUD, and live realtime drawing.

</div>

---

## 🎯 Objective

Implement realtime collaboration for BluePrints while keeping secured CRUD integration and demonstrating protocol interoperability with **Socket.IO** and **STOMP**.

At the end, the system should:
1. Authenticate users with JWT.
2. Open the realtime UI through authenticated handoff.
3. Execute CRUD operations against secured API.
4. Replicate drawing events in near real time across tabs.

---

## 🧭 Repositories Used in This Lab

- **JWT frontend (login/handoff):** [TerraFour-ECI/arsw-blueprints-api-react-lab](https://github.com/TerraFour-ECI/arsw-blueprints-api-react-lab)
- **Security backend (JWT + secured CRUD):** [TerraFour-ECI/arsw-blueprints-api-security-lab](https://github.com/TerraFour-ECI/arsw-blueprints-api-security-lab)
- **Realtime frontend (this repo):** [TerraFour-ECI/arsw-blueprints-api-realtime-sockets-lab](https://github.com/TerraFour-ECI/arsw-blueprints-api-realtime-sockets-lab)
- **Socket.IO backend:** [TerraFour-ECI/blueprints-example-backend-socketio-node](https://github.com/TerraFour-ECI/blueprints-example-backend-socketio-node)
- **STOMP backend:** [TerraFour-ECI/blueprints-example-backend-stomp](https://github.com/TerraFour-ECI/blueprints-example-backend-stomp)

---

## 🌐 Port and Responsibility Map

| Component | Repository | Local URL | Responsibility |
|---|---|---|---|
| JWT Frontend | `arsw-blueprints-api-react-lab` | `http://localhost:5173` | Login and token generation |
| Security API | `arsw-blueprints-api-security-lab` | `http://localhost:8080` | Secured CRUD + JWT validation |
| Realtime Frontend | `arsw-blueprints-api-realtime-sockets-lab` | `http://localhost:5174` | Canvas, CRUD actions, RT selector |
| Socket.IO Backend | `blueprints-example-backend-socketio-node` | `http://localhost:3001` | Room-based realtime events |
| STOMP Backend | `blueprints-example-backend-stomp` | `http://localhost:8081` (integrated flow) | Topic-based realtime events |

> Note: STOMP backend may run on `8080` by default in isolation, but this integrated flow uses `8081` to avoid conflict with security API on `8080`.

---

## 🏗️ Architecture (Quick View)

```text
JWT Frontend (:5173)
   └─ login + token handoff ───────────────► Realtime Frontend (:5174)
                                              ├─ REST CRUD ───────────► Security API (:8080)
                                              ├─ Socket.IO events ────► Socket.IO backend (:3001)
                                              └─ STOMP publish/sub ───► STOMP backend (:8081)
```

**Conventions**
- Blueprint channel/room: `blueprints.{author}.{name}`
- Draw payload: `{ x, y }`

---

## 🧩 Functional Scope

- **CRUD (secured):**
  - `GET /api/blueprints?author=:author`
  - `GET /api/blueprints/:author/:name`
  - `POST /api/blueprints`
  - `PUT /api/blueprints/:author/:name` and/or point persistence endpoint in your secured API contract
  - `DELETE /api/blueprints/:author/:name`
- **Realtime:**
  - Socket.IO mode: `join-room`, `draw-event`, `blueprint-update`
  - STOMP mode: publish `/app/draw`, subscribe `/topic/blueprints.{author}.{name}`
- **UI:**
  - Click-to-draw canvas
  - Author table + total points
  - Actions: Create / Save-Update / Delete
  - Realtime selector: None / Socket.IO / STOMP

---

## ⚙️ Environment Variables (This Realtime Frontend)

Create `.env.local` in this repo:

```bash
VITE_API_BASE=http://localhost:8080
VITE_IO_BASE=http://localhost:3001
VITE_STOMP_BASE=http://localhost:8081
```

---

## 🚀 Sequential Startup (Recommended)

1. Start **security backend** (`8080`) from [arsw-blueprints-api-security-lab](https://github.com/TerraFour-ECI/arsw-blueprints-api-security-lab).
2. Start **JWT frontend** (`5173`) from [arsw-blueprints-api-react-lab](https://github.com/TerraFour-ECI/arsw-blueprints-api-react-lab).
3. Start **one realtime backend**:
   - Socket.IO backend (`3001`) from [blueprints-example-backend-socketio-node](https://github.com/TerraFour-ECI/blueprints-example-backend-socketio-node), or
   - STOMP backend (`8081`) from [blueprints-example-backend-stomp](https://github.com/TerraFour-ECI/blueprints-example-backend-stomp).
4. Start this **realtime frontend** (`5174`):

```bash
npm i
npm run dev
```

5. Login on `5173`, open **Realtime Lab**, then test in 2 tabs using the same author and blueprint.

---

## 🔌 Realtime Protocol Snippets

### Socket.IO

```js
socket.emit('join-room', `blueprints.${author}.${name}`)
socket.emit('draw-event', { room, author, name, point: { x, y } })
socket.on('blueprint-update', (upd) => { /* append points and repaint */ })
```

### STOMP

```js
client.publish({ destination: '/app/draw', body: JSON.stringify({ author, name, point }) })
client.subscribe(`/topic/blueprints.${author}.${name}`, (msg) => { /* append points and repaint */ })
```

---

## 🎬 Demo Video

- [demo-blueprints-realtime-socketio-stomp.mp4](demo-blueprints-realtime-socketio-stomp.mp4)

---

## 📸 Evidence Gallery

### 00 - JWT login success
![00-login-success-jwt](images/00-login-success-jwt.png)

### 01 - Realtime handoff link
![01-handoff-to-realtime-link](images/01-handoff-to-realtime-link.png)

### 02 - Realtime home overview
![02-home-overview](images/02-home-overview.png)

### 03 - Author list loaded
![03-author-list-loaded](images/03-author-list-loaded.png)

### 04 - Blueprint opened
![04-open-blueprint](images/04-open-blueprint.png)

### 05 - Socket.IO synchronization
![05-socketio-sync-tabA-tabB](images/05-socketio-sync-tabA-tabB.png)

### 06 - STOMP synchronization
![06-stomp-sync-tabA-tabB](images/06-stomp-sync-tabA-tabB.png)

### 07 - Create success
![07-create-blueprint-success](images/07-create-blueprint-success.png)

### 08 - Save/Update success
![08-save-update-success](images/08-save-update-success.png)

### 09 - Delete success
![09-delete-blueprint-success](images/09-delete-blueprint-success.png)

### 10 - Quality commands pass
![10-quality-commands-pass](images/10-quality-commands-pass.png)

---

## ✅ Quality Commands

```bash
npm run lint
npm run test
npm run coverage
npm run build
```

---

## 🩺 Troubleshooting

- If realtime app cannot fetch data, verify `VITE_API_BASE=http://localhost:8080` and security backend is running.
- If Socket.IO does not replicate, verify room name and `VITE_IO_BASE=http://localhost:3001`.
- If STOMP does not replicate, verify `/ws-blueprints`, `/app`, `/topic`, and `VITE_STOMP_BASE=http://localhost:8081`.
- If JWT flow fails, verify login app on `5173`, token handoff query param, and accepted CORS origins.

---

## 📄 License

MIT [LICENSE](LICENSE)
