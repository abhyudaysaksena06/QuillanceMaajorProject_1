import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { notify } from './notify.js';

export async function markLessonComplete(userId, lesson) {
  await supabase.from('lesson_progress')
    .upsert({ user_id: userId, lesson_id: lesson.id }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true });
  return checkCourseCompletion(userId, lesson.course_id);
}

export async function checkCourseCompletion(userId, courseId) {
  const { data: lessons } = await supabase.from('lessons').select('id').eq('course_id', courseId);
  if (!lessons?.length) return null;
  const { count } = await supabase.from('lesson_progress').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).in('lesson_id', lessons.map((l) => l.id));
  if (count < lessons.length) return null;

  const { data: enrollment } = await supabase.from('enrollments').select('*')
    .eq('user_id', userId).eq('course_id', courseId).maybeSingle();
  if (!enrollment || enrollment.certificate_id) return enrollment?.certificate_id || null;

  const certificateId = `LS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  await supabase.from('enrollments').update({ completed_at: new Date().toISOString(), certificate_id: certificateId })
    .eq('id', enrollment.id);
  const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single();
  await notify([userId], {
    type: 'certificate', title: 'Course completed', link: `/certificates/${certificateId}`,
    message: `You finished "${course?.title}". Your certificate is ready.`,
  });
  return certificateId;
}
