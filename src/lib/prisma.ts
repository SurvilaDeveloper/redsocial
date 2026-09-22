// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Pool de Postgres usando tu DATABASE_URL (postgresql://...)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
});

const adapter = new PrismaPg(pool);

export const prisma =
    globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;