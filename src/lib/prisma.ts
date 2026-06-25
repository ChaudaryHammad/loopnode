import { Pool, type PoolConfig } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string {
  // Runtime queries must go through the pooled (transaction mode) connection.
  // DIRECT_URL is for migrations only — see prisma.config.ts.
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL must be set.");
  }
  return url;
}

function createPool(): Pool {
  const connectionString = resolveDatabaseUrl();
  const config: PoolConfig = {
    connectionString,
    max: 1, // Supavisor handles multiplexing across instances — don't duplicate pooling here
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  };

  if (connectionString.includes("supabase.com")) {
    config.ssl = { rejectUnauthorized: false };
  }

  return new Pool(config);
}

const createPrismaClient = () => {
  const pool = createPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

/** Dev HMR can keep an old PrismaClient after `prisma generate` adds models. */
function isStalePrismaClient(client: PrismaClient) {
  return !("contactMessage" in client) || !("subscription" in client);
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  if (cached && !isStalePrismaClient(cached)) {
    return cached;
  }

if (cached !== undefined) {
  void (cached as PrismaClient).$disconnect();
}
	
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();