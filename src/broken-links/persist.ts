import { prisma } from "@/lib/prisma";
import type { BrokenLinkFinding, BrokenLinkProgress } from "./types";

const PROGRESS_MIN_INTERVAL_MS = 600;
const RESULT_BATCH_SIZE = 40;

export function createProgressWriter(scanId: string) {
  let lastWrite = 0;
  let pending: BrokenLinkProgress | null = null;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let writing: Promise<void> = Promise.resolve();

  const writeNow = async (progress: BrokenLinkProgress) => {
    lastWrite = Date.now();
    await prisma.brokenLinkScan.update({
      where: { id: scanId },
      data: {
        status: "RUNNING",
        phase: progress.phase,
        statusMessage: progress.statusMessage,
        pagesDiscovered: progress.pagesDiscovered,
        pagesCrawled: progress.pagesCrawled,
        linksFound: progress.linksFound,
        linksChecked: progress.linksChecked,
        brokenCount: progress.brokenCount,
        progressPercent: progress.progressPercent,
      },
    });
  };

  const schedule = (progress: BrokenLinkProgress) => {
    pending = progress;
    const elapsed = Date.now() - lastWrite;
    if (elapsed >= PROGRESS_MIN_INTERVAL_MS) {
      const snapshot = pending;
      pending = null;
      writing = writing.then(() => writeNow(snapshot));
      return writing;
    }

    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        if (!pending) return;
        const snapshot = pending;
        pending = null;
        writing = writing.then(() => writeNow(snapshot));
      }, PROGRESS_MIN_INTERVAL_MS - elapsed);
    }

    return writing;
  };

  return {
    update: (progress: BrokenLinkProgress) => schedule(progress),
    flush: async () => {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      await writing;
      if (pending) {
        const snapshot = pending;
        pending = null;
        await writeNow(snapshot);
      }
    },
  };
}

export function createResultPersister(scanId: string) {
  let buffer: BrokenLinkFinding[] = [];
  let flushing: Promise<void> = Promise.resolve();

  const flushBuffer = async (items: BrokenLinkFinding[]) => {
    if (items.length === 0) return;
    await prisma.brokenLinkResult.createMany({
      data: items.map((f) => ({
        scanId,
        href: f.href,
        sourcePageUrl: f.sourcePageUrl,
        statusCode: f.statusCode,
        errorMessage: f.errorMessage,
        elementTag: f.elementTag,
        elementId: f.elementId ?? null,
        elementClass: f.elementClass ?? null,
        elementText: f.elementText ?? null,
        selector: f.selector,
        attribute: f.attribute,
        severity: f.severity,
      })),
    });
  };

  return {
    push: (findings: BrokenLinkFinding[]) => {
      if (findings.length === 0) return;
      buffer.push(...findings);
      if (buffer.length >= RESULT_BATCH_SIZE) {
        const batch = buffer;
        buffer = [];
        flushing = flushing.then(() => flushBuffer(batch));
      }
    },
    flush: async () => {
      await flushing;
      const remaining = buffer;
      buffer = [];
      await flushBuffer(remaining);
    },
  };
}

export async function loadBrokenLinkResults(scanId: string) {
  return prisma.brokenLinkResult.findMany({
    where: { scanId },
    orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
  });
}
