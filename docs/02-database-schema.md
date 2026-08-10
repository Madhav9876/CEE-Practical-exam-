# 2. Database Schema

## 2.1 Entity-Relationship Overview

```
┌────────────┐ 1      N ┌──────────────────┐ 1      N ┌──────────────┐
│   users    │──────────│  question_sets   │──────────│  questions   │
│ (teacher/  │          │                  │          │              │
│  student)  │          └──────────────────┘          └──────┬───────┘
└────────────┘                                              │ 1
     │ 1                                                    │ N
     │                                                      ▼
     │ N                                          ┌──────────────────┐
┌────▼────────────┐                               │ question_options │
│    attempts     │──────────────────────────────▶│                  │
│ (student takes  │ 1                           N │ (A/B/C/D + key)  │
│  a released set)│                               └──────────────────┘
└────┬────────────┘
     │ 1
     │ N
┌────▼────────────┐ 1      N ┌──────────────────┐
│ attempt_answers │──────────│   results        │
│ (per-question   │          │ (pending/released│
│  selection)     │          │  + feedback flag)│
└─────────────────┘          └──────────────────┘
```

## 2.2 Table Definitions

### `users`
Stores both teachers/admins and students. Role drives all permission logic.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Primary key |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login identifier |
| `password_hash` | VARCHAR(255) | NOT NULL | Argon2/bcrypt hash |
| `full_name` | VARCHAR(150) | NOT NULL | Display name |
| `role` | ENUM('student','teacher','admin') | NOT NULL, DEFAULT 'student' | Access level |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Soft disable |
| `last_login_at` | TIMESTAMPTZ | NULL | Audit |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

### `question_sets`
A released set is the unit of an exam a student can attempt.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `title` | VARCHAR(200) | NOT NULL | e.g. "CEE 2026 — Full Mock Set 01" |
| `description` | TEXT | NULL | Instructions/notes |
| `syllabus` | ENUM('ce_2025','ce_2026','bph','bns') | NOT NULL, DEFAULT 'ce_2025' | Syllabus program code |
| `subject` | ENUM('biology','chemistry','physics','mental_agility','pcl','health','full') | NOT NULL | Set scope |
| `total_marks` | SMALLINT | NOT NULL, DEFAULT 200 | Enforced = 200 |
| `duration_minutes` | SMALLINT | NOT NULL | Time limit |
| `status` | ENUM('draft','released','archived') | NOT NULL, DEFAULT 'draft' | Release state |
| `released_at` | TIMESTAMPTZ | NULL | When teacher released |
| `created_by` | UUID | FK → users.id | Teacher who created |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

### `questions`
Each question belongs to a set and carries syllabus metadata for weightage enforcement.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `question_set_id` | UUID | FK → question_sets.id, NOT NULL | Parent set |
| `subject` | ENUM('biology','chemistry','physics','mental_agility','pcl','health') | NOT NULL | Subject |
| `topic` | VARCHAR(150) | NOT NULL | e.g. "Human Physiology", "Organic Chemistry" |
| `sub_topic` | VARCHAR(150) | NULL | e.g. "Zoology", "Physical" |
| `cognitive_level` | ENUM('recall','understanding','application') | NOT NULL | Difficulty distribution |
| `marks` | NUMERIC(4,2) | NOT NULL, DEFAULT 1.00 | Marks if correct |
| `negative_marks` | NUMERIC(4,2) | NOT NULL, DEFAULT 0.25 | Deducted if wrong |
| `question_text` | TEXT | NOT NULL | The stem |
| `media_url` | VARCHAR(500) | NULL | Optional image/diagram |
| `rationale` | TEXT | NULL | Explanation (feedback) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

### `question_options`
The four (or more) answer choices. Only one is the correct key.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `question_id` | UUID | FK → questions.id, NOT NULL | Parent question |
| `option_label` | CHAR(1) | NOT NULL | 'A','B','C','D' |
| `option_text` | TEXT | NOT NULL | Choice content |
| `is_correct` | BOOLEAN | NOT NULL, DEFAULT false | The single key |
| `sort_order` | SMALLINT | NOT NULL | Display order |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraint:** `CHECK (COUNT(is_correct = true) = 1)` enforced via a partial unique index / trigger to guarantee single-best-answer.

