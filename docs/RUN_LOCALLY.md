# Run LearnSphere on your PC

About 15 minutes the first time. You need **Node.js 18+** ([nodejs.org](https://nodejs.org)) and **Git**.

## 1. Get the code
```bash
git clone https://github.com/abhyudaysaksena06/QuillanceMaajorProject_1.git
cd QuillanceMaajorProject_1
npm run setup
```

## 2. Supabase (database)
1. Sign in at [supabase.com](https://supabase.com) and create a **New project**. Wait about a minute for it to start.
2. Go to **SQL Editor → New query**, paste all of `database/setup_all.sql` and click **Run**. This creates the tables, the file storage buckets and the sample courses.
3. Go to **Project Settings → API** and copy the **Project URL** and the **service_role** key.

## 3. Firebase (login)
1. At [console.firebase.google.com](https://console.firebase.google.com), click **Add project**.
2. Go to **Build → Authentication → Get started → Sign-in method** and enable **Email/Password** and **Google**.
3. Open **Project settings** (the gear icon). Under **General → Your apps**, click the **Web** icon `</>`, register the app, and copy the `firebaseConfig` values.
4. Under **Project settings → Service accounts**, click **Generate new private key**. A JSON file downloads.

## 4. Environment files
Copy the two example files:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
On Windows PowerShell, use `copy` instead of `cp`.

**server/.env**
```
SUPABASE_URL=            ← Project URL
SUPABASE_SERVICE_ROLE_KEY=  ← service_role key
FIREBASE_PROJECT_ID=     ← "project_id" from the JSON file
FIREBASE_CLIENT_EMAIL=   ← "client_email" from the JSON file
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"   ← "private_key", keep the quotes
ADMIN_EMAILS=admin@learnsphere.demo,your-own@gmail.com
```

**client/.env**
```
VITE_FIREBASE_API_KEY=      ← apiKey
VITE_FIREBASE_AUTH_DOMAIN=  ← authDomain
VITE_FIREBASE_PROJECT_ID=   ← projectId
VITE_FIREBASE_APP_ID=       ← appId
```

## 5. Create the demo accounts
```bash
npm run seed:demo
```

## 6. Start the app
```bash
npm run dev
```
Open **http://localhost:5173**. The API runs on http://localhost:5000; check http://localhost:5000/api/health.

## Demo accounts
Every account uses the password **`Demo@1234`**.

| Role | Email | What you'll see |
|---|---|---|
| Student | `student@learnsphere.demo` | 2 enrolled courses, some modules done, one graded assignment |
| Student | `student2@learnsphere.demo` | 1 course, one submission waiting for review |
| Instructor | `instructor@learnsphere.demo` | Owns the 3 sample courses; has a submission to grade |
| Admin | `admin@learnsphere.demo` | User management and platform statistics |

## Troubleshooting
| Problem | Fix |
|---|---|
| `SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set` | `server/.env` is missing or still has placeholder values |
| `Failed to parse private key` | Keep `FIREBASE_PRIVATE_KEY` in double quotes, with the `\n` characters as they are |
| `auth/invalid-api-key` in the browser | Check `client/.env`, then restart `npm run dev` |
| `Could not find the table 'public.users'` | `setup_all.sql` hasn't been run in Supabase yet |
| Google popup: `unauthorized-domain` | Firebase → Authentication → Settings → Authorized domains: add `localhost` |
| Port 5173 or 5000 already in use | Close the other app, or change `PORT` in `server/.env` |
