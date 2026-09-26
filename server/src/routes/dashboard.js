import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, unwrap } from './helpers.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { user } = req;

  if (user.role === 'student') {
    const courseIds = unwrap(await supabase.from('enrollments').select('course_id').eq('user_id', user.id)).map((e) => e.course_id);
    const lessons = courseIds.length ? unwrap(await supabase.from('lessons').select('id').in('course_id', courseIds)) : [];
    const { count: completedLessons } = await supabase.from('lesson_progress')
      .select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    const assignments = courseIds.length
      ? unwrap(await supabase.from('assignments').select('id, title, due_date, course_id, course:courses(title)').in('course_id', courseIds))
      : [];
    const subs = unwrap(await supabase.from('submissions').select('assignment_id, grade').eq('student_id', user.id));
    const submitted = new Set(subs.map((s) => s.assignment_id));
    const graded = subs.filter((s) => s.grade != null);
    const maxById = Object.fromEntries(
      (graded.length ? unwrap(await supabase.from('assignments').select('id,max_points').in('id', graded.map((g) => g.assignment_id))) : [])
        .map((a) => [a.id, a.max_points])
    );
    const avg = graded.length
      ? Math.round(graded.reduce((sum, g) => sum + (g.grade / (maxById[g.assignment_id] || 100)) * 100, 0) / graded.length)
      : null;

    const now = Date.now();
    const upcoming = assignments
      .filter((a) => !submitted.has(a.id) && a.due_date && new Date(a.due_date).getTime() > now)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);

    return res.json({
      role: 'student',
      stats: {
        enrolled_courses: courseIds.length,
        completed_lessons: completedLessons || 0,
        total_lessons: lessons.length,
        overall_progress: lessons.length ? Math.round(((completedLessons || 0) / lessons.length) * 100) : 0,
        pending_assignments: assignments.filter((a) => !submitted.has(a.id)).length,
        average_grade: avg,
      },
      upcoming,
    });
  }

  // Instructor / admin view.
  let coursesQuery = supabase.from('courses').select('id, title, published');
  if (user.role !== 'admin') coursesQuery = coursesQuery.eq('instructor_id', user.id);
  const courses = unwrap(await coursesQuery);
  const ids = courses.map((c) => c.id);
  const enrollments = ids.length ? unwrap(await supabase.from('enrollments').select('user_id, course_id').in('course_id', ids)) : [];
  const assignments = ids.length ? unwrap(await supabase.from('assignments').select('id').in('course_id', ids)) : [];
  const pending = assignments.length
    ? unwrap(await supabase.from('submissions')
        .select('id, submitted_at, assignment:assignments(id,title,course:courses(title)), student:users(name)')
        .in('assignment_id', assignments.map((a) => a.id)).is('grade', null)
        .order('submitted_at', { ascending: false }))
    : [];

  const stats = {
    total_courses: courses.length,
    published_courses: courses.filter((c) => c.published).length,
    total_students: new Set(enrollments.map((e) => e.user_id)).size,
    total_enrollments: enrollments.length,
    pending_grading: pending.length,
  };
  if (user.role === 'admin') {
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true });
    stats.total_users = count || 0;
  }
  res.json({ role: user.role, stats, pending_submissions: pending.slice(0, 8) });
}));

export default router;
