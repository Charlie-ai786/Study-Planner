import DatabaseConstructor, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'studyflow.db');
const db: DatabaseType = new DatabaseConstructor(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
});

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create all tables on startup
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      avatar      TEXT,
      university  TEXT,
      exam_name   TEXT,
      exam_days   INTEGER DEFAULT 0,
      active_plan_id INTEGER,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plans (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL,
      plan_text       TEXT NOT NULL,
      exam_name       TEXT NOT NULL,
      days            INTEGER NOT NULL,
      subjects        TEXT DEFAULT '[]',
      slots           TEXT DEFAULT '[]',
      routine_config  TEXT DEFAULT '{}',
      parsed_days     TEXT DEFAULT '[]',
      is_active       INTEGER DEFAULT 1,
      created_at      TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      text        TEXT NOT NULL,
      title       TEXT,
      subject     TEXT DEFAULT '',
      duration    INTEGER DEFAULT 30,
      priority    TEXT DEFAULT 'medium',
      done        INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      xp_awarded  INTEGER DEFAULT 0,
      date        TEXT DEFAULT (date('now')),
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      subject     TEXT DEFAULT '',
      duration    INTEGER DEFAULT 25,
      type        TEXT DEFAULT 'focus',
      completed   INTEGER DEFAULT 1,
      date        TEXT DEFAULT (date('now')),
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER UNIQUE NOT NULL,
      xp              INTEGER DEFAULT 0,
      level           INTEGER DEFAULT 1,
      streak          INTEGER DEFAULT 0,
      longest_streak  INTEGER DEFAULT 0,
      last_active     TEXT DEFAULT (date('now')),
      total_tasks     INTEGER DEFAULT 0,
      total_sessions  INTEGER DEFAULT 0,
      achievements    TEXT DEFAULT '[]',
      created_at      TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, achievement_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migration: Ensure new columns exist for existing tables
  try {
    db.prepare('ALTER TABLE plans ADD COLUMN is_active INTEGER DEFAULT 1').run();
  } catch (e) {}
  
  try {
    db.prepare('ALTER TABLE tasks ADD COLUMN title TEXT').run();
  } catch (e) {}
  
  try {
    db.prepare('ALTER TABLE tasks ADD COLUMN duration INTEGER DEFAULT 30').run();
  } catch (e) {}

  try {
    db.prepare('ALTER TABLE tasks ADD COLUMN is_completed INTEGER DEFAULT 0').run();
  } catch (e) {}

} catch (error) {
  console.error('Database initialization error:', error);
}

export default db;
