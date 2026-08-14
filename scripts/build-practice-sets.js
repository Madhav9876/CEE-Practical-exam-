/**
 * Build multiple non-overlapping 200-question practice sets, Hard-weighted.
 *
 *  - Pool = existing audited bank (476) + generated Hard/Medium questions.
 *  - Difficulty mapped from level: recall=Easy, understanding=Medium, application=Hard.
 *  - Each set = exactly 200 questions, Hard-dominant (minimize Easy/Medium).
 *  - Sets are disjoint: every question appears in at most one set.
 *  - Consistent negative marking across all sets: +1.0 per question, -0.25 wrong.
 *
 * Outputs: data/practice-sets.json and public/practice-sets.html
 */

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { qBank } = require(path.join(ROOT, 'server', 'questionBank'));
const gen = require(path.join(ROOT, 'server', 'generated-questions'));

const SET_ORDER = ['zoology', 'botany', 'chemistry', 'physics', 'mentalAgility', 'health', 'nursing'];
const LABELS = ['A', 'B', 'C', 'D'];
const LEVEL_TO_DIFF = { recall: 'Easy', understanding: 'Medium', application: 'Hard' };
const MARKS = 1.0;
const NEGATIVE = 0.25;
const SET_SIZE = 200;
const NUM_SETS = 2;

// Deterministic shuffle (seeded) so builds are reproducible.
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build the full pool with difficulty + generated flags.
const pool = [];
for (const setName of SET_ORDER) {
  for (const q of (qBank[setName] || [])) {
    pool.push({ ...q, difficulty: LEVEL_TO_DIFF[q.level] || q.level, generated: false });
  }
}
for (const setName of SET_ORDER) {
  for (const q of (gen[setName] || [])) {
    pool.push({ ...q, difficulty: LEVEL_TO_DIFF[q.level] || q.level, generated: !!q.generated });
  }
}

// De-duplicate the pool globally by normalized text so no question can appear
// in more than one set (covers the 2 known cross-set duplicates in qBank).
const seenText = new Set();
const keyOf = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const dedupedPool = [];
let poolDups = 0;
for (const q of pool) {
  const k = keyOf(q.text);
  if (seenText.has(k)) { poolDups++; continue; }
  seenText.add(k);
  dedupedPool.push(q);
}

// Group by difficulty.
const byDiff = { Easy: [], Medium: [], Hard: [] };
for (const q of dedupedPool) byDiff[q.difficulty].push(q);
const rnd = seeded(20260814);
for (const d of ['Easy', 'Medium', 'Hard']) byDiff[d] = shuffle(byDiff[d], rnd);

console.log('Pool before dedup:', pool.length, '| duplicates removed:', poolDups, '| pool after dedup:', dedupedPool.length);

// Per-set targets (Hard-dominant, Easy/Medium minimized). Totals:
// Hard 201, Medium 76, Easy 395. Two sets of 200.
const targets = [
  { Hard: 100, Medium: 38, Easy: 62 },
  { Hard: 101, Medium: 38, Easy: 61 }
];
const totalNeed = NUM_SETS * SET_SIZE;
const poolSize = pool.length;
if (poolSize < totalNeed) {
  console.error(`Pool too small: ${poolSize} < ${totalNeed}`);
  process.exit(1);
}

let gi = 0; // global index for unique ids
const sets = [];
const used = new Set(); // indices into byDiff arrays consumed

// Pointers into each difficulty array.
const ptr = { Easy: 0, Medium: 0, Hard: 0 };
function take(diff, n) {
  const out = [];
  for (let k = 0; k < n; k++) {
    if (ptr[diff] >= byDiff[diff].length) {
      console.error(`Ran out of ${diff} questions`);
      process.exit(1);
    }
    out.push(byDiff[diff][ptr[diff]++]);
  }
  return out;
}

for (let s = 0; s < NUM_SETS; s++) {
  const t = targets[s];
  const picked = [...take('Hard', t.Hard), ...take('Medium', t.Medium), ...take('Easy', t.Easy)];
  const questions = picked.map((q) => {
    gi++;
    return {
      id: `Q${String(gi).padStart(4, '0')}`,
      topic: q.topic,
      subTopic: q.subTopic,
      difficulty: q.difficulty,
      text: q.text,
      options: q.options.map((opt, oi) => ({ label: LABELS[oi], text: opt })),
      correctLabel: LABELS[q.correct],
      correctText: q.options[q.correct],
      rationale: q.rationale,
      generated: !!q.generated
    };
  });
  sets.push({
    id: `set-${s + 1}`,
    title: `CEE Hard-Focused Practice Set ${s + 1}`,
    description: '200 questions, Hard-weighted, with consistent negative marking.',
    questionCount: SET_SIZE,
    marksPerQuestion: MARKS,
    negativeMark: NEGATIVE,
    totalMarks: SET_SIZE * MARKS,
    distribution: { Hard: t.Hard, Medium: t.Medium, Easy: t.Easy },
    questions
  });
}

