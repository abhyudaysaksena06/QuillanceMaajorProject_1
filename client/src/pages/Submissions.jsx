import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Loader from '../components/Loader';
import Avatar from '../components/Avatar';
import GradeForm from '../components/GradeForm';
import { formatDate, submissionBadge, isLate } from '../utils';

const tabs = [['submitted', 'Awaiting review'], ['graded', 'Graded'], ['resubmit', 'Resubmission requested'], ['', 'All']];

export default function Submissions() {
  const [status, setStatus] = useState('submitted');
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(null);

  const load = useCallback(() => api(`/assignments/submissions/all${status ? `?status=${status}` : ''}`).then(setItems), [status]);
  useEffect(() => { setItems(null); load(); }, [load]);

  return (
    <>
      <div className="page-header"><div><p className="eyebrow">[ Review ]</p><h1>Submissions</h1><p className="muted">Review work across all your courses and update marks, feedback and status.</p></div></div>
      <div className="tabs">
        {tabs.map(([k, label]) => <button key={k} className={status === k ? 'active' : ''} onClick={() => setStatus(k)}>{label}</button>)}
      </div>
      {!items ? <Loader /> : (
        <div className="list">
          {items.map((s) => {
            const b = submissionBadge(s, s.assignment.max_points, s.assignment.due_date);
            return (
              <div key={s.id} className="card submission">
                <div className="submission-head">
                  <Avatar user={s.student} size={32} />
                  <div>
                    <strong>{s.student?.name}</strong> · <Link to={`/assignments/${s.assignment.id}`}>{s.assignment.title}</Link>
                    <div className="muted small">{s.assignment.course?.title} · submitted {formatDate(s.submitted_at)}</div>
                  </div>
                  <span className="head-badges">
                    {isLate(s, s.assignment.due_date) && <span className="badge badge-danger">Late</span>}
                    <span className={`badge ${b.cls}`}>{b.text}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? 'Close' : 'Review'}</button>
                  </span>
                </div>
                {open === s.id && (
                  <>
                    {s.content && <p className="pre-wrap">{s.content}</p>}
                    {s.link_url && <p><a href={s.link_url} target="_blank" rel="noreferrer">{s.link_url} ↗</a></p>}
                    {s.file_url && <p><a href={s.file_url} target="_blank" rel="noreferrer" className="file-link">{s.file_name} ↓</a></p>}
                    <GradeForm sub={s} max={s.assignment.max_points} onSaved={() => { setOpen(null); load(); }} />
                  </>
                )}
              </div>
            );
          })}
          {!items.length && <div className="empty card">Nothing in this pile.</div>}
        </div>
      )}
    </>
  );
}
