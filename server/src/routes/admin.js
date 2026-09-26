import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler, httpError, unwrap } from './helpers.js';

const router = Router();
router.use(requireRole('admin'));

router.get('/users', asyncHandler(async (_req, res) => {
  res.json(unwrap(await supabase.from('users').select('*, enrollments(count), courses(count)').order('created_at', { ascending: false })));
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

export default router;