// Verify no overlap across sets (same question text never reused).
const seen = new Set();
let overlap = 0;
for (const set of sets) {
  for (const q of set.questions) {
    const key = q.text.trim().toLowerCase();
    if (seen.has(key)) overlap++;
    seen.add(key);
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  scheme: { marksPerQuestion: MARKS, negativeMark: NEGATIVE, note: 'Each correct answer +1.0; each incorrect answer -0.25.' },
  sets
};
fs.writeFileSync(path.join(ROOT, 'data', 'practice-sets.json'), JSON.stringify(out, null, 2));

// ---- HTML practice view (answers hidden until revealed) ----
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let htmlSets = '';
sets.forEach((set, si) => {
  const qs = set.questions.map((q, qi) => {
    const opts = q.options.map((opt, oi) => {
      const isC = oi === LABELS.indexOf(q.correctLabel);
      return `<li class="opt" data-correct="${isC ? 1 : 0}"><span class="lbl">${LABELS[oi]}.</span> ${esc(opt.text)}</li>`;
    }).join('');
    return `<div class="q"><div class="qt">${qi + 1}. ${esc(q.text)} <span class="badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span></div><ul class="opts">${opts}</ul><div class="ans" hidden>Answer: <b>${q.correctLabel}</b> — ${esc(q.correctText)}</div></div>`;
  }).join('');
  htmlSets += `<section class="set"><h2>${esc(set.title)}</h2>
  <p class="meta">200 questions · Hard ${set.distribution.Hard} / Medium ${set.distribution.Medium} / Easy ${set.distribution.Easy} · +${MARKS} per correct, −${NEGATIVE} per wrong</p>
  <button class="reveal" onclick="reveal(this)">Show answers</button>
  ${qs}</section>`;
});

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CEE Hard-Focused Practice Sets</title>
<style>
:root{--green:#15803d;--green-bg:#dcfce7;}
*{box-sizing:border-box;}
body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:#f6f7f9;color:#1f2937;}
header{background:#7c2d12;color:#fff;padding:20px 28px;}
header h1{margin:0 0 4px;font-size:22px;}
header p{margin:0;opacity:.85;font-size:14px;}
main{max-width:900px;margin:0 auto;padding:24px 20px 60px;}
.set{margin-top:30px;}
.set h2{border-bottom:2px solid #7c2d12;padding-bottom:6px;}
.meta{font-size:13px;color:#6b7280;margin:6px 0 12px;}
.reveal{background:#7c2d12;color:#fff;border:0;padding:8px 14px;border-radius:6px;cursor:pointer;margin-bottom:10px;}
.q{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin:12px 0;}
.qt{font-weight:600;margin-bottom:8px;}
.badge{font-size:11px;padding:1px 7px;border-radius:10px;margin-left:6px;color:#fff;}
.badge.hard{background:#991b1b;}.badge.medium{background:#854d0e;}.badge.easy{background:#1e40af;}
.opts{list-style:none;margin:0;padding:0;}
.opt{padding:8px 10px;border:1px solid #e5e7eb;border-radius:6px;margin:5px 0;}
.opt.correct{color:var(--green);background:var(--green-bg);border-color:#86efac;font-weight:700;}
.ans{margin-top:8px;color:#374151;font-size:14px;}
footer{text-align:center;color:#9ca3af;font-size:13px;padding:20px;}
</style></head>
<body>
<header><h1>CEE Hard-Focused Practice Sets</h1>
<p>${NUM_SETS} sets × 200 questions · Hard-weighted · no overlap · consistent negative marking (+${MARKS} / −${NEGATIVE})</p></header>
<main>${htmlSets}</main>
<footer>Generated practice sets. Generated questions are flagged in the JSON for SME review.</footer>
<script>
function reveal(btn){const sec=btn.closest('.set');const hidden=sec.querySelectorAll('.ans[hidden]');if(hidden.length){hidden.forEach(a=>a.hidden=false);sec.querySelectorAll('.opt').forEach(o=>{if(o.dataset.correct==='1')o.classList.add('correct');});btn.textContent='Hide answers';}else{sec.querySelectorAll('.ans').forEach(a=>a.hidden=true);sec.querySelectorAll('.opt.correct').forEach(o=>o.classList.remove('correct'));btn.textContent='Show answers';}}
</script>
</body></html>`;
fs.writeFileSync(path.join(ROOT, 'public', 'practice-sets.html'), html);

console.log('Pool size:', poolSize);
console.log('Sets built:', sets.length, '(' + SET_SIZE + ' each)');
console.log('Cross-set overlaps:', overlap);
console.log('Distribution per set:', sets.map(s => JSON.stringify(s.distribution)).join(' | '));
console.log('Generated questions used:', sets.reduce((a, s) => a + s.questions.filter(q => q.generated).length, 0));
console.log('Wrote data/practice-sets.json and public/practice-sets.html');
