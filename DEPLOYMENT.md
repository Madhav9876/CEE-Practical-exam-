# Deployment Guide — Vercel + Render + Supabase

Frontend on **Vercel** (static), backend on **Render** (Node/Express), database on
**Supabase** (PostgreSQL).

```
Vercel (static SPA)  ──HTTPS──▶  Render (Express API)  ──SSL──▶  Supabase (PostgreSQL)
```

The backend runs on **SQLite** locally and **PostgreSQL** in production. The engine is
chosen automatically: if `DATABASE_URL` is set, PostgreSQL is used; otherwise SQLite.
No code changes are needed to switch.

---

## Prerequisites

- Node.js 18+
- Code pushed to GitHub
- Accounts on Vercel, Render, and Supabase

---

## Step 1 — Supabase (database)

1. Create a project at [supabase.com](https://supabase.com). Save the database password.
2. Go to **Settings → Database → Connection string → URI** and copy it:
   ```
   postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```

You do **not** need to run any SQL by hand. The backend creates its tables
automatically on first boot (`server/schema-postgres.js`, idempotent).

---

## Step 2 — Seed the database

Run this once from your machine, pointing at Supabase:

```powershell
$env:DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
npm install
npm run seed
```

```bash
# macOS / Linux
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
npm install && npm run seed
```

This creates the schema, three demo accounts, and 48 draft question sets.

---

## Step 3 — Render (backend)

Either use the included `render.yaml` blueprint, or configure manually:

| Setting | Value |
|---|---|
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/api/v1/health` |

Environment variables:

```
NODE_ENV=production
DATABASE_URL=<your Supabase connection string>
JWT_SECRET=<openssl rand -hex 32>
CORS_ORIGIN=https://<your-project>.vercel.app
```

Notes:
- Do **not** set `PORT`; Render injects it.
- `CORS_ORIGIN` must match your Vercel origin exactly (scheme + host, no trailing
  slash). Comma-separate multiple origins.

Verify: `https://<service>.onrender.com/api/v1/health` should return
`{"success":true,...,"engine":"postgres",...}`.

---

## Step 4 — Vercel (frontend)

1. Import the repo. Framework preset **Other**; leave the build command empty.
   `vercel.json` already sets the output directory to `public`.
2. Point the frontend at your backend by editing **`public/config.js`**:

   ```js
   window.__CEE_CONFIG__ = {
     apiBaseUrl: 'https://cee-nepal-backend.onrender.com'
   };
   ```

   Commit and push. The `/api/v1` suffix is appended automatically, and this file
   is served with `no-store` so updates take effect immediately.

3. Deploy, then open the Vercel URL and log in.

---

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Teacher | `teacher@cee.edu.np` | `teacher123` |
| Student | `student@cee.edu.np` | `student123` |
| Admin | `admin@cee.edu.np` | `admin123` |

Remove or change these before real use.

---

## Local development

```bash
npm install
npm run seed     # SQLite at ./data/cee.db
npm start        # http://localhost:3000
npm test         # end-to-end workflow test (server must be running)
```

With no `DATABASE_URL`, the backend serves the frontend itself, so `public/config.js`
can keep `apiBaseUrl: ''` and requests stay same-origin.

To test the PostgreSQL path locally, set `DATABASE_URL` before `npm start`.

---

## Production checklist

- [ ] `JWT_SECRET` is a 32+ character random value (not the default)
- [ ] `CORS_ORIGIN` is your exact Vercel origin, not `*`
- [ ] `/api/v1/health` returns `"engine":"postgres"`
- [ ] Database seeded; demo accounts removed or rotated
- [ ] Supabase backups enabled

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| CORS error in browser | `CORS_ORIGIN` on Render does not match the Vercel origin exactly. |
| Frontend loads but every request fails | `apiBaseUrl` in `public/config.js` is wrong or still empty. |
| `502` on Render | Check logs. Usually a bad `DATABASE_URL` — the server exits if the DB is unreachable at boot. |
| `self signed certificate` / SSL error | Expected against Supabase; the adapter already sets `rejectUnauthorized: false`. For a local Postgres, set `PGSSLMODE=disable`. |
| First request after idle is slow | Render free tier sleeps after 15 min. Upgrade or ping periodically. |
| Health shows `"engine":"sqlite"` in production | `DATABASE_URL` is not set on Render. |

---

## Cost

| | Free | Paid |
|---|---|---|
| Vercel | Hobby: $0 | Pro: $20/mo |
| Render | Free (sleeps) | Starter: $7/mo |
| Supabase | Free (500 MB) | Pro: $25/mo |
