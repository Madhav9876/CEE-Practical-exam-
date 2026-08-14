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
  function getBankQuestions(bank, subject, chapter) {
    let filtered;
    if (subject === 'biology' && chapter === 'Plasmodium/Earthworm/Frog') {
      filtered = bank.filter(q => q.subTopic === 'Zoology' && ['Plasmodium', 'Earthworm', 'Frog'].includes(q.topic));
    } else if (subject === 'biology' && chapter === 'Cell Biology/Genetics') {
      filtered = bank.filter(q => q.subTopic === 'Botany' && ['Cell Biology', 'Genetics'].includes(q.topic));
    } else if (subject === 'biology' && chapter === 'Anatomy/Physiology') {
      filtered = bank.filter(q => q.subTopic === 'Botany' && q.topic === 'Plant Physiology');
    } else if (subject === 'biology' && chapter === 'Environmental/Behavior') {
      filtered = bank.filter(q => q.subTopic === 'Zoology' && q.topic === 'Environmental');
    } else if (subject === 'biology' && chapter === 'Human Biology/Diseases') {
      filtered = bank.filter(q => q.subTopic === 'Zoology' && q.topic === 'Human Biology');
    } else if (subject === 'physics' && chapter === 'Sound/Electrostatics') {
      filtered = bank.filter(q => ['Electrostatics', 'Sound'].includes(q.topic));
    } else if (subject === 'physics' && chapter === 'Modern/Nuclear Physics') {
      filtered = bank.filter(q => ['Modern Physics', 'Nuclear Physics'].includes(q.topic));
    } else if (subject === 'physics' && chapter === 'Optics') {
      filtered = bank.filter(q => ['Waves and Optics', 'Optics'].includes(q.topic));
    } else if (subject === 'chemistry' && chapter === 'General/Physical') {
      filtered = bank.filter(q => ['General Chemistry', 'Physical Chemistry'].includes(q.topic));
    } else if (subject === 'chemistry' && chapter === 'Inorganic') {
      filtered = bank.filter(q => q.topic === 'Inorganic Chemistry');
    } else if (subject === 'chemistry' && chapter === 'Organic') {
      filtered = bank.filter(q => q.topic === 'Organic Chemistry');
    } else if (subject === 'physics' && chapter === 'Heat/Thermodynamics') {
      filtered = bank.filter(q => q.topic === 'Heat and Thermodynamics');
    } else if (subject === 'physics' && chapter === 'Electricity/Magnetism') {
      filtered = bank.filter(q => q.topic === 'Electricity and Magnetism');
    } else if (subject === 'physics' && chapter === 'Particle Physics/Universe') {
      filtered = bank.filter(q => q.topic === 'Particle Physics');
    } else if (subject === 'mental_agility' && chapter === 'Verbal') {
      filtered = bank.filter(q => q.topic === 'Verbal Reasoning');
    } else if (subject === 'mental_agility' && chapter === 'Numerical') {
      filtered = bank.filter(q => q.topic === 'Numerical Reasoning');
    } else if (subject === 'mental_agility' && chapter === 'Logical') {
      filtered = bank.filter(q => q.topic === 'Logical Reasoning');
    } else if (subject === 'mental_agility' && chapter === 'Spatial') {
      filtered = bank.filter(q => q.topic === 'Spatial Reasoning');
    } else if (subject === 'biology') {
      const sub = chapter === 'Evolution' || chapter === 'Classification' || chapter === 'Plasmodium/Earthworm/Frog' || chapter === 'Human Biology/Diseases' || chapter === 'Animal Tissues' || chapter === 'Environmental/Behavior' ? 'Zoology' : 'Botany';
      filtered = bank.filter(q => q.subTopic === sub && q.topic === chapter);
    } else {
      filtered = bank.filter(q => q.topic === chapter);
    }
    return filtered;
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

  // Biology (Zoology + Botany)
  if (syl.biology) {
    for (const z of syl.biology.zoology) {
      const qs = pickQuestions(getBankQuestions(bank.biology, 'biology', z.chapter), z.marks, seed + z.marks);
      for (const q of qs) await addQuestionUnique('biology', q, z.chapter, 'Zoology');
    }
    for (const b of syl.biology.botany) {
      const qs = pickQuestions(getBankQuestions(bank.biology, 'biology', b.chapter), b.marks, seed + b.marks * 2);
      for (const q of qs) await addQuestionUnique('biology', q, b.chapter, 'Botany');
    }
  }

  // Chemistry
  if (syl.chemistry) {
    for (const c of syl.chemistry) {
      const qs = pickQuestions(getBankQuestions(bank.chemistry, 'chemistry', c.chapter), c.marks, seed + c.marks * 3);
      for (const q of qs) await addQuestionUnique('chemistry', q, c.chapter, q.subTopic);
    }
  }

  // Physics
  if (syl.physics) {
    for (const p of syl.physics) {
      const qs = pickQuestions(getBankQuestions(bank.physics, 'physics', p.chapter), p.marks, seed + p.marks * 4);
      for (const q of qs) await addQuestionUnique('physics', q, p.chapter, q.subTopic);
    }
  }

  // MAT
  if (syl.mat) {
    for (const m of syl.mat) {
      const qs = pickQuestions(getBankQuestions(bank.mental_agility, 'mental_agility', m.chapter), m.marks, seed + m.marks * 5);
      for (const q of qs) await addQuestionUnique('mental_agility', q, m.chapter, q.subTopic);
    }
  }

  // PCL / Health / Nursing
  if (syl.pcl) {
    const pclBank = [...bank.chemistry, ...bank.physics].filter(q => !usedTexts.has(q.text.trim().toLowerCase()));
    const qs = pickQuestions(pclBank, 20, seed + 999);
    for (const q of qs) await addQuestionUnique('pcl', q, 'PCL Level Contents', 'PCL');
  }
  if (syl.health) {
    const healthBank = [...bank.biology, ...bank.chemistry].filter(q => !usedTexts.has(q.text.trim().toLowerCase()));
    const qs = pickQuestions(healthBank, 20, seed + 888);
    for (const q of qs) await addQuestionUnique('health', q, 'Pre-requisite Health Knowledge', 'Health');
  }
  if (syl.nursing) {
    const nursingBank = [...bank.biology, ...bank.chemistry, ...bank.physics].filter(q => !usedTexts.has(q.text.trim().toLowerCase()));
    const qs = pickQuestions(nursingBank, 180, seed + 777);
    for (const q of qs) await addQuestionUnique('health', q, 'Nursing Core', 'Nursing');
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