import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Loader from '../components/Loader';
import CourseCard from '../components/CourseCard';

export default function MyLearning() {
  const [courses, setCourses] = useState(null);
  const [tab, setTab] = useState('progress');
  useEffect(() => { api('/courses/enrolled').then(setCourses); }, []);
  if (!courses) return <Loader />;

  const filtered = courses.filter((c) => (tab === 'completed' ? c.progress === 100 : c.progress < 100));
  return (
    <>
      <div className="page-header"><div><p className="eyebrow">[ Enrolled · {courses.length} ]</p><h1>My courses</h1></div></div>
      <div className="tabs">
        <button className={tab === 'progress' ? 'active' : ''} onClick={() => setTab('progress')}>In progress ({courses.filter((c) => c.progress < 100).length})</button>
        <button className={tab === 'completed' ? 'active' : ''} onClick={() => setTab('completed')}>Completed ({courses.filter((c) => c.progress === 100).length})</button>
      </div>
      {filtered.length ? (
        <div className="course-grid">{filtered.map((c, i) => <CourseCard key={c.id} course={c} progress={c.progress} index={i} />)}</div>
      ) : (
        <div className="empty card">Nothing here yet. <Link to="/courses">Browse courses →</Link></div>
      )}
    </>
  );
}
