import { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from './Navbar';
import { SYLLABUS_LABELS } from '../constants';

export default function StudentDashboard({ user, onLogout, navigate }) {
  const [data, setData] = useState({ sets: [], attempts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sets, attempts] = await Promise.all([api('/student/sets'), api('/student/attempts')]);
        setData({ sets, attempts });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const released = data.sets.filter(s => s.status === 'released');
  const availableRows = released.length
    ? released.map(s => (
        <tr key={s.id}>
          <td>{s.title}<br /><span className="syllabus-tag">{SYLLABUS_LABELS[s.syllabus] || s.syllabus}</span></td>
          <td><span className="badge badge-released">Released</span></td>
          <td>{s.total_marks}</td>
          <td>{s.attempted
            ? <span className="badge badge-blue">Attempted</span>
            : <button className="btn btn-primary btn-sm" onClick={() => startAttempt(s.id)}>Take Exam</button>}
          </td>
        </tr>
      ))
    : <tr><td colSpan={4} className="muted">No exams released yet. Please check back later.</td></tr>;

  const releasedResults = data.attempts.filter(a => a.result_status === 'released');
  const pendingResults = data.attempts.filter(a => a.result_status === 'pending');
  const noResult = data.attempts.filter(a => !a.result_status);

  const resultRows = releasedResults.length
    ? releasedResults.map(a => (
        <tr key={a.id}>
          <td>{a.set_title}<br /><span className="syllabus-tag">{SYLLABUS_LABELS[a.syllabus] || a.syllabus}</span></td>
          <td><strong>{a.total_marks} / 200</strong></td>
          <td><span className="badge badge-released">Released</span></td>
          <td><button className="btn btn-primary btn-sm" onClick={() => viewResult(a.id)}>View</button></td>
        </tr>
      ))
    : <tr><td colSpan={4} className="muted">No released results yet.</td></tr>;

  const startAttempt = async (setId) => {
    if (!confirm('Start this exam? The timer will begin immediately.')) return;
    try {
      const res = await api('/student/attempts', { method: 'POST', body: JSON.stringify({ question_set_id: setId }) });
      navigate('attempt', { attemptId: res.attempt_id, timeLimit: res.time_limit_seconds, startTime: Date.now() });
    } catch (e) { alert(e.message); }
  };

  const viewResult = async (attemptId) => {
    try {
      const results = await api('/student/results');
      const result = results.find(r => r.attempt_id === attemptId);
      if (!result) { alert('Result not found'); return; }
      navigate('result', { attemptId: result.attempt_id, resultId: result.id });
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="container"><div className="card">Loading...</div></div>;

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div className="container">
        <div className="card">
          <h2>👋 Welcome, {user.full_name}!</h2>
          <p className="muted">Prepare for your CEE entrance exam with released mock sets.</p>
        </div>
        <div className="card">
          <h2>📋 Available Exams</h2>
          <table>
            <thead><tr><th>Exam</th><th>Status</th><th>Marks</th><th>Action</th></tr></thead>
            <tbody>{availableRows}</tbody>
          </table>
        </div>
        <div className="card">
          <h2>📊 My Results</h2>
          <table>
            <thead><tr><th>Exam</th><th>Score</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{resultRows}</tbody>
          </table>
        </div>
        {pendingResults.length > 0 && (
          <div className="card">
            <h2>⏳ Pending Results</h2>
            <div className="alert alert-info">
              {pendingResults.map(a => <div key={a.id}>• <strong>{a.set_title}</strong> — submitted, awaiting teacher review.</div>)}
            </div>
          </div>
        )}
        {noResult.length > 0 && (
          <div className="card">
            <h2>📝 In Progress</h2>
            {noResult.map(a => <div key={a.id} className="alert alert-info">• <strong>{a.set_title}</strong> — started but not yet submitted.</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
