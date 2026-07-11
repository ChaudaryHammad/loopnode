import { Pool, type PoolConfig } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ReportType as ReportTypeEnum } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion?: number;
  pool?: Pool;
};

/** Bump when the schema changes so dev HMR reloads the Prisma client. */
const PRISMA_CLIENT_VERSION = 11;

const CATEGORY_REPORT_TYPES = [
  "PERFORMANCE_REPORT",
  "SEO_REPORT",
  "SECURITY_REPORT",
  "ACCESSIBILITY_REPORT",
] as const satisfies readonly (keyof typeof ReportTypeEnum)[];

type PrismaRuntimeModel = {
  fields?: { name: string }[];
};

function modelHasField(client: PrismaClient, modelName: string, fieldName: string) {
  const runtime = (
    client as unknown as { _runtimeDataModel?: { models: Record<string, PrismaRuntimeModel> } }
  )._runtimeDataModel;
  const fields = runtime?.models?.[modelName]?.fields;
  return fields?.some((f) => f.name === fieldName) ?? false;
}

function supportsCategoryReportTypes() {
  return CATEGORY_REPORT_TYPES.every((value) => value in ReportTypeEnum);
}

/** Dev HMR can keep an old PrismaClient after `prisma generate` adds models/fields. */
function isStalePrismaClient(client: PrismaClient) {
  return (
    !("contactMessage" in client) ||
    !("subscription" in client) ||
    !("upgradeRequest" in client) ||
    !("notification" in client) ||
    !("websiteDomainSlot" in client) ||
    !("paymentMethodConfig" in client) ||
    !modelHasField(client, "PaymentMethodConfig", "displayStyle") ||
    !modelHasField(client, "UpgradeRequest", "paymentProofUrl") ||
    !modelHasField(client, "Website", "scanTimezone") ||
    !modelHasField(client, "Website", "nextScanAt") ||
    !modelHasField(client, "Website", "pendingScanRunId") ||
    !modelHasField(client, "Scan", "phase") ||
    !modelHasField(client, "Scan", "triggerRunId") ||
    !modelHasField(client, "Report", "shareToken") ||
    !modelHasField(client, "User", "signupLat") ||
    !modelHasField(client, "User", "lastLoginAt") ||
    !supportsCategoryReportTypes()
  );
}

function staleClientMessage() {
  return "Prisma client is out of date. Run `npx prisma generate`, delete the `.next` folder, and restart the dev server.";
}

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL must be set.");
  }
  return url;
}

function getPool(): Pool {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool;
  }

  const connectionString = resolveDatabaseUrl();
  const config: PoolConfig = {
    connectionString,
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };

  if (connectionString.includes("supabase.com")) {
    config.ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool(config);
  globalForPrisma.pool = pool;
  return pool;
}

const createPrismaClient = () => {
  if (!supportsCategoryReportTypes()) {
    throw new Error(staleClientMessage());
  }

  const adapter = new PrismaPg(getPool());
  return new PrismaClient({ adapter });
};

function getPrismaClient() {
  const previous = globalForPrisma.prisma;
  const versionOk = globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION;
  if (previous && versionOk && !isStalePrismaClient(previous)) {
    return previous;
  }

  const staleClient = previous as PrismaClient | undefined;
  if (staleClient) {
    void staleClient.$disconnect();
  }

  const client = createPrismaClient();
  if (isStalePrismaClient(client)) {
    throw new Error(staleClientMessage());
  }

  globalForPrisma.prisma = client;
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  return client;
}

/** Proxy so dev HMR never keeps a stale client reference from module init. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
