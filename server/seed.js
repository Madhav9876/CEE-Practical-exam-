const bcrypt = require('bcryptjs');
const db = require('./db');
const { qBank } = require('./questionBank');

// Clear existing data
db.exec(`
  DELETE FROM audit_logs;
  DELETE FROM results;
  DELETE FROM attempt_answers;
  DELETE FROM attempts;
  DELETE FROM question_options;
  DELETE FROM questions;
  DELETE FROM question_sets;
  DELETE FROM users;
`);

// ---------- Users ----------
const teacher = db.prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?,?,?,?)')
  .run('teacher@cee.edu.np', bcrypt.hashSync('teacher123', 10), 'Prof. Hari Sharma', 'teacher');
const student = db.prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?,?,?,?)')
  .run('student@cee.edu.np', bcrypt.hashSync('student123', 10), 'Kusum Lamichhane', 'student');
const admin = db.prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?,?,?,?)')
  .run('admin@cee.edu.np', bcrypt.hashSync('admin123', 10), 'Admin User', 'admin');

console.log('Users created:');
console.log('  Teacher: teacher@cee.edu.np / teacher123');
console.log('  Student: Kusum Lamichhane (student@cee.edu.np / student123)');
console.log('  Admin:   admin@cee.edu.np / admin123');

