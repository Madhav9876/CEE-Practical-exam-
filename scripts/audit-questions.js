/**
 * Audit the CEE question bank for complete uniqueness.
 *
 *  1. Intra-set: no duplicate question stem within a single set.
 *  2. Inter-set: a question stem appears in at most one set.
 *
 * Uses a robust normalizer (lowercase, strip punctuation/whitespace) so
 * duplicates differing only in punctuation are caught. Emits an audit report
 * and writes the deduplicated sets to data/cee-questions-audited.json.
 */

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { qBank } = require(path.join(ROOT, 'server', 'questionBank'));

const SET_ORDER = ['zoology', 'botany', 'chemistry', 'physics', 'mentalAgility', 'health', 'nursing'];
const SET_LABELS = {
  zoology: 'Zoology', botany: 'Botany', chemistry: 'Chemistry', physics: 'Physics',
  mentalAgility: 'Mental Agility Test', health: 'Public Health (BPH)', nursing: 'Nursing (BNS/BMS)'
};
const LABELS = ['A', 'B', 'C', 'D'];
const LEVEL_TO_DIFF = { recall: 'Easy', understanding: 'Medium', application: 'Hard' };

// Robust key: lowercase, keep alphanumerics + spaces, collapse spaces.
const keyOf = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

const intra = {};
const inter = [];
const unique = {};
const globalSeen = new Set();

for (const setName of SET_ORDER) {
  const src = qBank[setName] || [];
  const seenInSet = new Set();
  const kept = [];
  let intraCount = 0;
  for (const q of src) {
    const k = keyOf(q.text);
    if (seenInSet.has(k)) { intraCount++; continue; }
    seenInSet.add(k);
    if (globalSeen.has(k)) {
      inter.push({ set: setName, text: q.text });
      continue;
    }
    globalSeen.add(k);
    kept.push(q);
  }
  unique[setName] = kept;
  intra[setName] = intraCount;
}

const totalUnique = Object.values(unique).reduce((a, s) => a + s.length, 0);

// Build audited JSON (no difficulty rebalancing; pure uniqueness audit).
const out = { generatedAt: new Date().toISOString(), description: 'Audited CEE question sets — intra- and inter-set unique.', sets: {} };
for (const setName of SET_ORDER) {
  out.sets[setName] = {
    label: SET_LABELS[setName],
    count: unique[setName].length,
    questions: unique[setName].map((q, i) => ({
      id: `${setName}-${i + 1}`,
      topic: q.topic, subTopic: q.subTopic,
      difficulty: LEVEL_TO_DIFF[q.level] || q.level,
      text: q.text,
      options: q.options.map((opt, oi) => ({ label: LABELS[oi], text: opt })),
      correctLabel: LABELS[q.correct],
      correctText: q.options[q.correct],
      rationale: q.rationale
    }))
  };
}
fs.writeFileSync(path.join(ROOT, 'data', 'cee-questions-audited.json'), JSON.stringify(out, null, 2));

console.log('=== UNIQUENESS AUDIT ===');
console.log('Intra-set duplicates removed per set:');
let totalIntra = 0;
for (const s of SET_ORDER) { console.log('  ' + s.padEnd(14), intra[s]); totalIntra += intra[s]; }
console.log('  TOTAL intra-set duplicates:', totalIntra);
console.log('\nInter-set duplicates removed (kept in first set):', inter.length);
for (const d of inter) console.log('  - [' + d.set + '] ' + d.text);
console.log('\nTotal unique questions across collection:', totalUnique);
console.log('Wrote data/cee-questions-audited.json');
