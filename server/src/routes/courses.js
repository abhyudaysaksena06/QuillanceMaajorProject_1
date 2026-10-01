import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';
import {
  asyncHandler, httpError, unwrap, pick, getCourse, canManage, assertCanManage, isEnrolled,
} from './helpers.js';
import { notify, enrolledStudentIds } from '../lib/notify.js';

const router = Router();
const COURSE_FIELDS = ['title', 'description', 'category', 'level', 'thumbnail_url', 'duration', 'published'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

function validateCourse(body, partial = false) {
  if (!partial || body.title !== undefined) {
    if (!body.title || !String(body.title).trim()) throw httpError(400, 'Title is required');
  }
  if (body.level !== undefined && !LEVELS.includes(body.level)) throw httpError(400, 'Invalid level');
}

router.get('/', asyncHandler(async (req, res) => {
  let query = supabase
    .from('courses')
    .select('*, instructor:users!courses_instructor_id_fkey(id,name,avatar_url), lessons(count), enrollments(count)')
    .eq('published', true);
  const sort = { oldest: ['created_at', true], title: ['title', true] }[req.query.sort] || ['created_at', false];
  query = query.order(sort[0], { ascending: sort[1] });
  if (req.query.level && LEVELS.includes(req.query.level)) query = query.eq('level', req.query.level);
  if (req.query.search) query = query.ilike('title', `%${req.query.search}%`);
  if (req.query.category) query = query.eq('category', req.query.category);
  const courses = unwrap(await query);

  const enrolledIds = new Set(
    unwrap(await supabase.from('enrollments').select('course_id').eq('user_id', req.user.id)).map((e) => e.course_id)
  );
  res.json(courses.map((c) => ({ ...c, is_enrolled: enrolledIds.has(c.id) })));
}));

router.get('/mine', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  let query = supabase
    .from('courses')
    .select('*, lessons(count), enrollments(count), assignments(count)')
    .order('created_at', { ascending: false });
  if (req.user.role !== 'admin') query = query.eq('instructor_id', req.user.id);
  res.json(unwrap(await query));
}));

router.get('/enrolled', asyncHandler(async (req, res) => {
  const rows = unwrap(
    await supabase
      .from('enrollments')
      .select('enrolled_at, completed_at, certificate_id, course:courses(*, instructor:users!courses_instructor_id_fkey(name), lessons(id))')
      .eq('user_id', req.user.id)
      .order('enrolled_at', { ascending: false })
  );
  const done = new Set(
    unwrap(await supabase.from('lesson_progress').select('lesson_id').eq('user_id', req.user.id)).map((p) => p.lesson_id)
  );
  res.json(rows.filter((r) => r.course).map(({ course, enrolled_at, completed_at, certificate_id }) => {
    const total = course.lessons.length;
    const completed = course.lessons.filter((l) => done.has(l.id)).length;
    const { lessons, ...rest } = course;
    return { ...rest, enrolled_at, completed_at, certificate_id, total_lessons: total, completed_lessons: completed,
      progress: total ? Math.round((completed / total) * 100) : 0 };
  }));
}));

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
    submissions = unwrap(await supabase.from('submissions').select('assignment_id, grade, status, submitted_at')
      .eq('student_id', req.user.id).in('assignment_id', assignments.map((a) => a.id)));
  }

  let passedQuizIds = [];
  let certificateId = null;
  if (enrolled) {
    const quizLessons = lessons.filter((l) => l.quiz?.length).map((l) => l.id);
    if (quizLessons.length) {
      passedQuizIds = [...new Set(unwrap(await supabase.from('quiz_attempts').select('lesson_id')
        .eq('user_id', req.user.id).eq('passed', true).in('lesson_id', quizLessons)).map((a) => a.lesson_id))];
    }
    certificateId = unwrap(await supabase.from('enrollments').select('certificate_id')
      .eq('user_id', req.user.id).eq('course_id', course.id).maybeSingle())?.certificate_id || null;
  }
  const forStudent = (l) => ({ ...l, quiz: (l.quiz || []).map(({ question, options }) => ({ question, options })) });

  const canView = enrolled || manage;
  res.json({
    ...course,
    can_manage: manage,
    is_enrolled: enrolled,
    student_count: studentCount || 0,
    lessons: lessons.map((l) => (manage ? l : enrolled ? forStudent(l) : { id: l.id, title: l.title, position: l.position, duration_minutes: l.duration_minutes })),
    assignments: canView ? assignments.map((a) => ({ ...a, submission: submissions.find((s) => s.assignment_id === a.id) || null })) : [],
    completed_lesson_ids: completed,
    passed_quiz_ids: passedQuizIds,
    certificate_id: certificateId,
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

router.get('/:id/gradebook', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  const course = await assertCanManage(req.user, req.params.id);
  const students = unwrap(await supabase.from('enrollments')
    .select('enrolled_at, completed_at, certificate_id, user:users(id,name,email)').eq('course_id', course.id));
  const lessonIds = unwrap(await supabase.from('lessons').select('id').eq('course_id', course.id)).map((l) => l.id);
  const progress = lessonIds.length
    ? unwrap(await supabase.from('lesson_progress').select('user_id').in('lesson_id', lessonIds)) : [];
  const assignments = unwrap(await supabase.from('assignments').select('id,title,max_points')
    .eq('course_id', course.id).order('due_date', { nullsFirst: false }));
  const subs = assignments.length ? unwrap(await supabase.from('submissions')
    .select('assignment_id, student_id, status, grade').in('assignment_id', assignments.map((a) => a.id))) : [];
  res.json({
    course: { id: course.id, title: course.title },
    assignments,
    rows: students.map(({ user, enrolled_at, completed_at, certificate_id }) => ({
      ...user, enrolled_at, completed_at, certificate_id,
      progress: lessonIds.length ? Math.round((progress.filter((p) => p.user_id === user.id).length / lessonIds.length) * 100) : 0,
      marks: Object.fromEntries(assignments.map((a) => {
        const sub = subs.find((x) => x.assignment_id === a.id && x.student_id === user.id);
        return [a.id, sub ? (sub.status === 'graded' ? sub.grade : sub.status) : null];
      })),
    })),
  });
}));

