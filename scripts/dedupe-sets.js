/**
 * Deduplicate all questions across practice sets.
 *
 * The existing practice-sets.json contains many repeated or near-identical
 * questions. This script:
 *  1. Builds the full pool from qBank + generated + generated-hard.
 *  2. Applies strong semantic normalization (strip articles, leading
 *     question words, units/punctuation differences) to detect near-dupes.
 *  3. Keeps only the FIRST occurrence of every unique question, so each
 *     question appears exactly once across all sets.
 *  4. Rebuilds 2×200-question practice sets with the unique pool.
 *  5. Writes data/practice-sets.json and public/practice-sets.html.
 */

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { qBank } = require(path.join(ROOT, 'server', 'questionBank'));
const gen = require(path.join(ROOT, 'server', 'generated-questions'));
const genHard = require(path.join(ROOT, 'server', 'generated-hard'));

const SET_ORDER = ['zoology', 'botany', 'chemistry', 'physics', 'mentalAgility', 'health', 'nursing'];
const LABELS = ['A', 'B', 'C', 'D'];
const LEVEL_TO_DIFF = { recall: 'Easy', understanding: 'Medium', application: 'Hard' };
const MARKS = 1.0;
const NEGATIVE = 0.25;
const SET_SIZE = 200;
const NUM_SETS = 2;

/**
 * Very aggressive semantic normalization for near-duplicate detection.
 * - lowercase, strip punctuation/digits/symbols
 * - remove ALL numbers
 * - remove all unit tokens
 * - remove leading articles, question words, copulas
 * - remove a very large set of stop-words
 * - collapse whitespace
 */
const STOP = new Set([
  // articles & pronouns
  'the','a','an','this','that','these','those','it','its','itself','they','them','their',
  'he','she','his','her','we','us','our','you','your','i','me','my','mine','yours',
  // question words
  'which','what','how','why','who','when','where','whom','whose','whether',
  // copulas & auxiliaries
  'is','are','was','were','be','been','being','am','has','have','had','having',
  'does','do','did','will','would','should','could','can','may','might','shall','must',
  // prepositions
  'of','in','at','on','to','for','by','with','from','as','into','onto','upon','within',
  'without','through','between','among','about','above','below','under','over','after',
  'before','during','since','until','against','across','along','around','behind','beside',
  'beyond','despite','except','inside','outside','past','per','toward','towards','via',
  // conjunctions
  'and','or','but','nor','so','yet','if','then','else','because','although','though',
  'while','whereas','unless','whether','either','neither','both','not','no','nor',
  // verbs that add no semantic distinction
  'shows','show','showing','shown','means','mean','meant','indicates','indicate',
  'indicated','likely','used','use','uses','using','need','needs','needed',
  'called','call','calls','known','know','knows','states','state','stated',
  'describe','describes','described','refers','refer','refers','referring',
  'following','follows','followed','follow','related','relates','relating','associated',
  'associates','associate','caused','causes','cause','causing','result','results',
  'resulted','resulting','produced','produces','produce','producing','found','finds',
  'find','finding','findings','considered','considers','consider','considering',
  'regarded','regards','regard','regarding','performed','performs','perform','performing',
  'given','gives','give','giving','taken','takes','take','taking','made','makes','make',
  'making','seen','sees','see','seeing','observed','observes','observe','observing',
  'expected','expects','expect','expecting','required','requires','require','requiring',
  'recommended','recommends','recommend','recommending','suggested','suggests','suggest',
  'suggesting','classified','classifies','classify','classifying','characterized',
  'characterizes','characterize','characterizing','defined','defines','define','defining',
  'identified','identifies','identify','identifying','determined','determines','determine',
  'determining','calculated','calculates','calculate','calculating','measured','measures',
  'measure','measuring','estimated','estimates','estimate','estimating','increased',
  'increases','increase','increasing','decreased','decreases','decrease','decreasing',
  'reduced','reduces','reduce','reducing','affected','affects','affect','affecting',
  'influenced','influences','influence','influencing','prevented','prevents','prevent',
  'preventing','treated','treats','treat','treating','managed','manages','manage',
  'managing','monitored','monitors','monitor','monitoring','assessed','assesses','assess',
  'assessing','evaluated','evaluates','evaluate','evaluating','provided','provides',
  'provide','providing','administered','administers','administer','administering',
  'prescribed','prescribes','prescribe','prescribing','diagnosed','diagnoses','diagnose',
  'diagnosing'
]);

