import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const postId = parseInt(searchParams.get("post_id") || "0", 10);
    //const page = parseInt(searchParams.get("page") || "1", 10);
    //const pageSize = 2;
    console.log("postId: ", postId);
    if (!postId) {
        return NextResponse.json({ error: "post_id is required" }, { status: 400 });
    }

    const post = await prisma.post.findFirst({
        where: { id: postId },
    });
    const images = await prisma.image.findMany({
        where: { post_id: postId },
    })
    /*
        const postImages = posts.map(async (post) => {
            const images = await prisma.image.findMany({
                where: { post_id: post.id, post_user_id: post.user_id },
            });
            return { ...post, images };
        });
    */

    return NextResponse.json({
        post: post,
        images: images
    });

}