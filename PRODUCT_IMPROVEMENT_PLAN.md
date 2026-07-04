# LoopNode — Product & Architecture Improvement Plan

> **Author:** Product & engineering audit (July 2026)  
> **Status:** Planning document — **no implementation should begin until this plan is reviewed and phases are approved.**  
> **Audience:** Founders, product, engineering

---

## Executive summary

LoopNode has a **strong foundation**: real audit engines (performance, accessibility, SEO, security), polished dashboard UI, auth, admin, and marketing. The product *looks* like a paid SaaS monitoring tool.

The gap is not visual polish — it is **operational truth**. Several core promises are stored in the database or shown in the UI but **never executed**:

| Promise in UI/marketing | Reality in code |
|-------------------------|-----------------|
| Daily / weekly / monthly scans | `scanFrequency` saved; **no scheduler reads it** |
| Stop audit | DB row marked failed; **Trigger.dev run keeps executing** |
| 14-day trial + plan limits | Subscription created; **nothing enforces limits** |
| Issue center triage | Acknowledge/dismiss **wiped on every re-scan** |
| Monitoring product | **On-demand audits only** — no uptime, no alerts |
| Lighthouse performance | Hand-rolled PerformanceObserver + CDP metrics (**not Lighthouse**) |

**Strategic recommendation:** Before adding features, close the **trust gap** — scans, scheduling, cancellation, entitlements, and issue persistence must behave exactly as the UI claims. Then differentiate with **actionable intelligence** (findings that persist, trends, priorities, developer-ready reports) rather than another flat issue table.

---

## 1. Overall product findings

### What works well

- **Website overview** is the best screen: gauges, Core Web Vitals, category drill-downs, score trends, broken-link summary.
- **Per-category audit pages** (performance, accessibility, SEO, security) are rich and navigable.
- **Broken link checker** has real progress UI, cooperative cancellation, and a dedicated workflow — a good template for the main audit.
- **Auth, email, admin, activity log** are production-grade for an early SaaS.
- **Schema** is thoughtfully designed (`Scan`, `Issue`, `BrokenLinkScan`, `BrokenLinkResult`, `Subscription`, `Report`) — most gaps are **wiring**, not greenfield design.

### What undermines trust

1. **False automation** — Users select "Daily" scans; nothing runs on a schedule.
2. **False cancellation** — "Stop audit" updates the app; background work continues (especially in Trigger.dev mode).
3. **False billing** — Pricing page and settings imply limits; server actions do not enforce them.
4. **False monitoring** — Branding says "monitoring"; product is snapshot auditing without alerts or uptime.
5. **Misleading performance label** — Copy references Lighthouse; implementation is a custom lab script (`lighthouse-runner.ts` does not run Lighthouse).

### Product positioning tension

LoopNode sits between three buyer personas:

| Persona | What they need | Current fit |
|---------|----------------|-------------|
| **Solo developer** | Fast audit, clear fixes, CI-friendly | Good audit pages; weak history & export |
| **Agency** | Multi-site portfolio, client reports, scheduling | Portfolio UI exists; reports & scheduling immature |
| **Compliance / enterprise** | Persistent findings, audit trail, assignments | Issue center not durable enough |

**Recommendation:** Optimize for **agency + solo dev** first (portfolio, scheduling, client reports, persistent findings). Defer uptime monitoring and enterprise workflow to Phase 3+.

---

## 2. Weak features (and why they need improvement)

### 2.1 Audit scan system

| Weakness | Why it matters |
|----------|----------------|
| Cancel does not stop Trigger.dev runs | Wasted compute, confusing UX, users lose trust |
| No real scan history | Cannot compare runs, debug regressions, or prove value over time |
| No audit progress on `Scan` model | Only spinner; broken-link scans already have phase/progress |
| Local mode runs Chrome inside HTTP request (up to 300s) | Fragile on serverless; poor concurrency |
| Stuck `RUNNING` scans | Only healed when user starts another scan, after 10 min |
| Sequential audit phases near `maxDuration` | Slow sites fail unpredictably |
| `retry.maxAttempts: 1` on Trigger task | Transient failures become hard failures |

