# Fly.io Migration Quick Start

**Fast track guide for migrating TwinkyMeet from Railway to Fly.io**

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for detailed instructions.

## Prerequisites Checklist
- [ ] Fly.io account created ([sign up](https://fly.io))
- [ ] Fly.io CLI installed: `brew install flyctl`
- [ ] Railway CLI installed: `npm install -g @railway/cli`
- [ ] Logged into Fly.io: `flyctl auth login`

## Quick Migration Steps

### 1. Backup Railway Database (5 min)
```bash
./scripts/backup-railway-db.sh
```
Save the Railway environment variables (ADMIN_PASSWORD_HASH, SESSION_SECRET) to a secure file.

### 2. Create Fly.io App (2 min)
```bash
flyctl apps create twinkymeet-web --region lax
flyctl volumes create twinkymeet_data --region lax --size 1 --app twinkymeet-web
```

### 3. Set Secrets (1 min)
```bash
flyctl secrets set ADMIN_PASSWORD_HASH="<from-railway>" --app twinkymeet-web
flyctl secrets set SESSION_SECRET="<from-railway>" --app twinkymeet-web
```

### 4. Deploy to Fly.io (10 min)
```bash
flyctl deploy --app twinkymeet-web
```

### 5. Upload Database (5 min)
```bash
flyctl ssh sftp shell --app twinkymeet-web
# In SFTP:
put railway-backup-YYYYMMDD-HHMMSS.db /app/data/twinkymeet.db
exit

flyctl apps restart twinkymeet-web
```

### 6. Test (30 min)
Visit `https://twinkymeet-web.fly.dev` and test:
- [ ] Homepage loads
- [ ] Login to `/admin/login`
- [ ] RSVPs show existing data
- [ ] Activities work
- [ ] Submit test RSVP
- [ ] Restart app and verify data persists

### 7. Setup GitHub Actions (5 min)
```bash
# Generate token
flyctl tokens create deploy --app twinkymeet-web

# Add to GitHub:
# Settings → Secrets → New secret
# Name: FLY_API_TOKEN
# Value: <paste token>

# Test auto-deploy
git add .
git commit -m "Add Fly.io deployment"
git push origin main
```

### 8. Custom Domain (2-4 hours including DNS propagation)
```bash
# Add domain
flyctl certs create yourdomain.com --app twinkymeet-web
flyctl certs show yourdomain.com --app twinkymeet-web

# Update DNS with IPs from above command
# Wait for SSL certificate: flyctl certs check yourdomain.com --app twinkymeet-web
```

### 9. Monitor (48 hours)
```bash
# Watch logs
flyctl logs --app twinkymeet-web

# Check status
flyctl status --app twinkymeet-web

# Setup daily backups
crontab -e
# Add: 0 2 * * * /Users/nick/Documents/dev/twinkymeet-web/scripts/backup-fly-db.sh
```

### 10. Decommission Railway (after 48h stable)
- [ ] Final backup: `./scripts/backup-railway-db.sh`
- [ ] Railway dashboard → Settings → Disable auto-deploy
- [ ] Wait 30 days, then delete Railway service

## Rollback (if needed)
```bash
# Revert DNS to Railway
# Test Railway URL still works
# If data on Fly.io, download: flyctl ssh sftp get /app/data/twinkymeet.db
```

## Key Files Created
- `Dockerfile` - Multi-stage build
- `.dockerignore` - Build optimization
- `fly.toml` - Fly.io config
- `.github/workflows/fly-deploy.yml` - Auto-deploy
- `scripts/backup-railway-db.sh` - Railway backup
- `scripts/backup-fly-db.sh` - Fly.io backup

## Useful Commands
```bash
flyctl logs --app twinkymeet-web              # View logs
flyctl status --app twinkymeet-web            # Check status
flyctl ssh console --app twinkymeet-web       # SSH into machine
flyctl apps restart twinkymeet-web            # Restart app
flyctl releases list --app twinkymeet-web     # List deployments
flyctl releases rollback <version>            # Rollback
```

## Cost Savings
- Railway: $7-20/month
- Fly.io: $3-7/month
- **Savings: 60-85%**

## Support
- **Full Guide**: [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)
- **Fly.io Docs**: https://fly.io/docs/
- **Community**: https://community.fly.io/
