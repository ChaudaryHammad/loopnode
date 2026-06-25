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

## 4. Trigger.dev (audits) — read this carefully

Audits use Puppeteer + Lighthouse (30–90+ seconds). Vercel Hobby functions timeout at **~10 seconds**, so audits **cannot** run on Vercel. Trigger.dev runs them on its own infrastructure instead.

### Local vs production — two different things

| | **Local development** | **Production (Vercel)** |
|---|------------------------|-------------------------|
| Next.js app | `npm run dev` | Deployed on Vercel |
| Who runs the audit? | `npm run dev:trigger` (local worker) | **Trigger.dev cloud** (after you deploy tasks) |
| Command | `trigger dev` | `npx trigger.dev@latest deploy` (from your laptop) |
| API key | Dev key (`tr_dev_...`) is fine | **Production** key (`tr_prod_...`) on Vercel |

**Common mistake:** Adding Trigger env vars to Vercel and expecting audits to work. That only **queues** jobs. Vercel never runs `trigger dev` and never executes Lighthouse. You must **separately deploy tasks** to Trigger.dev.

```
User clicks "Run audit" on Vercel
        ↓
Vercel API queues task (tasks.trigger)     ← needs USE_TRIGGER_DEV=true + TRIGGER_SECRET_KEY
        ↓
Trigger.dev cloud runs run-audit task      ← needs npx trigger.dev deploy + DB env on Trigger
        ↓
Scan completes in Supabase
```

**Broken link scans are different** — they still run on Vercel API routes (`/api/broken-links/...`) and are **not** on Trigger yet. They may timeout on the free plan for large sites.

### 4a. Create Trigger.dev project

