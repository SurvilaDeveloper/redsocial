// app/api/wall-posts/route.ts
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

export const runtime = "nodejs";

/* =========================================================
   Cursor helpers (ahora por eventAt, id)
========================================================= */

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

    const wallUserIdStr = searchParams.get("wall_user_id");
    const wallUserId = wallUserIdStr ? Number(wallUserIdStr) : 0;

    if (!wallUserId || Number.isNaN(wallUserId)) {
        return NextResponse.json({ error: "wall_user_id is required" }, { status: 400 });
    }

    const cursor = decodeCursor(searchParams.get("cursor"));

    const pageSize = 4;

    // chunking para llenar pageSize a pesar de filtros (permisos/visibilidad)
    const CHUNK_SIZE = 20;
    const MAX_LOOPS = 5;

    /* =========================================================
       1) Permisos del muro (corte temprano)
    ========================================================= */

    const wallConfig: Configuration | null = await getUserConfiguration(wallUserId);

    const wallSocial: SocialRelations =
        viewerId != null
            ? await getSocialRelations(viewerId, wallUserId)
            : { following: false, isFollower: false, relState: RelationshipState.NONE };

    const isWallOwner = viewerId === wallUserId;
    const isFriendOfWallOwner = wallSocial.relState === RelationshipState.FRIENDS;

    const wallEnableToView =
        isWallOwner
            ? myOwnPermissions
            : areIEnableToView(wallConfig, viewerId !== null, isFriendOfWallOwner, wallSocial.following);

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

    /* =========================================================
       2) Caches por request (por AUTOR)
    ========================================================= */

    const socialByAuthor = new Map<number, SocialRelations>();
    const configByAuthor = new Map<number, Configuration | null>();
    const enableByAuthor = new Map<number, EnableToView>();

    async function getSocialForAuthor(authorId: number): Promise<SocialRelations> {
        if (viewerId == null) {
            return { following: false, isFollower: false, relState: RelationshipState.NONE };
        }
        const cached = socialByAuthor.get(authorId);
        if (cached) return cached;
        const s = await getSocialRelations(viewerId, authorId);
        socialByAuthor.set(authorId, s);
        return s;
    }

    async function getConfigForAuthor(authorId: number): Promise<Configuration | null> {
        if (configByAuthor.has(authorId)) return configByAuthor.get(authorId) ?? null;
        const c = await getUserConfiguration(authorId);
        configByAuthor.set(authorId, c);
        return c ?? null;
    }

    async function getEnableForAuthor(authorId: number): Promise<EnableToView> {
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

    /* =========================================================
       3) Leer WallEntry del muro con cursor (eventAt,id) + chunking
          - Cursor avanza por ENTRIES consumidas
          - NO filtramos active:1 en DB, porque el dueño del muro puede ver active=0
    ========================================================= */

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
                wallUserId,
                // ✅ NO active: 1 acá
                ...whereCursor,
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
            // ✅ cursor avanza SIEMPRE por WallEntry consumida
            const ev = (entry as any)?.eventAt instanceof Date ? (entry as any).eventAt : entry.createdAt; // fallback defensivo
            currentCursor = { eventAt: ev.toISOString(), id: entry.id };

            const post = entry.post;
            if (!post) continue;

            const isPostOwner = viewerId === post.authorId;

            // =====================================================
            // A) Filtro por WallEntry.active
            // - si está inactive y NO sos dueño del muro => no se ve
            // =====================================================
            const entryActive = typeof entry.active === "number" ? entry.active : 1;
            if (entryActive !== 1 && !isWallOwner) continue;

            // =====================================================
            // B) Filtro por WallEntry.visibility (viewer ↔ dueño del muro)
            // =====================================================
            const entryVisibility = normalizeVisibility((entry as any).visibility ?? 1);
            const canViewEntry = canViewWallEntry(entryVisibility, {
                isOwner: isWallOwner,
                isLogged: viewerId !== null,
                isFriend: isFriendOfWallOwner,
                following: wallSocial.following,
            });
            if (!canViewEntry) continue;

            // =====================================================
            // C) Reglas especiales del POST (active/deleted)
            // - si post inactive => solo autor o dueño del muro
            // - si deletedAt => solo autor o dueño del muro
            // =====================================================
            if ((post.active ?? 1) !== 1 && !(isWallOwner || isPostOwner)) continue;
            if (post.deletedAt && !(isWallOwner || isPostOwner)) continue;

            // =====================================================
            // D) Post.visibility (viewer ↔ autor)
            // =====================================================
            const social = await getSocialForAuthor(post.authorId);

            const allowedPostVisibility = canViewPost((post.visibility ?? 1) as PostVisibility, {
                isOwner: viewerId === post.authorId,
                isLogged: viewerId !== null,
                isFriend: social.relState === RelationshipState.FRIENDS,
                following: social.following,
            });
            if (!allowedPostVisibility) continue;

            // =====================================================
            // E) Shape + attach meta
            // =====================================================
            const shaped = shapePost(post, social) as Post;

            shaped.enableToView = await getEnableForAuthor(post.authorId);
            shaped.ownerConfiguration = await getConfigForAuthor(post.authorId);

            (shaped as any).wallEntryMeta = {
                id: entry.id,
                type: entry.type,
                createdAt: entry.createdAt.toISOString(),
                eventAt: ev.toISOString(), // ✅ NUEVO
                wallUserId: entry.wallUserId,
                wallUser: entry.wallUser,
                actorUserId: entry.actorUserId,
                actorUser: entry.actorUser,
                showInFeed: entry.showInFeed,

                visibility: entryVisibility,
                active: entryActive,
            };

            results.push(shaped);
            if (results.length >= pageSize) break;
        }

        if (entries.length < CHUNK_SIZE && results.length < pageSize) {
            hitEnd = true;
            break;
        }
    }

    return NextResponse.json({
        allPosts: results,
        enableToView: wallEnableToView,
        wallConfiguration: wallConfig,
        canPublishOnWall,
        nextCursor: hitEnd ? null : encodeCursor(currentCursor),
    });
}