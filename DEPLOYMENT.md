# CEE Nepal Exam Portal - Deployment Guide

This guide provides step-by-step instructions for deploying the CEE Nepal Exam Portal to various hosting platforms.

## Prerequisites

- Node.js 16+ installed locally
- Git repository initialized
- All dependencies installed (`npm install`)

## Environment Variables

Create a `.env` file in the root directory (use `.env.example` as template):

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret-key-min-32-characters-change-this
CORS_ORIGIN=https://your-domain.com
DATABASE_PATH=./data/cee.db
```

**Important:** Change `JWT_SECRET` to a secure random string (min 32 characters) before deploying.

---

## Deployment Options

### Option 1: Vercel (Recommended for Quick Deployment)

**Best for:** Quick deployment, automatic HTTPS, serverless

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Create `vercel.json` in project root:**
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server/index.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/(.*)", "dest": "/server/index.js" }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard:**
   - Go to Project Settings → Environment Variables
   - Add `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN`

**Note:** Vercel uses serverless functions. SQLite database will be ephemeral. For persistent storage, use Vercel Postgres or PlanetScale.

---

### Option 2: Railway.app (Recommended for Persistent Database)

**Best for:** Full-stack deployment with persistent storage

1. **Push code to GitHub**

2. **Go to [Railway.app](https://railway.app) and sign up**

3. **Create New Project → Deploy from GitHub repo**

4. **Add PostgreSQL database:**
   - Click "+ New" → "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL` env var

5. **Update `server/db.js` to support PostgreSQL (if needed):**
   - Current setup uses SQLite (file-based)
   - For Railway, you may need to migrate to PostgreSQL using a library like `pg-promise`

6. **Set environment variables:**
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secure-secret`
   - `CORS_ORIGIN=https://your-domain.com`

7. **Deploy:**
   - Railway auto-deploys on git push
   - Access via provided `*.railway.app` domain

---

### Option 3: Render.com (Persistent SQLite Support)

**Best for:** Simple deployment with persistent disk storage

1. **Push code to GitHub**

