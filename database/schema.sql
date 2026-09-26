-- =====================================================================
-- LearnSphere LMS - Supabase (PostgreSQL) schema
-- Run in Supabase Dashboard -> SQL Editor.
-- Authentication is handled by Firebase (Google Sign-In). The Express
-- API verifies Firebase ID tokens and talks to Supabase with the
-- service-role key, so RLS is enabled with NO public policies: the
-- anon key cannot read or write any table directly.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- users ----------
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

-- ---------- courses ----------
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

-- ---------- lessons ----------
create table if not exists public.lessons (
  id                uuid primary key default gen_random_uuid(),
  course_id         uuid not null references public.courses(id) on delete cascade,
  title             text not null,
  content           text,
  video_url         text,
  position          integer not null default 1,
  duration_minutes  integer,
  resources         jsonb not null default '[]'::jsonb,  -- [{ "type": "pdf", "label": "...", "url": "..." }]
  created_at        timestamptz not null default now()
);
create index if not exists lessons_course_idx on public.lessons(course_id, position);

-- ---------- enrollments ----------
create table if not exists public.enrollments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  enrolled_at  timestamptz not null default now(),
  unique (user_id, course_id)
);
create index if not exists enrollments_course_idx on public.enrollments(course_id);

-- ---------- lesson progress ----------
create table if not exists public.lesson_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- ---------- assignments ----------
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

-- ---------- submissions ----------
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

-- ---------- Row Level Security ----------
alter table public.users            enable row level security;
alter table public.courses          enable row level security;
alter table public.lessons          enable row level security;
alter table public.enrollments      enable row level security;
alter table public.lesson_progress  enable row level security;
alter table public.assignments      enable row level security;
alter table public.submissions      enable row level security;
-- No policies are created on purpose: only the service role (the API) has access.
