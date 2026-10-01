# LearnSphere: Learning Management System

A full-stack **Learning Management System (LMS)** built as the Quillance Infotech Full Stack Development major project.
Students enroll in courses, study ordered modules, submit assignments and track their progress. Instructors build courses and review work. Admins manage users and roles.

> **Author:** Abhyuday Saksena · Full Stack Development Intern, Quillance Infotech Pvt. Ltd.
> **Live demo:** _add your deployment link here_

## Problem statement & objectives
Online learning is often spread across chat groups, drive folders and spreadsheets. There's no single place to see course content, deadlines, submissions and progress. LearnSphere brings this into one platform with secure, role-based dashboards.

- Centralised platform for courses, modules, assignments and students
- Secure registration, login and role-based access
- Instructors/admins create, edit and manage courses, modules and assignments
- Students enroll, study materials and submit assignments
- Course completion is tracked and shown on dashboards
- Demonstrates frontend, backend, REST APIs, authentication, database and deployment

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router 6, custom responsive CSS |
| Authentication | **Firebase Authentication**: email/password (passwords hashed by Firebase) + Google Sign-In |
| Backend API | Node.js, Express 4, Firebase Admin SDK (token verification), Helmet, CORS |
| Database | **Supabase** (PostgreSQL) with Row Level Security |
| Deployment | Vercel (frontend), Render/Railway (backend), Supabase (DB) |

---

## Features

### Authentication and roles
- **Registration and login with email and password**, with form validation, clear errors for wrong credentials or an already-registered email, and **password reset** by email. Firebase stores passwords as salted hashes (scrypt), and they never reach our server or database.
- One-click **Google Sign-In** through Firebase.
- Each API request carries a Firebase **ID token**. The Express server checks it with the Firebase Admin SDK before it touches the database.
- The user record is created in Supabase automatically on first login. The user then picks a role (**Student** or **Instructor**) during onboarding.
- **Role-based access control (RBAC)** on both the server (`requireRole` middleware plus ownership checks) and the client (protected routes).
- Emails listed in `ADMIN_EMAILS` get the **Admin** role automatically. Admins can promote users or deactivate them.

### Public pages
- **Home / About** page: features, how it works, and featured courses (no login needed). Also **Login** and **Registration**.

### Student
- **Dashboard**: enrolled courses, completed courses, modules completed, pending assignments, average marks, overall progress, upcoming deadlines and **recent activity**.
- **Course catalog** with search and category filter.
- **Enroll and leave** courses.
- **Course modules** in order, each with notes, an embedded YouTube/Vimeo video and **learning materials** (notes, PDF, video, source code, reference and practice-exercise links), previous/next navigation and **mark as complete**.
- **Progress tracking**: percentage, progress bar and status (Not started / In progress / Completed) per course and overall.
- **Assignments**: see instructions, deadline and maximum marks. Submit text and/or a GitHub, Drive or project link. Update the submission until it's graded. See marks, feedback and status (Submitted / Graded / Resubmission requested / Missed / Late).

### Instructor
- **Course management**: create, edit and delete courses. Set title, description, category, instructor, duration, difficulty, image, and draft or published status.
- **Module management**: add, edit, reorder (↑/↓) and delete modules, and attach learning materials.
- **Assignment management**: set a due date and max points.
- **Submission review**: a central Submissions page with Awaiting review / Graded / Resubmission tabs. Award marks with feedback, or request a resubmission. Late submissions are flagged.
- **Student roster** showing each enrolled student's progress.
- Dashboard with course, student and enrollment stats plus a "waiting for grading" queue.

### Admin
- **Manage users**: search and filter students, instructors and admins. See enrollment and course counts, change roles, activate or deactivate accounts.
- Platform-wide statistics. Admins can also manage any course.

---

## Architecture

```
┌──────────────────────┐   Google popup   ┌───────────────────────┐
│   React (Vite) SPA   │ ───────────────▶ │ Firebase Auth (Google)│
│  client/             │ ◀─── ID token ── └───────────────────────┘
│                      │
│  fetch /api/*        │  Authorization: Bearer <Firebase ID token>
└─────────┬────────────┘
          ▼
┌──────────────────────┐  verifyIdToken()  ┌───────────────────────┐
│  Express REST API    │ ────────────────▶ │  Firebase Admin SDK   │
│  server/             │                   └───────────────────────┘
│  auth → RBAC → route │  service-role key ┌───────────────────────┐
│                      │ ────────────────▶ │ Supabase PostgreSQL   │
└──────────────────────┘                   │ (RLS on, no public    │
                                           │  policies)            │
                                           └───────────────────────┘
```

**Why this design?** The browser never talks to Supabase directly. It only holds a Firebase token, and the anon key cannot read any table because of RLS. Every business rule is enforced on the server: who owns a course, who is enrolled, who can grade. Those rules can't be bypassed from the browser.

