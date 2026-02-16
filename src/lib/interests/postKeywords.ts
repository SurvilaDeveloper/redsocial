// src/lib/interests/postKeywords.ts

import { prisma } from "@/lib/prisma";
import { extractWeightedKeywords, mapToSortedKeywordsArray } from "@/lib/text/keywords";

export type UpsertPostKeywordsOptions = {
    titleWeight?: number;       // default 3
    descriptionWeight?: number; // default 1
    maxKeywords?: number;       // default 30
    language?: "es" | "en";     // default "es"
    version?: number;           // default 1
};

export async function upsertPostKeywords(
    postId: number,
    opts: UpsertPostKeywordsOptions = {}
) {
    const {
        titleWeight = 3,
        descriptionWeight = 1,
        maxKeywords = 30,
        language = "es",
        version = 1,
    } = opts;

    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, title: true, description: true, deletedAt: true, active: true },
    });

    if (!post) {
        return { ok: false as const, reason: "post_not_found" as const };
    }

    // Si está borrado o inactivo, igual podrías guardar keywords (depende de tu lógica),
    // pero para MVP evitamos ensuciar:
    if (post.deletedAt != null || post.active === 0) {
        return { ok: false as const, reason: "post_inactive_or_deleted" as const };
    }

    const kwMap = extractWeightedKeywords(
        [
            { text: post.title ?? "", weight: titleWeight, label: "title" },
            { text: post.description ?? "", weight: descriptionWeight, label: "description" },
        ],
        { language, maxKeywords }
    );

    const keywords = mapToSortedKeywordsArray(kwMap, maxKeywords);

    await prisma.postKeywords.upsert({
        where: { postId: post.id },
        create: { postId: post.id, keywords, version },
        update: { keywords, version },
    });

    return { ok: true as const, postId: post.id, keywords };
}
const KEYWORDS_VERSION = 1;

export async function getOrCreatePostKeywords(postId: number): Promise<string[]> {
    const existing = await prisma.postKeywords.findUnique({
        where: { postId },
        select: { keywords: true, version: true },
    });

    const arr = Array.isArray(existing?.keywords) ? (existing!.keywords as any[]) : [];
    const cleaned = arr.filter((x) => typeof x === "string") as string[];

    const needsRecompute = !existing || existing.version !== KEYWORDS_VERSION || cleaned.length === 0;
    if (!needsRecompute) return cleaned;

    const created = await upsertPostKeywords(postId, { version: KEYWORDS_VERSION });
    if (!created.ok) return cleaned; // fallback
    return created.keywords;
}
