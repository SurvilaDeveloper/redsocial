// app/api/last-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

import { shapePost } from "@/lib/shape-post";
import { canViewPost } from "@/lib/post-visibility";
import { getSocialRelations } from "@/lib/social-relations";

export async function GET(req: NextRequest) {
    const session = await auth();
    const viewerId = session?.user?.id ? Number(session.user.id) : null;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);

    const pageSize = 4;
    const CHUNK_SIZE = 20;
    const MAX_LOOPS = 5;

    let skip = (page - 1) * pageSize;
    const results: Post[] = [];

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

        for (const post of chunk) {
            if ((post.active ?? 1) !== 1) continue;

            const ownerId = post.user_id;

            const social = await getSocialRelations(
                viewerId,
                ownerId,
                prisma
            );

            const canView = canViewPost(
                (post.visibility ?? 1) as PostVisibility,
                {
                    isOwner: viewerId === ownerId,
                    isLogged: viewerId !== null,
                    isFriend: social.relState === 8,
                    following: social.following,
                }
            );

            if (!canView) continue;

            results.push(shapePost(post, social));

            if (results.length >= pageSize) break;
        }
    }

    return NextResponse.json({ allPosts: results });
}


