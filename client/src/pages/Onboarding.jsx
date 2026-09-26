import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const roles = [
  { id: 'student', icon: '🎒', title: 'I want to learn', text: 'Enroll in courses, track progress and submit assignments.' },
  { id: 'instructor', icon: '🧑‍🏫', title: 'I want to teach', text: 'Create courses, publish lessons and grade student work.' },
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
      toast.success('Welcome aboard!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-page single">
      <div className="card onboarding">
        <h2>Hi {user.name.split(' ')[0]} 👋</h2>
        <p className="muted">How would you like to use LearnSphere?</p>
        <div className="role-options">
          {roles.map((r) => (
            <button key={r.id} className={`role-option ${role === r.id ? 'selected' : ''}`} onClick={() => setRole(r.id)}>
              <span className="role-icon">{r.icon}</span>
              <strong>{r.title}</strong>
              <span className="muted small">{r.text}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-block" onClick={submit} disabled={busy}>
          {busy ? 'Setting up…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
