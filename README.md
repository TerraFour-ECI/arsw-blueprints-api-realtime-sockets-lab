# 🚀 BluePrints RT Lab P4 - Final Showcase (JWT + Socket.IO + STOMP)

<div align="center">

![Repo](https://img.shields.io/badge/Repository-Lab_P4_BluePrints_RT-0ea5e9?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-111827?style=for-the-badge&logo=socket.io&logoColor=white)
![STOMP](https://img.shields.io/badge/STOMP-Spring_WebSocket-16a34a?style=for-the-badge&logo=spring&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-f97316?style=for-the-badge)

### 🎯 One integrated flow: Login first, then collaborative realtime drawing with two transport protocols.

</div>

---

## ✨ What this repository delivers

This project is the **Part 4 frontend** for BluePrints realtime collaboration, integrated with:

- 🔐 **JWT-secured API** (login-first flow from port `5173`)
- 🧩 **REST CRUD** operations against the secured backend (`8080`)
- ⚡ **Socket.IO** realtime collaboration (`3001`)
- 📡 **STOMP/WebSocket** realtime collaboration (`8081`)
- 🖼️ polished interface + evidence-ready workflow

---

## 🧭 Final architecture

```mermaid
flowchart LR
  LOGIN["JWT Frontend :5173"] -->|"Open Realtime Lab + token handoff"| RTUI["Realtime Frontend :5174"]
  RTUI -->|"CRUD /api/blueprints"| SEC["Security API :8080"]
  RTUI -->|"Socket.IO events"| IO["Socket.IO Backend :3001"]
  RTUI -->|"STOMP publish/subscribe"| STOMP["STOMP Backend :8081"]
```

---

## 🔐 Environment setup

Create `.env.local` in this repo:

```bash
VITE_API_BASE=http://localhost:8080
VITE_IO_BASE=http://localhost:3001
VITE_STOMP_BASE=http://localhost:8081
```

---

## ▶️ Run flow

1. Start security backend on `8080`.
2. Start JWT frontend (`arsw-blueprints-api-react-lab`) on `5173`.
3. Login and click **Realtime Lab** in the navbar.
4. Realtime app opens on `5174` with author + JWT handoff.
5. Use Socket.IO or STOMP mode and verify collaboration.

---

## 🎬 Demo video

- **Watch full lab demo:** [demo-blueprints-realtime-socketio-stomp.mp4](demo-blueprints-realtime-socketio-stomp.mp4)

---

## 📸 Evidence gallery (real captures)

### 00 - JWT login success
Shows the successful authentication screen before opening realtime.

![00-login-success-jwt](images/00-login-success-jwt.png)

### 01 - Handoff link visible after login
Shows the **Realtime Lab** access point from the authenticated app.

![01-handoff-to-realtime-link](images/01-handoff-to-realtime-link.png)

### 02 - Realtime home overview
Main dashboard with control panel + transport selector + canvas.

![02-home-overview](images/02-home-overview.png)

### 03 - Author list loaded
Author query resolved and blueprint list displayed with point totals.

![03-author-list-loaded](images/03-author-list-loaded.png)

### 04 - Blueprint opened in canvas
Selected blueprint rendered in canvas with current point count.

![04-open-blueprint](images/04-open-blueprint.png)

### 05 - Socket.IO realtime replication
Two-tab collaboration evidence using Socket.IO transport.

![05-socketio-sync-tabA-tabB](images/05-socketio-sync-tabA-tabB.png)

### 06 - STOMP realtime replication
Two-tab collaboration evidence using STOMP transport.

![06-stomp-sync-tabA-tabB](images/06-stomp-sync-tabA-tabB.png)

### 07 - Blueprint creation success
Successful `Create` operation in secured CRUD flow.

![07-create-blueprint-success](images/07-create-blueprint-success.png)

### 08 - Save/Update success
Successful point persistence (`PUT /points`) with updated totals.

![08-save-update-success](images/08-save-update-success.png)

### 09 - Delete success
Successful deletion from secured backend and refreshed list.

![09-delete-blueprint-success](images/09-delete-blueprint-success.png)

### 10 - Quality commands pass
Local quality checks and build evidence.

![10-quality-commands-pass](images/10-quality-commands-pass.png)

---

## ✅ Quality commands

```bash
npm run lint
npm run test
npm run coverage
npm run build
```

---

## 📂 Project map

```text
src/
  App.jsx
  main.jsx
  styles.css
  lib/
    socketIoClient.js
    stompClient.js
  services/
    blueprintsApi.js
tests/
  App.test.jsx
  setup.js
eslint.config.js
vitest.config.js
```

---

## 📄 License

MIT [LICENSE](LICENSE)