**Files:** `src/lib/audit-dispatch.ts`, `src/trigger/run-audit.ts`, `src/actions/scans.ts`, `src/hooks/use-audit-scan.ts`, `src/lib/scanner/audit-runner.ts`, `src/lib/scanner/complete-audit-scan.ts`

### 2.2 Scheduling

| Weakness | Why it matters |
|----------|----------------|
| `ScanFrequency` enum stored, never consumed | Core paid feature is vaporware |
| No `nextScanAt`, timezone, or custom cron | Users cannot control *when* scans run |
| No plan gating for automation | Marketing says Pro/Agency for scheduled scans — unenforced |

**Files:** `prisma/schema.prisma` (`Website.scanFrequency`), `src/components/websites/website-form.tsx`, `trigger.config.ts` (no schedules)

### 2.3 Link crawler

| Weakness | Why it matters |
|----------|----------------|
| `fetch()` + cheerio only — no JS execution | Misses SPA routes, lazy-loaded links, client-rendered nav |
| Findings not persisted (`BrokenLinkResult` unused) | No history, no reports, no issue integration |
| Unbounded BFS crawl vs 300s route limit | Large sites hit timeout mid-crawl |
| DB write per progress tick | Performance overhead on long crawls |

**Files:** `src/lib/scanner/broken-link-runner.ts`, `src/app/api/broken-links/[scanId]/execute/route.ts`, `prisma/schema.prisma` (`BrokenLinkResult`)

### 2.4 Issues center

| Weakness | Why it matters |
|----------|----------------|
| Issues are children of `Scan`, not durable `Finding` entities | Acknowledge/mute lost on re-scan |
| "Dismiss" = hard delete | Same issue reappears as OPEN next scan |
| Flat inbox, latest scan only | No "new / regressed / resolved" story |
| Brittle fingerprint (`category|title|selector|url`) | Dynamic titles cause duplicate/flapping issues |
| Client-side pagination of full portfolio | Does not scale |

**Files:** `src/lib/issue-service.ts`, `src/components/issues/issue-center-client.tsx`, `src/lib/issues.ts`, `prisma/schema.prisma` (`Issue`)

### 2.5 Reports

| Weakness | Why it matters |
|----------|----------------|
| Single-scan PDF, plain text via pdf-lib | Not client-deliverable for agencies |
| 15 issues/category cap with silent truncation | Incomplete reports |
| No trends, portfolio, or broken-link integration | Low perceived value vs free Lighthouse |
| Duplicate CSV export paths (client vs server) | Format drift |
| Cloudinary PDF delivery coupling | Fragile preview/download |

**Files:** `src/lib/reports/generate-pdf.ts`, `src/components/reports/reports-client.tsx`, `src/lib/reports/generate-broken-links-pdf.ts` (unwired)

### 2.6 Billing & entitlements

| Weakness | Why it matters |
|----------|----------------|
| No `getEntitlements()` | Cannot gate anything consistently |
| `addWebsiteAction` ignores site limits | Revenue leak + abuse |
| `startScanAction` ignores trial expiry | Users scan forever after trial |
| Billing settings hardcodes `DEV_PLAN` | Settings lie to every user |

**Files:** `src/lib/subscription.ts`, `src/actions/websites.ts`, `src/actions/scans.ts`, `src/app/dashboard/settings/billing/page.tsx`, `BILLING.md`

---

## 3. UX / UI issues

### Global

- **Status inconsistency after audit completes** — Header badge, button label, and results can disagree when client polling completes before `router.refresh()` (observed: "Running" + "Audit complete" + empty gauges).
- **Hardcoded color utilities** (`text-emerald-400`, `bg-rose-500/10`) instead of semantic tokens — retheme and light-mode risk.
- **Duplicated status badge maps** across components — drift over time.
- **Multiple `AuditScanControls` on one page** → duplicate pollers and redundant server actions.

### Audit experience

- Button-only loading (spinner) during audits — no phase, progress %, or elapsed time on main audit (broken links already does this well).
- Scan history rows are **not clickable** — `getScanDetailsAction` exists but has no UI.
- Category pages always show **latest** scan — no way to view historical audit for a category.
- "Lighthouse run" copy on Core Web Vitals — inaccurate vs implementation.

### Scheduling UX (when built)

