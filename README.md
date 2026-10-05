# SkillSwap — Skill Exchange platform (MERN)

Two separate folders. Open each one in its own VS Code terminal.

```
SkillSwap/
├── backend/    Node + Express + MongoDB + Socket.IO   (npm start)
├── frontend/   React (Vite) + Bootstrap 5             (npm run dev)
└── FLOWCHART.md
```

## 1. Requirements
- Node.js 18 or newer
- MongoDB running locally (`mongodb://127.0.0.1:27017`), or a MongoDB Atlas URL

## 2. Backend (port 5000)
```bash
cd backend
npm install
npm start
```
Settings live in `backend/.env` (PORT, MONGO_URI, JWT_SECRET). Change JWT_SECRET before deploying.

## 3. Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. Vite proxies `/api` and `/socket.io` to the backend, so no extra config is needed.

## 4. Trying it out
The database starts empty. There is no dummy data. Create two accounts (use a normal window and a private window), give them matching skills (A teaches what B wants and the other way round), then:
1. Find matches, View profile, Send swap request.
2. The other user accepts under Requests, which opens the Exchange room.
3. Chat, propose a session, accept it, join it within 15 minutes of the start, complete it, then rate each other.
4. Upload a file or link in Resources and press Share so your partner can see it.

## Features
- Register / login (JWT), profile with skills taught and wanted, levels, languages, online/offline/both, city
- Matching engine, score 0-100: skills 40, level 15, rating 15, language 15, learning mode 15. Strong = two-way and 70+, otherwise Partial
- Swap requests: send, accept, reject, cancel; finish a swap
- Exchange room: real-time chat with typing indicator, sessions, resources, progress
- Sessions: propose, conflict check, accept/decline, reschedule, cancel, join, complete, history, 30-minute reminders, auto "missed" status
- Resources: upload files (20 MB) or links, download, delete, share/unshare with partner (private by default)
- Ratings and reviews update the reviewee's reputation, which feeds back into the match score
- Notifications (live) and a dashboard that ties it all together
