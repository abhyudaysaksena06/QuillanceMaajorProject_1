import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler, httpError, unwrap, pick, assertCanManage, isEnrolled } from './helpers.js';
import { markLessonComplete } from '../lib/progress.js';

const router = Router();
const FIELDS = ['title', 'content', 'video_url', 'position', 'duration_minutes', 'resources', 'quiz', 'pass_mark'];
const RESOURCE_TYPES = ['notes', 'pdf', 'video', 'code', 'reference', 'exercise'];

function validateResources(body) {
  if (body.resources === undefined) return;
  if (!Array.isArray(body.resources)) throw httpError(400, 'resources must be an array');
  body.resources = body.resources.map((r) => {
    if (!r?.url || !/^https?:\/\//i.test(r.url)) throw httpError(400, 'Each resource needs a valid http(s) URL');
    return { type: RESOURCE_TYPES.includes(r.type) ? r.type : 'reference', label: String(r.label || r.url).slice(0, 200), url: r.url };
  });
}

function validateQuiz(body) {
  if (body.pass_mark !== undefined) {
    const mark = Number(body.pass_mark);
    if (!Number.isInteger(mark) || mark < 0 || mark > 100) throw httpError(400, 'Pass mark must be 0-100');
    body.pass_mark = mark;
  }
  if (body.quiz === undefined) return;
  if (!Array.isArray(body.quiz)) throw httpError(400, 'quiz must be an array');
  body.quiz = body.quiz.map((q, i) => {
    const options = (q?.options || []).map((o) => String(o).trim()).filter(Boolean);
    const answer = Number(q?.answer);
    if (!q?.question?.trim()) throw httpError(400, `Question ${i + 1} is empty`);
    if (options.length < 2) throw httpError(400, `Question ${i + 1} needs at least two options`);
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) throw httpError(400, `Question ${i + 1} has no correct option`);
    return { question: q.question.trim(), options, answer, explanation: q.explanation?.trim() || '' };
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
  validateQuiz(req.body);

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
  validateQuiz(req.body);
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
  if (lesson.quiz?.length) throw httpError(400, 'Pass the module quiz to complete this module');
  const certificateId = await markLessonComplete(req.user.id, lesson);
  res.json({ completed: true, certificate_id: certificateId });
}));

router.post('/:id/quiz', asyncHandler(async (req, res) => {
  const lesson = await getLesson(req.params.id);
  if (!(await isEnrolled(req.user.id, lesson.course_id))) throw httpError(403, 'Enroll in the course first');
  if (!lesson.quiz?.length) throw httpError(400, 'This module has no quiz');
  const answers = Array.isArray(req.body.answers) ? req.body.answers.map(Number) : [];
  if (answers.length !== lesson.quiz.length) throw httpError(400, 'Answer every question');

  const results = lesson.quiz.map((q, i) => ({ correct: answers[i] === q.answer, answer: q.answer, explanation: q.explanation }));
  const score = Math.round((results.filter((r) => r.correct).length / results.length) * 100);
  const passed = score >= lesson.pass_mark;
  unwrap(await supabase.from('quiz_attempts').insert({ user_id: req.user.id, lesson_id: lesson.id, score, passed, answers }));

  const certificateId = passed ? await markLessonComplete(req.user.id, lesson) : null;
  res.json({ score, passed, pass_mark: lesson.pass_mark, results, certificate_id: certificateId });
}));

router.delete('/:id/complete', asyncHandler(async (req, res) => {
  unwrap(await supabase.from('lesson_progress').delete().eq('user_id', req.user.id).eq('lesson_id', req.params.id));
  res.json({ completed: false });
}));

export default router;