- Current UI is a single `<select>` (Manual / Daily / Weekly / Monthly) with no time, timezone, or day-of-week — insufficient for real scheduling needs.

### Issues center

- One undifferentiated table — no grouping by site, finding type, or "what changed since last scan."
- No resolved/history tab — users cannot see what they fixed.
- No assignee, due date, notes, or snooze — not a workflow tool.

### Reports

- Generate dialog is functional but output is not visually compelling or shareable.
- No "regenerate" or staleness indicator when underlying scan changes.

### Settings / billing

- Billing tab shows development placeholder — undermines conversion at the moment users consider paying.

---

## 4. Architecture improvements

### 4.1 Audit execution architecture (recommended)

```
┌─────────────┐     create Scan (RUNNING)      ┌──────────────────┐
│   Client    │ ─────────────────────────────► │  startScanAction │
└─────────────┘                                └────────┬─────────┘
       │                                                  │
       │ POST /api/audits/[id]/execute                     │
       ▼                                                  ▼
┌─────────────┐     persist triggerRunId         ┌──────────────────┐
│  dispatch   │ ─────────────────────────────► │  Scan row + job  │
└─────────────┘                                └────────┬─────────┘
       │                                                  │
       ├─ trigger mode ──► Trigger.dev run-audit          │
       │                      │                           │
       │                      ├─ update phase/progress    │
       │                      ├─ assertScanRunnable()    │
       │                      └─ completeAuditScan()     │
       │                                                  │
       └─ local mode ────► SHOULD ALSO queue (not inline)│
                                                          ▼
                                               ┌──────────────────┐
                                               │ COMPLETED/FAILED │
                                               └──────────────────┘
```

**Key changes:**

1. **Always queue** — Even "local" mode should not hold the HTTP connection for 5 minutes. Return immediately; worker runs audit.
2. **Persist `triggerRunId`** on `Scan` — Enable `runs.cancel()` on user stop.
3. **Add progress columns to `Scan`** — Mirror `BrokenLinkScan`: `phase`, `statusMessage`, `progressPercent`.
4. **Cooperative cancellation** — Call `assertScanRunnable()` between audit phases (not only before/after).
5. **Global stale-scan reaper** — Cron/task fails `RUNNING` scans older than `maxDuration + buffer`.
6. **Transactional completion** — Wrap scan update + issue create + auto-resolve in a transaction.
7. **Retries** — At least 2 attempts with backoff for transient Puppeteer/network failures.

### 4.2 Scheduling architecture (recommended)

**Do not** fake scheduling with client-side timers. Use a server scheduler:

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| Trigger.dev `schedules.task` (hourly cron) | Already integrated; durable | Requires Trigger.dev in prod | **Primary** |
| Vercel Cron + API route | Simple | Less visibility; cold starts | Fallback |
| Per-website cron expressions | Maximum flexibility | Complex UX + ops | Phase 2 |

**Schema additions on `Website`:**

```prisma
scanTimezone     String   @default("UTC")      // IANA, e.g. America/New_York
scanTimeOfDay    String?                        // "09:00" local
scanDayOfWeek    Int?                           // 0-6 for weekly
scanDayOfMonth   Int?                           // 1-28 for monthly
nextScanAt       DateTime?
lastScheduledAt  DateTime?
```

**Scheduler logic (hourly):**

1. Query websites where `nextScanAt <= now()` AND `scanFrequency != MANUAL` AND user entitlements allow automation.
2. Create `Scan`, dispatch audit, compute next `nextScanAt` from frequency + timezone.
3. Skip if a scan is already `RUNNING` for that site.
4. Log to `ActivityLog`; optional email on completion.

### 4.3 Issues architecture (recommended redesign)

**Problem:** `Issue` is a per-scan snapshot. Triage state cannot survive re-scans.

**Solution:** Introduce a durable **`Finding`** layer:

```
Website ──< Finding (websiteId, fingerprint, status, firstSeenAt, lastSeenAt, …)
              │
              └──< IssueOccurrence (scanId, severity, metadata, …)  // optional audit trail
```

| Concept | Responsibility |
|---------|----------------|
| `Finding` | Stable identity across scans; holds ACK/MUTED/OPEN/RESOLVED, notes, assignee |
| `Issue` (or rename to `Occurrence`) | Per-scan evidence row linked to `findingId` |
| Fingerprint | Stable rule ID + selector/url — **exclude volatile title text** |

