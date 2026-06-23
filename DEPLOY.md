# LoopNode — Deploy to Vercel (Free Tier)

Deploy the Next.js app on **Vercel**, database on **Supabase**, files on **Cloudinary**, and heavy audits on **Trigger.dev**.

---

## Architecture (production)

| Service | Role |
|--------|------|
| **Vercel** | Next.js app, API routes, auth, UI |
| **Supabase** | PostgreSQL (users, websites, scans, reports) |
| **Cloudinary** | Profile photos + saved report PDFs/CSVs |
| **Trigger.dev** | Lighthouse / Puppeteer audits (required on Vercel free) |
| **Gmail SMTP** | Verification, password reset, contact emails |

> **Important:** Vercel **Hobby (free)** serverless functions timeout at **~10 seconds**.  
> Full audits take 30–90+ seconds, so you **must** set `USE_TRIGGER_DEV=true` and deploy the Trigger worker.  
> Broken-link scans also use long-running API routes — they may hit the same limit on the free plan; keep scans small or upgrade Vercel Pro later if needed.

---

## 1. Prerequisites

- GitHub account + repo with your code pushed
- [Vercel](https://vercel.com) account (Hobby / free)
- [Supabase](https://supabase.com) project (free)
- [Cloudinary](https://cloudinary.com) account (free)
- [Trigger.dev](https://trigger.dev) account (free tier available)
- Gmail app password for SMTP (or another SMTP provider)

---

## 2. Supabase (database)

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database**:
   - Copy **Connection string → URI** (Session pooler, port **6543**) → `DATABASE_URL`
   - Copy **Direct connection** (port **5432**) → `DIRECT_URL`

Example (replace placeholders):

```env
DATABASE_URL="postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

3. **On your machine** (once, before first deploy), push the schema:

```bash
npx prisma generate
npx prisma db push
```

Use `DIRECT_URL` for migrations (`prisma.config.ts` already points at it).

---

## 3. Cloudinary

1. Dashboard → note **Cloud name**, **API Key**, **API Secret**.
2. **Settings → Security** → enable **Allow delivery of PDF and ZIP files** (required for report preview/download).
3. Create an upload preset if you use unsigned uploads (`CLOUDINARY_UPLOAD_PRESET`).

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLOUDINARY_UPLOAD_PRESET="your_preset"
```

Reports are stored under `loopnode/reports/`; profile images under `loopnode/profiles/`.

---

## 4. Trigger.dev (audits)

Audits use Puppeteer + Lighthouse. Vercel cannot run those reliably in a 10s function, so Trigger runs them in the background.

### 4a. Create project

1. Sign up at [cloud.trigger.dev](https://cloud.trigger.dev).
2. Create a project → copy **Project ref** (e.g. `proj_xxxx`) → `TRIGGER_PROJECT_REF`.
3. **API Keys** → create a **Production** secret key → `TRIGGER_SECRET_KEY`.

### 4b. Deploy the worker (from your machine)

```bash
# Login once
npx trigger.dev@latest login

# Deploy tasks (run after code changes to src/trigger/)
npx trigger.dev@latest deploy
```

`trigger.config.ts` loads env from `.env.local` for deploy. For production, also add the same variables in **Trigger.dev → Project → Environment variables** (see section 6).

### 4c. App setting

```env
USE_TRIGGER_DEV="true"
TRIGGER_SECRET_KEY="tr_prod_xxxxxxxx"
TRIGGER_PROJECT_REF="proj_xxxxxxxx"
```

When `USE_TRIGGER_DEV=true`, starting an audit queues `run-audit` on Trigger instead of running Lighthouse on Vercel.

---

## 5. Auth & email

Generate a production secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Gmail app password: Google Account → Security → 2FA → App passwords.

```env
AUTH_SECRET="your-generated-secret"
AUTH_URL="https://your-app.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

EMAIL_FROM="LoopNode <your@gmail.com>"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASS="your-app-password"
```

Use your **real Vercel URL** (or custom domain) for `AUTH_URL` and `NEXT_PUBLIC_APP_URL` — no trailing slash.

---

## 6. Environment variables checklist

Set these in **Vercel → Project → Settings → Environment Variables** (Production, and Preview if you want):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Supabase pooler (6543) |
| `DIRECT_URL` | Yes | Supabase direct (5432) — used if any server code needs it |
| `AUTH_SECRET` | Yes | Random 32+ byte secret |
| `AUTH_URL` | Yes | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as `AUTH_URL` |
| `EMAIL_FROM` | Yes | |
| `SMTP_HOST` | Yes | |
| `SMTP_PORT` | Yes | |
| `SMTP_USER` | Yes | |
| `SMTP_PASS` | Yes | |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Yes | |
| `CLOUDINARY_API_SECRET` | Yes | Server only |
| `CLOUDINARY_UPLOAD_PRESET` | Yes | |
| `USE_TRIGGER_DEV` | Yes | `true` on Vercel |
| `TRIGGER_SECRET_KEY` | Yes | Production key from Trigger.dev |
| `TRIGGER_PROJECT_REF` | Yes | |
| `NODE_ENV` | Auto | Vercel sets `production` |
| `SKIP_CHROME_DOWNLOAD` | Recommended | `1` — skip Puppeteer Chrome download on Vercel build |

Mirror the Trigger-related vars (+ `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL`) in **Trigger.dev → Environment variables** for the production environment.

---

## 7. Vercel project setup

### 7a. Import repo

1. [vercel.com/new](https://vercel.com/new) → Import Git repository.
2. Framework: **Next.js** (auto-detected).
3. Root directory: `.` (repo root).

### 7b. Build settings

**Build command** (recommended — generates Prisma client before build):

```bash
npx prisma generate && next build
```

**Install command:** `npm install` (default).

**Output directory:** `.next` (default).

Add environment variable:

```env
SKIP_CHROME_DOWNLOAD=1
```

So `postinstall` does not download Chrome on Vercel (audits run on Trigger anyway).

### 7c. Deploy

Click **Deploy**. First build may take several minutes.

After deploy, copy the production URL and **update** `AUTH_URL` and `NEXT_PUBLIC_APP_URL` if you used a placeholder, then **Redeploy**.

---

## 8. Post-deploy checklist

- [ ] `npx prisma db push` ran against production Supabase
- [ ] `npx trigger.dev@latest deploy` succeeded
- [ ] `AUTH_URL` / `NEXT_PUBLIC_APP_URL` match live URL
- [ ] Cloudinary PDF delivery enabled
- [ ] Register a test user → confirm email (SMTP)
- [ ] Connect a website → **Run audit** → scan completes via Trigger (check Trigger.dev runs dashboard)
- [ ] Generate a report → save to library → preview / download works
- [ ] Upload profile photo in Settings

---

## 9. Ongoing workflow

| Change | Action |
|--------|--------|
| App / UI / API code | `git push` → Vercel auto-deploys |
| `src/trigger/*` tasks | `npx trigger.dev@latest deploy` |
| Prisma schema | `npx prisma db push` locally, then redeploy Vercel |
| New env var | Add in Vercel + Trigger.dev, redeploy both |

---

## 10. Custom domain (optional)

1. Vercel → **Domains** → add `yourdomain.com`.
2. Add DNS records at your registrar (Vercel shows what to add).
3. Update `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://yourdomain.com`.
4. Redeploy.

---

## 11. Troubleshooting

### Build fails: Prisma / env validation

- All required vars from section 6 must be set in Vercel before build.
- Use `npx prisma generate && next build` as the build command.

### `Invalid environment variables` on deploy

- `USE_TRIGGER_DEV=true` requires `TRIGGER_SECRET_KEY`.
- Every key in `.env.example` marked required must be present.

### Audits stuck on “Running”

- Confirm `USE_TRIGGER_DEV=true` on Vercel.
- Confirm `npx trigger.dev@latest deploy` was run.
- Open Trigger.dev dashboard → **Runs** → check errors.
- Ensure Trigger env has `DATABASE_URL` and `DIRECT_URL`.

### Auth redirect / session issues

- `AUTH_URL` must exactly match the site URL (https, no trailing slash).
- Redeploy after changing auth URLs.

### Report PDF won’t open

- Cloudinary → **Settings → Security** → allow PDF delivery.
- Regenerate reports saved before Cloudinary URL fixes.

### Email not sending

- Use a Gmail **app password**, not your normal password.
- Check Vercel function logs for SMTP errors.

### Broken link scan times out on Vercel free

- Hobby plan ~10s limit; crawls can exceed that.
- Try smaller sites or fewer link types; consider Vercel Pro for longer functions later.

---

## 12. Quick command reference

```bash
# Local: test production build
npx prisma generate && npm run build

# Database
npx prisma db push
npx prisma studio

# Trigger.dev
npx trigger.dev@latest login
npx trigger.dev@latest deploy
npx trigger.dev@latest dev    # local worker (with npm run dev)

# Vercel CLI (optional)
npx vercel login
npx vercel --prod
```

---

## Minimum cost summary (free tier)

| Service | Free tier |
|---------|-----------|
| Vercel Hobby | Free (bandwidth / function limits apply) |
| Supabase | Free project |
| Cloudinary | Free credits |
| Trigger.dev | Free tier with limits |
| Gmail SMTP | Free with app password |

You can run LoopNode end-to-end on $0/month within those limits; upgrade when traffic or scan volume grows.