1. Sign up at [cloud.trigger.dev](https://cloud.trigger.dev).
2. Create a project → **Settings** → copy **Project ref** (e.g. `proj_xxxx`) → `TRIGGER_PROJECT_REF`.
3. **API Keys** → create a **Production** secret key (`tr_prod_...`) → use this on **Vercel**.
4. (Optional) Create a **Development** key (`tr_dev_...`) for local `.env.local` only.

### 4b. Deploy tasks to Trigger.dev (required — from your machine)

This step is **not** part of the Vercel build. Run it on your laptop after cloning and whenever `src/trigger/` changes:

```bash
# One-time login
npx trigger.dev@latest login

# Deploy tasks to Trigger.dev production
npx trigger.dev@latest deploy
```

`trigger.config.ts` reads `.env.local` during deploy and bundles env into the worker. Task code lives in `src/trigger/run-audit.ts`.

**Verify deploy succeeded:** Trigger.dev dashboard → **Deployments** should show a recent deployment.

### 4c. Environment variables on Trigger.dev (worker side)

The worker runs on Trigger’s servers and needs database access. In **Trigger.dev → your project → Environment variables** (Production), set:

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Same Supabase pooler URL as Vercel |
| `DIRECT_URL` | Yes | Same Supabase direct URL as Vercel |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://your-app.vercel.app` |
| `PUPPETEER_EXECUTABLE_PATH` | Yes | `/usr/bin/google-chrome-stable` |

Redeploy Trigger tasks after changing these:

```bash
npx trigger.dev@latest deploy
```

### 4d. Environment variables on Vercel (app side)

Set in **Vercel → Project → Settings → Environment Variables** (Production):

```env
USE_TRIGGER_DEV=true
TRIGGER_SECRET_KEY=tr_prod_xxxxxxxx
TRIGGER_PROJECT_REF=proj_xxxxxxxx
```

| Variable | Value | Notes |
|----------|--------|--------|
| `USE_TRIGGER_DEV` | `true` | Must be exactly `true` — not `false` or empty |
| `TRIGGER_SECRET_KEY` | `tr_prod_...` | **Production** key — dev keys won't work on Vercel |
| `TRIGGER_PROJECT_REF` | `proj_xxxx` | From Trigger project settings |

When `USE_TRIGGER_DEV=true`, starting an audit calls `tasks.trigger("run-audit", …)` instead of running Lighthouse on Vercel.

### 4e. Local development (two terminals)

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Trigger dev worker (picks up queued tasks locally)
npm run dev:trigger
```

Your `.env.local` can use a dev API key for local testing. Production Vercel must use the production key.

### 4f. Production setup order (do in this order)

1. Create Trigger.dev project + production API key.
2. Add `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL` in Trigger.dev env.
3. Run `npx trigger.dev@latest login` then `npx trigger.dev@latest deploy`.
4. Add `USE_TRIGGER_DEV`, `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF` on Vercel.
5. Deploy / redeploy Vercel.
6. Run an audit on the live site → check **Trigger.dev → Runs** for a new run.

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
| `USE_TRIGGER_DEV` | Yes | `true` on Vercel (exact string) |
| `TRIGGER_SECRET_KEY` | Yes | **Production** key (`tr_prod_...`) — not dev key |
| `TRIGGER_PROJECT_REF` | Yes | e.g. `proj_xxxx` |
| `NODE_ENV` | Auto | Vercel sets `production` |
| `SKIP_CHROME_DOWNLOAD` | Recommended | `1` — skip Puppeteer Chrome download on Vercel build |

Mirror **database and app URL** vars in **Trigger.dev → Environment variables** (Production):

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`

Then run `npx trigger.dev@latest deploy` so the worker picks them up.

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
- [ ] **`npx trigger.dev@latest deploy` succeeded** (not optional — Vercel alone cannot run audits)
- [ ] Trigger.dev dashboard → **Deployments** shows your task bundle
- [ ] Trigger.dev → **Environment variables** has `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL`, `PUPPETEER_EXECUTABLE_PATH`
- [ ] Vercel has `USE_TRIGGER_DEV=true` and **production** `TRIGGER_SECRET_KEY` (`tr_prod_...`)
- [ ] `AUTH_URL` / `NEXT_PUBLIC_APP_URL` match live URL
- [ ] Cloudinary PDF delivery enabled
- [ ] Register a test user → confirm email (SMTP)
- [ ] Connect a website → **Run audit** → **Trigger.dev → Runs** shows a completed run (not stuck on Vercel)
- [ ] Generate a report → save to library → preview / download works
- [ ] Upload profile photo in Settings

---

## 9. Ongoing workflow

| Change | Action |
|--------|--------|
| App / UI / API code | `git push` → Vercel auto-deploys |
| `src/trigger/*` tasks | `npx trigger.dev@latest deploy` (Vercel redeploy is **not** enough) |
| Prisma schema | `npx prisma db push` locally, then redeploy Vercel |
| New env var on Vercel | Redeploy Vercel |
| New env var on Trigger worker | Update Trigger.dev env, then `npx trigger.dev@latest deploy` |

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

### Audits stuck on “Running” (Trigger.dev)

Work through this list in order:

1. **`npx trigger.dev@latest deploy`** — most common fix. Env vars on Vercel alone do not deploy the worker.
2. **`USE_TRIGGER_DEV=true`** on Vercel (exact value, then redeploy).
3. **`TRIGGER_SECRET_KEY`** must be a **production** key (`tr_prod_...`), not `tr_dev_...`.
4. Open **Trigger.dev → Runs** after starting an audit:
   - **No runs appear** → Vercel is not queuing (check keys + `USE_TRIGGER_DEV`).
   - **Runs appear but fail** → open the run log; usually missing `DATABASE_URL` / `DIRECT_URL` on Trigger.dev.
5. Trigger.dev → **Environment variables** (Production) must include `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL`.
6. Trigger.dev → **Environment variables** must include `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable` for cloud Chrome.
7. After fixing Trigger env, run `npx trigger.dev@latest deploy` again.

### `Invalid environment variables` on Vercel build

- `USE_TRIGGER_DEV=true` requires `TRIGGER_SECRET_KEY`.
- Every required key from section 6 must be present on Vercel before build.

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

# Trigger.dev (production worker — run from your machine, NOT on Vercel)
npx trigger.dev@latest login
npx trigger.dev@latest deploy          # required after src/trigger/ changes
npm run dev:trigger                    # local only: pairs with npm run dev

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

---

## 13. Stripe billing (when implemented)

Full payment flows, Stripe Elements setup, webhooks, admin billing, and user/non-user journeys are documented in **[BILLING.md](./BILLING.md)**.

Quick summary for production env (add when Phase A ships):

| Variable | Notes |
|----------|--------|
| `STRIPE_SECRET_KEY` | Server only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client Elements |
| `STRIPE_WEBHOOK_SECRET` | `/api/webhooks/stripe` |
| `STRIPE_PRICE_STARTER` / `_PRO` / `_AGENCY` | Stripe Price IDs |

Webhook URL: `https://your-app.vercel.app/api/webhooks/stripe`

