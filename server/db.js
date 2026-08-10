const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'cee.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
  is_active     INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS question_sets (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT NOT NULL,
  description      TEXT,
  syllabus         TEXT NOT NULL DEFAULT 'ce_2025' CHECK (syllabus IN ('ce_2025','ce_2026','bph','bns')),
  subject          TEXT NOT NULL DEFAULT 'full',
  total_marks      INTEGER NOT NULL DEFAULT 200,
  duration_minutes INTEGER NOT NULL DEFAULT 180,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','released','archived')),
  released_at      TEXT,
  created_by       INTEGER NOT NULL REFERENCES users(id),
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  question_set_id INTEGER NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL CHECK (subject IN ('biology','chemistry','physics','mental_agility','pcl','health')),
  topic           TEXT NOT NULL,
  sub_topic       TEXT,
  cognitive_level TEXT NOT NULL CHECK (cognitive_level IN ('recall','understanding','application')),
  marks           REAL NOT NULL DEFAULT 1.00,
  negative_marks  REAL NOT NULL DEFAULT 0.25,
  question_text   TEXT NOT NULL,
  rationale       TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS question_options (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id  INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_label TEXT NOT NULL,
  option_text  TEXT NOT NULL,
  is_correct   INTEGER NOT NULL DEFAULT 0,
  sort_order   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS attempts (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id         INTEGER NOT NULL REFERENCES users(id),
  question_set_id    INTEGER NOT NULL REFERENCES question_sets(id),
  status             TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','expired')),
  started_at         TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at       TEXT,
  time_limit_seconds INTEGER NOT NULL,
  ip_address         TEXT,
  user_agent         TEXT,
  UNIQUE (student_id, question_set_id)
);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id         INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id        INTEGER NOT NULL REFERENCES questions(id),
  selected_option_id INTEGER REFERENCES question_options(id),
  is_correct         INTEGER,
  marks_awarded      REAL,
  answered_at        TEXT,
  UNIQUE (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS results (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id       INTEGER NOT NULL UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,
  total_marks      REAL NOT NULL,
  correct_count    INTEGER NOT NULL,
  incorrect_count  INTEGER NOT NULL,
  unanswered_count INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','released')),
  feedback_enabled INTEGER NOT NULL DEFAULT 0,
  reviewed_by      INTEGER REFERENCES users(id),
  reviewed_at      TEXT,
  released_at      TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id    INTEGER NOT NULL REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   INTEGER,
  metadata    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;