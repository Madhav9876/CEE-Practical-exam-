import { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from './Navbar';
import { SYLLABUS_LABELS } from '../constants';

export default function ResultView({ user, resultData, onLogout, onBack }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const results = await api('/student/results');
        const r = results.find(x => x.attempt_id === resultData?.attemptId);
        if (!r) { onBack(); return; }
        const detail = await api(`/student/results/${r.id}`);
        setResult(detail);
      } catch (e) { alert(e.message); onBack(); }
    })();
  }, []);

  if (!result) return <div className="container"><div className="card">Loading...</div></div>;

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} extra={<button onClick={onBack}>← Back</button>} />
      <div className="container">
        <div className="card">
          <h2>📊 {result.set_title} — Result</h2>
          <p className="muted">Syllabus: {SYLLABUS_LABELS[result.syllabus] || result.syllabus}</p>
          <div className="stat-grid">
            <div className="stat"><div className="value">{result.total_marks}</div><div className="label">Total / 200</div></div>
            <div className="stat"><div className="value" style={{ color: 'var(--success)' }}>{result.correct_count}</div><div className="label">Correct (+1)</div></div>
            <div className="stat"><div className="value" style={{ color: 'var(--danger)' }}>{result.incorrect_count}</div><div className="label">Incorrect (−0.25)</div></div>
            <div className="stat"><div className="value" style={{ color: 'var(--gray)' }}>{result.unanswered_count}</div><div className="label">Unanswered (0)</div></div>
          </div>
          {result.feedback_enabled
            ? <div className="alert alert-success">✅ Detailed feedback enabled — see correct answers and rationales below.</div>
            : <div className="alert alert-info">ℹ️ Feedback disabled. You can see your score and breakdown, but not correct answers.</div>}
        </div>
        <div className="card">
          <h2>🔍 Answer Review</h2>
          {result.answers.map((a, i) => (
            <div key={i} className="question-block">
              <div className="flex-between">
                <div className="question-text">{i + 1}. {a.question_text}</div>
                <div>
                  {a.is_correct
                    ? <span className="badge badge-released">✓ +{a.marks_awarded}</span>
                    : a.selected_option_id === null
                      ? <span className="badge badge-archived">✗ 0</span>
                      : <span className="badge badge-pending">✗ {a.marks_awarded}</span>}
                </div>
              </div>
              {result.feedback_enabled && a.options && (
                <div style={{ marginTop: 8 }}>
                  {a.options.map((opt) => {
                    const isCorrectOpt = !!opt.is_correct;
                    const isChosen = a.selected_option_id != null && opt.id === a.selected_option_id;
                    const cls = isCorrectOpt ? 'option correct' : (isChosen ? 'option incorrect' : 'option');
                    const tag = isCorrectOpt ? ' ✓ correct' : (isChosen ? ' — your answer' : '');
                    return (
                      <div key={opt.id} className={cls}>
                        <span className="option-label">{opt.option_label}.</span>
                        <span>{opt.option_text}{tag}</span>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: '0.85rem', marginTop: 8 }}>
                    <div>Your answer: <strong>{a.selected_label || '—'}</strong></div>
                    <div>Correct: <strong>{a.correct_label || '—'}</strong></div>
                    {a.rationale && <div className="muted mt-16" style={{ background: 'var(--light)', padding: 10, borderRadius: 6, marginTop: 8 }}>💡 <strong>Rationale:</strong> {a.rationale}</div>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
