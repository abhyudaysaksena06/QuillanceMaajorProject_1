# REST API Reference

Base URL: `/api`. Every endpoint except `/health` needs `Authorization: Bearer <Firebase ID token>`.

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/health` | public | Health check |
| GET | `/public/courses` | public | Featured courses for the home page |
| GET | `/public/certificates/:id` | public | Verify a certificate |
| GET | `/auth/me` | any | Current user profile (created on first login) |
| POST | `/auth/onboard` | any (once) | Choose `student` or `instructor` |
| PATCH | `/auth/me` | any | Update name / bio |
| POST | `/auth/me/avatar` | any | Upload profile photo (multipart `avatar`) |
| GET | `/courses` | any | Published catalog (`?search=&category=&level=&sort=newest|oldest|title`) |
| GET | `/courses/enrolled` | any | My enrolled courses with progress |
| GET | `/courses/mine` | instructor, admin | Courses I teach |
| GET | `/courses/:id` | any | Course detail, lessons, assignments, my progress |
| POST | `/courses` | instructor, admin | Create course |
| PATCH / DELETE | `/courses/:id` | owner, admin | Update / delete course |
| POST / DELETE | `/courses/:id/enroll` | any | Enroll / leave |
| GET | `/courses/:id/students` | owner, admin | Roster with progress |
| GET | `/courses/:id/gradebook` | owner, admin | Progress, certificates and marks for CSV export |
| POST | `/courses/:id/announce` | owner, admin | Notify every enrolled student |
| GET / POST | `/courses/:id/discussions` | enrolled, owner | List / create discussion questions |
| POST | `/lessons` | owner, admin | Create lesson |
| PATCH / DELETE | `/lessons/:id` | owner, admin | Update (incl. reorder) / delete |
| POST / DELETE | `/lessons/:id/complete` | enrolled | Mark complete / incomplete (modules without a quiz) |
| POST | `/lessons/:id/quiz` | enrolled | Submit quiz answers; graded on the server |
| GET | `/assignments` | any | Assignments across my enrolled courses |
| GET | `/assignments/:id` | enrolled, owner | Detail (+ all submissions for owner) |
| POST | `/assignments` | owner, admin | Create assignment |
| PATCH / DELETE | `/assignments/:id` | owner, admin | Update / delete |
| POST | `/assignments/:id/submit` | enrolled | Submit / resubmit until graded (multipart: `content`, `link_url`, `file`) |
| PATCH | `/assignments/submissions/:id/grade` | owner, admin | Grade + feedback |
| GET | `/dashboard` | any | Role-specific statistics |
| GET | `/admin/users` | admin | List users |
| PATCH | `/admin/users/:id` | admin | Change role / activate / deactivate |
| GET | `/admin/instructors` | admin | Instructors and admins (for ownership transfer) |
| PATCH | `/admin/courses/:id/owner` | admin | Transfer course ownership |
| POST | `/admin/announce` | admin | Announcement to everyone / students / instructors |
| POST | `/discussions/:id/replies` | enrolled, owner | Reply to a question |
| POST | `/discussions/:id/upvote` | enrolled, owner | Toggle upvote |
| PATCH | `/discussions/replies/:id/answer` | owner | Mark / unmark instructor answer |
| DELETE | `/discussions/:id` | author, owner | Delete a question |
| GET | `/notifications` | any | Latest notifications and unread count |
| POST | `/notifications/read-all` | any | Mark all as read |
| PATCH | `/notifications/:id/read` | any | Mark one as read |

Errors come back as `{ "error": "message" }` with a matching HTTP status (400, 401, 403, 404, 409 or 500).
