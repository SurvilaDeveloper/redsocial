// src/app/api/wall-entry/share-targets/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewerSeePost } from "@/lib/posts/can-view-post";
import { canUserShareToWall } from "@/lib/wall-entry-share-policy";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const session = await auth();
    const actorUserId = session?.user?.id ? Number(session.user.id) : null;

    if (!actorUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const postId = Number(searchParams.get("postId"));
    const rawLimit = Number(searchParams.get("limit") ?? 30);
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 30, 1), 50);

    if (!Number.isFinite(postId) || postId <= 0) {
        return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
    }

    if (q.length === 1) {
        return NextResponse.json({ users: [] });
    }

    const post = await prisma.post.findFirst({
        where: {
            id: postId,
            active: 1,
            deletedAt: null,
        },
        select: {
            id: true,
            authorId: true,
            visibility: true,
        },
    });

    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const actorCanView = await canViewerSeePost(prisma, actorUserId, {
        authorId: post.authorId,
        visibility: post.visibility as PostVisibility,
    });

    if (!actorCanView) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let candidateIds: number[] | null = null;

    // Sin búsqueda mostramos primero los amigos aceptados.
    if (q.length === 0) {
        const friendships = await prisma.friendship.findMany({
            where: {
                friend_request: 1,
                friend_response: 1,
                OR: [
                    { friend_one: actorUserId },
                    { friend_two: actorUserId },
                ],
            },
            select: {
                friend_one: true,
                friend_two: true,
            },
            take: 500,
        });

        candidateIds = Array.from(
            new Set(
                friendships
                    .map((row) =>
                        row.friend_one === actorUserId
                            ? row.friend_two
                            : row.friend_one
                    )
                    .filter((id) => id !== actorUserId)
            )
        );

        if (candidateIds.length === 0) {
            return NextResponse.json({ users: [] });
        }
    }

    const users = await prisma.user.findMany({
        where: {
            active: 1,
            deletedAt: null,
            id: {
                not: actorUserId,
                ...(candidateIds ? { in: candidateIds } : {}),
            },
            ...(q.length >= 2
                ? {
                    OR: [
                        { name: { contains: q } },
                        { nick: { contains: q } },
                    ],
                }
                : {}),
        },
        select: {
            id: true,
            name: true,
            nick: true,
            imageUrl: true,
            image: true,
        },
        orderBy: {
            name: "asc",
        },
        take: limit,
    });

    const eligible = (
        await Promise.all(
            users.map(async (user) => {
                const [shareAllowed, targetCanView] = await Promise.all([
                    canUserShareToWall(actorUserId, user.id),
                    canViewerSeePost(prisma, user.id, {
                        authorId: post.authorId,
                        visibility: post.visibility as PostVisibility,
                    }),
                ]);

                return shareAllowed && targetCanView ? user : null;
            })
        )
    ).filter((user): user is NonNullable<typeof user> => user != null);

    return NextResponse.json({ users: eligible });
}
