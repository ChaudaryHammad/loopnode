import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncTriggerRunForScan } from "@/lib/scanner/sync-trigger-run";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  let scan = await prisma.scan.findFirst({
    where: {
      id: scanId,
      website: { userId: session.user.id, deletedAt: null },
    },
    select: {
      id: true,
      status: true,
      phase: true,
      statusMessage: true,
      progressPercent: true,
      overallScore: true,
      performanceScore: true,
      accessibilityScore: true,
      seoScore: true,
      securityScore: true,
      fcp: true,
      lcp: true,
      cls: true,
      inp: true,
      tbt: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      triggerRunId: true,
      _count: { select: { issues: true } },
      issues: {
        where: { severity: "CRITICAL" },
        select: { id: true },
      },
    },
  });

  if (!scan) {
    return NextResponse.json({ success: false, error: "Scan not found." }, { status: 404 });
  }

  if (scan.status === "RUNNING" && scan.triggerRunId) {
    await syncTriggerRunForScan(scanId);
    scan = await prisma.scan.findFirst({
      where: {
        id: scanId,
        website: { userId: session.user.id, deletedAt: null },
      },
      select: {
        id: true,
        status: true,
        phase: true,
        statusMessage: true,
        progressPercent: true,
        overallScore: true,
        performanceScore: true,
        accessibilityScore: true,
        seoScore: true,
        securityScore: true,
        fcp: true,
        lcp: true,
        cls: true,
        inp: true,
        tbt: true,
        errorMessage: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        triggerRunId: true,
        _count: { select: { issues: true } },
        issues: {
          where: { severity: "CRITICAL" },
          select: { id: true },
        },
      },
    });
  }

  if (!scan) {
    return NextResponse.json({ success: false, error: "Scan not found." }, { status: 404 });
  }

  const { _count, issues, triggerRunId: _triggerRunId, ...rest } = scan;

  return NextResponse.json(
    {
      success: true,
      data: {
        ...rest,
        issueCount: _count.issues,
        criticalCount: issues.length,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
