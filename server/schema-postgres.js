/**
 * PostgreSQL schema for the CEE Nepal Exam Portal.
 *
 * Mirrors server/db.js (SQLite) exactly in table/column names and semantics so
 * that application code is identical across both engines. Idempotent: safe to
 * run on every boot.
 */
module.exports = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_sets (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT,
  syllabus         TEXT NOT NULL DEFAULT 'ce_2025' CHECK (syllabus IN ('ce_2025','ce_2026','bph','bns')),
  subject          TEXT NOT NULL DEFAULT 'full',
  total_marks      INTEGER NOT NULL DEFAULT 200,
  duration_minutes INTEGER NOT NULL DEFAULT 180,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','released','archived')),
  released_at      TIMESTAMPTZ,
  created_by       INTEGER NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id              SERIAL PRIMARY KEY,
  question_set_id INTEGER NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL CHECK (subject IN ('biology','chemistry','physics','mental_agility','pcl','health')),
  topic           TEXT NOT NULL,
  sub_topic       TEXT,
  cognitive_level TEXT NOT NULL CHECK (cognitive_level IN ('recall','understanding','application')),
  marks           NUMERIC(6,2) NOT NULL DEFAULT 1.00,
  negative_marks  NUMERIC(6,2) NOT NULL DEFAULT 0.25,
  question_text   TEXT NOT NULL,
  rationale       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_options (
  id           SERIAL PRIMARY KEY,
  question_id  INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_label TEXT NOT NULL,
  option_text  TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS attempts (
  id                 SERIAL PRIMARY KEY,
  student_id         INTEGER NOT NULL REFERENCES users(id),
  question_set_id    INTEGER NOT NULL REFERENCES question_sets(id),
  status             TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','expired')),
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at       TIMESTAMPTZ,
  time_limit_seconds INTEGER NOT NULL,
  ip_address         TEXT,
  user_agent         TEXT,
  UNIQUE (student_id, question_set_id)
);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id                 SERIAL PRIMARY KEY,
  attempt_id         INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id        INTEGER NOT NULL REFERENCES questions(id),
  selected_option_id INTEGER REFERENCES question_options(id),
  is_correct         BOOLEAN,
  marks_awarded      NUMERIC(6,2),
  answered_at        TIMESTAMPTZ,
  UNIQUE (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS results (
  id               SERIAL PRIMARY KEY,
  attempt_id       INTEGER NOT NULL UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,
  total_marks      NUMERIC(8,2) NOT NULL,
  correct_count    INTEGER NOT NULL,
  incorrect_count  INTEGER NOT NULL,
  unanswered_count INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','released')),
  feedback_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by      INTEGER REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  released_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  actor_id    INTEGER NOT NULL REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   INTEGER,
  metadata    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_set     ON questions (question_set_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_options_question  ON question_options (question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student  ON attempts (student_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt   ON attempt_answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_results_status    ON results (status);
CREATE INDEX IF NOT EXISTS idx_audit_created     ON audit_logs (created_at DESC);
`;
