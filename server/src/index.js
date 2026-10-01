import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import multer from 'multer';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import lessonRoutes from './routes/lessons.js';
import assignmentRoutes from './routes/assignments.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import discussionRoutes from './routes/discussions.js';
import notificationRoutes from './routes/notifications.js';
import { authenticate } from './middleware/auth.js';
import { supabase } from './config/supabase.js';

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/public/courses', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, category, level, duration, thumbnail_url, instructor:users!courses_instructor_id_fkey(name), lessons(count)')
      .eq('published', true).order('created_at', { ascending: false }).limit(6);
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

app.get('/api/public/certificates/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('enrollments')
      .select('certificate_id, completed_at, user:users(name), course:courses(title, duration, instructor:users!courses_instructor_id_fkey(name))')
      .eq('certificate_id', req.params.id.toUpperCase()).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Certificate not found' });
    res.json(data);
  } catch (err) { next(err); }
});

app.use('/api', authenticate);
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`LMS API listening on http://localhost:${port}`));
