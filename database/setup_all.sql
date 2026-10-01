create extension if not exists "pgcrypto";

-- users
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  firebase_uid  text not null unique,
  email         text not null,
  name          text not null,
  avatar_url    text,
  bio           text,
  role          text not null default 'student' check (role in ('student', 'instructor', 'admin')),
  onboarded     boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- courses
create table if not exists public.courses (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  category       text,
  level          text not null default 'Beginner' check (level in ('Beginner', 'Intermediate', 'Advanced')),
  thumbnail_url  text,
  duration       text,
  published      boolean not null default false,
  instructor_id  uuid not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint courses_instructor_id_fkey foreign key (instructor_id) references public.users(id) on delete cascade
);
create index if not exists courses_instructor_idx on public.courses(instructor_id);
create index if not exists courses_published_idx on public.courses(published);

-- lessons
create table if not exists public.lessons (
  id                uuid primary key default gen_random_uuid(),
  course_id         uuid not null references public.courses(id) on delete cascade,
  title             text not null,
  content           text,
  video_url         text,
  position          integer not null default 1,
  duration_minutes  integer,
  resources         jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists lessons_course_idx on public.lessons(course_id, position);

-- enrollments
create table if not exists public.enrollments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  enrolled_at  timestamptz not null default now(),
  unique (user_id, course_id)
);
create index if not exists enrollments_course_idx on public.enrollments(course_id);

-- lesson progress
create table if not exists public.lesson_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- assignments
create table if not exists public.assignments (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        text not null,
  description  text,
  due_date     timestamptz,
  max_points   integer not null default 100 check (max_points > 0),
  created_at   timestamptz not null default now()
);
create index if not exists assignments_course_idx on public.assignments(course_id);

-- submissions
create table if not exists public.submissions (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references public.assignments(id) on delete cascade,
  student_id     uuid not null references public.users(id) on delete cascade,
  content        text,
  link_url       text,
  submitted_at   timestamptz not null default now(),
  status         text not null default 'submitted' check (status in ('submitted', 'graded', 'resubmit')),
  grade          integer check (grade >= 0),
  feedback       text,
  graded_at      timestamptz,
  unique (assignment_id, student_id)
);

-- row level security
alter table public.users            enable row level security;
alter table public.courses          enable row level security;
alter table public.lessons          enable row level security;
alter table public.enrollments      enable row level security;
alter table public.lesson_progress  enable row level security;
alter table public.assignments      enable row level security;
alter table public.submissions      enable row level security;
-- no policies: only the server (service role key) can read or write

-- sample courses, modules and assignments (run after schema.sql)

insert into public.users (id, firebase_uid, email, name, role, onboarded, bio)
values ('00000000-0000-0000-0000-000000000001', 'seed-demo-instructor', 'instructor@learnsphere.demo',
        'Priya Sharma', 'instructor', true, 'Senior full stack engineer and mentor.')
on conflict (firebase_uid) do nothing;

