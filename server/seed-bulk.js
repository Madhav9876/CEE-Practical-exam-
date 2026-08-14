const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { qBank } = require('./questionBank');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 5 });

// ---------- Syllabus Definitions (mirrors seed.js) ----------
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

const bank = {
  zoology: qBank.zoology,
  botany: qBank.botany,
  chemistry: qBank.chemistry,
  physics: qBank.physics,
  mental_agility: qBank.mentalAgility,
  health: qBank.health,
  nursing: qBank.nursing
};

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
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

// Cognitive distribution per set: 100 recall, 60 understanding, 40 application
const COGNITIVE_PATTERN = [];
for (let i = 0; i < 100; i++) COGNITIVE_PATTERN.push('recall');
for (let i = 0; i < 60; i++) COGNITIVE_PATTERN.push('understanding');
for (let i = 0; i < 40; i++) COGNITIVE_PATTERN.push('application');

const LABELS = ['A', 'B', 'C', 'D'];

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear existing data
    for (const table of ['audit_logs', 'results', 'attempt_answers', 'attempts', 'question_options', 'questions', 'question_sets', 'users']) {
      await client.query(`DELETE FROM ${table};`);
    }

    // Users
    const users = [
      ['teacher@cee.edu.np', 'teacher123', 'Prof. Hari Sharma', 'teacher'],
      ['student@cee.edu.np', 'student123', 'Kusum Lamichhane', 'student'],
      ['admin@cee.edu.np', 'admin123', 'Admin User', 'admin']
    ].map(([email, pass, name, role]) => [email, bcrypt.hashSync(pass, 10), name, role]);
    const teacherRes = await client.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1,$2,$3,$4) RETURNING id',
      users[0]
    );
    await client.query('INSERT INTO users (email, password_hash, full_name, role) VALUES ($1,$2,$3,$4)', users[1]);
    await client.query('INSERT INTO users (email, password_hash, full_name, role) VALUES ($1,$2,$3,$4)', users[2]);
    const teacherId = teacherRes.rows[0].id;

    let cognitiveCounter = 0;
    const createdSets = [];

    for (const sylKey of ['ce_2025', 'ce_2026', 'bph', 'bns']) {
      for (let setNumber = 1; setNumber <= 12; setNumber++) {
        const syl = SYLLABI[sylKey];
        const seed = setNumber * 100 + sylKey.length;
        const title = `${syl.label} — Mock Set ${String(setNumber).padStart(2, '0')}`;
        const setRes = await client.query(
          'INSERT INTO question_sets (title, description, syllabus, subject, total_marks, duration_minutes, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
          [title, `Full 200-mark mock exam aligned to ${syl.label}.`, sylKey, 'full', 200, 180, 'draft', teacherId]
        );
        const setId = setRes.rows[0].id;
        cognitiveCounter = 0;

        const questionsToInsert = [];
        const optionsToInsert = [];
        const usedTexts = new Set();

        const addQuestions = (subject, qs, topic, subTopic) => {
          for (const q of qs) {
            const key = q.text.trim().toLowerCase();
            if (usedTexts.has(key)) continue;
            usedTexts.add(key);
            const level = COGNITIVE_PATTERN[cognitiveCounter % COGNITIVE_PATTERN.length];
            cognitiveCounter++;
            questionsToInsert.push([setId, subject, topic, subTopic, level, 1.00, 0.25, q.text, q.rationale]);
            for (let oi = 0; oi < q.options.length; oi++) {
              optionsToInsert.push([q.options[oi], oi === q.correct, oi + 1]); // question_id filled after
            }
          }
        };

        if (syl.biology) {
          for (const z of syl.biology.zoology) {
            addQuestions('biology', pickQuestions(getBankQuestions(bank.biology, 'biology', z.chapter), z.marks, seed + z.marks), z.chapter, 'Zoology');
          }
          for (const b of syl.biology.botany) {
            addQuestions('biology', pickQuestions(getBankQuestions(bank.biology, 'biology', b.chapter), b.marks, seed + b.marks * 2), b.chapter, 'Botany');
          }
        }
        if (syl.chemistry) {
          for (const c of syl.chemistry) {
            addQuestions('chemistry', pickQuestions(getBankQuestions(bank.chemistry, 'chemistry', c.chapter), c.marks, seed + c.marks * 3), c.chapter, '');
          }
        }
        if (syl.physics) {
          for (const p of syl.physics) {
            addQuestions('physics', pickQuestions(getBankQuestions(bank.physics, 'physics', p.chapter), p.marks, seed + p.marks * 4), p.chapter, '');
          }
        }
        if (syl.mat) {
          for (const m of syl.mat) {
            addQuestions('mental_agility', pickQuestions(getBankQuestions(bank.mental_agility, 'mental_agility', m.chapter), m.marks, seed + m.marks * 5), m.chapter, '');
          }
        }
        if (syl.pcl) {
          const pclBank = [...bank.chemistry, ...bank.physics].filter(q => !usedTexts.has(q.text.trim().toLowerCase()));
          const qs = pickQuestions(pclBank, 20, seed + 999);
          addQuestions('pcl', qs, 'PCL Level Contents', 'PCL');
        }
        if (syl.health) {
          const healthBank = [...bank.biology, ...bank.chemistry].filter(q => !usedTexts.has(q.text.trim().toLowerCase()));
          const qs = pickQuestions(healthBank, 20, seed + 888);
          addQuestions('health', qs, 'Pre-requisite Health Knowledge', 'Health');
        }
        if (syl.nursing) {
          const nursingBank = [...bank.biology, ...bank.chemistry, ...bank.physics].filter(q => !usedTexts.has(q.text.trim().toLowerCase()));
          const qs = pickQuestions(nursingBank, 180, seed + 777);
          addQuestions('health', qs, 'Nursing Core', 'Nursing');
        }

        // Bulk insert questions, capture returned IDs in order
        const qCols = 'question_set_id, subject, topic, sub_topic, cognitive_level, marks, negative_marks, question_text, rationale';
        const qPlaceholders = questionsToInsert.map((_, i) => {
          const base = i * 9;
          return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9})`;
        }).join(',');
        const qFlat = questionsToInsert.flat();
        const qRes = await client.query(
          `INSERT INTO questions (${qCols}) VALUES ${qPlaceholders} RETURNING id`,
          qFlat
        );
        const questionIds = qRes.rows.map(r => r.id);

        // Attach question_id to each option group (4 options per question, in order)
        const optRows = [];
        let qIdx = 0;
        for (let oi = 0; oi < optionsToInsert.length; oi++) {
          const [text, isCorrect, sort] = optionsToInsert[oi];
          optRows.push([questionIds[qIdx], LABELS[(oi % 4)], text, isCorrect, sort]);
          if ((oi + 1) % 4 === 0) qIdx++;
        }
        if (optRows.length) {
          const oCols = 'question_id, option_label, option_text, is_correct, sort_order';
          const oPlaceholders = optRows.map((_, i) => `($${i * 5 + 1},$${i * 5 + 2},$${i * 5 + 3},$${i * 5 + 4},$${i * 5 + 5})`).join(',');
          const oFlat = optRows.flat();
          await client.query(`INSERT INTO question_options (${oCols}) VALUES ${oPlaceholders}`, oFlat);
        }

        createdSets.push({ id: setId, syllabus: sylKey, number: setNumber });
      }
    }

    await client.query('COMMIT');

    // Verification
    const comp = await pool.query(`
      SELECT subject, SUM(marks) as marks, COUNT(*) as count
      FROM questions WHERE is_active = TRUE GROUP BY subject
    `);
    const total = comp.rows.reduce((a, r) => a + Number(r.marks), 0);
    const count = comp.rows.reduce((a, r) => a + Number(r.count), 0);
    console.log(`\nSeed complete. ${createdSets.length} sets created.`);
    console.log(`Total questions: ${count}, total marks: ${total}`);
    console.log('Composition by subject:');
    for (const r of comp.rows) console.log(`  ${r.subject}: ${Number(r.marks)} marks (${Number(r.count)} Q)`);
    console.log('\nLogin credentials:');
    console.log('  Teacher: teacher@cee.edu.np / teacher123');
    console.log('  Student: student@cee.edu.np / student123');
    console.log('  Admin:   admin@cee.edu.np / admin123');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
