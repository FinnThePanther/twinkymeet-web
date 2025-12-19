# Image Optimization Fix

## Issue
Images were failing to load on the deployed Fly.io site with HTTP 500 errors.

## Root Cause
Sharp (the image processing library required by Astro for image optimization) was in `devDependencies` instead of `dependencies`. When the Dockerfile ran `pnpm prune --prod`, it removed Sharp from the production build, causing image optimization to fail at runtime.

## Solution
1. Moved `sharp` from `devDependencies` to `dependencies` in package.json
2. Updated pnpm-lock.yaml
3. Redeployed to Fly.io

## Verification
```bash
# Before fix: HTTP 500
curl -I "https://twinkymeet-web.fly.dev/_image?href=%2F_astro%2Ffeatured-2.B6vv9A4n.jpg&w=1920&h=1280&f=webp"
# HTTP/2 500

# After fix: HTTP 200
curl -I "https://twinkymeet-web.fly.dev/_image?href=%2F_astro%2Ffeatured-2.B6vv9A4n.jpg&w=1920&h=1280&f=webp"
# HTTP/2 200 
# content-type: image/webp
```

## Status
✅ **FIXED** - All images now loading correctly on https://twinkymeet-web.fly.dev/

## Commits
- `233598e` - Fix: Move sharp to production dependencies for image optimization
- `a4e5b1d` - Update pnpm lockfile for sharp in dependencies
