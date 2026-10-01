import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, httpError, unwrap, pick } from './helpers.js';
import { avatarUpload, storeFile, publicUrl } from '../lib/storage.js';

const router = Router();

router.get('/me', (req, res) => res.json(req.user));

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

router.post('/me/avatar', avatarUpload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, 'Choose an image');
  const path = await storeFile('avatars', req.user.id, req.file);
  const user = unwrap(await supabase.from('users').update({ avatar_url: publicUrl('avatars', path) })
    .eq('id', req.user.id).select().single());
  res.json(user);
}));

export default router;
