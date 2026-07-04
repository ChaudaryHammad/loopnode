import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { LOOPNODE_BRAND } from "@/lib/reports/report-html-shared";
import { colors, fonts } from "@/lib/reports/pdf/theme";

export const sharedStyles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 44,
    paddingHorizontal: 48,
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
    paddingBottom: 14,
    marginBottom: 28,
  },
  headerBrand: {
    flexDirection: "column",
    flexShrink: 0,
    maxWidth: 280,
  },
  headerMeta: {
    flexDirection: "column",
    alignItems: "flex-end",
    flexShrink: 0,
    maxWidth: 220,
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: -0.5,
    lineHeight: 1.3,
  },
  logoBlock: {
    marginBottom: 6,
  },
  logoSub: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    lineHeight: 1.4,
  },
  meta: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.55,
    textAlign: "right",
    marginBottom: 3,
  },
  metaStrong: {
    color: colors.text,
    fontWeight: 700,
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
  },
  h2: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 24,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  footer: {
    marginTop: 32,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: colors.footer,
  },
  headlineBox: {
    backgroundColor: colors.headlineBg,
    borderWidth: 1,
    borderColor: colors.headlineBorder,
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
  },
  headlineBoxOk: {
    backgroundColor: colors.okBg,
    borderColor: colors.okBorder,
  },
  headlineTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.headlineText,
    marginBottom: 8,
  },
  headlineTitleOk: {
    color: colors.okTitle,
  },
  headlineItem: {
    fontSize: 9.5,
    color: colors.headlineItem,
    marginBottom: 4,
  },
  headlineItemOk: {
    color: colors.okItem,
  },
  table: {
    marginTop: 10,
    marginBottom: 18,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.headerBg,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderStrong,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  th: {
    fontSize: 7.5,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.muted,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: "flex-start",
  },
  td: {
    fontSize: 9,
    paddingRight: 6,
  },
  tdWrap: {
    lineHeight: 1.45,
  },
  tdStrong: {
    fontWeight: 700,
  },
  tdMuted: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 2,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 8.5,
    color: "#475569",
  },
  action: {
    color: colors.action,
    fontSize: 9,
  },
  empty: {
    color: colors.muted,
    fontSize: 9,
  },
});

export function PdfPageHeader({
  websiteName,
  websiteUrl,
  scanDate,
  subtitle = "Website audit report",
}: {
  websiteName: string;
  websiteUrl: string;
  scanDate: string;
  subtitle?: string;
}) {
  return (
    <View style={sharedStyles.header}>
      <View style={sharedStyles.headerBrand}>
        <View style={sharedStyles.logoBlock}>
          <Text style={sharedStyles.logo}>{LOOPNODE_BRAND}</Text>
        </View>
        <Text style={sharedStyles.logoSub}>{subtitle}</Text>
      </View>
      <View style={sharedStyles.headerMeta}>
        <Text style={[sharedStyles.meta, sharedStyles.metaStrong]}>{websiteName}</Text>
        <Text style={sharedStyles.meta}>{websiteUrl}</Text>
        <Text style={[sharedStyles.meta, { marginBottom: 0 }]}>{scanDate}</Text>
      </View>
    </View>
  );
}

export function PdfFooter({ left, right }: { left: string; right: string }) {
  return (
    <View style={sharedStyles.footer}>
      <Text>{left}</Text>
      <Text>{right}</Text>
    </View>
  );
}

export function PdfHeadlineBox({
  title,
  items,
  ok = false,
}: {
  title: string;
  items: string[];
  ok?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <View style={ok ? [sharedStyles.headlineBox, sharedStyles.headlineBoxOk] : sharedStyles.headlineBox}>
      <Text style={ok ? [sharedStyles.headlineTitle, sharedStyles.headlineTitleOk] : sharedStyles.headlineTitle}>
        {title}
      </Text>
      {items.map((item) => (
        <Text
          key={item}
          style={ok ? [sharedStyles.headlineItem, sharedStyles.headlineItemOk] : sharedStyles.headlineItem}
        >
          • {item}
        </Text>
      ))}
    </View>
  );
}

export function SeverityText({ severity }: { severity: string }) {
  const key = severity.toLowerCase() as "critical" | "major" | "minor" | "info";
  const colorMap = {
    critical: colors.critical,
    major: colors.major,
    minor: colors.minor,
    info: colors.info,
  };

  return (
    <Text style={{ fontSize: 7, fontWeight: 700, color: colorMap[key] ?? colors.info }}>
      {severity}
    </Text>
  );
}

export type TableColumn = {
  key: string;
  label: string;
  flex: number;
  mono?: boolean;
  strong?: boolean;
  wrap?: boolean;
};

/** Insert soft break points so long URLs/paths wrap in react-pdf cells. */
export function pdfBreakableText(text: string): string {
  if (!text) return "—";
  return text.replace(/([/.:?=&_%-])/g, "$1\u200b");
}

