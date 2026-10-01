import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const messages = {
  'auth/wrong-password': 'Current password is incorrect.',
  'auth/invalid-credential': 'Current password is incorrect.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/provider-already-linked': 'This sign-in method is already linked.',
  'auth/credential-already-in-use': 'That Google account is already used by another LearnSphere account.',
  'auth/email-already-in-use': 'That email already belongs to another account.',
  'auth/popup-closed-by-user': 'Popup closed before finishing.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
};
const friendly = (err) => messages[err.code] || err.message;

export default function SecuritySettings() {
  const { firebaseUser, providers, createPassword, changePassword, linkGoogle } = useAuth();
  const [linked, setLinked] = useState(providers());
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const hasPassword = linked.includes('password');
  const hasGoogle = linked.includes('google.com');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.next.length < 6) return toast.error('Password must be at least 6 characters.');
    if (form.next !== form.confirm) return toast.error('Passwords do not match.');
    setBusy(true);
    try {
      if (hasPassword) {
        await changePassword(form.current, form.next);
        toast.success('Password changed');
      } else {
        await createPassword(form.next);
        toast.success('Password created. You can now sign in with your email too.');
      }
      setForm({ current: '', next: '', confirm: '' });
      setLinked(providers());
    } catch (err) { toast.error(friendly(err)); }
    setBusy(false);
  };

  const connectGoogle = async () => {
    try {
      await linkGoogle();
      toast.success('Google account linked');
      setLinked(providers());
    } catch (err) { toast.error(friendly(err)); }
  };

  return (
    <section className="card">
      <h2>Sign-in &amp; security</h2>
      <div className="list" style={{ marginBottom: '1.4rem' }}>
        <div className="list-row">
          <div><strong>Email &amp; password</strong><div className="muted small">{firebaseUser?.email}</div></div>
          {hasPassword ? <span className="badge badge-success">Enabled</span> : <span className="badge">Not set</span>}
        </div>
        <div className="list-row">
          <div><strong>Google</strong><div className="muted small">Sign in with the Google account for this email</div></div>
          {hasGoogle ? <span className="badge badge-success">Linked</span>
            : <button className="btn btn-ghost btn-sm" onClick={connectGoogle}>Link Google</button>}
        </div>
      </div>
      <form className="form" onSubmit={submit}>
        <p className="eyebrow">{hasPassword ? 'Change password' : 'Create a password'}</p>
        {!hasPassword && <p className="muted small" style={{ margin: 0 }}>Add a password so you can also sign in with {firebaseUser?.email} and a password. Your courses and progress stay the same.</p>}
        {hasPassword && (
          <label>Current password<input className="input" type="password" autoComplete="current-password" value={form.current} onChange={set('current')} required /></label>
        )}
        <div className="form-row">
          <label>New password<input className="input" type="password" autoComplete="new-password" value={form.next} onChange={set('next')} required minLength={6} /></label>
          <label>Confirm new password<input className="input" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} required minLength={6} /></label>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving' : hasPassword ? 'Change password' : 'Create password'}</button>
        </div>
      </form>
    </section>
  );
}
