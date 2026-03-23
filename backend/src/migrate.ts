import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'landbouw.db');

const db = new Database(DB_PATH);

try {
  console.log('Adding scrubber_label...');
  db.exec('ALTER TABLE timeline_events ADD COLUMN scrubber_label TEXT;');
  console.log('Added scrubber_label');
} catch (e: any) {
  console.log('scrubber_label column might already exist:', e.message);
}

try {
  console.log('Adding infobox_title...');
  db.exec('ALTER TABLE timeline_events ADD COLUMN infobox_title TEXT;');
} catch (e: any) {
  console.log('infobox_title column might already exist:', e.message);
}

try {
  console.log('Adding infobox_subtitle...');
  db.exec('ALTER TABLE timeline_events ADD COLUMN infobox_subtitle TEXT;');
} catch (e: any) {
  console.log('infobox_subtitle column might already exist:', e.message);
}

try {
  console.log('Adding icon_name...');
  db.exec('ALTER TABLE timeline_events ADD COLUMN icon_name TEXT;');
} catch (e: any) {
  console.log('icon_name column might already exist:', e.message);
}

console.log('Database migration complete.');
db.close();
