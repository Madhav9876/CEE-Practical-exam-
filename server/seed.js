const bcrypt = require('bcryptjs');
const db = process.env.DATABASE_URL ? require('./db-postgres') : require('./db');
const { qBank } = require('./questionBank');

async function main() {
await db.init();

// Clear existing data (order respects foreign keys)
for (const table of ['audit_logs', 'results', 'attempt_answers', 'attempts', 'question_options', 'questions', 'question_sets', 'users']) {
  await db.exec(`DELETE FROM ${table};`);
}

// Reset identity sequences so ids start at 1 on both engines.
if (db.dialect === 'postgres') {
  for (const table of ['users', 'question_sets', 'questions', 'question_options', 'attempts', 'attempt_answers', 'results', 'audit_logs']) {
    await db.exec(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`);
  }
} else {
  await db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','question_sets','questions','question_options','attempts','attempt_answers','results','audit_logs');");
}

// ---------- Users ----------
const teacher = await db.prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?,?,?,?)')
  .run('teacher@cee.edu.np', bcrypt.hashSync('teacher123', 10), 'Prof. Hari Sharma', 'teacher');
const student = await db.prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?,?,?,?)')
  .run('student@cee.edu.np', bcrypt.hashSync('student123', 10), 'Kusum Lamichhane', 'student');
const admin = await db.prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?,?,?,?)')
  .run('admin@cee.edu.np', bcrypt.hashSync('admin123', 10), 'Admin User', 'admin');

console.log('Users created:');
console.log('  Teacher: teacher@cee.edu.np / teacher123');
console.log('  Student: Kusum Lamichhane (student@cee.edu.np / student123)');
console.log('  Admin:   admin@cee.edu.np / admin123');

// =====================================================================
// SYLLABUS DEFINITIONS — exact weightage from the MEC syllabus (2026)
// =====================================================================
// Group I:  MBBS, BDS, BSc Nursing/BSc Midwifery, BASLP & B Perfusion Technology
// Group II: BAMS, BSc MLT, BSc MIT/BSc Radiotherapy Technology, BPT, B Pharm & B Optometry
// Group III: BPH (Bachelor in Public Health)
// Group IV: BNS (Bachelor in Nursing Science)/BMS (Bachelor in Midwifery Science)
// =====================================================================

// Shared Zoology weightage (Groups I, II, III) — 40 questions
const ZOOLOGY_40 = [
  { chapter: 'Evolutionary Biology', marks: 3 },
  { chapter: 'Animal Diversity and Classification', marks: 4 },
  { chapter: 'Animal Tissues and Histology', marks: 4 },
  { chapter: 'Study of Selected Animals', marks: 6 },
  { chapter: 'Human Biology and Physiology', marks: 15 },
  { chapter: 'Microbial Diseases and Immunology', marks: 4 },
  { chapter: 'Medical Technology and Applied Biology', marks: 2 },
  { chapter: 'Biota, Environment and Conservation', marks: 2 }
];

// Shared Botany weightage (Groups I, II, III) — 40 questions
const BOTANY_40 = [
  { chapter: 'Basic Components of Life', marks: 2 },
  { chapter: 'Biodiversity', marks: 9 },
  { chapter: 'Ecology and Vegetation', marks: 4 },
  { chapter: 'Cell Biology', marks: 5 },
  { chapter: 'Genetics', marks: 6 },
  { chapter: 'Plant Anatomy', marks: 3 },
  { chapter: 'Plant Physiology', marks: 6 },
  { chapter: 'Developmental Botany', marks: 2 },
  { chapter: 'Applied Botany', marks: 3 }
];

// Shared MAT weightage — 20 questions
const MAT_20 = [
  { chapter: 'Verbal Reasoning', marks: 5 },
  { chapter: 'Numerical Reasoning', marks: 5 },
  { chapter: 'Logical Sequencing', marks: 5 },
  { chapter: 'Spatial Reasoning', marks: 5 }
];

const SYLLABI = {
  ce_2025: {
    label: 'Group I: MBBS, BDS, BSc Nursing/BSc Midwifery, BASLP & B Perfusion Technology',
    zoology: ZOOLOGY_40,
    botany: BOTANY_40,
    chemistry: [
      { chapter: 'Physical Chemistry', marks: 17 },
      { chapter: 'Inorganic Chemistry', marks: 10 },
      { chapter: 'Organic Chemistry', marks: 17 },
      { chapter: 'Applied Chemistry', marks: 3 },
      { chapter: 'Analytical Chemistry', marks: 3 }
    ],
    physics: [
      { chapter: 'Mechanics', marks: 10 },
      { chapter: 'Heat and Thermodynamics', marks: 7 },
      { chapter: 'Waves and Optics', marks: 8 },
      { chapter: 'Current Electricity and Magnetism', marks: 9 },
      { chapter: 'Electrostatics and Capacitors', marks: 4 },
      { chapter: 'Modern Physics', marks: 12 }
    ],
    mat: MAT_20
  },
  ce_2026: {
    label: 'Group II: BAMS, BSc MLT, BSc MIT/BSc Radiotherapy Technology, BPT, B Pharm & B Optometry',
    zoology: ZOOLOGY_40,
    botany: BOTANY_40,
    chemistry: [
      { chapter: 'Physical Chemistry', marks: 14 },
      { chapter: 'Inorganic Chemistry', marks: 7 },
      { chapter: 'Organic Chemistry', marks: 13 },
      { chapter: 'Applied Chemistry', marks: 3 },
      { chapter: 'Analytical Chemistry', marks: 3 }
    ],
    physics: [
      { chapter: 'Mechanics', marks: 8 },
      { chapter: 'Heat and Thermodynamics', marks: 6 },
      { chapter: 'Waves and Optics', marks: 6 },
      { chapter: 'Current Electricity and Magnetism', marks: 7 },
      { chapter: 'Electrostatics and Capacitors', marks: 3 },
      { chapter: 'Modern Physics', marks: 10 }
    ],
    mat: MAT_20,
    pcl: [{ chapter: 'PCL Level Contents', marks: 20 }]
  },
  bph: {
    label: 'Group III: BPH (Bachelor in Public Health)',
    zoology: ZOOLOGY_40,
    botany: BOTANY_40,
    chemistry: [
      { chapter: 'Physical Chemistry', marks: 14 },
      { chapter: 'Inorganic Chemistry', marks: 7 },
      { chapter: 'Organic Chemistry', marks: 13 },
      { chapter: 'Applied Chemistry', marks: 3 },
      { chapter: 'Analytical Chemistry', marks: 3 }
    ],
    physics: [
      { chapter: 'Mechanics', marks: 8 },
      { chapter: 'Heat and Thermodynamics', marks: 6 },
      { chapter: 'Waves and Optics', marks: 6 },
      { chapter: 'Current Electricity and Magnetism', marks: 7 },
      { chapter: 'Electrostatics and Capacitors', marks: 3 },
      { chapter: 'Modern Physics', marks: 10 }
    ],
    mat: MAT_20,
    health: [
      { chapter: 'Determinants of Health', marks: 5 },
      { chapter: 'Communicable Diseases', marks: 5 },
      { chapter: 'Non-communicable Diseases', marks: 3 },
      { chapter: 'WASH', marks: 2 },
      { chapter: 'Biostatistics and Epidemiology', marks: 5 }
    ]
  },
  bns: {
    label: 'Group IV: BNS (Bachelor in Nursing Science)/BMS (Bachelor in Midwifery Science)',
    nursing: [
      { chapter: 'Community Health Nursing', marks: 25 },
      { chapter: 'Adult Health Nursing', marks: 25 },
      { chapter: 'Child Health Nursing', marks: 25 },
      { chapter: 'Midwifery and Gynecological Nursing', marks: 25 },
      { chapter: 'Fundamentals of Nursing', marks: 20 },
      { chapter: 'Leadership and Management', marks: 20 },
      { chapter: 'Behavioral Science and Mental Health', marks: 10 }
    ],
    healthScience: [
      { chapter: 'Biochemistry', marks: 5 },
      { chapter: 'Microbiology', marks: 5 },
      { chapter: 'Pharmacology', marks: 6 },
      { chapter: 'Anatomy', marks: 7 },
      { chapter: 'Physiology', marks: 7 }
    ],
    mat: MAT_20
  }
};

// ---------- Question Bank Access ----------
const bank = {
  zoology: qBank.zoology,
  botany: qBank.botany,
  chemistry: qBank.chemistry,
  physics: qBank.physics,
  mental_agility: qBank.mentalAgility,
  health: qBank.health,
  nursing: qBank.nursing
};

// Simple deterministic pseudo-random for stable seeds
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Pick N questions from a bank without replacement (shuffle then slice)
function pickQuestions(bankArr, count, seed) {
  const rnd = seededRandom(seed);
  const shuffled = bankArr.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const result = [];
  const take = Math.min(count, shuffled.length);
  for (let i = 0; i < take; i++) result.push(shuffled[i]);
  for (let i = take; i < count; i++) {
    const idx = Math.floor(rnd() * shuffled.length);
    result.push(shuffled[idx]);
  }
  return result;
}

// Map syllabus chapters to bank topic filters
function getBankQuestions(bankArr, chapter) {
  return bankArr.filter(q => q.topic === chapter);
}

// ---------- Insert helpers ----------
const insertSet = db.prepare(`
  INSERT INTO question_sets (title, description, syllabus, subject, total_marks, duration_minutes, status, created_by)
  VALUES (?,?,?,?,?,?,?,?)
`);
const insertQuestion = db.prepare(`
  INSERT INTO questions (question_set_id, subject, topic, sub_topic, cognitive_level, marks, negative_marks, question_text, rationale)
  VALUES (?,?,?,?,?,?,?,?,?)
`);
const insertOption = db.prepare(`
  INSERT INTO question_options (question_id, option_label, option_text, is_correct, sort_order)
  VALUES (?,?,?,?,?)
`);

const labels = ['A', 'B', 'C', 'D'];

/** Postgres BOOLEAN columns need real booleans; SQLite uses 0/1. */
const toBool = (v) => (db.dialect === 'postgres' ? !!v : (v ? 1 : 0));

// Cognitive distribution per set: 100 recall, 60 understanding, 40 application
const COGNITIVE_PATTERN = [];
for (let i = 0; i < 100; i++) COGNITIVE_PATTERN.push('recall');
for (let i = 0; i < 60; i++) COGNITIVE_PATTERN.push('understanding');
for (let i = 0; i < 40; i++) COGNITIVE_PATTERN.push('application');

let cognitiveCounter = 0;

async function addQuestion(setId, subject, q, topic, subTopic) {
  const level = COGNITIVE_PATTERN[cognitiveCounter % COGNITIVE_PATTERN.length];
  cognitiveCounter++;
  const info = await insertQuestion.run(setId, subject, topic, subTopic, level, 1.00, 0.25, q.text, q.rationale);
  for (let oi = 0; oi < q.options.length; oi++) {
    await insertOption.run(info.lastInsertRowid, labels[oi], q.options[oi], toBool(oi === q.correct), oi + 1);
  }
}

// ---------- Build a full 200-mark set for a syllabus ----------
async function buildFullSet(syllabusKey, setNumber) {
  const syl = SYLLABI[syllabusKey];
  const seed = setNumber * 100 + syllabusKey.length;
  const title = `${syl.label} — Mock Set ${String(setNumber).padStart(2, '0')}`;
  const setInfo = await insertSet.run(title, `Full 200-mark mock exam aligned to ${syl.label}.`, syllabusKey, 'full', 200, 180, 'draft', teacher.lastInsertRowid);
  const setId = setInfo.lastInsertRowid;

  const usedTexts = new Set();

  async function addQuestionUnique(subject, q, topic, subTopic) {
    const key = q.text.trim().toLowerCase();
    if (usedTexts.has(key)) return;
    usedTexts.add(key);
    const level = COGNITIVE_PATTERN[cognitiveCounter % COGNITIVE_PATTERN.length];
    cognitiveCounter++;
    const info = await insertQuestion.run(setId, subject, topic, subTopic, level, 1.00, 0.25, q.text, q.rationale);
    for (let oi = 0; oi < q.options.length; oi++) {
      await insertOption.run(info.lastInsertRowid, labels[oi], q.options[oi], toBool(oi === q.correct), oi + 1);
    }
  }

  // Zoology
  if (syl.zoology) {
    for (const z of syl.zoology) {
      const qs = pickQuestions(getBankQuestions(bank.zoology, z.chapter), z.marks, seed + z.marks);
      for (const q of qs) await addQuestionUnique('biology', q, z.chapter, 'Zoology');
    }
  }

  // Botany
  if (syl.botany) {
    for (const b of syl.botany) {
      const qs = pickQuestions(getBankQuestions(bank.botany, b.chapter), b.marks, seed + b.marks * 2);
      for (const q of qs) await addQuestionUnique('biology', q, b.chapter, 'Botany');
    }
  }

  // Chemistry
  if (syl.chemistry) {
    for (const c of syl.chemistry) {
      const qs = pickQuestions(getBankQuestions(bank.chemistry, c.chapter), c.marks, seed + c.marks * 3);
      for (const q of qs) await addQuestionUnique('chemistry', q, c.chapter, q.subTopic);
    }
  }

  // Physics
  if (syl.physics) {
    for (const p of syl.physics) {
      const qs = pickQuestions(getBankQuestions(bank.physics, p.chapter), p.marks, seed + p.marks * 4);
      for (const q of qs) await addQuestionUnique('physics', q, p.chapter, q.subTopic);
    }
  }

  // MAT
  if (syl.mat) {
    for (const m of syl.mat) {
      const qs = pickQuestions(getBankQuestions(bank.mental_agility, m.chapter), m.marks, seed + m.marks * 5);
      for (const q of qs) await addQuestionUnique('mental_agility', q, m.chapter, q.subTopic);
    }
  }

  // PCL (Group II)
  if (syl.pcl) {
    const pclBank = [...bank.chemistry, ...bank.physics].filter(q => !usedTexts.has(q.text.trim().toLowerCase()));
    const qs = pickQuestions(pclBank, 20, seed + 999);
    for (const q of qs) await addQuestionUnique('pcl', q, 'PCL Level Contents', 'PCL');
  }

  // Health (Group III - BPH)
  if (syl.health) {
    for (const h of syl.health) {
      const qs = pickQuestions(getBankQuestions(bank.health, h.chapter), h.marks, seed + h.marks * 6);
      for (const q of qs) await addQuestionUnique('health', q, h.chapter, 'Health');
    }
  }

  // Nursing Core (Group IV - BNS/BMS)
  if (syl.nursing) {
    for (const n of syl.nursing) {
      const qs = pickQuestions(getBankQuestions(bank.nursing, n.chapter), n.marks, seed + n.marks * 7);
      for (const q of qs) await addQuestionUnique('health', q, n.chapter, 'Nursing');
    }
  }

  // Basic & Integrated Health Science (Group IV - BNS/BMS)
  if (syl.healthScience) {
    for (const hs of syl.healthScience) {
      const qs = pickQuestions(getBankQuestions(bank.nursing, hs.chapter), hs.marks, seed + hs.marks * 8);
      for (const q of qs) await addQuestionUnique('health', q, hs.chapter, 'Nursing');
    }
  }

  return setId;
}

// ---------- Generate 45+ sets ----------
// 12 full sets per syllabus × 4 syllabi = 48 sets (all unreleased/draft)
let setCount = 0;
const createdSets = [];

for (const sylKey of ['ce_2025', 'ce_2026', 'bph', 'bns']) {
  for (let i = 1; i <= 12; i++) {
    const id = await buildFullSet(sylKey, i);
    createdSets.push({ id, syllabus: sylKey, number: i });
    setCount++;
  }
}

// ---------- Verify composition of one set per syllabus ----------
console.log('\n=== Generated Question Sets ===');
console.log(`Total sets created: ${setCount} (all in DRAFT/unreleased state)`);

const summaryBySyllabus = {};
for (const s of createdSets) {
  if (!summaryBySyllabus[s.syllabus]) summaryBySyllabus[s.syllabus] = 0;
  summaryBySyllabus[s.syllabus]++;
}
for (const [k, v] of Object.entries(summaryBySyllabus)) {
  console.log(`  ${SYLLABI[k].label}: ${v} sets`);
}

// Verify one set per syllabus has correct total marks
console.log('\n=== Composition Verification (first set of each syllabus) ===');
for (const sylKey of ['ce_2025', 'ce_2026', 'bph', 'bns']) {
  const first = createdSets.find(s => s.syllabus === sylKey);
  const comp = await db.prepare(`
    SELECT subject, SUM(marks) as marks, COUNT(*) as count
    FROM questions WHERE question_set_id = ? AND is_active = ${db.dialect === 'postgres' ? 'TRUE' : '1'}
    GROUP BY subject
  `).all(first.id);
  const total = comp.reduce((acc, r) => acc + Number(r.marks), 0);
  const count = comp.reduce((acc, r) => acc + Number(r.count), 0);
  console.log(`  ${SYLLABI[sylKey].label}:`);
  for (const c of comp) console.log(`    ${c.subject}: ${Number(c.marks)} marks (${Number(c.count)} Q)`);
  console.log(`    TOTAL: ${total} marks, ${count} questions`);
}

console.log('\nSeed complete. Run `npm start` to launch the portal.');
console.log('All 48 question sets are in DRAFT state — teachers can release them selectively.');
}

main()
  .then(async () => { await db.close(); process.exit(0); })
  .catch(async (e) => {
    console.error('\nSeed failed:', e.message);
    try { await db.close(); } catch {}
    process.exit(1);
  });