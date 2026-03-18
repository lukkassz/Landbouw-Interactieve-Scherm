# Timeline Events REST API — Node.js + SQLite

REST API backend voor het Fries Landbouwmuseum tijdlijn applicatie.
Herschreven van PHP/MySQL naar **Node.js + Express + TypeScript + SQLite**.

## Technologie Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 4
- **Taal**: TypeScript (strict mode)
- **Database**: SQLite via `better-sqlite3`
- **Dev server**: `tsx` (hot-reload)

## Folder Structuur

```
backend/
├── src/
│   ├── index.ts                 # Express server entry point (port 3000)
│   ├── database.ts              # SQLite connectie + schema migratie
│   └── routes/
│       ├── events.ts            # CRUD timeline events
│       ├── eventMedia.ts        # Media per event
│       ├── eventSections.ts     # Secties per event
│       ├── keyMoments.ts        # Key moments per event
│       ├── memoryScores.ts      # Memory game leaderboard
│       ├── puzzleScores.ts      # Puzzle game leaderboard
│       ├── quizQuestions.ts     # Quiz vragen
│       ├── quizScores.ts        # Quiz leaderboard
│       ├── puzzleImages.ts      # Puzzle afbeeldingen
│       └── proxyImage.ts        # CORS image proxy
├── data/                        # SQLite database (auto-aangemaakt, git-ignored)
├── package.json
├── tsconfig.json
└── .gitignore
```

## Installatie

```bash
cd backend
npm install
```

## Ontwikkeling

```bash
# Start backend met hot-reload
npm run dev
# → http://localhost:3000

# Start frontend (in aparte terminal)
cd ../frontend
npm run dev
# → http://localhost:5000 (proxy naar :3000)
```

De SQLite database wordt automatisch aangemaakt in `backend/data/landbouw.db` bij de eerste keer opstarten. Geen externe database server nodig.

## Productie Build

```bash
npm run build     # Compileert TypeScript naar dist/
npm start         # Start vanuit dist/
```

## Database Schema

8 tabellen, automatisch aangemaakt bij eerste start:

| Tabel | Beschrijving |
|---|---|
| `timeline_events` | Hoofd-tabel met alle tijdlijn evenementen |
| `event_media` | Media bestanden gekoppeld aan events |
| `event_sections` | Tekst-secties per event |
| `event_key_moments` | Sleutelmomenten per event |
| `memory_scores` | Leaderboard memory spel |
| `puzzle_scores` | Leaderboard puzzel spel |
| `quiz_questions` | Quiz vragen met multiple choice |
| `quiz_scores` | Leaderboard quiz |

### Belangrijke kolommen `timeline_events`

| Kolom | Type | Beschrijving |
|---|---|---|
| `year` | TEXT | Jaar of bereik ("1925" of "1930-1956") |
| `game_type` | TEXT | 'puzzle', 'memory', 'harvest', 'none' |
| `gallery_images` | TEXT | JSON-encoded array |
| `related_events` | TEXT | JSON-encoded array |
| `is_active` | INTEGER | Soft-delete vlag (0/1) |
| `sort_order` | INTEGER | Volgorde in de tijdlijn |

## API Endpoints

### Timeline Events

| Methode | Route | Beschrijving |
|---|---|---|
| GET | `/api/events` | Alle actieve events (gesorteerd) |
| GET | `/api/timeline/events` | Alias voor bovenstaande |
| GET | `/api/event?id={id}` | Enkel event ophalen |
| POST | `/api/event` | Nieuw event aanmaken |
| PUT | `/api/event` | Event bijwerken (body moet `id` bevatten) |
| DELETE | `/api/event?id={id}` | Soft-delete event |

### Event Details

| Methode | Route | Beschrijving |
|---|---|---|
| GET | `/api/event/{id}/media` | Media voor een event |
| GET | `/api/event/{id}/sections` | Secties voor een event |
| GET | `/api/key-moments?event_id={id}` | Key moments voor een event |

### Legacy Endpoints (compatibiliteit)

| Methode | Route | Beschrijving |
|---|---|---|
| GET | `/api/event_media_direct?event_id={id}` | Media (legacy) |
| GET | `/api/event_sections_direct?event_id={id}` | Secties (legacy) |
| GET | `/api/key_moments_simple?event_id={id}` | Key moments (legacy) |

### Game Scores

| Methode | Route | Beschrijving |
|---|---|---|
| GET | `/api/memory_scores` | Top 10 memory scores |
| POST | `/api/memory_scores` | Score indienen (`player_name`, `moves`, `time_seconds`) |
| GET | `/api/puzzle_scores?difficulty=easy\|hard` | Top 10 puzzel scores |
| POST | `/api/puzzle_scores` | Score indienen (`player_name`, `moves`, `difficulty`) |
| GET | `/api/quiz_scores?event_id=&difficulty=&limit=` | Quiz leaderboard |
| POST | `/api/quiz_scores` | Score indienen (`player_name`, `score`, `total_questions`) |

### Quiz & Overig

| Methode | Route | Beschrijving |
|---|---|---|
| GET | `/api/quiz_questions?event_id={id}` | Vragen ophalen (willekeurige volgorde) |
| GET | `/api/puzzle-images` | Alle beschikbare puzzel afbeeldingen |
| GET | `/api/puzzle_image_direct?filename={name}` | Puzzel afbeelding URL resolven |
| GET | `/api/proxy_image?url={encoded_url}` | CORS image proxy |
| GET | `/api/health` | Health check |

## Leaderboard Logica

Alle score-endpoints handhaven een **top-10 leaderboard**:

1. Bij inzending wordt gecontroleerd of de leaderboard vol is (10 scores)
2. Zo ja: de nieuwe score wordt vergeleken met de slechtste score
3. Als de nieuwe score beter is, wordt de slechtste verwijderd
4. Het veld `qualified: true/false` in de response geeft aan of de score is opgeslagen

## CORS

CORS is ingeschakeld voor alle origins (`*`). Voor productie: beperk dit tot het specifieke frontend domein.

## Verschil met PHP versie

| Aspect | PHP (oud) | Node.js (nieuw) |
|---|---|---|
| Runtime | PHP 7.4+ Apache | Node.js 18+ |
| Database | MySQL (extern) | SQLite (bestand) |
| Taal | PHP | TypeScript |
| Routing | .htaccess rewrite | Express Router |
| Configuratie | secrets.php | Geen (SQLite, geen wachtwoord) |
| Schema | Verspreid in SQL queries | Gecentraliseerd in database.ts |
| Dependencies | Geen (PHP built-in) | npm packages |
| Dev experience | XAMPP/WAMP nodig | `npm run dev` |

## Testen

```bash
# Health check
curl http://localhost:3000/api/health

# Alle events ophalen
curl http://localhost:3000/api/events

# Enkel event
curl http://localhost:3000/api/event?id=1

# Event aanmaken
curl -X POST http://localhost:3000/api/event \
  -H "Content-Type: application/json" \
  -d '{"year":"2025","title":"Test Event"}'

# Memory score indienen
curl -X POST http://localhost:3000/api/memory_scores \
  -H "Content-Type: application/json" \
  -d '{"player_name":"Speler1","moves":12,"time_seconds":45}'

# Quiz leaderboard
curl http://localhost:3000/api/quiz_scores?limit=5
```
