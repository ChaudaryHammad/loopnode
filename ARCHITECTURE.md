# LoopNode — Architecture

> **Product:** Website health monitoring SaaS — performance, accessibility, SEO, security, broken links  
> **Stack:** Next.js 16 · TypeScript · Prisma 7 · PostgreSQL · Auth.js v5 · Trigger.dev · Lighthouse · axe-core · Cloudinary

Module completion status lives in [PROGRESS.md](./PROGRESS.md).

---

## 1. Production architecture

| Service | Role |
|---------|------|
| **Vercel** | Next.js app, API routes, auth, UI, broken-link scans |
| **Supabase** | PostgreSQL — users, websites, scans, issues, billing |
| **Cloudinary** | Profile photos, report PDFs/CSVs |
| **Trigger.dev** | Lighthouse / Puppeteer audits (`run-audit`, `scheduled-scans`) |
| **Gmail SMTP** | Verification, password reset, contact, billing emails |

```
User / cron
    ↓
Vercel API or scheduled-scans task
    ↓
dispatchAuditScan() → tasks.trigger("run-audit")   [medium-1x machine]
    ↓
Trigger.dev worker: completeAuditScan()
    ↓
PostgreSQL (Scan, Issue, scores)
```

**Important:** Vercel Hobby functions timeout at ~10s. Full audits take 30–90+ seconds and **must** run on Trigger.dev (`USE_TRIGGER_DEV=true`). Broken-link scans still run on Vercel API routes and may hit limits on large sites.

---

## 2. Repository layout

| Path | Purpose |
|------|---------|
| `src/app/(marketing)/` | Public site — landing, features, pricing, blog, contact |
| `src/app/(auth)/` | Login, register, verify, reset password |
| `src/app/dashboard/` | User dashboard — websites, audits, reports, issues, settings |
| `src/app/admin/` | Admin — users, websites, billing, upgrades, newsletter |
| `src/app/api/` | API routes — audit execute/status, broken links, webhooks |
| `src/actions/` | Server actions — scans, websites, settings, billing |
| `src/components/` | UI — dashboard, websites, marketing, shadcn primitives |
| `src/lib/scanner/` | Audit engine — Lighthouse, axe, SEO, security, progress |
| `src/lib/audit-dispatch.ts` | Queue audits to Trigger or run locally |
| `src/lib/entitlements.ts` | Plan limits and feature gates |
| `src/lib/plans.ts` | Plan prices, site limits, scheduling copy |
| `src/trigger/` | Trigger.dev tasks — `run-audit`, `scheduled-scans` |
| `src/broken-links/` | Broken-link crawler (runs on Vercel, not Trigger yet) |
| `prisma/schema.prisma` | Database schema |

---

## 3. Audit pipeline

### Manual scan

1. User clicks **Run audit** → `startScanAction` creates `Scan` (RUNNING).
2. `dispatchAuditScan(scanId)` on Vercel queues `run-audit` on Trigger (`medium-1x`).
3. `run-audit` runs `completeAuditScan()` — Lighthouse, axe-core, SEO, security.
4. Client polls `/api/audits/[scanId]/status`; `sync-trigger-run.ts` syncs Trigger state.
5. Scan completes → scores and issues stored; activity logged.

### Scheduled scan

1. `scheduled-scans` cron (hourly) finds websites where `nextScanAt <= now` and plan allows automation.
2. Creates `Scan`, calls `dispatchAuditScan(scanId, { forceTrigger: true })` — always queues `run-audit` on **medium** (never inline on the small cron worker).
3. Updates `nextScanAt` via `computeNextScanAt()`.

### Cancellation

- User halts scan → DB + Trigger run cancel via `audit-scan-control.ts`.
- `run-audit` has `onCancel` / `onFailure` hooks to sync DB state.

### Broken links

- Separate workflow: `POST /api/broken-links/[scanId]/execute` on Vercel.
- Not on Trigger.dev yet; long crawls may timeout on free tier.

---

## 4. Auth & billing

