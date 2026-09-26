import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler, httpError, unwrap, pick, getCourse, canManage, assertCanManage, isEnrolled } from './helpers.js';

const router = Router();
const FIELDS = ['title', 'description', 'due_date', 'max_points'];

async function getAssignment(id) {
  const a = unwrap(await supabase.from('assignments').select('*').eq('id', id).maybeSingle());
  if (!a) throw httpError(404, 'Assignment not found');
  return a;
}

// Assignments across all of the student's enrolled courses.
router.get('/', asyncHandler(async (req, res) => {
  const courseIds = unwrap(await supabase.from('enrollments').select('course_id').eq('user_id', req.user.id))
    .map((e) => e.course_id);
  if (!courseIds.length) return res.json([]);
  const assignments = unwrap(await supabase.from('assignments')
    .select('*, course:courses(id,title)').in('course_id', courseIds).order('due_date', { nullsFirst: false }));
  const subs = assignments.length ? unwrap(await supabase.from('submissions')
    .select('*').eq('student_id', req.user.id).in('assignment_id', assignments.map((a) => a.id))) : [];
  res.json(assignments.map((a) => ({ ...a, submission: subs.find((s) => s.assignment_id === a.id) || null })));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const assignment = await getAssignment(req.params.id);
  const course = await getCourse(assignment.course_id);
  const manage = canManage(req.user, course);
  if (!manage && !(await isEnrolled(req.user.id, course.id))) throw httpError(403, 'Enroll in the course first');

  const result = { ...assignment, course: { id: course.id, title: course.title }, can_manage: manage };
  if (manage) {
    result.submissions = unwrap(await supabase.from('submissions')
      .select('*, student:users(id,name,email,avatar_url)').eq('assignment_id', assignment.id)
      .order('submitted_at', { ascending: false }));
  } else {
    result.submission = unwrap(await supabase.from('submissions').select('*')
      .eq('assignment_id', assignment.id).eq('student_id', req.user.id).maybeSingle());
  }
  res.json(result);
}));

router.post('/', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  const { course_id } = req.body;
  if (!course_id) throw httpError(400, 'course_id is required');
  if (!req.body.title?.trim()) throw httpError(400, 'Title is required');
  await assertCanManage(req.user, course_id);
  const row = unwrap(await supabase.from('assignments')
    .insert({ ...pick(req.body, FIELDS), course_id }).select().single());
  res.status(201).json(row);
}));

router.patch('/:id', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  const a = await getAssignment(req.params.id);
  await assertCanManage(req.user, a.course_id);
  res.json(unwrap(await supabase.from('assignments').update(pick(req.body, FIELDS)).eq('id', a.id).select().single()));
}));

router.delete('/:id', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  const a = await getAssignment(req.params.id);
  await assertCanManage(req.user, a.course_id);
  unwrap(await supabase.from('assignments').delete().eq('id', a.id));
  res.status(204).end();
}));

// Student submits (or resubmits, until graded).
router.post('/:id/submit', asyncHandler(async (req, res) => {
  const a = await getAssignment(req.params.id);
  if (!(await isEnrolled(req.user.id, a.course_id))) throw httpError(403, 'Enroll in the course first');
  const { content, link_url } = req.body;
  if (!content?.trim() && !link_url?.trim()) throw httpError(400, 'Provide an answer or a link');

  const existing = unwrap(await supabase.from('submissions').select('*')
    .eq('assignment_id', a.id).eq('student_id', req.user.id).maybeSingle());
  if (existing?.grade != null) throw httpError(400, 'This submission has already been graded');

  const row = unwrap(await supabase.from('submissions').upsert({
    assignment_id: a.id, student_id: req.user.id, content: content || null, link_url: link_url || null,
    submitted_at: new Date().toISOString(),
  }, { onConflict: 'assignment_id,student_id' }).select().single());
  res.status(201).json(row);
}));

// Instructor grades a submission.
router.patch('/submissions/:submissionId/grade', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  const sub = unwrap(await supabase.from('submissions').select('*').eq('id', req.params.submissionId).maybeSingle());
  if (!sub) throw httpError(404, 'Submission not found');
  const a = await getAssignment(sub.assignment_id);
  await assertCanManage(req.user, a.course_id);

  const grade = Number(req.body.grade);
  if (!Number.isFinite(grade) || grade < 0 || grade > a.max_points) {
    throw httpError(400, `Grade must be between 0 and ${a.max_points}`);
  }
  res.json(unwrap(await supabase.from('submissions').update({
    grade, feedback: req.body.feedback || null, graded_at: new Date().toISOString(),
  }).eq('id', sub.id).select().single()));
}));

export default router;
