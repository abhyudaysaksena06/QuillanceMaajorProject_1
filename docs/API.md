# REST API Reference

Base URL: `/api`. Every endpoint except `/health` needs `Authorization: Bearer <Firebase ID token>`.

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/health` | public | Health check |
| GET | `/auth/me` | any | Current user profile (created on first login) |
| POST | `/auth/onboard` | any (once) | Choose `student` or `instructor` |
| PATCH | `/auth/me` | any | Update name / bio |
| GET | `/courses` | any | Published catalog (`?search=&category=`) |
| GET | `/courses/enrolled` | any | My enrolled courses with progress |
| GET | `/courses/mine` | instructor, admin | Courses I teach |
| GET | `/courses/:id` | any | Course detail, lessons, assignments, my progress |
| POST | `/courses` | instructor, admin | Create course |
| PATCH / DELETE | `/courses/:id` | owner, admin | Update / delete course |
| POST / DELETE | `/courses/:id/enroll` | any | Enroll / leave |
| GET | `/courses/:id/students` | owner, admin | Roster with progress |
| POST | `/lessons` | owner, admin | Create lesson |
| PATCH / DELETE | `/lessons/:id` | owner, admin | Update (incl. reorder) / delete |
| POST / DELETE | `/lessons/:id/complete` | enrolled | Mark complete / incomplete |
| GET | `/assignments` | any | Assignments across my enrolled courses |
| GET | `/assignments/:id` | enrolled, owner | Detail (+ all submissions for owner) |
| POST | `/assignments` | owner, admin | Create assignment |
| PATCH / DELETE | `/assignments/:id` | owner, admin | Update / delete |
| POST | `/assignments/:id/submit` | enrolled | Submit / resubmit (until graded) |
| PATCH | `/assignments/submissions/:id/grade` | owner, admin | Grade + feedback |
| GET | `/dashboard` | any | Role-specific statistics |
| GET | `/admin/users` | admin | List users |
| PATCH | `/admin/users/:id` | admin | Change role / activate / deactivate |

Errors come back as `{ "error": "message" }` with a matching HTTP status (400, 401, 403, 404, 409 or 500).
