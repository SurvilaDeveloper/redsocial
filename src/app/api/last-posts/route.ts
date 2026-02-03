// app/api/last-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

import { shapePost } from "@/lib/shape-post";
import { canViewPost } from "@/lib/post-visibility";
import { getSocialRelations } from "@/lib/social-relations";
import { RelationshipState } from "@/lib/relationship-state";

import { getUserConfiguration } from "@/lib/configuration/getUserConfiguration";
import { areIEnableToView, myOwnPermissions } from "@/lib/permissions";

import type { Configuration } from "@/types/configuration";
import { canViewWallEntry, normalizeVisibility } from "@/lib/wall-entry-visibility";

type CursorPayload = { eventAt: string; id: number };

function decodeCursor(raw: string | null): CursorPayload | null {
    if (!raw) return null;
    try {
        const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
        const json = Buffer.from(b64, "base64").toString("utf8");
        const obj = JSON.parse(json);
        if (!obj?.eventAt || typeof obj?.id !== "number") return null;
        return { eventAt: String(obj.eventAt), id: Number(obj.id) };
    } catch {
        return null;
    }
}

function encodeCursor(payload: CursorPayload | null): string | null {
    if (!payload) return null;
    const json = JSON.stringify(payload);
    const b64 = Buffer.from(json, "utf8").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function GET(req: NextRequest) {
    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;

    const { searchParams } = new URL(req.url);
    const cursor = decodeCursor(searchParams.get("cursor"));

    const pageSize = 4;
    const CHUNK_SIZE = 30;
    const MAX_LOOPS = 6;

    // caches por request
    const socialCache = new Map<number, SocialRelations>(); // viewer ↔ author
    const wallOwnerSocialCache = new Map<number, SocialRelations>(); // viewer ↔ wall owner
    const configCache = new Map<number, Configuration | null>();
    const enableToViewCache = new Map<number, EnableToView>();

    // ✅ dedupe por request: un post aparece 1 sola vez en la respuesta
    // (pero solo marcamos "seen" cuando efectivamente se pushea a results)
    const seenPostIds = new Set<number>();

    async function getSocialToAuthor(authorId: number): Promise<SocialRelations> {
        if (viewerId == null) {
            return { following: false, isFollower: false, relState: RelationshipState.NONE };
        }
        const cached = socialCache.get(authorId);
        if (cached) return cached;
        const social = await getSocialRelations(viewerId, authorId);
        socialCache.set(authorId, social);
        return social;
    }

    async function getSocialToWallOwner(wallOwnerId: number): Promise<SocialRelations> {
        if (viewerId == null) {
            return { following: false, isFollower: false, relState: RelationshipState.NONE };
        }
        const cached = wallOwnerSocialCache.get(wallOwnerId);
        if (cached) return cached;
        const social = await getSocialRelations(viewerId, wallOwnerId);
        wallOwnerSocialCache.set(wallOwnerId, social);
        return social;
    }

    async function getConfig(ownerId: number): Promise<Configuration | null> {
        if (configCache.has(ownerId)) return configCache.get(ownerId) ?? null;
        const config = await getUserConfiguration(ownerId);
        configCache.set(ownerId, config);
        return config ?? null;
    }

    async function getEnableToViewForOwner(ownerId: number): Promise<EnableToView> {
        const cached = enableToViewCache.get(ownerId);
        if (cached) return cached;

        if (viewerId === ownerId) {
            enableToViewCache.set(ownerId, myOwnPermissions);
            return myOwnPermissions;
        }

        const social = await getSocialToAuthor(ownerId);
        const config = await getConfig(ownerId);

        const enable = areIEnableToView(
            config,
            viewerId !== null,
            social.relState === RelationshipState.FRIENDS,
            social.following
        );

        enableToViewCache.set(ownerId, enable);
        return enable;
    }

    const results: Post[] = [];
    let hitEnd = false;

    let currentCursor: CursorPayload | null = cursor;

    for (let loop = 0; loop < MAX_LOOPS && results.length < pageSize; loop++) {
        const whereCursor =
            currentCursor == null
                ? {}
                : {
                    OR: [
                        { eventAt: { lt: new Date(currentCursor.eventAt) } },
                        {
                            eventAt: new Date(currentCursor.eventAt),
                            id: { lt: currentCursor.id },
                        },
                    ],
                };

        const entries = await prisma.wallEntry.findMany({
            where: {
                active: 1,
                showInFeed: true,
                ...whereCursor,
                // ✅ tipos mezclados: PUBLISHED / SHARED / PINNED
            },
            orderBy: [{ eventAt: "desc" }, { id: "desc" }],
            take: CHUNK_SIZE,
            include: {
                wallUser: {
                    select: { id: true, name: true, imageUrl: true, imagePublicId: true, image: true },
                },
                actorUser: {
                    select: { id: true, name: true, imageUrl: true, imagePublicId: true, image: true },
                },
                post: {
                    include: {
                        images: {
                            where: { active: 1 },
                            orderBy: { index: "asc" },
                            include: {
                                _count: { select: { image_like: true, image_unlike: true } },
                                ...(viewerId && {
                                    image_like: { where: { userId: viewerId }, select: { id: true } },
                                    image_unlike: { where: { userId: viewerId }, select: { id: true } },
                                }),
                            },
                        },
                        author: {
                            select: { id: true, name: true, imageUrl: true, imagePublicId: true, image: true },
                        },
                        _count: { select: { post_like: true, post_unlike: true, post_comment: true } },
                        ...(viewerId && {
                            post_like: { where: { userId: viewerId }, select: { id: true } },
                            post_unlike: { where: { userId: viewerId }, select: { id: true } },
                        }),
                    },
                },
            },
        });

        if (entries.length === 0) {
            hitEnd = true;
            break;
        }

        for (const entry of entries) {
            currentCursor = { eventAt: entry.eventAt.toISOString(), id: entry.id };

            const post = entry.post;
            if (!post) continue;

            // filtros baratos
            if ((post.active ?? 1) !== 1) continue;
            if (post.deletedAt) continue;

            const postId = post.id;

            // ✅ si ya lo devolvimos, salteamos
            if (seenPostIds.has(postId)) continue;

            const authorId = post.authorId;
            const wallOwnerId = entry.wallUserId;

            const relToAuthor = await getSocialToAuthor(authorId);

            // 1) visibilidad del post (viewer ↔ autor)
            const canViewThisPost = canViewPost((post.visibility ?? 1) as PostVisibility, {
                isOwner: viewerId === authorId,
                isLogged: viewerId !== null,
                isFriend: relToAuthor.relState === RelationshipState.FRIENDS,
                following: relToAuthor.following,
            });
            if (!canViewThisPost) continue;

            // 2) visibilidad de la entrada en muro (viewer ↔ dueño del muro)
            const entryVisibility = normalizeVisibility(entry.visibility ?? 1);
            const relToWallOwner = await getSocialToWallOwner(wallOwnerId);

            const canViewThisEntry = canViewWallEntry(entryVisibility, {
                isOwner: viewerId === wallOwnerId,
                isLogged: viewerId !== null,
                isFriend: relToWallOwner.relState === RelationshipState.FRIENDS,
                following: relToWallOwner.following,
            });
            if (!canViewThisEntry) continue;

            const shaped = shapePost(post, relToAuthor) as Post;

            shaped.enableToView = await getEnableToViewForOwner(authorId);
            shaped.ownerConfiguration = await getConfig(authorId);

            (shaped as any).wallEntryMeta = {
                id: entry.id,
                type: entry.type,
                createdAt: entry.createdAt.toISOString(), // auditoría
                eventAt: entry.eventAt.toISOString(), // timeline

                wallUserId: entry.wallUserId,
                wallUser: entry.wallUser ?? null,
                actorUserId: entry.actorUserId,
                actorUser: entry.actorUser ?? null,

                showInFeed: entry.showInFeed,
                visibility: entryVisibility,
                active: entry.active ?? 1,
            } satisfies WallEntryMeta;

            if (shaped.enableToView?.posts) {
                // ✅ dedupe "al push": recién acá marcamos el post como visto
                seenPostIds.add(postId);

                // shareCount lo completamos después con 1 query agregada
                shaped.shareCount = 0;

                results.push(shaped);
            }

            if (results.length >= pageSize) break;
        }

        if (entries.length < CHUNK_SIZE && results.length < pageSize) {
            hitEnd = true;
            break;
        }
    }

    // ✅ shareCount global activo (type SHARED, active=1) - 1 query agregada por request
    if (results.length > 0) {
        const postIds = results.map((p) => p.id);

        const shares = await prisma.wallEntry.groupBy({
            by: ["postId"],
            where: {
                active: 1,
                type: "SHARED",
                postId: { in: postIds },
            },
            _count: { _all: true },
        });

        const shareCountMap = new Map<number, number>(shares.map((s) => [s.postId, s._count._all]));

        for (const post of results) {
            post.shareCount = shareCountMap.get(post.id) ?? 0;
        }
    }

    return NextResponse.json({
        allPosts: results,
        nextCursor: hitEnd ? null : encodeCursor(currentCursor),
    });
}