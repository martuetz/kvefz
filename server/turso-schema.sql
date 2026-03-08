-- KV EFZ Evolution - Turso Schema (SQLite)

-- Users/Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'user',
  is_premium BOOLEAN DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_active DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'mcq',
  options TEXT, -- JSON array of strings
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  topic TEXT NOT NULL,
  subtopic TEXT,
  difficulty TEXT DEFAULT 'mittel',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'quiz', -- 'quiz' or 'exam'
  questions TEXT, -- JSON array of IDs
  answers TEXT, -- JSON array of responses
  score REAL,
  grade REAL,
  duration INTEGER,
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flashcard Decks Table
CREATE TABLE IF NOT EXISTS flashcard_decks (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  cards TEXT, -- JSON array of card objects
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Progress/Stats Table (Optional but useful)
CREATE TABLE IF NOT EXISTS user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN,
  last_answered DATETIME DEFAULT CURRENT_TIMESTAMP,
  count INTEGER DEFAULT 1
);
