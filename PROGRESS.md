# LoopNode — Project Progress

> **Product:** LoopNode — website health monitoring SaaS (performance, accessibility, SEO, security, broken links)  
> **Stack:** Next.js 16 · TypeScript · Prisma 7 · PostgreSQL · Auth.js v5 · shadcn/ui · Lighthouse · axe-core  
> **Last updated:** July 2026

Use this file to track what is **done**, **partial**, or **not started**. Update it when a module ships or scope changes.

### Status legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Done — works end-to-end in the app |
| 🟡 | Partial — UI or schema exists; logic incomplete or not wired |
| ❌ | Not started — planned but no real implementation |
| 🚫 | Out of scope / explicitly deferred |

---

## High-level summary

| Area | Status | Notes |
|------|--------|-------|
| Marketing site | ✅ | LoopNode branding, real copy, pricing tiers, full blog articles |
| Auth & accounts | ✅ | Register, login, verify email, forgot/reset password |
| Email (SMTP) | ✅ | Nodemailer + HTML templates (no Resend) |
| User dashboard | ✅ | Overview stats, recent scans, activity log |
| Website CRUD | ✅ | Add / edit / delete (soft delete), grid + table |
| Audit engine | ✅ | Real Lighthouse, axe-core, SEO, security scans |
| Audit report pages | ✅ | Performance, A11y, SEO, Security — rich category UIs |
| Broken link checker | 🟡 | Full crawler + live progress; findings **not** persisted to DB |
| Billing & payments | 🟡 | Manual upgrade flow ✅; Stripe Elements planned — see [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Admin dashboard | ✅ | `/admin` — overview, users, websites, billing, newsletter, support inbox |
| Scheduled scans | 🟡 | Trigger `scheduled-scans` cron + `nextScanAt`; Pro/Agency only |
| Reports (PDF/export) | ✅ | `/dashboard/reports` — generate, download, delete |
| Issue center | ✅ | Portfolio inbox at `/dashboard/issues` |
| Account settings | 🟡 | Profile + billing UI; Stripe checkout not wired |
| Background jobs | 🟡 | Trigger.dev `run-audit` (medium) + scan sync; broken links still on Vercel |
| Screenshots / Cloudinary | ❌ | Env + `Scan.screenshot` field; upload not implemented |
| Plan limits | ❌ | No site caps, history retention, or feature gating |
| Automated tests | ❌ | Vitest in devDependencies; no test files |
| API / public docs | 🚫 | Not on roadmap for v1 |

---

## 1. Marketing & public site

| Item | Status | Details |
|------|--------|---------|
| Landing page (`/`) | ✅ | LoopNode hero, real features, trial CTA, no dummy testimonials |
| Features (`/features`) | ✅ | Accurate audit capabilities, wide layout |
| Pricing (`/pricing`) | ✅ | Starter / Pro / Agency — **marketing only** until billing ships |
| Blog list + posts (`/blog`) | ✅ | 3 full articles via `src/lib/marketing/blog-posts.ts` |
| Contact (`/contact`) | ✅ | Form → SMTP; shadcn form components |
| Newsletter signup | ✅ | Footer form + subscribe / unsubscribe flow |
| Header / footer branding | ✅ | LoopNode everywhere |
| UI components | ✅ | shadcn/ui on all marketing + auth pages |

---

## 2. Authentication & user accounts

| Item | Status | Details |
|------|--------|---------|
| Email + password register | ✅ | Zod validation, bcrypt hashing |
| Login / session (Auth.js v5) | ✅ | JWT sessions, protected dashboard |
| Email verification | ✅ | Token flow + verify page |
| Forgot / reset password | ✅ | SMTP emails + token expiry |
| OAuth (Google, GitHub, etc.) | ❌ | Credentials only |
| User roles (`USER` / `ADMIN`) | 🟡 | Enum + field on `User`; only `USER` flow built |
| Soft delete users | 🟡 | `deletedAt` on `User`; used by delete-account flow |
| Account settings page | ✅ | `/dashboard/settings` — profile, password, delete account |
| Profile / avatar upload | 🟡 | Cloudinary upload/remove on settings; topbar avatar |

---

## 3. Email system

| Item | Status | Details |
|------|--------|---------|
| SMTP (Nodemailer) | ✅ | Gmail app password supported |
| Verify email template | ✅ | |
| Password reset template | ✅ | |
| Contact form notification | ✅ | |
| Newsletter welcome / unsubscribe | ✅ | Signed unsubscribe tokens |
| Resend provider | 🚫 | Removed — SMTP only |

---

## 4. User dashboard

| Item | Status | Details |
|------|--------|---------|
| Dashboard shell (sidebar, topbar, mobile nav) | ✅ | shadcn components, theme toggle |
| Overview (`/dashboard`) | ✅ | Stats cards, network score summary, recent scans & activity |
| Activity logging | ✅ | `ActivityLog` on key actions |
| Reports nav item | ✅ | `/dashboard/reports` — PDF + CSV library |
| Issue center nav item | ✅ | `/dashboard/issues` — filters, acknowledge, CSV export |
| Settings nav item | ✅ | Profile + billing tabs at `/dashboard/settings` |

---

## 5. Websites & scanning

| Item | Status | Details |
|------|--------|---------|
| List websites (`/dashboard/websites`) | ✅ | Search, grid/table toggle, connect dialog |
| Add / edit website | ✅ | Name, URL, scan frequency select |
| Delete website | ✅ | Soft delete + confirm |
| Website overview (`/dashboard/websites/[id]`) | ✅ | Gauges, Core Web Vitals, audit links, score chart, scan history |
| Manual audit trigger | ✅ | `startScanAction` → async execute API; optional Trigger.dev |
| Scan results in DB | ✅ | Scores, vitals, issues stored on `Scan` + `Issue` |
| Scan frequency field | 🟡 | Saved (`MANUAL` / `DAILY` / `WEEKLY` / `MONTHLY`) but **not executed** |
| Scan screenshots | ❌ | `Scan.screenshot` unused |
| Concurrent scan guard | ✅ | Blocks second `RUNNING` scan per site |

### Audit engines (real — not mocked)

| Engine | Status | Module |
|--------|--------|--------|
| Performance (Lighthouse) | ✅ | `lighthouse-runner.ts` — LCP, INP, CLS, FCP, TBT |
| Accessibility (axe-core) | ✅ | `accessibility-runner.ts` |
| SEO (Cheerio + live checks) | ✅ | `seo-runner.ts`, `fetch-seo-snapshot.ts` |
| Security (HTTP headers) | ✅ | `security-runner.ts`, `fetch-security-headers.ts` |
| CSP analyzer (A–F grade) | ✅ | `csp-analyzer.ts` + security audit UI |

### Per-category report pages

| Route | Status | UI |
|-------|--------|-----|
| `/performance` | ✅ | Vitals breakdown + Lighthouse issues |
| `/accessibility` | ✅ | WCAG issues with selectors |
| `/seo` | ✅ | Live SEO checklist + stored issues |
| `/security` | ✅ | Header checklist, CSP grade, tiered recommendations |
| Loading states | ✅ | Rotating status messages per category |

---

## 6. Broken link checker (separate from main audit)

| Item | Status | Details |
|------|--------|---------|
| Dedicated page (`/broken-links`) | ✅ | Separate from main audit metrics |
| Internal crawl | ✅ | BFS, configurable resource types |
| External outbound check | ✅ | |
| Live progress UI | ✅ | Poll + progress bar, halt scan |
| Scan metadata in DB | ✅ | `BrokenLinkScan` — counts, phase, progress |
| Broken link **findings** in DB | ❌ | `BrokenLinkResult` model exists; findings returned via API only (session) |
| Overview broken-link summary | ✅ | Latest scan stats on website overview |
| Resource type filter UI | ✅ | Pages, images, scripts, etc. |

---

## 7. Billing, subscriptions & plan enforcement

> Pricing is live on the marketing site. **No payment or entitlement logic exists yet.**

| Item | Status | Details |
|------|--------|---------|
| Stripe integration | ❌ | Not in dependencies |
| Subscription / plan models | ❌ | No `Subscription`, `Plan`, or `Invoice` tables |
| Checkout / billing portal | ❌ | |
| 14-day free trial | ❌ | Copy only on marketing + register |
| Plan tiers (Starter $19 / Pro $49 / Agency $129) | ❌ | Marketing copy only |
| Enforce website limits (3 / 15 / 50) | ❌ | |
| Enforce scan history retention (30 / 90 / 365 days) | ❌ | |
| Gate features by plan (daily scans, external crawls, etc.) | ❌ | |
| Webhooks (payment succeeded, cancelled, etc.) | ❌ | |
| Upgrade / paywall modal | ❌ | Designed in product spec below |

**Suggested next steps for billing**

1. Add Prisma models: `Subscription`, plan tier, trial dates  
2. Stripe Checkout + Customer Portal + webhooks  
3. `getEntitlements()` helper — server checks on every gated action  
4. Settings → Billing tab + reusable `UpgradeModal` (billing tab UI ✅; Stripe + modal pending)  
5. Enforce website count + feature flags per plan  

---

## Product design — Reports, Issues, Settings & Billing

Product spec for sidebar modules. **Settings** (profile + billing placeholder) is implemented; **Reports** and **Issues** are not built yet.

### How dashboard areas relate

| Route | Question it answers | Time scope |
|-------|-------------------|------------|
| `/dashboard` | How is my portfolio doing? | All sites, summary |
| `/dashboard/websites/[id]` | How is *this* site doing? | Latest scan |
| `/dashboard/websites/[id]/seo` | What’s wrong in *this* category? | Latest scan, interactive |
| `/dashboard/issues` | What must I fix across *all* sites? | Open issues, any site |
| `/dashboard/reports` | Give me a PDF/CSV to download or send | Point-in-time snapshot |
| `/dashboard/settings` | Account, billing, notifications | N/A |

```
Overview → Websites → [one site] → category pages (live detail)
                ↓
         Issue center (all open issues, all sites)
         Reports (generated PDFs/CSVs)
         Settings (profile + billing + notifications)
```

---

### Reports tab (`/dashboard/reports`)

**Purpose:** A library of **generated exports** — not another live audit screen. Users download or share formal snapshots. Category pages stay for day-to-day debugging.

#### Report types (v1)

| Report type | Contents | When created | Plans |
|-------------|----------|--------------|-------|
| **Full audit report** | Site name, URL, date, overall score. Sections: Performance (vitals + top issues), Accessibility, SEO, Security (CSP grade). Appendix: full issue list by severity. | On-demand or auto after audit (Pro+) | All paid |
| **Executive summary** | 1–2 pages: score, delta vs previous scan, critical count, top 5 fixes | On-demand | Pro+ |
| **Broken links report** | Broken URL, status, source page, severity | After broken-link scan | Pro+ |
| **Comparison report** | Two scans: score changes per category, new vs resolved issues | User picks scan A vs B | Pro+ |

#### Reports page UI

1. **Header** — “Reports” + “Downloadable audit snapshots for your sites.”
2. **Filters** — Website, report type, date range.
3. **Table** — Site · Type · Generated · Scan date · Size · Download / Delete.
4. **Generate** — Dialog: pick website → pick scan (latest or historical) → PDF or CSV.
5. **Empty state** — Link to run first audit.

#### Technical notes

- Source data: existing `Scan` + `Issue` (later `BrokenLinkResult`).
- Generate PDF server-side → upload to Cloudinary → save `Report` row (`fileUrl`, `scanId`, `title`).
- Enforce retention by plan (30 / 90 / 365 days).

#### What Reports is NOT

- Not a replacement for interactive category pages.
- Not real-time; always tied to a completed scan.
- Not broken-link live progress (stays on broken-links page).

---

### Issue center (`/dashboard/issues`)

**Purpose:** One **inbox** for everything that still needs fixing across the portfolio. Agencies check this daily instead of opening each site.

#### Data

- `Issue` rows from the **latest completed audit** per website.
- Later: broken-link rows when persisted to `BrokenLinkResult`.
- Dedupe by fingerprint: `(websiteId, category, title, selector)`.

#### UI

1. **Summary** — Total open · Critical · Major · chips per category.
2. **Filters** — Site, category, severity, “new since last visit” (optional).
3. **List** — Site (link) · Category · Severity · Title · “View in audit” (deep link to category page).
4. **v2** — Export CSV; mark acknowledged.

#### Issue states (new schema fields)

| State | Meaning |
|-------|---------|
| `OPEN` | Default — shown in Issue center |
| `ACKNOWLEDGED` | User noted it; hidden from default filter |
| `RESOLVED` | Auto when newer scan no longer finds same fingerprint |

On audit complete: compare fingerprints; mark missing issues `RESOLVED`.

#### What Issue center is NOT

- Not where you run scans.
- Not a duplicate of category pages (those are single-site, single-category, full detail).

---

### Settings (`/dashboard/settings`)

**Purpose:** **Account and subscription** — not per-website options (those stay on `/dashboard/websites/[id]/settings`).

Use shadcn **Tabs**:

#### Profile (`/dashboard/settings`)

- Name, email (display), change password, delete account (danger zone).

#### Billing (`/dashboard/settings/billing`)

- Current plan, renewal date, trial days left.
- Usage: sites used / limit.
- **Upgrade / change plan** → Stripe Checkout.
- **Manage payment** → Stripe Customer Portal (card, invoices).
- **Cancel** → end of billing period.

Topbar “Profile Settings” → profile tab; “Account Settings” → billing tab.

#### Notifications (v2)

- Audit complete email, critical issues alert, weekly digest, broken-link complete.

#### Scan defaults (v2, optional)

- Default frequency for new sites, default broken-link resource types.

---

### Subscription & billing — how it should work

> **Architecture & billing overview:** [ARCHITECTURE.md](./ARCHITECTURE.md) — manual billing today; Stripe Elements planned.

#### Plans (match marketing pricing)

| Plan | Price | Sites | Scheduled scans | Link crawl | History | Reports |
|------|-------|-------|-----------------|------------|---------|---------|
| **Trial** | Free 14 days | 15 (Pro access) | Daily | Internal + external | 90 days | Full PDF |
| **Starter** | $19/mo | 3 | Manual only | Internal only | 30 days | PDF on demand |
| **Pro** | $49/mo | 15 | Daily | Internal + external | 90 days | Auto PDF + comparison |
| **Agency** | $129/mo | 50 | Hourly | Full depth | 1 year | All types |

**Trial ended, no payment** → read-only: view data, no new scans until subscribe.

#### User journey

1. **Register** → `trialEndsAt` = now + 14 days, Pro entitlements, banner with days left.
2. **During trial** → Settings → Billing shows countdown + “Choose a plan”.
3. **3 days before end** → email + in-app banner.
4. **Trial expired** → `status = EXPIRED`; scans blocked; UpgradeModal on gated actions.
5. **Subscribe** → pick plan → **Stripe Elements** (embedded card form on billing page) → webhook activates plan.
6. **Ongoing** → upgrade/downgrade in app; update card / invoices / cancel via **Stripe Customer Portal**.

#### Upgrade modal (paywall)

Reusable shadcn `Dialog`, shown in context when user hits a limit:

| Trigger | Example copy |
|---------|----------------|
| 4th site on Starter | “Starter includes 3 sites. Upgrade to Pro for 15.” |
| Scan after expired trial | “Your trial ended. Subscribe to keep scanning.” |
| External links on Starter | “External crawls are on Pro and Agency.” |
| Daily schedule on Starter | “Automated scans require Pro or Agency.” |

Modal: reason · 2–3 bullet plan comparison · **Upgrade** (Checkout) · **View plans** · Dismiss (soft gates only).

#### Server-side entitlements

One helper `getEntitlements(userId)` used by:

- `addWebsiteAction` — site count  
- `triggerScanAction` — active subscription  
- `startBrokenLinkScanAction` — external mode  
- Cron — schedule frequency  
- Report generator — report type  
- Queries — history date cutoff  

Never gate in UI only.

#### Proposed `Subscription` model

```prisma
enum SubscriptionStatus { TRIALING ACTIVE PAST_DUE CANCELLED EXPIRED }
enum PlanTier { STARTER PRO AGENCY }

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  plan                 PlanTier?
  status               SubscriptionStatus @default(TRIALING)
  trialEndsAt          DateTime?
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  user                 User               @relation(...)
}
```

#### Stripe webhooks (`/api/webhooks/stripe`)

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate plan, store Stripe IDs |
| `customer.subscription.updated` | Sync tier + period end |
| `customer.subscription.deleted` | EXPIRED / CANCELLED |
| `invoice.payment_failed` | PAST_DUE + email |
| `invoice.paid` | Clear PAST_DUE |

---

## 8. Admin dashboard

> Full admin app at `/admin` — requires `User.role = ADMIN` (set in Prisma Studio, then re-login).

| Item | Status | Details |
|------|--------|---------|
| `/admin` route group | ✅ | Layout + `requireAdmin()` guard |
| Admin auth / role guard | ✅ | `src/lib/admin-auth.ts` |
| User management (list, ban, impersonate) | 🟡 | List, search, role, verify email, ban/restore — **no impersonation** (by design) |
| All websites across tenants | ✅ | Cross-tenant list, disable, force scan |
| System metrics (scans/day, errors) | ✅ | Overview dashboard |
| Newsletter subscriber admin | ✅ | List + export active CSV |
| Contact inbox / support queue | ✅ | `ContactMessage` model + read/archive |
| Manual plan overrides | ✅ | Billing tab — edit plan/status/dates (Stripe sync pending) |

**Admin modules (implemented)**

1. **Overview** (`/admin`) — users, websites, scans today, failed jobs, MRR estimate, recent activity  
2. **Users** (`/admin/users`) — search, role, verify status, soft-delete ban  
3. **Websites** (`/admin/websites`) — cross-tenant list, force scan, disable  
4. **Billing** (`/admin/billing`) — subscriptions, MRR, manual overrides; Stripe checkout still pending  
5. **Newsletter** (`/admin/newsletter`) — subscriber list, export  
6. **Support** (`/admin/contacts`) — contact form inbox  

**Promote first admin:** Prisma Studio → `users` → set `role` to `ADMIN` → sign out and back in.

---

## 9. Reports & exports

> **Full spec:** [Reports tab](#reports-tab-dashboardreports)

| Item | Status | Details |
|------|--------|---------|
| `Report` Prisma model | ✅ | `type`, `format`, Cloudinary URL + public ID |
| `/dashboard/reports` page | ✅ | List + generate dialog + download + delete |
| Full audit PDF | ✅ | Scores, vitals, issues by category |
| Executive summary PDF | ✅ | Score deltas vs previous scan + top fixes |
| Broken links export | ❌ | After findings persisted to DB |
| Comparison report | 🟡 | Partial — executive summary includes deltas |
| CSV issue export | ✅ | Per-scan issues CSV via reports |
| Email scheduled reports | ❌ | v2 — weekly digest attachment |

---

## 10. Issue center

> **Full spec:** [Issue center](#issue-center-dashboardissues)

| Item | Status | Details |
|------|--------|---------|
| `/dashboard/issues` page | ✅ | Portfolio-wide inbox from latest audit per site |
| Cross-site issue aggregation | ✅ | Latest completed scan per website |
| Filter by severity / category / site | ✅ | Search, chips, status filters |
| Issue states (OPEN / ACK / RESOLVED) | ✅ | Schema + acknowledge + auto-resolve on re-scan |
| Deep link to category audit page | ✅ | View in audit per row |
| Mark acknowledged | ✅ | Single + bulk acknowledge/reopen |
| Export CSV | ✅ | Filtered export |

---

## 11. Settings

> **Full spec:** [Settings](#settings-dashboardsettings)

| Item | Status | Details |
|------|--------|---------|
| `/dashboard/settings` layout + tabs | ✅ | Profile + Billing nav |
| Profile tab | ✅ | Name, email display, change password, delete account |
| Billing tab | 🟡 | Plan + usage UI at `/dashboard/settings/billing`; Stripe Checkout / Portal pending |
| Notifications tab | 🚫 | v2 |
| Upgrade modal component | ❌ | Shared paywall dialog (Phase A) |

---

## 12. Background jobs & scheduling

| Item | Status | Details |
|------|--------|---------|
| Trigger.dev `run-audit` | ✅ | Medium machine; Lighthouse + full audit pipeline |
| Trigger.dev `scheduled-scans` | 🟡 | Hourly cron; dispatches due sites; Pro/Agency entitlements |
| Scan cancel / sync | 🟡 | `onCancel`/`onFailure` + status API sync; broken links pending |
| Async audit queue | ✅ | `dispatchAuditScan` + client polling |
| Broken link execute API | ✅ | `POST /api/broken-links/[scanId]/execute` on Vercel (`maxDuration` 300s) |

---

## 13. Infrastructure & integrations

| Item | Status | Details |
|------|--------|---------|
| PostgreSQL + Prisma | ✅ | Full schema, migrations via `db push` |
| Puppeteer / Chrome for audits | ✅ | `ensure-chrome.mjs` postinstall |
| Cloudinary | 🟡 | Profile photos + report files (PDF/CSV raw uploads) |
| Custom theme (dark/light) | ✅ | No `next-themes` flash warning |
| shadcn/ui design system | ✅ | Marketing, auth, dashboard |
| Middleware / route protection | ✅ | Dashboard behind auth |

---

## 14. Database models (reference)

| Model | Used in app? |
|-------|----------------|
| `User`, `Account`, `Session` | ✅ |
| `VerificationToken`, `PasswordResetToken`, `EmailVerificationToken` | ✅ |
| `Website` | ✅ |
| `Scan`, `Issue` | ✅ |
| `BrokenLinkScan` | ✅ |
| `BrokenLinkResult` | ❌ (schema only) |
| `Report` | ❌ (schema only) |
| `NewsletterSubscriber` | ✅ |
| `ActivityLog` | ✅ |
| `Subscription` / billing tables | ❌ (not in schema) |

---

## 15. Documentation

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, deploy, env vars, audit pipeline |
| [PROGRESS.md](./PROGRESS.md) | This file — module status |
| [README.md](./README.md) | Quick start + links to docs above |
| `.env.example` | Env var template |

---

## Recommended build order (what’s left)

Priority order for a shippable paid SaaS:

### Phase A — Monetization (critical)
- [x] `Subscription` model + trial on register  
- [ ] Stripe Elements subscribe flow + Customer Portal (see [ARCHITECTURE.md](./ARCHITECTURE.md))  
- [ ] Stripe webhooks (`/api/webhooks/stripe`)  
- [ ] `getEntitlements()` + server gates (sites, scans, features)  
- [ ] Settings → Billing tab (real subscription UI + Elements)  
- [ ] `UpgradeModal` component (paywall dialog)  

### Phase B — Operations
- [x] Trigger.dev for audits (`run-audit` on medium machine)  
- [x] Scheduled scans cron (`scheduled-scans` task)  
- [ ] Broken link scans on Trigger.dev (optional)  
- [ ] Persist broken link findings to `BrokenLinkResult` (optional)  

### Phase C — Admin
- [x] `/admin` layout + `ADMIN` role guard  
- [x] User & website management  
- [x] Subscription overview + manual overrides (support)  

### Phase D — Product completeness
- [x] **Issue center** — portfolio inbox + OPEN/ACK/RESOLVED states  
- [x] **Reports** — PDF generation, list page, Cloudinary storage  
- [x] **Settings** — profile + billing tabs (billing placeholder until Stripe)  
- [ ] Audit screenshots via Cloudinary  
- [ ] OAuth providers (optional)  

### Phase E — Quality
- [ ] Vitest tests for scanners & critical actions  
- [ ] CI pipeline  

---

## Marketing vs reality (don’t over-promise)

| Claim on site | Actual today |
|---------------|--------------|
| 14-day free trial | Sign up works; no trial expiry or paywall |
| Plans from $19/mo | No payment |
| Daily / weekly / monthly automated scans | Wired via Trigger cron; Pro/Agency plans only |
| 30 / 90 / 365-day history | All scan history kept; no retention limits |
| Agency onboarding | Contact form only |

Keep pricing copy aligned as billing and scheduling ship.

---

## Quick “where is the code?” map

| Feature | Primary paths |
|---------|----------------|
| Audits | `src/lib/scanner/`, `src/actions/scans.ts` |
| Broken links | `src/lib/scanner/broken-link-runner.ts`, `src/actions/broken-links.ts`, `src/app/api/broken-links/` |
| Dashboard UI | `src/app/dashboard/`, `src/components/dashboard/` |
| Website UI | `src/components/websites/` |
| Marketing | `src/app/(marketing)/`, `src/lib/marketing/` |
| Auth | `src/actions/auth.ts`, `src/app/(auth)/` |
| Admin | `src/app/admin/`, `src/actions/admin.ts`, `src/lib/admin-data.ts` |
| Subscriptions | `src/lib/subscription.ts`, `src/lib/plans.ts` |
| Billing (planned) | [ARCHITECTURE.md](./ARCHITECTURE.md) § Auth & billing |
| Email | `src/lib/email/` |
| Schema | `prisma/schema.prisma` |

---

*Update this file when you complete a phase or change scope.*