insert into public.courses (id, title, description, category, level, duration, published, instructor_id) values
('10000000-0000-0000-0000-000000000001', 'Full Stack Development',
 'Go from zero to a deployed full stack web application. You will learn HTML, CSS and JavaScript, build a React frontend, create a REST API with Node.js and Express, and connect it to a PostgreSQL database.',
 'Web Development', 'Intermediate', '6 weeks', true, '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000002', 'JavaScript Fundamentals',
 'Master the core of JavaScript: variables, functions, arrays, objects, the DOM and asynchronous programming.',
 'Programming', 'Beginner', '3 weeks', true, '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000003', 'SQL & Database Design',
 'Design relational schemas, write SQL queries, and understand joins, indexes and normalisation.',
 'Databases', 'Intermediate', '4 weeks', true, '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into public.lessons (course_id, title, position, duration_minutes, video_url, content, resources) values
('10000000-0000-0000-0000-000000000001', 'HTML Fundamentals', 1, 45, 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
 E'Learn the structure of a web page.\n\n• Elements, tags and attributes\n• Semantic HTML (header, nav, main, section, footer)\n• Forms and inputs\n\nExercise: build a personal profile page using semantic tags.',
 '[{"type":"reference","label":"MDN: HTML basics","url":"https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics"},{"type":"exercise","label":"freeCodeCamp: Responsive Web Design","url":"https://www.freecodecamp.org/learn/2022/responsive-web-design/"}]'),
('10000000-0000-0000-0000-000000000001', 'CSS Fundamentals', 2, 60, 'https://www.youtube.com/watch?v=OXGznpKZ_sA',
 E'Style your pages.\n\n• Selectors, specificity and the box model\n• Flexbox and CSS Grid\n• Responsive design with media queries',
 '[{"type":"reference","label":"MDN: CSS layout","url":"https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout"},{"type":"exercise","label":"Flexbox Froggy","url":"https://flexboxfroggy.com/"}]'),
('10000000-0000-0000-0000-000000000001', 'JavaScript Basics', 3, 75, 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
 E'Add behaviour to the web.\n\n• Variables, types and functions\n• Arrays and objects\n• DOM manipulation and events\n• fetch() and async/await',
 '[{"type":"reference","label":"javascript.info","url":"https://javascript.info/"}]'),
('10000000-0000-0000-0000-000000000001', 'Frontend Development with React', 4, 90, 'https://www.youtube.com/watch?v=SqcY0GlETPk',
 E'Build component-based UIs.\n\n• Components, props and state\n• Hooks: useState, useEffect\n• Routing with React Router',
 '[{"type":"reference","label":"React docs","url":"https://react.dev/learn"},{"type":"code","label":"Vite React starter","url":"https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react"}]'),
('10000000-0000-0000-0000-000000000001', 'Backend Development with Node & Express', 5, 90, 'https://www.youtube.com/watch?v=Oe421EPjeBE',
 E'Create a REST API.\n\n• HTTP methods and status codes\n• Express routing and middleware\n• Authentication and protected routes',
 '[{"type":"reference","label":"Express guide","url":"https://expressjs.com/en/guide/routing.html"}]'),
('10000000-0000-0000-0000-000000000001', 'Database Integration', 6, 80, 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
 E'Persist your data.\n\n• Relational design and SQL\n• Connecting Node.js to PostgreSQL (Supabase)\n• CRUD operations',
 '[{"type":"reference","label":"Supabase JS docs","url":"https://supabase.com/docs/reference/javascript/introduction"},{"type":"pdf","label":"PostgreSQL tutorial (PDF-style guide)","url":"https://www.postgresqltutorial.com/"}]'),
('10000000-0000-0000-0000-000000000002', 'Variables and Data Types', 1, 30, null, E'let, const, primitive types and type coercion.', '[]'),
('10000000-0000-0000-0000-000000000002', 'Functions and Scope', 2, 40, null, E'Function declarations, arrow functions, closures.', '[]'),
('10000000-0000-0000-0000-000000000002', 'Arrays and Objects', 3, 45, null, E'map, filter, reduce, destructuring and spread.', '[]'),
('10000000-0000-0000-0000-000000000003', 'Relational Model', 1, 35, null, E'Tables, rows, keys and relationships.', '[]'),
('10000000-0000-0000-0000-000000000003', 'Writing Queries', 2, 50, null, E'SELECT, WHERE, JOIN, GROUP BY.', '[]');

insert into public.assignments (course_id, title, description, due_date, max_points) values
('10000000-0000-0000-0000-000000000001', 'Build a Responsive Landing Page',
 E'Create a responsive landing page using semantic HTML and CSS Flexbox/Grid.\n\nRequirements:\n1. Header with navigation\n2. Hero section, features section and footer\n3. Works on mobile and desktop\n\nSubmit your GitHub repository link and the deployed URL.',
 now() + interval '7 days', 100),
('10000000-0000-0000-0000-000000000001', 'REST API with Express',
 E'Build a CRUD REST API for a "notes" resource with Express. Include validation and proper status codes. Submit a GitHub link.',
 now() + interval '14 days', 100),
('10000000-0000-0000-0000-000000000002', 'Array Methods Practice',
 E'Solve the 10 exercises in the linked sheet using map/filter/reduce. Submit a Drive or GitHub link.',
 now() + interval '5 days', 50);