2. **Go to [Render.com](https://render.com) and sign up**

3. **Create New → Web Service:**
   - Connect your GitHub repo
   - Name: `cee-nepal-exam-portal`
   - Runtime: Node.js
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Add Persistent Disk:**
   - Go to "Disks" → "Add Disk"
   - Mount path: `/opt/render/project/src/data`
   - Size: 1GB (sufficient for SQLite)

5. **Set environment variables:**
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secure-secret`
   - `CORS_ORIGIN=https://your-domain.com`
   - `DATABASE_PATH=./data/cee.db`

6. **Deploy:**
   - Click "Create Web Service"
   - Access via `*.onrender.com` domain

---

### Option 4: DigitalOcean App Platform

**Best for:** Scalable production deployment

1. **Push code to GitHub**

2. **Go to [DigitalOcean Cloud](https://cloud.digitalocean.com) → Apps**

3. **Create App → GitHub repo → Select your repo**

4. **Configure:**
   - Service name: `cee-portal`
   - HTTP Port: `3000`
   - Run Command: `npm start`

5. **Add managed PostgreSQL database:**
   - Click "+ Add Database" → PostgreSQL
   - Select plan (Basic $7/mo)

6. **Set environment variables:**
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secure-secret`
   - `CORS_ORIGIN=https://your-domain.com`
   - `DATABASE_URL` (auto-set by DigitalOcean)

7. **Deploy:**
   - Click "Create Resources"
   - Access via provided domain

---

### Option 5: Heroku (Classic PaaS)

**Best for:** Traditional PaaS deployment

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Login and create app:**
   ```bash
   heroku login
   heroku create cee-nepal-exam-portal
   ```

3. **Add Heroku Postgres:**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secure-secret
   heroku config:set CORS_ORIGIN=https://your-domain.com
   ```

5. **Add `Procfile` to root (already created):**
   ```
   web: node server/index.js
   ```

6. **Deploy:**
   ```bash
   git push heroku main
   heroku open
   ```

**Note:** Heroku free tier discontinued. Requires hobby plan ($7/mo).

---

## Database Considerations

### Current Setup: SQLite (File-based)

**Pros:**
- Zero configuration
- Fast for small-to-medium applications
- Single file backup

**Cons:**
- Not ideal for horizontal scaling
- File locking issues with multiple processes
- Limited concurrent writes

**Recommendation:** For production, migrate to PostgreSQL for better scalability and concurrent access.

### Migrating to PostgreSQL

If you need PostgreSQL (recommended for high traffic):

1. **Install dependencies:**
   ```bash
   npm install pg pg-promise
   ```

2. **Create `server/db-postgres.js`:** (Schema conversion required)
3. **Update queries for PostgreSQL syntax**
4. **Set `DATABASE_URL` environment variable**

---

## Production Checklist

Before going live:

- [ ] Change `JWT_SECRET` to a secure random string (use `openssl rand -hex 32`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` to your actual domain (not `*`)
- [ ] Enable HTTPS (most platforms provide this automatically)
- [ ] Set up database backups (if using PostgreSQL)
- [ ] Test health check endpoint: `GET /api/v1/health`
- [ ] Run seed script: `npm run seed`
- [ ] Test login with demo accounts
- [ ] Monitor logs for errors
- [ ] Set up error tracking (e.g., Sentry)

---

## Running the Application

### Local Development
```bash
npm install
npm run seed   # Optional: seed database with demo data
npm start      # Starts on http://localhost:3000
```

### Production
```bash
npm install --production
npm run prod   # Sets NODE_ENV=production
```

---

## Monitoring & Maintenance

### Health Checks
```bash
curl https://your-domain.com/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "users": 3,
    "timestamp": "2026-10-08T17:30:00.000Z"
  }
}
```

### Logs
- **Vercel:** Dashboard → Functions → Logs
- **Railway:** Dashboard → Deployments → Logs
- **Render:** Dashboard → Logs
- **DigitalOcean:** Dashboard → Apps → Runtime Logs

### Backups

**SQLite Backup:**
```bash
# Copy data/cee.db to backup location
cp data/cee.db backups/cee-$(date +%Y%m%d).db
```

**PostgreSQL Backup:**
```bash
# Automated daily backups via pg_dump
pg_dump $DATABASE_URL > backups/postgres-$(date +%Y%m%d).sql
```

---

## Custom Domain Setup

### Vercel
1. Project Settings → Domains
2. Add `cee.yourdomain.com`
3. Update DNS CNAME to `cname.vercel-dns.com`

### Railway
1. Settings → Domains
2. Add custom domain
3. Update DNS A record

### Render
1. Settings → Custom Domain
2. Add domain
3. Update DNS CNAME

### DigitalOcean
1. Settings → Domains → Add Domain
2. Update nameservers or A record

---

## SSL/HTTPS

Most platforms provide automatic SSL:
- **Vercel:** Automatic
- **Railway:** Automatic
- **Render:** Automatic
- **DigitalOcean:** Automatic

For custom servers, use Let's Encrypt:
```bash
sudo certbot --nginx -d your-domain.com
```

---

## Performance Optimization

1. **Enable compression:** (already included via `express.static`)
2. **Set cache headers:** (already set to `maxAge: '1d'`)
3. **Use CDN:** For static assets (optional)
4. **Database indexing:** Add indexes for frequently queried fields
5. **Connection pooling:** For PostgreSQL

---

## Troubleshooting

### Database Errors
```
Error: SQLITE_CANTOPEN: unable to open database file
```
**Solution:** Check `DATABASE_PATH` and ensure directory exists.

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution:** Change `PORT` environment variable.

### CORS Errors
```
Access-Control-Allow-Origin error
```
**Solution:** Set `CORS_ORIGIN` to your frontend domain.

---

## Support

For issues or questions:
- Check application logs
- Review environment variables
- Test health check endpoint
- Verify database connectivity

---

## Recommended Deployment Path

**For this project, I recommend:**

1. **Development/Testing:** Railway.app (easy setup, free tier)
2. **Production:** DigitalOcean App Platform (scalable, reliable)
3. **Alternative:** Render.com (simple, persistent SQLite support)

**Why not Vercel?** Vercel's serverless functions don't persist SQLite databases well. Better for apps with external databases.

**Why not Heroku?** Free tier discontinued, pricing less competitive than Railway/DigitalOcean.