import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler, httpError, unwrap, getCourse } from './helpers.js';
import { notify } from '../lib/notify.js';

const router = Router();
router.use(requireRole('admin'));

router.get('/users', asyncHandler(async (_req, res) => {
  res.json(unwrap(await supabase.from('users').select('*, enrollments(count), courses!courses_instructor_id_fkey(count)').order('created_at', { ascending: false })));
}));

router.patch('/users/:id', asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw httpError(400, 'You cannot change your own account here');
  const updates = {};
  if (req.body.role !== undefined) {
    if (!['student', 'instructor', 'admin'].includes(req.body.role)) throw httpError(400, 'Invalid role');
    updates.role = req.body.role;
    updates.onboarded = true;
  }
  if (req.body.is_active !== undefined) updates.is_active = Boolean(req.body.is_active);
  res.json(unwrap(await supabase.from('users').update(updates).eq('id', req.params.id).select().single()));
}));

router.get('/instructors', asyncHandler(async (_req, res) => {
  res.json(unwrap(await supabase.from('users').select('id,name,email,role')
    .in('role', ['instructor', 'admin']).eq('is_active', true).order('name')));
}));

router.patch('/courses/:id/owner', asyncHandler(async (req, res) => {
  const course = await getCourse(req.params.id);
  const owner = unwrap(await supabase.from('users').select('id,name,role').eq('id', req.body.instructor_id).maybeSingle());
  if (!owner || !['instructor', 'admin'].includes(owner.role)) throw httpError(400, 'Choose an instructor or admin');
  const updated = unwrap(await supabase.from('courses').update({ instructor_id: owner.id, updated_at: new Date().toISOString() })
    .eq('id', course.id).select().single());
  if (owner.id !== req.user.id) {
    await notify([owner.id], { type: 'course', title: `You now own "${course.title}"`, link: `/teach/${course.id}` });
  }
  res.json(updated);
}));

router.post('/announce', asyncHandler(async (req, res) => {
  const title = req.body.title?.trim();
  if (!title) throw httpError(400, 'Announcement title is required');
  let query = supabase.from('users').select('id').eq('is_active', true);
  if (['student', 'instructor'].includes(req.body.audience)) query = query.eq('role', req.body.audience);
  const ids = unwrap(await query).map((u) => u.id);
  await notify(ids, { type: 'announcement', title, message: req.body.message?.trim() || null, link: '/dashboard' });
  res.json({ sent: ids.length });
}));

export default router;