router.post('/:id/announce', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  const course = await assertCanManage(req.user, req.params.id);
  const title = req.body.title?.trim();
  if (!title) throw httpError(400, 'Announcement title is required');
  const ids = await enrolledStudentIds(course.id);
  await notify(ids, { type: 'announcement', title: `${course.title}: ${title}`, message: req.body.message?.trim() || null, link: `/courses/${course.id}` });
  res.json({ sent: ids.length });
}));

router.get('/:id/discussions', asyncHandler(async (req, res) => {
  const course = await getCourse(req.params.id);
  if (!canManage(req.user, course) && !(await isEnrolled(req.user.id, course.id))) throw httpError(403, 'Enroll in the course first');
  const threads = unwrap(await supabase.from('discussions')
    .select('*, author:users(id,name,avatar_url,role), replies:discussion_replies(*, author:users(id,name,avatar_url,role))')
    .eq('course_id', course.id).order('created_at', { ascending: false }));
  res.json(threads.map((t) => ({
    ...t,
    upvote_count: t.upvotes.length,
    has_upvoted: t.upvotes.includes(req.user.id),
    upvotes: undefined,
    can_delete: t.user_id === req.user.id || canManage(req.user, course),
    replies: t.replies.sort((a, b) => (b.is_instructor_answer - a.is_instructor_answer) || new Date(a.created_at) - new Date(b.created_at)),
  })));
}));

router.post('/:id/discussions', asyncHandler(async (req, res) => {
  const course = await getCourse(req.params.id);
  const manage = canManage(req.user, course);
  if (!manage && !(await isEnrolled(req.user.id, course.id))) throw httpError(403, 'Enroll in the course first');
  const title = req.body.title?.trim();
  if (!title) throw httpError(400, 'Question title is required');
  const thread = unwrap(await supabase.from('discussions')
    .insert({ course_id: course.id, user_id: req.user.id, title: title.slice(0, 200), body: req.body.body?.trim() || null })
    .select().single());
  if (!manage) {
    await notify([course.instructor_id], { type: 'discussion', title: `New question in ${course.title}`, message: title, link: `/courses/${course.id}?tab=discussion` });
  }
  res.status(201).json(thread);
}));

export default router;