export function PdfTable({
  columns,
  rows,
}: {
  columns: TableColumn[];
  rows: Record<string, string>[];
}) {
  if (rows.length === 0) {
    return <Text style={sharedStyles.empty}>No rows in this section.</Text>;
  }

  return (
    <View style={sharedStyles.table}>
      <View style={sharedStyles.tableHeader}>
        {columns.map((column) => (
          <Text key={column.key} style={[sharedStyles.th, { flex: column.flex }]}>
            {column.label}
          </Text>
        ))}
      </View>
      {rows.map((row, index) => (
        <View key={`${index}-${row[columns[0]?.key ?? "row"]}`} style={sharedStyles.tableRow}>
          {columns.map((column) => {
            const raw = row[column.key] ?? "—";
            const value = column.wrap ? pdfBreakableText(raw) : raw;
            return (
              <Text
                key={column.key}
                style={[
                  sharedStyles.td,
                  sharedStyles.tdWrap,
                  { flex: column.flex },
                  ...(column.mono ? [sharedStyles.mono] : []),
                  ...(column.strong ? [sharedStyles.tdStrong] : []),
                ]}
              >
                {value}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}
export function BrokenLinksFindingTable({
  rows,
}: {
  rows: Array<{
    num: string;
    sev: string;
    status: string;
    url: string;
    page: string;
    element: string;
  }>;
}) {
  if (rows.length === 0) {
    return <Text style={sharedStyles.empty}>No broken links found in this scan.</Text>;
  }

  return (
    <View style={sharedStyles.table}>
      <View style={sharedStyles.tableHeader}>
        <Text style={[sharedStyles.th, { flex: 0.4 }]}>#</Text>
        <Text style={[sharedStyles.th, { flex: 0.7 }]}>Sev</Text>
        <Text style={[sharedStyles.th, { flex: 1 }]}>Status</Text>
        <Text style={[sharedStyles.th, { flex: 2.2 }]}>Broken URL</Text>
        <Text style={[sharedStyles.th, { flex: 2 }]}>Found on page</Text>
        <Text style={[sharedStyles.th, { flex: 1.6 }]}>Element</Text>
      </View>
      {rows.map((row) => (
        <View key={row.num} style={sharedStyles.tableRow}>
          <Text style={[sharedStyles.td, { flex: 0.4 }]}>{row.num}</Text>
          <View style={{ flex: 0.7 }}>
            <SeverityText severity={row.sev} />
          </View>
          <Text style={[sharedStyles.td, sharedStyles.tdStrong, sharedStyles.tdWrap, { flex: 1 }]}>
            {pdfBreakableText(row.status)}
          </Text>
          <Text style={[sharedStyles.td, sharedStyles.mono, sharedStyles.tdWrap, { flex: 2.2 }]}>
            {pdfBreakableText(row.url)}
          </Text>
          <Text style={[sharedStyles.td, sharedStyles.mono, sharedStyles.tdWrap, { flex: 2 }]}>
            {pdfBreakableText(row.page)}
          </Text>
          <Text style={[sharedStyles.td, sharedStyles.mono, sharedStyles.tdWrap, { flex: 1.6 }]}>
            {pdfBreakableText(row.element)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function FindingTable({
  rows,
}: {
  rows: Array<{
    index: string;
    severity: string;
    title: string;
    description: string;
    location: string;
    action: string;
  }>;
}) {
  if (rows.length === 0) {
    return <Text style={sharedStyles.empty}>No issues in this section.</Text>;
  }

  return (
    <View style={sharedStyles.table}>
      <View style={sharedStyles.tableHeader}>
        <Text style={[sharedStyles.th, { flex: 0.5 }]}>#</Text>
        <Text style={[sharedStyles.th, { flex: 0.8 }]}>Sev</Text>
        <Text style={[sharedStyles.th, { flex: 2.2 }]}>Finding</Text>
        <Text style={[sharedStyles.th, { flex: 1.8 }]}>Location</Text>
        <Text style={[sharedStyles.th, { flex: 2.2 }]}>Action required</Text>
      </View>
      {rows.map((row) => (
        <View key={row.index} style={sharedStyles.tableRow}>
          <Text style={[sharedStyles.td, { flex: 0.5 }]}>{row.index}</Text>
          <View style={{ flex: 0.8 }}>
            <SeverityText severity={row.severity} />
          </View>
          <View style={{ flex: 2.2, paddingRight: 6 }}>
            <Text style={sharedStyles.tdStrong}>{row.title}</Text>
            {row.description ? (
              <Text style={[sharedStyles.tdMuted, sharedStyles.tdWrap]}>
                {pdfBreakableText(row.description)}
              </Text>
            ) : null}
          </View>
          <Text style={[sharedStyles.td, sharedStyles.mono, sharedStyles.tdWrap, { flex: 1.8 }]}>
            {pdfBreakableText(row.location)}
          </Text>
          <Text style={[sharedStyles.td, sharedStyles.action, sharedStyles.tdWrap, { flex: 2.2 }]}>
            {pdfBreakableText(row.action)}
          </Text>
        </View>
      ))}
    </View>
  );
}
