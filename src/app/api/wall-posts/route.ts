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

export async function GET(req: NextRequest) {
    const session = await auth();
    const viewerId = session?.user?.id != null ? Number(session.user.id) : null;

    const { searchParams } = new URL(req.url);

    const wallUserIdStr = searchParams.get("wall_user_id");
    const wallUserId = wallUserIdStr ? Number(wallUserIdStr) : 0;

    const pageStr = searchParams.get("page");
    const page = pageStr ? Number(pageStr) : 1;

    const pageSize = 4;

    // chunking para llenar pageSize a pesar de filtros de visibilidad
    const CHUNK_SIZE = 20;
    const MAX_LOOPS = 5;

    if (!wallUserId || Number.isNaN(wallUserId)) {
        return NextResponse.json({ error: "wall_user_id is required" }, { status: 400 });
    }

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
            : areIEnableToView(
                wallConfig,
                viewerId !== null,
                isFriendOfWallOwner,
                wallSocial.following
            );

    // ✅ para UI: mostrar PostFormWall solo si puede publicar
    const canPublishOnWall = isWallOwner || isFriendOfWallOwner;

    if (!wallEnableToView.posts) {
        return NextResponse.json({
            allPosts: [],
            enableToView: wallEnableToView,
            wallConfiguration: wallConfig,
            canPublishOnWall,
        });
    }

    /* =========================================================
       2) Caches por request (social/config/enable por AUTOR)
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
       3) Leer WallEntry feed del muro (PUBLISHED + SHARED)
          y llenar pageSize con chunking
    ========================================================= */

    // ✅ IMPORTANTE: paginar por WallEntry, no por pageSize
    let skip = (page - 1) * CHUNK_SIZE;
    const results: Post[] = [];

    for (let loop = 0; loop < MAX_LOOPS && results.length < pageSize; loop++) {
        const entries = await prisma.wallEntry.findMany({
            where: {
                wallUserId,
                active: 1,
                // ✅ filtro temprano por post
                post: {
                    // OJO: si querés que el dueño del muro vea borrados,
                    // este filtro tiene que relajarse. Por ahora lo dejamos “limpio”
                    // y mantenemos la lógica extra más abajo.
                    active: 1,
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: CHUNK_SIZE,
            include: {
                wallUser: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        imagePublicId: true,
                        image: true
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
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                                imagePublicId: true,
                                image: true,
                            },
                        },
                        _count: {
                            select: { post_like: true, post_unlike: true, post_comment: true },
                        },
                        ...(viewerId && {
                            post_like: { where: { userId: viewerId }, select: { id: true } },
                            post_unlike: { where: { userId: viewerId }, select: { id: true } },
                        }),
                    },
                },
            },
        });

        if (entries.length === 0) break;
        skip += entries.length;

        for (const entry of entries) {
            const post = entry.post;
            if (!post) continue;

            const isPostOwner = viewerId === post.authorId;

            // deletedAt: visible solo al autor o dueño del muro
            if (post.deletedAt && !(isWallOwner || isPostOwner)) continue;

            // visibilidad del post según relación viewer <-> autor del post (no del muro)
            const social = await getSocialForAuthor(post.authorId);

            const allowed = canViewPost((post.visibility ?? 1) as PostVisibility, {
                isOwner: viewerId === post.authorId,
                isLogged: viewerId !== null,
                isFriend: social.relState === RelationshipState.FRIENDS,
                following: social.following,
            });
            if (!allowed) continue;

            const shaped = shapePost(post, social) as Post;

            shaped.enableToView = await getEnableForAuthor(post.authorId);
            shaped.ownerConfiguration = await getConfigForAuthor(post.authorId);

            // metadata del wallEntry para UI: "Compartido por X" / "Publicado por X en el muro"
            (shaped as any).wallEntryMeta = {
                id: entry.id,
                type: entry.type,
                createdAt: entry.createdAt.toISOString(),
                wallUserId: entry.wallUserId,
                wallUser: entry.wallUser,
                actorUserId: entry.actorUserId,
                actorUser: entry.actorUser,
                showInFeed: entry.showInFeed,
            };


            results.push(shaped);
            if (results.length >= pageSize) break;
        }
    }

    return NextResponse.json({
        allPosts: results,
        enableToView: wallEnableToView,
        wallConfiguration: wallConfig,
        canPublishOnWall,
    });
}
