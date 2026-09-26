import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';

export default function CourseCard({ course, progress, index = 0 }) {
  const lessonCount = course.lessons?.[0]?.count ?? course.total_lessons ?? 0;
  const students = course.enrollments?.[0]?.count;
  return (
    <Link to={`/courses/${course.id}`} className="course-card">
      <div className={`course-thumb ${course.thumbnail_url ? 'has-img' : ''}`}
        style={course.thumbnail_url ? { backgroundImage: `url(${course.thumbnail_url})` } : undefined}>
        {!course.thumbnail_url && <span className="initial">{course.title?.[0]}</span>}
        <span className="numeral">{String(index + 1).padStart(2, '0')}</span>
        {course.is_enrolled && progress === undefined && <span className="badge badge-success thumb-badge">Enrolled</span>}
      </div>
      <div className="course-body">
        <div className="course-meta">
          {course.category && <span className="tag">{course.category}</span>}
          {course.level && <span className="tag tag-muted">{course.level}</span>}
          {course.duration && <span className="tag tag-muted">{course.duration}</span>}
        </div>
        <h3>{course.title}</h3>
        {course.instructor && <p className="muted small" style={{ margin: 0 }}>with {course.instructor.name}</p>}
        {progress !== undefined && <ProgressBar value={progress} total={course.total_lessons} done={course.completed_lessons} />}
        <div className="course-foot">
          <span>{String(lessonCount).padStart(2, '0')} modules{students !== undefined ? ` · ${students} learners` : ''}</span>
          <span className="arrow">→</span>
        </div>
      </div>
    </Link>
  );
}
