import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, httpError, unwrap, pick } from './helpers.js';

const router = Router();

// Current user profile (the auth middleware creates it on first login).
router.get('/me', (req, res) => res.json(req.user));

// One-time onboarding: new users choose to be a student or an instructor.
router.post('/onboard', asyncHandler(async (req, res) => {
  if (req.user.onboarded) throw httpError(400, 'Account already set up');
  const { role } = req.body;
  if (!['student', 'instructor'].includes(role)) throw httpError(400, 'Role must be student or instructor');
  const user = unwrap(
    await supabase.from('users').update({ role, onboarded: true }).eq('id', req.user.id).select().single()
  );
  res.json(user);
}));

router.patch('/me', asyncHandler(async (req, res) => {
  const updates = pick(req.body, ['name', 'bio']);
  if (updates.name !== undefined && !String(updates.name).trim()) throw httpError(400, 'Name is required');
  const user = unwrap(await supabase.from('users').update(updates).eq('id', req.user.id).select().single());
  res.json(user);
}));

export default router;
