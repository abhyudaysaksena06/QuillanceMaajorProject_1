import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api';
import Loader from '../components/Loader';
import ProgressBar from '../components/ProgressBar';
import { formatDate, toLocalInput, RESOURCE_TYPES } from '../utils';

const emptyCourse = { title: '', description: '', category: '', level: 'Beginner', thumbnail_url: '', duration: '', published: false };
const emptyLesson = { title: '', content: '', video_url: '', duration_minutes: '', resources: [] };
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
        toast.success('Course created. Now add modules.');
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
    const { id: lessonId, course_id: _c, created_at: _t, ...fields } = lesson;
    const body = {
      ...fields,
      duration_minutes: lesson.duration_minutes ? Number(lesson.duration_minutes) : null,
      resources: (lesson.resources || []).filter((r) => r.url.trim()),
    };
    try {
      if (lessonId) await api(`/lessons/${lessonId}`, { method: 'PATCH', body });
      else await api('/lessons', { method: 'POST', body: { ...body, course_id: id } });
      toast.success('Module saved');
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
    if (!confirm(`Delete module "${l.title}"?`)) return;
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
      <Link to="/teach" className="back">← Your courses</Link>
      <div className="page-header">
        <div><p className="eyebrow">[ {isNew ? 'New course' : 'Course editor'} ]</p><h1>{isNew ? 'Start a new course' : form.title || 'Edit course'}</h1></div>
        {!isNew && <Link to={`/courses/${id}`} className="btn btn-ghost">View as student</Link>}
      </div>

      {!isNew && (
        <div className="tabs">
          {[['details', 'Details'], ['lessons', 'Modules'], ['assignments', 'Assignments'], ['students', 'Students & progress']].map(([t, label]) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{label}</button>
          ))}
        </div>
      )}

      {tab === 'details' && (
        <form className="card form" onSubmit={saveCourse}>
          <label>Title *<input className="input" value={form.title} onChange={set('title')} required /></label>
          <label>Description<textarea className="input" rows={5} value={form.description} onChange={set('description')} /></label>
          <div className="form-row">
            <label>Category<input className="input" value={form.category} onChange={set('category')} placeholder="e.g. Web Development" /></label>
            <label>Duration<input className="input" value={form.duration} onChange={set('duration')} placeholder="e.g. 6 weeks" /></label>
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
          <div className="card-header"><h2>Modules</h2><button className="btn btn-primary btn-sm" onClick={() => setLesson(emptyLesson)}>Add module</button></div>
          {lesson && (
            <form className="form inset" onSubmit={saveLesson}>
              <label>Module title *<input className="input" value={lesson.title} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} required /></label>
              <div className="form-row">
                <label>Video URL (YouTube / Vimeo)<input className="input" type="url" value={lesson.video_url || ''} onChange={(e) => setLesson({ ...lesson, video_url: e.target.value })} /></label>
                <label>Duration (min)<input className="input" type="number" min={0} value={lesson.duration_minutes || ''} onChange={(e) => setLesson({ ...lesson, duration_minutes: e.target.value })} /></label>
              </div>
              <label>Description &amp; notes<textarea className="input" rows={8} value={lesson.content || ''} onChange={(e) => setLesson({ ...lesson, content: e.target.value })} /></label>
              <div className="resource-editor">
                <strong className="small">Learning materials (notes, PDFs, videos, source code, references, exercises)</strong>
                {(lesson.resources || []).map((r, i) => {
                  const update = (k, v) => setLesson({ ...lesson, resources: lesson.resources.map((x, j) => (j === i ? { ...x, [k]: v } : x)) });
                  return (
                    <div key={i} className="resource-row">
                      <select className="input w-auto" value={r.type} onChange={(e) => update('type', e.target.value)}>
                        {Object.entries(RESOURCE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <input className="input" placeholder="Label" value={r.label} onChange={(e) => update('label', e.target.value)} />
                      <input className="input" type="url" placeholder="https://" value={r.url} onChange={(e) => update('url', e.target.value)} />
                      <button type="button" className="icon-btn" title="Remove" onClick={() => setLesson({ ...lesson, resources: lesson.resources.filter((_, j) => j !== i) })}>×</button>
                    </div>
                  );
                })}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLesson({ ...lesson, resources: [...(lesson.resources || []), { type: 'pdf', label: '', url: '' }] })}>+ material</button>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary">Save module</button>
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
            {!course.lessons.length && <p className="muted">No modules yet.</p>}
          </ol>
        </section>
      )}

      {tab === 'assignments' && (
        <section className="card">
          <div className="card-header"><h2>Assignments</h2><button className="btn btn-primary btn-sm" onClick={() => setAssignment(emptyAssignment)}>Add assignment</button></div>
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
            <thead><tr><th>Student</th><th>Enrolled</th><th>Modules</th><th>Status</th><th className="w-40">Progress</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong><div className="muted small">{s.email}</div></td>
                  <td>{formatDate(s.enrolled_at)}</td>
                  <td>{s.completed_lessons}/{course.lessons.length}</td>
                  <td>{s.progress === 100 ? <span className="badge badge-success">Completed</span> : s.progress > 0 ? <span className="badge badge-info">In progress</span> : <span className="badge">Not started</span>}</td>
                  <td><ProgressBar value={s.progress} /></td>
                </tr>
              ))}
              {!students.length && <tr><td colSpan={5} className="center muted">No students enrolled yet.</td></tr>}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
