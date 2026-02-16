// src/lib/interests/events.ts
import { prisma } from "@/lib/prisma";
import type { ContentEventType } from "@prisma/client";
import { getOrCreatePostKeywords } from "./postKeywords";
import { addToUserInterestProfile, type KeywordScores } from "./profile";

type TrackArgs = {
    userId: number;
    postId: number;
    type: "view" | "like" | "own_post";
    dwellMs: number | null;
    weight?: number;
};

function computeDefaultWeight(args: { type: TrackArgs["type"]; dwellMs: number | null }) {
    if (args.type === "like") return 3;
    if (args.type === "own_post") return 4;

    const ms = args.dwellMs ?? 0;
    if (ms >= 10_000) return 2;
    return 1;
}

function toContentEventType(type: TrackArgs["type"]): ContentEventType {
    return type as ContentEventType;
}

function keywordsToScores(keywords: string[], weight: number): KeywordScores {
    const out: KeywordScores = {};
    for (const k of keywords) {
        const kk = (k ?? "").trim();
        if (!kk) continue;
        out[kk] = (out[kk] ?? 0) + weight;
    }
    return out;
}

export async function trackPostEventAndApplyProfile(args: TrackArgs) {
    const { userId, postId, type, dwellMs } = args;

    // 1) validar post
    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, deletedAt: true, active: true },
    });

    if (!post || post.deletedAt != null) {
        return { ok: false as const, error: "Post not found" as const };
    }

    // MVP: si inactivo, lo ignoramos (opcional)
    if ((post.active ?? 1) === 0) {
        return { ok: false as const, error: "Post inactive" as const };
    }

    const weight = args.weight ?? computeDefaultWeight({ type, dwellMs });

    // 2) keywords del post (fuera de tx, porque puede hacer upsert propio)
    const keywords = await getOrCreatePostKeywords(postId);
    const addScores = keywords.length > 0 ? keywordsToScores(keywords, weight) : {};

    const result = await prisma.$transaction(async (tx) => {
        const createdEvent = await tx.userContentEvent.create({
            data: {
                userId,
                postId,
                type: toContentEventType(type),
                weight,
                dwellMs: dwellMs ?? undefined,
            },
            select: { id: true, createdAt: true },
        });

        // Si un post no tiene texto, igual guardamos el evento, pero no actualizamos perfil.
        let profileUpdatedAt: Date | null = null;

        if (keywords.length > 0) {
            const updated = await addToUserInterestProfile(tx, {
                userId,
                addScores,
                addWeight: weight,
                version: 1,
                maxKeywords: 200,
            });
            profileUpdatedAt = updated.updatedAt ?? null;
        }

        return { createdEvent, profileUpdatedAt };
    });

    return {
        ok: true as const,
        eventId: result.createdEvent.id,
        appliedKeywordsCount: keywords.length,
        profileUpdatedAt: result.profileUpdatedAt,
    };
}

