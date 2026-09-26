import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api';
import Loader from '../components/Loader';
import ProgressBar from '../components/ProgressBar';
import { toEmbedUrl, RESOURCE_TYPES } from '../utils';

export default function LessonView() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);

  useEffect(() => { api(`/courses/${courseId}`).then(setCourse).catch(() => navigate('/courses')); }, [courseId, navigate]);
  if (!course) return <Loader />;

  const idx = course.lessons.findIndex((l) => l.id === lessonId);
  const lesson = course.lessons[idx];
  if (!lesson || (!course.is_enrolled && !course.can_manage)) {
    return <div className="empty card">Module unavailable. <Link to={`/courses/${courseId}`}>Back to course</Link></div>;
  }
  const done = course.completed_lesson_ids.includes(lessonId);
  const prev = course.lessons[idx - 1];
  const next = course.lessons[idx + 1];
  const embed = toEmbedUrl(lesson.video_url);

  const toggle = async () => {
    try {
      await api(`/lessons/${lessonId}/complete`, { method: done ? 'DELETE' : 'POST' });
      const ids = done ? course.completed_lesson_ids.filter((x) => x !== lessonId) : [...course.completed_lesson_ids, lessonId];
      setCourse({ ...course, completed_lesson_ids: ids, progress: Math.round((ids.length / course.lessons.length) * 100) });
      if (!done) {
        toast.success('Module completed!');
        if (next) navigate(`/courses/${courseId}/lessons/${next.id}`);
      }
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="lesson-layout">
      <aside className="card lesson-sidebar">
        <Link to={`/courses/${courseId}`} className="muted small">← {course.title}</Link>
        {course.is_enrolled && <ProgressBar value={course.progress} />}
        <ol className="lesson-list compact">
          {course.lessons.map((l, i) => (
            <li key={l.id} className={`${course.completed_lesson_ids.includes(l.id) ? 'done' : ''} ${l.id === lessonId ? 'current' : ''}`}>
              <span className="lesson-index">{course.completed_lesson_ids.includes(l.id) ? '✓' : i + 1}</span>
              <Link to={`/courses/${courseId}/lessons/${l.id}`}>{l.title}</Link>
            </li>
          ))}
        </ol>
      </aside>
      <article className="card lesson-content">
        <p className="muted small">Module {idx + 1} of {course.lessons.length}</p>
        <h1>{lesson.title}</h1>
        {embed ? (
          <div className="video"><iframe src={embed} title={lesson.title} allowFullScreen /></div>
        ) : lesson.video_url ? (
          <p><a href={lesson.video_url} target="_blank" rel="noreferrer">▶ Watch video</a></p>
        ) : null}
        <div className="prose pre-wrap">{lesson.content || 'No written notes for this module.'}</div>
        {lesson.resources?.length > 0 && (
          <div className="resources">
            <h3>Learning materials</h3>
            {lesson.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noreferrer" className="resource">
                <span className="tag tag-muted">{RESOURCE_TYPES[r.type] || '🔗 Link'}</span>{r.label}
              </a>
            ))}
          </div>
        )}
        <div className="lesson-nav">
          {prev ? <Link className="btn btn-ghost" to={`/courses/${courseId}/lessons/${prev.id}`}>← Previous</Link> : <span />}
          {course.is_enrolled && (
            <button className={`btn ${done ? 'btn-ghost' : 'btn-success'}`} onClick={toggle}>
              {done ? '↺ Mark as incomplete' : '✓ Mark as complete'}
            </button>
          )}
          {next ? <Link className="btn btn-ghost" to={`/courses/${courseId}/lessons/${next.id}`}>Next →</Link> : <span />}
        </div>
      </article>
    </div>
  );
}