function semanticKey(text) {
  let s = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')            // strip everything except letters/digits/spaces
    .replace(/\s+/g, ' ')
    .trim();
  // remove leading question articles / words repeatedly
  for (let i = 0; i < 6; i++) {
    s = s.replace(/^(the|a|an|which|what|how|why|who|when|where|is|are|was|were|does|do|did|of|in|at|on|to|for|shows|show|means|mean|following|follows)\s+/, '');
  }
  const words = s.split(' ').filter((w) => w && !STOP.has(w));
  return words.join(' ').slice(0, 150);
}

/** Deterministic seeded PRNG for reproducible ordering. */
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
function canonicalKey(text) {
  return String(text).toLowerCase().replace(/\s+/g, ' ').trim();
}

// ---- 1. Build the full pool with source metadata ----
const rawPool = [];
function addAll(arr, src) {
  for (const q of (arr || [])) {
    rawPool.push({ ...q, difficulty: LEVEL_TO_DIFF[q.level] || q.level, generated: !!q.generated, src });
  }
}
for (const setName of SET_ORDER) {
  addAll(qBank[setName], 'qBank');
  addAll(gen[setName], 'gen');
  addAll(genHard[setName], 'genHard');
}

// ---- 2. Deduplicate using two-level approach ----
// Level 1: exact-text dedup (canonical key).
// Level 2: Jaccard similarity on content words (after aggressive normalization).
//   If two questions share ≥ SIM_THRESHOLD of their content words, they are
//   considered the same question and only the first is kept.
const SIM_THRESHOLD = 0.92;
const MIN_COMMON_WORDS = 3;

function contentWords(text) {
  return semanticKey(text).split(' ').filter(Boolean);
}

function jaccard(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let common = 0;
  for (const w of setA) if (setB.has(w)) common++;
  return common / Math.min(setA.size, setB.size);
}

const deduped = [];
const dupLog = [];
const keptContent = []; // array of { words, text, q }

for (const q of rawPool) {
  const strict = canonicalKey(q.text);
  const words = contentWords(q.text);
  if (words.length === 0) continue;

  // Level 1: exact-text duplicate?
  const exactMatch = keptContent.find((k) => canonicalKey(k.text) === strict);
  if (exactMatch) {
    dupLog.push({ type: 'exact', kept: strict.slice(0, 70), removed: strict.slice(0, 70) });
    continue;
  }

  // Level 2: semantic (Jaccard) duplicate?
  let isDup = false;
  for (const k of keptContent) {
    const sim = jaccard(words, k.words);
    // Count how many common words the two questions actually share
    const qWordsSet = new Set(words);
    const kWordsSet = new Set(k.words);
    let commonCount = 0;
    for (const w of qWordsSet) if (kWordsSet.has(w)) commonCount++;
    if (sim >= SIM_THRESHOLD && commonCount >= MIN_COMMON_WORDS) {
      dupLog.push({ type: 'semantic', kept: k.text.slice(0, 70), removed: q.text.slice(0, 70), sim: sim.toFixed(2) });
      isDup = true;
      break;
    }
  }
  if (isDup) continue;

  keptContent.push({ words, text: q.text, q });
  deduped.push(q);
}

