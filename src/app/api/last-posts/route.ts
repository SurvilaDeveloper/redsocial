// app/api/last-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    const viewerId = session?.user?.id ? Number(session.user.id) : null;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);

    const pageSize = 2;

    // Para compensar el filtrado por visibility
    const MAX_LOOPS = 5; // evita loops infinitos
    const CHUNK_SIZE = 20; // overfetch
    let skip = (page - 1) * pageSize;

    const results: any[] = [];

    for (let loop = 0; loop < MAX_LOOPS && results.length < pageSize; loop++) {
        // 1) traer posts + user + images + comments + responses (1 query)
        const chunk = await prisma.post.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: CHUNK_SIZE,
            include: {
                images: {
                    where: { active: 1 },
                    orderBy: { index: "asc" },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        imagePublicId: true,
                    },
                },

                // ✅ comentarios del post + respuestas + user
                post_comment: {
                    where: { active: 1 },
                    orderBy: { createdAt: "desc" },
                    include: {
                        user: {
                            select: { id: true, name: true, imageUrl: true },
                        },
                        responses: {
                            where: { active: 1 },
                            orderBy: { createdAt: "asc" },
                            include: {
                                user: {
                                    select: { id: true, name: true, imageUrl: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (chunk.length === 0) break;

        skip += chunk.length;

        // ids de dueños en este chunk
        const ownerIds = Array.from(new Set(chunk.map((p) => p.user_id)));

        // 2) relaciones en batch (2 queries) solo si hay viewer logueado
        const [viewerFollowing, viewerFriends] = viewerId
            ? await Promise.all([
                prisma.follow.findMany({
                    where: { followerId: viewerId, followingId: { in: ownerIds } },
                    select: { followingId: true },
                }),
                prisma.friendship.findMany({
                    where: {
                        friend_response: 1,
                        OR: [
                            { friend_one: viewerId, friend_two: { in: ownerIds } },
                            { friend_two: viewerId, friend_one: { in: ownerIds } },
                        ],
                    },
                    select: { friend_one: true, friend_two: true },
                }),
            ])
            : [[], []];

        const followingSet = new Set(viewerFollowing.map((r) => r.followingId));

        // amigos: el otro id (distinto del viewer) es el owner
        const friendSet = new Set<number>();
        for (const fr of viewerFriends as any[]) {
            const other = fr.friend_one === viewerId ? fr.friend_two : fr.friend_one;
            friendSet.add(other);
        }

        // 3) armar posts con relations + filtrar por visibility
        for (const post of chunk as any[]) {
            const isOwner = viewerId !== null && viewerId === post.user_id;
            const isLogged = viewerId !== null;

            const following = viewerId ? followingSet.has(post.user_id) : false;
            const isFriend = viewerId ? friendSet.has(post.user_id) : false;

            // OJO: en tu código "isFollower" era "el otro te sigue"
            // Para eso necesitarías otra query batch inversa.
            const isFollower = false;

            // --- reglas visibility ---
            let canView = false;
            if (isOwner) canView = true;
            else if (post.visibility === 1) canView = true;
            else if (post.visibility === 2) canView = isLogged;
            else if (post.visibility === 3) canView = isLogged && (isFriend || following);
            else if (post.visibility === 4) canView = isLogged && isFriend;

            // además, solo activos
            if ((post.active ?? 1) !== 1) continue;

            if (!canView) continue;

            results.push({
                ...post,
                userData: {
                    id: post.user?.id,
                    name: post.user?.name,
                    imageUrl: post.user?.imageUrl,
                    imagePublicId: post.user?.imagePublicId,
                },
                relations: {
                    following,
                    isFollower,
                    isFriend,
                },
            });

            if (results.length >= pageSize) break;
        }
    }

    return NextResponse.json({ allPosts: results });
}
