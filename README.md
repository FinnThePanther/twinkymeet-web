# TwinkyMeet

A summer mini-convention website for a close-knit furry community gathering. Features RSVP management, activity scheduling, and admin controls.

## 🚀 Tech Stack

- **Framework**: [Astro 5.x](https://astro.build/) with SSR
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (synchronous SQLite)
- **Hosting**: [Railway](https://railway.app/) with persistent volumes
- **Authentication**: bcrypt password hashing with session cookies

## 📋 Features

### Public Features

- Event information and schedule
- RSVP form for attendees
- Activity submission form
- Activity catalog (approved/scheduled activities only)
- Announcements system

### Admin Features

- Dashboard with statistics
- RSVP management (view, edit, delete, export CSV)
- Activity approval and scheduling workflow
- Site settings configuration
- Announcements management
- Password-protected access

## 🛠️ Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) package manager

### Installation

```bash
# Install dependencies
pnpm install

# Initialize the database
pnpm init-db

# Start development server
pnpm dev
```

The site will be available at `http://localhost:4321`

### Environment Variables

Create a `.env` file in the root directory:

```bash
DATABASE_PATH=./db/local.db
ADMIN_PASSWORD_HASH=$2b$10$4.Kp7eYDRMmzmz7ugZhaF.KswT5w0//FKMIeJjwnKj6mvPoy9JjU6
SESSION_SECRET=9576fc535cb6a6b924fd5f958aa8b1218a4ba734790c69064f0a37c9f5dfbd6ce25a12d6a11e82888f514f226b1db7d59598075bdb7674b77f205f43245a8fd7
```

**Default admin credentials (development only):**

- Username: `admin`
- Password: `admin123`

## 📦 Commands

| Command                | Action                                     |
| :--------------------- | :----------------------------------------- |
| `pnpm install`         | Install dependencies                       |
| `pnpm dev`             | Start dev server at `localhost:4321`       |
| `pnpm build`           | Build production site to `./dist/`         |
| `pnpm start`           | Start production server (after build)      |
| `pnpm preview`         | Preview production build locally           |
| `pnpm init-db`         | Initialize SQLite database with schema     |
| `pnpm compress-images` | Compress images in `src/images/` directory |
| `pnpm format`          | Format code with Prettier                  |

## 🏗️ Project Structure

```
twinkymeet-web/
├── src/
│   ├── components/        # Reusable Astro components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ActivityCard.astro
│   │   └── ScheduleItem.astro
│   ├── layouts/          # Page layouts
│   │   ├── BaseLayout.astro      # Public pages
│   │   └── AdminLayout.astro     # Admin pages
│   ├── pages/            # File-based routing
│   │   ├── index.astro           # Home page
│   │   ├── about.astro           # Event details
│   │   ├── schedule.astro        # Activity schedule
│   │   ├── activities.astro      # Activity catalog
│   │   ├── rsvp.astro            # RSVP form
│   │   ├── submit-activity.astro # Activity submission
│   │   ├── admin/                # Admin pages
│   │   │   ├── index.astro       # Dashboard
│   │   │   ├── login.astro       # Authentication
│   │   │   ├── rsvps.astro       # RSVP management
│   │   │   ├── activities.astro  # Activity management
│   │   │   └── settings.astro    # Site settings
│   │   └── api/                  # API endpoints
│   │       ├── rsvp.ts           # Public RSVP submission
│   │       ├── activity.ts       # Public activity submission
│   │       └── admin/            # Protected admin APIs
│   ├── lib/              # Utilities
│   │   ├── db.ts                 # Database functions
│   │   └── auth.ts               # Authentication helpers
│   ├── middleware.ts     # Auth middleware
│   └── images/           # Static images
├── db/
│   └── schema.sql        # Database schema
├── scripts/
│   ├── init-db.ts        # Database initialization
│   └── compress-images.ts # Image compression utility
├── railway.json          # Railway deployment config
├── nixpacks.toml         # Railway build config
├── astro.config.mjs      # Astro configuration
├── tailwind.config.js    # Tailwind configuration
└── package.json
```

## 📊 Database Schema

The app uses SQLite with 5 tables:

- **attendees** - RSVP data (name, email, dietary restrictions, etc.)
- **activities** - Activity submissions and schedule
- **photos** - Photo gallery metadata (post-event)
- **announcements** - Site-wide messages
- **settings** - Key-value configuration store

See `db/schema.sql` for full schema.

## 🚢 Deployment

The app is deployed to Railway with a persistent SQLite database.

### Quick Deploy

1. Fork this repository
2. Create a [Railway](https://railway.app/) account
3. Click **New Project** → **Deploy from GitHub repo**
4. Select your fork
5. Add environment variables (see DEPLOYMENT.md)
6. Add a persistent volume at `/app/data`
7. Deploy!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 🔒 Security

- Password hashing with bcrypt (10 rounds)
- HTTP-only, secure session cookies
- CSRF protection on forms
- Input validation and sanitization
- Parameterized SQL queries
- Rate limiting on admin login
- HTTPS enforced in production

## 📝 Configuration

### Feature Toggles

Admin can enable/disable features via Settings page:

- RSVP submissions
- Activity submissions
- Photo uploads (post-event)

### Event Configuration

Admin can configure via Settings page:

- Event dates (start/end)
- Location
- Site-wide announcements

## 🎨 Customization

### Branding

Update colors in `src/layouts/BaseLayout.astro`:

- Primary color: `#8b5cf6` (purple)
- Accent colors defined in components

### Images

Images are compressed automatically. To compress new images:

```bash
pnpm compress-images
```

Settings:

- Quality: 85%
- Max width: 2400px
- Output: Progressive JPEG with mozjpeg

## 🐛 Troubleshooting

### Database locked errors

The database uses WAL mode for better concurrency. Ensure only one instance is running.

### Session expires immediately

Check that `SESSION_SECRET` environment variable is set correctly.

### Images not loading

Run `pnpm compress-images` to compress large images.

### Admin login fails

1. Verify `ADMIN_PASSWORD_HASH` is set correctly
2. Check that bcrypt hash matches your password
3. Generate new hash: `node -p "require('bcrypt').hashSync('password', 10)"`

## 📖 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide for Railway
- [CLAUDE.md](CLAUDE.md) - Project overview and architecture for Claude Code
- [PRD](prds/twinkymeet-prd.md) - Full product requirements document

## 🤝 Contributing

This is a private project for a small community event. If you're part of the community and want to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Private project - All rights reserved

## 👥 Credits

Built for the TwinkyMeet furry community gathering.

- Development: Claude Code + Human collaboration
- Hosting: Railway
- Framework: Astro