// ---------- Syllabus Definitions ----------
const SYLLABI = {
  ce_2025: {
    label: 'CEE MBBS/BDS/BSc Nursing/BASLP/B Perfusion Tech (2025)',
    biology: {
      zoology: [
        { chapter: 'Evolution', marks: 4 },
        { chapter: 'Classification', marks: 8 },
        { chapter: 'Plasmodium/Earthworm/Frog', marks: 8 },
        { chapter: 'Human Biology/Diseases', marks: 14 },
        { chapter: 'Animal Tissues', marks: 4 },
        { chapter: 'Environmental/Behavior', marks: 2 }
      ],
      botany: [
        { chapter: 'Biodiversity', marks: 11 },
        { chapter: 'Ecology', marks: 5 },
        { chapter: 'Cell Biology/Genetics', marks: 12 },
        { chapter: 'Anatomy/Physiology', marks: 7 },
        { chapter: 'Applied Botany', marks: 5 }
      ]
    },
    chemistry: [
      { chapter: 'General/Physical', marks: 18 },
      { chapter: 'Inorganic', marks: 14 },
      { chapter: 'Organic', marks: 18 }
    ],
    physics: [
      { chapter: 'Mechanics', marks: 10 },
      { chapter: 'Heat/Thermodynamics', marks: 6 },
      { chapter: 'Optics', marks: 6 },
      { chapter: 'Electricity/Magnetism', marks: 9 },
      { chapter: 'Sound/Electrostatics', marks: 6 },
      { chapter: 'Modern/Nuclear Physics', marks: 6 },
      { chapter: 'Semiconductors', marks: 4 },
      { chapter: 'Particle Physics/Universe', marks: 3 }
    ],
    mat: [
      { chapter: 'Verbal', marks: 5 },
      { chapter: 'Numerical', marks: 5 },
      { chapter: 'Logical', marks: 5 },
      { chapter: 'Spatial', marks: 5 }
    ]
  },
  ce_2026: {
    label: 'CEE BAMS/BSc MLT/BSc MIT/BPT/BPharm/B Optometry (2026)',
    biology: {
      zoology: [
        { chapter: 'Evolution', marks: 4 },
        { chapter: 'Classification', marks: 8 },
        { chapter: 'Plasmodium/Earthworm/Frog', marks: 8 },
        { chapter: 'Human Biology/Diseases', marks: 14 },
        { chapter: 'Animal Tissues', marks: 4 },
        { chapter: 'Environmental/Behavior', marks: 2 }
      ],
      botany: [
        { chapter: 'Biodiversity', marks: 11 },
        { chapter: 'Ecology', marks: 5 },
        { chapter: 'Cell Biology/Genetics', marks: 12 },
        { chapter: 'Anatomy/Physiology', marks: 7 },
        { chapter: 'Applied Botany', marks: 5 }
      ]
    },
    chemistry: [
      { chapter: 'General/Physical', marks: 14 },
      { chapter: 'Inorganic', marks: 12 },
      { chapter: 'Organic', marks: 14 }
    ],
    physics: [
      { chapter: 'Mechanics', marks: 8 },
      { chapter: 'Heat/Thermodynamics', marks: 5 },
      { chapter: 'Optics', marks: 5 },
      { chapter: 'Electricity/Magnetism', marks: 7 },
      { chapter: 'Sound/Electrostatics', marks: 5 },
      { chapter: 'Modern/Nuclear Physics', marks: 5 },
      { chapter: 'Semiconductors', marks: 3 },
      { chapter: 'Particle Physics/Universe', marks: 2 }
    ],
    mat: [
      { chapter: 'Verbal', marks: 5 },
      { chapter: 'Numerical', marks: 5 },
      { chapter: 'Logical', marks: 5 },
      { chapter: 'Spatial', marks: 5 }
    ],
    pcl: [{ chapter: 'PCL Level Contents', marks: 20 }]
  },
  bph: {
    label: 'Common Entrance Exam BPH',
    biology: {
      zoology: [
        { chapter: 'Evolution', marks: 4 },
        { chapter: 'Classification', marks: 8 },
        { chapter: 'Plasmodium/Earthworm/Frog', marks: 8 },
        { chapter: 'Human Biology/Diseases', marks: 14 },
        { chapter: 'Animal Tissues', marks: 4 },
        { chapter: 'Environmental/Behavior', marks: 2 }
      ],
      botany: [
        { chapter: 'Biodiversity', marks: 11 },
        { chapter: 'Ecology', marks: 5 },
        { chapter: 'Cell Biology/Genetics', marks: 12 },
        { chapter: 'Anatomy/Physiology', marks: 7 },
        { chapter: 'Applied Botany', marks: 5 }
      ]
    },
    chemistry: [
      { chapter: 'General/Physical', marks: 14 },
      { chapter: 'Inorganic', marks: 12 },
      { chapter: 'Organic', marks: 14 }
    ],
    physics: [
      { chapter: 'Mechanics', marks: 8 },
      { chapter: 'Heat/Thermodynamics', marks: 5 },
      { chapter: 'Optics', marks: 5 },
      { chapter: 'Electricity/Magnetism', marks: 7 },
      { chapter: 'Sound/Electrostatics', marks: 5 },
      { chapter: 'Modern/Nuclear Physics', marks: 5 },
      { chapter: 'Semiconductors', marks: 3 },
      { chapter: 'Particle Physics/Universe', marks: 2 }
    ],
    mat: [
      { chapter: 'Verbal', marks: 5 },
      { chapter: 'Numerical', marks: 5 },
      { chapter: 'Logical', marks: 5 },
      { chapter: 'Spatial', marks: 5 }
    ],
    health: [{ chapter: 'Pre-requisite Health Knowledge', marks: 20 }]
  },
  bns: {
    label: 'Bachelor in Nursing Science (BNS)',
    nursing: [
      { chapter: 'Community Health', marks: 30 },
      { chapter: 'Adult Health', marks: 30 },
      { chapter: 'Child Health', marks: 30 },
      { chapter: 'Behavior Science/Mental Health', marks: 42 },
      { chapter: 'Fundamentals', marks: 24 },
      { chapter: 'Leadership/Management', marks: 24 }
    ],
    mat: [
      { chapter: 'Verbal', marks: 5 },
      { chapter: 'Numerical', marks: 5 },
      { chapter: 'Logical', marks: 5 },
      { chapter: 'Spatial', marks: 5 }
    ]
  }
};

// ---------- Question Bank Access ----------
const bank = {
  biology: qBank.biology,
  chemistry: qBank.chemistry,
  physics: qBank.physics,
  mental_agility: qBank.mentalAgility
};

// Simple deterministic pseudo-random for stable seeds
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Pick N questions from a bank
function pickQuestions(bankArr, count, seed) {
  const rnd = seededRandom(seed);
  const result = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rnd() * bankArr.length);
    result.push(bankArr[idx]);
  }
  return result;
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

// Cognitive distribution per set: 100 recall, 60 understanding, 40 application
const COGNITIVE_PATTERN = [];
for (let i = 0; i < 100; i++) COGNITIVE_PATTERN.push('recall');
for (let i = 0; i < 60; i++) COGNITIVE_PATTERN.push('understanding');
for (let i = 0; i < 40; i++) COGNITIVE_PATTERN.push('application');

let cognitiveCounter = 0;

