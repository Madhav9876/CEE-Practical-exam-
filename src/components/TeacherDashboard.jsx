import { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from './Navbar';
import { SYLLABUS_LABELS } from '../constants';

export default function TeacherDashboard({ user, onLogout, navigate }) {
  const [sets, setSets] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSet, setNewSet] = useState({ title: '', syllabus: 'ce_2025', duration: 180 });

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([api('/question-sets'), api('/teacher/results')]);
        setSets(s);
        setResults(r);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pending = results.filter(r => r.status === 'pending');
  const released = results.filter(r => r.status === 'released');

  const createSet = async (e) => {
    e.preventDefault();
    if (!newSet.title) { alert('Title required'); return; }
    try {
      await api('/question-sets', { method: 'POST', body: JSON.stringify({ title: newSet.title, syllabus: newSet.syllabus, duration_minutes: newSet.duration }) });
      setShowCreate(false);
      setNewSet({ title: '', syllabus: 'ce_2025', duration: 180 });
      const s = await api('/question-sets');
      setSets(s);
    } catch (e) { alert(e.message); }
  };

  const releaseSet = async (id) => {
    if (!confirm('Release this set to students? It must pass composition validation.')) return;
    try {
      await api(`/question-sets/${id}/release`, { method: 'POST' });
      const s = await api('/question-sets');
      setSets(s);
    } catch (e) { alert(e.message); }
  };

  const unreleaseSet = async (id) => {
    if (!confirm('Unrelease this set?')) return;
    try {
      await api(`/question-sets/${id}/unrelease`, { method: 'POST' });
      const s = await api('/question-sets');
      setSets(s);
    } catch (e) { alert(e.message); }
  };

  const viewSet = async (id) => {
    navigate('viewSet', id);
  };

  const openReview = (resultId) => {
    navigate('review', resultId);
  };

  if (loading) return <div className="container"><div className="card">Loading...</div></div>;

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div className="container">
        <div className="row">
          <div className="col">
            <div className="card">
              <div className="flex-between mb-8">
                <h2>📚 Question Sets ({sets.length})</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>+ New</button>
              </div>
              {showCreate && (
                <form onSubmit={createSet} style={{ background: 'var(--light)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                  <label>Title</label>
                  <input value={newSet.title} onChange={(e) => setNewSet({ ...newSet, title: e.target.value })} placeholder="CEE Mock Set" />
                  <label>Syllabus</label>
                  <select value={newSet.syllabus} onChange={(e) => setNewSet({ ...newSet, syllabus: e.target.value })}>
                    <option value="ce_2025">CEE 2025 (MBBS/BDS/Nursing)</option>
                    <option value="ce_2026">CEE 2026 (BAMS/MLT/BPT)</option>
                    <option value="bph">BPH</option>
                    <option value="bns">BNS</option>
                  </select>
                  <label>Duration (minutes)</label>
                  <input type="number" value={newSet.duration} onChange={(e) => setNewSet({ ...newSet, duration: parseInt(e.target.value) || 180 })} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" className="btn btn-success btn-sm">Create</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
                  </div>
                </form>
              )}
              <table>
                <thead><tr><th>Title</th><th>Status</th><th>Q</th><th>Actions</th></tr></thead>
                <tbody>
                  {sets.map(s => (
                    <tr key={s.id}>
                      <td>{s.title}<br /><span className="syllabus-tag">{SYLLABUS_LABELS[s.syllabus] || s.syllabus}</span></td>
                      <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                      <td>{s.question_count || '—'}</td>
                      <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => viewSet(s.id)}>View</button>
                        {s.status === 'draft' && <button className="btn btn-success btn-sm" onClick={() => releaseSet(s.id)}>Release</button>}
                        {s.status === 'released' && <button className="btn btn-warning btn-sm" onClick={() => unreleaseSet(s.id)}>Unrelease</button>}
                      </td>
                    </tr>
                  ))}
                  {sets.length === 0 && <tr><td colSpan={4} className="muted">No question sets yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="col">
            <div className="card">
              <h2>🕐 Pending Review</h2>
              {pending.length > 0 ? (
                <table>
                  <thead><tr><th>Student</th><th>Exam</th><th>Score</th><th>Action</th></tr></thead>
                  <tbody>
                    {pending.map(r => (
                      <tr key={r.id}>
                        <td>{r.student_name}</td>
                        <td>{r.set_title}</td>
                        <td><strong>{r.total_marks}</strong></td>
                        <td><button className="btn btn-primary btn-sm" onClick={() => openReview(r.id)}>Review</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="muted">No pending results.</div>}
            </div>
            <div className="card">
              <h2>✅ Released Results</h2>
              {released.length > 0 ? (
                <table>
                  <thead><tr><th>Student</th><th>Exam</th><th>Score</th><th>Feedback</th></tr></thead>
                  <tbody>
                    {released.map(r => (
                      <tr key={r.id}>
                        <td>{r.student_name}</td>
                        <td>{r.set_title}</td>
                        <td>{r.total_marks}</td>
                        <td>{r.feedback_enabled ? <span className="badge badge-released">On</span> : <span className="badge badge-archived">Off</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="muted">No released results yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
