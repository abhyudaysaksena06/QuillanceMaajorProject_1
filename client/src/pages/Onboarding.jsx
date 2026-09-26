import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const roles = [
  { id: 'student', title: 'I want to learn', text: 'Enroll in courses, work through modules, submit assignments and follow your progress.' },
  { id: 'instructor', title: 'I want to teach', text: 'Build courses and modules, publish assignments, and review and mark student work.' },
];

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const [role, setRole] = useState('student');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (user.onboarded) return <Navigate to="/dashboard" replace />;

  const submit = async () => {
    setBusy(true);
    try {
      setUser(await api('/auth/onboard', { method: 'POST', body: { role } }));
      toast.success('You are all set');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-page single">
      <div className="card onboarding rise">
        <p className="eyebrow">[ One last thing ]</p>
        <h1 style={{ margin: 0 }}>Hello, {user.name.split(' ')[0]}.</h1>
        <p className="muted" style={{ margin: 0 }}>How will you be using LearnSphere? This sets up your workspace.</p>
        <div className="role-options">
          {roles.map((r, i) => (
            <button key={r.id} className={`role-option ${role === r.id ? 'selected' : ''}`} onClick={() => setRole(r.id)}>
              <span className="role-num">0{i + 1}</span>
              <strong>{r.title}</strong>
              <span className="muted small">{r.text}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-block" onClick={submit} disabled={busy}>{busy ? 'Setting up' : 'Continue'}</button>
      </div>
    </div>
  );
}
