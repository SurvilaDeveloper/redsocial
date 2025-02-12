import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get("user_id") || "0", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 2;

    if (!userId) {
        return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const posts = await prisma.post.findMany({
        where: { user_id: userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
    });

    const postImages = posts.map(async (post) => {
        const images = await prisma.image.findMany({
            where: { post_id: post.id, post_user_id: post.user_id },
        });
        return { ...post, images };
    });

    const resolvedPosts = await Promise.all(postImages);

    return NextResponse.json({ postImages: resolvedPosts });

}
