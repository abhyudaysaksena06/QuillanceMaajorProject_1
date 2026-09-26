import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Loader from '../components/Loader';
import { formatDate, submissionBadge } from '../utils';

export default function Assignments() {
  const [items, setItems] = useState(null);
  useEffect(() => { api('/assignments').then(setItems); }, []);
  if (!items) return <Loader />;


  return (
    <>
      <div className="page-header"><div><h1>Assignments</h1><p className="muted">All assignments across your courses.</p></div></div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Assignment</th><th>Course</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((a) => {
              const b = submissionBadge(a.submission, a.max_points, a.due_date);
              return (
                <tr key={a.id}>
                  <td><Link to={`/assignments/${a.id}`}><strong>{a.title}</strong></Link></td>
                  <td>{a.course?.title}</td>
                  <td>{formatDate(a.due_date)}</td>
                  <td><span className={`badge ${b.cls}`}>{b.text}</span></td>
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