**UX shift:** Issues Center becomes a **"Findings workspace"** with views:

- **Inbox** — Open findings needing attention
- **Regressions** — Was resolved, reappeared
- **New** — First seen since last visit
- **Muted** — Suppressed noise
- **History** — Timeline per finding

### 4.4 Reports architecture (recommended)

Move from "export a PDF" to **"insights dashboard + export":**

1. **In-app report builder** — React charts (trends, category breakdown, top regressions) using existing `ScoreChart` patterns.
2. **HTML → PDF** (Puppeteer or `@react-pdf/renderer`) — Branded, visual, no silent truncation.
3. **Report types:** Executive summary, full technical, trend (N scans), portfolio (multi-site), broken links.
4. **Scheduled delivery** — Email PDF to stakeholders (SMTP already exists).
5. **White-label** — Logo, colors, "Prepared for {client}" (Agency tier).

### 4.5 Link crawler architecture (stay in-app)

**Constraint:** Do not move crawler to Trigger.dev.

**Recommended hybrid pipeline:**

```
Phase 1: fetch + cheerio (fast, static links)
Phase 2: Puppeteer render pass (configurable per site or when SPA detected)
         - networkidle0 or domcontentloaded + wait for route hydration
         - extract from DOM + performance.getEntriesByType('resource')
Phase 3: merge + dedupe + check
```

**Also:**

- Persist findings to `BrokenLinkResult` (schema exists).
- Page cap (e.g. 500) + depth cap (e.g. 5) + resumable chunked crawls for large sites.
- Throttle progress DB writes (every N links or 2s).
- SPA detection heuristic: few static `<a href>` but large JS bundle → auto-enable render pass.

---

## 5. Missing features (high value)

| Feature | User value | Effort |
|---------|------------|--------|
| Real scan cancellation (Trigger.dev) | Trust, cost control | M |
| Scheduled scans + timezone | Core monitoring promise | L |
| Entitlements + Stripe | Revenue | L |
| Durable findings + regression detection | Issues center becomes useful | L |
| Scan history drill-down | Compare runs, prove ROI | M |
| Audit progress panel (real backend phases) | Professional UX | M |
| Email alerts (audit complete, score drop, critical) | Monitoring without uptime | M |
| Visual / trend reports | Agency deliverable | L |
| Broken link persistence + report integration | Complete link story | M |
| Rate limiting on audit execute | Abuse prevention | S |
| Uptime / availability checks | True monitoring | XL |
| CI API / webhook integrations | Developer adoption | L |
| Screenshots on audit (`Scan.screenshot`) | Visual regression hint | M |
| OAuth (Google/GitHub) | Lower signup friction | M |
| Test suite + CI for scanners | Production confidence | L |

---

## 6. Deep dive: Audit scan

### Current flow

1. `startScanAction` → creates `Scan` (`RUNNING`)
2. Client → `POST /api/audits/[scanId]/execute`
3. `dispatchAuditScan` → Trigger.dev **or** inline `completeAuditScan`
4. `runFullAudit` → security (parallel) + browser: nav → performance → accessibility → SEO
5. Client polls `getScanStatusAction` every 2s for `status` only
6. `cancelScanAction` → sets `FAILED` + `"Halted by user"` — does **not** cancel Trigger run

### Cancel gap (critical)

- `handle.id` returned from `tasks.trigger()` is **never stored** on `Scan`.
- `cancelScanAction` cannot call `runs.cancel(runId)`.
- In local mode, Puppeteer keeps running until `runFullAudit` finishes; post-run `assertScanRunnable` throws and discards results — **wasted work**.

### Scheduling gap (critical)

- Zero workers read `Website.scanFrequency`.
- No `schedules.task` in `trigger.config.ts`.
- UI badge `{scanFrequency} scans` implies automation that does not exist.

### Scan history gap

- Overview loads last 10 scans; rows are not links.
- `getScanDetailsAction` unused in UI.
- Category pages bind to latest scan only.

### Performance / reliability

