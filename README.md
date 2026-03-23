# Agriculture Timeline - Interactive Experience

An interactive touch-screen timeline application. This application is designed for interactive kiosks to guide visitors through agricultural history, present, and future.

## 🌟 Features

- **Interactive Timeline**: A responsive, touch-optimized timeline spanning 4 historical eras.
- **Rich Media**: Supports image galleries and deep-dive modal content for key agricultural events.
- **Game Elements**:
  - **Tile Puzzle**: Sliding puzzle game with dynamic difficulty (3x3 and 4x4) and global image selection.
  - **Memory Game**: Thematic memory matching game with single and two-player modes.
- **Admin Panel**: Secure backend interface for museum staff to manage events, upload images, and configure game settings.
- **Museum Theme**: Custom-designed interface using organic, earthy tones to match the exhibition aesthetic.

## 🛠️ Technology Stack

**Frontend**
- **Framework**: React.js 18 + Vite
- **Styling**: Tailwind CSS + Custom CSS Modules
- **Animations**: Framer Motion
- **Icons**: Lucide React

**Backend**
- **API**: Node.js + Express.js (TypeScript)
- **Database**: SQLite via `better-sqlite3`
- **Admin**: Custom PHP/HTML control panel (legacy)

## 📂 Project Structure

```bash
Landbouw-Interactieve-Scherm/
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # UI Components (Timeline, Games, etc.)
│   │   ├── config/         # Theme and Content Configuration
│   │   └── services/       # API Integration
├── backend/                # API & Database (Node.js + SQLite)
│   ├── src/                # TypeScript source
│   │   ├── index.ts        # Express server (port 3000)
│   │   ├── database.ts     # SQLite schema & connection
│   │   └── routes/         # API route handlers
│   └── data/               # SQLite database (auto-created)
├── adminpanel/             # Content Management System
│   ├── assets/             # CSS & Uploads
│   └── login.php           # Secure Login Entry
└── scripts/                # Utility Scripts for Kiosk Deployment
```

## 🔐 Security & Configuration

The backend uses SQLite (file-based) — no database credentials needed.
The database file is stored in `backend/data/` and is git-ignored.

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
# → http://localhost:3000
```
The SQLite database is created automatically on first start — no external database needed.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5000 (proxies API calls to :3000)
```

### 4. Production Build
To create a production-ready build for the kiosk:
```bash
cd frontend
npm run build
```
The output will be in `frontend/dist`.

## 📄 License

Proprietary Software © 2025. All rights reserved.