- **Auth:** Auth.js v5, JWT sessions, credentials provider, email verification.
- **Trial:** 14-day trial on register (`Subscription` TRIALING).
- **Billing (today):** Manual upgrade requests — user pays externally, admin approves at `/admin/upgrade-requests`.
- **Billing (planned):** Stripe Elements + webhooks — not wired yet.
- **Entitlements:** `getEntitlements(userId)` gates sites, scans, scheduling, read-only mode.

### Plans (summary)

| Plan | Price | Sites | Scheduling |
|------|-------|-------|--------------|
| Starter | $19/mo | 3 | Manual only |
| Pro | $49/mo | 15 | Daily / weekly / monthly |
| Agency | $129/mo | 50 | Daily / weekly / monthly |

---

## 5. Local development

**Prerequisites:** Node 20+, PostgreSQL (or Supabase), `.env.local` from `.env.example`.

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev          # Terminal 1 — Next.js
npm run dev:trigger  # Terminal 2 — Trigger worker (when USE_TRIGGER_DEV=true)
```

Key env vars: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, SMTP vars, Cloudinary vars, `USE_TRIGGER_DEV`, `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF`.

---

## 6. Deployment

### Vercel (app)

1. Connect repo → set env vars (see checklist below).
2. Build: `npx prisma generate && next build`
3. `git push` → auto-deploy.

### Trigger.dev (audits)

**Not part of Vercel build.** Run from your machine whenever `src/trigger/` changes:

```bash
npx trigger.dev@latest login
npx trigger.dev@latest deploy
```

`trigger.config.ts` bundles env from `.env.local` into the worker at deploy time.

### What to redeploy when

| Change | Action |
|--------|--------|
| App / UI / API / `src/lib/` | `git push` → Vercel |
| `src/trigger/*` | `npx trigger.dev deploy` |
| Prisma schema | `npx prisma db push` + Vercel redeploy |
| Trigger worker env | Update Trigger dashboard env + redeploy Trigger |

---

## 7. Environment variables

### Vercel (required)

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Supabase pooler (6543) |
| `DIRECT_URL` | Supabase direct (5432) |
| `AUTH_SECRET` | Random 32+ byte secret |
| `AUTH_URL` / `NEXT_PUBLIC_APP_URL` | Production URL, no trailing slash |
| `EMAIL_FROM`, `SMTP_*` | Gmail app password or SMTP provider |
| `NEXT_PUBLIC_CLOUDINARY_*`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET` | File uploads |
| `USE_TRIGGER_DEV` | `true` on production |
| `TRIGGER_SECRET_KEY` | Production key `tr_prod_...` |
| `TRIGGER_PROJECT_REF` | e.g. `proj_xxxx` |
| `SKIP_CHROME_DOWNLOAD` | `1` on Vercel (audits run on Trigger) |

### Trigger.dev worker (required)

| Variable | Notes |
|----------|--------|
| `DATABASE_URL`, `DIRECT_URL` | Same as Vercel |
| `NEXT_PUBLIC_APP_URL` | Production app URL |
| `USE_TRIGGER_DEV` | `true` |
| `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF` | Same project |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/google-chrome-stable` |

### Optional — manual billing

`PAYMENT_PAYONEER_EMAIL`, `PAYMENT_BANK_*`, `PAYMENT_EASYPAISA_NUMBER`, `PAYMENT_JAZZCASH_NUMBER`, `SUPPORT_EMAIL`

---

## 8. Post-deploy checklist

- [ ] `npx prisma db push` against production DB
- [ ] `npx trigger.dev deploy` succeeded
- [ ] Trigger dashboard shows recent deployment + env vars
- [ ] Vercel has `USE_TRIGGER_DEV=true` + production Trigger key
- [ ] Test: register → verify email → add site → run audit → check Trigger Runs
- [ ] Test: scheduled scan (Pro plan) queues `run-audit` on medium machine

---

*For module-by-module completion status, see [PROGRESS.md](./PROGRESS.md).*
