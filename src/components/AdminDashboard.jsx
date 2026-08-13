import { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from './Navbar';

export default function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, l] = await Promise.all([api('/admin/stats'), api('/audit-logs')]);
        setStats(s);
        setLogs(l);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  if (!stats) return <div className="container"><div className="card">Loading...</div></div>;

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div className="container">
        <div className="card">
          <h2>📊 Platform Statistics</h2>
          <div className="stat-grid">
            <div className="stat"><div className="value">{stats.users}</div><div className="label">Users</div></div>
            <div className="stat"><div className="value">{stats.students}</div><div className="label">Students</div></div>
            <div className="stat"><div className="value">{stats.teachers}</div><div className="label">Teachers</div></div>
            <div className="stat"><div className="value">{stats.sets}</div><div className="label">Sets</div></div>
            <div className="stat"><div className="value">{stats.released_sets}</div><div className="label">Released</div></div>
            <div className="stat"><div className="value">{stats.attempts}</div><div className="label">Attempts</div></div>
            <div className="stat"><div className="value">{stats.pending_results}</div><div className="label">Pending</div></div>
            <div className="stat"><div className="value">{stats.released_results}</div><div className="label">Released Results</div></div>
          </div>
        </div>
        <div className="card">
          <h2>📜 Audit Log</h2>
          <table>
            <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
            <tbody>
              {logs.slice(0, 50).map(l => (
                <tr key={l.id}>
                  <td className="muted">{l.created_at}</td>
                  <td>{l.actor_id}</td>
                  <td><span className="badge badge-blue">{l.action}</span></td>
                  <td>{l.entity_type} #{l.entity_id || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
