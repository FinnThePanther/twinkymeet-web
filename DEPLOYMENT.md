# TwinkyMeet Deployment Guide

This guide covers deploying TwinkyMeet to Cloudflare Pages with D1 database integration.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and pnpm installed
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed
- GitHub repository for the project

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Login to Cloudflare

```bash
pnpm wrangler login
```

### 3. Environment Variables

The `.dev.vars` file contains test credentials for local development:

- **Test Admin Username**: admin
- **Test Admin Password**: admin123

This file is already configured and should NOT be committed to git.

### 4. Start Development Server

```bash
pnpm dev
```

The site will be available at `http://localhost:4321`

## Production Deployment

### Step 1: Generate Production Secrets

Run the secret generation script with your desired admin password:

```bash
node scripts/generate-secrets.mjs "YourSecurePasswordHere"
```

This will output:
- `ADMIN_PASSWORD_HASH` - Bcrypt hash of your password
- `SESSION_SECRET` - Cryptographically secure random string

**⚠️ IMPORTANT**: Store these values securely! You'll need them for Cloudflare Pages configuration.

### Step 2: Set Environment Variables in Cloudflare Pages

1. Go to [Cloudflare Pages dashboard](https://dash.cloudflare.com/?to=/:account/pages)
2. Select your TwinkyMeet project
3. Navigate to **Settings** > **Environment variables**
4. Add the following variables for **Production**:

| Variable Name | Value | Source |
|--------------|-------|--------|
| `ADMIN_PASSWORD_HASH` | (from generate-secrets.mjs) | Output of script |
| `SESSION_SECRET` | (from generate-secrets.mjs) | Output of script |

5. Click **Save**

### Step 3: Deploy to Cloudflare Pages

#### Option A: Deploy via Wrangler (Manual)

```bash
pnpm build
pnpm wrangler pages deploy dist
```

#### Option B: Deploy via GitHub Integration (Recommended)

See the **CI/CD Setup** section below for automated deployments.

### Step 4: Initialize Production Database

After first deployment, you need to run migrations on the production D1 database:

```bash
pnpm wrangler d1 execute twinkymeet-db --remote --file=db/schema.sql
```

Verify tables were created:

```bash
pnpm wrangler d1 execute twinkymeet-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### Step 5: Verify Deployment

1. Visit your Cloudflare Pages URL
2. Navigate to `/admin/login`
3. Log in with your production admin password
4. Test RSVP submission, activity submission, and admin features

## CI/CD Setup with GitHub Actions

### Step 1: Create Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Edit Cloudflare Workers** template
4. Configure permissions:
   - Account > Cloudflare Pages > Edit
   - Account > D1 > Edit
5. Set **Account Resources** to include your account
6. Create token and copy it securely

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Add the following **Repository secrets**:

| Secret Name | Value |
|------------|-------|
| `CLOUDFLARE_API_TOKEN` | (API token from Step 1) |
| `CLOUDFLARE_ACCOUNT_ID` | (from Cloudflare dashboard) |
| `ADMIN_PASSWORD_HASH` | (from generate-secrets.mjs) |
| `SESSION_SECRET` | (from generate-secrets.mjs) |

### Step 3: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=twinkymeet-web
        env:
          ADMIN_PASSWORD_HASH: ${{ secrets.ADMIN_PASSWORD_HASH }}
          SESSION_SECRET: ${{ secrets.SESSION_SECRET }}
```

### Step 4: Test Automated Deployment

1. Commit and push changes to `main` branch
2. Check the **Actions** tab in GitHub to see deployment progress
3. Once complete, verify the site is live

## Database Management

### View Production Database

```bash
pnpm wrangler d1 execute twinkymeet-db --remote --command="SELECT * FROM attendees;"
```

### Backup Production Database

```bash
# Export all data
pnpm wrangler d1 export twinkymeet-db --remote --output=backup.sql

# Or specific table
pnpm wrangler d1 execute twinkymeet-db --remote --command="SELECT * FROM attendees;" > attendees-backup.json
```

### Run Migrations

```bash
# Production
pnpm wrangler d1 execute twinkymeet-db --remote --file=db/schema.sql

# Local development
pnpm wrangler d1 execute twinkymeet-db --local --file=db/schema.sql
```

## Troubleshooting

### Issue: "Unauthorized" errors in admin panel

**Solution**: Verify environment variables are set correctly in Cloudflare Pages dashboard.

### Issue: Database not found

**Solution**: Ensure D1 binding is configured in `wrangler.toml` and database exists:

```bash
pnpm wrangler d1 list
```

### Issue: Session expires immediately

**Solution**: Check that `SESSION_SECRET` matches between local and production environments.

### Issue: Build fails during deployment

**Solution**: Check build logs in Cloudflare Pages dashboard or GitHub Actions. Ensure all dependencies are listed in `package.json`.

## Post-Deployment Checklist

- [ ] Test admin login with production credentials
- [ ] Submit a test RSVP and verify it appears in admin panel
- [ ] Submit a test activity and verify approval workflow
- [ ] Test all admin features (settings, announcements, etc.)
- [ ] Verify scheduled activities appear on public schedule page
- [ ] Test on mobile devices
- [ ] Set up monitoring/alerts (optional)
- [ ] Configure custom domain (if applicable)

## Security Notes

1. **Never commit secrets to git**
   - `.dev.vars` is in `.gitignore`
   - Use environment variables for all secrets

2. **Rotate secrets periodically**
   - Generate new `SESSION_SECRET` every few months
   - Update admin password as needed

3. **Monitor login attempts**
   - Rate limiting is built-in (5 attempts per 15 minutes)
   - Check `login_attempts` table for suspicious activity

4. **HTTPS only in production**
   - Cloudflare Pages enforces HTTPS automatically
   - Session cookies use `Secure` flag in production

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Astro Documentation](https://docs.astro.build/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
