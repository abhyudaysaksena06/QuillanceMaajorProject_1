import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/courses', label: 'Browse Courses', icon: '📚' },
  ];
  if (user.role === 'student') {
    links.push({ to: '/my-learning', label: 'My Courses', icon: '🎯' });
    links.push({ to: '/assignments', label: 'Assignments', icon: '📝' });
  }
  if (user.role === 'instructor' || user.role === 'admin') {
    links.push({ to: '/teach', label: 'Manage Courses', icon: '🧑‍🏫' });
    links.push({ to: '/teach/submissions', label: 'Submissions', icon: '📥' });
  }
  if (user.role === 'admin') links.push({ to: '/admin', label: 'Manage Users', icon: '🛡️' });
  links.push({ to: '/profile', label: 'Profile', icon: '👤' });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="brand">🎓 <span>LearnSphere</span></Link>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon">{l.icon}</span>{l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <Avatar user={user} />
          <div>
            <strong>{user.name}</strong>
            <span className={`role-pill role-${user.role}`}>{user.role}</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-block" onClick={handleLogout}>Sign out</button>
      </aside>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <main className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <div className="brand mobile-only">🎓 LearnSphere</div>
        </header>
        <div className="page"><Outlet /></div>
      </main>
    </div>
  );
}
