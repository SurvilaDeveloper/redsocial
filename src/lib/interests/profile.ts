// src/lib/interests/profile.ts
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type KeywordScores = Record<string, number>;

type PrismaLike = Prisma.TransactionClient | typeof prisma;

function addScores(base: KeywordScores, add: KeywordScores) {
    const out: KeywordScores = { ...base };
    for (const [k, v] of Object.entries(add)) {
        out[k] = (out[k] ?? 0) + v;
    }
    return out;
}

function takeTopK(kw: KeywordScores, maxKeywords: number) {
    const entries = Object.entries(kw)
        .filter(([k, v]) => typeof k === "string" && k.length > 0 && typeof v === "number" && v > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxKeywords);

    const out: KeywordScores = {};
    for (const [k, v] of entries) out[k] = v;
    return out;
}

/**
 * Suma scores al perfil del usuario (upsert).
 * MVP: sin decay, sin normalización, con cap opcional de keywords.
 * Importante: recibe `db` (tx o prisma) para ser transaction-safe.
 */
export async function addToUserInterestProfile(
    db: PrismaLike,
    opts: {
        userId: number;
        addScores: KeywordScores;
        addWeight?: number; // para totalWeight
        version?: number;
        maxKeywords?: number; // default 200
    }
) {
    const { userId, addScores: toAdd, addWeight = 1, version = 1, maxKeywords = 200 } = opts;

    const current = await db.userInterestProfile.findUnique({
        where: { userId },
        select: { keywords: true, totalWeight: true, version: true },
    });

    const currentKw = (current?.keywords ?? {}) as KeywordScores;
    const merged = addScores(currentKw, toAdd);
    const capped = takeTopK(merged, maxKeywords);

    const updated = await db.userInterestProfile.upsert({
        where: { userId },
        create: {
            userId,
            keywords: capped,
            totalWeight: addWeight,
            version,
        },
        update: {
            keywords: capped,
            totalWeight: (current?.totalWeight ?? 0) + addWeight,
            version,
        },
        select: { updatedAt: true, totalWeight: true, version: true },
    });

    return { ok: true as const, ...updated };
}
