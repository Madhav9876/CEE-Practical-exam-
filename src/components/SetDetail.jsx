import { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from './Navbar';
import { SYLLABUS_LABELS } from '../constants';

export default function SetDetail({ user, setData, onLogout, onBack }) {
  const [set, setSet] = useState(null);
  const [compResult, setCompResult] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/question-sets/${setData}`);
        setSet(data);
      } catch (e) { alert(e.message); onBack(); }
    })();
  }, []);

  const checkComposition = async (id) => {
    const comp = await api(`/question-sets/${id}/composition`);
    setCompResult(comp.valid
      ? '✅ Set is valid — matches syllabus weightage.'
      : `❌ Set is invalid:\n${comp.errors.map(e => '• ' + e).join('\n')}`);
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    const subject = document.getElementById('q-subject').value;
    const topic = document.getElementById('q-topic').value;
    const cognitive = document.getElementById('q-cognitive').value;
    const text = document.getElementById('q-text').value;
    const rationale = document.getElementById('q-rationale').value;
    const optInputs = document.querySelectorAll('.q-opt-text');
    const correctIdx = parseInt(document.querySelector('input[name="correct-option"]:checked')?.value ?? -1);
    if (!topic || !text || correctIdx < 0) { alert('Topic, question text, and a correct option are required.'); return; }
    const options = Array.from(optInputs).map((inp, i) => ({
      option_label: String.fromCharCode(65 + i),
      option_text: inp.value,
      is_correct: i === correctIdx,
      sort_order: i + 1
    }));
    if (options.some(o => !o.option_text)) { alert('All options must have text.'); return; }
    try {
      await api(`/question-sets/${set.id}/questions`, {
        method: 'POST',
        body: JSON.stringify({ subject, topic, cognitive_level: cognitive, question_text: text, rationale: rationale || null, options })
      });
      setShowAdd(false);
      const updated = await api(`/question-sets/${set.id}`);
      setSet(updated);
    } catch (e) { alert(e.message); }
  };

  if (!set) return <div className="container"><div className="card">Loading...</div></div>;

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} extra={<button onClick={onBack}>← Back</button>} />
      <div className="container">
        <div className="card">
          <div className="flex-between">
            <div>
              <h2>📚 {set.title}</h2>
              <p className="muted">{set.description || ''}</p>
              <p className="muted">Syllabus: <span className="syllabus-tag">{SYLLABUS_LABELS[set.syllabus] || set.syllabus}</span> • Status: <span className={`badge badge-${set.status}`}>{set.status}</span> • {set.total_marks} marks • {set.duration_minutes} min</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => checkComposition(set.id)}>Check</button>
          </div>
          {compResult && <div className={`alert ${compResult.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ whiteSpace: 'pre-line' }}>{compResult}</div>}
          <h3 style={{ marginTop: 16 }}>Composition</h3>
          <div className="stat-grid">
            <div className="stat"><div className="value">{set.composition.biology}</div><div className="label">Biology</div></div>
            <div className="stat"><div className="value">{set.composition.chemistry}</div><div className="label">Chemistry</div></div>
            <div className="stat"><div className="value">{set.composition.physics}</div><div className="label">Physics</div></div>
            <div className="stat"><div className="value">{set.composition.mental_agility}</div><div className="label">MAT</div></div>
            <div className="stat"><div className="value">{set.composition.recall}</div><div className="label">Recall</div></div>
            <div className="stat"><div className="value">{set.composition.understanding}</div><div className="label">Understanding</div></div>
            <div className="stat"><div className="value">{set.composition.application}</div><div className="label">Application</div></div>
            <div className="stat"><div className="value">{set.composition.total}/{set.composition.count}</div><div className="label">Marks/Q</div></div>
          </div>
        </div>
        <div className="card">
          <div className="flex-between mb-8">
            <h2>❓ Questions ({set.questions.length})</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ Add</button>
          </div>
          {showAdd && (
            <form onSubmit={addQuestion} style={{ background: 'var(--light)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <div className="row">
                <div className="col">
                  <label>Subject</label>
                  <select id="q-subject">
                    <option value="biology">Biology</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="physics">Physics</option>
                    <option value="mental_agility">Mental Agility</option>
                  </select>
                </div>
                <div className="col">
                  <label>Topic</label>
                  <input id="q-topic" placeholder="e.g. Human Biology" />
                </div>
                <div className="col">
                  <label>Cognitive Level</label>
                  <select id="q-cognitive">
                    <option value="recall">Recall</option>
                    <option value="understanding">Understanding</option>
                    <option value="application">Application</option>
                  </select>
                </div>
              </div>
              <label>Question Text</label>
              <textarea id="q-text" rows="2" placeholder="Enter the question..."></textarea>
              <label>Rationale</label>
              <textarea id="q-rationale" rows="2" placeholder="Explanation..."></textarea>
              <label>Options (check correct)</label>
              <div id="q-options">
                {['A', 'B', 'C', 'D'].map((lbl, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span><strong>{lbl}.</strong></span>
                    <input type="text" className="q-opt-text" placeholder={`Option ${lbl}`} style={{ marginBottom: 0 }} />
                    <input type="radio" name="correct-option" value={i} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-success btn-sm">Add</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          )}
          {set.questions.map((q, i) => (
            <div key={q.id} className="question-block">
              <div className="flex-between">
                <div className="question-text">{i + 1}. {q.question_text}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{q.subject}</span>
                  <span className="badge badge-draft">{q.cognitive_level}</span>
                </div>
              </div>
              <div className="muted" style={{ margin: '6px 0' }}>Topic: {q.topic} • {q.sub_topic || ''}</div>
              {q.options.map(o => (
                <div key={o.id} className={`option ${o.is_correct ? 'correct' : ''}`} style={{ cursor: 'default', pointerEvents: 'none' }}>
                  <span className="option-label">{o.option_label}.</span>
                  <span>{o.option_text} {o.is_correct ? '✓' : ''}</span>
                </div>
              ))}
            </div>
          ))}
          {set.questions.length === 0 && <div className="muted">No questions in this set yet.</div>}
        </div>
      </div>
    </div>
  );
}
