// src/app/(pages)/showPostCard/page.tsx
import { notFound } from "next/navigation";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/custom/postCard";

type PageSearchParams = {
    post_id?: string;
};

type PageProps = {
    // 👇 Ahora searchParams es una PROMESA
    searchParams: Promise<PageSearchParams>;
};

export default async function ShowPostCardPage({ searchParams }: PageProps) {
    const session = await auth();

    // ✅ Hay que resolver la promesa ANTES de usar post_id
    const resolvedSearchParams = await searchParams;
    const idParam = resolvedSearchParams.post_id;

    const postId = Number(idParam);
    if (!Number.isFinite(postId)) {
        notFound();
    }

    const viewerId = session?.user?.id ? Number(session.user.id) : null;

    // 1) Traemos el post con todo lo necesario
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            images: {
                where: { active: 1 },
                orderBy: { index: "asc" },
                include: {
                    image_like: true,
                    image_unlike: true,
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
            post_like: true,
            post_unlike: true,
        },
    });

    if (!post || (post.active ?? 1) !== 1) {
        notFound();
    }

    const ownerId = post.user_id;

    // 2) relaciones viewer <-> owner (igual que en /api/posts/[id])
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
        isFriend = viewerFriends.length > 0;
    }

    const isFollower = false; // si luego querés, lo podés calcular con otra query inversa

    // 3) reglas de visibility
    let canView = false;
    if (isOwner) canView = true;
    else if (post.visibility === 1) canView = true;
    else if (post.visibility === 2) canView = isLogged;
    else if (post.visibility === 3) canView = isLogged && (isFriend || following);
    else if (post.visibility === 4) canView = isLogged && isFriend;

    if (!canView) {
        notFound();
    }

    // 4) likes/unlikes del post
    const postLikesCount = post.post_like.length;
    const postUnlikesCount = post.post_unlike.length;

    let postUserReaction: PostReaction = null;
    if (viewerId) {
        if (post.post_like.some((pl) => pl.userId === viewerId)) {
            postUserReaction = "LIKE";
        } else if (post.post_unlike.some((pu) => pu.userId === viewerId)) {
            postUserReaction = "UNLIKE";
        }
    }

    // 5) imágenes con sus likes/unlikes + reacción del usuario
    const imagesWithReactions = post.images.map((img) => {
        const likes = img.image_like.length;
        const unlikes = img.image_unlike.length;

        let imgReaction: "LIKE" | "UNLIKE" | null = null;
        if (viewerId) {
            if (img.image_like.some((l) => l.userId === viewerId)) {
                imgReaction = "LIKE";
            } else if (img.image_unlike.some((u) => u.userId === viewerId)) {
                imgReaction = "UNLIKE";
            }
        }

        const { image_like, image_unlike, ...rest } = img;

        return {
            ...rest,
            likesCount: likes,
            unlikesCount: unlikes,
            userReaction: imgReaction,
        };
    });

    // 6) armamos el objeto Post que espera el front (global.d.ts)
    const payload: Post = {
        id: post.id,
        user_id: post.user_id,

        title: post.title,
        description: post.description,

        imagenumber: post.imagenumber,
        createdAt: post.createdAt?.toISOString() ?? new Date().toISOString(),

        active: post.active ?? 1,
        visibility: (post.visibility ?? 1) as PostVisibility,

        relations: {
            following,
            isFollower,
            isFriend,
            likesCount: postLikesCount,
            unlikesCount: postUnlikesCount,
            userReaction: postUserReaction,
        },

        userData: {
            id: post.user?.id,
            name: post.user?.name ?? "",
            imageUrl: post.user?.imageUrl ?? null,
            imagePublicId: post.user?.imagePublicId ?? null,
        },

        images: imagesWithReactions,

        post_comment: post.post_comment.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            user: c.user
                ? {
                    id: c.user.id,
                    name: c.user.name,
                    imageUrl: c.user.imageUrl,
                }
                : undefined,
            responses: c.responses.map((r) => ({
                ...r,
                createdAt: r.createdAt.toISOString(),
                user: r.user
                    ? {
                        id: r.user.id,
                        name: r.user.name,
                        imageUrl: r.user.imageUrl,
                    }
                    : undefined,
            })),
        })),
    } as any;

    // 7) Render: usamos PostCard en modo detalle (2 columnas)
    return (
        <div className="showPostCardPage">
            <div className="showPostCardContainer">
                <PostCard
                    session={session}
                    post={payload}
                    variant="detail"
                    openCommentsInPage={false}
                />
            </div>
        </div>
    );
}


