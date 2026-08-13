const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Database adapter selection based on environment.
// Both adapters expose the same Promise-based interface.
const db = process.env.DATABASE_URL
  ? require('./db-postgres')  // PostgreSQL (Render/Supabase production)
  : require('./db');          // SQLite (local development)

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Set it in your environment before starting the server.');
  process.exit(1);
}
const TOKEN_TTL = '2h';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Render terminates TLS upstream; trust the proxy so req.ip is the client IP.
app.set('trust proxy', 1);

// ---------- CORS ----------
// Vercel (frontend) and Render (backend) are different origins, so the browser
// sends cross-origin requests. Allow an explicit list via CORS_ORIGIN.
const corsOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: corsOrigins.includes('*') ? true : corsOrigins,
  credentials: false,
}));

app.use(express.json({ limit: '10kb' }));
// ---------- Static Files ----------
// Serve the Vite-built React app from dist/.
app.use(express.static(path.join(__dirname, '..', 'dist'), { maxAge: '1d' }));

// Request logging in development
if (NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ---------- Helpers ----------
function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

/**
 * Wrap an async route handler so rejected promises reach the error middleware
 * instead of hanging the request.
 */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Postgres BOOLEAN columns need real booleans; SQLite keeps using 0/1. */
function toBool(value) {
  return db.dialect === 'postgres' ? !!value : (value ? 1 : 0);
}

/** Boolean literal for inline SQL comparisons (`is_active = ...`). */
const TRUE_SQL = () => (db.dialect === 'postgres' ? 'TRUE' : '1');

function auth(roles) {
  return wrap(async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    }
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    if (!user || !user.is_active) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid user' } });
    if (roles && !roles.includes(user.role)) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    req.user = user;
    next();
  });
}

async function audit(actorId, action, entityType, entityId, metadata) {
  await db.prepare('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES (?,?,?,?,?)')
    .run(actorId, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null);
}

async function getSetComposition(setId) {
  const rows = await db.prepare(`
    SELECT subject, cognitive_level, SUM(marks) as marks, COUNT(*) as count
    FROM questions WHERE question_set_id = ? AND is_active = ${TRUE_SQL()}
    GROUP BY subject, cognitive_level
  `).all(setId);
  const comp = { biology: 0, chemistry: 0, physics: 0, mental_agility: 0, pcl: 0, health: 0, recall: 0, understanding: 0, application: 0, total: 0, count: 0 };
  for (const r of rows) {
    const marks = Number(r.marks);
    const count = Number(r.count);
    if (comp[r.subject] === undefined) comp[r.subject] = 0;
    comp[r.subject] += marks;
    comp[r.cognitive_level] += marks;
    comp.total += marks;
    comp.count += count;
  }
  return comp;
}

// Syllabus-aware composition validation
async function validateComposition(setId) {
  const set = await db.prepare('SELECT * FROM question_sets WHERE id = ?').get(setId);
  if (!set) return { valid: false, errors: ['Set not found'], comp: {} };
  const comp = await getSetComposition(setId);
  const errors = [];
  if (comp.total !== 200) errors.push(`Total marks must be 200 (currently ${comp.total})`);

  // Subject weightage per syllabus
  const subjectTargets = {
    ce_2025: { biology: 80, chemistry: 50, physics: 50, mental_agility: 20 },
    ce_2026: { biology: 80, chemistry: 40, physics: 40, mental_agility: 20, pcl: 20 },
    bph:     { biology: 80, chemistry: 40, physics: 40, mental_agility: 20, health: 20 },
    bns:     { health: 180, mental_agility: 20 }
  };
  const targets = subjectTargets[set.syllabus] || subjectTargets.ce_2025;

  for (const [subject, target] of Object.entries(targets)) {
    if (target > 0 && comp[subject] !== target) {
      errors.push(`${subject.charAt(0).toUpperCase() + subject.slice(1)} must be ${target} marks (currently ${comp[subject]})`);
    }
  }

  // Cognitive distribution (50/30/20 of 200 = 100/60/40)
  if (comp.recall !== 100) errors.push(`Recall must be 50% (100 marks, currently ${comp.recall})`);
  if (comp.understanding !== 60) errors.push(`Understanding must be 30% (60 marks, currently ${comp.understanding})`);
  if (comp.application !== 40) errors.push(`Application must be 20% (40 marks, currently ${comp.application})`);
  return { valid: errors.length === 0, errors, comp };
}

