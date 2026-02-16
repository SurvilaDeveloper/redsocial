// src/lib/interests/recompute.ts
import { prisma } from "@/lib/prisma";
import type { KeywordScores } from "./profile";

function clampTopKeywords(map: KeywordScores, max: number) {
    return Object.fromEntries(
        Object.entries(map)
            .filter(([k, v]) => k && Number.isFinite(v) && v > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, max)
    ) as KeywordScores;
}

export async function recomputeUserInterestProfile(opts: {
    userId: number;
    days?: number;        // default 90
    maxEvents?: number;   // default 50k
    maxKeywords?: number; // default 200
    version?: number;     // default 1
}) {
    const {
        userId,
        days = 90,
        maxEvents = 50_000,
        maxKeywords = 200,
        version = 1,
    } = opts;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await prisma.userContentEvent.findMany({
        where: {
            userId,
            createdAt: { gte: since },
        },
        select: { postId: true, weight: true },
        orderBy: { createdAt: "desc" },
        take: maxEvents,
    });

    // Agrupar peso por post
    const weightByPost = new Map<number, number>();
    let totalWeight = 0;

    for (const e of events) {
        const w = e.weight ?? 1;
        totalWeight += w;
        weightByPost.set(e.postId, (weightByPost.get(e.postId) ?? 0) + w);
    }

    const postIds = [...weightByPost.keys()];
    if (postIds.length === 0) {
        const profile = await prisma.userInterestProfile.upsert({
            where: { userId },
            create: { userId, keywords: {}, totalWeight: 0, version },
            update: { keywords: {}, totalWeight: 0, version },
        });

        return { ok: true as const, events: 0, posts: 0, keywords: 0, profileUpdatedAt: profile.updatedAt };
    }

    const postsKw = await prisma.postKeywords.findMany({
        where: { postId: { in: postIds } },
        select: { postId: true, keywords: true },
    });

    const kwByPostId = new Map<number, string[]>();
    for (const row of postsKw) {
        const arr = Array.isArray(row.keywords) ? (row.keywords as any[]) : [];
        kwByPostId.set(row.postId, arr.filter((x) => typeof x === "string") as string[]);
    }

    const score: KeywordScores = {};

    for (const [postId, w] of weightByPost.entries()) {
        const kws = kwByPostId.get(postId) ?? [];
        for (const kw of kws) {
            score[kw] = (score[kw] ?? 0) + w;
        }
    }

    const clamped = clampTopKeywords(score, maxKeywords);

    const profile = await prisma.userInterestProfile.upsert({
        where: { userId },
        create: { userId, keywords: clamped, totalWeight, version },
        update: { keywords: clamped, totalWeight, version },
    });

    return {
        ok: true as const,
        events: events.length,
        posts: postIds.length,
        keywords: Object.keys(clamped).length,
        profileUpdatedAt: profile.updatedAt,
    };
}
