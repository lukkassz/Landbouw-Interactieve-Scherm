# Structural Cleanup Report

Data: 2026-04-01  
Branch: `feature/nodejs-backend`

## Co zostało zrobione

### 1. Uporządkowanie architektury i dokumentacji
- Zaktualizowano główną dokumentację projektu w `README.md`.
- Usunięto nieaktualne odniesienia do legacy panelu `adminpanel/` (PHP).
- Ujednolicono opis aktualnej architektury: `backend` + `frontend` + `adminpanel-react`.

### 2. Ujednolicenie portów i środowiska dev
- `backend`: `3000`
- `frontend`: `5173` (zaktualizowane w `frontend/vite.config.js`)
- `adminpanel-react`: `5174` (zaktualizowane w `adminpanel-react/vite.config.ts`)

### 3. Spójność API w frontendzie
- Przepisano `frontend/src/services/api.js` pod aktualne endpointy Node/Express.
- Usunięto legacy komentarze i ścieżki w stylu `.php`.
- Zachowano kompatybilne kształty odpowiedzi dla istniejących komponentów (`success`, `data`, `scores`, `questions`), aby nie łamać UI.

### 4. Upload mediów (backend + admin panel)
- Dodano endpoint uploadu plików: `POST /api/uploads`.
- Dodano serwowanie plików z `/uploads`.
- W admin panelu dodano upload dla:
  - głównego obrazka eventu,
  - wideo eventu,
  - `puzzle_image_url`,
  - `gallery_images`,
  - obrazków pytań quizowych.

## Aktualny stan projektu

## Moduły
- `backend/`  
  Node.js + Express + TypeScript + SQLite (`backend/data/landbouw.db`).
- `frontend/`  
  React + Vite + Tailwind (aplikacja muzealna dla użytkownika końcowego).
- `adminpanel-react/`  
  React + Vite + TypeScript + Tailwind (panel zarządzania eventami).

## Routing i integracja
- API: `/api/*` na backendzie.
- Pliki uploadowane: `/uploads/*` na backendzie.
- Obie aplikacje frontendowe proxyują `/api` i `/uploads` do `http://localhost:3000`.

## Walidacja po zmianach
- `backend`: `npm run build` przechodzi.
- `frontend`: `npm run build` przechodzi.
- `adminpanel-react`: `npm run build` przechodzi.

## Uwagi techniczne
- W `frontend` po `npm install` istnieją ostrzeżenia o starszych zależnościach (deprecations/vulnerabilities) niezwiązane bezpośrednio z tym cleanupem strukturalnym.
- Kolejny opcjonalny krok: aktualizacja zależności frontendu (`vite`, `eslint`, `browserslist`) i redukcja ostrzeżeń.

