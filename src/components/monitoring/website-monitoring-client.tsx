"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Shield,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  disableMonitorAction,
  pauseMonitorAction,
  runMonitorNowAction,
  upsertMonitorAction,
} from "@/actions/uptime";
import {
  formatIncidentDuration,
  formatInterval,
  formatLatency,
  formatUptimePct,
  monitorStatusClass,
  monitorStatusLabel,
} from "@/lib/uptime/format";
import { UPTIME_INTERVAL_OPTIONS } from "@/lib/uptime/constants";
import { LatencySparkline } from "@/components/monitoring/latency-sparkline";
import { toast } from "@/lib/toast";
import { cn, formatDateTime } from "@/lib/utils";
import type { KeywordMatchMode, MonitorHttpMethod } from "@prisma/client";

export type MonitorDetail = {
  id: string;
  enabled: boolean;
  paused: boolean;
  url: string;
  method: MonitorHttpMethod;
  expectedStatusMin: number;
  expectedStatusMax: number;
  intervalSeconds: number;
  timeoutMs: number;
  followRedirects: boolean;
  keyword: string | null;
  keywordMode: KeywordMatchMode;
  alertEmail: boolean;
  alertOnRecovery: boolean;
  failureThreshold: number;
  slowThresholdMs: number | null;
  checkSsl: boolean;
  sslWarnDays: number;
  lastStatus: string;
  lastLatencyMs: number | null;
  lastHttpStatus: number | null;
  lastError: string | null;
  lastCheckedAt: string | null;
  nextCheckAt: string | null;
  uptimePercent24h: number | null;
  uptimePercent7d: number | null;
  uptimePercent30d: number | null;
  avgLatency24h: number | null;
  sslDaysRemaining: number | null;
  sslExpiresAt: string | null;
  consecutiveFailures: number;
};

export type CheckRow = {
  id: string;
  result: string;
  httpStatus: number | null;
  latencyMs: number | null;
  errorMessage: string | null;
  checkedAt: string;
};

export type IncidentRow = {
  id: string;
  kind: string;
  startedAt: string;
  resolvedAt: string | null;
  failCount: number;
  lastError: string | null;
  lastHttpStatus: number | null;
};

interface Props {
  website: { id: string; name: string; url: string };
  monitor: MonitorDetail | null;
  /** Recent mixed checks for the latency chart */
  checks: CheckRow[];
  recentSuccesses: CheckRow[];
  recentFailures: CheckRow[];
  totalCheckCount: number;
  incidents: IncidentRow[];
  minIntervalSeconds: number;
  canUseMonitoring: boolean;
  alertEmailTo: string | null;
}

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();

  // Future (e.g. next check)
  if (diff < 0) {
    const sec = Math.floor(-diff / 1000);
    if (sec < 5) return "Just now";
    if (sec < 60) return `in ${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `in ${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `in ${hr}h`;
    return formatDateTime(date);
  }

  // Past — relative for the first 24 hours, then a clear date + time
  const sec = Math.floor(diff / 1000);
  if (sec < 5) return "Just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return formatDateTime(date);
}

/** Next-check label: overdue times read clearly instead of "1h ago". */
function formatNextCheck(iso: string | null | undefined): string {
  if (!iso) return "—";
  const due = new Date(iso).getTime();
  const diff = due - Date.now();
  if (diff <= 0) {
    const overdueSec = Math.floor(-diff / 1000);
    if (overdueSec < 60) return "Overdue";
    const min = Math.floor(overdueSec / 60);
    if (min < 60) return `Overdue by ${min}m`;
    return `Overdue by ${Math.floor(min / 60)}h`;
  }
  return formatRelativeTime(iso);
}

