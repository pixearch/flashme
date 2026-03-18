import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // For migrations, use DATABASE_URL_UNPOOLED (direct connection) if available
    // Otherwise fall back to DATABASE_URL (pooled connection)
    // PrismaClient will use DATABASE_URL via the adapter in lib/db.ts
    url: env("DATABASE_URL_UNPOOLED") || env("DATABASE_URL"),
  },
});
