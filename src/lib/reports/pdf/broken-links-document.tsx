import { Document, Page, Text } from "@react-pdf/renderer";
import type { BrokenLinksReportInput } from "@/lib/reports/generate-broken-links-pdf";
import { formatResourceTypes } from "@/lib/scanner/link-resource-types";
import { LOOPNODE_BRAND } from "@/lib/reports/report-html-shared";
import {
  GroupedBrokenLinksFindingTable,
  PdfFooter,
  PdfHeadlineBox,
  PdfPageHeader,
  PdfTable,
  sharedStyles,
} from "@/lib/reports/pdf/components";
import { renderReactPdfToBuffer } from "@/lib/reports/pdf/render-to-buffer";

function formatCompletedDate(completedAt: string | null) {
  const date = completedAt ? new Date(completedAt) : new Date();
  return date.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
}

function BrokenLinksDocument({ input }: { input: BrokenLinksReportInput }) {
  const scanDate = formatCompletedDate(input.completedAt);
  const modeLabel = input.mode === "EXTERNAL" ? "External links" : "Internal links";
  const uniqueBroken = input.totalBrokenUnique ?? input.brokenCount;
  const occurrenceCount = input.occurrenceCount;

  const headlineItems =
    uniqueBroken > 0
      ? [
          `${uniqueBroken} broken URL${uniqueBroken === 1 ? "" : "s"} across ${input.pagesCrawled} page${input.pagesCrawled === 1 ? "" : "s"}`,
          occurrenceCount > uniqueBroken
            ? `${occurrenceCount} page occurrence${occurrenceCount === 1 ? "" : "s"}`
            : `${input.linksChecked} links checked · ${modeLabel}`,
          ...(input.findingsTruncated
            ? [
                `Showing top ${input.groups.length} of ${uniqueBroken} broken URLs in this PDF`,
              ]
            : []),
        ]
      : ["No broken links found"];

  const summaryRows = [
    { setting: "Scan mode", value: modeLabel },
    { setting: "Link types", value: formatResourceTypes(input.resourceTypes) },
    { setting: "Pages crawled", value: String(input.pagesCrawled) },
    { setting: "Links checked", value: String(input.linksChecked) },
    { setting: "Broken URLs", value: String(uniqueBroken) },
    {
      setting: "Page occurrences",
      value: String(occurrenceCount),
    },
  ];

  const groupRows = input.groups.map((group, index) => ({
    num: String(index + 1),
    sev: group.severity,
    status:
      group.statusCode !== null
        ? `HTTP ${group.statusCode}`
        : (group.errorMessage ?? "Unreachable"),
    url: group.href,
    pages: group.occurrences.map((o) => o.sourcePageUrl),
    pageCount: group.occurrences.length,
  }));

  const findingsHeading = input.findingsTruncated
    ? `Findings (top ${input.groups.length} of ${uniqueBroken})`
    : `Findings (${input.groups.length})`;

  return (
    <Document title={`Broken links — ${input.websiteName}`}>
      <Page size="A4" style={sharedStyles.page}>
        <PdfPageHeader
          websiteName={input.websiteName}
          websiteUrl={input.websiteUrl}
          scanDate={scanDate}
          subtitle="Broken links report"
        />
        <Text style={sharedStyles.h1}>Broken links report</Text>

        <PdfHeadlineBox
          title="Summary"
          items={headlineItems}
          ok={uniqueBroken === 0}
        />

        <PdfTable
          columns={[
            { key: "setting", label: "Setting", flex: 1 },
            { key: "value", label: "Value", flex: 2, wrap: true },
          ]}
          rows={summaryRows}
        />

        <Text style={sharedStyles.h2}>{findingsHeading}</Text>
        <GroupedBrokenLinksFindingTable rows={groupRows} />

        <PdfFooter
          left={`${LOOPNODE_BRAND} · loopnode.app`}
          right={input.websiteName}
        />
      </Page>
    </Document>
  );
}

export async function buildBrokenLinksPdfBuffer(input: BrokenLinksReportInput) {
  return renderReactPdfToBuffer(<BrokenLinksDocument input={input} />);
}
