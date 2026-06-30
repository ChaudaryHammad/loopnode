import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  dispatchBrokenLinkScan,
  getBrokenLinkRunnerMode,
} from "@/lib/broken-link-dispatch";
import { failBrokenLinkScan } from "@/lib/scanner/fail-broken-link-scan";
import { parseResourceTypes } from "@/lib/scanner/link-resource-types";
import type { BrokenLinkFinding, WwwFallbackResolution } from "@/lib/scanner/types";

export const maxDuration = 300;

function mapFindings(findings: BrokenLinkFinding[]) {
  return findings.map((f) => ({
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
  }));
}

function scanResponse(
  findings: BrokenLinkFinding[],
  wwwFallbacks: WwwFallbackResolution[] = [],
  extra?: Record<string, unknown>
) {
  return NextResponse.json({
    success: true,
    brokenCount: findings.length,
    findings: mapFindings(findings),
    wwwFallbacks,
    ...extra,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { resourceTypes?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const scan = await prisma.brokenLinkScan.findFirst({
    where: {
      id: scanId,
      website: { userId: session.user.id, deletedAt: null },
    },
  });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scan.status !== "RUNNING") {
    return NextResponse.json({ error: "Scan is not runnable" }, { status: 409 });
  }

  try {
    const resourceTypes = parseResourceTypes(body.resourceTypes);
    const result = await dispatchBrokenLinkScan(scanId, resourceTypes);
    const mode = getBrokenLinkRunnerMode();

    if (mode === "trigger") {
      return NextResponse.json({
        success: true,
        queued: true,
        runner: "trigger",
        runId: result.runId,
        scanId,
      });
    }

    return scanResponse(result.findings ?? [], result.wwwFallbacks ?? [], {
      queued: false,
      runner: "local",
      scanId,
    });
  } catch (error) {
    console.error("Broken link scan error:", error);

    await failBrokenLinkScan(
      scanId,
      error instanceof Error ? error.message : "Scan failed"
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan failed" },
      { status: 500 }
    );
  }
}