async function scoreAttempt(attemptId) {
  const answers = await db.prepare(`
    SELECT aa.*, q.marks, q.negative_marks
    FROM attempt_answers aa
    JOIN questions q ON q.id = aa.question_id
    WHERE aa.attempt_id = ?
  `).all(attemptId);
  let total = 0, correct = 0, incorrect = 0, unanswered = 0;
  for (const a of answers) {
    const marks = Number(a.marks);
    const negative = Number(a.negative_marks);
    let awarded;
    if (a.selected_option_id === null || a.selected_option_id === undefined) {
      unanswered++;
      awarded = 0;
    } else if (a.is_correct) {
      correct++;
      awarded = marks;
      total += marks;
    } else {
      incorrect++;
      awarded = -negative;
      total -= negative;
    }
    await db.prepare('UPDATE attempt_answers SET is_correct = ?, marks_awarded = ? WHERE id = ?')
      .run(toBool(a.is_correct), awarded, a.id);
  }
  await db.prepare(`
    INSERT INTO results (attempt_id, total_marks, correct_count, incorrect_count, unanswered_count, status)
    VALUES (?,?,?,?,?,'pending')
  `).run(attemptId, total, correct, incorrect, unanswered);
  return { total, correct, incorrect, unanswered };
}

/** `is_active = ?` style filters differ per engine. */

// ---------- Auth ----------
app.post('/api/v1/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
  }
  if (!user.is_active) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Account disabled' } });
  await db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);
  await audit(user.id, 'LOGIN_SUCCESS', 'user', user.id);
  res.json({ success: true, data: { token: signToken(user), user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } } });
}));

app.get('/api/v1/auth/me', auth(), (req, res) => {
  res.json({ success: true, data: { id: req.user.id, email: req.user.email, full_name: req.user.full_name, role: req.user.role } });
});

// ---------- Question Sets (Teacher) ----------
app.post('/api/v1/question-sets', auth(['teacher', 'admin']), wrap(async (req, res) => {
  const { title, description, syllabus = 'ce_2025', subject = 'full', total_marks = 200, duration_minutes = 180 } = req.body || {};
  if (!title) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'title is required' } });
  const info = await db.prepare('INSERT INTO question_sets (title, description, syllabus, subject, total_marks, duration_minutes, created_by) VALUES (?,?,?,?,?,?,?)')
    .run(title, description, syllabus, subject, total_marks, duration_minutes, req.user.id);
  await audit(req.user.id, 'SET_CREATED', 'question_set', info.lastInsertRowid);
  res.status(201).json({ success: true, data: { id: info.lastInsertRowid, title, status: 'draft' } });
}));

app.get('/api/v1/question-sets', auth(['teacher', 'admin']), wrap(async (req, res) => {
  const sets = await db.prepare('SELECT * FROM question_sets WHERE created_by = ? ORDER BY created_at DESC').all(req.user.id);
  for (const s of sets) {
    const row = await db.prepare(`SELECT COUNT(*) as c FROM questions WHERE question_set_id = ? AND is_active = ${TRUE_SQL()}`).get(s.id);
    s.question_count = Number(row.c);
  }
  res.json({ success: true, data: sets });
}));

app.get('/api/v1/question-sets/:id', auth(['teacher', 'admin']), wrap(async (req, res) => {
  const set = await db.prepare('SELECT * FROM question_sets WHERE id = ?').get(req.params.id);
  if (!set) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Set not found' } });
  const questions = await db.prepare(`SELECT * FROM questions WHERE question_set_id = ? AND is_active = ${TRUE_SQL()}`).all(set.id);
  for (const q of questions) {
    q.options = await db.prepare('SELECT id, option_label, option_text, is_correct, sort_order FROM question_options WHERE question_id = ? ORDER BY sort_order').all(q.id);
  }
  set.questions = questions;
  set.composition = await getSetComposition(set.id);
  res.json({ success: true, data: set });
}));

