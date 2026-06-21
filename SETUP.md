# Website Health Monitor — Local Setup Guide

> **Stack**: Next.js 16, TypeScript, TailwindCSS v4, Prisma 7, PostgreSQL, Auth.js v5

---

## Prerequisites

Install these before starting:

| Tool | Version | Download |
|---|---|---|
| Node.js | 20+ (LTS) | https://nodejs.org |
| pnpm / npm | any | comes with Node.js |
| PostgreSQL | 15+ | https://www.postgresql.org/download/ |
| Git | any | https://git-scm.com |

---

## Step 1 — Clone & Install Dependencies

```bash
cd d:\saas
npm install
```

> `.npmrc` already contains `legacy-peer-deps=true` to handle peer conflicts between Next.js 16 and Auth.js v5.

---

## Step 2 — Create Your `.env.local` File

Create a file at `d:\saas\.env.local` and fill in each value as described below.

```env
# ─────────────────────────────────────────────
# DATABASE (PostgreSQL)
# ─────────────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/healthmonitor"

# ─────────────────────────────────────────────
# AUTH.JS v5
# ─────────────────────────────────────────────
AUTH_SECRET="your-random-secret-here"

# ─────────────────────────────────────────────
# APP URL
# ─────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"

# ─────────────────────────────────────────────
# EMAIL (for password reset / verify email)
# ─────────────────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM="Website Health Monitor <your-gmail@gmail.com>"
```

---

## Step 3 — Get Each API Key / Credential

### 3A — PostgreSQL Database

**Option A: Local PostgreSQL (Free)**

1. Install PostgreSQL from https://www.postgresql.org/download/windows/
2. During install, set a password for the `postgres` user
3. Open pgAdmin or psql and run:
   ```sql
   CREATE DATABASE healthmonitor;
   ```
4. Your connection string:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/healthmonitor"
   ```

**Option B: Supabase (Free cloud, recommended)**

1. Go to https://supabase.com → Sign up (free)
2. Create a new project
3. Go to **Project Settings → Database → Connection string → URI**
4. Copy the URI — it looks like:
   ```
   postgresql://postgres.abcxyz:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
5. Replace `[PASSWORD]` with the database password you set during project creation
6. Paste it as `DATABASE_URL`

**Option C: Neon (Free cloud, serverless)**

1. Go to https://neon.tech → Sign up (free)
2. Create a new project
3. Go to **Dashboard → Connection Details**
4. Copy the connection string (starts with `postgresql://`)
5. Paste it as `DATABASE_URL`

---

### 3B — AUTH_SECRET (Required)

This is just a random secret string used to sign JWT tokens. Generate one:

```bash
# Run in terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or use the online generator: https://generate-secret.vercel.app/32

Paste the output as `AUTH_SECRET`.

---

### 3C — Email (SMTP) — For Password Reset & Email Verify

**Option A: Gmail (Free — recommended for dev)**

1. Go to your Google Account → https://myaccount.google.com
2. Navigate to **Security → 2-Step Verification** → turn it ON
3. Then go to **Security → App Passwords**
4. Select app: **Mail**, device: **Windows Computer** → Generate
5. Copy the 16-character app password (e.g. `abcd efgh ijkl mnop` — remove spaces)
6. Set in `.env.local`:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-gmail@gmail.com"
   SMTP_PASS="abcdefghijklmnop"
   SMTP_FROM="Health Monitor <your-gmail@gmail.com>"
   ```

**Option B: Resend (Free 3000 emails/month — better for production)**

1. Go to https://resend.com → Sign up (free)
2. Go to **API Keys** → Create API Key
3. Install: `npm install resend`
4. Update the email action in `src/lib/email.ts` to use the Resend SDK

**Option C: Mailhog (Local dev only — no real emails)**

1. Install: https://github.com/mailhog/MailHog/releases
2. Run `MailHog.exe` — it captures all outgoing emails locally
3. Set:
   ```env
   SMTP_HOST="localhost"
   SMTP_PORT="1025"
   SMTP_USER=""
   SMTP_PASS=""
   SMTP_FROM="test@test.com"
   ```
4. View captured emails at http://localhost:8025

---

## Step 4 — Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push schema to your database (creates all tables)
npx prisma db push

# (Optional) Seed with demo data
# npx prisma db seed
```

Verify tables were created:

```bash
npx prisma studio
```

This opens a browser UI at http://localhost:5555 where you can browse all tables.

---

## Step 5 — Run the App

```bash
npm run dev
```

Open http://localhost:3000

---

## Step 6 — Create Your First Account

1. Go to http://localhost:3000/register
2. Fill in name, email, password
3. You'll be redirected to the dashboard

> **Note**: Email verification is required in production. For local dev, if SMTP isn't set up yet, you can skip verification by manually setting `emailVerified` in Prisma Studio.

---

## All Available Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/register` | Sign up |
| `/login` | Sign in |
| `/forgot-password` | Password reset request |
| `/dashboard` | Overview with stats |
| `/dashboard/websites` | All connected websites (grid + table view) |
| `/dashboard/websites/[id]` | Website health overview with gauges & chart |
| `/dashboard/websites/[id]/performance` | Performance audit issues |
| `/dashboard/websites/[id]/accessibility` | Accessibility (A11Y) issues |
| `/dashboard/websites/[id]/seo` | SEO issues |
| `/dashboard/websites/[id]/security` | Security header issues |
| `/dashboard/websites/[id]/broken-links` | Broken link checker |
| `/dashboard/websites/[id]/settings` | Edit website / delete |
| `/pricing` | Pricing page |
| `/features` | Features page |
| `/contact` | Contact page |

---

## Testing the Scan Engine

Since this is a **mock scan engine** (no real Lighthouse/crawler yet):

1. Go to `/dashboard/websites` → Connect a Website (any URL works, e.g. `https://example.com`)
2. Click the website card → go to Overview
3. Click **Run Audit**
4. The page will reload with realistic randomly-generated scores + issues

Each audit generates:
- Scores 0–100 for Performance, Accessibility, SEO, Security
- Core Web Vitals: FCP, LCP, CLS, INP, TBT
- 1–4 issues per category with real descriptions + recommendations

---

## Common Issues

### `PrismaClientInitializationError`
Your `DATABASE_URL` is wrong or PostgreSQL isn't running.
- Check the URL format: `postgresql://user:pass@host:port/dbname`
- Make sure PostgreSQL service is running

### `AUTH_SECRET` error on startup
Run `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` and set the output as `AUTH_SECRET`.

### Port 3000 in use
```bash
# Kill the process using port 3000
npx kill-port 3000
npm run dev
```

### TypeScript errors in VS Code about missing modules
Press `Ctrl+Shift+P` → **TypeScript: Restart TS Server**. The files exist — this is just a stale language server cache.

---

## Environment Variable Quick Reference

```env
# REQUIRED — app won't start without these
DATABASE_URL=          # PostgreSQL connection string
AUTH_SECRET=           # Random 32-byte base64 string
NEXTAUTH_URL=          # http://localhost:3000

# OPTIONAL — email features won't work without these
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

---

## Minimum Setup (Fastest Path)

If you just want to run the app quickly:

1. Create a free [Supabase](https://supabase.com) project → get `DATABASE_URL`
2. Run `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` → get `AUTH_SECRET`
3. Create `.env.local` with just those 3 values + `NEXTAUTH_URL=http://localhost:3000`
4. Run `npx prisma db push && npm run dev`
5. Open http://localhost:3000 → Register → Done

Email features (verify email, forgot password) will show errors without SMTP configured, but the core scan/audit features work immediately.
