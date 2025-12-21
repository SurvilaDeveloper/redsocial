// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

type PostReaction = "LIKE" | "UNLIKE" | null;
type CommentReaction = "LIKE" | "UNLIKE" | null;
type ImageReaction = "LIKE" | "UNLIKE" | null;

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const viewerId = session?.user?.id ? Number(session.user.id) : null;

    const { id } = await context.params;
    const postId = Number(id);

    if (!Number.isFinite(postId)) {
        return NextResponse.json(
            { error: "ID de post inválido" },
            { status: 400 }
        );
    }

    const post = await prisma.post.findUnique({
        where: { id: postId },
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
            post_comment: {
                where: { active: 1 },
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                            imagePublicId: true,
                        },
                    },
                    responses: {
                        where: { active: 1 },
                        orderBy: { createdAt: "asc" },
                        include: {
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
                                    likes: true,
                                    unlikes: true,
                                },
                            },
                            ...(viewerId && {
                                likes: {
                                    where: { userId: viewerId },
                                    select: { id: true },
                                },
                                unlikes: {
                                    where: { userId: viewerId },
                                    select: { id: true },
                                },
                            }),
                        },
                    },

                    _count: {
                        select: {
                            likes: true,
                            unlikes: true,
                        },
                    },
                    ...(viewerId && {
                        likes: {
                            where: { userId: viewerId },
                            select: { id: true },
                        },
                        unlikes: {
                            where: { userId: viewerId },
                            select: { id: true },
                        },
                    }),
                },
            },
            _count: {
                select: {
                    post_like: true,
                    post_unlike: true,
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

    if (!post) {
        return NextResponse.json(
            { error: "Post no encontrado" },
            { status: 404 }
        );
    }

    if ((post.active ?? 1) !== 1) {
        return NextResponse.json(
            { error: "Post no disponible" },
            { status: 404 }
        );
    }

    // relaciones viewer <-> dueño
    const ownerId = post.user_id;

    let following = false;
    let isFriend = false;
    const isLogged = viewerId !== null;
    const isOwner = viewerId !== null && viewerId === ownerId;

    if (viewerId) {
        const [viewerFollowing, viewerFriends] = await Promise.all([
            prisma.follow.findMany({
                where: { followerId: viewerId, followingId: ownerId },
                select: { followingId: true },
            }),
            prisma.friendship.findMany({
                where: {
                    friend_response: 1,
                    OR: [
                        { friend_one: viewerId, friend_two: ownerId },
                        { friend_two: viewerId, friend_one: ownerId },
                    ],
                },
                select: { friend_one: true, friend_two: true },
            }),
        ]);

        following = viewerFollowing.length > 0;
        if (viewerFriends.length > 0) {
            isFriend = true;
        }
    }

    const isFollower = false;

    // visibility
    let canView = false;
    if (isOwner) canView = true;
    else if (post.visibility === 1) canView = true;
    else if (post.visibility === 2) canView = isLogged;
    else if (post.visibility === 3) canView = isLogged && (isFriend || following);
    else if (post.visibility === 4) canView = isLogged && isFriend;

    if (!canView) {
        return NextResponse.json(
            { error: "No tienes permiso para ver este post" },
            { status: 403 }
        );
    }

    // Reacciones del post
    const postAny = post as any;

    const likesCount: number = postAny._count?.post_like ?? 0;
    const unlikesCount: number = postAny._count?.post_unlike ?? 0;

    let userReaction: PostReaction = null;
    if (viewerId) {
        const liked =
            Array.isArray(postAny.post_like) &&
            postAny.post_like.length > 0;
        const unliked =
            Array.isArray(postAny.post_unlike) &&
            postAny.post_unlike.length > 0;

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

    // Imágenes con reacciones
    const imagesWithReactions = (post.images ?? []).map((img) => {
        const imgAny = img as any;

        const imgLikes: number = imgAny._count?.image_like ?? 0;
        const imgUnlikes: number = imgAny._count?.image_unlike ?? 0;

        let imgUserReaction: ImageReaction = null;
        if (viewerId) {
            const liked =
                Array.isArray(imgAny.image_like) &&
                imgAny.image_like.length > 0;
            const unliked =
                Array.isArray(imgAny.image_unlike) &&
                imgAny.image_unlike.length > 0;

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

    // Comentarios con reacciones
    const commentsWithReactions = (post.post_comment ?? []).map((c) => {
        const cAny = c as any;

        const cLikes: number = cAny._count?.likes ?? 0;
        const cUnlikes: number = cAny._count?.unlikes ?? 0;

        let cUserReaction: CommentReaction = null;
        if (viewerId) {
            const liked =
                Array.isArray(cAny.likes) && cAny.likes.length > 0;
            const unliked =
                Array.isArray(cAny.unlikes) && cAny.unlikes.length > 0;

            if (liked) cUserReaction = "LIKE";
            else if (unliked) cUserReaction = "UNLIKE";
        }

        // Responses con reacciones
        const responsesWithReactions = (c.responses ?? []).map((r) => {
            const rAny = r as any;

            const rLikes: number = rAny._count?.likes ?? 0;
            const rUnlikes: number = rAny._count?.unlikes ?? 0;

            let rUserReaction: CommentReaction = null;
            if (viewerId) {
                const liked =
                    Array.isArray(rAny.likes) && rAny.likes.length > 0;
                const unliked =
                    Array.isArray(rAny.unlikes) && rAny.unlikes.length > 0;

                if (liked) rUserReaction = "LIKE";
                else if (unliked) rUserReaction = "UNLIKE";
            }

            return {
                ...r,
                likesCount: rLikes,
                unlikesCount: rUnlikes,
                userReaction: rUserReaction,
            };
        });

        return {
            ...c,
            likesCount: cLikes,
            unlikesCount: cUnlikes,
            userReaction: cUserReaction,
            responses: responsesWithReactions,
        };
    });

    // ⭐ NUEVO: cantidad de comentarios activos (para PostCard.commentsCount)
    const commentsCount = commentsWithReactions.filter(
        (c) => (c.active ?? 1) === 1
    ).length;

    const payload = {
        ...post,
        images: imagesWithReactions,
        post_comment: commentsWithReactions,
        userData: {
            id: post.user?.id,
            name: post.user?.name,
            imageUrl: post.user?.imageUrl,
            imagePublicId: post.user?.imagePublicId,
        },
        relations,
        commentsCount, // 👈 clave para el contador en variant="card" si hicieras un listado con este endpoint
    };

    return NextResponse.json({ data: payload });
}


