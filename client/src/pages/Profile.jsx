import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { formatDate } from '../utils';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setUser(await api('/auth/me', { method: 'PATCH', body: { name, bio } }));
      toast.success('Profile updated');
    } catch (err) { toast.error(err.message); }
    setBusy(false);
  };

  return (
    <>
      <div className="page-header"><h1>Profile</h1></div>
      <div className="card profile-card">
        <Avatar user={user} size={72} />
        <div>
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
          <span className={`role-pill role-${user.role}`}>{user.role}</span>
          <p className="muted small">Member since {formatDate(user.created_at)}</p>
        </div>
      </div>
      <form className="card form" onSubmit={save}>
        <label>Display name<input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Bio<textarea className="input" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself" /></label>
        <div className="form-actions"><button className="btn btn-primary" disabled={busy}>Save profile</button></div>
      </form>
    </>
  );
}