console.log(`Raw pool: ${rawPool.length}`);
console.log(`Unique questions: ${deduped.length}`);
console.log(`Duplicates removed: ${rawPool.length - deduped.length}`);
console.log('\nDuplicate log (first 50):');
dupLog.slice(0, 50).forEach((d) => console.log(`  [${d.type}${d.sim ? ' ' + d.sim : ''}] ${d.kept.slice(0, 60)}  |||  ${d.removed.slice(0, 60)}`));
console.log(`\nTotal duplicate pairs: ${dupLog.length}`);

// ---- 3. Group unique questions by difficulty ----
const byDiff = { Easy: [], Medium: [], Hard: [] };
for (const q of deduped) byDiff[q.difficulty].push(q);
const rnd = seeded(new Date().getTime() % 100000);
for (const d of ['Easy', 'Medium', 'Hard']) byDiff[d] = shuffle(byDiff[d], rnd);

const avail = {
  Easy: byDiff.Easy.length,
  Medium: byDiff.Medium.length,
  Hard: byDiff.Hard.length,
};
const totalNeed = NUM_SETS * SET_SIZE;
if (deduped.length < totalNeed) {
  console.error(`\nERROR: Not enough unique questions. ${deduped.length} < ${totalNeed}`);
  process.exit(1);
}

// ---- 4. Build per-set distributions (Hard-weighted) ----
const targets = [];
const baseHard = Math.floor(avail.Hard / NUM_SETS);
let hardRemainder = avail.Hard - baseHard * NUM_SETS;
const baseMedium = Math.floor(avail.Medium / NUM_SETS);
let mediumRemainder = avail.Medium - baseMedium * NUM_SETS;
for (let s = 0; s < NUM_SETS; s++) {
  const hard = baseHard + (s < hardRemainder ? 1 : 0);
  const medium = baseMedium + (s < mediumRemainder ? 1 : 0);
  const easy = SET_SIZE - hard - medium;
  if (easy < 0) {
    console.error('Not enough questions in pool to maintain Hard-weighted distribution.');
    process.exit(1);
  }
  targets.push({ Hard: hard, Medium: medium, Easy: easy });
}
console.log('\nAvailable by difficulty:', JSON.stringify(avail));
console.log('Targets:', targets.map((t) => `${t.Hard}/${t.Medium}/${t.Easy}`).join(' | '));

// ---- 5. Take questions ----
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

let gi = 0;
const sets = [];
const usedGlobal = new Map(); // semanticKey → setId (for final audit)

for (let s = 0; s < NUM_SETS; s++) {
  const t = targets[s];
  const picked = [
    ...take('Hard', t.Hard),
    ...take('Medium', t.Medium),
    ...take('Easy', t.Easy),
  ];
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
      generated: !!q.generated,
    };
  });

  // Track semantic keys used in this set + verify uniqueness across all.
  for (const q of questions) {
    const k = semanticKey(q.text);
    if (usedGlobal.has(k)) {
      console.error(`CRITICAL: question appears in both set-${usedGlobal.get(k)} and set-${s + 1}: ${q.text}`);
      process.exit(2);
    }
    usedGlobal.set(k, s + 1);
  }

  sets.push({
    id: `set-${s + 1}`,
    title: `CEE Hard-Focused Practice Set ${s + 1}`,
    description: `${SET_SIZE} questions, Hard-weighted, with consistent negative marking.`,
    questionCount: SET_SIZE,
    marksPerQuestion: MARKS,
    negativeMark: NEGATIVE,
    totalMarks: SET_SIZE * MARKS,
    distribution: t,
    questions,
  });
}

// ---- 6. Final audit: strict + semantic uniqueness ----
let strictIntra = 0;
let strictInter = 0;
let semIntra = 0;
let semInter = 0;
const strictGlobal = new Set();
const semGlobal = new Set();

