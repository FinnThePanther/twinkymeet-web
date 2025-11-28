# TwinkyMeet Deployment Guide

This guide covers deploying TwinkyMeet to Railway with a persistent SQLite database.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ and pnpm installed
- [Railway account](https://railway.app/) (free tier available)
- GitHub repository for the project

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
DATABASE_PATH=./db/local.db
ADMIN_PASSWORD_HASH=<your-bcrypt-hash>
SESSION_SECRET=<your-session-secret>
```

**Test credentials for local development:**
- Username: `admin`
- Password: `admin123`

The `.env` file is already configured with test credentials and should NOT be committed to git.

### 3. Initialize Database

```bash
pnpm init-db
```

This creates the SQLite database at `./db/local.db` with all required tables.

### 4. Start Development Server

```bash
pnpm dev
```

The site will be available at `http://localhost:4321`

## Production Deployment to Railway

### Step 1: Generate Production Secrets

Generate secure credentials for production using Node.js:

```bash
node -e "const bcrypt = require('bcrypt'); const crypto = require('crypto'); const password = 'YourSecurePasswordHere'; bcrypt.hash(password, 10).then(hash => { console.log('ADMIN_PASSWORD_HASH:', hash); console.log('SESSION_SECRET:', crypto.randomBytes(64).toString('hex')); });"
```

Or install bcrypt globally and run:

```bash
npm install -g bcrypt
node -p "require('bcrypt').hashSync('YourSecurePasswordHere', 10)"
node -p "require('crypto').randomBytes(64).toString('hex')"
```

**⚠️ IMPORTANT**: Store these values securely! You'll need them for Railway configuration.

### Step 2: Create Railway Project

1. Go to [Railway dashboard](https://railway.app/dashboard)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your TwinkyMeet repository
4. Railway will automatically detect the Node.js project

### Step 3: Configure Environment Variables

In the Railway project dashboard:

1. Click on your service
2. Go to **Variables** tab
3. Add the following environment variables:

| Variable Name | Value | Example |
|--------------|-------|---------|
| `DATABASE_PATH` | `/app/data/twinkymeet.db` | Production database path |
| `ADMIN_PASSWORD_HASH` | (from Step 1) | `$2b$10$...` |
| `SESSION_SECRET` | (from Step 1) | 64-character hex string |

4. Click **Deploy** to apply changes

### Step 4: Add Persistent Volume

The database needs to persist across deployments:

1. In your Railway service, go to **Volumes** tab
2. Click **New Volume**
3. Configure:
   - **Mount Path**: `/app/data`
   - **Size**: 1 GB (more than enough for this app)
4. Click **Add**

Railway will redeploy automatically after adding the volume.

### Step 5: Initialize Production Database

After the first deployment with the volume:

1. Go to your Railway service
2. Click **Deployments** tab
3. Click on the most recent deployment
4. In the deployment logs, verify the app started successfully
5. The database will be automatically initialized on first run by the `getDb()` function in `src/lib/db.ts`

Alternatively, you can manually initialize via Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run init script
railway run pnpm init-db
```

### Step 6: Verify Deployment

1. Click **Settings** tab in your Railway service
2. Find your app URL under **Domains** (e.g., `https://twinkymeet-web-production.up.railway.app`)
3. Visit the URL and test:
   - Navigate to `/admin/login`
   - Log in with your production admin password
   - Test RSVP submission
   - Test activity submission
   - Verify admin features work

## Database Management

### View Production Database

Using Railway CLI:

```bash
railway connect
# Then in the shell:
sqlite3 /app/data/twinkymeet.db
```

Or run SQL directly:

```bash
railway run node -e "const db = require('better-sqlite3')('/app/data/twinkymeet.db'); console.log(db.prepare('SELECT * FROM attendees').all());"
```

### Backup Production Database

Download the database file via Railway CLI:

```bash
# Link to your project first
railway link

# Connect and copy database
railway connect
# In the shell:
cat /app/data/twinkymeet.db > /tmp/backup.db
exit

# Or use railway run to execute a backup script
railway run node scripts/backup-db.js
```

### Restore from Backup

```bash
# Upload backup to Railway volume
railway volume cp ./backup.db /app/data/twinkymeet.db
```

## Configuration Files

### railway.json

Configures Railway deployment settings:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node ./dist/server/entry.mjs",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### nixpacks.toml

Configures build environment with native dependencies:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "pnpm-9_x", "python3", "gcc", "gnumake"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]

[phases.build]
cmds = ["pnpm build"]

[start]
cmd = "HOST=0.0.0.0 PORT=${PORT:-3000} node ./dist/server/entry.mjs"
```

### astro.config.mjs

Critical configuration for Railway deployment:

```javascript
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    host: '0.0.0.0',  // Required for Railway networking
    port: 8080,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
```

## CI/CD with GitHub Actions

Railway automatically deploys when you push to your main branch. No GitHub Actions needed!

To disable auto-deployments:

1. Go to your Railway service **Settings**
2. Under **Deploys**, toggle off **Watch Paths**

## Troubleshooting

### Issue: 502 Bad Gateway or Connection Refused

**Cause**: Server not binding to the correct host/port

**Solution**: Verify `astro.config.mjs` has:
```javascript
server: {
  host: '0.0.0.0',
  port: 8080,
}
```

### Issue: Database not persisting across deployments

**Cause**: Volume not mounted or wrong database path

**Solution**:
- Verify volume is mounted at `/app/data`
- Verify `DATABASE_PATH` environment variable is `/app/data/twinkymeet.db`

### Issue: "Unauthorized" errors in admin panel

**Cause**: Environment variables not set correctly

**Solution**:
- Verify `SESSION_SECRET` and `ADMIN_PASSWORD_HASH` are set in Railway
- Redeploy after adding environment variables

### Issue: Build fails with "gyp ERR! find Python"

**Cause**: Missing native build dependencies

**Solution**: Ensure `nixpacks.toml` includes:
```toml
nixPkgs = ["nodejs_20", "pnpm-9_x", "python3", "gcc", "gnumake"]
```

### Issue: Images not loading or very slow

**Cause**: Images too large (35-50MB each)

**Solution**: Run the image compression script:
```bash
pnpm compress-images
```

This compresses images from 35-50MB to <1MB with minimal quality loss.

### Issue: Session expires immediately

**Cause**: `SESSION_SECRET` mismatch or not set

**Solution**: Ensure `SESSION_SECRET` is set in Railway environment variables.

### Issue: Database locked errors

**Cause**: SQLite WAL mode not enabled or concurrent writes

**Solution**: The database uses WAL mode by default. If you still see errors, check that only one instance is running.

## Monitoring and Logs

### View Real-time Logs

In Railway dashboard:
1. Click on your service
2. Go to **Deployments** tab
3. Click on active deployment
4. Logs stream in real-time

Or via CLI:
```bash
railway logs
```

### View Deployment History

Railway keeps a history of all deployments. Click **Deployments** to see:
- Build logs
- Deploy status
- Rollback options

## Post-Deployment Checklist

- [ ] Test admin login with production credentials
- [ ] Submit a test RSVP and verify it appears in admin panel
- [ ] Submit a test activity and verify approval workflow
- [ ] Test all admin features (settings, announcements, RSVP management)
- [ ] Verify scheduled activities appear on public schedule page
- [ ] Test on mobile devices
- [ ] Verify database persists after redeployment
- [ ] Set up custom domain (if applicable)
- [ ] Monitor logs for errors

## Security Notes

1. **Never commit secrets to git**
   - `.env` is in `.gitignore`
   - Use Railway environment variables for all secrets

2. **Rotate secrets periodically**
   - Generate new `SESSION_SECRET` every few months
   - Update admin password as needed

3. **Monitor login attempts**
   - Rate limiting is built-in via middleware
   - Check Railway logs for suspicious activity

4. **HTTPS only in production**
   - Railway enforces HTTPS automatically
   - Session cookies use `Secure` flag in production

5. **Database backups**
   - Regularly backup `/app/data/twinkymeet.db`
   - Store backups securely off-site

## Custom Domain Setup

1. In Railway service, go to **Settings** → **Domains**
2. Click **Custom Domain**
3. Enter your domain (e.g., `twinkymeet.example.com`)
4. Add the provided CNAME record to your DNS provider
5. Wait for DNS propagation (up to 24 hours)
6. Railway automatically provisions SSL certificate

## Scaling Considerations

For this small event (15-20 people), the default Railway resources are more than sufficient:

- **CPU**: Shared vCPU
- **RAM**: 512 MB - 1 GB
- **Storage**: 1 GB volume
- **Bandwidth**: Unlimited on paid plan

If you need to scale:
1. Go to **Settings** → **Resources**
2. Adjust CPU/RAM allocations
3. Redeploy

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Astro SSR Documentation](https://docs.astro.build/en/guides/server-side-rendering/)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
