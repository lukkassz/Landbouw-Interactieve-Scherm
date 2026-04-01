# AgriTimeline

Interactive museum timeline rebuilt on a modern stack: Node.js, React, and SQLite.

## Architecture

This repository contains three independent apps:

- `backend/`
  - Node.js + Express + TypeScript + SQLite
  - REST API and local database (`backend/data/landbouw.db`)
  - Runs on `http://localhost:3000`

- `frontend/`
  - React + Vite + Tailwind
  - Visitor-facing timeline experience
  - Runs on `http://localhost:5173`
  - Proxies `/api` and `/uploads` to backend

- `adminpanel-react/`
  - React + Vite + TypeScript + Tailwind
  - Event management panel
  - Runs on `http://localhost:5174`
  - Proxies `/api` and `/uploads` to backend

## Local Setup

Use three terminal windows.

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Admin Panel

```bash
cd adminpanel-react
npm install
npm run dev
```

## Build

```bash
cd backend && npm run build
cd frontend && npm run build
cd adminpanel-react && npm run build
```

## Notes

- Uploaded files are served by backend from `/uploads`.
- API routes are mounted under `/api`.
- Current working branch for this migration is `feature/nodejs-backend`.
