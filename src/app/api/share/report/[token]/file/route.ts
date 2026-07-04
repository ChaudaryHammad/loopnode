import { NextRequest, NextResponse } from "next/server";
import { getReportDeliveryUrl } from "@/lib/cloudinary";
import { getReportByShareToken } from "@/lib/report-service";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ token: string }>;
}

function sanitizeFilename(name: string) {
  return name.replace(/[<>:"/\\|?*\u2014\u2013]/g, "-").replace(/\s+/g, " ").trim().slice(0, 120);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { token } = await context.params;
  const disposition =
    request.nextUrl.searchParams.get("disposition") === "attachment" ? "attachment" : "inline";

  const report = await getReportByShareToken(token);
  if (!report) {
    return NextResponse.json({ error: "Report not found or sharing disabled." }, { status: 404 });
  }

  const filename = `${sanitizeFilename(report.title)}.pdf`;

  try {
    const deliveryUrl = await getReportDeliveryUrl({
      fileUrl: report.fileUrl,
      cloudinaryPublicId: report.cloudinaryPublicId,
      format: "pdf",
    });

    const fileRes = await fetch(deliveryUrl);
    if (!fileRes.ok) {
      return NextResponse.json({ error: "Could not load report file." }, { status: 502 });
    }

    const buffer = await fileRes.arrayBuffer();

    if (deliveryUrl !== report.fileUrl) {
      await prisma.report.update({
        where: { id: report.id },
        data: { fileUrl: deliveryUrl },
      });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Shared report file error:", error);
    return NextResponse.json({ error: "Failed to load report." }, { status: 500 });
  }
}
