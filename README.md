# LearnSphere: Learning Management System

A full-stack **Learning Management System (LMS)** built as the Quillance Infotech Full Stack Development major project.
Students enroll in courses, study ordered modules, submit assignments and track their progress. Instructors build courses and review work. Admins manage users and roles.

> **Major Project:** Full Stack Development · Quillance Infotech Pvt. Ltd.
> **Student:** Abhyuday Saksena
> **Live application:** https://quillancemaajorproject1-client.vercel.app
> **Repository:** https://github.com/abhyudaysaksena06/QuillanceMaajorProject_1
> **Full documentation (PDF):** [submission/LearnSphere_LMS_Documentation.pdf](submission/LearnSphere_LMS_Documentation.pdf)

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
- **One account per email**: signing in with Google or with email + password reaches the same profile, courses and progress. The server re-links accounts by email only when Firebase has verified that email.
- **Sign-in & security** on the Profile page: create a password (for Google users), change it (asks for the current one), and link a Google account.
- Each API request carries a Firebase **ID token**. The Express server checks it with the Firebase Admin SDK before it touches the database.
- The user record is created in Supabase automatically on first login. The user then picks a role (**Student** or **Instructor**) during onboarding.
- **Role-based access control (RBAC)** on both the server (`requireRole` middleware plus ownership checks) and the client (protected routes).
- Emails listed in `ADMIN_EMAILS` get the **Admin** role automatically. Admins can promote users or deactivate them.

### Public pages
- **Home / About** page: features, how it works, and featured courses (no login needed). Also **Login** and **Registration**.

### Student
- **Dashboard**: enrolled courses, completed courses, modules completed, pending assignments, average marks, overall progress, upcoming deadlines and **recent activity**.
- **Course catalog** with search, category and difficulty filters, and sorting (newest, oldest, A–Z).
- **Enroll and leave** courses.
- **Course modules** in order, each with notes, an embedded YouTube/Vimeo video and **learning materials** (notes, PDF, video, source code, reference and practice-exercise links), previous/next navigation and **mark as complete**.
- **Module quizzes**: multiple-choice knowledge checks graded on the server (answers are never sent to the browser before submitting). A module with a quiz is completed by reaching its pass mark; explanations are shown after each attempt.
- **Certificates**: issued automatically at 100% completion, printable, with a public verification page at `/verify/:id`.
- **Course discussion**: ask questions, reply, upvote; the instructor can mark the accepted answer.
- **Personal notes** per course, saved in the browser and exportable as `.txt`.
- **Progress tracking**: percentage, progress bar and status (Not started / In progress / Completed) per course and overall.
- **Assignments**: see instructions, deadline and maximum marks. Submit text, a GitHub/Drive/project link and/or a **file** (PDF, ZIP, DOCX, PNG, JPG up to 10 MB, stored in Supabase Storage). Turn work in straight from the **Assignments** list (To do / Submitted / Graded tabs) or from the assignment page, and update it until it's graded. See marks, feedback and status (Submitted / Graded / Resubmission requested / Missed / Late).

### Instructor
- **Course management**: create, edit and delete courses. Set title, description, category, instructor, duration, difficulty, image, and draft or published status.
- **Module management**: add, edit, reorder (↑/↓) and delete modules, and attach learning materials.
- **Assignment management**: set a due date and max points.
- **Submission review**: a central Submissions page with Awaiting review / Graded / Resubmission tabs. Award marks with feedback, or request a resubmission. Late submissions are flagged.
- **Student roster** showing each enrolled student's progress.
- Dashboard with course, student and enrollment stats, **charts** (30-day enrollment trend, learners per course, submission breakdown, completion rate) and a grading queue (oldest first).
- **Quiz builder** in the module editor, with a pass mark per module.
- **Gradebook CSV export** (progress, completion, certificate and marks per assignment).
- **Announcements** to everyone enrolled in a course.

### Admin
- **Manage users**: search and filter students, instructors and admins. See enrollment and course counts, change roles, activate or deactivate accounts.
- Platform-wide statistics. Admins can also manage any course and **transfer course ownership**.
- **Platform announcements** to everyone, all students or all instructors.

### Everyone
- **Notifications** bell: new assignments, marks, resubmission requests, certificates, discussion replies and announcements. Optional email copies when SMTP is configured.
- **Profile photo upload** (Supabase Storage).
- API **rate limiting** and Helmet security headers.

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
11 tables: `users`, `courses`, `lessons` (course **modules**, with quiz), `enrollments` (with certificate), `lesson_progress`, `quiz_attempts`, `assignments`, `submissions`, `discussions`, `discussion_replies`, `notifications`; plus two storage buckets (`submissions`, `avatars`). Enrollment progress and status are **calculated** from `lesson_progress`, so they never go out of sync. See [`database/schema.sql`](database/schema.sql) and the [ER diagram](database/ER-diagram.md).

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
1. Create a project, open **SQL Editor**, paste [`database/setup_all.sql`](database/setup_all.sql) and run it. It creates every table, the storage buckets and the sample courses.
   Already ran an older version? Run [`database/migration_002_features.sql`](database/migration_002_features.sql) instead.
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
Course ratings and reviews, live classes, attendance tracking, and real-time notifications over WebSockets.

## Security highlights
- Firebase ID tokens are checked on **every** API request. Tokens are short-lived and refreshed automatically.
- The Supabase service-role key exists only on the server. RLS blocks direct anon access.
- Server-side ownership checks: instructors can change only their own courses, and students only their own submissions.
- Input whitelisting (`pick`), validation, Helmet security headers, a CORS allow-list, and deactivated-account blocking.