- Worst-case audit duration approaches 300s `maxDuration` (nav 50s + perf 120s + a11y 45s + SEO 45s).
- `completeAuditScan` is non-transactional — scan can be `COMPLETED` while client sees failure.
- Stale scan cleanup only on next manual start (`STALE_SCAN_MS = 10 min`).

### Recommended UX (audit)

1. **Dedicated progress panel** (not button spinner) — stepper, %, elapsed, contextual messages, stop button.
2. **Scan history page** — filterable table: completed / failed / cancelled / running; click → full snapshot.
3. **Schedule settings** — frequency + time + timezone + preview ("Next scan: Tue 9:00 AM EST").
4. **Post-complete state** — Single source of truth: header badge, button, and gauges update together from merged client+server state.

### Recommended architecture decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Execution | Always Trigger.dev in production | Durable, cancellable, schedulable |
| Local dev | Trigger.dev dev OR inline with clear warning | Avoid prod/local parity issues |
| Progress | DB columns on `Scan`, updated per phase | Works with existing polling; SSE later |
| Cancellation | DB flag + `runs.cancel()` + phase checks | Belt and suspenders |
| Scheduling | Hourly cron + `nextScanAt` | Simple, timezone-correct, extensible |

---

## 7. Deep dive: Link crawler

### Why dynamic links are missed

| Cause | Mechanism |
|-------|-----------|
| No JS execution | `fetchPageHtml` + cheerio parses static HTML only (`broken-link-runner.ts`) |
| SPA routing | Links created by `react-router`, Next.js client nav, etc. never in initial HTML |
| Lazy loading | Below-fold links injected on scroll/intersection |
| `onClick` navigation | No `href` — crawler never sees them |
| Non-standard attributes | `data-href`, router-specific attrs not in `LINK_SELECTORS` |
| Auth walls / bot blocking | `fetch` may get shell or challenge page |

Puppeteer **already exists** (`launch-browser.ts`) for audits but is **not used** by the link crawler.

### Recommended improvements (in-app only)

**Phase A — Accuracy (highest ROI)**

1. **Hybrid extraction mode** — `static` | `rendered` | `auto` (default `auto`).
2. **Rendered pass** — Puppeteer: load page, wait for network settle, `page.$$eval` for links, also collect `resource` timing URLs.
3. **Expand selectors** — `[data-href]`, `[data-url]`, common framework patterns.
4. **Persist `BrokenLinkResult`** — Enable history, reports, re-check without re-crawl.

**Phase B — Performance & scale**

1. **Crawl limits** — `maxPages`, `maxDepth`, `maxLinksToCheck` (user-configurable, plan-gated).
2. **Chunked/resumable crawl** — Store queue state on `BrokenLinkScan`; continue across requests if approaching 300s.
3. **Throttle progress writes** — Batch DB updates.
4. **Smarter concurrency** — Separate crawl vs check pools; respect `robots.txt` (optional).

**Phase C — Intelligence**

1. **SPA detection** — Low link count + heavy JS → suggest/enable rendered mode.
2. **Source context in UI** — Screenshot thumbnail of broken link location (reuse audit screenshot infra).
3. **Integrate with Issues Center** — Broken links as `Finding` category.

---

## 8. Deep dive: Issues center — challenge the design

### Why the current design fails

The Issues Center asks: *"Here are all open issues from the latest scan of each site."*

That answers a question **nobody asks repeatedly**. After the first visit:

- Users know their issues — they need **what changed**, **what to fix first**, and **proof of progress**.
- A flat list of 200 rows across 15 sites is **anxiety**, not action.
- Acknowledging an issue that returns as OPEN on the next scan teaches users **not to bother triaging**.

### Proposed redesign: **Findings Command Center**

Replace the inbox metaphor with a **change-detection workflow**:

#### Primary views

| View | Question answered | Default sort |
|------|-------------------|--------------|
| **Action required** | What needs human attention now? | Severity × recency |
| **New since last scan** | What got worse or appeared? | Newest first |
| **Regressions** | What came back after we fixed it? | Severity |
| **Improvements** | What did we fix? (morale + client proof) | Recently resolved |
| **By site** | Site health at a glance | Worst score first |
| **By rule** | Same problem across sites | Occurrence count |

#### Finding detail drawer (not just a table row)

