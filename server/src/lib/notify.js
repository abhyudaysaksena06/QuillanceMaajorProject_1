import nodemailer from 'nodemailer';
import { supabase } from '../config/supabase.js';

const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

const appUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '');

export async function notify(userIds, { type, title, message = null, link = null }) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return;
  const { error } = await supabase.from('notifications')
    .insert(ids.map((user_id) => ({ user_id, type, title, message, link })));
  if (error) console.error('notify failed:', error.message);

  if (!mailer) return;
  const { data: users } = await supabase.from('users').select('email').in('id', ids);
  for (const u of users || []) {
    mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: u.email,
      subject: `LearnSphere: ${title}`,
      text: `${message || title}\n\n${link ? appUrl() + link : appUrl()}`,
    }).catch((err) => console.error('email failed:', err.message));
  }
}

export async function enrolledStudentIds(courseId) {
  const { data } = await supabase.from('enrollments').select('user_id').eq('course_id', courseId);
  return (data || []).map((e) => e.user_id);
}
