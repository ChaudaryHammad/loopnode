import { prisma } from "@/lib/prisma";
import type { PaymentMethodDisplayStyle } from "@prisma/client";

export type PaymentDetailRow = {
  key: string;
  value: string;
};

export type PublicPaymentMethod = {
  id: string;
  label: string;
  tagline: string | null;
  displayStyle: PaymentMethodDisplayStyle;
  details: PaymentDetailRow[];
};

export type AdminPaymentMethod = PublicPaymentMethod & {
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function parseDetails(raw: unknown): PaymentDetailRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (row): row is PaymentDetailRow =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as PaymentDetailRow).key === "string" &&
        typeof (row as PaymentDetailRow).value === "string"
    )
    .map((row) => ({
      key: row.key.trim(),
      value: row.value.trim(),
    }))
    .filter((row) => row.key.length > 0 && row.value.length > 0);
}

function serializeDetails(details: PaymentDetailRow[]): PaymentDetailRow[] {
  return details
    .map((row) => ({ key: row.key.trim(), value: row.value.trim() }))
    .filter((row) => row.key.length > 0 && row.value.length > 0);
}

function mapRow(row: {
  id: string;
  label: string;
  tagline: string | null;
  displayStyle: PaymentMethodDisplayStyle;
  details: unknown;
}): PublicPaymentMethod {
  return {
    id: row.id,
    label: row.label,
    tagline: row.tagline,
    displayStyle: row.displayStyle,
    details: parseDetails(row.details),
  };
}

export async function getEnabledPaymentMethods(): Promise<PublicPaymentMethod[]> {
  const rows = await prisma.paymentMethodConfig.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return rows.map(mapRow);
}

export async function getAdminPaymentMethods(): Promise<AdminPaymentMethod[]> {
  const rows = await prisma.paymentMethodConfig.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return rows.map((row) => ({
    ...mapRow(row),
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getPaymentMethodById(id: string) {
  const row = await prisma.paymentMethodConfig.findFirst({
    where: { id, enabled: true },
  });
  if (!row) return null;

  return mapRow(row);
}

export function normalizePaymentMethodInput(input: {
  label: string;
  tagline?: string | null;
  displayStyle?: PaymentMethodDisplayStyle;
  details: PaymentDetailRow[];
  enabled?: boolean;
  sortOrder?: number;
}) {
  const label = input.label.trim();
  if (label.length < 2) {
    throw new Error("Label must be at least 2 characters.");
  }

  const details = serializeDetails(input.details);
  if (details.length === 0) {
    throw new Error("Add at least one payment detail row.");
  }

  return {
    label,
    tagline: input.tagline?.trim() || null,
    displayStyle: input.displayStyle ?? "PLAIN",
    details: JSON.parse(JSON.stringify(details)),
    enabled: input.enabled ?? true,
    sortOrder: input.sortOrder ?? 0,
  };
}
