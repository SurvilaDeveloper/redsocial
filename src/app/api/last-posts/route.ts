// app/api/last-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

import { shapePost } from "@/lib/shape-post";
import { canViewPost } from "@/lib/post-visibility";
import { getSocialRelations } from "@/lib/social-relations";

import { getUserConfiguration } from "@/lib/configuration/getUserConfiguration";
import { areIEnableToView, myOwnPermissions } from "@/lib/permissions";

import type { Configuration } from "@/types/configuration";

export async function GET(req: NextRequest) {
    const session = await auth();
    const viewerId = session?.user?.id ? Number(session.user.id) : null;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);

    const pageSize = 4;

    // Importante: como después filtramos por permisos, usamos chunking para "llenar" pageSize.
    const CHUNK_SIZE = 30;
    const MAX_LOOPS = 6;

    // ✅ paginar por WallEntry (estable), no por Post
    let skip = (page - 1) * CHUNK_SIZE;
    const results: Post[] = [];

    // ✅ caches por request
    const socialCache = new Map<number, SocialRelations>();
    const configCache = new Map<number, Configuration | null>();
    const enableToViewCache = new Map<number, EnableToView>();

    async function getSocial(ownerId: number): Promise<SocialRelations> {
        const cached = socialCache.get(ownerId);
        if (cached) return cached;
        const social = await getSocialRelations(viewerId, ownerId);
        socialCache.set(ownerId, social);
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

        const social = await getSocial(ownerId);
        const config = await getConfig(ownerId);

        const enable = areIEnableToView(
            config,
            viewerId !== null,
            social.relState === 8,
            social.following
        );

        enableToViewCache.set(ownerId, enable);
        return enable;
    }

    for (let loop = 0; loop < MAX_LOOPS && results.length < pageSize; loop++) {
        const entries = await prisma.wallEntry.findMany({
            where: {
                active: 1,
                showInFeed: true, // ✅ la regla clave
                // si querés por ahora SOLO publicaciones "normales" en feed:
                type: "PUBLISHED",
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: CHUNK_SIZE,
            include: {
                // ✅ dueño del muro (para header "Publicado en el muro de X")
                wallUser: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        imagePublicId: true,
                        image: true,
                    },
                },
                // opcional: por si después querés mostrar "Compartido por X"
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
                                _count: {
                                    select: { image_like: true, image_unlike: true },
                                },
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
                            select: {
                                post_like: true,
                                post_unlike: true,
                                post_comment: true,
                            },
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

            // hard/soft filters
            if ((post.active ?? 1) !== 1) continue;
            if (post.deletedAt) continue;

            const ownerId = post.authorId;

            // permisos del post según relación viewer <-> author (no wallUser)
            const social = await getSocial(ownerId);

            const canView = canViewPost((post.visibility ?? 1) as PostVisibility, {
                isOwner: viewerId === ownerId,
                isLogged: viewerId !== null,
                isFriend: social.relState === 8,
                following: social.following,
            });

            if (!canView) continue;

            const shaped = shapePost(post, social) as Post;

            // ✅ enableToView por owner, incluido en el post
            shaped.enableToView = await getEnableToViewForOwner(ownerId);

            // ✅ enviar también la configuración del dueño (cacheada)
            shaped.ownerConfiguration = await getConfig(ownerId);

            // ✅ meta del wall entry (útil para key estable, y futuro "shared/published")
            (shaped as any).wallEntryMeta = {
                id: entry.id,
                type: entry.type,
                createdAt: entry.createdAt.toISOString(),
                wallUserId: entry.wallUserId,
                wallUser: entry.wallUser ?? null,
                actorUserId: entry.actorUserId,
                actorUser: entry.actorUser ?? null,
                showInFeed: entry.showInFeed,
            };

            // Tu condición final (por las dudas)
            if (shaped.enableToView.posts) {
                results.push(shaped);
            }

            if (results.length >= pageSize) break;
        }
    }

    return NextResponse.json({ allPosts: results });
}
