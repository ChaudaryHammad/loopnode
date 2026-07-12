"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Shield,
  Zap,
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
import { cn } from "@/lib/utils";
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
  checks: CheckRow[];
  incidents: IncidentRow[];
  minIntervalSeconds: number;
  canUseMonitoring: boolean;
  alertEmailTo: string | null;
}

export function WebsiteMonitoringClient({
  website,
  monitor,
  checks,
  incidents,
  minIntervalSeconds,
  canUseMonitoring,
  alertEmailTo,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(monitor?.enabled ?? true);
  const [url, setUrl] = useState(monitor?.url ?? website.url);
  const [method, setMethod] = useState<MonitorHttpMethod>(monitor?.method ?? "HEAD");
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

  const latencySeries = useMemo(() => {
    return [...checks]
      .reverse()
      .slice(-48)
      .map((c) => ({
        id: c.id,
        up: c.result === "UP" || c.result === "DEGRADED",
        latencyMs: c.latencyMs,
        checkedAt: c.checkedAt,
      }));
  }, [checks]);

  function save() {
    setError(null);
    setMessage(null);
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
        setError(result.error);
        return;
      }
      setMessage("Monitor settings saved.");
      router.refresh();
    });
  }

  function runNow() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await runMonitorNowAction(website.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage(`Check complete: ${result.result} (${result.latencyMs} ms)`);
      router.refresh();
    });
  }

  function togglePause() {
    if (!monitor) return;
    startTransition(async () => {
      const result = await pauseMonitorAction(website.id, !monitor.paused);
      if (!result.success) setError(result.error);
      else router.refresh();
    });
  }

  function turnOff() {
    startTransition(async () => {
      const result = await disableMonitorAction(website.id);
      if (!result.success) setError(result.error);
      else {
        setEnabled(false);
        router.refresh();
      }
    });
  }

  const status = monitor
    ? monitor.paused || !monitor.enabled
      ? "PAUSED"
      : monitor.lastStatus
    : "UNKNOWN";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/monitoring"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Monitoring
        </Link>
        <Link
          href={`/dashboard/websites/${website.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Website overview
        </Link>
      </div>

      <section className="rounded-2xl border border-border/40 bg-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{website.name}</h1>
              <Badge variant="outline" className={cn("text-[11px]", monitorStatusClass(status))}>
                {monitorStatusLabel(status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{monitor?.url ?? website.url}</p>
            {monitor?.lastError && status === "DOWN" ? (
              <p className="text-sm text-rose-400">{monitor.lastError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={runNow} disabled={pending || !canUseMonitoring}>
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Check now
            </Button>
            {monitor?.enabled ? (
              <Button variant="outline" onClick={togglePause} disabled={pending}>
                {monitor.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {monitor.paused ? "Resume" : "Pause"}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Uptime 24h" value={formatUptimePct(monitor?.uptimePercent24h)} icon={<CheckCircle2 className="w-4 h-4" />} />
          <Stat label="Uptime 7d" value={formatUptimePct(monitor?.uptimePercent7d)} icon={<Activity className="w-4 h-4" />} />
          <Stat label="Uptime 30d" value={formatUptimePct(monitor?.uptimePercent30d)} icon={<Zap className="w-4 h-4" />} />
          <Stat
            label="Avg latency 24h"
            value={formatLatency(monitor?.avgLatency24h != null ? Math.round(monitor.avgLatency24h) : null)}
            icon={<Clock className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Meta label="Last latency" value={formatLatency(monitor?.lastLatencyMs)} />
          <Meta label="Last HTTP" value={monitor?.lastHttpStatus != null ? String(monitor.lastHttpStatus) : "—"} />
          <Meta
            label="SSL"
            value={
              monitor?.sslDaysRemaining != null
                ? `${monitor.sslDaysRemaining}d left`
                : "—"
            }
          />
          <Meta
            label="Interval"
            value={monitor ? formatInterval(monitor.intervalSeconds) : "—"}
          />
        </div>

        {latencySeries.length > 0 ? <LatencySparkline points={latencySeries} /> : null}
      </section>

      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-5 rounded-2xl border border-border/40 bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Monitor settings</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Industry-style HTTP checks with confirmation threshold, keyword, SSL, and alerts.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-secondary/10 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Enable monitoring</p>
              <p className="text-xs text-muted-foreground">Run scheduled uptime checks</p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          <Field label="Check URL">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Method">
              <Select
                value={method}
                onValueChange={(v) => {
                  if (v) setMethod(v as MonitorHttpMethod);
                }}
                disabled={keywordMode !== "NONE"}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Interval">
              <Select
                value={String(intervalSeconds)}
                onValueChange={(v) => {
                  if (v) setIntervalSeconds(Number(v));
                }}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Expected status min">
              <Input
                type="number"
                value={expectedMin}
                onChange={(e) => setExpectedMin(Number(e.target.value))}
              />
            </Field>
            <Field label="Expected status max">
              <Input
                type="number"
                value={expectedMax}
                onChange={(e) => setExpectedMax(Number(e.target.value))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Failure threshold">
              <Input
                type="number"
                min={1}
                max={5}
                value={failureThreshold}
                onChange={(e) => setFailureThreshold(Number(e.target.value))}
              />
            </Field>
            <Field label="Slow threshold (ms)">
              <Input
                type="number"
                placeholder="Optional"
                value={slowThresholdMs}
                onChange={(e) => setSlowThresholdMs(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Keyword mode">
            <Select
              value={keywordMode}
              onValueChange={(v) => {
                if (v) setKeywordMode(v as KeywordMatchMode);
              }}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Off</SelectItem>
                <SelectItem value="CONTAINS">Must contain</SelectItem>
                <SelectItem value="NOT_CONTAINS">Must not contain</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {keywordMode !== "NONE" ? (
            <Field label="Keyword">
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </Field>
          ) : null}

          <div className="space-y-2 rounded-xl border border-border/30 bg-secondary/10 p-3">
            <p className="text-xs text-muted-foreground">
              Alerts go to your account email
              {alertEmailTo ? (
                <>
                  :{" "}
                  <span className="text-foreground font-medium">{alertEmailTo}</span>
                </>
              ) : null}
              .
            </p>
            <Toggle
              label="Email on down"
              checked={alertEmail}
              onChange={setAlertEmail}
            />
            <Toggle
              label="Email on recovery"
              checked={alertOnRecovery}
              onChange={setAlertOnRecovery}
            />
            <Toggle label="Check SSL expiry" checked={checkSsl} onChange={setCheckSsl} />
            {checkSsl ? (
              <Field label="SSL warn days">
                <Input
                  type="number"
                  value={sslWarnDays}
                  onChange={(e) => setSslWarnDays(Number(e.target.value))}
                />
              </Field>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={pending || !canUseMonitoring}>
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save settings
            </Button>
            {monitor?.enabled ? (
              <Button variant="outline" onClick={turnOff} disabled={pending}>
                Disable
              </Button>
            ) : null}
          </div>
        </section>

        <div className="xl:col-span-7 space-y-6">
          <section className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent checks</h2>
              <span className="text-xs text-muted-foreground">Last {checks.length}</span>
            </div>
            {checks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No checks yet. Save settings or run a check now.</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {checks.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border/25 bg-secondary/5 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            c.result === "UP"
                              ? "text-emerald-400 border-emerald-500/25"
                              : c.result === "DEGRADED"
                                ? "text-amber-400 border-amber-500/25"
                                : "text-rose-400 border-rose-500/25"
                          )}
                        >
                          {c.result}
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {c.httpStatus ?? "—"} · {formatLatency(c.latencyMs)}
                        </span>
                      </div>
                      {c.errorMessage ? (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{c.errorMessage}</p>
                      ) : null}
                    </div>
                    <time className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(c.checkedAt).toLocaleString()}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Incidents</h2>
            </div>
            {incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No incidents recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {incidents.map((i) => (
                  <div
                    key={i.id}
                    className="rounded-xl border border-border/25 bg-secondary/5 px-3 py-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          i.resolvedAt
                            ? "text-muted-foreground"
                            : "text-rose-400 border-rose-500/25"
                        )}
                      >
                        {i.resolvedAt ? "Resolved" : "Open"} · {i.kind}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatIncidentDuration(i.startedAt, i.resolvedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(i.startedAt).toLocaleString()}
                      {i.resolvedAt ? ` → ${new Date(i.resolvedAt).toLocaleString()}` : " → ongoing"}
                    </p>
                    {i.lastError ? (
                      <p className="text-xs text-foreground/80">{i.lastError}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-secondary/10 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}
