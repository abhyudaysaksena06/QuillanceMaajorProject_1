import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import CourseCard from '../components/CourseCard';
import ProgressBar from '../components/ProgressBar';
import { BarList, TrendChart, Donut } from '../components/Charts';
import { formatDate, relativeDue } from '../utils';

function Stat({ index, label, value, suffix }) {
  return (
    <div className="stat">
      <p className="eyebrow"><span>{label}</span><span>{index}</span></p>
      <div className="stat-value">{value}{suffix && <small>{suffix}</small>}</div>
    </div>
  );
}

const today = () => new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

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
  const first = user.name.split(' ')[0];

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">{today()}</p>
          <h1>{greeting()}, {first}.</h1>
          <p className="muted">{user.role === 'student'
            ? (s.pending_assignments ? `You have ${s.pending_assignments} assignment${s.pending_assignments > 1 ? 's' : ''} to hand in.` : 'Nothing due right now. Good time to finish a module.')
            : (s.pending_grading ? `${s.pending_grading} submission${s.pending_grading > 1 ? 's are' : ' is'} waiting for your review.` : 'All submissions are reviewed.')}</p>
        </div>
        {user.role === 'student'
          ? <Link to="/courses" className="btn btn-ghost">Browse catalog</Link>
          : <Link to="/teach/new" className="btn btn-primary">New course</Link>}
      </div>

      {data.role === 'student' ? (
        <>
          <div className="stats-grid">
            <Stat index="01" label="Enrolled" value={s.enrolled_courses} />
            <Stat index="02" label="Completed" value={s.completed_courses} />
            <Stat index="03" label="Modules done" value={s.completed_lessons} suffix={` / ${s.total_lessons}`} />
            <Stat index="04" label="Pending work" value={s.pending_assignments} />
            <Stat index="05" label="Avg. marks" value={s.average_grade ?? '—'} suffix={s.average_grade != null ? '%' : ''} />
          </div>

          <div className="grid-2">
            <section className="card">
              <div className="card-header"><h2>Progress</h2><span className="progress-label">{s.overall_progress}% overall</span></div>
              <div className="list">
                {courses.map((c) => (
                  <Link key={c.id} to={`/courses/${c.id}`} className="list-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '.5rem' }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between' }}><span>{c.title}</span><span className="muted small mono">{c.completed_lessons}/{c.total_lessons}</span></span>
                    <ProgressBar value={c.progress} total={c.total_lessons} done={c.completed_lessons} showLabel={false} />
                  </Link>
                ))}
                {!courses.length && <p className="muted">You haven't enrolled in anything yet. <Link to="/courses">Find a course →</Link></p>}
              </div>
            </section>
            <section className="card">
              <h2>Due next</h2>
              <div className="list">
                {data.upcoming.map((a) => (
                  <Link key={a.id} to={`/assignments/${a.id}`} className="list-row">
                    <div><div>{a.title}</div><div className="muted small">{a.course?.title}</div></div>
                    <span className="badge badge-warning" title={formatDate(a.due_date)}>{relativeDue(a.due_date)}</span>
                  </Link>
                ))}
                {!data.upcoming.length && <p className="muted">No upcoming deadlines.</p>}
              </div>
            </section>
          </div>

          <section className="card">
            <div className="card-header"><h2>Activity log</h2><span className="eyebrow">Recent</span></div>
            <ul className="log">
              {data.recent_activity.map((a, i) => (
                <li key={i} className={a.type}>
                  <Link to={a.link}>{a.text}</Link>
                  <span className="when">{formatDate(a.at)}{a.course ? ` · ${a.course}` : ''}</span>
                </li>
              ))}
              {!data.recent_activity.length && <li>Nothing yet. Your first finished module will show up here.</li>}
            </ul>
          </section>

          {data.certificates?.length > 0 && (
            <section className="card">
              <h2>Certificates</h2>
              <div className="list">
                {data.certificates.map((c) => (
                  <Link key={c.certificate_id} to={`/certificates/${c.certificate_id}`} className="list-row">
                    <span>{c.course?.title}</span>
                    <span className="muted small mono">{c.certificate_id} · {formatDate(c.completed_at)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {courses.length > 0 && (
            <>
              <h2 className="section-title">Continue learning</h2>
              <div className="course-grid">
                {courses.filter((c) => c.progress < 100).slice(0, 3).map((c, i) => <CourseCard key={c.id} course={c} progress={c.progress} index={i} />)}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="stats-grid">
            <Stat index="01" label="Courses" value={s.total_courses} suffix={` · ${s.published_courses} live`} />
            <Stat index="02" label="Learners" value={s.total_students} />
            <Stat index="03" label="Enrollments" value={s.total_enrollments} />
            <Stat index="04" label="To review" value={s.pending_grading} />
            {s.total_users !== undefined && <Stat index="05" label="Users" value={s.total_users} />}
          </div>
          {data.charts && (
            <>
              <section className="card">
                <div className="card-header"><h2>Enrollments, last 30 days</h2><span className="progress-label">{data.charts.completion_rate}% completion rate</span></div>
                <TrendChart data={data.charts.enrollment_trend} />
              </section>
              <div className="grid-2">
                <section className="card"><h2>Learners per course</h2><BarList data={data.charts.enrollments_per_course} /></section>
                <section className="card">
                  <h2>Submissions</h2>
                  <Donut segments={[
                    { label: 'Awaiting review', value: data.charts.submissions[0].count, tone: 'tone-warn' },
                    { label: 'Graded', value: data.charts.submissions[1].count, tone: 'tone-ok' },
                    { label: 'Resubmission requested', value: data.charts.submissions[2].count, tone: 'tone-accent' },
                  ]} />
                </section>
              </div>
            </>
          )}
          <section className="card">
            <div className="card-header">
              <h2>Waiting for review</h2>
              <Link to="/teach/submissions" className="btn btn-ghost btn-sm">All submissions</Link>
            </div>
            <div className="list">
              {data.pending_submissions.map((p) => (
                <Link key={p.id} to={`/assignments/${p.assignment.id}`} className="list-row">
                  <div>{p.student?.name} <span className="muted">handed in</span> {p.assignment.title}
                    <div className="muted small">{p.assignment.course?.title}</div></div>
                  <span className="muted small mono">{formatDate(p.submitted_at)}</span>
                </Link>
              ))}
              {!data.pending_submissions.length && <p className="muted">All caught up.</p>}
            </div>
          </section>
        </>
      )}
    </>
  );
}
