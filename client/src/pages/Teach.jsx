import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Loader from '../components/Loader';

export default function Teach() {
  const [courses, setCourses] = useState(null);
  useEffect(() => { api('/courses/mine').then(setCourses); }, []);
  if (!courses) return <Loader />;

  return (
    <>
      <div className="page-header">
        <div><h1>My Courses</h1><p className="muted">Create and manage your courses.</p></div>
        <Link to="/teach/new" className="btn btn-primary">+ New course</Link>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Course</th><th>Status</th><th>Lessons</th><th>Assignments</th><th>Students</th><th /></tr></thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td><Link to={`/courses/${c.id}`}><strong>{c.title}</strong></Link><div className="muted small">{c.category}</div></td>
                <td>{c.published ? <span className="badge badge-success">Published</span> : <span className="badge badge-warning">Draft</span>}</td>
                <td>{c.lessons[0]?.count ?? 0}</td>
                <td>{c.assignments[0]?.count ?? 0}</td>
                <td>{c.enrollments[0]?.count ?? 0}</td>
                <td className="right"><Link to={`/teach/${c.id}`} className="btn btn-ghost btn-sm">Edit</Link></td>
              </tr>
            ))}
            {!courses.length && <tr><td colSpan={6} className="center muted">You haven't created any courses yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
