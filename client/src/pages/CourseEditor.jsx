import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api';
import Loader from '../components/Loader';
import ProgressBar from '../components/ProgressBar';
import { formatDate, toLocalInput } from '../utils';

const emptyCourse = { title: '', description: '', category: '', level: 'Beginner', thumbnail_url: '', published: false };
const emptyLesson = { title: '', content: '', video_url: '', duration_minutes: '' };
const emptyAssignment = { title: '', description: '', due_date: '', max_points: 100 };

export default function CourseEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyCourse);
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState('details');
  const [lesson, setLesson] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const c = await api(`/courses/${id}`);
    setCourse(c);
    setForm({ ...emptyCourse, ...Object.fromEntries(Object.keys(emptyCourse).map((k) => [k, c[k] ?? emptyCourse[k]])) });
    api(`/courses/${id}/students`).then(setStudents);
  }, [id]);

  useEffect(() => { if (!isNew) load().catch((e) => { toast.error(e.message); navigate('/teach'); }); }, [isNew, load, navigate]);
  if (!isNew && !course) return <Loader />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const saveCourse = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isNew) {
        const c = await api('/courses', { method: 'POST', body: form });
        toast.success('Course created — now add lessons');
        navigate(`/teach/${c.id}`);
      } else {
        await api(`/courses/${id}`, { method: 'PATCH', body: form });
        toast.success('Course saved');
        load();
      }
    } catch (err) { toast.error(err.message); }
    setBusy(false);
  };

  const deleteCourse = async () => {
    if (!confirm('Delete this course and all its lessons, assignments and enrollments?')) return;
    await api(`/courses/${id}`, { method: 'DELETE' });
    toast.success('Course deleted');
    navigate('/teach');
  };

  const saveLesson = async (e) => {
    e.preventDefault();
    const body = { ...lesson, duration_minutes: lesson.duration_minutes ? Number(lesson.duration_minutes) : null };
    try {
      if (lesson.id) await api(`/lessons/${lesson.id}`, { method: 'PATCH', body });
      else await api('/lessons', { method: 'POST', body: { ...body, course_id: id } });
      toast.success('Lesson saved');
      setLesson(null);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const moveLesson = async (i, dir) => {
    const a = course.lessons[i];
    const b = course.lessons[i + dir];
    if (!b) return;
    await Promise.all([
      api(`/lessons/${a.id}`, { method: 'PATCH', body: { position: b.position } }),
      api(`/lessons/${b.id}`, { method: 'PATCH', body: { position: a.position } }),
    ]);
    load();
  };

  const deleteLesson = async (l) => {
    if (!confirm(`Delete lesson "${l.title}"?`)) return;
    await api(`/lessons/${l.id}`, { method: 'DELETE' });
    load();
  };

  const saveAssignment = async (e) => {
    e.preventDefault();
    const body = {
      title: assignment.title, description: assignment.description, max_points: Number(assignment.max_points),
      due_date: assignment.due_date ? new Date(assignment.due_date).toISOString() : null,
    };
    try {
      if (assignment.id) await api(`/assignments/${assignment.id}`, { method: 'PATCH', body });
      else await api('/assignments', { method: 'POST', body: { ...body, course_id: id } });
      toast.success('Assignment saved');
      setAssignment(null);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const deleteAssignment = async (a) => {
    if (!confirm(`Delete assignment "${a.title}" and its submissions?`)) return;
    await api(`/assignments/${a.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <>
      <Link to="/teach" className="muted small">← My courses</Link>
      <div className="page-header">
        <h1>{isNew ? 'Create a new course' : form.title || 'Edit course'}</h1>
        {!isNew && <Link to={`/courses/${id}`} className="btn btn-ghost">View as student</Link>}
      </div>

      {!isNew && (
        <div className="tabs">
          {['details', 'lessons', 'assignments', 'students'].map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      )}

      {tab === 'details' && (
        <form className="card form" onSubmit={saveCourse}>
          <label>Title *<input className="input" value={form.title} onChange={set('title')} required /></label>
          <label>Description<textarea className="input" rows={5} value={form.description} onChange={set('description')} /></label>
          <div className="form-row">
            <label>Category<input className="input" value={form.category} onChange={set('category')} placeholder="e.g. Web Development" /></label>
            <label>Level
              <select className="input" value={form.level} onChange={set('level')}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </label>
          </div>
          <label>Thumbnail image URL<input className="input" type="url" value={form.thumbnail_url} onChange={set('thumbnail_url')} placeholder="https://" /></label>
          <label className="checkbox"><input type="checkbox" checked={form.published} onChange={set('published')} /> Published (visible in the catalog)</label>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}>{isNew ? 'Create course' : 'Save changes'}</button>
            {!isNew && <button type="button" className="btn btn-danger" onClick={deleteCourse}>Delete course</button>}
          </div>
        </form>
      )}

      {tab === 'lessons' && (
        <section className="card">
          <div className="card-header"><h2>Lessons</h2><button className="btn btn-primary btn-sm" onClick={() => setLesson(emptyLesson)}>+ Add lesson</button></div>
          {lesson && (
            <form className="form inset" onSubmit={saveLesson}>
              <label>Title *<input className="input" value={lesson.title} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} required /></label>
              <div className="form-row">
                <label>Video URL (YouTube / Vimeo)<input className="input" type="url" value={lesson.video_url || ''} onChange={(e) => setLesson({ ...lesson, video_url: e.target.value })} /></label>
                <label>Duration (min)<input className="input" type="number" min={0} value={lesson.duration_minutes || ''} onChange={(e) => setLesson({ ...lesson, duration_minutes: e.target.value })} /></label>
              </div>
              <label>Content<textarea className="input" rows={8} value={lesson.content || ''} onChange={(e) => setLesson({ ...lesson, content: e.target.value })} /></label>
              <div className="form-actions">
                <button className="btn btn-primary">Save lesson</button>
                <button type="button" className="btn btn-ghost" onClick={() => setLesson(null)}>Cancel</button>
              </div>
            </form>
          )}
          <ol className="lesson-list">
            {course.lessons.map((l, i) => (
              <li key={l.id}>
                <span className="lesson-index">{i + 1}</span>
                <span className="grow">{l.title}</span>
                <button className="icon-btn" onClick={() => moveLesson(i, -1)} disabled={i === 0} title="Move up">↑</button>
                <button className="icon-btn" onClick={() => moveLesson(i, 1)} disabled={i === course.lessons.length - 1} title="Move down">↓</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setLesson(l)}>Edit</button>
                <button className="btn btn-ghost btn-sm danger" onClick={() => deleteLesson(l)}>Delete</button>
              </li>
            ))}
            {!course.lessons.length && <p className="muted">No lessons yet.</p>}
          </ol>
        </section>
      )}

      {tab === 'assignments' && (
        <section className="card">
          <div className="card-header"><h2>Assignments</h2><button className="btn btn-primary btn-sm" onClick={() => setAssignment(emptyAssignment)}>+ Add assignment</button></div>
          {assignment && (
            <form className="form inset" onSubmit={saveAssignment}>
              <label>Title *<input className="input" value={assignment.title} onChange={(e) => setAssignment({ ...assignment, title: e.target.value })} required /></label>
              <label>Instructions<textarea className="input" rows={5} value={assignment.description || ''} onChange={(e) => setAssignment({ ...assignment, description: e.target.value })} /></label>
              <div className="form-row">
                <label>Due date<input className="input" type="datetime-local" value={assignment.due_date} onChange={(e) => setAssignment({ ...assignment, due_date: e.target.value })} /></label>
                <label>Max points<input className="input" type="number" min={1} value={assignment.max_points} onChange={(e) => setAssignment({ ...assignment, max_points: e.target.value })} required /></label>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary">Save assignment</button>
                <button type="button" className="btn btn-ghost" onClick={() => setAssignment(null)}>Cancel</button>
              </div>
            </form>
          )}
          <div className="list">
            {course.assignments.map((a) => (
              <div key={a.id} className="list-row">
                <div><Link to={`/assignments/${a.id}`}><strong>{a.title}</strong></Link><div className="muted small">Due {formatDate(a.due_date)} · {a.max_points} pts</div></div>
                <div className="row-actions">
                  <Link className="btn btn-ghost btn-sm" to={`/assignments/${a.id}`}>Submissions</Link>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAssignment({ ...a, due_date: toLocalInput(a.due_date) })}>Edit</button>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => deleteAssignment(a)}>Delete</button>
                </div>
              </div>
            ))}
            {!course.assignments.length && <p className="muted">No assignments yet.</p>}
          </div>
        </section>
      )}

      {tab === 'students' && (
        <section className="card table-wrap">
          <h2>Enrolled students ({students.length})</h2>
          <table className="table">
            <thead><tr><th>Student</th><th>Enrolled</th><th>Lessons</th><th className="w-40">Progress</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong><div className="muted small">{s.email}</div></td>
                  <td>{formatDate(s.enrolled_at)}</td>
                  <td>{s.completed_lessons}/{course.lessons.length}</td>
                  <td><ProgressBar value={s.progress} /></td>
                </tr>
              ))}
              {!students.length && <tr><td colSpan={4} className="center muted">No students enrolled yet.</td></tr>}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
