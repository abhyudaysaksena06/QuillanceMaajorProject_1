import { supabase } from '../config/supabase.js';

export const httpError = (status, message) => Object.assign(new Error(message), { status });

/** Wraps async handlers so thrown errors reach the Express error handler. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Throws Supabase errors, returns data otherwise. */
export const unwrap = ({ data, error }) => {
  if (error) throw httpError(400, error.message);
  return data;
};

export async function getCourse(courseId) {
  const course = unwrap(await supabase.from('courses').select('*').eq('id', courseId).maybeSingle());
  if (!course) throw httpError(404, 'Course not found');
  return course;
}

/** Instructor who owns the course, or an admin. */
export function canManage(user, course) {
  return user.role === 'admin' || course.instructor_id === user.id;
}

export async function assertCanManage(user, courseId) {
  const course = await getCourse(courseId);
  if (!canManage(user, course)) throw httpError(403, 'You can only manage your own courses');
  return course;
}

export async function isEnrolled(userId, courseId) {
  const row = unwrap(
    await supabase.from('enrollments').select('id').eq('user_id', userId).eq('course_id', courseId).maybeSingle()
  );
  return Boolean(row);
}

/** Picks only allowed keys from a request body. */
export const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
