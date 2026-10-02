# Testing checklist

These are the checks I ran by hand on the live site, based on the testing list in the project brief.

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
| 18 | Quiz | Fail a module quiz, then pass it | Fail shows score and explanations; pass completes the module |
| 19 | Quiz security | Inspect the course API response as a student | Questions and options only, no correct answers |
| 20 | Certificate | Complete every module of a course | Notification + certificate; `/verify/:id` works logged out |
| 21 | File submission | Upload a PDF, then a 15 MB file, then an .exe | PDF stored and downloadable by the instructor; the others are rejected |
| 22 | Discussion | Ask, reply, upvote; instructor marks an answer | Answer badge shown; asker gets a notification |
| 23 | Notifications | Grade a submission / post an assignment | Bell count increases for the student(s) |
| 24 | CSV export | Instructor exports the gradebook | CSV opens in Excel with marks per assignment |
| 25 | Ownership transfer | Admin changes a course's owner | New owner can edit it; old owner cannot |
| 26 | Create password | Sign in with Google → Profile → Create password → sign out → sign in with email + that password | Same dashboard, courses and progress |
| 27 | Change password | Profile → Change password with a wrong current password, then the right one | Error, then success; old password stops working |
| 28 | Same account | Register with email + password, sign out, sign in with Google using the same Gmail | Same courses and progress (Firebase may ask you to create the password again from Profile) |

