import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api';
import Loader from '../components/Loader';
import Avatar from '../components/Avatar';
import GradeForm from '../components/GradeForm';
import { formatDate, relativeDue, submissionBadge, isLate } from '../utils';

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
    if (!content.trim() && !link.trim()) return toast.error('Write an answer or add a link');
    if (link && !/^https?:\/\//i.test(link)) return toast.error('Link must start with http:// or https://');
    setBusy(true);
    try {
      await api(`/assignments/${id}/submit`, { method: 'POST', body: { content, link_url: link } });
      toast.success('Assignment submitted!');
      await load();
    } catch (err) { toast.error(err.message); }
    setBusy(false);
  };

  const sub = a.submission;
  const locked = sub?.status === 'graded';
  const badge = submissionBadge(sub, a.max_points, a.due_date);
  const counts = a.submissions && {
    graded: a.submissions.filter((s) => s.status === 'graded').length,
    pending: a.submissions.filter((s) => s.status === 'submitted').length,
  };

  return (
    <>
      <Link to={`/courses/${a.course.id}`} className="muted small">← {a.course.title}</Link>
      <div className="card">
        <div className="card-header">
          <h1>{a.title}</h1>
          <span className={`badge ${a.can_manage ? 'badge-warning' : badge.cls}`}>{a.can_manage ? relativeDue(a.due_date) : badge.text}</span>
        </div>
        <p className="muted small">Deadline {formatDate(a.due_date)} · Maximum marks {a.max_points}</p>
        <h3>Instructions</h3>
        <div className="prose pre-wrap">{a.description || 'No additional instructions.'}</div>
      </div>

      {a.can_manage ? (
        <section className="card">
          <div className="card-header">
            <h2>Submissions ({a.submissions.length})</h2>
            <span className="muted small">{counts.pending} awaiting review · {counts.graded} graded</span>
          </div>
          <div className="list">
            {a.submissions.map((s) => {
              const b = submissionBadge(s, a.max_points, a.due_date);
              return (
                <div key={s.id} className="submission">
                  <div className="submission-head">
                    <Avatar user={s.student} size={30} />
                    <div><strong>{s.student?.name}</strong><div className="muted small">{s.student?.email} · {formatDate(s.submitted_at)}</div></div>
                    <span className="head-badges">
                      {isLate(s, a.due_date) && <span className="badge badge-danger">Late</span>}
                      <span className={`badge ${b.cls}`}>{b.text}</span>
                    </span>
                  </div>
                  {s.content && <p className="pre-wrap">{s.content}</p>}
                  {s.link_url && <p><a href={s.link_url} target="_blank" rel="noreferrer">🔗 {s.link_url}</a></p>}
                  <GradeForm sub={s} max={a.max_points} onSaved={load} />
                </div>
              );
            })}
            {!a.submissions.length && <p className="muted">No submissions yet.</p>}
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>Your submission</h2>
          {sub?.status === 'graded' && (
            <div className="alert alert-success">
              <strong>Marks: {sub.grade}/{a.max_points}</strong>
              {sub.feedback && <p>Feedback: {sub.feedback}</p>}
            </div>
          )}
          {sub?.status === 'resubmit' && (
            <div className="alert alert-error">
              <strong>Your instructor asked you to resubmit.</strong>
              {sub.feedback && <p>Feedback: {sub.feedback}</p>}
            </div>
          )}
          {sub?.status === 'submitted' && (
            <div className="alert alert-info">
              Submitted {formatDate(sub.submitted_at)}{isLate(sub, a.due_date) && ' (after the deadline)'}. You can update it until it is graded.
            </div>
          )}
          <form onSubmit={submit} className="form">
            <label>Answer / notes<textarea className="input" rows={8} value={content} onChange={(e) => setContent(e.target.value)} disabled={locked} placeholder="Write your answer here…" /></label>
            <label>Link (GitHub repository, Google Drive, deployed project URL…)<input className="input" type="url" value={link} onChange={(e) => setLink(e.target.value)} disabled={locked} placeholder="https://" /></label>
            {!locked && <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : sub ? 'Update submission' : 'Submit assignment'}</button>}
          </form>
        </section>
      )}
    </>
  );
}
