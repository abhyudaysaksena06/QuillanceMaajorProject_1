import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api';
import Loader from '../components/Loader';
import Avatar from '../components/Avatar';
import { formatDate, relativeDue } from '../utils';

function GradeForm({ sub, max, onSaved }) {
  const [grade, setGrade] = useState(sub.grade ?? '');
  const [feedback, setFeedback] = useState(sub.feedback ?? '');
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/assignments/submissions/${sub.id}/grade`, { method: 'PATCH', body: { grade, feedback } });
      toast.success('Grade saved');
      onSaved();
    } catch (err) { toast.error(err.message); }
    setBusy(false);
  };
  return (
    <form className="grade-form" onSubmit={save}>
      <input className="input w-24" type="number" min={0} max={max} required value={grade} onChange={(e) => setGrade(e.target.value)} placeholder={`/${max}`} />
      <input className="input" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback (optional)" />
      <button className="btn btn-primary btn-sm" disabled={busy}>{sub.grade != null ? 'Update' : 'Grade'}</button>
    </form>
  );
}

export default function AssignmentDetail() {
  const { id } = useParams();
  const [a, setA] = useState(null);
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api(`/assignments/${id}`).then((data) => {
    setA(data);
    setContent(data.submission?.content || '');
    setLink(data.submission?.link_url || '');
  }).catch((e) => toast.error(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  if (!a) return <Loader />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/assignments/${id}/submit`, { method: 'POST', body: { content, link_url: link } });
      toast.success('Assignment submitted!');
      await load();
    } catch (err) { toast.error(err.message); }
    setBusy(false);
  };

  const sub = a.submission;
  const graded = sub?.grade != null;

  return (
    <>
      <Link to={`/courses/${a.course.id}`} className="muted small">← {a.course.title}</Link>
      <div className="card">
        <div className="card-header">
          <h1>{a.title}</h1>
          <span className="badge badge-warning">{relativeDue(a.due_date)}</span>
        </div>
        <p className="muted small">Due {formatDate(a.due_date)} · {a.max_points} points</p>
        <div className="prose pre-wrap">{a.description}</div>
      </div>

      {a.can_manage ? (
        <section className="card">
          <h2>Submissions ({a.submissions.length})</h2>
          <div className="list">
            {a.submissions.map((s) => (
              <div key={s.id} className="submission">
                <div className="submission-head">
                  <Avatar user={s.student} size={30} />
                  <div><strong>{s.student?.name}</strong><div className="muted small">{s.student?.email} · {formatDate(s.submitted_at)}</div></div>
                  {s.grade != null && <span className="badge badge-success">{s.grade}/{a.max_points}</span>}
                </div>
                {s.content && <p className="pre-wrap">{s.content}</p>}
                {s.link_url && <p><a href={s.link_url} target="_blank" rel="noreferrer">🔗 {s.link_url}</a></p>}
                <GradeForm sub={s} max={a.max_points} onSaved={load} />
              </div>
            ))}
            {!a.submissions.length && <p className="muted">No submissions yet.</p>}
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>Your submission</h2>
          {graded && (
            <div className="alert alert-success">
              <strong>Grade: {sub.grade}/{a.max_points}</strong>
              {sub.feedback && <p>Feedback: {sub.feedback}</p>}
            </div>
          )}
          {sub && !graded && <div className="alert alert-info">Submitted {formatDate(sub.submitted_at)}. You can update it until it is graded.</div>}
          <form onSubmit={submit} className="form">
            <label>Answer<textarea className="input" rows={8} value={content} onChange={(e) => setContent(e.target.value)} disabled={graded} placeholder="Write your answer here…" /></label>
            <label>Link (GitHub, Drive, etc.)<input className="input" type="url" value={link} onChange={(e) => setLink(e.target.value)} disabled={graded} placeholder="https://" /></label>
            {!graded && <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : sub ? 'Update submission' : 'Submit assignment'}</button>}
          </form>
        </section>
      )}
    </>
  );
}
