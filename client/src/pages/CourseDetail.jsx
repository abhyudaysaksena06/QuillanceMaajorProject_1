import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api';
import Loader from '../components/Loader';
import ProgressBar from '../components/ProgressBar';
import Avatar from '../components/Avatar';
import { formatDate, submissionBadge } from '../utils';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api(`/courses/${id}`).then(setCourse).catch((e) => {
    toast.error(e.message);
    navigate('/courses');
  }), [id, navigate]);
  useEffect(() => { load(); }, [load]);

  if (!course) return <Loader />;

  const enroll = async () => {
    setBusy(true);
    try {
      await api(`/courses/${id}/enroll`, { method: 'POST' });
      toast.success('Enrolled! Happy learning 🎉');
      await load();
    } catch (e) { toast.error(e.message); }
    setBusy(false);
  };

  const unenroll = async () => {
    if (!confirm('Leave this course? Your progress will be kept.')) return;
    await api(`/courses/${id}/enroll`, { method: 'DELETE' });
    toast.success('You left the course');
    load();
  };

  const done = new Set(course.completed_lesson_ids);
  const canOpen = course.is_enrolled || course.can_manage;
  const nextLesson = course.lessons.find((l) => !done.has(l.id)) || course.lessons[0];

  return (
    <>
      <div className="course-hero card">
        <div>
          <div className="course-meta">
            {course.category && <span className="tag">{course.category}</span>}
            <span className="tag tag-muted">{course.level}</span>
            {course.duration && <span className="tag tag-muted">⏱ {course.duration}</span>}
            {course.is_enrolled && <span className={`badge ${course.progress === 100 ? 'badge-success' : 'badge-info'}`}>{course.progress === 100 ? 'Completed' : 'In progress'}</span>}
            {!course.published && <span className="badge badge-warning">Draft</span>}
          </div>
          <h1>{course.title}</h1>
          <p className="muted pre-wrap">{course.description}</p>
          <div className="instructor-row">
            <Avatar user={course.instructor} size={32} />
            <span>{course.instructor?.name}</span>
            <span className="muted">· {course.lessons.length} modules · {course.student_count} students</span>
          </div>
        </div>
        <div className="hero-actions">
          {course.is_enrolled && <ProgressBar value={course.progress} />}
          {course.can_manage && <Link className="btn btn-primary" to={`/teach/${course.id}`}>Edit course</Link>}
          {!course.can_manage && !course.is_enrolled && (
            <button className="btn btn-primary" onClick={enroll} disabled={busy}>{busy ? 'Enrolling…' : 'Enroll now — Free'}</button>
          )}
          {course.is_enrolled && nextLesson && (
            <Link className="btn btn-primary" to={`/courses/${id}/lessons/${nextLesson.id}`}>
              {course.progress === 0 ? 'Start learning' : course.progress === 100 ? 'Review course' : 'Continue learning'}
            </Link>
          )}
          {course.is_enrolled && <button className="btn btn-ghost btn-sm" onClick={unenroll}>Leave course</button>}
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Course modules</h2>
          <ol className="lesson-list">
            {course.lessons.map((l, i) => (
              <li key={l.id} className={done.has(l.id) ? 'done' : ''}>
                <span className="lesson-index">{done.has(l.id) ? '✓' : i + 1}</span>
                {canOpen ? <Link to={`/courses/${id}/lessons/${l.id}`}>{l.title}</Link> : <span>{l.title} 🔒</span>}
                {l.duration_minutes && <span className="muted small">{l.duration_minutes} min</span>}
              </li>
            ))}
            {!course.lessons.length && <p className="muted">No modules yet.</p>}
          </ol>
        </section>
        <section className="card">
          <h2>Assignments</h2>
          {!canOpen && <p className="muted">Enroll to see assignments.</p>}
          <div className="list">
            {course.assignments.map((a) => (
              <Link key={a.id} to={`/assignments/${a.id}`} className="list-row">
                <div><strong>{a.title}</strong><div className="muted small">Due {formatDate(a.due_date)} · {a.max_points} pts</div></div>
                {course.can_manage ? <span className="badge">Manage</span> : (() => {
                  const b = submissionBadge(a.submission, a.max_points, a.due_date);
                  return <span className={`badge ${b.cls}`}>{b.text}</span>;
                })()}
              </Link>
            ))}
            {canOpen && !course.assignments.length && <p className="muted">No assignments for this course.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
