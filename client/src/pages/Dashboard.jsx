import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import CourseCard from '../components/CourseCard';
import ProgressBar from '../components/ProgressBar';
import { formatDate, relativeDue } from '../utils';

function Stat({ icon, label, value, accent }) {
  return (
    <div className={`stat card accent-${accent}`}>
      <span className="stat-icon">{icon}</span>
      <div><div className="stat-value">{value}</div><div className="muted small">{label}</div></div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api('/dashboard').then(setData);
    if (user.role === 'student') api('/courses/enrolled').then(setCourses);
  }, [user.role]);

  if (!data) return <Loader />;
  const s = data.stats;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user.name.split(' ')[0]} 👋</h1>
          <p className="muted">{user.role === 'student' ? "Here's how your learning is going." : "Here's an overview of your teaching."}</p>
        </div>
      </div>

      {data.role === 'student' ? (
        <>
          <div className="stats-grid">
            <Stat icon="📚" label="Enrolled courses" value={s.enrolled_courses} accent="indigo" />
            <Stat icon="✅" label={`Lessons completed of ${s.total_lessons}`} value={s.completed_lessons} accent="green" />
            <Stat icon="📝" label="Pending assignments" value={s.pending_assignments} accent="amber" />
            <Stat icon="🏆" label="Average grade" value={s.average_grade == null ? '—' : `${s.average_grade}%`} accent="pink" />
          </div>
          <div className="grid-2">
            <section className="card">
              <h2>Overall progress</h2>
              <ProgressBar value={s.overall_progress} />
              <div className="list">
                {courses.slice(0, 4).map((c) => (
                  <Link key={c.id} to={`/courses/${c.id}`} className="list-row">
                    <span>{c.title}</span>
                    <span className="w-40"><ProgressBar value={c.progress} /></span>
                  </Link>
                ))}
                {!courses.length && <p className="muted">You haven't enrolled yet. <Link to="/courses">Browse courses →</Link></p>}
              </div>
            </section>
            <section className="card">
              <h2>Upcoming deadlines</h2>
              <div className="list">
                {data.upcoming.map((a) => (
                  <Link key={a.id} to={`/assignments/${a.id}`} className="list-row">
                    <div><strong>{a.title}</strong><div className="muted small">{a.course?.title}</div></div>
                    <span className="badge badge-warning" title={formatDate(a.due_date)}>{relativeDue(a.due_date)}</span>
                  </Link>
                ))}
                {!data.upcoming.length && <p className="muted">No upcoming deadlines 🎉</p>}
              </div>
            </section>
          </div>
          {courses.length > 0 && (
            <>
              <h2 className="section-title">Continue learning</h2>
              <div className="course-grid">
                {courses.slice(0, 3).map((c) => <CourseCard key={c.id} course={c} progress={c.progress} />)}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="stats-grid">
            <Stat icon="📚" label={`Courses (${s.published_courses} published)`} value={s.total_courses} accent="indigo" />
            <Stat icon="👥" label="Unique students" value={s.total_students} accent="green" />
            <Stat icon="🧾" label="Total enrollments" value={s.total_enrollments} accent="amber" />
            {s.total_users !== undefined
              ? <Stat icon="🛡️" label="Registered users" value={s.total_users} accent="pink" />
              : <Stat icon="📝" label="Awaiting grading" value={s.pending_grading} accent="pink" />}
          </div>
          <section className="card">
            <div className="card-header">
              <h2>Submissions awaiting grading</h2>
              <Link to="/teach" className="btn btn-primary btn-sm">Manage courses</Link>
            </div>
            <div className="list">
              {data.pending_submissions.map((p) => (
                <Link key={p.id} to={`/assignments/${p.assignment.id}`} className="list-row">
                  <div><strong>{p.student?.name}</strong> submitted <strong>{p.assignment.title}</strong>
                    <div className="muted small">{p.assignment.course?.title}</div></div>
                  <span className="muted small">{formatDate(p.submitted_at)}</span>
                </Link>
              ))}
              {!data.pending_submissions.length && <p className="muted">All caught up — nothing to grade.</p>}
            </div>
          </section>
        </>
      )}
    </>
  );
}
