import { useState } from 'react';
import { api, setToken } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('student@cee.edu.np');
  const [password, setPassword] = useState('student123');
  const [alert, setAlert] = useState('');

  const doLogin = async (e) => {
    e.preventDefault();
    setAlert('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setToken(data.token);
      onLogin(data.user, data.token);
    } catch (err) {
      setAlert(err.message);
    }
  };

  return (
    <div className="container">
      <div className="card login-box">
        <h1 style={{ textAlign: 'center', marginBottom: 20 }}>🎓 CEE Nepal Exam Portal</h1>
        {alert && <div className="alert alert-error">{alert}</div>}
        <form onSubmit={doLogin}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
        <div className="auth-hint">
          <strong>Demo accounts:</strong><br />
          Demo accounts are available upon request from the institution administrator.
        </div>
      </div>
    </div>
  );
}
