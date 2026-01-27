# Fries Landbouwmuseum - Interactive Experience

An interactive touch-screen timeline application developed for the Fries Landbouwmuseum (Leeuwarden, Netherlands) to celebrate its 100th anniversary (1925-2025). This application is designed for museum kiosks to guide visitors through a century of agricultural history.

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
- **API**: PHP REST API
- **Database**: MySQL (relational schema with event categories)
- **Admin**: Custom PHP/HTML control panel

## 📂 Project Structure

```bash
Landbouw-Interactieve-Scherm/
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # UI Components (Timeline, Games, etc.)
│   │   ├── config/         # Theme and Content Configuration
│   │   └── services/       # API Integration
├── backend/                # API & Database
│   ├── api/                # REST Endpoints
│   ├── migrations/         # SQL Schema Updates
│   └── api/config/         # Database Configuration
├── adminpanel/             # Content Management System
│   ├── assets/             # CSS & Uploads
│   └── login.php           # Secure Login Entry
└── scripts/                # Utility Scripts for Kiosk Deployment
```

## 🔐 Security & Configuration

The application separates sensitive credentials from the codebase.
**Note:** `secrets.php` is git-ignored for security.

1.  **Credentials**: 
    - Rename `backend/api/config/secrets.example.php` to `secrets.php`.
    - Fill in your database and admin credentials.
2.  **Access Control**: 
    - The Admin Panel is protected via session-based authentication.
    - Default admin credentials (change immediately in `secrets.php`):
      - User: `landbouw`
      - Pass: `leeuwarden2025museumlandbouw!`

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- PHP (v8.0+)
- MySQL Server

### 1. Database Setup
Import the schema from `backend/migrations/` into your MySQL database (e.g., `timeline_db`).

### 2. Backend Configuration
Ensure your web server (Apache/Nginx/XAMPP) points to the project root.
Update `backend/api/config/secrets.php` with your DB details.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will launch at `http://localhost:5173`.

### 4. Production Build
To create a production-ready build for the kiosk:
```bash
cd frontend
npm run build
```
The output will be in `frontend/dist`.

## 📄 License

Proprietary Software - Fries Landbouwmuseum © 2025. All rights reserved.
Developed for the Centenary Exhibition.
