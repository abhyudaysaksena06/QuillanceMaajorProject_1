/**
 * Creates demo accounts in Firebase Auth + matching profiles in Supabase,
 * then gives the student some enrollments, progress and a graded submission.
 *
 * Usage (from /server):  npm run seed:demo
 * Run database/schema.sql and database/seed.sql in Supabase first.
 * Safe to run more than once: existing demo users get their password reset.
 */
import 'dotenv/config';
import { firebaseAuth } from '../src/config/firebase.js';
import { supabase } from '../src/config/supabase.js';

const PASSWORD = 'Demo@1234';
const DEMO_USERS = [
  { email: 'student@learnsphere.demo', name: 'Aarav Student', role: 'student' },
  { email: 'student2@learnsphere.demo', name: 'Meera Learner', role: 'student' },
  { email: 'instructor@learnsphere.demo', name: 'Priya Sharma', role: 'instructor' },
  { email: 'admin@learnsphere.demo', name: 'Admin User', role: 'admin' },
];
const SEED_INSTRUCTOR_UID = 'seed-demo-instructor';

const check = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

async function upsertFirebaseUser({ email, name }) {
  try {
    const existing = await firebaseAuth.getUserByEmail(email);
    return firebaseAuth.updateUser(existing.uid, { password: PASSWORD, displayName: name, emailVerified: true });
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    return firebaseAuth.createUser({ email, password: PASSWORD, displayName: name, emailVerified: true });
  }
}

async function main() {
  const ids = {};
  for (const u of DEMO_USERS) {
    const fb = await upsertFirebaseUser(u);
    const row = check(await supabase.from('users').upsert(
      { firebase_uid: fb.uid, email: u.email, name: u.name, role: u.role, onboarded: true, is_active: true },
      { onConflict: 'firebase_uid' },
    ).select().single());
    ids[u.email] = row.id;
    console.log(`✓ ${u.role.padEnd(10)} ${u.email}`);
  }

  const instructorId = ids['instructor@learnsphere.demo'];
  // Hand the sample courses from seed.sql to the real demo instructor.
  const placeholder = check(await supabase.from('users').select('id').eq('firebase_uid', SEED_INSTRUCTOR_UID).maybeSingle());
  if (placeholder) {
    check(await supabase.from('courses').update({ instructor_id: instructorId }).eq('instructor_id', placeholder.id));
    check(await supabase.from('users').delete().eq('id', placeholder.id));
  }

  const courses = check(await supabase.from('courses').select('id, title').eq('instructor_id', instructorId).order('created_at'));
  if (!courses.length) {
    console.log('\nNo sample courses found. Run database/seed.sql in Supabase, then run this script again.');
    return;
  }

  // Student 1: enrolled in two courses, some modules done, one graded + one pending submission.
  const s1 = ids['student@learnsphere.demo'];
  const s2 = ids['student2@learnsphere.demo'];
  for (const [student, list] of [[s1, courses.slice(0, 2)], [s2, courses.slice(0, 1)]]) {
    for (const c of list) {
      check(await supabase.from('enrollments').upsert({ user_id: student, course_id: c.id }, { onConflict: 'user_id,course_id', ignoreDuplicates: true }));
    }
  }

  const lessons = check(await supabase.from('lessons').select('id, course_id, position').in('course_id', courses.slice(0, 2).map((c) => c.id)).order('position'));
  const done = [
    ...lessons.filter((l) => l.course_id === courses[0].id).slice(0, 3),
    ...lessons.filter((l) => l.course_id === courses[1]?.id).slice(0, 1),
  ];
  for (const l of done) {
    check(await supabase.from('lesson_progress').upsert({ user_id: s1, lesson_id: l.id }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }));
  }
  for (const l of lessons.filter((x) => x.course_id === courses[0].id).slice(0, 1)) {
    check(await supabase.from('lesson_progress').upsert({ user_id: s2, lesson_id: l.id }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }));
  }

  const assignments = check(await supabase.from('assignments').select('id, course_id, max_points').eq('course_id', courses[0].id).order('due_date'));
  if (assignments[0]) {
    check(await supabase.from('submissions').upsert({
      assignment_id: assignments[0].id, student_id: s1, status: 'graded', grade: Math.round(assignments[0].max_points * 0.88),
      content: 'Landing page built with semantic HTML, Flexbox and CSS Grid. Fully responsive down to 360px.',
      link_url: 'https://github.com/example/landing-page', feedback: 'Clean structure and good use of Grid. Add alt text to the hero image.',
      graded_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,student_id' }));
    check(await supabase.from('submissions').upsert({
      assignment_id: assignments[0].id, student_id: s2, status: 'submitted',
      content: 'My first landing page, please review!', link_url: 'https://github.com/example/meera-landing',
    }, { onConflict: 'assignment_id,student_id' }));
  }

  console.log(`\nDemo data ready. Password for every account: ${PASSWORD}`);
}

main().then(() => process.exit(0)).catch((err) => { console.error('\n✗', err.message); process.exit(1); });
