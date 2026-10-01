import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import lessonRoutes from './routes/lessons.js';
import assignmentRoutes from './routes/assignments.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import { authenticate } from './middleware/auth.js';
import { supabase } from './config/supabase.js';

const app = express();

app.use(helmet());
// Accept "https://a.app, https://b.app/" style lists: trim spaces and trailing slashes.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Public catalog preview for the home page (no login needed).
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

// Every route below requires a valid Firebase ID token.
app.use('/api', authenticate);
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`LMS API listening on http://localhost:${port}`));