- Status timeline (first seen → acknowledged → resolved → regressed)
- Occurrences across scans (sparkline of severity)
- **Fix guidance** — recommendation + docs link + code snippet where applicable
- **Assign / due date / note** (Agency)
- **Mute** with reason (replaces destructive dismiss)
- Link to category audit page **for that scan date**

#### Portfolio intelligence (paid differentiator)

- "3 sites regressed on accessibility this week"
- "Critical security header missing on 5 of 8 sites"
- Weekly digest email summarizing changes

#### Data model change (required)

See §4.3 — `Finding` entity with stable fingerprint; `Issue` rows become scan evidence.

#### What to remove

- Hard delete "Dismiss" as primary action → **Mute finding**
- Client-side-only full portfolio load → server pagination + filters
- Severity-only sort → composite score (severity × impact × recurrence)

---

## 9. Deep dive: Reports — actionable & visual

### Current state

- Manual generate from `/dashboard/reports`
- Types: Full PDF, Executive PDF, Issues CSV — **single scan, single site**
- pdf-lib text layout; 15 issues/category cap
- Broken links PDF exists but not in Reports center
- No charts, branding, or trends

### What developers and agencies actually need

| Need | Current | Target |
|------|---------|--------|
| Show client progress | Single snapshot | Trend over 4–12 weeks |
| Prioritize fixes | Flat issue list | Top 10 by impact score |
| Share externally | Plain PDF | Branded, visual report |
| Compare to last scan | Executive only (delta) | Every section shows Δ |
| Broken links | Separate tool | Unified health report |
| Recurring delivery | None | Scheduled email to client |

### Proposed report types

1. **Health dashboard (in-app)** — Default landing after audit; not a separate "generate" step.
2. **Executive PDF** — 1–2 pages: scores, deltas, top 5 fixes, sparklines.
3. **Technical PDF** — Full findings, vitals, headers, grouped by category with fix steps.
4. **Trend report** — Multi-scan charts (reuse `ScoreChart`).
5. **Portfolio report** — All sites, ranked by health, critical counts.
6. **Broken links appendix** — Integrated from existing generator.

### Visual & content recommendations

- **Score gauges** in PDF (render from same component logic or SVG).
- **Category breakdown** bar chart.
- **Core Web Vitals** traffic-light cards matching overview UI.
- **AI insights block** (Phase 2) — "Your LCP regressed 40% — likely caused by new hero image; check …" using scan diff + issue metadata. Gate behind Pro+.
- **Remediation checklist** — Checkbox list developers can paste into tickets.
- **No silent truncation** — "Showing 50 of 127 issues — full list in CSV appendix."

### Architecture

- `Report` model: add `generatedById`, `config Json` (categories, date range), `version`, relation to `Scan[]` for multi-scan.
- Generation: HTML template → Puppeteer PDF (reuse browser infra) OR React-PDF.
- Storage: keep Cloudinary but add direct download fallback.

---

## 10. Prioritized implementation roadmap

Phases are sequential within priority bands. **Do not skip P0** — it blocks revenue and trust.

### P0 — Trust & revenue foundation (4–6 weeks)

| # | Item | Outcome |
|---|------|---------|
| P0.1 | `getEntitlements(userId)` + enforce in `addWebsiteAction`, `startScanAction`, execute routes | Real plan limits |
| P0.2 | Stripe Elements + webhooks (per `BILLING.md`) | Can charge |
| P0.3 | Billing settings read real `Subscription` | Settings tell the truth |
| P0.4 | Persist `triggerRunId` on `Scan`; cancel via `runs.cancel()` | Stop actually stops |
| P0.5 | Cooperative cancel checks between audit phases | Faster stop response |
| P0.6 | Global stale-scan reaper (scheduled task) | No stuck "Running" forever |
| P0.7 | Transactional `completeAuditScan` | No false failures |
| P0.8 | Rate limit audit execute endpoint | Abuse protection |

### P1 — Core monitoring promise (4–6 weeks)

