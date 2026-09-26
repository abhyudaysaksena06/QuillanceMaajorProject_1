import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';

const gradients = ['#6366f1,#8b5cf6', '#0ea5e9,#6366f1', '#10b981,#0ea5e9', '#f59e0b,#ef4444', '#ec4899,#8b5cf6'];

export default function CourseCard({ course, progress }) {
  const g = gradients[(course.title?.charCodeAt(0) || 0) % gradients.length];
  const lessonCount = course.lessons?.[0]?.count ?? course.total_lessons;
  return (
    <Link to={`/courses/${course.id}`} className="course-card">
      <div className="course-thumb" style={course.thumbnail_url
        ? { backgroundImage: `url(${course.thumbnail_url})` }
        : { background: `linear-gradient(135deg, ${g})` }}>
        {!course.thumbnail_url && <span>{course.title?.[0]}</span>}
        {course.is_enrolled && <span className="badge badge-success thumb-badge">Enrolled</span>}
      </div>
      <div className="course-body">
        <div className="course-meta">
          {course.category && <span className="tag">{course.category}</span>}
          <span className="tag tag-muted">{course.level}</span>
          {course.duration && <span className="tag tag-muted">⏱ {course.duration}</span>}
        </div>
        <h3>{course.title}</h3>
        {course.instructor && <p className="muted small">by {course.instructor.name}</p>}
        {progress !== undefined ? (
          <ProgressBar value={progress} />
        ) : (
          <p className="muted small">
            {lessonCount ?? 0} modules{course.enrollments ? ` · ${course.enrollments[0]?.count ?? 0} students` : ''}
          </p>
        )}
      </div>
    </Link>
  );
}
