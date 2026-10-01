import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Loader from '../components/Loader';
import TurnInForm from '../components/TurnInForm';
import { formatDate, submissionBadge, isLate } from '../utils';

const group = (a) => {
  if (!a.submission || a.submission.status === 'resubmit') return 'todo';
  return a.submission.status === 'graded' ? 'graded' : 'submitted';
};
const tabs = [['todo', 'To do'], ['submitted', 'Submitted'], ['graded', 'Graded'], ['all', 'All']];

export default function Assignments() {
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState('todo');
  const [open, setOpen] = useState(null);

  useEffect(() => { api('/assignments').then(setItems); }, []);
  if (!items) return <Loader />;

  const count = (k) => items.filter((a) => k === 'all' || group(a) === k).length;
  const shown = items.filter((a) => tab === 'all' || group(a) === tab);

  const saved = (id, submission) => {
    setItems(items.map((a) => (a.id === id ? { ...a, submission } : a)));
    setOpen(null);
  };

  return (
    <>
      <div className="page-header"><div><p className="eyebrow">[ Across all your courses ]</p><h1>Assignments</h1></div></div>
      <div className="tabs">
        {tabs.map(([k, label]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => { setTab(k); setOpen(null); }}>{label} ({count(k)})</button>
        ))}
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Assignment</th><th>Course</th><th>Due</th><th>Status</th><th /></tr></thead>
          <tbody>
            {shown.map((a) => {
              const b = submissionBadge(a.submission, a.max_points, a.due_date);
              const graded = a.submission?.status === 'graded';
              return (
                <Fragment key={a.id}>
                  <tr className={open === a.id ? 'row-open' : ''}>
                    <td><Link to={`/assignments/${a.id}`}><strong>{a.title}</strong></Link><div className="muted small">{a.max_points} marks</div></td>
                    <td>{a.course?.title}</td>
                    <td>{formatDate(a.due_date)}</td>
                    <td>
                      <span className={`badge ${b.cls}`}>{b.text}</span>
                      {isLate(a.submission, a.due_date) && <span className="badge badge-danger" style={{ marginLeft: '.3rem' }}>Late</span>}
                    </td>
                    <td className="right">
                      {graded ? <Link className="btn btn-ghost btn-sm" to={`/assignments/${a.id}`}>View feedback</Link> : (
                        <button className={`btn btn-sm ${a.submission && a.submission.status !== 'resubmit' ? 'btn-ghost' : 'btn-primary'}`}
                          onClick={() => setOpen(open === a.id ? null : a.id)}>
                          {open === a.id ? 'Close' : !a.submission ? 'Turn in' : a.submission.status === 'resubmit' ? 'Resubmit' : 'Edit submission'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {open === a.id && (
                    <tr className="turn-in-row">
                      <td colSpan={5}>
                        {a.description && <p className="muted small pre-wrap" style={{ marginTop: 0 }}>{a.description}</p>}
                        <TurnInForm assignment={a} onDone={(s) => saved(a.id, s)} onCancel={() => setOpen(null)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!shown.length && <tr><td colSpan={5} className="muted center">{tab === 'todo' ? 'Nothing to turn in right now.' : 'Nothing here yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
