// src/app/api/last-posts-friends/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "There is not session" },
            { status: 401 }
        );
    }

    const viewerId = Number(session.user.id);

    if (!Number.isFinite(viewerId)) {
        return NextResponse.json(
            { error: "Invalid session user id" },
            { status: 400 }
        );
    }

    const { searchParams } = new URL(req.url);
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const pageSize = 2;

    // La tabla Friendship guarda la relación entre dos usuarios.
    // Tomamos ambas direcciones y deduplicamos IDs para no depender de
    // cómo haya sido creada históricamente cada amistad.
    const friendships = await prisma.friendship.findMany({
        where: {
            friend_request: 1,
            friend_response: 1,
            OR: [
                { friend_one: viewerId },
                { friend_two: viewerId },
            ],
        },
        select: {
            friend_one: true,
            friend_two: true,
        },
    });

    const friendIds = Array.from(
        new Set(
            friendships
                .map((friendship) =>
                    friendship.friend_one === viewerId
                        ? friendship.friend_two
                        : friendship.friend_one
                )
                .filter((id) => id !== viewerId)
        )
    );

    if (friendIds.length === 0) {
        return NextResponse.json({ allPosts: [] });
    }

    const postsReq = await prisma.post.findMany({
        where: {
            authorId: {
                in: friendIds,
            },
            active: 1,
        },
        orderBy: {
            createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            author: true,
            images: true,
        },
    });

    const resolvedPosts = await Promise.all(
        postsReq.map(async (post) => {
            const [followingRel, followedRel] = await Promise.all([
                prisma.follow.findFirst({
                    where: {
                        followerId: viewerId,
                        followingId: post.authorId,
                    },
                }),
                prisma.follow.findFirst({
                    where: {
                        followerId: post.authorId,
                        followingId: viewerId,
                    },
                }),
            ]);

            const relations = {
                following: Boolean(followingRel),
                isFollower: Boolean(followedRel),
                isFriend: true,
            };

            // El schema actual llama `author` a la relación de Post con User.
            // Conservamos `user` en la respuesta para no romper el contrato
            // histórico de este endpoint.
            const { author, ...postData } = post;

            return {
                ...postData,
                user: author,
                relations,
                userData: {
                    id: author.id,
                    name: author.name,
                    imageUrl: author.imageUrl,
                    imagePublicId: author.imagePublicId,
                },
            };
        })
    );

    return NextResponse.json({ allPosts: resolvedPosts });
}
