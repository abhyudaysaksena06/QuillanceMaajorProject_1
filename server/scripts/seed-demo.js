import 'dotenv/config';
import { firebaseAuth } from '../src/config/firebase.js';
import { supabase } from '../src/config/supabase.js';
import { checkCourseCompletion } from '../src/lib/progress.js';

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
    console.log(`created ${u.role.padEnd(10)} ${u.email}`);
  }

  const instructorId = ids['instructor@learnsphere.demo'];
  const placeholder = check(await supabase.from('users').select('id').eq('firebase_uid', SEED_INSTRUCTOR_UID).maybeSingle());
  if (placeholder) {
    check(await supabase.from('courses').update({ instructor_id: instructorId }).eq('instructor_id', placeholder.id));
    check(await supabase.from('users').delete().eq('id', placeholder.id));
  }

  const all = check(await supabase.from('courses').select('id, title').eq('instructor_id', instructorId).order('title'));
  const order = ['Full Stack Development', 'JavaScript Fundamentals'];
  const courses = [...all].sort((a, b) => ((order.indexOf(a.title) + 1) || 99) - ((order.indexOf(b.title) + 1) || 99));
  if (!courses.length) {
    console.log('\nNo sample courses found. Run database/seed.sql in Supabase, then run this script again.');
    return;
  }

  const s1 = ids['student@learnsphere.demo'];
  const s2 = ids['student2@learnsphere.demo'];
  for (const [student, list] of [[s1, courses.slice(0, 2)], [s2, courses.slice(0, 1)]]) {
    for (const c of list) {
      check(await supabase.from('enrollments').upsert({ user_id: student, course_id: c.id }, { onConflict: 'user_id,course_id', ignoreDuplicates: true }));
    }
  }

  const lessons = check(await supabase.from('lessons').select('id, course_id, position, quiz').in('course_id', courses.slice(0, 2).map((c) => c.id)).order('position'));
  const done = [
    ...lessons.filter((l) => l.course_id === courses[0].id).slice(0, 3),
    ...lessons.filter((l) => l.course_id === courses[1]?.id),
  ];
  const { count: attempts } = await supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', s1);
  for (const l of done) {
    check(await supabase.from('lesson_progress').upsert({ user_id: s1, lesson_id: l.id }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }));
    if (l.quiz?.length && !attempts) {
      check(await supabase.from('quiz_attempts').insert({ user_id: s1, lesson_id: l.id, score: 100, passed: true, answers: l.quiz.map((q) => q.answer) }));
    }
  }
  if (courses[1]) await checkCourseCompletion(s1, courses[1].id);
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

  const { count: threads } = await supabase.from('discussions').select('id', { count: 'exact', head: true }).eq('course_id', courses[0].id);
  if (!threads) {
    const thread = check(await supabase.from('discussions').insert({
      course_id: courses[0].id, user_id: s2, upvotes: [s1],
      title: 'Why does fetch() return a Promise instead of the data?',
      body: 'I logged the result of fetch() and got Promise {<pending>}. How do I get the JSON?',
    }).select().single());
    check(await supabase.from('discussion_replies').insert({
      discussion_id: thread.id, user_id: instructorId, is_instructor_answer: true,
      body: 'fetch() is asynchronous. Use const data = await (await fetch(url)).json() inside an async function, or chain .then().',
    }));
  }

  const { count: notes } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', s1).neq('type', 'certificate');
  if (!notes && assignments[0]) {
    check(await supabase.from('notifications').insert([
      { user_id: s1, type: 'grade', title: 'Assignment graded', message: 'Clean structure and good use of Grid.', link: `/assignments/${assignments[0].id}` },
      { user_id: s1, type: 'announcement', title: `${courses[0].title}: welcome to the course`, message: 'Start with module 1 and take the quiz at the end.', link: `/courses/${courses[0].id}` },
    ]));
    check(await supabase.from('notifications').insert({ user_id: instructorId, type: 'submission', title: 'New submission waiting for review', link: '/teach/submissions' }));
  }

  console.log(`\nDemo data ready. Password for every account: ${PASSWORD}`);
}

main().then(() => process.exit(0)).catch((err) => { console.error('\nSeeding failed:', err.message); process.exit(1); });
