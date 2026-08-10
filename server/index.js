const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cee-nepal-dev-secret-change-in-production';
const TOKEN_TTL = '2h';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(cors({ origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1d' }));

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

function auth(roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
      if (!user || !user.is_active) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid user' } });
      if (roles && !roles.includes(user.role)) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      req.user = user;
      next();
    } catch (e) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    }
  };
}

function audit(actorId, action, entityType, entityId, metadata) {
  db.prepare('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES (?,?,?,?,?)')
    .run(actorId, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null);
}

function getSetComposition(setId) {
  const rows = db.prepare(`
    SELECT subject, cognitive_level, SUM(marks) as marks, COUNT(*) as count
    FROM questions WHERE question_set_id = ? AND is_active = 1
    GROUP BY subject, cognitive_level
  `).all(setId);
  const comp = { biology: 0, chemistry: 0, physics: 0, mental_agility: 0, pcl: 0, health: 0, recall: 0, understanding: 0, application: 0, total: 0, count: 0 };
  for (const r of rows) {
    if (comp[r.subject] === undefined) comp[r.subject] = 0;
    comp[r.subject] += r.marks;
    comp[r.cognitive_level] += r.marks;
    comp.total += r.marks;
    comp.count += r.count;
  }
  return comp;
}

// Syllabus-aware composition validation
function validateComposition(setId) {
  const set = db.prepare('SELECT * FROM question_sets WHERE id = ?').get(setId);
  if (!set) return { valid: false, errors: ['Set not found'], comp: {} };
  const comp = getSetComposition(setId);
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

function scoreAttempt(attemptId) {
  const answers = db.prepare(`
    SELECT aa.*, q.marks, q.negative_marks
    FROM attempt_answers aa
    JOIN questions q ON q.id = aa.question_id
    WHERE aa.attempt_id = ?
  `).all(attemptId);
  let total = 0, correct = 0, incorrect = 0, unanswered = 0;
  for (const a of answers) {
    if (a.selected_option_id === null) {
      unanswered++;
      a.marks_awarded = 0;
    } else if (a.is_correct) {
      correct++;
      a.marks_awarded = a.marks;
      total += a.marks;
    } else {
      incorrect++;
      a.marks_awarded = -a.negative_marks;
      total -= a.negative_marks;
    }
    db.prepare('UPDATE attempt_answers SET is_correct = ?, marks_awarded = ? WHERE id = ?')
      .run(a.is_correct ? 1 : 0, a.marks_awarded, a.id);
  }
  db.prepare(`
    INSERT INTO results (attempt_id, total_marks, correct_count, incorrect_count, unanswered_count, status)
    VALUES (?,?,?,?,?,'pending')
  `).run(attemptId, total, correct, incorrect, unanswered);
  return { total, correct, incorrect, unanswered };
}

// ---------- Auth ----------
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
  }
  if (!user.is_active) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Account disabled' } });
  db.prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?').run(user.id);
  audit(user.id, 'LOGIN_SUCCESS', 'user', user.id);
  res.json({ success: true, data: { token: signToken(user), user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } } });
});

app.get('/api/v1/auth/me', auth(), (req, res) => {
  res.json({ success: true, data: { id: req.user.id, email: req.user.email, full_name: req.user.full_name, role: req.user.role } });
});

// ---------- Question Sets (Teacher) ----------
app.post('/api/v1/question-sets', auth(['teacher', 'admin']), (req, res) => {
  const { title, description, syllabus = 'ce_2025', subject = 'full', total_marks = 200, duration_minutes = 180 } = req.body || {};
  if (!title) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'title is required' } });
  const info = db.prepare('INSERT INTO question_sets (title, description, syllabus, subject, total_marks, duration_minutes, created_by) VALUES (?,?,?,?,?,?,?)')
    .run(title, description, syllabus, subject, total_marks, duration_minutes, req.user.id);
  audit(req.user.id, 'SET_CREATED', 'question_set', info.lastInsertRowid);
  res.status(201).json({ success: true, data: { id: info.lastInsertRowid, title, status: 'draft' } });
});

