import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "novel-gacha.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS generation_groups (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      model_name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      system_prompt TEXT,
      max_tokens INTEGER NOT NULL,
      temperature REAL,
      top_p REAL,
      extra_params TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS novels (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES generation_groups(id),
      content TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending','generating','completed','failed')),
      error_message TEXT,
      rating INTEGER CHECK(rating IS NULL OR (rating >= 1 AND rating <= 5)),
      comment TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_novels_group_id ON novels(group_id);
    CREATE INDEX IF NOT EXISTS idx_novels_status ON novels(status);
    CREATE INDEX IF NOT EXISTS idx_groups_created_at ON generation_groups(created_at);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Default settings
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)"
  );
  stmt.run("ollamaUrl", "http://localhost:11434");
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
