import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const firebaseMessages = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/account-exists-with-different-credential': 'This email already has an account. Sign in with your password, then link Google from your Profile.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in (or use Google), then create a password from your Profile.',
};
const friendly = (err) => firebaseMessages[err.code] || err.message;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.3 44 33 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

export default function Login({ mode = 'login' }) {
  const { user, loading, login, loginWithEmail, register, resetPassword, error } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const location = useLocation();
  const isRegister = mode === 'register';

  if (loading) return <Loader full />;
  if (user) return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (isRegister && form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (isRegister && form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      if (isRegister) {
        await register(form.name.trim(), form.email.trim(), form.password);
        toast.success('Account created!');
      } else {
        await loginWithEmail(form.email.trim(), form.password);
      }
    } catch (err) {
      toast.error(friendly(err));
    }
    setBusy(false);
  };

  const google = async () => {
    setBusy(true);
    try { await login(); } catch (err) { if (err.code !== 'auth/popup-closed-by-user') toast.error(friendly(err)); }
    setBusy(false);
  };

  const forgot = async () => {
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setErrors({ email: 'Enter your email above first' });
    try {
      await resetPassword(form.email.trim());
      toast.success('Password reset email sent');
    } catch (err) { toast.error(friendly(err)); }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <Link to="/" className="wordmark auth-brand">LearnSphere <small>LMS</small></Link>
        <div>
          <p className="eyebrow">[ {isRegister ? 'New here' : 'Returning'} ]</p>
          <h1>{isRegister ? 'Start a new chapter.' : 'Pick up where you left off.'}</h1>
          <p>Courses, modules, assignments and progress, for students, instructors and administrators.</p>
          <ul className="feature-list">
            <li><span>01</span>Ordered modules with notes, video and materials</li>
            <li><span>02</span>Progress that fills in as you finish each module</li>
            <li><span>03</span>Assignments with marks and written feedback</li>
            <li><span>04</span>Role-based access, verified on every request</li>
          </ul>
        </div>
        <span className="watermark-deva" aria-hidden>विद्या</span>
      </div>
      <div className="auth-card card">
        <p className="eyebrow">{isRegister ? 'Registration' : 'Sign in'}</p>
        <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-google btn-block" onClick={google} disabled={busy}>
          <GoogleIcon /> Continue with Google
        </button>
        <div className="divider"><span>or with email</span></div>
        <form className="form" onSubmit={submit} noValidate>
          {isRegister && (
            <label>Full name<input className={`input ${errors.name ? 'invalid' : ''}`} value={form.name} onChange={set('name')} autoComplete="name" />
              {errors.name && <span className="field-error">{errors.name}</span>}</label>
          )}
          <label>Email<input className={`input ${errors.email ? 'invalid' : ''}`} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            {errors.email && <span className="field-error">{errors.email}</span>}</label>
          <label>Password<input className={`input ${errors.password ? 'invalid' : ''}`} type="password" value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} />
            {errors.password && <span className="field-error">{errors.password}</span>}</label>
          {isRegister && (
            <label>Confirm password<input className={`input ${errors.confirm ? 'invalid' : ''}`} type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}</label>
          )}
          {!isRegister && <button type="button" className="link-btn" onClick={forgot}>Forgot password?</button>}
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="muted small center">
          {isRegister ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}
        </p>
      </div>
    </div>
  );
}
