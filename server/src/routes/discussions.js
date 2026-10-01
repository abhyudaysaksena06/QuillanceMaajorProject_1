import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, httpError, unwrap, getCourse, canManage, isEnrolled } from './helpers.js';
import { notify } from '../lib/notify.js';

const router = Router();

async function loadThread(id, user) {
  const thread = unwrap(await supabase.from('discussions').select('*').eq('id', id).maybeSingle());
  if (!thread) throw httpError(404, 'Discussion not found');
  const course = await getCourse(thread.course_id);
  const manage = canManage(user, course);
  if (!manage && !(await isEnrolled(user.id, course.id))) throw httpError(403, 'Enroll in the course first');
  return { thread, course, manage };
}

router.post('/:id/replies', asyncHandler(async (req, res) => {
  const { thread, course, manage } = await loadThread(req.params.id, req.user);
  const body = req.body.body?.trim();
  if (!body) throw httpError(400, 'Reply cannot be empty');
  const reply = unwrap(await supabase.from('discussion_replies')
    .insert({ discussion_id: thread.id, user_id: req.user.id, body, is_instructor_answer: manage })
    .select().single());
  if (thread.user_id !== req.user.id) {
    await notify([thread.user_id], {
      type: 'discussion', title: `${req.user.name} replied to "${thread.title}"`,
      message: body.slice(0, 140), link: `/courses/${course.id}?tab=discussion`,
    });
  }
  res.status(201).json(reply);
}));

router.post('/:id/upvote', asyncHandler(async (req, res) => {
  const { thread } = await loadThread(req.params.id, req.user);
  const has = thread.upvotes.includes(req.user.id);
  const upvotes = has ? thread.upvotes.filter((u) => u !== req.user.id) : [...thread.upvotes, req.user.id];
  unwrap(await supabase.from('discussions').update({ upvotes }).eq('id', thread.id));
  res.json({ upvote_count: upvotes.length, has_upvoted: !has });
}));

router.patch('/replies/:replyId/answer', asyncHandler(async (req, res) => {
  const reply = unwrap(await supabase.from('discussion_replies').select('*').eq('id', req.params.replyId).maybeSingle());
  if (!reply) throw httpError(404, 'Reply not found');
  const { manage } = await loadThread(reply.discussion_id, req.user);
  if (!manage) throw httpError(403, 'Only the instructor can mark answers');
  res.json(unwrap(await supabase.from('discussion_replies')
    .update({ is_instructor_answer: !reply.is_instructor_answer }).eq('id', reply.id).select().single()));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { thread, manage } = await loadThread(req.params.id, req.user);
  if (!manage && thread.user_id !== req.user.id) throw httpError(403, 'You can only delete your own questions');
  unwrap(await supabase.from('discussions').delete().eq('id', thread.id));
  res.status(204).end();
}));

export default router;
