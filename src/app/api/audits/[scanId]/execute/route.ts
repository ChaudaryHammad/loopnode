import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchAuditScan, getAuditRunnerMode } from "@/lib/audit-dispatch";
import { failAuditScan } from "@/lib/scanner/fail-audit-scan";
import { AuditCancelledError } from "@/lib/scanner/audit-cancelled-error";

export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scan = await prisma.scan.findFirst({
    where: {
      id: scanId,
      website: { userId: session.user.id, deletedAt: null },
    },
  });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scan.status !== "RUNNING") {
    if (scan.phase === "cancelled" || scan.status === "FAILED") {
      return NextResponse.json({ success: true, cancelled: true, scanId });
    }
    return NextResponse.json({ error: "Scan is not runnable" }, { status: 409 });
  }

  try {
    const result = await dispatchAuditScan(scanId);
    const mode = getAuditRunnerMode();

    if (mode === "trigger") {
      return NextResponse.json({
        success: true,
        queued: true,
        runner: "trigger",
        runId: result.runId,
        scanId,
      });
    }

    return NextResponse.json({
      success: true,
      queued: false,
      runner: "local",
      scanId,
      overallScore: result.overallScore,
    });
  } catch (error) {
    if (error instanceof AuditCancelledError) {
      return NextResponse.json({ success: true, cancelled: true, scanId });
    }

    console.error("Audit scan error:", error);

    await failAuditScan(
      scanId,
      error instanceof Error ? error.message : "Scan failed"
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan failed" },
      { status: 500 }
    );
  }
}