app.get('/api/v1/question-sets', auth(['teacher', 'admin']), (req, res) => {
  const sets = db.prepare('SELECT * FROM question_sets WHERE created_by = ? ORDER BY created_at DESC').all(req.user.id);
  for (const s of sets) {
    s.question_count = db.prepare('SELECT COUNT(*) as c FROM questions WHERE question_set_id = ? AND is_active = 1').get(s.id).c;
  }
  res.json({ success: true, data: sets });
});

app.get('/api/v1/question-sets/:id', auth(['teacher', 'admin']), (req, res) => {
  const set = db.prepare('SELECT * FROM question_sets WHERE id = ?').get(req.params.id);
  if (!set) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Set not found' } });
  const questions = db.prepare('SELECT * FROM questions WHERE question_set_id = ? AND is_active = 1').all(set.id);
  for (const q of questions) {
    q.options = db.prepare('SELECT id, option_label, option_text, is_correct, sort_order FROM question_options WHERE question_id = ? ORDER BY sort_order').all(q.id);
  }
  set.questions = questions;
  set.composition = getSetComposition(set.id);
  res.json({ success: true, data: set });
});

app.post('/api/v1/question-sets/:id/questions', auth(['teacher', 'admin']), (req, res) => {
  const set = db.prepare('SELECT * FROM question_sets WHERE id = ?').get(req.params.id);
  if (!set) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Set not found' } });
  if (set.status === 'released') return res.status(409).json({ success: false, error: { code: 'SET_RELEASED', message: 'Cannot modify a released set' } });
  const { subject, topic, sub_topic, cognitive_level, marks = 1, negative_marks = 0.25, question_text, rationale, options } = req.body || {};
  if (!subject || !topic || !cognitive_level || !question_text || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required question fields' } });
  }
  const correctCount = options.filter(o => o.is_correct).length;
  if (correctCount !== 1) return res.status(422).json({ success: false, error: { code: 'SINGLE_ANSWER_VIOLATION', message: 'Exactly one correct option required' } });
  const qInfo = db.prepare('INSERT INTO questions (question_set_id, subject, topic, sub_topic, cognitive_level, marks, negative_marks, question_text, rationale) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(set.id, subject, topic, sub_topic, cognitive_level, marks, negative_marks, question_text, rationale);
  for (const o of options) {
    db.prepare('INSERT INTO question_options (question_id, option_label, option_text, is_correct, sort_order) VALUES (?,?,?,?,?)')
      .run(qInfo.lastInsertRowid, o.option_label, o.option_text, o.is_correct ? 1 : 0, o.sort_order || 0);
  }
  audit(req.user.id, 'QUESTION_ADDED', 'question', qInfo.lastInsertRowid);
  res.status(201).json({ success: true, data: { id: qInfo.lastInsertRowid } });
});

app.get('/api/v1/question-sets/:id/composition', auth(['teacher', 'admin']), (req, res) => {
  const result = validateComposition(req.params.id);
  res.json({ success: true, data: result });
});

// ---------- Set Release (Teacher) ----------
app.post('/api/v1/question-sets/:id/release', auth(['teacher', 'admin']), (req, res) => {
  const set = db.prepare('SELECT * FROM question_sets WHERE id = ?').get(req.params.id);
  if (!set) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Set not found' } });
  const validation = validateComposition(set.id);
  if (!validation.valid) return res.status(422).json({ success: false, error: { code: 'COMPOSITION_INVALID', message: validation.errors.join('; ') } });
  db.prepare('UPDATE question_sets SET status = \'released\', released_at = datetime(\'now\') WHERE id = ?').run(set.id);
  audit(req.user.id, 'SET_RELEASED', 'question_set', set.id);
  res.json({ success: true, data: { id: set.id, status: 'released' } });
});

app.post('/api/v1/question-sets/:id/unrelease', auth(['teacher', 'admin']), (req, res) => {
  db.prepare('UPDATE question_sets SET status = \'draft\', released_at = NULL WHERE id = ?').run(req.params.id);
  audit(req.user.id, 'SET_UNRELEASED', 'question_set', req.params.id);
  res.json({ success: true, data: { id: req.params.id, status: 'draft' } });
});

app.post('/api/v1/question-sets/:id/archive', auth(['teacher', 'admin']), (req, res) => {
  db.prepare('UPDATE question_sets SET status = \'archived\' WHERE id = ?').run(req.params.id);
  audit(req.user.id, 'SET_ARCHIVED', 'question_set', req.params.id);
  res.json({ success: true, data: { id: req.params.id, status: 'archived' } });
});

// ---------- Student Exam Access ----------
app.get('/api/v1/student/sets', auth(['student']), (req, res) => {
  const sets = db.prepare('SELECT * FROM question_sets WHERE status = \'released\' ORDER BY released_at DESC').all();
  const attempted = db.prepare('SELECT question_set_id FROM attempts WHERE student_id = ?').all(req.user.id);
  const attemptedIds = new Set(attempted.map(a => a.question_set_id));
  res.json({ success: true, data: sets.map(s => ({ ...s, attempted: attemptedIds.has(s.id) })) });
});

app.post('/api/v1/student/attempts', auth(['student']), (req, res) => {
  const { question_set_id } = req.body || {};
  const set = db.prepare('SELECT * FROM question_sets WHERE id = ?').get(question_set_id);
  if (!set || set.status !== 'released') return res.status(409).json({ success: false, error: { code: 'SET_NOT_RELEASED', message: 'Set not available' } });
  const existing = db.prepare('SELECT * FROM attempts WHERE student_id = ? AND question_set_id = ?').get(req.user.id, set.id);
  if (existing) return res.status(409).json({ success: false, error: { code: 'ALREADY_ATTEMPTED', message: 'You have already attempted this set' } });
  const info = db.prepare('INSERT INTO attempts (student_id, question_set_id, time_limit_seconds, ip_address, user_agent) VALUES (?,?,?,?,?)')
    .run(req.user.id, set.id, set.duration_minutes * 60, req.ip, req.headers['user-agent'] || null);
  audit(req.user.id, 'ATTEMPT_STARTED', 'attempt', info.lastInsertRowid);
  res.status(201).json({ success: true, data: { attempt_id: info.lastInsertRowid, started_at: new Date().toISOString(), time_limit_seconds: set.duration_minutes * 60 } });
});

app.get('/api/v1/student/attempts/:id/questions', auth(['student']), (req, res) => {
  const attempt = db.prepare('SELECT * FROM attempts WHERE id = ? AND student_id = ?').get(req.params.id, req.user.id);
  if (!attempt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attempt not found' } });
  if (attempt.status !== 'in_progress') return res.status(409).json({ success: false, error: { code: 'ATTEMPT_CLOSED', message: 'Attempt already submitted' } });
  const questions = db.prepare('SELECT * FROM questions WHERE question_set_id = ? AND is_active = 1').all(attempt.question_set_id);
  const data = questions.map(q => {
    const options = db.prepare('SELECT id, option_label, option_text FROM question_options WHERE question_id = ? ORDER BY sort_order').all(q.id);
    // Shuffle options deterministically per attempt
    const shuffled = options.map((o, i) => ({ ...o, seed: (i * 7 + attempt.id * 13) % options.length })).sort((a, b) => a.seed - b.seed);
    return { id: q.id, subject: q.subject, topic: q.topic, question_text: q.question_text, options: shuffled.map(({ id, option_label, option_text }) => ({ id, option_label, option_text })) };
  });
  res.json({ success: true, data });
});

app.put('/api/v1/student/attempts/:id/answers/:questionId', auth(['student']), (req, res) => {
  const { selected_option_id } = req.body || {};
  const attempt = db.prepare('SELECT * FROM attempts WHERE id = ? AND student_id = ?').get(req.params.id, req.user.id);
  if (!attempt || attempt.status !== 'in_progress') return res.status(409).json({ success: false, error: { code: 'ATTEMPT_CLOSED', message: 'Attempt not active' } });
  const opt = db.prepare('SELECT * FROM question_options WHERE id = ?').get(selected_option_id);
  if (!opt) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid option' } });
  const q = db.prepare('SELECT * FROM questions WHERE id = ? AND question_set_id = ?').get(req.params.questionId, attempt.question_set_id);
  if (!q) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Question not in this set' } });
  const isCorrect = opt.is_correct ? 1 : 0;
  db.prepare(`
    INSERT INTO attempt_answers (attempt_id, question_id, selected_option_id, is_correct, answered_at)
    VALUES (?,?,?,?, datetime('now'))
    ON CONFLICT(attempt_id, question_id) DO UPDATE SET selected_option_id = excluded.selected_option_id, is_correct = excluded.is_correct, answered_at = excluded.answered_at
  `).run(attempt.id, q.id, opt.id, isCorrect);
  res.json({ success: true, data: { question_id: q.id, saved: true } });
});

app.post('/api/v1/student/attempts/:id/submit', auth(['student']), (req, res) => {
  const attempt = db.prepare('SELECT * FROM attempts WHERE id = ? AND student_id = ?').get(req.params.id, req.user.id);
  if (!attempt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attempt not found' } });
  if (attempt.status !== 'in_progress') return res.status(409).json({ success: false, error: { code: 'ATTEMPT_CLOSED', message: 'Already submitted' } });
  db.prepare('UPDATE attempts SET status = \'submitted\', submitted_at = datetime(\'now\') WHERE id = ?').run(attempt.id);
  const result = scoreAttempt(attempt.id);
  audit(req.user.id, 'ATTEMPT_SUBMITTED', 'attempt', attempt.id);
  res.json({ success: true, data: { attempt_id: attempt.id, status: 'submitted', result_status: 'pending', message: 'Your exam has been submitted. Results will be available after teacher review.' } });
});

app.get('/api/v1/student/attempts', auth(['student']), (req, res) => {
  const attempts = db.prepare(`
    SELECT a.*, qs.title as set_title, qs.syllabus, r.status as result_status, r.total_marks
    FROM attempts a
    JOIN question_sets qs ON qs.id = a.question_set_id
    LEFT JOIN results r ON r.attempt_id = a.id
    WHERE a.student_id = ?
    ORDER BY a.started_at DESC
  `).all(req.user.id);
  res.json({ success: true, data: attempts });
});

// ---------- Result Moderation (Teacher) ----------
app.get('/api/v1/teacher/results', auth(['teacher', 'admin']), (req, res) => {
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
  const results = db.prepare(sql).all(...params);
  res.json({ success: true, data: results });
});

app.get('/api/v1/teacher/results/:id', auth(['teacher', 'admin']), (req, res) => {
  const result = db.prepare(`
    SELECT r.*, u.full_name as student_name, u.email as student_email, qs.title as set_title, qs.syllabus
    FROM results r
    JOIN attempts a ON a.id = r.attempt_id
    JOIN users u ON u.id = a.student_id
    JOIN question_sets qs ON qs.id = a.question_set_id
    WHERE r.id = ?
  `).get(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Result not found' } });
  const answers = db.prepare(`
    SELECT aa.*, q.question_text, q.rationale, q.subject, q.topic,
           opt.option_label as selected_label,
           (SELECT option_label FROM question_options WHERE question_id = q.id AND is_correct = 1) as correct_label
    FROM attempt_answers aa
    JOIN questions q ON q.id = aa.question_id
    LEFT JOIN question_options opt ON opt.id = aa.selected_option_id
    WHERE aa.attempt_id = ?
  `).all(result.attempt_id);
  result.answers = answers;
  res.json({ success: true, data: result });
});

app.patch('/api/v1/teacher/results/:id/release', auth(['teacher', 'admin']), (req, res) => {
  const { feedback_enabled = false } = req.body || {};
  const result = db.prepare('SELECT * FROM results WHERE id = ?').get(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Result not found' } });
  db.prepare('UPDATE results SET status = \'released\', feedback_enabled = ?, reviewed_by = ?, reviewed_at = datetime(\'now\'), released_at = datetime(\'now\') WHERE id = ?')
    .run(feedback_enabled ? 1 : 0, req.user.id, result.id);
  audit(req.user.id, 'RESULT_RELEASED', 'result', result.id, { feedback_enabled });
  res.json({ success: true, data: { result_id: result.id, status: 'released', feedback_enabled: !!feedback_enabled } });
});

app.patch('/api/v1/teacher/results/:id/hold', auth(['teacher', 'admin']), (req, res) => {
  db.prepare('UPDATE results SET reviewed_by = ?, reviewed_at = datetime(\'now\') WHERE id = ?').run(req.user.id, req.params.id);
  audit(req.user.id, 'RESULT_HELD', 'result', req.params.id);
  res.json({ success: true, data: { result_id: req.params.id, status: 'held' } });
});

// ---------- Student Result Viewing ----------
app.get('/api/v1/student/results', auth(['student']), (req, res) => {
  const results = db.prepare(`
    SELECT r.*, qs.title as set_title, qs.syllabus
    FROM results r
    JOIN attempts a ON a.id = r.attempt_id
    JOIN question_sets qs ON qs.id = a.question_set_id
    WHERE a.student_id = ? AND r.status = 'released'
    ORDER BY r.released_at DESC
  `).all(req.user.id);
  res.json({ success: true, data: results });
});

app.get('/api/v1/student/results/:id', auth(['student']), (req, res) => {
  const result = db.prepare(`
    SELECT r.*, qs.title as set_title, qs.syllabus
    FROM results r
    JOIN attempts a ON a.id = r.attempt_id
    JOIN question_sets qs ON qs.id = a.question_set_id
    WHERE r.id = ? AND a.student_id = ?
  `).get(req.params.id, req.user.id);
  if (!result) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Result not found' } });
  if (result.status !== 'released') return res.status(403).json({ success: false, error: { code: 'RESULT_PENDING', message: 'Result not yet released' } });
  const answers = db.prepare(`
    SELECT aa.*, q.question_text, q.rationale, q.subject, q.topic,
           opt.option_label as selected_label,
           (SELECT option_label FROM question_options WHERE question_id = q.id AND is_correct = 1) as correct_label
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
});

// ---------- Audit (Admin) ----------
app.get('/api/v1/audit-logs', auth(['admin']), (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200').all();
  res.json({ success: true, data: logs });
});

app.get('/api/v1/admin/stats', auth(['admin']), (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    students: db.prepare('SELECT COUNT(*) as c FROM users WHERE role = \'student\'').get().c,
    teachers: db.prepare('SELECT COUNT(*) as c FROM users WHERE role = \'teacher\'').get().c,
    sets: db.prepare('SELECT COUNT(*) as c FROM question_sets').get().c,
    released_sets: db.prepare('SELECT COUNT(*) as c FROM question_sets WHERE status = \'released\'').get().c,
    attempts: db.prepare('SELECT COUNT(*) as c FROM attempts').get().c,
    pending_results: db.prepare('SELECT COUNT(*) as c FROM results WHERE status = \'pending\'').get().c,
    released_results: db.prepare('SELECT COUNT(*) as c FROM results WHERE status = \'released\'').get().c
  };
  res.json({ success: true, data: stats });
});

// Health check endpoint (before SPA fallback)
app.get('/api/v1/health', (req, res) => {
  try {
    // Test database connection
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    res.json({ 
      success: true, 
      data: { 
        status: 'healthy', 
        database: 'connected',
        users: userCount,
        timestamp: new Date().toISOString()
      } 
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'HEALTH_CHECK_FAILED', message: 'Database connection failed' } });
  }
});

// SPA fallback (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CEE Nepal Exam Portal running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
});
