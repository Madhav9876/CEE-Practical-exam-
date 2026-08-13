import { useState, useEffect, useCallback } from 'react';
import { api, setToken, getToken } from './api';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import AttemptPlayer from './components/AttemptPlayer';
import ResultView from './components/ResultView';
import ReviewResult from './components/ReviewResult';
import SetDetail from './components/SetDetail';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [navData, setNavData] = useState(null);

  const loadMe = useCallback(async () => {
    try {
      const data = await api('/auth/me');
      setUser(data);
      setView(data.role === 'student' ? 'student-dashboard' : 'teacher-dashboard');
    } catch (e) {
      setToken(null);
      setUser(null);
      setView('login');
    }
  }, []);

  useEffect(() => {
    const t = getToken();
    if (t) loadMe();
  }, [loadMe]);

  const navigate = (newView, data = null) => {
    setView(newView);
    setNavData(data);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setView('login');
    setNavData(null);
  };

  if (!getToken() || !user) {
    return <Login onLogin={(u, t) => { setToken(t); setUser(u); setView(u.role === 'student' ? 'student-dashboard' : 'teacher-dashboard'); }} />;
  }

  if (user.role === 'student') {
    if (view === 'attempt') {
      return <AttemptPlayer user={user} attemptData={navData} onLogout={handleLogout} onBack={() => navigate('student-dashboard')} />;
    }
    if (view === 'result') {
      return <ResultView user={user} resultData={navData} onLogout={handleLogout} onBack={() => navigate('student-dashboard')} />;
    }
    return <StudentDashboard user={user} onLogout={handleLogout} navigate={navigate} />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  if (view === 'review') {
    return <ReviewResult user={user} reviewData={navData} onLogout={handleLogout} onBack={() => navigate('teacher-dashboard')} />;
  }

  if (view === 'viewSet') {
    return <SetDetail user={user} setData={navData} onLogout={handleLogout} onBack={() => navigate('teacher-dashboard')} />;
  }

  return <TeacherDashboard user={user} onLogout={handleLogout} navigate={navigate} />;
}
