# TwinkyMeet Image Assets

This directory contains all image assets for the TwinkyMeet website. Images are automatically optimized by Astro at build time.

## Directory Structure

```
src/images/
├── hero/         - Full-width hero background images
├── highlights/   - Homepage highlight photos
├── gallery/      - Past event photos and memories
├── activities/   - Activity thumbnails and card images
└── days/         - Schedule day header images
```

## Image Requirements

### What You Need to Provide

Drop your **unoptimized, original photos** directly into these folders. Astro will automatically:

- Resize to appropriate dimensions
- Convert to WebP/AVIF formats
- Generate responsive image sizes
- Compress without quality loss
- Lazy load below-fold images

**You don't need to:**

- ❌ Resize images manually
- ❌ Compress files
- ❌ Convert formats
- ❌ Create multiple versions

### Recommended Source Image Specs

- **Format:** JPG, PNG (Astro converts automatically)
- **Size:** Any size (even 8MB+ is fine)
- **Resolution:** Use originals from your camera/phone
- **Orientation:** Any (will be cropped/fitted automatically)

## Naming Conventions

### /hero/ - Hero Background Images

Large, full-width background images for page headers.

**Files needed:**

- `home-hero.jpg` - Homepage hero (group photo, venue, or event moment)
- `about-hero.jpg` - About page hero (community gathering shot)
- `activities-hero.jpg` - Optional: Activities page hero

**Suggested content:** Wide-angle group shots, venue exteriors, atmospheric event photos

---

### /highlights/ - Homepage Photo Highlights

3 featured photos displayed on the homepage to showcase the event.

**Files needed:**

- `moment-1.jpg` - Social/fursuit moment
- `moment-2.jpg` - Activity in action
- `moment-3.jpg` - Group fun/candid shot

**Suggested content:** Candid moments, activities, fursuiters, social interactions

---

### /gallery/ - Past Event Memories

Photos from previous TwinkyMeet events used throughout the site.

**Files needed:**

**About page community photos (3):**

- `community-social.jpg` - People socializing/hanging out
- `community-activities.jpg` - Activity or workshop in progress
- `community-fursuits.jpg` - Fursuit group photo or suiter moment

**Past event memory grid (8):**

- `memory-1.jpg` through `memory-8.jpg` - Mix of photos from last year

**Photo gallery preview page (12-16):**

- `preview-1.jpg` through `preview-16.jpg` - Best shots from last year

**Suggested content:** Variety of moments - social, activities, fursuits, venue, food, etc.

---

### /activities/ - Activity Thumbnails

Individual photos for specific activities.

**Files needed:**

**Homepage featured activities (3):**

- `featured-1.jpg` - First featured activity
- `featured-2.jpg` - Second featured activity
- `featured-3.jpg` - Third featured activity

**Activity catalog (dynamic, as needed):**

- `activity-[id].jpg` - One per activity (e.g., `activity-5.jpg`)
- Or use descriptive names: `gaming-tournament.jpg`, `fursuit-parade.jpg`, etc.

**Suggested content:** Photos representing each activity type - gaming, outdoor activities, crafts, social events, etc.

---

### /days/ - Schedule Day Headers (Optional)

Small banner images for each day of the event on the schedule page.

**Files needed (optional):**

- `friday.jpg` - Friday header (arrival/evening vibe)
- `saturday.jpg` - Saturday header (daytime activities)
- `sunday.jpg` - Sunday header (departure/morning)

**Suggested content:** Time-appropriate atmospheric shots or simple gradients

---

## Current Status

**Phase 1 (In Progress):**

- ✅ Directory structure created
- ✅ .gitkeep files added
- 🔄 Awaiting image uploads from user

**Total images needed:** 30-40 photos
**Images currently uploaded:** 0

---

## Usage in Code

Import images and use with Astro's Image component:

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../images/hero/home-hero.jpg';
---

<Image src={heroImage} alt="TwinkyMeet 2025" width={1920} height={1080} />
```

Astro handles all optimization automatically at build time.