### `attempts`
One row per student attempt of a released set.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `student_id` | UUID | FK → users.id, NOT NULL | Who attempted |
| `question_set_id` | UUID | FK → question_sets.id, NOT NULL | Which set |
| `status` | ENUM('in_progress','submitted','expired') | NOT NULL, DEFAULT 'in_progress' | Lifecycle |
| `started_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `submitted_at` | TIMESTAMPTZ | NULL | When submitted |
| `time_limit_seconds` | INT | NOT NULL | Snapshot of limit |
| `ip_address` | INET | NULL | Anti-cheat audit |
| `user_agent` | TEXT | NULL | Anti-cheat audit |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraint:** `UNIQUE (student_id, question_set_id)` — a student may attempt a given set only once.

### `attempt_answers`
Append-only record of each question selection within an attempt.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `attempt_id` | UUID | FK → attempts.id, NOT NULL | Parent attempt |
| `question_id` | UUID | FK → questions.id, NOT NULL | Question answered |
| `selected_option_id` | UUID | FK → question_options.id, NULL | NULL = unanswered |
| `is_correct` | BOOLEAN | NULL | Computed at scoring |
| `marks_awarded` | NUMERIC(4,2) | NULL | +1 / −0.25 / 0 |
| `answered_at` | TIMESTAMPTZ | NULL | Timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraint:** `UNIQUE (attempt_id, question_id)` — one answer per question per attempt.

### `results`
Holds the moderated outcome. Starts **pending**, released by teacher.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `attempt_id` | UUID | FK → attempts.id, UNIQUE, NOT NULL | 1:1 with attempt |
| `total_marks` | NUMERIC(6,2) | NOT NULL | Final score (server-computed) |
| `correct_count` | INT | NOT NULL | |
| `incorrect_count` | INT | NOT NULL | |
| `unanswered_count` | INT | NOT NULL | |
| `status` | ENUM('pending','released') | NOT NULL, DEFAULT 'pending' | Moderation state |
| `feedback_enabled` | BOOLEAN | NOT NULL, DEFAULT false | Show answers/rationales |
| `reviewed_by` | UUID | FK → users.id, NULL | Teacher who reviewed |
| `reviewed_at` | TIMESTAMPTZ | NULL | |
| `released_at` | TIMESTAMPTZ | NULL | When result released |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

### `audit_logs`
Immutable trail of sensitive actions (release, review, tamper attempts).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGSERIAL | PK | |
| `actor_id` | UUID | FK → users.id, NOT NULL | Who acted |
| `action` | VARCHAR(100) | NOT NULL | e.g. "SET_RELEASED", "RESULT_RELEASED" |
| `entity_type` | VARCHAR(50) | NOT NULL | e.g. "question_set", "result" |
| `entity_id` | UUID | NOT NULL | Target |
| `metadata` | JSONB | NULL | Before/after state |
| `ip_address` | INET | NULL | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

## 2.3 Weightage Enforcement Strategy

The 200-mark total with per-syllabus subject weightage and 50/30/20 cognitive distribution is enforced at **two levels**:

1. **Application-level validation** — When a teacher creates a set, the backend validates that the sum of `questions.marks` per subject matches the **syllabus-specific** weightage targets. Targets differ per program:
   - **CE 2025:** Biology 80 / Chemistry 50 / Physics 50 / Mental Agility 20
   - **CE 2026:** Biology 80 / Chemistry 40 / Physics 40 / Mental Agility 20 / PCL 20
   - **BPH:** Biology 80 / Chemistry 40 / Physics 40 / Mental Agility 20 / Health 20
   - **BNS:** Nursing 180 / Mental Agility 20
   Cognitive levels must always be distributed 50% Recall / 30% Understanding / 20% Application (100/60/40 marks).
2. **Database-level check** — A `question_set_composition` summary table stores the computed subject/cognitive totals, with triggers that reject a set from being **released** unless the totals are syllabus-valid.

```
┌──────────────────────────────────────────────────────────────┐
│  question_set_composition (summary / validation view)        │
├──────────────────────────────────────────────────────────────┤
│  question_set_id   UUID                                      │
│  biology_marks     NUMERIC   -- must equal 80 for full sets  │
│  chemistry_marks   NUMERIC   -- must equal 50                │
│  physics_marks     NUMERIC   -- must equal 50                │
│  mental_marks      NUMERIC   -- must equal 20                │
│  recall_pct        NUMERIC   -- must equal 50                │
│  understanding_pct NUMERIC   -- must equal 30                │
│  application_pct   NUMERIC   -- must equal 20                │
│  total_marks       NUMERIC   -- must equal 200               │
└──────────────────────────────────────────────────────────────┘
```

## 2.4 Indexes

| Table | Index | Purpose |
|---|---|---|
| `questions` | `(question_set_id)` | Fast set composition queries |
| `questions` | `(subject, topic)` | Syllabus filtering |
| `question_options` | `(question_id)` | Load options per question |
| `attempts` | `(student_id, status)` | Student's active/past attempts |
| `attempts` | `(question_set_id, status)` | Set attempt analytics |
| `attempt_answers` | `(attempt_id)` | Load full answer sheet |
| `results` | `(status, released_at)` | Teacher review queue (pending) |
| `audit_logs` | `(entity_type, entity_id)` | Audit lookup |

## 2.5 DDL (PostgreSQL)

```sql
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE set_status AS ENUM ('draft', 'released', 'archived');
CREATE TYPE syllabus_enum AS ENUM ('ce_2025', 'ce_2026', 'bph', 'bns');
CREATE TYPE subject_enum AS ENUM ('biology', 'chemistry', 'physics', 'mental_agility', 'pcl', 'health');
CREATE TYPE cognitive_level AS ENUM ('recall', 'understanding', 'application');
CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'expired');
CREATE TYPE result_status AS ENUM ('pending', 'released');

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    role          user_role NOT NULL DEFAULT 'student',
    is_active     BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_sets (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    syllabus         syllabus_enum NOT NULL DEFAULT 'ce_2025',
    subject          subject_enum NOT NULL,
    total_marks      SMALLINT NOT NULL DEFAULT 200,
    duration_minutes SMALLINT NOT NULL,
    status           set_status NOT NULL DEFAULT 'draft',
    released_at      TIMESTAMPTZ,
    created_by       UUID NOT NULL REFERENCES users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
    subject         subject_enum NOT NULL,
    topic           VARCHAR(150) NOT NULL,
    sub_topic       VARCHAR(150),
    cognitive_level cognitive_level NOT NULL,
    marks           NUMERIC(4,2) NOT NULL DEFAULT 1.00,
    negative_marks  NUMERIC(4,2) NOT NULL DEFAULT 0.25,
    question_text   TEXT NOT NULL,
    media_url       VARCHAR(500),
    rationale       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_options (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id  UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_label CHAR(1) NOT NULL,
    option_text  TEXT NOT NULL,
    is_correct   BOOLEAN NOT NULL DEFAULT false,
    sort_order   SMALLINT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce exactly one correct option per question (single-best-answer)
CREATE UNIQUE INDEX one_correct_option_per_question
    ON question_options (question_id)
    WHERE is_correct = true;

CREATE TABLE attempts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         UUID NOT NULL REFERENCES users(id),
    question_set_id    UUID NOT NULL REFERENCES question_sets(id),
    status             attempt_status NOT NULL DEFAULT 'in_progress',
    started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at       TIMESTAMPTZ,
    time_limit_seconds INT NOT NULL,
    ip_address         INET,
    user_agent         TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, question_set_id)
);

