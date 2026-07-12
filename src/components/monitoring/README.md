  # Website Monitoring

  Short guide to how uptime monitoring works in Loopnode.

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
  | Click **Save settings** | Immediately stored. The **next** scheduled check (or **Run check**) uses the new values. |
  | **Run check** | Uses whatever is already saved — unsaved form changes are ignored. |
  | **Pause / Resume** | Immediate. Pause skips scheduled checks until resumed. |
  | **Disable monitor** | Immediate. Stops all checks until you enable + save again. |

  Changing fields in the form does nothing until you save.

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
  - **Scheduled** — Cron picks monitors whose `nextCheckAt` is due and runs the same probe logic.
