import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler, httpError, unwrap, pick, assertCanManage, isEnrolled } from './helpers.js';

const router = Router();
const FIELDS = ['title', 'content', 'video_url', 'position', 'duration_minutes', 'resources'];
const RESOURCE_TYPES = ['notes', 'pdf', 'video', 'code', 'reference', 'exercise'];

function validateResources(body) {
  if (body.resources === undefined) return;
  if (!Array.isArray(body.resources)) throw httpError(400, 'resources must be an array');
  body.resources = body.resources.map((r) => {
    if (!r?.url || !/^https?:\/\//i.test(r.url)) throw httpError(400, 'Each resource needs a valid http(s) URL');
    return { type: RESOURCE_TYPES.includes(r.type) ? r.type : 'reference', label: String(r.label || r.url).slice(0, 200), url: r.url };
  });
}

async function getLesson(id) {
  const lesson = unwrap(await supabase.from('lessons').select('*').eq('id', id).maybeSingle());
  if (!lesson) throw httpError(404, 'Lesson not found');
  return lesson;
}

router.post('/', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  const { course_id } = req.body;
  if (!course_id) throw httpError(400, 'course_id is required');
  if (!req.body.title?.trim()) throw httpError(400, 'Title is required');
  await assertCanManage(req.user, course_id);
  validateResources(req.body);

  let position = req.body.position;
  if (position === undefined) {
    const { count } = await supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', course_id);
    position = (count || 0) + 1;
  }
  const lesson = unwrap(
    await supabase.from('lessons').insert({ ...pick(req.body, FIELDS), position, course_id }).select().single()
  );
  res.status(201).json(lesson);
}));

router.patch('/:id', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  const lesson = await getLesson(req.params.id);
  await assertCanManage(req.user, lesson.course_id);
  validateResources(req.body);
  const updated = unwrap(
    await supabase.from('lessons').update(pick(req.body, FIELDS)).eq('id', lesson.id).select().single()
  );
  res.json(updated);
}));

router.delete('/:id', requireRole('instructor', 'admin'), asyncHandler(async (req, res) => {
  const lesson = await getLesson(req.params.id);
  await assertCanManage(req.user, lesson.course_id);
  unwrap(await supabase.from('lessons').delete().eq('id', lesson.id));
  res.status(204).end();
}));

router.post('/:id/complete', asyncHandler(async (req, res) => {
  const lesson = await getLesson(req.params.id);
  if (!(await isEnrolled(req.user.id, lesson.course_id))) throw httpError(403, 'Enroll in the course first');
  unwrap(await supabase.from('lesson_progress')
    .upsert({ user_id: req.user.id, lesson_id: lesson.id }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }));
  res.json({ completed: true });
}));

router.delete('/:id/complete', asyncHandler(async (req, res) => {
  unwrap(await supabase.from('lesson_progress').delete().eq('user_id', req.user.id).eq('lesson_id', req.params.id));
  res.json({ completed: false });
}));

export default router;