app.post('/api/v1/question-sets/:id/questions', auth(['teacher', 'admin']), wrap(async (req, res) => {
  const set = await db.prepare('SELECT * FROM question_sets WHERE id = ?').get(req.params.id);
  if (!set) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Set not found' } });
  if (set.status === 'released') return res.status(409).json({ success: false, error: { code: 'SET_RELEASED', message: 'Cannot modify a released set' } });
  const { subject, topic, sub_topic, cognitive_level, marks = 1, negative_marks = 0.25, question_text, rationale, options } = req.body || {};
  if (!subject || !topic || !cognitive_level || !question_text || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required question fields' } });
  }
  const correctCount = options.filter(o => o.is_correct).length;
  if (correctCount !== 1) return res.status(422).json({ success: false, error: { code: 'SINGLE_ANSWER_VIOLATION', message: 'Exactly one correct option required' } });
  const qInfo = await db.prepare('INSERT INTO questions (question_set_id, subject, topic, sub_topic, cognitive_level, marks, negative_marks, question_text, rationale) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(set.id, subject, topic, sub_topic, cognitive_level, marks, negative_marks, question_text, rationale);
  for (const o of options) {
    await db.prepare('INSERT INTO question_options (question_id, option_label, option_text, is_correct, sort_order) VALUES (?,?,?,?,?)')
      .run(qInfo.lastInsertRowid, o.option_label, o.option_text, toBool(o.is_correct), o.sort_order || 0);
  }
  await audit(req.user.id, 'QUESTION_ADDED', 'question', qInfo.lastInsertRowid);
  res.status(201).json({ success: true, data: { id: qInfo.lastInsertRowid } });
}));

app.get('/api/v1/question-sets/:id/composition', auth(['teacher', 'admin']), wrap(async (req, res) => {
  const result = await validateComposition(req.params.id);
  res.json({ success: true, data: result });
}));

// ---------- Set Release (Teacher) ----------
app.post('/api/v1/question-sets/:id/release', auth(['teacher', 'admin']), wrap(async (req, res) => {
  const set = await db.prepare('SELECT * FROM question_sets WHERE id = ?').get(req.params.id);
  if (!set) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Set not found' } });
  const validation = await validateComposition(set.id);
  if (!validation.valid) return res.status(422).json({ success: false, error: { code: 'COMPOSITION_INVALID', message: validation.errors.join('; ') } });
  await db.prepare("UPDATE question_sets SET status = 'released', released_at = datetime('now') WHERE id = ?").run(set.id);
  await audit(req.user.id, 'SET_RELEASED', 'question_set', set.id);
  res.json({ success: true, data: { id: set.id, status: 'released' } });
}));

app.post('/api/v1/question-sets/:id/unrelease', auth(['teacher', 'admin']), wrap(async (req, res) => {
  await db.prepare("UPDATE question_sets SET status = 'draft', released_at = NULL WHERE id = ?").run(req.params.id);
  await audit(req.user.id, 'SET_UNRELEASED', 'question_set', req.params.id);
  res.json({ success: true, data: { id: req.params.id, status: 'draft' } });
}));

app.post('/api/v1/question-sets/:id/archive', auth(['teacher', 'admin']), wrap(async (req, res) => {
  await db.prepare("UPDATE question_sets SET status = 'archived' WHERE id = ?").run(req.params.id);
  await audit(req.user.id, 'SET_ARCHIVED', 'question_set', req.params.id);
  res.json({ success: true, data: { id: req.params.id, status: 'archived' } });
}));

// ---------- Student Exam Access ----------
app.get('/api/v1/student/sets', auth(['student']), wrap(async (req, res) => {
  const sets = await db.prepare("SELECT * FROM question_sets WHERE status = 'released' ORDER BY released_at DESC").all();
  const attempted = await db.prepare('SELECT question_set_id FROM attempts WHERE student_id = ?').all(req.user.id);
  const attemptedIds = new Set(attempted.map(a => a.question_set_id));
  res.json({ success: true, data: sets.map(s => ({ ...s, attempted: attemptedIds.has(s.id) })) });
}));

app.post('/api/v1/student/attempts', auth(['student']), wrap(async (req, res) => {
  const { question_set_id } = req.body || {};
  const set = await db.prepare('SELECT * FROM question_sets WHERE id = ?').get(question_set_id);
  if (!set || set.status !== 'released') return res.status(409).json({ success: false, error: { code: 'SET_NOT_RELEASED', message: 'Set not available' } });
  const existing = await db.prepare('SELECT * FROM attempts WHERE student_id = ? AND question_set_id = ?').get(req.user.id, set.id);
  if (existing) return res.status(409).json({ success: false, error: { code: 'ALREADY_ATTEMPTED', message: 'You have already attempted this set' } });
  const info = await db.prepare('INSERT INTO attempts (student_id, question_set_id, time_limit_seconds, ip_address, user_agent) VALUES (?,?,?,?,?)')
    .run(req.user.id, set.id, set.duration_minutes * 60, req.ip, req.headers['user-agent'] || null);
  await audit(req.user.id, 'ATTEMPT_STARTED', 'attempt', info.lastInsertRowid);
  res.status(201).json({ success: true, data: { attempt_id: info.lastInsertRowid, started_at: new Date().toISOString(), time_limit_seconds: set.duration_minutes * 60 } });
}));

app.get('/api/v1/student/attempts/:id/questions', auth(['student']), wrap(async (req, res) => {
  const attempt = await db.prepare('SELECT * FROM attempts WHERE id = ? AND student_id = ?').get(req.params.id, req.user.id);
  if (!attempt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attempt not found' } });
  if (attempt.status !== 'in_progress') return res.status(409).json({ success: false, error: { code: 'ATTEMPT_CLOSED', message: 'Attempt already submitted' } });
  const questions = await db.prepare(`SELECT * FROM questions WHERE question_set_id = ? AND is_active = ${TRUE_SQL()}`).all(attempt.question_set_id);
  const data = [];
  for (const q of questions) {
    const options = await db.prepare('SELECT id, option_label, option_text FROM question_options WHERE question_id = ? ORDER BY sort_order').all(q.id);
    // Shuffle options deterministically per attempt
    const shuffled = options.map((o, i) => ({ ...o, seed: (i * 7 + attempt.id * 13) % options.length })).sort((a, b) => a.seed - b.seed);
    data.push({ id: q.id, subject: q.subject, topic: q.topic, question_text: q.question_text, options: shuffled.map(({ id, option_label, option_text }) => ({ id, option_label, option_text })) });
  }
  res.json({ success: true, data });
}));

app.put('/api/v1/student/attempts/:id/answers/:questionId', auth(['student']), wrap(async (req, res) => {
  const { selected_option_id } = req.body || {};
  const attempt = await db.prepare('SELECT * FROM attempts WHERE id = ? AND student_id = ?').get(req.params.id, req.user.id);
  if (!attempt || attempt.status !== 'in_progress') return res.status(409).json({ success: false, error: { code: 'ATTEMPT_CLOSED', message: 'Attempt not active' } });
  const opt = await db.prepare('SELECT * FROM question_options WHERE id = ?').get(selected_option_id);
  if (!opt) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid option' } });
  const q = await db.prepare('SELECT * FROM questions WHERE id = ? AND question_set_id = ?').get(req.params.questionId, attempt.question_set_id);
  if (!q) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Question not in this set' } });
  await db.prepare(`
    INSERT INTO attempt_answers (attempt_id, question_id, selected_option_id, is_correct, answered_at)
    VALUES (?,?,?,?, datetime('now'))
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET selected_option_id = excluded.selected_option_id, is_correct = excluded.is_correct, answered_at = excluded.answered_at
  `).run(attempt.id, q.id, opt.id, toBool(opt.is_correct));
  res.json({ success: true, data: { question_id: q.id, saved: true } });
}));

app.post('/api/v1/student/attempts/:id/submit', auth(['student']), wrap(async (req, res) => {
  const attempt = await db.prepare('SELECT * FROM attempts WHERE id = ? AND student_id = ?').get(req.params.id, req.user.id);
  if (!attempt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attempt not found' } });
  if (attempt.status !== 'in_progress') return res.status(409).json({ success: false, error: { code: 'ATTEMPT_CLOSED', message: 'Already submitted' } });
  await db.prepare("UPDATE attempts SET status = 'submitted', submitted_at = datetime('now') WHERE id = ?").run(attempt.id);
  await scoreAttempt(attempt.id);
  await audit(req.user.id, 'ATTEMPT_SUBMITTED', 'attempt', attempt.id);
  res.json({ success: true, data: { attempt_id: attempt.id, status: 'submitted', result_status: 'pending', message: 'Your exam has been submitted. Results will be available after teacher review.' } });
}));

app.get('/api/v1/student/attempts', auth(['student']), wrap(async (req, res) => {
  const attempts = await db.prepare(`
    SELECT a.*, qs.title as set_title, qs.syllabus, r.status as result_status, r.total_marks
    FROM attempts a
    JOIN question_sets qs ON qs.id = a.question_set_id
    LEFT JOIN results r ON r.attempt_id = a.id
    WHERE a.student_id = ?
    ORDER BY a.started_at DESC
  `).all(req.user.id);
  res.json({ success: true, data: attempts });
}));

// ---------- Result Moderation (Teacher) ----------
app.get('/api/v1/teacher/results', auth(['teacher', 'admin']), wrap(async (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT r.*, u.full_name as student_name, u.email as student_email, qs.title as set_title, qs.syllabus
    FROM results r
    JOIN attempts a ON a.id = r.attempt_id
    JOIN users u ON u.id = a.student_id
    JOIN question_sets qs ON qs.id = a.question_set_id
  `;
  const params = [];
  if (status) { sql += ' WHERE r.status = ?'; params.push(status); }
  sql += ' ORDER BY r.created_at DESC';
  const results = await db.prepare(sql).all(...params);
  res.json({ success: true, data: results });
}));

app.get('/api/v1/teacher/results/:id', auth(['teacher', 'admin']), wrap(async (req, res) => {
  const result = await db.prepare(`
    SELECT r.*, u.full_name as student_name, u.email as student_email, qs.title as set_title, qs.syllabus
    FROM results r
    JOIN attempts a ON a.id = r.attempt_id
    JOIN users u ON u.id = a.student_id
    JOIN question_sets qs ON qs.id = a.question_set_id
    WHERE r.id = ?
  `).get(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Result not found' } });
  const answers = await db.prepare(`
    SELECT aa.*, q.question_text, q.rationale, q.subject, q.topic,
           opt.option_label as selected_label,
           (SELECT option_label FROM question_options WHERE question_id = q.id AND is_correct = ${TRUE_SQL()}) as correct_label
    FROM attempt_answers aa
    JOIN questions q ON q.id = aa.question_id
    LEFT JOIN question_options opt ON opt.id = aa.selected_option_id
    WHERE aa.attempt_id = ?
  `).all(result.attempt_id);
  result.answers = answers;
  res.json({ success: true, data: result });
}));

app.patch('/api/v1/teacher/results/:id/release', auth(['teacher', 'admin']), wrap(async (req, res) => {
  const { feedback_enabled = false } = req.body || {};
  const result = await db.prepare('SELECT * FROM results WHERE id = ?').get(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Result not found' } });
  await db.prepare("UPDATE results SET status = 'released', feedback_enabled = ?, reviewed_by = ?, reviewed_at = datetime('now'), released_at = datetime('now') WHERE id = ?")
    .run(toBool(feedback_enabled), req.user.id, result.id);
  await audit(req.user.id, 'RESULT_RELEASED', 'result', result.id, { feedback_enabled });
  res.json({ success: true, data: { result_id: result.id, status: 'released', feedback_enabled: !!feedback_enabled } });
}));

app.patch('/api/v1/teacher/results/:id/hold', auth(['teacher', 'admin']), wrap(async (req, res) => {
  await db.prepare("UPDATE results SET reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?").run(req.user.id, req.params.id);
  await audit(req.user.id, 'RESULT_HELD', 'result', req.params.id);
  res.json({ success: true, data: { result_id: req.params.id, status: 'held' } });
}));

// ---------- Student Result Viewing ----------
app.get('/api/v1/student/results', auth(['student']), wrap(async (req, res) => {
  const results = await db.prepare(`
    SELECT r.*, qs.title as set_title, qs.syllabus
    FROM results r
    JOIN attempts a ON a.id = r.attempt_id
    JOIN question_sets qs ON qs.id = a.question_set_id
    WHERE a.student_id = ? AND r.status = 'released'
    ORDER BY r.released_at DESC
  `).all(req.user.id);
  res.json({ success: true, data: results });
}));

app.get('/api/v1/student/results/:id', auth(['student']), wrap(async (req, res) => {
  const result = await db.prepare(`
    SELECT r.*, qs.title as set_title, qs.syllabus
    FROM results r
    JOIN attempts a ON a.id = r.attempt_id
    JOIN question_sets qs ON qs.id = a.question_set_id
    WHERE r.id = ? AND a.student_id = ?
  `).get(req.params.id, req.user.id);
  if (!result) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Result not found' } });
  if (result.status !== 'released') return res.status(403).json({ success: false, error: { code: 'RESULT_PENDING', message: 'Result not yet released' } });
  const answers = await db.prepare(`
    SELECT aa.*, q.question_text, q.rationale, q.subject, q.topic,
           opt.option_label as selected_label,
           (SELECT option_label FROM question_options WHERE question_id = q.id AND is_correct = ${TRUE_SQL()}) as correct_label
    FROM attempt_answers aa
    JOIN questions q ON q.id = aa.question_id
    LEFT JOIN question_options opt ON opt.id = aa.selected_option_id
    WHERE aa.attempt_id = ?
  `).all(result.attempt_id);
  if (!result.feedback_enabled) {
    for (const a of answers) { delete a.rationale; delete a.correct_label; }
  }
  result.answers = answers;
  res.json({ success: true, data: result });
}));

// ---------- Audit (Admin) ----------
app.get('/api/v1/audit-logs', auth(['admin']), wrap(async (req, res) => {
  const logs = await db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200').all();
  res.json({ success: true, data: logs });
}));

app.get('/api/v1/admin/stats', auth(['admin']), wrap(async (req, res) => {
  const one = async (sql) => Number((await db.prepare(sql).get()).c);
  const stats = {
    users: await one('SELECT COUNT(*) as c FROM users'),
    students: await one("SELECT COUNT(*) as c FROM users WHERE role = 'student'"),
    teachers: await one("SELECT COUNT(*) as c FROM users WHERE role = 'teacher'"),
    sets: await one('SELECT COUNT(*) as c FROM question_sets'),
    released_sets: await one("SELECT COUNT(*) as c FROM question_sets WHERE status = 'released'"),
    attempts: await one('SELECT COUNT(*) as c FROM attempts'),
    pending_results: await one("SELECT COUNT(*) as c FROM results WHERE status = 'pending'"),
    released_results: await one("SELECT COUNT(*) as c FROM results WHERE status = 'released'")
  };
  res.json({ success: true, data: stats });
}));

// Health check endpoint (before SPA fallback)
app.get('/api/v1/health', async (req, res) => {
  try {
    const row = await db.prepare('SELECT COUNT(*) as c FROM users').get();
    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        engine: db.dialect,
        users: Number(row.c),
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'HEALTH_CHECK_FAILED', message: 'Database connection failed' } });
  }
});

// SPA fallback (must be last). API routes fall through to a JSON 404 so that
// missing endpoints never return HTML to a fetch() caller.
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
  }
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Centralised error handler for rejected async handlers.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
});

async function start() {
  try {
    await db.init();
  } catch (e) {
    console.error('Database initialisation failed:', e.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`CEE Nepal Exam Portal running at http://localhost:${PORT}`);
    console.log(`Database engine: ${db.dialect}`);
    console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
  });
}

start();