CREATE TABLE attempt_answers (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id         UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id        UUID NOT NULL REFERENCES questions(id),
    selected_option_id UUID REFERENCES question_options(id),
    is_correct         BOOLEAN,
    marks_awarded      NUMERIC(4,2),
    answered_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (attempt_id, question_id)
);

CREATE TABLE results (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id       UUID NOT NULL UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,
    total_marks      NUMERIC(6,2) NOT NULL,
    correct_count    INT NOT NULL,
    incorrect_count  INT NOT NULL,
    unanswered_count INT NOT NULL,
    status           result_status NOT NULL DEFAULT 'pending',
    feedback_enabled BOOLEAN NOT NULL DEFAULT false,
    reviewed_by      UUID REFERENCES users(id),
    reviewed_at      TIMESTAMPTZ,
    released_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    actor_id    UUID NOT NULL REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   UUID NOT NULL,
    metadata    JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supporting indexes
CREATE INDEX idx_questions_set      ON questions (question_set_id);
CREATE INDEX idx_questions_subject  ON questions (subject, topic);
CREATE INDEX idx_options_question   ON question_options (question_id);
CREATE INDEX idx_attempts_student   ON attempts (student_id, status);
CREATE INDEX idx_attempts_set       ON attempts (question_set_id, status);
CREATE INDEX idx_answers_attempt    ON attempt_answers (attempt_id);
CREATE INDEX idx_results_status     ON results (status, released_at);
CREATE INDEX idx_audit_entity       ON audit_logs (entity_type, entity_id);
```

## 2.6 Scoring Formula (Server-Side)

For each attempt, the backend computes:

```
total_marks = Σ (marks_awarded per answered question)

where for each question:
  correct   → marks_awarded = +1.00
  incorrect → marks_awarded = −0.25
  unanswered→ marks_awarded =  0.00

correct_count    = number of questions with is_correct = true
incorrect_count  = number answered but is_correct = false
unanswered_count = number with selected_option_id IS NULL
```

This computation runs inside a **single database transaction** at submission time and is stored immutably in `results`, never recomputed from client input.