function addQuestion(setId, subject, q, topic, subTopic) {
  const level = COGNITIVE_PATTERN[cognitiveCounter % COGNITIVE_PATTERN.length];
  cognitiveCounter++;
  const info = insertQuestion.run(setId, subject, topic, subTopic, level, 1.00, 0.25, q.text, q.rationale);
  q.options.forEach((opt, oi) => {
    insertOption.run(info.lastInsertRowid, labels[oi], opt, oi === q.correct ? 1 : 0, oi + 1);
  });
}

// ---------- Build a full 200-mark set for a syllabus ----------
function buildFullSet(syllabusKey, setNumber) {
  const syl = SYLLABI[syllabusKey];
  const seed = setNumber * 100 + syllabusKey.length;
  const title = `${syl.label} — Mock Set ${String(setNumber).padStart(2, '0')}`;
  const setInfo = insertSet.run(title, `Full 200-mark mock exam aligned to ${syl.label}.`, syllabusKey, 'full', 200, 180, 'draft', teacher.lastInsertRowid);
  const setId = setInfo.lastInsertRowid;

  // Biology (Zoology + Botany)
  if (syl.biology) {
    for (const z of syl.biology.zoology) {
      const qs = pickQuestions(bank.biology.filter(q => q.subTopic === 'Zoology'), z.marks, seed + z.marks);
      qs.forEach(q => addQuestion(setId, 'biology', q, z.chapter, 'Zoology'));
    }
    for (const b of syl.biology.botany) {
      const qs = pickQuestions(bank.biology.filter(q => q.subTopic === 'Botany'), b.marks, seed + b.marks * 2);
      qs.forEach(q => addQuestion(setId, 'biology', q, b.chapter, 'Botany'));
    }
  }

  // Chemistry
  if (syl.chemistry) {
    for (const c of syl.chemistry) {
      const qs = pickQuestions(bank.chemistry, c.marks, seed + c.marks * 3);
      qs.forEach(q => addQuestion(setId, 'chemistry', q, c.chapter, q.subTopic));
    }
  }

  // Physics
  if (syl.physics) {
    for (const p of syl.physics) {
      const qs = pickQuestions(bank.physics, p.marks, seed + p.marks * 4);
      qs.forEach(q => addQuestion(setId, 'physics', q, p.chapter, q.subTopic));
    }
  }

  // MAT
  if (syl.mat) {
    for (const m of syl.mat) {
      const qs = pickQuestions(bank.mental_agility, m.marks, seed + m.marks * 5);
      qs.forEach(q => addQuestion(setId, 'mental_agility', q, m.chapter, q.subTopic));
    }
  }

  // PCL / Health / Nursing
  if (syl.pcl) {
    const qs = pickQuestions([...bank.chemistry, ...bank.physics], 20, seed + 999);
    qs.forEach(q => addQuestion(setId, 'pcl', q, 'PCL Level Contents', 'PCL'));
  }
  if (syl.health) {
    const qs = pickQuestions([...bank.biology, ...bank.chemistry], 20, seed + 888);
    qs.forEach(q => addQuestion(setId, 'health', q, 'Pre-requisite Health Knowledge', 'Health'));
  }
  if (syl.nursing) {
    const qs = pickQuestions([...bank.biology, ...bank.chemistry, ...bank.physics], 180, seed + 777);
    qs.forEach(q => addQuestion(setId, 'health', q, 'Nursing Core', 'Nursing'));
  }

  return setId;
}

// ---------- Generate 45+ sets ----------
// 12 full sets per syllabus × 4 syllabi = 48 sets (all unreleased/draft)
let setCount = 0;
const createdSets = [];

for (const sylKey of ['ce_2025', 'ce_2026', 'bph', 'bns']) {
  for (let i = 1; i <= 12; i++) {
    const id = buildFullSet(sylKey, i);
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
  const comp = db.prepare(`
    SELECT subject, SUM(marks) as marks, COUNT(*) as count
    FROM questions WHERE question_set_id = ? AND is_active = 1
    GROUP BY subject
  `).all(first.id);
  const total = comp.reduce((acc, r) => acc + r.marks, 0);
  const count = comp.reduce((acc, r) => acc + r.count, 0);
  console.log(`  ${SYLLABI[sylKey].label}:`);
  for (const c of comp) console.log(`    ${c.subject}: ${c.marks} marks (${c.count} Q)`);
  console.log(`    TOTAL: ${total} marks, ${count} questions`);
}

console.log('\nSeed complete. Run `npm start` to launch the portal.');
console.log('All 48 question sets are in DRAFT state — teachers can release them selectively.');