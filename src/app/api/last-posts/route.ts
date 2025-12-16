import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";

export async function GET(req: NextRequest) {
    const session = await auth()
    console.log("session en last.posts/route.ts: ", session);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 2;
    const postsReq = await prisma.post.findMany({
        //where: { user_id: userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
    });

    const posts = postsReq.map(async (post) => {
        const images = await prisma.image.findMany({
            where: { post_id: post.id },
        });
        const user = await prisma.user.findUnique({
            where: { id: post.user_id }
        })
        let followingRel = null;
        let followedRel = null;
        let following = false;
        let isFollower = false;

        if (session) {
            followingRel = await prisma.follow.findFirst({
                where: {
                    followerId: parseInt(session.user.id),
                    followingId: post.user_id
                }
            })
            followedRel = await prisma.follow.findFirst({
                where: {
                    followerId: post.user_id,
                    followingId: parseInt(session.user.id)
                }
            })
        }

        following = !!followingRel;
        isFollower = !!followedRel;

        const relations = {
            following: following,
            isFollower: isFollower,
            isFriend: false // Luego desarrollaré la consulta pa isFriend
        }
        return {
            ...post,
            relations,
            images,
            userData: {
                id: user?.id,
                name: user?.name,
                imageUrl: user?.imageUrl,
                imagePublicId: user?.imagePublicId
            }
        };
    });

    const resolvedPosts = await Promise.all(posts);

    return NextResponse.json({ allPosts: resolvedPosts });
}