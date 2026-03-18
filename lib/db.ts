import { PrismaClient } from "@prisma/client";

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// For Vercel Postgres, DATABASE_URL_UNPOOLED is also recommended for migrations
if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL_UNPOOLED) {
  console.warn("Warning: DATABASE_URL_UNPOOLED not set. Migrations may fail in production.");
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
    // Connection pooling is handled by Vercel Postgres via DATABASE_URL
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
if (typeof window === "undefined") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
