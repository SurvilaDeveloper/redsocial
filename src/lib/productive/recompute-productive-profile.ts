// src/lib/productive/recompute-productive-profile.ts
import type { Prisma, PrismaClient } from "@prisma/client";
import type { ProductiveKeywordKind } from "@/lib/productive/keyword-types";
import { lexicalWeight } from "@/lib/productive/lexical-weight";
import { normalizeKeyword } from "./normalize";

/**
 * SOURCE_WEIGHT = "de dónde viene" (UserProductiveKeywords.source)
 * Esto es distinto a kind (skill/degree/etc).
 */
const SOURCE_WEIGHT: Record<string, number> = {
    cv: 3,
    profile: 2,
    education: 2,
    commerce: 1,
};

/**
 * KIND_MULT = "qué es" (skill/degree/role/etc)
 * Skills y degrees dominan (tu objetivo).
 */
const KIND_MULT: Record<ProductiveKeywordKind, number> = {
    skill: 2.6,
    degree: 2.2,
    institution: 1.5,
    role: 1.6,
    company: 1.3,
    project: 1.4,
    text: 1.0,

    tag: 3.2, // ✅ tags: boost fuerte (ajustable)
};


type KeywordRow = { source: string; keywords: unknown };

type DbClient = PrismaClient | Prisma.TransactionClient;

function round2(n: number) {
    return Math.round(n * 100) / 100;
}


function coerceKeywordItem(k: unknown): { t: string; kind: ProductiveKeywordKind } | null {
    // ✅ formato nuevo: { t, k, o? }
    if (k && typeof k === "object") {
        const obj = k as any;

        if (typeof obj.t === "string" && typeof obj.k === "string") {
            const kind = obj.k as ProductiveKeywordKind;
            const t = normalizeKeyword(obj.t);
            if (!t) return null;
            return { t, kind };
        }
    }

    // ✅ formato viejo: "string"
    if (typeof k === "string") {
        const t = normalizeKeyword(k);
        if (!t) return null;
        return { t, kind: "text" };
    }

    return null;
}


function lexicalWeightForKeyword(t: string): number {
    // lexicalWeight solo tiene sentido para tokens simples (una palabra).
    // Para frases (con espacios), no penalizamos (peso = 1).
    if (t.includes(" ")) return 1.0;
    return lexicalWeight(t);
}

function aggregateKeywordScores(rows: KeywordRow[]) {
    const scores: Record<string, number> = {};
    let totalWeight = 0;

    for (const r of rows) {
        const wSource = SOURCE_WEIGHT[r.source] ?? 1;
        const kws = Array.isArray(r.keywords) ? r.keywords : [];

        for (const rawKw of kws) {
            const it = coerceKeywordItem(rawKw);
            if (!it) continue;

            const wKind = KIND_MULT[it.kind] ?? 1.0;
            const wLex = lexicalWeightForKeyword(it.t);
            if (wLex <= 0) continue;

            const w = wSource * wKind * wLex;

            scores[it.t] = round2((scores[it.t] ?? 0) + w);
            totalWeight = round2(totalWeight + w);
        }
    }

    return { scores, totalWeight };
}

/**
 * Recalcula 100% el perfil productivo desde UserProductiveKeywords (todas las sources).
 * ✅ Funciona tanto con prisma como con tx (TransactionClient).
 */
export async function recomputeProductiveProfileTx(tx: DbClient, userId: number) {
    const rows = await tx.userProductiveKeywords.findMany({
        where: { userId },
        select: { source: true, keywords: true },
    });

    const { scores, totalWeight } = aggregateKeywordScores(rows);

    await tx.userProductiveProfile.upsert({
        where: { userId },
        create: {
            userId,
            keywords: scores,
            totalWeight,
            version: 1,
        },
        update: {
            keywords: scores,
            totalWeight,
            updatedAt: new Date(),
        },
    });

    return { scores, totalWeight };
}



