import { prisma } from "@/lib/prisma";

export async function failBrokenLinkScan(scanId: string, errorMessage: string) {
  await prisma.brokenLinkScan.updateMany({
    where: { id: scanId, status: "RUNNING" },
    data: {
      status: "FAILED",
      phase: "failed",
      statusMessage: "Scan failed",
      errorMessage,
      completedAt: new Date(),
    },
  });
}
