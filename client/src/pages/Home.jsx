import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';

const features = [
  ['01', 'Accounts & roles', 'Register with email or Google. Students, instructors and admins each get their own workspace.'],
  ['02', 'Courses & modules', 'Courses are split into ordered modules: notes, a video, and links to PDFs, code and exercises.'],
  ['03', 'Assignments', 'Deadlines and maximum marks. Submit an answer, a GitHub repo, a Drive link or a live URL.'],
  ['04', 'Progress', 'Every finished module fills one tick on the course bar. Dashboards add it all up.'],
  ['05', 'Marks & feedback', 'Instructors review work, award marks, write feedback, or send it back for another try.'],
  ['06', 'Administration', 'One place for users, roles, enrollments and platform numbers.'],
];
const steps = ['Register', 'Browse', 'Enroll', 'Study modules', 'Submit work', 'Get marks', 'Complete'];

export default function Home() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/public/courses`).then((r) => (r.ok ? r.json() : [])).then(setCourses).catch(() => {});
  }, []);

  const ticker = Array.from({ length: 6 }, (_, i) => <span key={i}>Learn it · Build it · Hand it in <b>✳</b></span>);

  return (
    <div className="landing">
      <div className="marquee" aria-hidden><div className="marquee-track">{ticker}{ticker}</div></div>

      <header className="landing-nav">
        <Link to="/" className="wordmark">LearnSphere <small>Learning Management System</small></Link>
        <nav>
          <a href="#about" className="link-underline">About</a>
          <a href="#courses" className="link-underline">Courses</a>
          {user ? <Link className="btn btn-primary btn-sm" to="/dashboard">Dashboard</Link> : (
            <>
              <Link to="/login" className="link-underline">Sign in</Link>
              <Link className="btn btn-primary btn-sm" to="/register">Join</Link>
            </>
          )}
        </nav>
      </header>

      <section className="landing-hero">
        <span className="hero-deva" aria-hidden>विद्या</span>
        <div>
          <p className="eyebrow rise" style={{ display: 'flex', gap: '.7rem', alignItems: 'center' }}><span className="dot-ring" /> Courses · Modules · Assignments · Progress</p>
          <h1 className="rise" style={{ '--d': '120ms' }}>Learning, kept in one place.</h1>
          <p className="lead rise" style={{ '--d': '260ms' }}>
            LearnSphere is where students enroll, study module by module, hand in their work and see how far they've
            come, while instructors build courses and give marks and feedback.
          </p>
          <div className="hero-cta rise" style={{ '--d': '380ms' }}>
            <Link className="btn btn-primary" to={user ? '/dashboard' : '/register'}>{user ? 'Open your dashboard' : 'Create an account'}</Link>
            <a href="#courses" className="link-underline">browse the catalog</a>
          </div>
        </div>
        <div className="hero-meta rise" style={{ '--d': '500ms' }}>
          <div><p className="eyebrow">For students</p><p>Enroll → study → submit</p></div>
          <div><p className="eyebrow">For instructors</p><p>Build → publish → review</p></div>
          <div><p className="eyebrow">Stack</p><p>React · Express · Supabase</p></div>
        </div>
      </section>

      <section id="about" className="landing-section">
        <span className="section-index" aria-hidden>01</span>
        <p className="eyebrow">[ About the LMS ]</p>
        <h2>Everything a course needs, nothing it doesn't.</h2>
        <p className="section-lead">One system with separate spaces for learners and teachers, and a shared record of the work.</p>
        <div className="feature-grid">
          {features.map(([n, title, text]) => (
            <div key={n} className="feature"><span className="eyebrow accent">{n}</span><h3>{title}</h3><p>{text}</p></div>
          ))}
        </div>
      </section>

      <section className="manifesto">
        <div>
          <p>read the module.</p>
          <p className="text-stroke">hand in the work.</p>
          <p>watch the bar fill.</p>
        </div>
      </section>

      <section className="landing-section">
        <span className="section-index" aria-hidden>02</span>
        <p className="eyebrow">[ How it works ]</p>
        <h2>Seven steps, start to finish.</h2>
        <ol className="flow" style={{ marginTop: '2.5rem' }}>
          {steps.map((s, i) => <li key={s}><small>STEP {String(i + 1).padStart(2, '0')}</small>{s}</li>)}
        </ol>
      </section>

      <section id="courses" className="landing-section">
        <span className="section-index" aria-hidden>03</span>
        <p className="eyebrow">[ Catalog ]</p>
        <h2>On the shelf right now.</h2>
        {courses.length ? (
          <div className="course-grid" style={{ marginTop: '2.5rem' }}>{courses.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}</div>
        ) : <p className="section-lead">Courses show up here as soon as an instructor publishes one.</p>}
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} LearnSphere</span>
        <span>Full Stack Development · Major Project</span>
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0 }); }} className="link-underline">Back to top ↑</a>
      </footer>
    </div>
  );
}
