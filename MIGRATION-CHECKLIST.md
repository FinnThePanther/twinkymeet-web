# Railway to Fly.io Migration Checklist

Track your progress through the migration process.

## Phase 1: Pre-Migration ⏱️ 1-2 hours

- [ ] **Backup Railway Database**
  - [ ] Run `./scripts/backup-railway-db.sh`
  - [ ] Verify backup file created: `railway-backup-YYYYMMDD-HHMMSS.db`
  - [ ] Test integrity with `sqlite3 railway-backup-*.db "PRAGMA integrity_check;"`
  - [ ] Store backup in safe location

- [ ] **Document Environment Variables**
  - [ ] Copy `ADMIN_PASSWORD_HASH` from Railway dashboard
  - [ ] Copy `SESSION_SECRET` from Railway dashboard
  - [ ] Save to secure file (DO NOT commit to git!)

- [ ] **Review Configuration Files**
  - [ ] Check `Dockerfile`
  - [ ] Check `.dockerignore`
  - [ ] Check `fly.toml`
  - [ ] Check `.github/workflows/fly-deploy.yml`
  - [ ] Check `astro.config.mjs` (port now dynamic)

## Phase 2: Fly.io Setup ⏱️ 10 minutes

- [ ] **Create Fly.io Account**
  - [ ] Sign up at https://fly.io
  - [ ] Verify email

- [ ] **Install and Login**
  - [ ] Verify flyctl installed: `flyctl version`
  - [ ] Login: `flyctl auth login`

- [ ] **Create App**
  - [ ] Create app: `flyctl apps create twinkymeet-web --region lax`
  - [ ] Note: If name taken, choose different name and update `fly.toml`

- [ ] **Create Volume**
  - [ ] Create volume: `flyctl volumes create twinkymeet_data --region lax --size 1 --app twinkymeet-web`
  - [ ] Verify: `flyctl volumes list --app twinkymeet-web`

- [ ] **Set Secrets**
  - [ ] Set admin hash: `flyctl secrets set ADMIN_PASSWORD_HASH="..." --app twinkymeet-web`
  - [ ] Set session secret: `flyctl secrets set SESSION_SECRET="..." --app twinkymeet-web`
  - [ ] Verify: `flyctl secrets list --app twinkymeet-web`

## Phase 3: Initial Deployment ⏱️ 10-15 minutes

- [ ] **Deploy Application**
  - [ ] Deploy: `flyctl deploy --app twinkymeet-web`
  - [ ] Wait for build to complete (5-10 minutes)
  - [ ] Check logs: `flyctl logs --app twinkymeet-web`
  - [ ] Verify no errors

- [ ] **Check Status**
  - [ ] Run: `flyctl status --app twinkymeet-web`
  - [ ] Verify health checks passing
  - [ ] Get app URL: `flyctl info --app twinkymeet-web`
  - [ ] Note URL: `https://twinkymeet-web.fly.dev`

## Phase 4: Database Migration ⏱️ 10 minutes

- [ ] **Upload Database**
  - [ ] Start SFTP: `flyctl ssh sftp shell --app twinkymeet-web`
  - [ ] Upload: `put railway-backup-YYYYMMDD-HHMMSS.db /app/data/twinkymeet.db`
  - [ ] Verify: `ls -lh /app/data/`
  - [ ] Exit SFTP

- [ ] **Verify Upload**
  - [ ] SSH: `flyctl ssh console --app twinkymeet-web`
  - [ ] Check integrity: `sqlite3 /app/data/twinkymeet.db "PRAGMA integrity_check;"`
  - [ ] Check counts: `sqlite3 /app/data/twinkymeet.db "SELECT COUNT(*) FROM attendees;"`
  - [ ] Exit SSH

- [ ] **Restart App**
  - [ ] Restart: `flyctl apps restart twinkymeet-web`
  - [ ] Monitor: `flyctl logs --app twinkymeet-web`

## Phase 5: Testing ⏱️ 30-60 minutes

### Public Pages
- [ ] Homepage (`https://twinkymeet-web.fly.dev/`)
- [ ] About page
- [ ] Schedule page (shows scheduled activities)
- [ ] Activities page (shows approved activities)
- [ ] Images load and are optimized

### RSVP
- [ ] RSVP form loads
- [ ] Submit test RSVP
- [ ] Verify appears in admin panel

### Activity Submission
- [ ] Activity form loads
- [ ] Submit test activity
- [ ] Verify appears in admin pending list

### Admin Authentication
- [ ] Navigate to `/admin/login`
- [ ] Login with production credentials
- [ ] Dashboard loads with stats
- [ ] Logout works

### Admin Features
- [ ] RSVPs page shows data from Railway backup
- [ ] Activities page shows pending submissions
- [ ] Approve test activity
- [ ] Schedule activity with time/location
- [ ] Verify appears on public schedule page
- [ ] Settings page loads
- [ ] Toggle feature flag (e.g., RSVP open/closed)
- [ ] Update announcement
- [ ] Changes persist after refresh

### Database Persistence
- [ ] Note current RSVP count
- [ ] Restart: `flyctl apps restart twinkymeet-web`
- [ ] Verify RSVP count unchanged
- [ ] Delete test RSVP

### Performance
- [ ] Page load < 2 seconds
- [ ] No browser console errors
- [ ] Health checks: `flyctl checks list --app twinkymeet-web`

## Phase 6: GitHub Actions ⏱️ 15 minutes

