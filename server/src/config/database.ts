const Database = require('better-sqlite3');
import path from 'path';

const dbPath = path.join(__dirname, '../../studyflow.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize Tables
export const initDB = () => {
  // Users Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      goal TEXT,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Plans Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      examName TEXT NOT NULL,
      examDate TEXT NOT NULL,
      aiPlanText TEXT,
      isCompleted INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  // Tasks Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT,
      duration INTEGER DEFAULT 30,
      isCompleted INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium',
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  // Sessions Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      subject TEXT NOT NULL,
      duration INTEGER NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  console.log('✅ SQLite Database Initialized: studyflow.db');
};

export default db;
