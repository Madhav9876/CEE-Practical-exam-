/**
 * Reorganize the CEE question bank.
 *
 * Requirements:
 *  1. Difficulty distribution: each set is grouped into Easy / Medium / Hard
 *     (mapped from recall / understanding / application). To keep a balanced
 *     representation without discarding the scarce harder items, the dominant
 *     "Easy" tier is capped so it never exceeds Medium + Hard. All Medium and
 *     Hard questions are always retained.
 *  2. Intra-set uniqueness: no duplicate stem within a single set.
 *  3. Inter-set uniqueness: a question appears in at most one set (kept in the
 *     first set it occurs in); later duplicates across sets are removed.
 *
 * Outputs:
 *  - data/cee-questions-organized.json   (deduped + difficulty-balanced sets)
 *  - public/student-questions.html        (student view, correct answer in green, grouped by difficulty)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { qBank } = require(path.join(ROOT, 'server', 'questionBank'));

const SET_ORDER = ['zoology', 'botany', 'chemistry', 'physics', 'mentalAgility', 'health', 'nursing'];
const SET_LABELS = {
  zoology: 'Zoology',
  botany: 'Botany',
  chemistry: 'Chemistry',
  physics: 'Physics',
  mentalAgility: 'Mental Agility Test',
  health: 'Public Health (BPH)',
  nursing: 'Nursing (BNS/BMS)'
};
const LABELS = ['A', 'B', 'C', 'D'];
const DIFF_ORDER = ['Easy', 'Medium', 'Hard'];
const LEVEL_TO_DIFF = { recall: 'Easy', understanding: 'Medium', application: 'Hard' };

const normalize = (t) => String(t).trim().replace(/\s+/g, ' ').toLowerCase();

// --- Step 1+2+3: load, intra dedup, inter dedup, assign difficulty ---
const uniqueBySet = {};
const globalSeen = new Set();
const report = { intra: 0, inter: 0, perSet: {} };

for (const setName of SET_ORDER) {
  const src = qBank[setName] || [];
  const seenInSet = new Set();
  const kept = [];
  let intra = 0, inter = 0;
  for (const q of src) {
    const key = normalize(q.text);
    if (seenInSet.has(key)) { intra++; report.intra++; continue; }
    seenInSet.add(key);
    if (globalSeen.has(key)) { inter++; report.inter++; continue; }
    globalSeen.add(key);
    kept.push({ ...q, difficulty: LEVEL_TO_DIFF[q.level] || q.level });
  }
  uniqueBySet[setName] = kept;
  report.perSet[setName] = { input: src.length, unique: kept.length, intra, inter };
}

// --- Step 1 (balance): cap Easy so it never exceeds Medium + Hard ---
const balanced = {};
const balanceReport = {};
for (const setName of SET_ORDER) {
  const qs = uniqueBySet[setName];
  const byDiff = { Easy: [], Medium: [], Hard: [] };
  for (const q of qs) byDiff[q.difficulty].push(q);

  const medHard = byDiff.Medium.length + byDiff.Hard.length;
  let easyCap = byDiff.Easy.length;
  if (easyCap > medHard) easyCap = medHard; // ensure no tier dominates

  const result = [
    ...byDiff.Easy.slice(0, easyCap),
    ...byDiff.Medium,
    ...byDiff.Hard
  ];

  balanced[setName] = result;
  balanceReport[setName] = { Easy: easyCap, Medium: byDiff.Medium.length, Hard: byDiff.Hard.length, total: result.length };
}

// --- Write JSON ---
const jsonOut = { generatedAt: new Date().toISOString(), description: 'CEE question sets reorganized: difficulty-balanced, intra- and inter-set unique.', sets: {} };
for (const setName of SET_ORDER) {
  jsonOut.sets[setName] = {
    label: SET_LABELS[setName],
    balance: balanceReport[setName],
    questions: balanced[setName].map((q, i) => ({
      id: `${setName}-${i + 1}`,
      topic: q.topic,
      subTopic: q.subTopic,
      difficulty: q.difficulty,
      text: q.text,
      options: q.options.map((opt, oi) => ({ label: LABELS[oi], text: opt })),
      correctLabel: LABELS[q.correct],
      correctText: q.options[q.correct],
      rationale: q.rationale
    }))
  };
}
fs.writeFileSync(path.join(ROOT, 'data', 'cee-questions-organized.json'), JSON.stringify(jsonOut, null, 2));

// --- Write HTML ---
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let grandTotal = 0;
const sections = SET_ORDER.map((setName) => {
  const qs = balanced[setName];
  const b = balanceReport[setName];
  const diffSections = DIFF_ORDER.map((diff) => {
    const items = qs.filter((q) => q.difficulty === diff).map((q) => {
      grandTotal++;
      const opts = q.options.map((opt, oi) => {
        const isCorrect = oi === q.correct;
        return `<li class="${isCorrect ? 'option correct' : 'option'}"><span class="lbl">${LABELS[oi]}.</span> ${esc(opt)}${isCorrect ? ' &#10004;' : ''}</li>`;
      }).join('');
      return `<div class="question"><div class="qtext">${esc(q.text)}</div><div class="meta">${esc(q.topic)} &middot; ${esc(q.difficulty)}</div><ul class="options">${opts}</ul></div>`;
    }).join('');
    return `<div class="diffblock"><h3 class="diff ${diff.toLowerCase()}">${diff} <span class="dcount">(${qs.filter((q) => q.difficulty === diff).length})</span></h3>${items}</div>`;
  }).join('');
  return `<section class="set"><h2>${esc(SET_LABELS[setName])} <span class="count">(${qs.length} questions &middot; Easy ${b.Easy} / Medium ${b.Medium} / Hard ${b.Hard})</span></h2>${diffSections}</section>`;
}).join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CEE Practice Questions (Difficulty-Balanced)</title>
<style>
  :root { --green:#15803d; --green-bg:#dcfce7; }
  * { box-sizing: border-box; }
  body { font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif; margin:0; background:#f6f7f9; color:#1f2937; }
  header { background:#1e3a8a; color:#fff; padding:20px 28px; }
  header h1 { margin:0 0 4px; font-size:22px; }
  header p { margin:0; opacity:.85; font-size:14px; }
  main { max-width:900px; margin:0 auto; padding:24px 20px 60px; }
  .set { margin-top:34px; }
  .set h2 { border-bottom:2px solid #1e3a8a; padding-bottom:6px; font-size:19px; }
  .count { color:#6b7280; font-weight:400; font-size:14px; }
  .diffblock { margin-top:18px; }
  .diff { font-size:15px; margin:0 0 8px; padding:4px 10px; border-radius:6px; display:inline-block; }
  .diff.easy { background:#dbeafe; color:#1e40af; }
  .diff.medium { background:#fef9c3; color:#854d0e; }
  .diff.hard { background:#fee2e2; color:#991b1b; }
  .dcount { color:#374151; font-weight:400; }
  .question { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:14px 16px; margin:12px 0; }
  .qtext { font-weight:600; margin-bottom:6px; }
  .meta { font-size:12px; color:#6b7280; margin-bottom:10px; }
  .options { list-style:none; margin:0; padding:0; }
  .option { padding:8px 10px; border-radius:6px; margin:5px 0; border:1px solid #e5e7eb; }
  .option .lbl { font-weight:700; margin-right:6px; }
  .option.correct { color:var(--green); background:var(--green-bg); border-color:#86efac; font-weight:700; }
  footer { text-align:center; color:#9ca3af; font-size:13px; padding:20px; }
</style>
</head>
<body>
<header>
  <h1>CEE Practice Questions</h1>
  <p>Grouped by difficulty (Easy / Medium / Hard). The correct answer is highlighted in green. Total: ${grandTotal} unique questions.</p>
</header>
<main>
${sections}
</main>
<footer>Difficulty-balanced, de-duplicated question sets.</footer>
</body>
</html>`;
fs.writeFileSync(path.join(ROOT, 'public', 'student-questions.html'), html);

console.log('Intra-set duplicates removed:', report.intra);
console.log('Inter-set duplicates removed:', report.inter);
console.log('\nBalance per set (Easy / Medium / Hard):');
for (const s of SET_ORDER) console.log('  ' + s.padEnd(14), JSON.stringify(balanceReport[s]));
console.log('\nWrote data/cee-questions-organized.json and public/student-questions.html');
