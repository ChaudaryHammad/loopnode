import { Document, Page, Text } from "@react-pdf/renderer";
import type { BrokenLinksReportInput } from "@/lib/reports/generate-broken-links-pdf";
import { formatResourceTypes } from "@/lib/scanner/link-resource-types";
import { LOOPNODE_BRAND } from "@/lib/reports/report-html-shared";
import {
  BrokenLinksFindingTable,
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

function formatElement(finding: BrokenLinksReportInput["findings"][number]) {
  const parts = [
    finding.elementTag ? `<${finding.elementTag}>` : null,
    finding.attribute ? `[${finding.attribute}]` : null,
    finding.elementId ? `#${finding.elementId}` : null,
    finding.elementClass ? `.${finding.elementClass.split(/\s+/)[0]}` : null,
    finding.selector,
    finding.elementText ? `"${finding.elementText.slice(0, 60)}"` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "—";
}

function BrokenLinksDocument({ input }: { input: BrokenLinksReportInput }) {
  const scanDate = formatCompletedDate(input.completedAt);
  const modeLabel = input.mode === "EXTERNAL" ? "External links" : "Internal links";

  const headlineItems =
    input.brokenCount > 0
      ? [
          `${input.brokenCount} broken link${input.brokenCount === 1 ? "" : "s"} across ${input.pagesCrawled} page${input.pagesCrawled === 1 ? "" : "s"}`,
          `${input.linksChecked} links checked · ${modeLabel}`,
        ]
      : ["No broken links found"];

  const summaryRows = [
    { setting: "Scan mode", value: modeLabel },
    { setting: "Link types", value: formatResourceTypes(input.resourceTypes) },
    { setting: "Pages crawled", value: String(input.pagesCrawled) },
    { setting: "Links checked", value: String(input.linksChecked) },
    { setting: "Broken links", value: String(input.brokenCount) },
  ];

  const findingRows = input.findings.map((finding, index) => ({
    num: String(index + 1),
    sev: finding.severity,
    status:
      finding.statusCode !== null
        ? `HTTP ${finding.statusCode}`
        : (finding.errorMessage ?? "Unreachable"),
    url: finding.href,
    page: finding.sourcePageUrl,
    element: formatElement(finding),
  }));

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
          ok={input.brokenCount === 0}
        />

        <PdfTable
          columns={[
            { key: "setting", label: "Setting", flex: 1 },
            { key: "value", label: "Value", flex: 2, wrap: true },
          ]}
          rows={summaryRows}
        />

        <Text style={sharedStyles.h2}>Findings ({input.findings.length})</Text>
        <BrokenLinksFindingTable rows={findingRows} />

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