### Folder structure
```
├── client/                  React frontend
│   └── src/
│       ├── api.js           fetch wrapper (adds Firebase ID token)
│       ├── firebase.js      Firebase client init + Google provider
│       ├── context/         AuthContext (session + profile)
│       ├── components/      Layout, ProtectedRoute, CourseCard, ProgressBar…
│       └── pages/           Login, Onboarding, Dashboard, Courses, CourseDetail,
│                            LessonView, MyLearning, Assignments, AssignmentDetail,
│                            Teach, CourseEditor, Admin, Profile
├── server/                  Express backend
│   └── src/
│       ├── config/          firebase-admin + supabase clients
│       ├── middleware/      authenticate (token → user), requireRole
│       └── routes/          auth, courses, lessons, assignments, dashboard, admin
├── database/
│   ├── schema.sql           full Supabase schema (tables, constraints, indexes, RLS)
│   └── ER-diagram.md        entity-relationship diagram (Mermaid)
└── docs/                    API reference, demo script, screenshots
```

### Database schema
7 tables: `users`, `courses`, `lessons` (course **modules**), `enrollments`, `lesson_progress`, `assignments`, `submissions`. Enrollment progress and status are **calculated** from `lesson_progress`, so they never go out of sync. See [`database/schema.sql`](database/schema.sql) and the [ER diagram](database/ER-diagram.md).

---

## Demo accounts
After running `npm run seed:demo` (see [docs/RUN_LOCALLY.md](docs/RUN_LOCALLY.md)), every account uses the password **`Demo@1234`**:

| Role | Email |
|---|---|
| Student | `student@learnsphere.demo` |
| Student | `student2@learnsphere.demo` |
| Instructor | `instructor@learnsphere.demo` |
| Admin | `admin@learnsphere.demo` |

## Quick start
```bash
npm run setup      # install root, server and client packages
npm run seed:demo  # create demo accounts (after filling in the .env files)
npm run dev        # API on :5000 and web app on :5173, together
```
Full step-by-step guide: **[docs/RUN_LOCALLY.md](docs/RUN_LOCALLY.md)**

## Getting started

### Prerequisites
Node.js 18+, a [Firebase](https://console.firebase.google.com) project, and a [Supabase](https://supabase.com) project.

### 1. Supabase
1. Create a project, open **SQL Editor**, paste [`database/schema.sql`](database/schema.sql) and run it.
   Then (optionally) run [`database/seed.sql`](database/seed.sql) for sample courses, modules and assignments.
2. Copy the **Project URL** and the **service_role key** from Project Settings → API.

### 2. Firebase
1. Create a project, then go to **Authentication → Sign-in method** and enable **Email/Password** and **Google**.
2. **Project settings → General → Add web app**, then copy the config values (for the client).
3. **Project settings → Service accounts → Generate new private key**, then copy `project_id`, `client_email` and `private_key` (for the server).
4. Add your deployed frontend domain under **Authentication → Settings → Authorized domains**.

### 3. Backend
```bash
cd server
cp .env.example .env      # fill in Supabase + Firebase Admin values and ADMIN_EMAILS
npm install
npm run dev               # http://localhost:5000
```

### 4. Frontend
```bash
cd client
cp .env.example .env      # fill in Firebase web config
npm install
npm run dev               # http://localhost:5173 (proxies /api to :5000)
```

Sign in with Google. If your email is in `ADMIN_EMAILS`, you become an admin straight away.

---

## Deployment
- **Backend → Render / Railway**: root directory `server`, start command `npm start`. Set every variable from `server/.env.example`, and set `CLIENT_URL` to your frontend URL.
- **Frontend → Vercel / Netlify**: root directory `client`, build `npm run build`, output `dist`. Set the `VITE_*` variables, with `VITE_API_URL` pointing at the backend URL. `vercel.json` handles SPA routing.
- Add the frontend domain to Firebase **Authorized domains**.

## API
See [`docs/API.md`](docs/API.md).

## Demo video
See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) for a 60-second walkthrough script.

## Screenshots
Put screenshots in [`docs/screenshots/`](docs/screenshots/) and link them here, for example:

| Home | Student dashboard | Module view |
|---|---|---|
| ![](docs/screenshots/home.png) | ![](docs/screenshots/student-dashboard.png) | ![](docs/screenshots/module.png) |

## Testing
See [`docs/TESTING.md`](docs/TESTING.md) for the test checklist.

## Future improvements
Quizzes, certificate generation, email notifications, a discussion forum, course ratings, dark mode, file uploads (Supabase Storage) and analytics charts.

## Security highlights
- Firebase ID tokens are checked on **every** API request. Tokens are short-lived and refreshed automatically.
- The Supabase service-role key exists only on the server. RLS blocks direct anon access.
- Server-side ownership checks: instructors can change only their own courses, and students only their own submissions.
- Input whitelisting (`pick`), validation, Helmet security headers, a CORS allow-list, and deactivated-account blocking.
