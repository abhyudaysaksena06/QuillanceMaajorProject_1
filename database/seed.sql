-- =====================================================================
-- Sample data: the "Full Stack Development" course from the project brief.
-- Run AFTER schema.sql. The demo instructor is a placeholder account that
-- cannot log in; sign in as an admin (ADMIN_EMAILS) to edit these courses,
-- or reassign them to a real instructor:
--   update courses set instructor_id = (select id from users where email = 'you@example.com');
-- =====================================================================

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
