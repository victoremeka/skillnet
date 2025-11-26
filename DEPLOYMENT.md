# Vercel Deployment Guide

This guide walks you through deploying SkillNet to Vercel with automatic database initialization and seeding.

## Prerequisites

- Vercel account (sign up at [vercel.com](https://vercel.com))
- Vercel CLI installed: `npm i -g vercel`
- Git repository pushed to GitHub/GitLab/Bitbucket

## Deployment Steps

### 1. Initial Setup

```bash
# Install Vercel CLI globally (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login
```

### 2. Configure Build Settings

The build process is already configured in `package.json`:

```json
"build": "vite build && esbuild server/index-prod.ts --bundle --platform=node --outdir=dist --format=esm --packages=external && npm run db:setup"
```

This will:
1. Build the frontend with Vite
2. Bundle the backend with esbuild
3. **Automatically run `db:init` and `db:seed`** to initialize and populate the database

### 3. Environment Variables

Set these in Vercel Dashboard (or via CLI):

```bash
# Optional: Custom database location (defaults to data/skillnet.db)
DATABASE_URL=file:./data/skillnet.db

# Production mode
NODE_ENV=production
```

**To set via CLI:**
```bash
vercel env add DATABASE_URL production
# Enter value: file:./data/skillnet.db

vercel env add NODE_ENV production
# Enter value: production
```

### 4. Deploy

#### Option A: Deploy via CLI

```bash
# Navigate to project directory
cd c:\Users\Victor\Dev\skillnet

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Option B: Deploy via Git (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket:
   ```bash
   git add .
   git commit -m "Add tier descriptions and platform fees"
   git push origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your Git repository
4. Vercel will auto-detect settings from `vercel.json`
5. Click "Deploy"

### 5. Verify Database Seeding

After deployment completes, check the build logs:

```
✓ Building...
✓ Compiling...
📦 Initializing database at: ./data/skillnet.db
📋 Creating tables...
  ✓ users
  ✓ profiles
  ✓ services
  ...
🌱 Starting database seed...
👨‍🎓 Creating students...
   ✓ Alex Chen
   ✓ Sarah Johnson
   ...
✅ Database seeded successfully!
```

## Important Notes

### Database Persistence

⚠️ **Vercel's serverless functions are stateless** - the SQLite database file will be recreated on each deployment.

**For production, you should:**

1. **Option A: Use Turso (LibSQL Cloud)**
   ```bash
   # Install Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Create database
   turso db create skillnet-prod
   
   # Get connection URL
   turso db show skillnet-prod --url
   
   # Get auth token
   turso db tokens create skillnet-prod
   ```

   Then set in Vercel:
   ```bash
   DATABASE_URL=libsql://skillnet-prod-<your-org>.turso.io
   TURSO_AUTH_TOKEN=<your-token>
   ```

   Update `server/db.ts`:
   ```typescript
   const client = createClient({
     url: process.env.DATABASE_URL!,
     authToken: process.env.TURSO_AUTH_TOKEN,
   });
   ```

2. **Option B: Use Vercel Postgres**
   - Add Vercel Postgres from Vercel Dashboard
   - Update schema to use PostgreSQL instead of SQLite
   - Change `drizzle-orm/libsql` to `drizzle-orm/vercel-postgres`

3. **Option C: Use Vercel Blob for SQLite**
   - Store SQLite file in Vercel Blob Storage
   - Persist across deployments
   - Requires code changes to download/upload DB file

### Testing Deployed App

Once deployed, test with the accounts from `TESTING.md`:

**Students:**
- `alex@student.edu` / `password123`
- `sarah@student.edu` / `password123`
- `marcus@student.edu` / `password123`
- `emily@student.edu` / `password123`
- `jordan@student.edu` / `password123`

**Clients:**
- `hiring@techstart.io` / `password123`
- `david.m@gmail.com` / `password123`
- `dev@fitlifeapp.com` / `password123`

### Re-seeding After Deployment

If you need to re-seed the database in production:

1. **Via Vercel CLI:**
   ```bash
   vercel env add RESEED_DB production
   # Enter value: true
   
   # Trigger redeployment
   vercel --prod --force
   ```

2. **Via API endpoint** (recommended to add):
   - Create admin endpoint: `POST /api/admin/reseed`
   - Protect with admin authentication
   - Call from Vercel dashboard or curl

## Monitoring

### Check Deployment Status

```bash
# List deployments
vercel ls

# View deployment logs
vercel logs <deployment-url>
```

### View Build Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click on the deployment
4. View "Building" tab for seed logs

## Troubleshooting

### Issue: Database not seeding

**Check:**
- Build logs show `db:setup` running
- No errors during `db:init` or `db:seed`
- `tsx` is in `devDependencies` and available during build

**Fix:**
```bash
# Ensure tsx is available
npm install --save-dev tsx

# Test locally
npm run build
```

### Issue: Database file not found

**Cause:** Vercel serverless environment doesn't persist files

**Fix:** Use Turso, Vercel Postgres, or another hosted database (see Database Persistence section above)

### Issue: Auth not working

**Check:**
- JWT secret is set (uses default in production if not set)
- Cookies are being sent with credentials
- CORS is properly configured for your domain

### Issue: API routes 404

**Check:**
- `vercel.json` rewrites are correct
- Server is running on correct port
- Build output includes `dist/index-prod.js`

## Production Checklist

Before going live:

- [ ] Set up persistent database (Turso recommended)
- [ ] Configure custom domain
- [ ] Set JWT_SECRET environment variable
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Test all payment flows
- [ ] Verify tier descriptions display correctly
- [ ] Test platform fee calculations
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting for API endpoints
- [ ] Add Vercel Analytics
- [ ] Set up error tracking (Sentry, etc.)

## Useful Commands

```bash
# Deploy preview
vercel

# Deploy production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Open project in browser
vercel open

# Pull environment variables locally
vercel env pull

# Remove deployment
vercel rm <deployment-url>
```

## Database Migration Strategy

When you update the schema:

1. Make schema changes in `shared/schema.ts`
2. Update `server/init-db.ts` with new columns/tables
3. Deploy to Vercel (auto-runs `db:setup`)
4. Test with seeded data

**For production with persistent DB:**
1. Create migration script
2. Run migration before deploying new code
3. Use `drizzle-kit` for migrations

## Cost Considerations

**Vercel Free Tier includes:**
- 100GB bandwidth/month
- 100 hours serverless function execution
- 6,000 build minutes/month

**For SkillNet:**
- ✅ Perfect for demo/portfolio projects
- ✅ Handles moderate traffic
- ⚠️ May need upgrade for high traffic
- ⚠️ SQLite on serverless = data loss (use Turso)

## Next Steps

After successful deployment:

1. **Add Custom Domain**
   ```bash
   vercel domains add yourdomain.com
   ```

2. **Set Up Turso for Production**
   - Follow Turso setup steps above
   - Update connection in `server/db.ts`
   - Redeploy

3. **Configure Monitoring**
   - Add Vercel Analytics
   - Set up error tracking
   - Monitor database performance

4. **Security Hardening**
   - Add rate limiting
   - Implement CSRF protection
   - Set up security headers
   - Enable Vercel Firewall

---

**Last Updated:** November 26, 2025
**Vercel CLI Version:** 33.0.0+
