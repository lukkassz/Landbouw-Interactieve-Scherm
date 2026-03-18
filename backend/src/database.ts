import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "landbouw.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeSchema();
  }
  return db;
}

function initializeSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      icon TEXT,
      gradient TEXT,
      museum_gradient TEXT,
      stage INTEGER,
      use_detailed_modal INTEGER DEFAULT 0,
      historical_context TEXT,
      has_key_moments INTEGER DEFAULT 0,
      has_puzzle INTEGER DEFAULT 0,
      puzzle_image_url TEXT,
      game_type TEXT DEFAULT 'none',
      category TEXT,
      sort_order INTEGER DEFAULT 0,
      image_url TEXT,
      video_url TEXT,
      gallery_images TEXT,
      model_3d_url TEXT,
      importance_level INTEGER,
      fun_fact TEXT,
      related_events TEXT,
      location TEXT,
      is_active INTEGER DEFAULT 1,
      has_video INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      media_type TEXT,
      file_url TEXT,
      caption TEXT,
      display_order INTEGER DEFAULT 0,
      FOREIGN KEY (event_id) REFERENCES timeline_events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      section_title TEXT,
      section_content TEXT,
      section_order INTEGER DEFAULT 0,
      has_border INTEGER DEFAULT 0,
      FOREIGN KEY (event_id) REFERENCES timeline_events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_key_moments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      year INTEGER,
      title TEXT,
      short_description TEXT,
      full_description TEXT,
      display_order INTEGER DEFAULT 0,
      FOREIGN KEY (event_id) REFERENCES timeline_events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memory_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      moves INTEGER NOT NULL,
      time_seconds INTEGER NOT NULL,
      completed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS puzzle_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      moves INTEGER NOT NULL,
      difficulty TEXT DEFAULT 'easy',
      completed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      question TEXT NOT NULL,
      image_url TEXT,
      correct_answer TEXT NOT NULL,
      option_1 TEXT NOT NULL,
      option_2 TEXT NOT NULL,
      option_3 TEXT NOT NULL,
      option_4 TEXT NOT NULL,
      category TEXT,
      difficulty TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES timeline_events(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage REAL,
      event_id INTEGER,
      difficulty TEXT,
      played_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
