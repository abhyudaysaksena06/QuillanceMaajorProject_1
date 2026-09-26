import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

function linksFor(role) {
  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/courses', label: 'Catalog' },
  ];
  if (role === 'student') {
    links.push({ to: '/my-learning', label: 'My Courses' });
    links.push({ to: '/assignments', label: 'Assignments' });
  } else {
    links.push({ to: '/teach', label: 'Manage' });
    links.push({ to: '/teach/submissions', label: 'Submissions' });
  }
  if (role === 'admin') links.push({ to: '/admin', label: 'Users' });
  links.push({ to: '/profile', label: 'Profile' });
  return links;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const links = linksFor(user.role);

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <header className="topnav">
        <div className="topnav-inner">
          <Link to="/dashboard" className="wordmark">LearnSphere <small>LMS · {user.role}</small></Link>
          <nav className="navlinks">
            {links.map((l, i) => (
              <NavLink key={l.to} to={l.to} end className={({ isActive }) => `link-underline ${isActive ? 'active' : ''}`}>
                <small>0{i + 1}</small>{l.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-user">
            <Avatar user={user} size={30} />
            <button className="btn btn-ghost btn-sm signout" onClick={handleLogout}>Sign out</button>
          </div>
          <button className="menu-btn" onClick={() => setOpen(true)}>Menu</button>
        </div>
      </header>

      <div className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <span className="wordmark">LearnSphere</span>
          <button className="menu-btn" onClick={() => setOpen(false)}>Close</button>
        </div>
        <nav>
          {links.map((l, i) => (
            <NavLink key={l.to} to={l.to} end className={({ isActive }) => (isActive ? 'active' : '')}>
              <small>0{i + 1}</small>{l.label}
            </NavLink>
          ))}
        </nav>
        <p className="eyebrow" style={{ marginTop: '2rem' }}>Signed in as</p>
        <p>{user.name} <span className={`role-pill role-${user.role}`}>{user.role}</span></p>
        <button className="btn btn-ghost btn-block" onClick={handleLogout}>Sign out</button>
      </div>

      <main className="main">
        <div className="page" key={location.pathname}><Outlet /></div>
      </main>
    </>
  );
}
