import { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from './Navbar';
import { SYLLABUS_LABELS } from '../constants';

export default function ReviewResult({ user, reviewData, onLogout, onBack }) {
  const [detail, setDetail] = useState(null);
  const [feedback, setFeedback] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await api(`/teacher/results/${reviewData}`);
        setDetail(d);
        setFeedback(!!d.feedback_enabled);
      } catch (e) { alert(e.message); onBack(); }
    })();
  }, []);

  const releaseResult = async () => {
    if (!confirm('Release this result to the student?')) return;
    try {
      await api(`/teacher/results/${detail.id}/release`, { method: 'PATCH', body: JSON.stringify({ feedback_enabled: feedback }) });
      alert('Result released to student.');
      onBack();
    } catch (e) { alert(e.message); }
  };

  if (!detail) return <div className="container"><div className="card">Loading...</div></div>;

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} extra={<button onClick={onBack}>← Back</button>} />
      <div className="container">
        <div className="card">
          <h2>🔍 Review — {detail.student_name}</h2>
          <p className="muted">{detail.set_title} • {SYLLABUS_LABELS[detail.syllabus] || detail.syllabus}</p>
          <div className="stat-grid">
            <div className="stat"><div className="value">{detail.total_marks}</div><div className="label">Total</div></div>
            <div className="stat"><div className="value" style={{ color: 'var(--success)' }}>{detail.correct_count}</div><div className="label">Correct</div></div>
            <div className="stat"><div className="value" style={{ color: 'var(--danger)' }}>{detail.incorrect_count}</div><div className="label">Incorrect</div></div>
            <div className="stat"><div className="value" style={{ color: 'var(--gray)' }}>{detail.unanswered_count}</div><div className="label">Unanswered</div></div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ margin: 0 }}><input type="checkbox" checked={feedback} onChange={(e) => setFeedback(e.target.checked)} /> Enable feedback</label>
            <button className="btn btn-success" onClick={releaseResult}>Release Result</button>
          </div>
        </div>
        <div className="card">
          <h2>📝 Answer Sheet</h2>
          {detail.answers.map((a, i) => (
            <div key={i} className="question-block">
              <div className="flex-between">
                <div className="question-text">{i + 1}. {a.question_text}</div>
                <div>{a.is_correct ? <span className="badge badge-released">✓</span> : <span className="badge badge-pending">✗</span>}</div>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                Student: <strong>{a.selected_label || '—'}</strong> | Correct: <strong>{a.correct_label}</strong> | Marks: {a.marks_awarded}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