| # | Item | Outcome |
|---|------|---------|
| P1.1 | `Scan.phase`, `statusMessage`, `progressPercent` + runner updates | Real progress |
| P1.2 | Audit progress panel + fix post-complete UI sync | Professional audit UX |
| P1.3 | Scheduler: `nextScanAt`, timezone, time-of-day + Trigger cron | Automation works |
| P1.4 | Custom schedule UI (day/time/timezone) | User control |
| P1.5 | Always queue audits (no inline 300s request) | Reliable execution |
| P1.6 | Scan history page + clickable past scans | Useful history |
| P1.7 | Email: audit complete + critical issues | Basic alerting |

### P2 — Link crawler & findings (6–8 weeks)

| # | Item | Outcome |
|---|------|---------|
| P2.1 | Hybrid crawler (static + Puppeteer render mode) | Catches SPA links |
| P2.2 | Persist `BrokenLinkResult` | Link history |
| P2.3 | Crawl limits + throttled progress | Scale & stability |
| P2.4 | `Finding` model + migration from `Issue` | Durable triage |
| P2.5 | Findings Command Center (new/regressed/resolved views) | Issues center valuable |
| P2.6 | Mute replaces dismiss; notes + assignee | Real workflow |

### P3 — Reports & intelligence (4–6 weeks)

| # | Item | Outcome |
|---|------|---------|
| P3.1 | In-app health dashboard (post-audit default) | Actionable home |
| P3.2 | Visual PDF (HTML→PDF) with charts + branding | Agency-ready |
| P3.3 | Trend + portfolio reports | Prove value over time |
| P3.4 | Broken links in unified report | Complete picture |
| P3.5 | Scheduled report email | Passive value |
| P3.6 | AI insight summaries (optional, Pro+) | Differentiation |

### P4 — Scale & polish (ongoing)

| # | Item |
|---|------|
| P4.1 | Vitest coverage for scanners + entitlements |
| P4.2 | CI pipeline |
| P4.3 | Uptime monitoring (ping) |
| P4.4 | CI API / webhooks for audits |
| P4.5 | OAuth providers |
| P4.6 | Audit screenshots |
| P4.7 | Rename "Lighthouse" copy to accurate lab metrics OR integrate real Lighthouse |

---

## 11. Success metrics

| Metric | Target (90 days post-P1) |
|--------|--------------------------|
| Audit cancel stops run within 30s | 95% |
| Scheduled scans fire on time (±15 min) | 99% |
| Stuck RUNNING scans > 1 hour | 0 |
| Trial → paid conversion | Baseline + measure |
| Issues acknowledged still acknowledged after re-scan | 100% |
| Report generation NPS (survey) | ≥ 40 |
| Time to first actionable fix (user study) | < 5 min from dashboard |

---

## 12. What NOT to do

1. **Do not** add more UI polish to features that lie about behavior (scheduling, billing, cancel).
2. **Do not** move the link crawler to Trigger.dev (explicit product constraint).
3. **Do not** build a second issue inbox — redesign around findings and change detection.
4. **Do not** ship AI insights before durable findings and trends exist (garbage in → garbage out).
5. **Do not** implement everything in this document at once — follow phased roadmap with explicit approval gates.

---

## 13. Approval gates before implementation

| Phase | Approval required |
|-------|-------------------|
| P0 | Founder sign-off on Stripe + entitlement matrix |
| P1 | UX review of progress panel + schedule settings mockups |
| P2 | Data migration plan for `Finding` model reviewed |
| P3 | Report template design approval (agency persona) |

---

## Appendix: Key file reference

| Area | Files |
|------|-------|
| Audit dispatch | `src/lib/audit-dispatch.ts`, `src/trigger/run-audit.ts` |
| Audit runner | `src/lib/scanner/audit-runner.ts`, `complete-audit-scan.ts` |
| Scan actions | `src/actions/scans.ts`, `src/hooks/use-audit-scan.ts` |
| Link crawler | `src/lib/scanner/broken-link-runner.ts`, `src/app/api/broken-links/[scanId]/execute/route.ts` |
| Issues | `src/lib/issue-service.ts`, `src/components/issues/issue-center-client.tsx` |
| Reports | `src/lib/report-service.ts`, `src/lib/reports/generate-pdf.ts` |
| Billing | `src/lib/subscription.ts`, `BILLING.md` |
| Schema | `prisma/schema.prisma` |
| Progress truth | `PROGRESS.md` |

---

*This document should be updated when phases ship or scope changes. Implementation work begins only after phase approval.*
