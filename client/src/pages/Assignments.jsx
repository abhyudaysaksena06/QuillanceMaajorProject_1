import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Loader from '../components/Loader';
import { formatDate, relativeDue } from '../utils';

export default function Assignments() {
  const [items, setItems] = useState(null);
  useEffect(() => { api('/assignments').then(setItems); }, []);
  if (!items) return <Loader />;

  const status = (a) => a.submission?.grade != null ? 'graded' : a.submission ? 'submitted' : 'pending';

  return (
    <>
      <div className="page-header"><div><h1>Assignments</h1><p className="muted">All assignments across your courses.</p></div></div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Assignment</th><th>Course</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((a) => {
              const st = status(a);
              return (
                <tr key={a.id}>
                  <td><Link to={`/assignments/${a.id}`}><strong>{a.title}</strong></Link></td>
                  <td>{a.course?.title}</td>
                  <td>{formatDate(a.due_date)}</td>
                  <td>
                    {st === 'graded' && <span className="badge badge-success">Graded: {a.submission.grade}/{a.max_points}</span>}
                    {st === 'submitted' && <span className="badge badge-info">Submitted</span>}
                    {st === 'pending' && <span className="badge badge-warning">{relativeDue(a.due_date)}</span>}
                  </td>
                </tr>
              );
            })}
            {!items.length && <tr><td colSpan={4} className="muted center">No assignments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
