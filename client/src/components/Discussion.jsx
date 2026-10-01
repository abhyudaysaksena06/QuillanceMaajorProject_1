import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import Avatar from './Avatar';
import Loader from './Loader';
import { formatDate } from '../utils';

function Thread({ t, canManage, reload }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [votes, setVotes] = useState({ count: t.upvote_count, mine: t.has_upvoted });

  const upvote = async () => {
    const r = await api(`/discussions/${t.id}/upvote`, { method: 'POST' });
    setVotes({ count: r.upvote_count, mine: r.has_upvoted });
  };
  const send = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    try {
      await api(`/discussions/${t.id}/replies`, { method: 'POST', body: { body: reply } });
      setReply('');
      reload();
    } catch (err) { toast.error(err.message); }
  };
  const toggleAnswer = async (r) => { await api(`/discussions/replies/${r.id}/answer`, { method: 'PATCH' }); reload(); };
  const remove = async () => {
    if (!confirm('Delete this question and its replies?')) return;
    await api(`/discussions/${t.id}`, { method: 'DELETE' });
    reload();
  };
  const answered = t.replies.some((r) => r.is_instructor_answer);

  return (
    <div className="thread">
      <button className={`vote ${votes.mine ? 'on' : ''}`} onClick={upvote} title="Upvote"><span>▲</span>{votes.count}</button>
      <div className="thread-body">
        <button className="thread-title" onClick={() => setOpen(!open)}>{t.title}</button>
        <p className="muted small">
          {t.author?.name} · {formatDate(t.created_at)} · {t.replies.length} {t.replies.length === 1 ? 'reply' : 'replies'}
          {answered && <span className="badge badge-success" style={{ marginLeft: '.5rem' }}>Answered</span>}
        </p>
        {open && (
          <>
            {t.body && <p className="pre-wrap">{t.body}</p>}
            <ul className="replies">
              {t.replies.map((r) => (
                <li key={r.id} className={r.is_instructor_answer ? 'answer' : ''}>
                  <div className="user-cell">
                    <Avatar user={r.author} size={24} />
                    <strong className="small">{r.author?.name}</strong>
                    {r.is_instructor_answer && <span className="badge badge-success">Instructor answer</span>}
                    <span className="muted small">{formatDate(r.created_at)}</span>
                    {canManage && <button className="link-btn" onClick={() => toggleAnswer(r)}>{r.is_instructor_answer ? 'Unmark' : 'Mark as answer'}</button>}
                  </div>
                  <p className="pre-wrap">{r.body}</p>
                </li>
              ))}
            </ul>
            <form className="reply-form" onSubmit={send}>
              <input className="input" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply" />
              <button className="btn btn-primary btn-sm">Reply</button>
            </form>
            {t.can_delete && <button className="link-btn danger-link" onClick={remove}>Delete question</button>}
          </>
        )}
      </div>
    </div>
  );
}

export default function Discussion({ courseId, canManage }) {
  const [threads, setThreads] = useState(null);
  const [form, setForm] = useState({ title: '', body: '' });
  const [asking, setAsking] = useState(false);

  const load = useCallback(() => api(`/courses/${courseId}/discussions`).then(setThreads), [courseId]);
  useEffect(() => { load(); }, [load]);

  const ask = async (e) => {
    e.preventDefault();
    try {
      await api(`/courses/${courseId}/discussions`, { method: 'POST', body: form });
      setForm({ title: '', body: '' });
      setAsking(false);
      load();
    } catch (err) { toast.error(err.message); }
  };

  if (!threads) return <Loader />;
  return (
    <section className="card">
      <div className="card-header">
        <h2>Questions &amp; discussion</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setAsking(!asking)}>{asking ? 'Cancel' : 'Ask a question'}</button>
      </div>
      {asking && (
        <form className="form inset" onSubmit={ask}>
          <label>Question<input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={200} /></label>
          <label>Details<textarea className="input" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
          <div className="form-actions"><button className="btn btn-primary">Post question</button></div>
        </form>
      )}
      {threads.map((t) => <Thread key={t.id} t={t} canManage={canManage} reload={load} />)}
      {!threads.length && <p className="muted">No questions yet. Ask the first one.</p>}
    </section>
  );
}
