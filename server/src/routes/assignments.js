import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler, httpError, unwrap, pick, getCourse, canManage, assertCanManage, isEnrolled } from './helpers.js';
import { notify, enrolledStudentIds } from '../lib/notify.js';
import { submissionUpload, storeFile, withFileUrls } from '../lib/storage.js';

const router = Router();
const FIELDS = ['title', 'description', 'due_date', 'max_points'];

async function getAssignment(id) {
  const a = unwrap(await supabase.from('assignments').select('*').eq('id', id).maybeSingle());
  if (!a) throw httpError(404, 'Assignment not found');
  return a;
}

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

router.get('/submissions/all', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  let coursesQuery = supabase.from('courses').select('id');
  if (req.user.role !== 'admin') coursesQuery = coursesQuery.eq('instructor_id', req.user.id);
  const courseIds = unwrap(await coursesQuery).map((c) => c.id);
  if (!courseIds.length) return res.json([]);
  const assignmentIds = unwrap(await supabase.from('assignments').select('id').in('course_id', courseIds)).map((a) => a.id);
  if (!assignmentIds.length) return res.json([]);
  let query = supabase.from('submissions')
    .select('*, student:users(id,name,email,avatar_url), assignment:assignments(id,title,max_points,due_date,course:courses(id,title))')
    .in('assignment_id', assignmentIds)
    .order('submitted_at', { ascending: req.query.status === 'submitted' });
  if (req.query.status) query = query.eq('status', req.query.status);
  res.json(await withFileUrls(unwrap(await query)));
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
    await withFileUrls(result.submissions);
  } else {
    result.submission = unwrap(await supabase.from('submissions').select('*')
      .eq('assignment_id', assignment.id).eq('student_id', req.user.id).maybeSingle());
    if (result.submission) await withFileUrls(result.submission);
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
  await notify(await enrolledStudentIds(course_id), {
    type: 'assignment', title: `New assignment: ${row.title}`, link: `/assignments/${row.id}`,
    message: row.due_date ? `Due ${new Date(row.due_date).toUTCString()}` : null,
  });
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

router.post('/:id/submit', submissionUpload.single('file'), asyncHandler(async (req, res) => {
  const a = await getAssignment(req.params.id);
  if (!(await isEnrolled(req.user.id, a.course_id))) throw httpError(403, 'Enroll in the course first');
  const { content, link_url } = req.body;
  if (!content?.trim() && !link_url?.trim() && !req.file && req.body.keep_file !== 'true') {
    throw httpError(400, 'Provide an answer, a link or a file');
  }
  if (link_url && !/^https?:\/\//i.test(link_url)) throw httpError(400, 'Link must start with http:// or https://');

  const existing = unwrap(await supabase.from('submissions').select('*')
    .eq('assignment_id', a.id).eq('student_id', req.user.id).maybeSingle());
  if (existing?.status === 'graded') throw httpError(400, 'This submission has already been graded');

  const file = req.file
    ? { file_path: await storeFile('submissions', `${a.id}/${req.user.id}`, req.file), file_name: req.file.originalname }
    : req.body.keep_file === 'true' && existing ? {} : { file_path: null, file_name: null };

  const row = unwrap(await supabase.from('submissions').upsert({
    assignment_id: a.id, student_id: req.user.id, content: content || null, link_url: link_url || null,
    submitted_at: new Date().toISOString(), status: 'submitted', ...file,
  }, { onConflict: 'assignment_id,student_id' }).select().single());
  res.status(201).json(await withFileUrls(row));
}));

router.patch('/submissions/:submissionId/grade', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  const sub = unwrap(await supabase.from('submissions').select('*').eq('id', req.params.submissionId).maybeSingle());
  if (!sub) throw httpError(404, 'Submission not found');
  const a = await getAssignment(sub.assignment_id);
  await assertCanManage(req.user, a.course_id);

  const status = req.body.status || 'graded';
  if (!['graded', 'resubmit'].includes(status)) throw httpError(400, 'Invalid status');
  let grade = null;
  if (status === 'graded') {
    grade = Number(req.body.grade);
    if (req.body.grade === '' || !Number.isFinite(grade) || grade < 0 || grade > a.max_points) {
      throw httpError(400, `Marks must be between 0 and ${a.max_points}`);
    }
  } else if (!req.body.feedback?.trim()) {
    throw httpError(400, 'Add feedback explaining what to fix');
  }
  const updated = unwrap(await supabase.from('submissions').update({
    status, grade, feedback: req.body.feedback || null, graded_at: new Date().toISOString(),
  }).eq('id', sub.id).select().single());
  await notify([sub.student_id], status === 'graded'
    ? { type: 'grade', title: `"${a.title}" graded: ${grade}/${a.max_points}`, message: req.body.feedback || null, link: `/assignments/${a.id}` }
    : { type: 'resubmit', title: `Resubmission requested: ${a.title}`, message: req.body.feedback, link: `/assignments/${a.id}` });
  res.json(updated);
}));

export default router;
