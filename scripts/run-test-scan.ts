/**
 * One-off verification: run a real audit scan end-to-end (local mode).
 * Run: npx tsx scripts/run-test-scan.ts [websiteId] [desktop|mobile]
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { completeAuditScan } = await import("../src/lib/scanner/complete-audit-scan");
  const { updateScanProgress } = await import("../src/lib/scanner/audit-scan-control");

  const websiteId = process.argv[2] ?? "cmrovr3t6000004jjix414e04";
  const device = process.argv[3] === "mobile" ? "mobile" : "desktop";

  const website = await prisma.website.findFirst({
    where: { id: websiteId },
    select: { id: true, name: true, url: true, userId: true },
  });
  if (!website) {
    throw new Error(`Website ${websiteId} not found`);
  }
  console.log(`Target: ${website.name} (${website.url})`);

  const scan = await prisma.scan.create({
    data: {
      websiteId: website.id,
      status: "RUNNING",
      phase: "initializing",
      statusMessage: "Test scan started by verification script",
      progressPercent: 1,
      startedAt: new Date(),
      device,
    },
  });
  console.log(`Created scan ${scan.id} (${device}), running audit engine...`);

  const started = Date.now();
  try {
    await updateScanProgress(scan.id, "initializing", { url: website.url });
    const completed = await completeAuditScan(scan.id, website);
    const elapsed = Math.round((Date.now() - started) / 1000);

    console.log(`\n=== SCAN COMPLETED in ${elapsed}s ===`);
    console.log(`Overall: ${completed.overallScore}`);
    console.log(`Performance: ${completed.performanceScore}`);
    console.log(`Accessibility: ${completed.accessibilityScore}`);
    console.log(`SEO: ${completed.seoScore}`);
    console.log(`Security: ${completed.securityScore}`);
    console.log(`Lab engine: ${completed.labEngine}`);
    console.log(`LHR artifact: ${completed.lighthouseReportUrl ?? "(none)"}`);
    console.log(
      `Vitals: FCP=${completed.fcp}ms LCP=${completed.lcp}ms CLS=${completed.cls} TBT=${completed.tbt}ms INP=${completed.inp}`
    );

    const issues = await prisma.issue.groupBy({
      by: ["category", "severity"],
      where: { scanId: scan.id },
      _count: true,
    });
    console.log(`\nIssues by category/severity:`);
    for (const row of issues.sort((a, b) => a.category.localeCompare(b.category))) {
      console.log(`  ${row.category} ${row.severity}: ${row._count}`);
    }
    const total = issues.reduce((sum, r) => sum + r._count, 0);
    console.log(`  TOTAL: ${total}`);

    const samples = await prisma.issue.findMany({
      where: { scanId: scan.id, severity: { in: ["CRITICAL", "MAJOR"] } },
      select: { category: true, severity: true, title: true },
      take: 12,
    });
    console.log(`\nSample critical/major issues:`);
    for (const s of samples) {
      console.log(`  [${s.category}/${s.severity}] ${s.title}`);
    }
  } catch (error) {
    console.error("SCAN FAILED:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