- [ ] **Generate Token**
  - [ ] Run: `flyctl tokens create deploy --app twinkymeet-web`
  - [ ] Copy token (starts with "FlyV1 ...")

- [ ] **Add GitHub Secret**
  - [ ] Go to: Settings → Secrets → Actions
  - [ ] Click "New repository secret"
  - [ ] Name: `FLY_API_TOKEN`
  - [ ] Value: paste token
  - [ ] Save

- [ ] **Test Auto-Deploy**
  - [ ] Commit workflow: `git add .github/workflows/fly-deploy.yml`
  - [ ] Push: `git push origin main`
  - [ ] Watch: GitHub Actions tab
  - [ ] Verify deployment succeeds

## Phase 7: Custom Domain ⏱️ 2-4 hours (includes DNS wait)

- [ ] **Document Current DNS**
  - [ ] Run: `dig yourdomain.com > current-dns.txt`
  - [ ] Save output

- [ ] **Add Domain to Fly.io**
  - [ ] Add apex: `flyctl certs create yourdomain.com --app twinkymeet-web`
  - [ ] Add www: `flyctl certs create www.yourdomain.com --app twinkymeet-web`
  - [ ] Get IPs: `flyctl certs show yourdomain.com --app twinkymeet-web`

- [ ] **Lower TTL (do this 24-48h before DNS change)**
  - [ ] Log into DNS provider
  - [ ] Change TTL to 300 seconds
  - [ ] Wait 24-48 hours

- [ ] **Update DNS Records**
  - [ ] Add A record for apex domain
  - [ ] Add AAAA record for apex domain
  - [ ] Add CNAME for www (or A/AAAA)
  - [ ] Wait for propagation (5-30 minutes)

- [ ] **Verify SSL**
  - [ ] Check: `flyctl certs check yourdomain.com --app twinkymeet-web`
  - [ ] Should show: "Certificate Status: Ready"
  - [ ] Test: `curl -I https://yourdomain.com/`
  - [ ] Visit in browser, verify SSL valid

## Phase 8: Post-Migration Monitoring ⏱️ 48 hours

- [ ] **Setup Automated Backups**
  - [ ] Test backup script: `./scripts/backup-fly-db.sh`
  - [ ] Setup cron: `crontab -e`
  - [ ] Add: `0 2 * * * /path/to/scripts/backup-fly-db.sh`

- [ ] **Daily Monitoring (48 hours)**
  - Day 1:
    - [ ] Check logs: `flyctl logs --app twinkymeet-web`
    - [ ] Verify no errors
    - [ ] Test site functionality
    - [ ] Check health: `flyctl status --app twinkymeet-web`
  - Day 2:
    - [ ] Check logs
    - [ ] Verify no errors
    - [ ] Test site functionality
    - [ ] Check health

- [ ] **Keep Railway Running**
  - [ ] Do NOT shut down Railway yet
  - [ ] Keep as backup during 48h monitoring

## Phase 9: Decommission Railway ⏱️ 30 minutes

**Only after 48 hours of stable Fly.io operation**

- [ ] **Pre-Shutdown Checklist**
  - [ ] Fly.io stable for 48+ hours
  - [ ] All features tested and working
  - [ ] DNS fully propagated to Fly.io
  - [ ] No errors in Fly.io logs
  - [ ] Automated backups working
  - [ ] GitHub Actions auto-deploy working

- [ ] **Final Railway Backup**
  - [ ] Run: `./scripts/backup-railway-db.sh`
  - [ ] Rename to mark as final
  - [ ] Store securely off-site

- [ ] **Disable Railway Auto-Deploy**
  - [ ] Railway dashboard → Settings
  - [ ] Toggle OFF "Watch Paths"
  - [ ] App keeps running but won't auto-deploy

- [ ] **Delete Railway Service (after 30 days)**
  - [ ] Wait 30 days for safety
  - [ ] Railway dashboard → Settings → Delete Service
  - [ ] Type name to confirm

## Migration Complete! 🎉

- [ ] **Celebrate!**
  - [ ] Migration successful
  - [ ] Saving 60-85% on hosting costs
  - [ ] Auto-deploy configured
  - [ ] Backups automated

## Rollback Plan (if needed)

If issues occur:

- [ ] **Emergency DNS Revert**
  - [ ] Change DNS back to Railway IPs
  - [ ] Wait 5-15 minutes for propagation
  - [ ] Test Railway URL

- [ ] **Fly.io Rollback**
  - [ ] List releases: `flyctl releases list --app twinkymeet-web`
  - [ ] Rollback: `flyctl releases rollback <version> --app twinkymeet-web`

- [ ] **Data Sync**
  - [ ] Download Fly.io DB if needed
  - [ ] Merge with Railway DB
  - [ ] Upload to Railway

## Notes & Issues

Use this space to track any issues or notes during migration:

```
Date: _____________
Issue:


Resolution:


---

Date: _____________
Issue:


Resolution:


```

## Key Contacts

- **Fly.io Support**: https://community.fly.io/
- **Fly.io Status**: https://status.fly.io/

## Files Reference

- `MIGRATION-GUIDE.md` - Detailed step-by-step guide
- `QUICK-START.md` - Fast-track migration steps
- `Dockerfile` - Container build configuration
- `fly.toml` - Fly.io app configuration
- `.github/workflows/fly-deploy.yml` - Auto-deploy workflow
- `scripts/backup-railway-db.sh` - Railway backup script
- `scripts/backup-fly-db.sh` - Fly.io backup script
