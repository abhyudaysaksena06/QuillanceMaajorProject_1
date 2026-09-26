import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';

const features = [
  ['🔐', 'Secure authentication', 'Email/password or Google sign-in through Firebase, with role-based access for students, instructors and admins.'],
  ['📚', 'Course management', 'Instructors create courses and organise them into ordered modules with notes, videos, PDFs and code links.'],
  ['📝', 'Assignments', 'Publish assignments with deadlines and maximum marks. Students submit text, GitHub, Drive or project links.'],
  ['📈', 'Progress tracking', 'Module completion updates course progress bars, dashboards and completion status in real time.'],
  ['✅', 'Marks & feedback', 'Instructors review submissions, award marks, give feedback or request a resubmission.'],
  ['🛡️', 'Admin dashboard', 'Platform statistics plus central management of users, roles, courses and submissions.'],
];
const steps = ['Register', 'Browse courses', 'Enroll', 'Study modules', 'Submit assignments', 'Track progress', 'Complete course'];

export default function Home() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/public/courses`).then((r) => (r.ok ? r.json() : [])).then(setCourses).catch(() => {});
  }, []);

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="brand-dark">🎓 LearnSphere</Link>
        <nav>
          <a href="#about">About</a>
          <a href="#courses">Courses</a>
          {user ? <Link className="btn btn-primary btn-sm" to="/dashboard">Go to dashboard</Link> : (
            <>
              <Link to="/login">Sign in</Link>
              <Link className="btn btn-primary btn-sm" to="/register">Get started</Link>
            </>
          )}
        </nav>
      </header>

      <section className="landing-hero">
        <h1>Learn, teach and track progress, all in one place.</h1>
        <p>LearnSphere is a full-stack Learning Management System where students enroll in courses, study modules,
          submit assignments and track their progress, while instructors manage content and review work.</p>
        <div className="hero-cta">
          <Link className="btn btn-primary" to={user ? '/dashboard' : '/register'}>{user ? 'Open dashboard' : 'Create free account'}</Link>
          <a className="btn btn-ghost" href="#courses">Explore courses</a>
        </div>
      </section>

      <section id="about" className="landing-section">
        <h2>About the LMS</h2>
        <p className="muted section-lead">One platform connecting students and instructors through secure, role-based dashboards.</p>
        <div className="feature-grid">
          {features.map(([icon, title, text]) => (
            <div key={title} className="card feature"><span className="feature-icon">{icon}</span><h3>{title}</h3><p className="muted">{text}</p></div>
          ))}
        </div>
        <h3 className="center">How it works</h3>
        <div className="flow">{steps.map((s, i) => <span key={s} className="flow-step"><b>{i + 1}</b>{s}</span>)}</div>
      </section>

      <section id="courses" className="landing-section">
        <h2>Featured courses</h2>
        {courses.length ? (
          <div className="course-grid">{courses.map((c) => <CourseCard key={c.id} course={c} />)}</div>
        ) : <p className="muted center">Courses will appear here once instructors publish them.</p>}
      </section>

      <footer className="landing-footer">© {new Date().getFullYear()} LearnSphere LMS · Full Stack Development Major Project</footer>
    </div>
  );
}
