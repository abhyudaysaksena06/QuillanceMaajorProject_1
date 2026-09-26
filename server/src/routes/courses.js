import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';
import {
  asyncHandler, httpError, unwrap, pick, getCourse, canManage, assertCanManage, isEnrolled,
} from './helpers.js';

const router = Router();
const COURSE_FIELDS = ['title', 'description', 'category', 'level', 'thumbnail_url', 'published'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

function validateCourse(body, partial = false) {
  if (!partial || body.title !== undefined) {
    if (!body.title || !String(body.title).trim()) throw httpError(400, 'Title is required');
  }
  if (body.level !== undefined && !LEVELS.includes(body.level)) throw httpError(400, 'Invalid level');
}

// Catalog: published courses (+ search/category filter).
router.get('/', asyncHandler(async (req, res) => {
  let query = supabase
    .from('courses')
    .select('*, instructor:users!courses_instructor_id_fkey(id,name,avatar_url), lessons(count), enrollments(count)')
    .eq('published', true)
    .order('created_at', { ascending: false });
  if (req.query.search) query = query.ilike('title', `%${req.query.search}%`);
  if (req.query.category) query = query.eq('category', req.query.category);
  const courses = unwrap(await query);

  const enrolledIds = new Set(
    unwrap(await supabase.from('enrollments').select('course_id').eq('user_id', req.user.id)).map((e) => e.course_id)
  );
  res.json(courses.map((c) => ({ ...c, is_enrolled: enrolledIds.has(c.id) })));
}));

// Courses the instructor owns (admins see all).
router.get('/mine', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  let query = supabase
    .from('courses')
    .select('*, lessons(count), enrollments(count), assignments(count)')
    .order('created_at', { ascending: false });
  if (req.user.role !== 'admin') query = query.eq('instructor_id', req.user.id);
  res.json(unwrap(await query));
}));

// Courses the student is enrolled in, with progress.
router.get('/enrolled', asyncHandler(async (req, res) => {
  const rows = unwrap(
    await supabase
      .from('enrollments')
      .select('enrolled_at, course:courses(*, instructor:users!courses_instructor_id_fkey(name), lessons(id))')
      .eq('user_id', req.user.id)
      .order('enrolled_at', { ascending: false })
  );
  const done = new Set(
    unwrap(await supabase.from('lesson_progress').select('lesson_id').eq('user_id', req.user.id)).map((p) => p.lesson_id)
  );
  res.json(rows.filter((r) => r.course).map(({ course, enrolled_at }) => {
    const total = course.lessons.length;
    const completed = course.lessons.filter((l) => done.has(l.id)).length;
    const { lessons, ...rest } = course;
    return { ...rest, enrolled_at, total_lessons: total, completed_lessons: completed,
      progress: total ? Math.round((completed / total) * 100) : 0 };
  }));
}));

// Course detail with lessons, assignments and the caller's progress.
router.get('/:id', asyncHandler(async (req, res) => {
  const course = unwrap(
    await supabase
      .from('courses')
      .select('*, instructor:users!courses_instructor_id_fkey(id,name,avatar_url,bio)')
      .eq('id', req.params.id)
      .maybeSingle()
  );
  if (!course) throw httpError(404, 'Course not found');
  const manage = canManage(req.user, course);
  if (!course.published && !manage) throw httpError(404, 'Course not found');

  const enrolled = await isEnrolled(req.user.id, course.id);
  const lessons = unwrap(
    await supabase.from('lessons').select('*').eq('course_id', course.id).order('position')
  );
  const assignments = unwrap(
    await supabase.from('assignments').select('*').eq('course_id', course.id).order('due_date', { nullsFirst: false })
  );
  const { count: studentCount } = await supabase
    .from('enrollments').select('id', { count: 'exact', head: true }).eq('course_id', course.id);

  const lessonIds = lessons.map((l) => l.id);
  const completed = lessonIds.length
    ? unwrap(await supabase.from('lesson_progress').select('lesson_id')
        .eq('user_id', req.user.id).in('lesson_id', lessonIds)).map((p) => p.lesson_id)
    : [];

  let submissions = [];
  if (enrolled && assignments.length) {
    submissions = unwrap(await supabase.from('submissions').select('assignment_id, grade, submitted_at')
      .eq('student_id', req.user.id).in('assignment_id', assignments.map((a) => a.id)));
  }

  const canView = enrolled || manage;
  res.json({
    ...course,
    can_manage: manage,
    is_enrolled: enrolled,
    student_count: studentCount || 0,
    // Non-enrolled visitors see the syllabus but not lesson content.
    lessons: lessons.map((l) => (canView ? l : { id: l.id, title: l.title, position: l.position, duration_minutes: l.duration_minutes })),
    assignments: canView ? assignments.map((a) => ({ ...a, submission: submissions.find((s) => s.assignment_id === a.id) || null })) : [],
    completed_lesson_ids: completed,
    progress: lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0,
  });
}));

router.post('/', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  validateCourse(req.body);
  const course = unwrap(
    await supabase.from('courses')
      .insert({ ...pick(req.body, COURSE_FIELDS), instructor_id: req.user.id })
      .select().single()
  );
  res.status(201).json(course);
}));

router.patch('/:id', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  await assertCanManage(req.user, req.params.id);
  validateCourse(req.body, true);
  const course = unwrap(
    await supabase.from('courses')
      .update({ ...pick(req.body, COURSE_FIELDS), updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single()
  );
  res.json(course);
}));

router.delete('/:id', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  await assertCanManage(req.user, req.params.id);
  unwrap(await supabase.from('courses').delete().eq('id', req.params.id));
  res.status(204).end();
}));

router.post('/:id/enroll', asyncHandler(async (req, res) => {
  const course = await getCourse(req.params.id);
  if (!course.published) throw httpError(400, 'Course is not open for enrollment');
  if (course.instructor_id === req.user.id) throw httpError(400, 'You teach this course');
  if (await isEnrolled(req.user.id, course.id)) throw httpError(409, 'Already enrolled');
  const row = unwrap(
    await supabase.from('enrollments').insert({ user_id: req.user.id, course_id: course.id }).select().single()
  );
  res.status(201).json(row);
}));

router.delete('/:id/enroll', asyncHandler(async (req, res) => {
  unwrap(await supabase.from('enrollments').delete().eq('user_id', req.user.id).eq('course_id', req.params.id));
  res.status(204).end();
}));

// Roster with per-student progress, for the course's instructor.
router.get('/:id/students', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  await assertCanManage(req.user, req.params.id);
  const rows = unwrap(await supabase.from('enrollments')
    .select('enrolled_at, user:users(id,name,email,avatar_url)').eq('course_id', req.params.id));
  const lessonIds = unwrap(await supabase.from('lessons').select('id').eq('course_id', req.params.id)).map((l) => l.id);
  const progress = lessonIds.length
    ? unwrap(await supabase.from('lesson_progress').select('user_id').in('lesson_id', lessonIds))
    : [];
  res.json(rows.map(({ user, enrolled_at }) => {
    const done = progress.filter((p) => p.user_id === user.id).length;
    return { ...user, enrolled_at, completed_lessons: done,
      progress: lessonIds.length ? Math.round((done / lessonIds.length) * 100) : 0 };
  }));
}));

export default router;
