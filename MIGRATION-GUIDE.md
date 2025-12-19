# Railway to Fly.io Migration Guide

This guide walks you through migrating TwinkyMeet from Railway to Fly.io with zero downtime.

## Prerequisites

- [x] Fly.io CLI installed (`flyctl` version 0.3.204+)
- [ ] Fly.io account created (sign up at https://fly.io)
- [ ] Railway CLI installed (for database backup)
- [ ] Docker installed (for local testing, optional)

## Migration Overview

**Strategy**: Blue-green deployment
- Railway stays live during migration and testing
- Fly.io deployed and tested on temporary URL
- DNS cutover only after successful validation
- 48-hour monitoring period with rollback capability

**Estimated Time**: 12-16 hours over 3-4 days

## Phase 1: Pre-Migration Preparation

### Step 1: Backup Railway Database

**CRITICAL**: Back up your database before any migration steps.

```bash
# Navigate to project directory
cd /Users/nick/Documents/dev/twinkymeet-web

# Run backup script
./scripts/backup-railway-db.sh
```

This will:
- Install Railway CLI if needed
- Download database from Railway
- Verify integrity
- Show database statistics
- Create file: `railway-backup-YYYYMMDD-HHMMSS.db`

**Store this backup securely!** You'll need it for Fly.io migration.

### Step 2: Document Railway Environment Variables

Open Railway dashboard and copy these values to a **secure file** (DO NOT commit to git):

1. Go to your Railway project
2. Click on your service → Variables tab
3. Copy these values:

```
ADMIN_PASSWORD_HASH=<value-from-railway>
SESSION_SECRET=<value-from-railway>
DATABASE_PATH=/app/data/twinkymeet.db  (this will change for Fly.io)
```

### Step 3: Verify Configuration Files

All configuration files have been created:

- [x] `Dockerfile` - Multi-stage build with native dependencies
- [x] `.dockerignore` - Optimized build context
- [x] `fly.toml` - Fly.io application configuration
- [x] `.github/workflows/fly-deploy.yml` - GitHub Actions auto-deploy
- [x] `astro.config.mjs` - Updated with dynamic port

Review these files to ensure they match your requirements.

## Phase 2: Initialize Fly.io Application

### Step 1: Login to Fly.io

```bash
flyctl auth login
```

This will open a browser window for authentication.

### Step 2: Create Fly.io App

```bash
# Create app (choose a unique name if twinkymeet-web is taken)
flyctl apps create twinkymeet-web

# Or specify region (recommended: closest to your users)
# Options: lax (LA), ord (Chicago), iad (Virginia), etc.
flyctl apps create twinkymeet-web --region lax
```

### Step 3: Create Persistent Volume

The SQLite database needs persistent storage:

```bash
# Create 1GB volume (same region as app)
flyctl volumes create twinkymeet_data \
  --region lax \
  --size 1 \
  --app twinkymeet-web

# Verify creation
flyctl volumes list --app twinkymeet-web
```

Expected output:
```
ID          NAME              SIZE  REGION  ZONE  ENCRYPTED  ATTACHED VM  CREATED AT
vol_xxxxx   twinkymeet_data   1GB   lax     xxxx  true       -            1 minute ago
```

### Step 4: Set Environment Secrets

```bash
# Set admin password hash (paste value from Railway)
flyctl secrets set ADMIN_PASSWORD_HASH="<paste-from-railway>" \
  --app twinkymeet-web

# Set session secret (paste value from Railway)
flyctl secrets set SESSION_SECRET="<paste-from-railway>" \
  --app twinkymeet-web

# Verify secrets are set (values won't be shown)
flyctl secrets list --app twinkymeet-web
```

Expected output:
```
NAME                   DIGEST                            DATE
ADMIN_PASSWORD_HASH    xxxxxxxxxxxx                      1m ago
SESSION_SECRET         xxxxxxxxxxxx                      1m ago
```

## Phase 3: Initial Deployment

### Step 1: Deploy Application

```bash
# Deploy to Fly.io (this will build and deploy)
flyctl deploy --app twinkymeet-web
```

This process will:
1. Upload build context (excluding .dockerignore files)
2. Build Docker image with multi-stage build
3. Compile native dependencies (bcrypt, better-sqlite3)
4. Deploy to Fly.io
5. Mount persistent volume
6. Start the application

**Expected time**: 5-10 minutes for first deployment

### Step 2: Monitor Deployment

```bash
# Watch deployment logs
flyctl logs --app twinkymeet-web

# Check app status
flyctl status --app twinkymeet-web
```

Look for:
- ✅ "Server started on http://0.0.0.0:8080"
- ✅ Health checks passing
- ❌ No error messages

### Step 3: Get Fly.io URL

```bash
# Get app info including URL
flyctl info --app twinkymeet-web

# Or open directly in browser
flyctl open --app twinkymeet-web
```

Your temporary URL: `https://twinkymeet-web.fly.dev`

## Phase 4: Database Migration

### Step 1: Upload Database to Fly.io

**IMPORTANT**: Make sure you have your Railway backup file from Phase 1.

```bash
# Start SFTP session
flyctl ssh sftp shell --app twinkymeet-web

# In the SFTP session:
sftp> put railway-backup-YYYYMMDD-HHMMSS.db /app/data/twinkymeet.db
sftp> ls -lh /app/data/
sftp> exit
```

### Step 2: Verify Database Upload

```bash
# SSH into Fly.io machine
flyctl ssh console --app twinkymeet-web

# Verify database file exists and check integrity
sqlite3 /app/data/twinkymeet.db "PRAGMA integrity_check;"
# Should output: ok

# Check record counts
sqlite3 /app/data/twinkymeet.db <<EOF
SELECT 'Attendees: ' || COUNT(*) FROM attendees;
SELECT 'Activities: ' || COUNT(*) FROM activities;
SELECT 'Settings: ' || COUNT(*) FROM settings;
SELECT 'Announcements: ' || COUNT(*) FROM announcements;
EOF

# Exit SSH session
exit
```

### Step 3: Restart Application

```bash
# Restart to ensure database is loaded
flyctl apps restart twinkymeet-web

# Monitor restart
flyctl logs --app twinkymeet-web
```

## Phase 5: Testing and Validation

### Comprehensive Testing Checklist

Test everything on `https://twinkymeet-web.fly.dev`:

#### Public Pages
- [ ] Homepage loads without errors
- [ ] About page displays correctly
- [ ] Schedule page shows scheduled activities
- [ ] Activities page shows approved activities
- [ ] Images load and are optimized

#### RSVP Functionality
- [ ] RSVP form at `/rsvp` loads
- [ ] Can submit test RSVP
- [ ] Form validation works
- [ ] Success message displays

#### Activity Submission
- [ ] Activity submission form loads
- [ ] Can submit test activity
- [ ] Form validation works

#### Admin Authentication
- [ ] Navigate to `/admin/login`
- [ ] Login with production credentials
- [ ] Login succeeds and redirects to admin dashboard
- [ ] Test rate limiting: 5 failed attempts should block IP
- [ ] Logout works correctly

#### Admin Features
- [ ] Dashboard shows correct statistics
- [ ] RSVPs page displays existing data from Railway
- [ ] Activities page shows pending submissions
- [ ] Can approve pending activities
- [ ] Can schedule activities with time/location
- [ ] Scheduled activities appear on public schedule
- [ ] Settings page loads
- [ ] Can toggle feature flags (RSVP open/closed, etc.)
- [ ] Can update announcements
- [ ] Changes persist after page refresh

#### Database Persistence
- [ ] Submit new test RSVP
- [ ] Restart app: `flyctl apps restart twinkymeet-web`
- [ ] Verify RSVP still exists after restart
- [ ] Delete test RSVP

#### Performance
- [ ] Page load times < 2 seconds
- [ ] No console errors in browser
- [ ] Images optimized (check Network tab)
- [ ] Health checks passing: `flyctl checks list --app twinkymeet-web`

### Testing Commands

```bash
# Test homepage
curl -I https://twinkymeet-web.fly.dev/

# Test API endpoints (replace with actual admin cookie)
curl -X POST https://twinkymeet-web.fly.dev/api/rsvp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","dietary_restrictions":"None","plus_one":0}'

# Check app health
flyctl checks list --app twinkymeet-web
```

## Phase 6: GitHub Actions Auto-Deploy Setup

### Step 1: Generate Fly.io Deploy Token

```bash
# Create deploy token for GitHub Actions
flyctl tokens create deploy --app twinkymeet-web
```

**IMPORTANT**: Copy the token output (starts with "FlyV1 ..."). You'll only see this once!

### Step 2: Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secret:
   - Name: `FLY_API_TOKEN`
   - Value: `<paste-token-from-step-1>`
5. Click **Add secret**

### Step 3: Test Auto-Deploy

```bash
# Commit and push workflow file
git add .github/workflows/fly-deploy.yml
git commit -m "Add Fly.io auto-deploy workflow"
git push origin main

# Monitor deployment on GitHub
# Visit: https://github.com/<your-username>/twinkymeet-web/actions

# Or monitor Fly.io logs
flyctl logs --app twinkymeet-web
```

### Step 4: Verify Auto-Deploy Works

Make a small change to test:

```bash
# Make a small change (e.g., update a comment)
echo "# Test auto-deploy" >> README.md
git add README.md
git commit -m "Test auto-deploy"
git push origin main

# Watch GitHub Actions
# Visit: https://github.com/<your-username>/twinkymeet-web/actions
```

## Phase 7: Custom Domain Migration

### Step 1: Document Current DNS

Before making any changes, document your current DNS settings:

```bash
# Check current DNS (replace with your domain)
dig yourdomain.com
dig www.yourdomain.com

# Save output to file
dig yourdomain.com > current-dns.txt
```

### Step 2: Add Custom Domain to Fly.io

```bash
# Add apex domain
flyctl certs create yourdomain.com --app twinkymeet-web

# Add www subdomain
flyctl certs create www.yourdomain.com --app twinkymeet-web

# Get DNS configuration
flyctl certs show yourdomain.com --app twinkymeet-web
```

Fly.io will provide IP addresses. Example output:
```
Certificate Status: Awaiting configuration
DNS Validation:
  A     yourdomain.com    -> 66.241.124.XXX
  AAAA  yourdomain.com    -> 2a09:8280:1::1:XXXX
```

### Step 3: Lower DNS TTL (24-48 hours before cutover)

1. Log into your DNS provider (Cloudflare, Route53, etc.)
2. Find your domain's DNS records
3. Change TTL to **300 seconds** (5 minutes)
4. Wait 24-48 hours for old TTL to expire

### Step 4: Update DNS Records

**For apex domain** (yourdomain.com):
```
Type: A
Name: @
Value: <IPv4 from flyctl certs show>
TTL: 300
```

```
Type: AAAA
Name: @
Value: <IPv6 from flyctl certs show>
TTL: 300
```

**For www subdomain** (option 1 - CNAME):
```
Type: CNAME
Name: www
Value: twinkymeet-web.fly.dev
TTL: 300
```

**For www subdomain** (option 2 - A/AAAA):
```
Type: A
Name: www
Value: <same IPv4 as apex>
TTL: 300
```

### Step 5: Monitor DNS Propagation

```bash
# Check if DNS has updated
dig yourdomain.com

# Check from multiple locations
# Visit: https://www.whatsmydns.net/#A/yourdomain.com
```

### Step 6: Verify SSL Certificate

```bash
# Check certificate status (may take a few minutes)
flyctl certs check yourdomain.com --app twinkymeet-web

# Should show:
# Certificate Status: Ready
# DNS Validation: Passed

# Test HTTPS
curl -I https://yourdomain.com/

# Check SSL details
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null
```

### Step 7: Test Custom Domain

Once DNS propagates (5-30 minutes with low TTL):

- [ ] Visit `https://yourdomain.com`
- [ ] Verify SSL shows valid certificate
- [ ] Test all features again on custom domain
- [ ] Check that `https://www.yourdomain.com` also works

## Phase 8: Post-Migration Monitoring

### 48-Hour Monitoring Period

**KEEP RAILWAY RUNNING** during this period as a backup.

#### Monitor Fly.io Logs

```bash
# Live tail logs
flyctl logs --app twinkymeet-web

# Filter for errors
flyctl logs --app twinkymeet-web | grep -i error

# Check specific timeframe
flyctl logs --app twinkymeet-web --since 1h
```

#### Monitor Application Health

```bash
# Check VM status
flyctl vm status --app twinkymeet-web

# Check volume usage
flyctl volumes list --app twinkymeet-web

# Check resource metrics
flyctl metrics --app twinkymeet-web

# Check health checks
flyctl checks list --app twinkymeet-web
```

#### Daily Checks

For 48 hours, verify daily:
- [ ] Application accessible at custom domain
- [ ] No errors in logs
- [ ] New RSVPs saving correctly
- [ ] Activity submissions working
- [ ] Admin panel functioning
- [ ] Database persisting across deployments

### Setup Automated Backups

```bash
# Create cron job for daily backups at 2 AM
crontab -e

# Add this line:
0 2 * * * /Users/nick/Documents/dev/twinkymeet-web/scripts/backup-fly-db.sh >> /Users/nick/twinkymeet-backups/backup.log 2>&1
```

Test backup script manually:

```bash
./scripts/backup-fly-db.sh
```

## Phase 9: Decommission Railway

### After 48 Hours of Stable Operation

#### Checklist Before Shutdown
- [ ] Fly.io running stable for 48+ hours
- [ ] All features tested and working
- [ ] Custom domain DNS fully propagated
- [ ] No errors in Fly.io logs
- [ ] Automated database backups working
- [ ] GitHub Actions auto-deploy working

#### Final Railway Backup

```bash
# One last backup from Railway
./scripts/backup-railway-db.sh

# Rename to clearly mark as final
mv railway-backup-*.db railway-FINAL-backup-$(date +%Y%m%d).db

# Store securely (external drive, cloud storage, etc.)
```

#### Disable Railway Auto-Deploy

1. Go to Railway dashboard
2. Click on service → **Settings**
3. Under "Deploys", toggle **OFF** "Watch Paths"
4. This stops auto-deploys but keeps app running

#### Delete Railway Service (Optional, after 30 days)

Wait 30 days before final deletion:

1. Railway dashboard → service → **Settings**
2. Scroll to bottom → **Delete Service**
3. Type service name to confirm
4. Click **Delete**

**IMPORTANT**: This is permanent and cannot be undone!

## Rollback Procedures

### Emergency Rollback to Railway

If critical issues occur on Fly.io:

#### Step 1: Revert DNS Immediately

1. Log into DNS provider
2. Change A/AAAA/CNAME records back to Railway values
3. DNS propagation: 5-15 minutes with low TTL

#### Step 2: Verify Railway

```bash
# Test Railway URL
curl -I https://twinkymeet-web-production.up.railway.app/

# Login to admin panel
# Verify all features working
```

#### Step 3: Sync Data (if needed)

If new data was created on Fly.io during cutover:

```bash
# Download Fly.io database
flyctl ssh sftp get /app/data/twinkymeet.db ./fly-data.db --app twinkymeet-web

# Merge databases using SQLite
# Export new records from Fly.io
sqlite3 fly-data.db ".dump attendees" > new-attendees.sql
sqlite3 fly-data.db ".dump activities" > new-activities.sql

# Import to Railway database (via Railway CLI)
railway run node merge-databases.js
```

### Fly.io Application Rollback

If deployment fails but DNS is on Fly.io:

```bash
# List recent releases
flyctl releases list --app twinkymeet-web

# Rollback to previous version
flyctl releases rollback <version-number> --app twinkymeet-web

# Monitor rollback
flyctl logs --app twinkymeet-web
```

## Troubleshooting

### Build Failures

**Error**: `gyp ERR! find Python`

**Solution**: Dockerfile missing build dependencies

```dockerfile
# Ensure Dockerfile builder stage has:
RUN apk add --no-cache python3 make g++ gcc
```

### Database Not Persisting

**Error**: Data lost after redeploy

**Solution**: Verify volume mount

```bash
# Check volume exists
flyctl volumes list --app twinkymeet-web

# Check fly.toml has correct mount
[mounts]
  source = "twinkymeet_data"
  destination = "/app/data"

# Verify DATABASE_PATH environment variable
flyctl secrets list --app twinkymeet-web
```

### 502 Bad Gateway

**Error**: Application not responding

**Solution**: Check application logs

```bash
# View logs
flyctl logs --app twinkymeet-web

# Check health checks
flyctl checks list --app twinkymeet-web

# Verify port configuration
# Dockerfile should expose 8080
# astro.config.mjs should use port 8080 or process.env.PORT
```

### Session Expires Immediately

**Error**: Can't stay logged in to admin

**Solution**: Verify SESSION_SECRET

```bash
# Check if SESSION_SECRET is set
flyctl secrets list --app twinkymeet-web

# If missing, set it
flyctl secrets set SESSION_SECRET="<from-railway>" --app twinkymeet-web
```

### High Memory Usage

**Error**: Out of memory errors

**Solution**: Increase memory allocation

```bash
# Scale to 1GB RAM
flyctl scale memory 1024 --app twinkymeet-web

# Verify scaling
flyctl scale show --app twinkymeet-web
```

### Slow Cold Starts

**Error**: First request after idle is slow

**Solution**: Prevent auto-stop

```toml
# In fly.toml
[http_service]
  auto_stop_machines = false
  min_machines_running = 1
```

## Cost Comparison

### Railway
- **Starter**: $5/month
- **Developer**: $20/month (likely tier for this app)
- Includes: 512MB-1GB RAM, storage, bandwidth

### Fly.io (Estimated)
- **Compute**: ~$3-6/month (1 shared CPU, 512MB RAM)
- **Volume**: ~$0.15/month (1GB)
- **Bandwidth**: Free tier: 160GB/month
- **Total**: ~$3-7/month

**Savings**: ~$13-17/month (60-85% reduction)

## Resources

### Fly.io Documentation
- [Fly.io Docs](https://fly.io/docs/)
- [Dockerfile Best Practices](https://fly.io/docs/languages-and-frameworks/dockerfile/)
- [Volumes and Storage](https://fly.io/docs/reference/volumes/)
- [Custom Domains](https://fly.io/docs/networking/custom-domain/)

### Support
- Fly.io Community: https://community.fly.io/
- Fly.io Status: https://status.fly.io/

### Migration Scripts
- `scripts/backup-railway-db.sh` - Backup Railway database
- `scripts/backup-fly-db.sh` - Automated Fly.io backups

## Summary

You've successfully migrated from Railway to Fly.io! 🎉

**Next steps**:
1. Monitor for 48 hours
2. Set up automated backups
3. Decommission Railway after 30 days
4. Enjoy 60-85% cost savings

**Questions or issues?**
- Check Fly.io logs: `flyctl logs --app twinkymeet-web`
- Review troubleshooting section above
- Open issue on GitHub
- Contact Fly.io support
