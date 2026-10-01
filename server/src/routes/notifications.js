import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, unwrap } from './helpers.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const items = unwrap(await supabase.from('notifications').select('*')
    .eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(30));
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true })
    .eq('user_id', req.user.id).eq('is_read', false);
  res.json({ items, unread: count || 0 });
}));

router.post('/read-all', asyncHandler(async (req, res) => {
  unwrap(await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id).eq('is_read', false));
  res.json({ unread: 0 });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  unwrap(await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id));
  res.json({ ok: true });
}));

export default router;
