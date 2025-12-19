// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function GET(
    req: NextRequest,
    // 🔴 ANTES:
    // { params }: { params: { id: string } }

    // ✅ AHORA: params es una Promise y hay que await
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const viewerId = session?.user?.id ? Number(session.user.id) : null;

    // ⬇️ acá esperamos la Promise
    const { id } = await context.params;
    const postId = Number(id);

    if (!Number.isFinite(postId)) {
        return NextResponse.json(
            { error: "ID de post inválido" },
            { status: 400 }
        );
    }

    // 1) Traer el post + user + images + comments + responses
    const post = await prisma.post.findUnique({
        where: { id: postId },
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

    if (!post) {
        return NextResponse.json(
            { error: "Post no encontrado" },
            { status: 404 }
        );
    }

    // si el post está inactivo, no lo mostramos
    if ((post.active ?? 1) !== 1) {
        return NextResponse.json(
            { error: "Post no disponible" },
            { status: 404 }
        );
    }

    // 2) relaciones viewer <-> dueño del post
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

    // isFollower (el otro te sigue) necesitaría otra query inversa
    const isFollower = false;

    // 3) reglas de visibility (igual que en last-posts)
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

    // 4) devolver el post con la misma forma que last-posts
    const payload = {
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
    };

    return NextResponse.json({ data: payload });
}

