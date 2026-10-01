-- run once in the Supabase SQL Editor (safe to re-run)

-- quizzes on modules
alter table public.lessons add column if not exists quiz jsonb not null default '[]'::jsonb;
alter table public.lessons add column if not exists pass_mark integer not null default 60 check (pass_mark between 0 and 100);

create table if not exists public.quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  score       integer not null,
  passed      boolean not null,
  answers     jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists quiz_attempts_user_lesson_idx on public.quiz_attempts(user_id, lesson_id);

-- certificates
alter table public.enrollments add column if not exists completed_at timestamptz;
alter table public.enrollments add column if not exists certificate_id text unique;

-- file submissions
alter table public.submissions add column if not exists file_path text;
alter table public.submissions add column if not exists file_name text;

-- discussions
create table if not exists public.discussions (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text not null,
  body        text,
  upvotes     uuid[] not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists discussions_course_idx on public.discussions(course_id, created_at desc);

create table if not exists public.discussion_replies (
  id                    uuid primary key default gen_random_uuid(),
  discussion_id         uuid not null references public.discussions(id) on delete cascade,
  user_id               uuid not null references public.users(id) on delete cascade,
  body                  text not null,
  is_instructor_answer  boolean not null default false,
  created_at            timestamptz not null default now()
);
create index if not exists discussion_replies_idx on public.discussion_replies(discussion_id, created_at);

-- notifications
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        text not null,
  title       text not null,
  message     text,
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, is_read, created_at desc);

alter table public.quiz_attempts       enable row level security;
alter table public.discussions         enable row level security;
alter table public.discussion_replies  enable row level security;
alter table public.notifications       enable row level security;

-- storage buckets (submission files are private, avatars are public)
insert into storage.buckets (id, name, public) values
  ('submissions', 'submissions', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- sample quizzes for the first two modules of the sample course
update public.lessons set quiz = '[
  {"question":"Which tag holds the main content of a page?","options":["<section>","<main>","<div>","<body>"],"answer":1,"explanation":"<main> marks the dominant content of the document and should appear once."},
  {"question":"Which attribute gives an image a text alternative?","options":["title","src","alt","aria-label"],"answer":2,"explanation":"alt is read by screen readers and shown if the image fails to load."},
  {"question":"Which input type shows a date picker?","options":["text","datetime","calendar","date"],"answer":3,"explanation":"type=\"date\" renders the browser''s native date picker."}
]'::jsonb
where title = 'HTML Fundamentals' and quiz = '[]'::jsonb;

update public.lessons set quiz = '[
  {"question":"In the box model, which layer sits between border and content?","options":["margin","padding","outline","gap"],"answer":1,"explanation":"Content → padding → border → margin, from inside out."},
  {"question":"Which property turns an element into a flex container?","options":["display: flex","flex: 1","position: flex","align: flex"],"answer":0,"explanation":"display: flex makes direct children flex items."},
  {"question":"Which unit is relative to the root font size?","options":["em","px","rem","%"],"answer":2,"explanation":"rem is relative to the <html> font size; em is relative to the parent."}
]'::jsonb
where title = 'CSS Fundamentals' and quiz = '[]'::jsonb;
