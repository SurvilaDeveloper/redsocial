// app/api/post/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import auth from "@/auth";
import type { PostNoViewReason } from "@/types/post-api";


export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const postId = Number(searchParams.get("post_id") ?? 0);
        if (!postId) {
            return NextResponse.json({ error: "post_id is required" }, { status: 400 });
        }

        const session = await auth();
        const viewerId = session?.user?.id ? Number(session.user.id) : null;

        // ✅ 1 query: post + images (ordenadas)
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                images: {
                    where: { active: 1 },
                    orderBy: { index: "asc" },
                },
            },
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const ownerId = post.user_id;
        const isLogged = viewerId !== null;
        const isOwner = isLogged && viewerId === ownerId;

        const visibility = post.visibility ?? 1;
        const isActive = (post.active ?? 1) === 1;

        // ✅ 0) Si está oculto y no es dueño: no lo ve nadie
        if (!isActive && !isOwner) {
            const relations = { isFriend: false, isFollower: false, isOwner, isLogged };

            return NextResponse.json({
                id: post.id,
                title: post.title,
                createdAt: post.createdAt,
                visibility,
                active: post.active,
                user_id: post.user_id,
                relations,
                canView: false,
                reason: "post_hidden",
            });
        }

        // ✅ 1) relaciones solo si hace falta
        let isFollower = false;
        let isFriend = false;

        const needsRelations = (visibility === 3 || visibility === 4) && isLogged && !isOwner;

        if (needsRelations) {
            const [follow, friendship] = await Promise.all([
                prisma.follow.findUnique({
                    where: { followerId_followingId: { followerId: viewerId!, followingId: ownerId } },
                    select: { id: true },
                }),
                prisma.friendship.findFirst({
                    where: {
                        friend_response: 1,
                        OR: [
                            { friend_one: viewerId!, friend_two: ownerId },
                            { friend_one: ownerId, friend_two: viewerId! },
                        ],
                    },
                    select: { id: true },
                }),
            ]);

            isFollower = Boolean(follow);
            isFriend = Boolean(friendship);
        }

        // ✅ 2) permisos por visibility
        let canView = false;
        let reason: PostNoViewReason = "invalid_visibility";

        if (isOwner) {
            canView = true;
            reason = "invalid_visibility"; // no se usa porque canView=true
        } else if (visibility === 1) {
            canView = true;
        } else if (visibility === 2) {
            canView = isLogged;
            reason = "login_required";
        } else if (visibility === 3) {
            canView = isLogged && (isFollower || isFriend);
            reason = "followers_or_friends_only";
        } else if (visibility === 4) {
            canView = isLogged && isFriend;
            reason = "friends_only";
        }

        const relations = { isFriend, isFollower, isOwner, isLogged };

        if (!canView) {
            return NextResponse.json({
                id: post.id,
                title: post.title,
                createdAt: post.createdAt,
                visibility,
                active: post.active,
                user_id: post.user_id,
                relations,
                canView: false,
                reason,
            });
        }

        return NextResponse.json({
            ...post,
            visibility,
            relations,
            canView: true,
            reason: null,
        });

    } catch (e: any) {
        console.error("GET /api/post error:", e);
        return NextResponse.json({ error: e?.message ?? "Internal Server Error" }, { status: 500 });
    }
}


