// src/app/api/user-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

import { shapePost } from "@/lib/shape-post";
import { getSocialRelations } from "@/lib/social-relations";

export async function GET(req: NextRequest) {
    const session = await auth();
    const viewerId =
        session?.user?.id != null ? Number(session.user.id) : null;

    const { searchParams } = new URL(req.url);

    const userIdStr = searchParams.get("user_id");
    const userId = userIdStr ? Number(userIdStr) : 0;

    const pageStr = searchParams.get("page");
    const page = pageStr ? Number(pageStr) : 1;

    const pageSize = 2;

    if (!userId || Number.isNaN(userId)) {
        return NextResponse.json(
            { error: "user_id is required" },
            { status: 400 }
        );
    }

    const posts = await prisma.post.findMany({
        where: {
            user_id: userId,
            deletedAt: null,
            active: 1,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            images: {
                orderBy: { index: "asc" },
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
            post_comment: {
                where: { active: 1 },
                select: { id: true },
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

    const social = await getSocialRelations(viewerId, userId, prisma);

    const shaped: Post[] = posts.map((post) =>
        shapePost(post, social)
    );

    return NextResponse.json({ allPosts: shaped });
}