for (const set of sets) {
  const strictInSet = new Set();
  const semInSet = new Set();
  for (const q of set.questions) {
    const sk = canonicalKey(q.text);
    const mk = semanticKey(q.text);
    if (strictInSet.has(sk)) strictIntra++;
    strictInSet.add(sk);
    if (semInSet.has(mk)) semIntra++;
    semInSet.add(mk);

    if (strictGlobal.has(sk)) strictInter++;
    strictGlobal.add(sk);
    if (semGlobal.has(mk)) semInter++;
    semGlobal.add(mk);
  }
}
console.log('\n===== FINAL AUDIT =====');
console.log(`Strict intra-set duplicates: ${strictIntra} (must be 0)`);
console.log(`Strict inter-set duplicates: ${strictInter} (must be 0)`);
console.log(`Semantic intra-set duplicates: ${semIntra} (must be 0)`);
console.log(`Semantic inter-set duplicates: ${semInter} (must be 0)`);
console.log(`Total unique strict: ${strictGlobal.size}`);
console.log(`Total unique semantic: ${semGlobal.size}`);
console.log(`Total questions across all sets: ${sets.reduce((a, s) => a + s.questions.length, 0)}`);

if (strictIntra || strictInter || semIntra || semInter) {
  console.error('UNIQUENESS FAILURE - aborting write.');
  process.exit(3);
}

// ---- 7. Write JSON ----
const out = {
  generatedAt: new Date().toISOString(),
  scheme: {
    marksPerQuestion: MARKS,
    negativeMark: NEGATIVE,
    note: 'Each correct answer +1.0; each incorrect answer -0.25.',
  },
  sets,
};
const jsonFile = path.join(ROOT, 'data', 'practice-sets.json');
fs.writeFileSync(jsonFile, JSON.stringify(out, null, 2));
console.log('\nWrote', jsonFile);

// ---- 8. Write HTML ----
const AMP = String.fromCharCode(38) + 'amp;';
const LT = String.fromCharCode(38) + 'lt;';
const GT = String.fromCharCode(38) + 'gt;';
const QUOT = String.fromCharCode(38) + 'quot;';
const esc = (s) =>
  String(s)
    .replace(/&/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT);

let htmlSets = '';
sets.forEach((set, si) => {
  const qs = set.questions
    .map((q, qi) => {
      const opts = q.options
        .map((opt, oi) => {
          const isC = oi === LABELS.indexOf(q.correctLabel);
          return `<li class="opt" data-correct="${isC ? 1 : 0}"><span class="lbl">${LABELS[oi]}.</span> ${esc(opt.text)}</li>`;
        })
        .join('');
      return `<div class="q"><div class="qt">${qi + 1}. ${esc(q.text)} <span class="badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span></div><ul class="opts">${opts}</ul><div class="ans" hidden>Answer: <b>${q.correctLabel}</b> — ${esc(q.correctText)}</div></div>`;
    })
    .join('');
  htmlSets += `<section class="set"><h2>${esc(set.title)}</h2>
  <p class="meta">${set.questionCount} questions · Hard ${set.distribution.Hard} / Medium ${set.distribution.Medium} / Easy ${set.distribution.Easy} · +${MARKS} per correct, −${NEGATIVE} per wrong</p>
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
<p>${NUM_SETS} sets × ${SET_SIZE} questions · Hard-weighted · no overlap · consistent negative marking (+${MARKS} / −${NEGATIVE})</p></header>
<main>${htmlSets}</main>
<footer>Generated practice sets. Generated questions are flagged in the JSON for SME review.</footer>
<script>
function reveal(btn){const sec=btn.closest('.set');const hidden=sec.querySelectorAll('.ans[hidden]');if(hidden.length){hidden.forEach(a=>a.hidden=false);sec.querySelectorAll('.opt').forEach(o=>{if(o.dataset.correct==='1')o.classList.add('correct');});btn.textContent='Hide answers';}else{sec.querySelectorAll('.ans').forEach(a=>a.hidden=true);sec.querySelectorAll('.opt.correct').forEach(o=>o.classList.remove('correct'));btn.textContent='Show answers';}}
</script>
</body></html>`;
const htmlFile = path.join(ROOT, 'public', 'practice-sets.html');
fs.writeFileSync(htmlFile, html);
console.log('Wrote', htmlFile);
console.log('\nDone.');