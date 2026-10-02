import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';
import Reveal from '../components/Reveal';

const features = [
  ['01', 'Accounts & roles', 'Register with email or Google. Students, instructors and admins each get their own workspace.'],
  ['02', 'Courses & modules', 'Courses are split into ordered modules: notes, a video, and links to PDFs, code and exercises.'],
  ['03', 'Assignments', 'Deadlines and maximum marks. Submit an answer, a GitHub repo, a Drive link or a live URL.'],
  ['04', 'Progress', 'Each finished module fills one block of the course bar, and your dashboard shows the totals.'],
  ['05', 'Marks & feedback', 'Instructors review work, award marks, write feedback, or send it back for another try.'],
  ['06', 'Administration', 'Admins manage users and roles and can see how the whole platform is doing.'],
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
        <Reveal><p className="eyebrow">[ About the LMS ]</p>
          <h2>What you can do here</h2></Reveal>
        <Reveal delay={120}><p className="section-lead">Students, instructors and admins each get their own pages, and all the work is saved in one place.</p></Reveal>
        <div className="feature-grid">
          {features.map(([n, title, text]) => (
            <Reveal key={n} delay={(Number(n) - 1) % 3 * 110} className="feature"><span className="eyebrow accent">{n}</span><h3>{title}</h3><p>{text}</p></Reveal>
          ))}
        </div>
      </section>

      <section className="manifesto">
        <div>
          <Reveal as="p">read the module.</Reveal>
          <Reveal as="p" delay={140} className="text-stroke">hand in the work.</Reveal>
          <Reveal as="p" delay={280}>watch the bar fill.</Reveal>
        </div>
      </section>

      <section className="landing-section">
        <span className="section-index" aria-hidden>02</span>
        <Reveal><p className="eyebrow">[ How it works ]</p>
          <h2>How a course works</h2></Reveal>
        <ol className="flow" style={{ marginTop: '2.5rem' }}>
          {steps.map((s, i) => <Reveal as="li" key={s} delay={i * 70}><small>STEP {String(i + 1).padStart(2, '0')}</small>{s}</Reveal>)}
        </ol>
      </section>

      <section id="courses" className="landing-section">
        <span className="section-index" aria-hidden>03</span>
        <Reveal><p className="eyebrow">[ Catalog ]</p>
          <h2>Courses you can join</h2></Reveal>
        {courses.length ? (
          <div className="course-grid" style={{ marginTop: '2.5rem' }}>{courses.map((c, i) => <Reveal key={c.id} delay={i % 3 * 110}><CourseCard course={c} index={i} /></Reveal>)}</div>
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
