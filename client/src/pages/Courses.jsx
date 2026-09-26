import { useEffect, useState } from 'react';
import { api } from '../api';
import Loader from '../components/Loader';
import CourseCard from '../components/CourseCard';

export default function Courses() {
  const [courses, setCourses] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      api(`/courses?${params}`).then(setCourses);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const categories = [...new Set((courses || []).map((c) => c.category).filter(Boolean))];
  const visible = (courses || []).filter((c) => !category || c.category === category);

  return (
    <>
      <div className="page-header">
        <div><p className="eyebrow">[ Catalog · {visible.length} courses ]</p><h1>What will you learn next?</h1></div>
      </div>
      <div className="toolbar">
        <input className="input" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {!courses ? <Loader /> : visible.length ? (
        <div className="course-grid">{visible.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}</div>
      ) : (
        <div className="empty card">No courses match that search.</div>
      )}
    </>
  );
}
