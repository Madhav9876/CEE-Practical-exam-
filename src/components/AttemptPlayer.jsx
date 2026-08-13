import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import Navbar from './Navbar';

export default function AttemptPlayer({ user, attemptData, onLogout, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const timerRef = useRef(null);

  const attemptId = attemptData?.attemptId;
  const timeLimit = attemptData?.timeLimit || 0;
  const startTime = attemptData?.startTime || Date.now();

  useEffect(() => {
    if (!attemptId) { onBack(); return; }
    (async () => {
      try {
        const qs = await api(`/student/attempts/${attemptId}/questions`);
        setQuestions(qs);
      } catch (e) { onBack(); }
    })();
  }, [attemptId]);

  useEffect(() => {
    if (questions.length === 0) return;
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [questions]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, timeLimit - elapsed);
    updateTimerDisplay(remaining);
    timerRef.current = setInterval(() => {
      const el = Math.floor((Date.now() - startTime) / 1000);
      const rem = Math.max(0, timeLimit - el);
      updateTimerDisplay(rem);
      if (rem <= 0) { clearInterval(timerRef.current); submitAttempt(); }
    }, 1000);
  };

  const updateTimerDisplay = (remaining) => {
    const el = document.getElementById('timer-display');
    if (!el) return;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const selectAnswer = async (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    try {
      await api(`/student/attempts/${attemptId}/answers/${questionId}`, { method: 'PUT', body: JSON.stringify({ selected_option_id: optionId }) });
    } catch (e) { /* continue locally */ }
  };

  const submitAttempt = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!confirm('Submit your exam? You cannot change answers after submission.')) {
      startTimer();
      return;
    }
    try {
      const data = await api(`/student/attempts/${attemptId}/submit`, { method: 'POST', body: JSON.stringify({}) });
      alert(data.message);
      onBack();
    } catch (e) {
      alert(e.message);
      if (e.message.includes('already')) onBack();
      else startTimer();
    }
  };

  if (questions.length === 0) return <div className="container"><div className="card">Loading questions...</div></div>;

  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const total = questions.length;

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div className="container">
        <div className="card flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
          <div><strong>Q{currentQ + 1}/{total}</strong> <span className="muted">• {q.subject} • {q.topic}</span></div>
          <div className="timer">⏱ <span id="timer-display">--:--</span></div>
        </div>
        <div className="card">
          <div className="question-block">
            <div className="question-text">{q.question_text}</div>
            {q.options.map((opt, i) => (
              <div
                key={opt.id}
                className={`option ${answers[q.id] === opt.id ? 'selected' : ''}`}
                onClick={() => selectAnswer(q.id, opt.id)}
                id={`opt-${q.id}-${opt.id}`}
              >
                <span className="option-label">{String.fromCharCode(65 + i)}.</span>
                <span>{opt.option_text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentQ(currentQ - 1)} disabled={currentQ === 0}>← Prev</button>
            {currentQ < total - 1
              ? <button className="btn btn-primary btn-sm" onClick={() => setCurrentQ(currentQ + 1)}>Next →</button>
              : <button className="btn btn-success btn-sm" onClick={submitAttempt}>Submit Exam</button>}
          </div>
        </div>
        <div className="card">
          <div className="flex-between">
            <h3>Navigator</h3>
            <span className="muted">{answeredCount}/{total} answered</span>
          </div>
          <div className="answer-grid">
            {questions.map((qq, i) => (
              <div
                key={qq.id}
                className={`answer-cell ${answers[qq.id] ? 'answered' : ''}`}
                onClick={() => setCurrentQ(i)}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
