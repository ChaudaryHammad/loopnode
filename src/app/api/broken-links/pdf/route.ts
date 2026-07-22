import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import {
  generateBrokenLinksPdf,
  prepareBrokenLinksPdfGroups,
  type BrokenLinkFinding,
} from "@/lib/reports/generate-broken-links-pdf";
import { ALL_LINK_RESOURCE_TYPES } from "@/lib/scanner/link-resource-types";
import { z } from "zod";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  scanId: z.string().min(1),
  websiteId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const entitlements = await getEntitlements(session.user.id);
  if (!entitlements.canGenerateReports) {
    return NextResponse.json(
      {
        error:
          "Report generation requires a Pro or Agency plan. Upgrade in Billing settings.",
      },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid report data." },
      { status: 400 }
    );
  }

  const scan = await prisma.brokenLinkScan.findFirst({
    where: {
      id: parsed.data.scanId,
      websiteId: parsed.data.websiteId,
      website: { userId: session.user.id, deletedAt: null },
    },
    include: {
      website: { select: { id: true, name: true, url: true } },
      results: {
        orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  }

  if (scan.status !== "COMPLETED" && scan.phase !== "cancelled") {
    return NextResponse.json(
      { error: "Finish a check before generating a report." },
      { status: 409 }
    );
  }

  const rawFindings: BrokenLinkFinding[] = scan.results.map((r) => ({
    href: r.href,
    sourcePageUrl: r.sourcePageUrl,
    statusCode: r.statusCode,
    errorMessage: r.errorMessage,
    elementTag: r.elementTag,
    elementId: r.elementId,
    elementClass: r.elementClass,
    elementText: r.elementText,
    selector: r.selector,
    attribute: r.attribute,
    severity: r.severity,
  }));

  const prepared = prepareBrokenLinksPdfGroups(rawFindings);
  const uniqueBroken = Math.max(scan.brokenCount, prepared.totalUnique);

  try {
    const buffer = await generateBrokenLinksPdf({
      websiteName: scan.website.name,
      websiteUrl: scan.website.url,
      mode: scan.mode,
      resourceTypes: [...ALL_LINK_RESOURCE_TYPES],
      completedAt: scan.completedAt?.toISOString() ?? null,
      pagesCrawled: scan.pagesCrawled,
      linksChecked: scan.linksChecked,
      brokenCount: uniqueBroken,
      occurrenceCount: prepared.totalOccurrences,
      groups: prepared.groups,
      findingsTruncated: prepared.truncated,
      totalBrokenUnique: uniqueBroken,
    });

    const dateLabel = (scan.completedAt ?? new Date()).toISOString().slice(0, 10);
    const safeName = scan.website.name.replace(/[<>:"/\\|?*]/g, "-").slice(0, 60);
    const filename = `coverage-${safeName}-${dateLabel}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Broken links PDF API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
