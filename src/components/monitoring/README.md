  # Website Monitoring

  Short guide to how uptime monitoring works in Health Mesh.

  ## What it does

  Each website can have one monitor. On a schedule (or when you click **Run check**), we:

  1. Request the configured URL
  2. Decide if the result is **UP**, **DOWN**, or **DEGRADED**
  3. Store the check, update uptime/latency stats
  4. Open/resolve incidents and send emails when configured

**Hub:** `/dashboard/monitoring` (all sites)  
**Per site:** `/dashboard/websites/[id]/monitoring` (under that website, not a separate details tree)

  ---

  ## When settings apply

  | Action | When it takes effect |
  |---|---|
  | Click **Save settings** | Immediately stored in the DB. Trigger.dev reads these on its next minute tick. |
  | Change **check interval** (1m / 15m / 1h) | Saved `intervalSeconds` is used for every future schedule. Next run is recalculated from the last check using the new interval (or ASAP if that time is already past). |
  | **Pause / Resume** | Immediate. Pause sets `paused=true` and clears `nextCheckAt`. Trigger still wakes every minute, but **this monitor is skipped** — no probe, no emails. Resume schedules the next check immediately. |
  | **Disable monitor** | Immediate. Clears schedule; no Trigger executions for that monitor until re-enabled. |
  | **Run check** | Uses whatever is already saved — unsaved form changes are ignored. Blocked while paused/disabled. |

  Changing fields in the form does nothing until you save.

  ### How Trigger.dev fits in

  The Trigger task is a **1-minute heartbeat**, not a per-monitor job. Each tick only runs monitors where:

  `enabled = true` AND `paused = false` AND (`nextCheckAt` is null or due)

  So pausing never “cancels Trigger” globally — it correctly stops **your** monitor from being selected.

  ---

  ## Settings explained

  ### Monitoring
  - **Enable monitoring** — Master switch. Off = no scheduled checks.

  ### Probe
  - **URL to check** — Exact URL we hit (can differ from the website’s main URL).
  - **HTTP method** — `GET` (default) or `HEAD`. Keyword checks force `GET`.
  - **Check interval** — How often we probe. Plan limits:
    - Trial / Starter → 15 min or slower
    - Pro → 5 min or slower
    - Agency → 1 min or slower
  - **Accept status from / to** — HTTP status range that counts as success (default `200`–`399`).

  ### Detection
  - **Failures before incident** — Consecutive failed checks needed before an incident opens and a “down” email can fire (default `2`). One blip won’t alert if threshold is 2+.
  - **Slow alert threshold (ms)** — Optional. If the site is up but slower than this, result is **DEGRADED** and a slow alert can be sent.
  - **Keyword check**
    - Off — ignore body content
    - Must contain — response body must include the text
    - Must not contain — response body must not include the text

  ### Alerts
  Emails go to the account email.

  - **Email when down** — After the failure threshold is hit and an incident opens.
  - **Email when recovered** — When the site goes UP again after a down incident.
  - **Watch SSL expiry** — Periodically inspects the HTTPS certificate.
  - **Warn days before expiry** — Send SSL warning when days remaining ≤ this number.

  ---

  ## Status meanings

  | Status | Meaning |
  |---|---|
  | **UP** | Status code in range (+ keyword OK if set). |
  | **DOWN** | Request failed, bad status, or keyword failed. |
  | **DEGRADED** | Up, but slower than the slow threshold. |
  | **PAUSED** | Monitor paused or disabled. |

  ---

  ## Incidents vs checks

  - A **check** is one probe result (kept ~90 days).
  - An **incident** starts after `failureThreshold` consecutive failures, and ends when a check succeeds again.

  ---

## Manual vs scheduled

- **Run check** — Immediate probe with saved settings; updates history/stats right away.
- **Scheduled** — Trigger.dev task `uptime-checks` runs **every minute** and probes monitors whose `nextCheckAt` is due. Your check interval (1m / 5m / 15m / 1h) controls how far ahead the next run is scheduled after each probe.
- **Backup** — Vercel daily cron can still hit `/api/cron/uptime-checks` as a safety net if Trigger.dev misses a window.

### Local development

Scheduled checks need the Trigger.dev worker running (same as audits), e.g. `npx trigger.dev@latest dev` alongside `npm run dev`. Without it, only **Run check** updates the monitor.
