import type { Page } from "puppeteer";
import type { ScanIssueInput } from "./types";

type PerformanceSnapshot = {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
};

function roundMetric(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function pushMetricIssue(
  issues: ScanIssueInput[],
  title: string,
  severity: ScanIssueInput["severity"],
  description: string,
  recommendation: string,
  metadata: Record<string, unknown>
) {
  issues.push({
    category: "PERFORMANCE",
    severity,
    title,
    description,
    recommendation,
    metadata,
  });
}

export async function preparePerformanceMonitoring(page: Page): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    const state = {
      fcp: null as number | null,
      lcp: null as number | null,
      cls: 0,
      inp: null as number | null,
      tbt: 0,
    };

    const update = (key: keyof typeof state, value: number) => {
      if (Number.isNaN(value)) return;
      if (key === "cls" || key === "tbt") {
        state[key] = Number((state[key] + value).toFixed(3));
        return;
      }
      state[key] = value;
    };

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            update("fcp", entry.startTime);
          }
        }
      }).observe({ type: "paint", buffered: true });
    } catch {}

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          update("lcp", entry.startTime);
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!shift.hadRecentInput) {
            update("cls", shift.value ?? 0);
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {}

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = Math.max(0, entry.duration - 50);
          update("tbt", duration);
        }
      }).observe({ type: "longtask", buffered: true });
    } catch {}

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          update("inp", entry.duration);
        }
      }).observe({ type: "event", buffered: true } as PerformanceObserverInit);
    } catch {}

    (window as Window & { __loopnodePerformance?: typeof state }).__loopnodePerformance =
      state;
  });
}

export async function runPerformanceAudit(
  page: Page,
  url: string
): Promise<{
  score: number;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
  issues: ScanIssueInput[];
}> {
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const snapshot = await page.evaluate(() => {
    const perf = (window as Window & {
      __loopnodePerformance?: PerformanceSnapshot;
    }).__loopnodePerformance;

    return {
      fcp: perf?.fcp ?? null,
      lcp: perf?.lcp ?? null,
      cls: perf?.cls ?? null,
      inp: perf?.inp ?? null,
      tbt: perf?.tbt ?? null,
    };
  });

  const issues: ScanIssueInput[] = [];

  const fcp = roundMetric(snapshot.fcp);
  const lcp = roundMetric(snapshot.lcp);
  const cls = snapshot.cls === null ? null : parseFloat(snapshot.cls.toFixed(3));
  const inp = roundMetric(snapshot.inp);
  const tbt = roundMetric(snapshot.tbt);

  let score = 100;

  if (fcp !== null) {
    if (fcp > 1800) {
      const penalty = Math.min(20, (fcp - 1800) / 150);
      score -= penalty;
      pushMetricIssue(
        issues,
        "Slow first contentful paint",
        fcp > 3000 ? "MAJOR" : "MINOR",
        `First contentful paint was ${fcp} ms.`,
        "Reduce render-blocking work, optimize critical CSS, and defer non-essential scripts.",
        { metric: "fcp", value: fcp, url }
      );
    }
  } else {
    pushMetricIssue(
      issues,
      "First contentful paint unavailable",
      "INFO",
      "The browser could not capture a first contentful paint value.",
      "This can happen on highly dynamic pages; verify the page renders real content after navigation.",
      { metric: "fcp", value: null, url }
    );
  }

  if (lcp !== null) {
    if (lcp > 2500) {
      const penalty = Math.min(30, (lcp - 2500) / 120);
      score -= penalty;
      pushMetricIssue(
        issues,
        "Largest contentful paint is slow",
        lcp > 4000 ? "CRITICAL" : "MAJOR",
        `Largest contentful paint was ${lcp} ms.`,
        "Optimize the hero element, compress images, and reduce server or script latency.",
        { metric: "lcp", value: lcp, url }
      );
    }
  } else {
    pushMetricIssue(
      issues,
      "Largest contentful paint unavailable",
      "INFO",
      "The browser could not capture a largest contentful paint value.",
      "If the page keeps updating after load, give it a moment to settle and try again.",
      { metric: "lcp", value: null, url }
    );
  }

  if (cls !== null && cls > 0.1) {
    const penalty = Math.min(20, cls * 100);
    score -= penalty;
    pushMetricIssue(
      issues,
      "Layout shift detected",
      cls > 0.25 ? "MAJOR" : "MINOR",
      `Cumulative layout shift was ${cls.toFixed(3)}.`,
      "Reserve space for images, ads, and late-loading UI so the page stays stable.",
      { metric: "cls", value: cls, url }
    );
  }

  if (inp !== null && inp > 200) {
    const penalty = Math.min(20, (inp - 200) / 100);
    score -= penalty;
    pushMetricIssue(
      issues,
      "Interaction latency is high",
      inp > 500 ? "MAJOR" : "MINOR",
      `Interaction latency was ${inp} ms.`,
      "Reduce expensive JavaScript and split up long tasks on the main thread.",
      { metric: "inp", value: inp, url }
    );
  }

  if (tbt !== null && tbt > 200) {
    const penalty = Math.min(20, (tbt - 200) / 100);
    score -= penalty;
    pushMetricIssue(
      issues,
      "Long tasks are blocking the main thread",
      tbt > 600 ? "MAJOR" : "MINOR",
      `Total blocking time was ${tbt} ms.`,
      "Break up expensive work, lazy-load non-critical code, and trim third-party scripts.",
      { metric: "tbt", value: tbt, url }
    );
  }

  return {
    score: clampScore(score),
    fcp,
    lcp,
    cls,
    inp,
    tbt,
    issues,
  };
}
