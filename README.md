# Jojoba · Economic Advisor — Dashboard

A modular React dashboard for the Economic Advisor FastAPI backend. Chat with the
AI, turn any answer into an email briefing (single or batch), manage the question
queue, and drive the fully-automated n8n delivery loop — with register / login /
logout built in.

## Features
- Chat with the advisor; tap a theme to have it generate a question (topics aligned to the backend).
- **Manual send**: email any analysis to your own typed address(es) or contacts from the database.
- **Language**: switch the whole app between English and Bahasa Indonesia (flows into chat, send, and automation).
- Show/hide password on sign-in and registration.
- Recipients, question queue, automation (n8n webhook), and sent history.

## Stack
- **React 18** + **Vite**
- **React Router v6** (protected routes)
- **Tailwind CSS** (custom "financial broadsheet" theme)
- **lucide-react** icons

## Quick start
```bash
npm install
cp .env.example .env      # then edit VITE_API_BASE
npm run dev               # http://localhost:5173
```

Leave `VITE_API_BASE` empty to explore in **demo mode** (no backend needed — data
lives in the browser session, and any login works).

## Project structure
```
src/
├── api/                 # one module per backend area
│   ├── client.js        # fetch wrapper, token + error handling, DEMO switch
│   ├── auth.js          # /auth/*  (login, register, me, logout)
│   ├── agent.js         # /agent/* (ask, send-batch, history, status, webhook url)
│   ├── emails.js        # /emails/*
│   └── questions.js     # /questions/*
├── context/
│   ├── AuthContext.jsx  # session state, login/register/logout
│   └── ToastContext.jsx # app-wide notifications
├── components/
│   ├── ui/              # Button, Card, Input, Modal, Empty, PageHead — primitives
│   ├── Ticker.jsx       # signature market tape across the top
│   ├── Sidebar.jsx      # desktop nav + user card
│   ├── MobileNav.jsx    # bottom tab bar
│   └── SendModal.jsx    # single/batch email composer
├── pages/
│   ├── Auth.jsx         # Login + Register (two-pane editorial layout)
│   ├── Chat.jsx         # main: ask the AI, theme suggestions, email an answer
│   ├── Recipients.jsx   # CRUD for the contact list
│   ├── Queue.jsx        # queue + generate + archive
│   ├── Automation.jsx   # n8n webhook, arm/pause, how-it-works
│   └── History.jsx      # delivery log
├── constants.js         # THEMES + ticker data
├── App.jsx              # routing + layout shell
└── main.jsx             # providers + entry
```

## Backend endpoints used
Paths match the live backend (see `main.py`). `VITE_API_BASE` is the server **root**
(e.g. `http://127.0.0.1:8000`). Note most routers mount under `/api/v1`, but the
**webhook router mounts under `/api/webhook`** (no `/api/v1`).
- `POST /api/v1/auth/login` · `/auth/register` · `GET /auth/me` · `POST /auth/logout` · `GET /auth/n8n-token`
- `POST /api/v1/agent/ask` — chat (language sent via `metadata.language`)
- `POST /api/v1/agent/batch-email` — **manual send** of an analysis `{ question, emails, subject?, language, frequency }`
- `GET /api/v1/history` — sent history `{ histories, count, total }` (filters: `skip,limit,status_filter,channel`)
- `GET/POST/PUT/DELETE /api/v1/emails` · `/emails/string/export` · `/emails/search/query`
- `GET/POST /api/v1/questions` · `/questions/generate` · `DELETE /questions/next` · `GET /questions/archive`
- `POST /api/webhook/process-next?send_email=true&language=` — the n8n automation webhook

## Auth notes
JWT is stored in `localStorage` and attached as a Bearer token. A `401` clears the
session and bounces to `/login`. Swap the storage strategy in `src/api/client.js`
if you prefer cookies.

## Automation
The **Automation** page surfaces the exact webhook your n8n Schedule Trigger should
call, plus the `X-API-Key` header. Add recipients (or use those already in the DB),
keep the queue fed, enable the workflow in n8n — and briefings send on their own.

> Educational analysis, not financial advice.
