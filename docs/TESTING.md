# Testing Checklist

Manual tests against the project brief's checklist. Tick them off before you submit.

| # | Test | How | Expected |
|---|---|---|---|
| 1 | Registration and login | Register with email and password, sign out, sign in again | Dashboard opens; profile is created in `users` |
| 2 | Wrong credentials | Sign in with a wrong password | "Incorrect email or password." |
| 3 | Duplicate registration | Register again with the same email | "An account with this email already exists." |
| 4 | Form validation | Submit empty or short fields on the register, course, module and assignment forms | Field errors; nothing saved |
| 5 | Role protection (UI) | As a student, open `/teach`, `/teach/submissions`, `/admin` | Redirected to the dashboard |
| 6 | Role protection (API) | As a student, `POST /api/courses` with your token | `403` |
| 7 | No token | `GET /api/courses` without an `Authorization` header | `401` |
| 8 | Course CRUD | As an instructor, create, edit, publish and delete a course | Changes show in the catalog |
| 9 | Ownership | Instructor B tries to edit instructor A's course via the API | `403` |
| 10 | Duplicate enrollment | Enroll twice (click, or call the API again) | `409 Already enrolled`; one row (DB unique constraint) |
| 11 | Module progress | Mark modules complete / incomplete | Progress % and bar update; 100% shows "Completed" |
| 12 | Assignment submission | Submit text + link, refresh | Submission persists with status "Submitted" |
| 13 | Review | Instructor grades with marks > max, then a valid mark | Error, then "Graded: x/max" for the student |
| 14 | Resubmission | Instructor requests a resubmission; student resubmits | Status goes Resubmission requested → Submitted |
| 15 | Deactivated user | Admin deactivates a user, who then calls the API | `403` |
| 16 | Responsive | Resize to about 375px wide | Sidebar becomes  menu; no horizontal scroll |
| 17 | Persistence | Restart the server, refresh the browser | All data is still there (Supabase) |
