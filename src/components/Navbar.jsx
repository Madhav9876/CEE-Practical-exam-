export default function Navbar({ user, onLogout, extra }) {
  return (
    <div className="nav">
      <h1>🎓 CEE Nepal Exam Portal</h1>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span className="user">👤 {user.full_name} ({user.role})</span>
        {extra}
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
