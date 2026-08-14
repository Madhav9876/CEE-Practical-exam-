/**
 * Deduplicate the CEE question bank.
 *
 * Step 1 - Intra-set deduplication:
 *   Within each subject "set", remove questions whose normalized stem text
 *   repeats. The first occurrence is kept.
 *
 * Step 2 - Inter-set deduplication:
 *   Across all sets, keep a question only in the FIRST set it appears in.
 *   Any later duplicate (same normalized stem) is removed so every question
 *   is globally unique across the whole collection.
 *
 * Output:
 *   - data/cee-questions-deduplicated.json  (cleaned dataset)
 *   - public/student-questions.html          (student-facing view, correct answer in green)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { qBank } = require(path.join(ROOT, 'server', 'questionBank'));

// Fixed, deterministic order of sets.
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

function normalize(text) {
  return String(text).trim().replace(/\s+/g, ' ').toLowerCase();
}

function dedupe() {
  const cleaned = {};
  const globalSeen = new Set();
  const report = { intraRemoved: 0, interRemoved: 0, perSet: {} };

  for (const setName of SET_ORDER) {
    const source = qBank[setName] || [];
    const seenInSet = new Set();
    const kept = [];
    let intra = 0;
    let inter = 0;

    for (const q of source) {
      const key = normalize(q.text);

      if (seenInSet.has(key)) {
        intra++;
        report.intraRemoved++;
        continue;
      }
      seenInSet.add(key);

      if (globalSeen.has(key)) {
        inter++;
        report.interRemoved++;
        continue;
      }
      globalSeen.add(key);
      kept.push(q);
    }

    cleaned[setName] = kept;
    report.perSet[setName] = { input: source.length, kept: kept.length, intra, inter };
  }

  return { cleaned, report };
}

function writeDataset(cleaned) {
  const out = {
    generatedAt: new Date().toISOString(),
    description: 'CEE question bank after intra-set and inter-set deduplication.',
    sets: {}
  };
  for (const setName of SET_ORDER) {
    out.sets[setName] = {
      label: SET_LABELS[setName],
      count: cleaned[setName].length,
      questions: cleaned[setName].map((q, i) => ({
        id: `${setName}-${i + 1}`,
        topic: q.topic,
        subTopic: q.subTopic,
        level: q.level,
        text: q.text,
        options: q.options.map((opt, oi) => ({ label: ['A', 'B', 'C', 'D'][oi], text: opt })),
        correctLabel: ['A', 'B', 'C', 'D'][q.correct],
        correctText: q.options[q.correct],
        rationale: q.rationale
      }))
    };
  }
  const file = path.join(ROOT, 'data', 'cee-questions-deduplicated.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  return file;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeHtml(cleaned, report) {
  const labels = ['A', 'B', 'C', 'D'];
  let total = 0;
  const sections = SET_ORDER.map((setName) => {
    const qs = cleaned[setName];
    const items = qs.map((q, qi) => {
      total++;
      const opts = q.options
        .map((opt, oi) => {
          const isCorrect = oi === q.correct;
          const cls = isCorrect ? 'option correct' : 'option';
          const mark = isCorrect ? ' &#10004;' : '';
          return `<li class="${cls}"><span class="lbl">${labels[oi]}.</span> ${escapeHtml(opt)}${mark}</li>`;
        })
        .join('');
      return `
        <div class="question">
          <div class="qtext"><span class="qnum">${total}.</span> ${escapeHtml(q.text)}</div>
          <div class="meta">${escapeHtml(q.topic)} &middot; ${escapeHtml(q.level)}</div>
          <ul class="options">${opts}</ul>
        </div>`;
    }).join('');

    return `
      <section class="set">
        <h2>${escapeHtml(SET_LABELS[setName])} <span class="count">(${qs.length} questions)</span></h2>
        ${items}
      </section>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CEE Practice Questions</title>
<style>
  :root { --green: #15803d; --green-bg: #dcfce7; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; background: #f6f7f9; color: #1f2937; }
  header { background: #1e3a8a; color: #fff; padding: 20px 28px; }
  header h1 { margin: 0 0 4px; font-size: 22px; }
  header p { margin: 0; opacity: .85; font-size: 14px; }
  main { max-width: 880px; margin: 0 auto; padding: 24px 20px 60px; }
  .set { margin-top: 34px; }
  .set h2 { border-bottom: 2px solid #1e3a8a; padding-bottom: 6px; font-size: 19px; }
  .count { color: #6b7280; font-weight: 400; font-size: 14px; }
  .question { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin: 14px 0; }
  .qtext { font-weight: 600; margin-bottom: 6px; }
  .meta { font-size: 12px; color: #6b7280; margin-bottom: 10px; }
  .options { list-style: none; margin: 0; padding: 0; }
  .option { padding: 8px 10px; border-radius: 6px; margin: 5px 0; border: 1px solid #e5e7eb; }
  .option .lbl { font-weight: 700; margin-right: 6px; }
  .option.correct { color: var(--green); background: var(--green-bg); border-color: #86efac; font-weight: 700; }
  footer { text-align: center; color: #9ca3af; font-size: 13px; padding: 20px; }
</style>
</head>
<body>
<header>
  <h1>CEE Practice Questions</h1>
  <p>The correct answer for every question is highlighted in green. Total: ${total} unique questions.</p>
</header>
<main>
${sections}
</main>
<footer>Deduplicated question bank &middot; intra-set &amp; inter-set redundancy removed.</footer>
</body>
</html>`;

  const file = path.join(ROOT, 'public', 'student-questions.html');
  fs.writeFileSync(file, html);
  return file;
}

const { cleaned, report } = dedupe();
const jsonFile = writeDataset(cleaned);
const htmlFile = writeHtml(cleaned, report);

console.log('Deduplication report:');
console.log(JSON.stringify(report, null, 2));
console.log('\nWrote dataset :', jsonFile);
console.log('Wrote HTML    :', htmlFile);
