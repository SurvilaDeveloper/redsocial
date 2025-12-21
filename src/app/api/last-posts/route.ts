// app/api/last-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

type PostReaction = "LIKE" | "UNLIKE" | null;
type ImageReaction = "LIKE" | "UNLIKE" | null;

export async function GET(req: NextRequest) {
    const session = await auth();
    const viewerId = session?.user?.id ? Number(session.user.id) : null;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);

    const pageSize = 4;       // 👈 podés ajustar esto
    const MAX_LOOPS = 5;
    const CHUNK_SIZE = 20;
    let skip = (page - 1) * pageSize;

    const results: any[] = [];

    for (let loop = 0; loop < MAX_LOOPS && results.length < pageSize; loop++) {
        const chunk = await prisma.post.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: CHUNK_SIZE,
            include: {
                images: {
                    where: { active: 1 },
                    orderBy: { index: "asc" },
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
                user: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        imagePublicId: true,
                    },
                },
                _count: {
                    select: {
                        post_like: true,
                        post_unlike: true,
                        post_comment: true, // 👈 sólo el conteo de comentarios
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
        });

        if (chunk.length === 0) break;

        skip += chunk.length;

        const ownerIds = Array.from(new Set(chunk.map((p) => p.user_id)));

        const [viewerFollowing, viewerFriends] = viewerId
            ? await Promise.all([
                prisma.follow.findMany({
                    where: {
                        followerId: viewerId,
                        followingId: { in: ownerIds },
                    },
                    select: { followingId: true },
                }),
                prisma.friendship.findMany({
                    where: {
                        friend_response: 1,
                        OR: [
                            {
                                friend_one: viewerId,
                                friend_two: { in: ownerIds },
                            },
                            {
                                friend_two: viewerId,
                                friend_one: { in: ownerIds },
                            },
                        ],
                    },
                    select: { friend_one: true, friend_two: true },
                }),
            ])
            : [[], []];

        const followingSet = new Set(
            (viewerFollowing as any[]).map((r) => r.followingId)
        );

        const friendSet = new Set<number>();
        for (const fr of viewerFriends as any[]) {
            const other =
                fr.friend_one === viewerId ? fr.friend_two : fr.friend_one;
            friendSet.add(other);
        }

        for (const rawPost of chunk as any[]) {
            const post = rawPost as any;

            const isOwner = viewerId !== null && viewerId === post.user_id;
            const isLogged = viewerId !== null;

            const following = viewerId
                ? followingSet.has(post.user_id)
                : false;
            const isFriend = viewerId ? friendSet.has(post.user_id) : false;
            const isFollower = false;

            let canView = false;
            if (isOwner) canView = true;
            else if (post.visibility === 1) canView = true;
            else if (post.visibility === 2) canView = isLogged;
            else if (post.visibility === 3)
                canView = isLogged && (isFriend || following);
            else if (post.visibility === 4) canView = isLogged && isFriend;

            if ((post.active ?? 1) !== 1) continue;
            if (!canView) continue;

            const likesCount: number = post._count?.post_like ?? 0;
            const unlikesCount: number = post._count?.post_unlike ?? 0;
            const commentsCount: number = post._count?.post_comment ?? 0;

            let userReaction: PostReaction = null;
            if (viewerId) {
                const liked =
                    Array.isArray(post.post_like) &&
                    post.post_like.length > 0;
                const unliked =
                    Array.isArray(post.post_unlike) &&
                    post.post_unlike.length > 0;

                if (liked) userReaction = "LIKE";
                else if (unliked) userReaction = "UNLIKE";
            }

            const relations = {
                following,
                isFollower,
                isFriend,
                likesCount,
                unlikesCount,
                userReaction,
            };

            const imagesWithReactions = (post.images ?? []).map((img: any) => {
                const imgLikes: number = img._count?.image_like ?? 0;
                const imgUnlikes: number = img._count?.image_unlike ?? 0;

                let imgUserReaction: ImageReaction = null;
                if (viewerId) {
                    const liked =
                        Array.isArray(img.image_like) &&
                        img.image_like.length > 0;
                    const unliked =
                        Array.isArray(img.image_unlike) &&
                        img.image_unlike.length > 0;

                    if (liked) imgUserReaction = "LIKE";
                    else if (unliked) imgUserReaction = "UNLIKE";
                }

                return {
                    id: img.id,
                    post_id: img.post_id,
                    imageUrl: img.imageUrl,
                    imagePublicId: img.imagePublicId,
                    index: img.index,
                    active: img.active ?? 1,
                    likesCount: imgLikes,
                    unlikesCount: imgUnlikes,
                    userReaction: imgUserReaction,
                };
            });

            results.push({
                ...post,
                images: imagesWithReactions,
                post_comment: [],              // 👈 en el feed no mandamos comentarios
                commentsCount,                 // 👈 nuevo campo
                userData: {
                    id: post.user?.id,
                    name: post.user?.name,
                    imageUrl: post.user?.imageUrl,
                    imagePublicId: post.user?.imagePublicId,
                },
                relations,
            });

            if (results.length >= pageSize) break;
        }
    }

    return NextResponse.json({ allPosts: results });
}

