// src/app/api/wall-posts/route.ts
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
import {
    canViewWallEntry,
    normalizeVisibility,
} from "@/lib/wall-entry-visibility";

export const runtime = "nodejs";

type CursorPayload = {
    eventAt: string;
    id: number;
};

function decodeCursor(raw: string | null): CursorPayload | null {
    if (!raw) return null;

    try {
        const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
        const json = Buffer.from(b64, "base64").toString("utf8");
        const obj = JSON.parse(json);

        if (!obj?.eventAt || typeof obj?.id !== "number") return null;

        return {
            eventAt: String(obj.eventAt),
            id: Number(obj.id),
        };
    } catch {
        return null;
    }
}

function encodeCursor(payload: CursorPayload | null): string | null {
    if (!payload) return null;

    const json = JSON.stringify(payload);
    const b64 = Buffer.from(json, "utf8").toString("base64");

    return b64
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

export async function GET(req: NextRequest) {
    const session = await auth();
    const viewerId =
        session?.user?.id != null ? Number(session.user.id) : null;

    const { searchParams } = new URL(req.url);

    const wallUserIdStr = searchParams.get("wall_user_id");
    const wallUserId = wallUserIdStr ? Number(wallUserIdStr) : 0;

    if (!wallUserId || Number.isNaN(wallUserId)) {
        return NextResponse.json(
            { error: "wall_user_id is required" },
            { status: 400 }
        );
    }

    const cursor = decodeCursor(searchParams.get("cursor"));
    const isFirstPage = cursor == null;

    const pageSize = 4;
    const CHUNK_SIZE = 20;
    const MAX_LOOPS = 5;

    const wallConfig: Configuration | null =
        await getUserConfiguration(wallUserId);

    const wallSocial: SocialRelations =
        viewerId != null
            ? await getSocialRelations(viewerId, wallUserId)
            : {
                following: false,
                isFollower: false,
                relState: RelationshipState.NONE,
            };

    const isWallOwner = viewerId === wallUserId;
    const isFriendOfWallOwner =
        wallSocial.relState === RelationshipState.FRIENDS;

    const wallEnableToView = isWallOwner
        ? myOwnPermissions
        : areIEnableToView(
            wallConfig,
            viewerId !== null,
            isFriendOfWallOwner,
            wallSocial.following
        );

    const canPublishOnWall = isWallOwner || isFriendOfWallOwner;

    if (!wallEnableToView.posts) {
        return NextResponse.json({
            allPosts: [],
            enableToView: wallEnableToView,
            wallConfiguration: wallConfig,
            canPublishOnWall,
            nextCursor: null,
        });
    }

    const socialByAuthor = new Map<number, SocialRelations>();
    const configByAuthor = new Map<number, Configuration | null>();
    const enableByAuthor = new Map<number, EnableToView>();

    async function getSocialForAuthor(
        authorId: number
    ): Promise<SocialRelations> {
        if (viewerId == null) {
            return {
                following: false,
                isFollower: false,
                relState: RelationshipState.NONE,
            };
        }

        const cached = socialByAuthor.get(authorId);
        if (cached) return cached;

        const social = await getSocialRelations(viewerId, authorId);
        socialByAuthor.set(authorId, social);

        return social;
    }

    async function getConfigForAuthor(
        authorId: number
    ): Promise<Configuration | null> {
        if (configByAuthor.has(authorId)) {
            return configByAuthor.get(authorId) ?? null;
        }

        const config = await getUserConfiguration(authorId);
        configByAuthor.set(authorId, config);

        return config ?? null;
    }

    async function getEnableForAuthor(
        authorId: number
    ): Promise<EnableToView> {
        const cached = enableByAuthor.get(authorId);
        if (cached) return cached;

        if (viewerId === authorId) {
            enableByAuthor.set(authorId, myOwnPermissions);
            return myOwnPermissions;
        }

        const social = await getSocialForAuthor(authorId);
        const config = await getConfigForAuthor(authorId);

        const enable = areIEnableToView(
            config,
            viewerId !== null,
            social.relState === RelationshipState.FRIENDS,
            social.following
        );

        enableByAuthor.set(authorId, enable);

        return enable;
    }

    const entryInclude = {
        wallUser: {
            select: {
                id: true,
                name: true,
                imageUrl: true,
                imagePublicId: true,
                image: true,
            },
        },
        actorUser: {
            select: {
                id: true,
                name: true,
                imageUrl: true,
                imagePublicId: true,
                image: true,
            },
        },
        post: {
            include: {
                images: {
                    where: { active: 1 },
                    orderBy: { index: "asc" as const },
                    include: {
                        _count: {
                            select: {
                                image_like: true,
                                image_unlike: true,
                            },
                        },
                        ...(viewerId && {
                            image_like: {
                                where: { userId: viewerId },
                                select: { id: true },
                            },
                            image_unlike: {
                                where: { userId: viewerId },
                                select: { id: true },
                            },
                        }),
                    },
                },
                author: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        imagePublicId: true,
                        image: true,
                    },
                },
                _count: {
                    select: {
                        post_like: true,
                        post_unlike: true,
                        post_comment: true,
                    },
                },
                ...(viewerId && {
                    post_like: {
                        where: { userId: viewerId },
                        select: { id: true },
                    },
                    post_unlike: {
                        where: { userId: viewerId },
                        select: { id: true },
                    },
                }),
            },
        },
    };

    async function shapeEntry(entry: any): Promise<Post | null> {
        const post = entry.post;
        if (!post) return null;

        const isPostOwner = viewerId === post.authorId;

        const entryActive =
            typeof entry.active === "number" ? entry.active : 1;

        if (entryActive !== 1 && !isWallOwner) {
            return null;
        }

        const entryVisibility = normalizeVisibility(
            entry.visibility ?? 1
        );

        const canViewEntry = canViewWallEntry(entryVisibility, {
            isOwner: isWallOwner,
            isLogged: viewerId !== null,
            isFriend: isFriendOfWallOwner,
            following: wallSocial.following,
        });

        if (!canViewEntry) return null;

        if (
            (post.active ?? 1) !== 1 &&
            !(isWallOwner || isPostOwner)
        ) {
            return null;
        }

        if (
            post.deletedAt &&
            !(isWallOwner || isPostOwner)
        ) {
            return null;
        }

        const social = await getSocialForAuthor(post.authorId);

        const allowedPostVisibility = canViewPost(
            (post.visibility ?? 1) as PostVisibility,
            {
                isOwner: viewerId === post.authorId,
                isLogged: viewerId !== null,
                isFriend:
                    social.relState === RelationshipState.FRIENDS,
                following: social.following,
            }
        );

        if (!allowedPostVisibility) return null;

        const shaped = shapePost(post, social) as Post;

        shaped.enableToView =
            await getEnableForAuthor(post.authorId);

        shaped.ownerConfiguration =
            await getConfigForAuthor(post.authorId);

        const eventAt =
            entry.eventAt instanceof Date
                ? entry.eventAt
                : entry.createdAt;

        (shaped as any).wallEntryMeta = {
            id: entry.id,
            type: entry.type,
            createdAt: entry.createdAt.toISOString(),
            eventAt: eventAt.toISOString(),
            wallUserId: entry.wallUserId,
            wallUser: entry.wallUser,
            actorUserId: entry.actorUserId,
            actorUser: entry.actorUser,
            showInFeed: entry.showInFeed,
            visibility: entryVisibility,
            active: entryActive,
        };

        if (!shaped.enableToView?.posts) {
            return null;
        }

        return shaped;
    }

    /*
     * PINNED es una capa superior del muro:
     * - se consulta siempre para saber qué posts debe suprimir del timeline;
     * - solo se devuelve visualmente en la primera página;
     * - nunca consume el cursor del timeline.
     */
    const pinEntries = await prisma.wallEntry.findMany({
        where: {
            wallUserId,
            type: "PINNED",
            ...(isWallOwner ? {} : { active: 1 }),
        },
        orderBy: [
            { eventAt: "desc" },
            { id: "desc" },
        ],
        include: entryInclude,
    });

    const pinnedResults: Post[] = [];
    const pinnedVisiblePostIds = new Set<number>();

    for (const entry of pinEntries) {
        const shaped = await shapeEntry(entry);

        // Si este viewer no puede ver el pin, NO ocultamos la entrada
        // normal del timeline para él.
        if (!shaped) continue;

        pinnedVisiblePostIds.add(entry.postId);

        if (isFirstPage) {
            pinnedResults.push(shaped);
        }
    }

    const timelineResults: Post[] = [];
    const seenTimelinePostIds = new Set<number>();

    let hitEnd = false;
    let currentCursor: CursorPayload | null = cursor;

    for (
        let loop = 0;
        loop < MAX_LOOPS && timelineResults.length < pageSize;
        loop++
    ) {
        const whereCursor =
            currentCursor == null
                ? {}
                : {
                    OR: [
                        {
                            eventAt: {
                                lt: new Date(
                                    currentCursor.eventAt
                                ),
                            },
                        },
                        {
                            eventAt: new Date(
                                currentCursor.eventAt
                            ),
                            id: {
                                lt: currentCursor.id,
                            },
                        },
                    ],
                };

        const entries = await prisma.wallEntry.findMany({
            where: {
                wallUserId,
                type: {
                    not: "PINNED",
                },
                ...whereCursor,
            },
            orderBy: [
                { eventAt: "desc" },
                { id: "desc" },
            ],
            take: CHUNK_SIZE,
            include: entryInclude,
        });

        if (entries.length === 0) {
            hitEnd = true;
            break;
        }

        for (const entry of entries) {
            const eventAt =
                entry.eventAt instanceof Date
                    ? entry.eventAt
                    : entry.createdAt;

            // El cursor avanza por toda entrada de timeline consumida,
            // incluso cuando después la filtramos.
            currentCursor = {
                eventAt: eventAt.toISOString(),
                id: entry.id,
            };

            if (pinnedVisiblePostIds.has(entry.postId)) {
                continue;
            }

            if (seenTimelinePostIds.has(entry.postId)) {
                continue;
            }

            const shaped = await shapeEntry(entry);
            if (!shaped) continue;

            seenTimelinePostIds.add(entry.postId);
            timelineResults.push(shaped);

            if (timelineResults.length >= pageSize) {
                break;
            }
        }

        if (
            entries.length < CHUNK_SIZE &&
            timelineResults.length < pageSize
        ) {
            hitEnd = true;
            break;
        }
    }

    const allPosts = [
        ...pinnedResults,
        ...timelineResults,
    ];

    // Conservamos el contador global de shares para la toolbar.
    if (allPosts.length > 0) {
        const postIds = Array.from(
            new Set(allPosts.map((post) => post.id))
        );

        const shares = await prisma.wallEntry.groupBy({
            by: ["postId"],
            where: {
                active: 1,
                type: "SHARED",
                postId: {
                    in: postIds,
                },
            },
            _count: {
                _all: true,
            },
        });

        const shareCountMap = new Map<number, number>(
            shares.map((row) => [
                row.postId,
                row._count._all,
            ])
        );

        for (const post of allPosts) {
            post.shareCount =
                shareCountMap.get(post.id) ?? 0;
        }
    }

    return NextResponse.json({
        allPosts,
        enableToView: wallEnableToView,
        wallConfiguration: wallConfig,
        canPublishOnWall,
        nextCursor:
            hitEnd
                ? null
                : encodeCursor(currentCursor),
    });
}
