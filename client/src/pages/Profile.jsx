import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [uploading, setUploading] = useState(false);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    if (user.role === 'student') api('/courses/enrolled').then((cs) => setCertificates(cs.filter((c) => c.certificate_id)));
  }, [user.role]);

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be 2 MB or smaller');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      setUser(await api('/auth/me/avatar', { method: 'POST', body: form }));
      toast.success('Photo updated');
    } catch (err) { toast.error(err.message); }
    setUploading(false);
    e.target.value = '';
  };

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
      <div className="page-header"><div><p className="eyebrow">[ Account ]</p><h1>Profile</h1></div></div>
      <div className="card profile-card">
        <div className="avatar-edit">
          <Avatar user={user} size={72} />
          <label className="btn btn-ghost btn-sm">
            {uploading ? 'Uploading' : 'Change photo'}
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadAvatar} disabled={uploading} />
          </label>
        </div>
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
      {certificates.length > 0 && (
        <section className="card">
          <h2>Certificates</h2>
          <div className="list">
            {certificates.map((c) => (
              <Link key={c.certificate_id} to={`/certificates/${c.certificate_id}`} className="list-row">
                <span>{c.title}</span><span className="muted small mono">{c.certificate_id}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