export function WebsiteMonitoringClient({
  website,
  monitor,
  checks,
  recentSuccesses,
  recentFailures,
  totalCheckCount,
  incidents,
  minIntervalSeconds,
  canUseMonitoring,
  alertEmailTo,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState("overview");

  const [enabled, setEnabled] = useState(monitor?.enabled ?? true);
  const [url, setUrl] = useState(monitor?.url ?? website.url);
  const [method, setMethod] = useState<MonitorHttpMethod>(monitor?.method ?? "GET");
  const [intervalSeconds, setIntervalSeconds] = useState(
    monitor?.intervalSeconds ?? Math.max(900, minIntervalSeconds)
  );
  const [expectedMin, setExpectedMin] = useState(monitor?.expectedStatusMin ?? 200);
  const [expectedMax, setExpectedMax] = useState(monitor?.expectedStatusMax ?? 399);
  const [failureThreshold, setFailureThreshold] = useState(monitor?.failureThreshold ?? 2);
  const [slowThresholdMs, setSlowThresholdMs] = useState(
    monitor?.slowThresholdMs?.toString() ?? ""
  );
  const [keyword, setKeyword] = useState(monitor?.keyword ?? "");
  const [keywordMode, setKeywordMode] = useState<KeywordMatchMode>(
    monitor?.keywordMode ?? "NONE"
  );
  const [alertEmail, setAlertEmail] = useState(monitor?.alertEmail ?? true);
  const [alertOnRecovery, setAlertOnRecovery] = useState(monitor?.alertOnRecovery ?? true);
  const [checkSsl, setCheckSsl] = useState(monitor?.checkSsl ?? true);
  const [sslWarnDays, setSslWarnDays] = useState(monitor?.sslWarnDays ?? 14);

  const allowedIntervals = useMemo(
    () => UPTIME_INTERVAL_OPTIONS.filter((o) => o.seconds >= minIntervalSeconds),
    [minIntervalSeconds]
  );
  const intervalLabel =
    allowedIntervals.find((o) => o.seconds === intervalSeconds)?.label ??
    formatInterval(intervalSeconds);

  const latencySeries = useMemo(
    () =>
      [...checks]
        .reverse()
        .slice(-60)
        .map((c) => ({
          id: c.id,
          up: c.result === "UP" || c.result === "DEGRADED",
          latencyMs: c.latencyMs,
          checkedAt: c.checkedAt,
        })),
    [checks]
  );

  const status = monitor
    ? monitor.paused || !monitor.enabled
      ? "PAUSED"
      : monitor.lastStatus
    : "UNKNOWN";

  const isDown = status === "DOWN";
  const isDegraded = status === "DEGRADED";
  const openIncidents = incidents.filter((i) => !i.resolvedAt);
  const monitorUrl = monitor?.url ?? website.url;

  function save() {
    startTransition(async () => {
      const result = await upsertMonitorAction({
        websiteId: website.id,
        enabled,
        paused: monitor?.paused ?? false,
        url,
        method: keywordMode !== "NONE" ? "GET" : method,
        expectedStatusMin: expectedMin,
        expectedStatusMax: expectedMax,
        intervalSeconds,
        timeoutMs: monitor?.timeoutMs ?? 10000,
        followRedirects: true,
        keyword: keywordMode === "NONE" ? null : keyword,
        keywordMode,
        alertEmail,
        alertOnRecovery,
        failureThreshold,
        slowThresholdMs: slowThresholdMs.trim() ? Number(slowThresholdMs) : null,
        checkSsl,
        sslWarnDays,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Settings saved.");
      router.refresh();
    });
  }

  function runNow() {
    if (monitor?.paused) {
      toast.error("Monitoring is paused. Resume it first, then run a check.");
      return;
    }
    if (monitor && !monitor.enabled) {
      toast.error("Monitoring is disabled. Enable it in Settings to run a check.");
      return;
    }

    startTransition(async () => {
      const result = await runMonitorNowAction(website.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const down = result.result === "DOWN" || result.result === "ERROR";
      const text = down
        ? `Check finished: ${result.result}${
            result.latencyMs > 0 ? ` in ${result.latencyMs} ms` : ""
          }`
        : `Check finished: ${result.result} in ${result.latencyMs} ms`;
      if (down) toast.error(text);
      else toast.success(text);
      router.refresh();
    });
  }

  function togglePause() {
    if (!monitor) return;
    startTransition(async () => {
      const result = await pauseMonitorAction(website.id, !monitor.paused);
      if (!result.success) toast.error(result.error);
      else {
        toast.success(monitor.paused ? "Monitoring resumed." : "Monitoring paused.");
        router.refresh();
      }
    });
  }

  function turnOff() {
    startTransition(async () => {
      const result = await disableMonitorAction(website.id);
      if (!result.success) toast.error(result.error);
      else {
        setEnabled(false);
        toast.success("Monitor disabled.");
        router.refresh();
      }
    });
  }

  return (
    <div className="w-full max-w-6xl space-y-8 pb-12">
      {/* Page header — status + identity + actions */}
      <header className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusDot status={status} />
              <Badge
                variant="outline"
                className={cn("text-[11px]", monitorStatusClass(status))}
              >
                {monitorStatusLabel(status)}
              </Badge>
              {openIncidents.length > 0 ? (
                <Badge
                  variant="outline"
                  className="border-rose-500/25 bg-rose-500/10 text-[11px] text-rose-400"
                >
                  {openIncidents.length} open incident
                  {openIncidents.length === 1 ? "" : "s"}
                </Badge>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
                {website.name}
              </h1>
              <a
                href={monitorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="truncate">{monitorUrl.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              onClick={runNow}
              disabled={
                pending ||
                !canUseMonitoring ||
                Boolean(monitor?.paused) ||
                Boolean(monitor && !monitor.enabled)
              }
              size="sm"
              title={
                monitor?.paused
                  ? "Resume monitoring to run a check"
                  : monitor && !monitor.enabled
                    ? "Enable monitoring in Settings to run a check"
                    : undefined
              }
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Run check
            </Button>
            {monitor?.enabled ? (
              <Button variant="outline" onClick={togglePause} disabled={pending} size="sm">
                {monitor.paused ? (
                  <Play className="h-3.5 w-3.5" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
                {monitor.paused ? "Resume" : "Pause"}
              </Button>
            ) : null}
          </div>
        </div>

        {isDown && monitor?.lastError ? (
          <div className="flex gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-rose-300">Monitor is down</p>
              <p className="text-sm text-rose-300/80">{monitor.lastError}</p>
            </div>
          </div>
        ) : isDegraded && monitor?.lastError ? (
          <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-300/90">{monitor.lastError}</p>
          </div>
        ) : null}

        {/* Operational context — secondary, scannable */}
        <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <MetaItem
            label="Last check"
            value={formatRelativeTime(monitor?.lastCheckedAt)}
            title={
              monitor?.lastCheckedAt
                ? new Date(monitor.lastCheckedAt).toLocaleString()
                : undefined
            }
          />
          <MetaItem
            label="Response"
            value={
              monitor?.lastLatencyMs != null
                ? `${formatLatency(monitor.lastLatencyMs)}${
                    monitor.lastHttpStatus != null ? ` · ${monitor.lastHttpStatus}` : ""
                  }`
                : "—"
            }
          />
          <MetaItem
            label="Interval"
            value={
              monitor
                ? allowedIntervals.find((o) => o.seconds === monitor.intervalSeconds)?.label ??
                  formatInterval(monitor.intervalSeconds)
                : "Not set"
            }
          />
          {monitor?.nextCheckAt && !monitor.paused && monitor.enabled ? (
            <MetaItem label="Next" value={formatNextCheck(monitor.nextCheckAt)} />
          ) : null}
        </dl>
      </header>

      {/* Metrics ribbon — one surface, no card soup */}
      <section className="overflow-hidden rounded-xl border border-border/40 bg-card">
        <div className="grid grid-cols-2 divide-y divide-border/30 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
          <MetricCell
            label="Uptime 24h"
            value={formatUptimePct(monitor?.uptimePercent24h)}
          />
          <MetricCell
            label="Uptime 7d"
            value={formatUptimePct(monitor?.uptimePercent7d)}
          />
          <MetricCell
            label="Uptime 30d"
            value={formatUptimePct(monitor?.uptimePercent30d)}
          />
          <MetricCell
            label="Avg latency 24h"
            value={formatLatency(
              monitor?.avgLatency24h != null ? Math.round(monitor.avgLatency24h) : null
            )}
          />
          <MetricCell
            label="SSL certificate"
            value={
              monitor?.sslDaysRemaining != null
                ? `${monitor.sslDaysRemaining}d left`
                : "—"
            }
            hint={
              monitor?.sslExpiresAt
                ? `Expires ${new Date(monitor.sslExpiresAt).toLocaleDateString()}`
                : undefined
            }
            tone={
              monitor?.sslDaysRemaining == null
                ? "muted"
                : monitor.sslDaysRemaining <= 14
                  ? "warn"
                  : "good"
            }
            icon={<Shield className="h-3.5 w-3.5" />}
          />
        </div>
      </section>

      {/* Progressive disclosure via tabs */}
      <Tabs value={tab} onValueChange={setTab} className="flex w-full flex-col gap-6">
        <div className="w-full border-b border-border/40">
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-0 overflow-visible rounded-none bg-transparent p-0"
          >
            <TabsTrigger
              value="overview"
              className="flex-none rounded-none px-4 pb-3 pt-1"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="checks"
              className="flex-none rounded-none px-4 pb-3 pt-1"
            >
              Checks
            </TabsTrigger>
            <TabsTrigger
              value="incidents"
              className="flex-none rounded-none px-4 pb-3 pt-1"
            >
              Incidents
              {openIncidents.length > 0 ? (
                <span className="ml-1.5 tabular-nums text-rose-400">
                  {openIncidents.length}
                </span>
              ) : incidents.length > 0 ? (
                <span className="ml-1.5 text-muted-foreground tabular-nums">
                  {incidents.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex-none rounded-none px-4 pb-3 pt-1"
            >
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 w-full outline-none">
          <section className="rounded-xl border border-border/40 bg-card">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/30 px-5 py-4">
              <div>
                <h2 className="text-sm font-medium">Response time</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Latency across recent probes
                </p>
              </div>
            </div>
            <div className="p-4 md:p-5">
              <LatencySparkline points={latencySeries} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="checks" className="mt-0 w-full outline-none">
          <div className="space-y-6">
            {totalCheckCount === 0 ? (
              <section className="overflow-hidden rounded-xl border border-border/40 bg-card">
                <div className="border-b border-border/30 px-5 py-4">
                  <h2 className="text-sm font-medium">Check history</h2>
                </div>
                <EmptyState>
                  No checks yet. Use <span className="text-foreground">Run check</span> or wait
                  for the schedule.
                </EmptyState>
              </section>
            ) : (
              <>
                <CheckHistorySection
                  title="Recent successes"
                  description="Latest probes that came back up"
                  empty="No successful checks yet."
                  rows={recentSuccesses}
                  countLabel={
                    totalCheckCount > 0
                      ? `${totalCheckCount.toLocaleString()} total`
                      : undefined
                  }
                />
                {recentFailures.length > 0 ? (
                  <CheckHistorySection
                    title="Recent failures"
                    description="Latest down or error probes"
                    empty="No failed checks."
                    rows={recentFailures}
                  />
                ) : null}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="mt-0 w-full outline-none">
          <section className="overflow-hidden rounded-xl border border-border/40 bg-card">
            <div className="border-b border-border/30 px-5 py-4">
              <h2 className="text-sm font-medium">Incidents</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Outages confirmed after the failure threshold
              </p>
            </div>
            {incidents.length === 0 ? (
              <EmptyState>
                No incidents yet. That&apos;s a good sign.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-border/25">
                {incidents.map((i) => (
                  <li key={i.id} className="flex gap-4 px-5 py-4">
                    <div
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        i.resolvedAt ? "bg-muted-foreground/40" : "bg-rose-400"
                      )}
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {i.resolvedAt ? "Resolved" : "Ongoing"}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {i.kind}
                          </span>
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatIncidentDuration(i.startedAt, i.resolvedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Started {new Date(i.startedAt).toLocaleString()}
                        {i.resolvedAt
                          ? ` · Ended ${new Date(i.resolvedAt).toLocaleString()}`
                          : ""}
                      </p>
                      {i.lastError ? (
                        <p className="text-xs leading-relaxed text-foreground/75">
                          {i.lastError}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="settings" className="mt-0 w-full outline-none">
          <div className="space-y-6">
            <SettingsSection
              title="Monitoring"
              description="Turn checks on or off for this website"
            >
              <ToggleRow
                title="Enable monitoring"
                description="Run scheduled uptime checks for this URL"
                checked={enabled}
                onChange={setEnabled}
              />
            </SettingsSection>

            <SettingsSection
              title="Probe"
              description="What we request and how often"
            >
              <div className="space-y-4">
                <Field label="URL to check">
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="HTTP method">
                    <Select
                      value={method}
                      onValueChange={(v) => v && setMethod(v as MonitorHttpMethod)}
                      disabled={keywordMode !== "NONE"}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder={method} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET — recommended</SelectItem>
                        <SelectItem value="HEAD">HEAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Check interval">
                    <Select
                      value={String(intervalSeconds)}
                      onValueChange={(v) => v && setIntervalSeconds(Number(v))}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder={intervalLabel}>
                          {intervalLabel}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {allowedIntervals.map((o) => (
                          <SelectItem key={o.seconds} value={String(o.seconds)}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Accept status from">
                    <Input
                      type="number"
                      value={expectedMin}
                      onChange={(e) => setExpectedMin(Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Accept status to">
                    <Input
                      type="number"
                      value={expectedMax}
                      onChange={(e) => setExpectedMax(Number(e.target.value))}
                    />
                  </Field>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Detection"
              description="When a check counts as failed or slow"
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Failures before incident">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={failureThreshold}
                      onChange={(e) => setFailureThreshold(Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Slow alert threshold (ms)">
                    <Input
                      type="number"
                      placeholder="Optional"
                      value={slowThresholdMs}
                      onChange={(e) => setSlowThresholdMs(e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Keyword check">
                  <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                    <Select
                      value={keywordMode}
                      onValueChange={(v) => v && setKeywordMode(v as KeywordMatchMode)}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Off</SelectItem>
                        <SelectItem value="CONTAINS">Must contain</SelectItem>
                        <SelectItem value="NOT_CONTAINS">Must not contain</SelectItem>
                      </SelectContent>
                    </Select>
                    {keywordMode !== "NONE" ? (
                      <Input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Keyword text"
                      />
                    ) : (
                      <p className="flex items-center text-xs text-muted-foreground">
                        Keyword checks force GET method
                      </p>
                    )}
                  </div>
                </Field>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Alerts"
              description={
                <>
                  Emails go to{" "}
                  <span className="font-medium text-foreground">
                    {alertEmailTo ?? "your account email"}
                  </span>
                </>
              }
            >
              <div className="space-y-1">
                <ToggleRow
                  title="Email when down"
                  checked={alertEmail}
                  onChange={setAlertEmail}
                />
                <ToggleRow
                  title="Email when recovered"
                  checked={alertOnRecovery}
                  onChange={setAlertOnRecovery}
                />
                <ToggleRow
                  title="Watch SSL expiry"
                  checked={checkSsl}
                  onChange={setCheckSsl}
                />
                {checkSsl ? (
                  <div className="border-t border-border/25 pt-4">
                    <Field label="Warn this many days before expiry">
                      <Input
                        type="number"
                        className="max-w-[160px]"
                        value={sslWarnDays}
                        onChange={(e) => setSslWarnDays(Number(e.target.value))}
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            </SettingsSection>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/30 pt-5">
              <Button onClick={save} disabled={pending || !canUseMonitoring}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save settings
              </Button>
              {monitor?.enabled ? (
                <Button variant="outline" onClick={turnOff} disabled={pending}>
                  Disable monitor
                </Button>
              ) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "relative flex h-2.5 w-2.5",
        status === "UP" && "text-emerald-400",
        status === "DOWN" && "text-rose-400",
        status === "DEGRADED" && "text-amber-400",
        status !== "UP" &&
          status !== "DOWN" &&
          status !== "DEGRADED" &&
          "text-muted-foreground"
      )}
      aria-hidden
    >
      {(status === "DOWN" || status === "DEGRADED") && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-30" />
      )}
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
    </span>
  );
}

function MetaItem({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5" title={title}>
      <dt className="text-muted-foreground/70">{label}</dt>
      <dd className="font-medium text-foreground/90">{value}</dd>
    </div>
  );
}

function MetricCell({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "muted";
  icon?: React.ReactNode;
}) {
  const valueClass =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-foreground";

  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 flex items-center gap-1.5 text-xl font-semibold tabular-nums tracking-tight",
          valueClass
        )}
      >
        {icon}
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/40 bg-card">
      <div className="border-b border-border/30 px-5 py-4">
        <h2 className="text-sm font-medium">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function CheckHistorySection({
  title,
  description,
  empty,
  rows,
  countLabel,
}: {
  title: string;
  description: string;
  empty: string;
  rows: CheckRow[];
  countLabel?: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/40 bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border/30 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {countLabel ? (
          <span className="shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
            {countLabel}
          </span>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Result</th>
                <th className="px-5 py-3 font-medium">HTTP</th>
                <th className="px-5 py-3 font-medium">Latency</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/20 last:border-0 hover:bg-secondary/10"
                >
                  <td className="px-5 py-3">
                    <ResultPill result={c.result} />
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">
                    {c.httpStatus ?? "—"}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">
                    {formatLatency(c.latencyMs)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                    <span title={formatDateTime(c.checkedAt)}>
                      {formatRelativeTime(c.checkedAt)}
                    </span>
                  </td>
                  <td className="max-w-[280px] truncate px-5 py-3 text-muted-foreground">
                    {c.errorMessage ?? "OK"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <CheckCircle2 className="mb-3 h-5 w-5 text-muted-foreground/50" />
      <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function ResultPill({ result }: { result: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium",
        result === "UP" && "border-emerald-500/25 text-emerald-400",
        result === "DEGRADED" && "border-amber-500/25 text-amber-400",
        result !== "UP" &&
          result !== "DEGRADED" &&
          "border-rose-500/25 text-rose-400"
      )}
    >
      {result}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
