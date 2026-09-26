# 🎓 LearnSphere: Learning Management System

A full-stack **Learning Management System (LMS)** built as the Quillance Infotech Full Stack Development major project.
Students enroll in courses, work through lessons, track their progress and submit assignments. Instructors build courses and grade work. Admins manage users and roles.

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router 6, custom responsive CSS |
| Authentication | **Firebase Authentication** (Google Sign-In) |
| Backend API | Node.js, Express 4, Firebase Admin SDK (token verification), Helmet, CORS |
| Database | **Supabase** (PostgreSQL) with Row Level Security |
| Deployment | Vercel (frontend), Render/Railway (backend), Supabase (DB) |

---

## ✨ Features

### Authentication and roles
- One-click **Google Sign-In** through Firebase.
- Each API request carries a Firebase **ID token**. The Express server checks it with the Firebase Admin SDK before it touches the database.
- The user record is created in Supabase automatically on first login. The user then picks a role (**Student** or **Instructor**) during onboarding.
- **Role-based access control (RBAC)** on both the server (`requireRole` middleware plus ownership checks) and the client (protected routes).
- Emails listed in `ADMIN_EMAILS` get the **Admin** role automatically. Admins can promote users or deactivate them.

### Student
- **Dashboard**: enrolled courses, lessons completed, pending assignments, average grade, overall progress and upcoming deadlines.
- **Course catalog** with search and category filter.
- **Enroll and leave** courses.
- **Lesson player** with embedded YouTube/Vimeo video, written content, previous/next navigation and **mark as complete**.
- **Progress tracking** per course and overall.
- **Assignments**: submit a written answer and/or a link, resubmit until graded, then see the grade and feedback.

### Instructor
- **Course management**: create, edit and delete courses. Set title, description, category, level, thumbnail, and draft or published status.
- **Lesson management**: add, edit, reorder (↑/↓) and delete lessons.
- **Assignment management**: set a due date and max points.
- **Grading**: view every submission, give a grade and written feedback.
- **Student roster** showing each enrolled student's progress.
- Dashboard with course, student and enrollment stats plus a "waiting for grading" queue.

### Admin
- User management: search users, change roles, activate or deactivate accounts.
- Platform-wide statistics. Admins can also manage any course.

---

## 🏗️ Architecture

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
7 tables: `users`, `courses`, `lessons`, `enrollments`, `lesson_progress`, `assignments`, `submissions`. See [`database/schema.sql`](database/schema.sql) and the [ER diagram](database/ER-diagram.md).

---

## 🚀 Getting started

### Prerequisites
Node.js 18+, a [Firebase](https://console.firebase.google.com) project, and a [Supabase](https://supabase.com) project.

### 1. Supabase
1. Create a project, open **SQL Editor**, paste [`database/schema.sql`](database/schema.sql) and run it.
2. Copy the **Project URL** and the **service_role key** from Project Settings → API.

### 2. Firebase
1. Create a project, then go to **Authentication → Sign-in method** and enable **Google**.
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

## ☁️ Deployment
- **Backend → Render / Railway**: root directory `server`, start command `npm start`. Set every variable from `server/.env.example`, and set `CLIENT_URL` to your frontend URL.
- **Frontend → Vercel / Netlify**: root directory `client`, build `npm run build`, output `dist`. Set the `VITE_*` variables, with `VITE_API_URL` pointing at the backend URL. `vercel.json` handles SPA routing.
- Add the frontend domain to Firebase **Authorized domains**.

## 📡 API
See [`docs/API.md`](docs/API.md).

## 🎬 Demo video
See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) for a 60-second walkthrough script.

## 🔐 Security highlights
- Firebase ID tokens are checked on **every** API request. Tokens are short-lived and refreshed automatically.
- The Supabase service-role key exists only on the server. RLS blocks direct anon access.
- Server-side ownership checks: instructors can change only their own courses, and students only their own submissions.
- Input whitelisting (`pick`), validation, Helmet security headers, a CORS allow-list, and deactivated-account blocking.
